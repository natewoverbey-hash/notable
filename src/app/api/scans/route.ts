import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { queryAllLLMs, parseAgentMention, renderPrompt } from '@/lib/llm'
import prompts from '@/lib/prompts/real-estate.json'

export async function POST(request: Request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { agentId } = body

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 })
    }

    // Get the agent
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Create a scan batch
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('scan_batches')
      .insert({
        workspace_id: agent.workspace_id,
        agent_id: agentId,
        status: 'running',
        prompts_total: prompts.prompts.length,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (batchError) {
      console.error('Error creating batch:', batchError)
      return NextResponse.json({ error: 'Failed to create scan batch' }, { status: 500 })
    }

    // Prepare variables for prompt rendering
    const variables = {
      city: agent.city,
      state: agent.state,
      agent_name: agent.name,
      brokerage: agent.brokerage || '',
      neighborhood: agent.neighborhoods?.[0] || agent.city,
      county: `${agent.city} County`, // Simplified
      zip_code: agent.zip_codes?.[0] || '',
      school_district: agent.city,
      subdivision: agent.neighborhoods?.[0] || agent.city,
      competitor_name: '', // TODO: Get from competitors
    }

    // Run scans for a subset of prompts (to start)
    // In production, this would be queued and processed by a worker
    const promptsToRun = prompts.prompts.slice(0, 10) // Start with first 10
    const providers = ['chatgpt', 'claude', 'gemini'] as const

    let completed = 0
    const results = []

    for (const prompt of promptsToRun) {
      const renderedPrompt = renderPrompt(prompt.template, variables)
      
      // Query all LLM providers
      const responses = await queryAllLLMs(renderedPrompt, [...providers])
      
      for (const response of responses) {
        // Parse the response to check if agent was mentioned
        const mention = parseAgentMention(response.response, agent.name)
        
        // Save the scan result
        const { data: scan, error: scanError } = await supabaseAdmin
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
            latency_ms: response.latencyMs,
            error_message: response.error,
          })
          .select()
          .single()

        if (!scanError) {
          results.push(scan)
        }
      }

      completed++
      
      // Update batch progress
      await supabaseAdmin
        .from('scan_batches')
        .update({ prompts_completed: completed })
        .eq('id', batch.id)
    }

    // Calculate visibility score
    const totalScans = results.length
    const mentionedScans = results.filter(r => r.mentioned).length
    const visibilityScore = totalScans > 0 
      ? Math.round((mentionedScans / totalScans) * 100)
      : 0

    // Update batch as completed
    await supabaseAdmin
      .from('scan_batches')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', batch.id)

    // Update agent's visibility score
    await supabaseAdmin
      .from('agents')
      .update({ 
        visibility_score: visibilityScore,
        last_scanned_at: new Date().toISOString(),
      })
      .eq('id', agentId)

    // Save to visibility_scores for trending
    await supabaseAdmin
      .from('visibility_scores')
      .insert({
        agent_id: agentId,
        overall_score: visibilityScore,
        prompts_checked: promptsToRun.length,
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
