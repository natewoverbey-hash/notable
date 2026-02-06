import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserSubscription, canRunScans } from '@/lib/subscription'
import { queryLLM, parseAgentMention, renderPrompt, LLMProvider } from '@/lib/llm'
import prompts from '@/lib/prompts/real-estate.json'

interface Prompt {
  id: number
  category: string
  template: string
  variables: string[]
  intent: string
  property_types: string[]
  buyer_types: string[]
  is_general: boolean
}

function filterPromptsForAgent(
  allPrompts: Prompt[],
  agentPropertyTypes: string[],
  agentBuyerTypes: string[]
): Prompt[] {
  return allPrompts.filter(prompt => {
    if (prompt.is_general) {
      return true
    }
    if (prompt.property_types && prompt.property_types.length > 0) {
      const hasMatchingPropertyType = prompt.property_types.some(pt => 
        agentPropertyTypes.includes(pt)
      )
      if (hasMatchingPropertyType) {
        return true
      }
    }
    if (prompt.buyer_types && prompt.buyer_types.length > 0) {
      const hasMatchingBuyerType = prompt.buyer_types.some(bt => 
        agentBuyerTypes.includes(bt)
      )
      if (hasMatchingBuyerType) {
        return true
      }
    }
    return false
  })
}

function formatLuxuryThreshold(threshold: number): string {
  if (threshold >= 1000000) {
    return `$${threshold / 1000000}M`
  }
  return `$${threshold / 1000}K`
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await getUserSubscription(userId)
    if (!canRunScans(subscription)) {
      return NextResponse.json(
        { error: 'You\'ve used your free scan. Upgrade to run more scans.', requiresUpgrade: true },
        { status: 403 }
      )
    }

    if (!subscription.isActive && !subscription.hasUsedFreeScan) {
      await supabaseAdmin
        .from('users')
        .update({ has_used_free_scan: true })
        .eq('clerk_user_id', userId)
    }

    const body = await request.json()
    const { agentId } = body

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 })
    }

    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const agentPropertyTypes = agent.property_types || []
    const agentBuyerTypes = agent.buyer_types || []
    const filteredPrompts = filterPromptsForAgent(
      prompts.prompts as Prompt[],
      agentPropertyTypes,
      agentBuyerTypes
    )

    const { data: batch, error: batchError } = await supabaseAdmin
      .from('scan_batches')
      .insert({
        workspace_id: agent.workspace_id,
        agent_id: agentId,
        status: 'running',
        prompts_total: filteredPrompts.length,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (batchError) {
      return NextResponse.json({ error: 'Failed to create scan batch' }, { status: 500 })
    }

    const variables: Record<string, string> = {
      city: agent.city,
      state: agent.state,
      agent_name: agent.name,
      brokerage: agent.brokerage || '',
      neighborhood: agent.neighborhoods?.[0] || agent.city,
      county: `${agent.city} County`,
      zip_code: agent.zip_codes?.[0] || '',
      school_district: agent.city,
      subdivision: agent.neighborhoods?.[0] || agent.city,
      competitor_name: '',
      luxury_threshold: formatLuxuryThreshold(agent.luxury_threshold || 1000000),
    }

    const providers: LLMProvider[] = ['chatgpt', 'gemini', 'perplexity', 'grok']
    const results: any[] = []

    // Process ALL prompts and providers in parallel
    const allTasks: Promise<void>[] = []

    for (const prompt of filteredPrompts) {
      const renderedPrompt = renderPrompt(prompt.template, variables)
      
      for (const provider of providers) {
        const task = (async () => {
          try {
            const response = await queryLLM(provider, renderedPrompt)
            const mention = parseAgentMention(response.response, agent.name)
            
            const { data: scan } = await supabaseAdmin
              .from('scans')
              .insert({
                batch_id: batch.id,
                agent_id: agentId,
                prompt_id: prompt.id,
                prompt_rendered: renderedPrompt,
                llm_provider: response.provider,
                llm_model: response.model,
                response_raw: response.response,
                response_tokens: response.tokens,
                mentioned: mention.mentioned,
                mention_rank: mention.rank,
                mention_context: mention.context,
                sentiment: mention.sentiment,
                competitors_mentioned: mention.competitorsMentioned,
                sources_cited: mention.sourcesCited,
                latency_ms: response.latencyMs,
                error_message: response.error,
              })
              .select()
              .single()

            if (scan) {
              results.push(scan)
            }
          } catch (err) {
            console.error(`Error with ${provider}:`, err)
          }
        })()
        
        allTasks.push(task)
      }
    }

    // Wait for all tasks to complete
    await Promise.all(allTasks)

    const totalScans = results.length
    const mentionedScans = results.filter(r => r.mentioned).length
    const visibilityScore = totalScans > 0 
      ? Math.round((mentionedScans / totalScans) * 100)
      : 0

    await supabaseAdmin
      .from('scan_batches')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        prompts_completed: filteredPrompts.length,
      })
      .eq('id', batch.id)

    await supabaseAdmin
      .from('agents')
      .update({ 
        visibility_score: visibilityScore,
        last_scanned_at: new Date().toISOString(),
      })
      .eq('id', agentId)

    await supabaseAdmin
      .from('visibility_scores')
      .insert({
        agent_id: agentId,
        overall_score: visibilityScore,
        prompts_checked: filteredPrompts.length,
        prompts_mentioned: mentionedScans,
      })

    return NextResponse.json({ 
      batch,
      visibilityScore,
      scansCompleted: results.length,
      mentions: mentionedScans,
    })
  } catch (error) {
    console.error('Error in POST /api/scans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
