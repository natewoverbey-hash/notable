import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { queryAllLLMs, parseAgentMention, renderPrompt } from '@/lib/llm'
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

/**
 * Filter prompts based on agent's specialties
 */
function filterPromptsForAgent(
  allPrompts: Prompt[],
  agentPropertyTypes: string[],
  agentBuyerTypes: string[]
): Prompt[] {
  return allPrompts.filter(prompt => {
    // Always include general prompts
    if (prompt.is_general) {
      return true
    }

    // Include if agent has matching property type
    if (prompt.property_types && prompt.property_types.length > 0) {
      const hasMatchingPropertyType = prompt.property_types.some(pt => 
        agentPropertyTypes.includes(pt)
      )
      if (hasMatchingPropertyType) {
        return true
      }
    }

    // Include if agent has matching buyer type
    if (prompt.buyer_types && prompt.buyer_types.length > 0) {
      const hasMatchingBuyerType = prompt.buyer_types.some(bt => 
        agentBuyerTypes.includes(bt)
      )
      if (hasMatchingBuyerType) {
        return true
      }
    }

    // Exclude specialty prompts that don't match agent's focus
    return false
  })
}

/**
 * Format luxury threshold for prompt rendering
 */
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

    // Filter prompts based on agent's specialties
    const agentPropertyTypes = agent.property_types || []
    const agentBuyerTypes = agent.buyer_types || []
    const filteredPrompts = filterPromptsForAgent(
      prompts.prompts as Prompt[],
      agentPropertyTypes,
      agentBuyerTypes
    )

    console.log(`Agent ${agent.name}: Running ${filteredPrompts.length} prompts (filtered from ${prompts.prompts.length})`)
    console.log(`Property types: ${agentPropertyTypes.join(', ') || 'none'}`)
    console.log(`Buyer types: ${agentBuyerTypes.join(', ') || 'none'}`)

    // Create a scan batch
    const { data: batch, error: batchError } = await supabaseAdmin
      .fro
