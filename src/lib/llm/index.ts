import { queryOpenAI } from './openai'
import { queryAnthropic } from './anthropic'
import { queryGemini } from './gemini'
import { queryPerplexity } from './perplexity'

export type LLMProvider = 'chatgpt' | 'claude' | 'gemini' | 'perplexity'

export interface LLMResponse {
  provider: LLMProvider
  model: string
  response: string
  tokens: number
  latencyMs: number
  error?: string
}

export interface ParsedMention {
  mentioned: boolean
  rank: number | null
  context: string | null
  sentiment: 'positive' | 'neutral' | 'negative' | null
  competitorsMentioned: Array<{ name: string; rank: number }>
}

/**
 * Query a specific LLM provider
 */
export async function queryLLM(
  provider: LLMProvider,
  prompt: string
): Promise<LLMResponse> {
  const startTime = Date.now()
  
  try {
    switch (provider) {
      case 'chatgpt':
        return queryOpenAI(prompt)
      case 'claude':
        return queryAnthropic(prompt) as Promise<LLMResponse>
      case 'gemini':
        return queryGemini(prompt) as Promise<LLMResponse>
      case 'perplexity':
        const response = await queryPerplexity(prompt)
        return {
          provider: 'perplexity',
          model: 'sonar',
          response,
          tokens: 0,
          latencyMs: Date.now() - startTime,
        }
      default:
        throw new Error(`Unknown LLM provider: ${provider}`)
    }
  } catch (error) {
    return {
      provider,
      model: 'unknown',
      response: '',
      tokens: 0,
      latencyMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Query all configured LLM providers in parallel
 */
export async function queryAllLLMs(
  prompt: string,
  providers: LLMProvider[] = ['chatgpt', 'claude', 'gemini', 'perplexity']
): Promise<LLMResponse[]> {
  const queries = providers.map(provider => queryLLM(provider, prompt))
  return Promise.all(queries)
}

/**
 * Parse an LLM response to check if a specific agent was mentioned
 */
/**
 * Parse an LLM response to check if a specific agent was mentioned
 */
export function parseAgentMention(
  response: string,
  agentName: string
): ParsedMention {
  const lowerResponse = response.toLowerCase()
  const lowerAgentName = agentName.toLowerCase()
  
  // Check if agent is mentioned
  const mentioned = lowerResponse.includes(lowerAgentName)
  
  // Extract competitors from the response
  const competitors = extractCompetitors(response, agentName)
  
  if (!mentioned) {
    return {
      mentioned: false,
      rank: null,
      context: null,
      sentiment: null,
      competitorsMentioned: competitors,
    }
  }
  
  // Find the context around the mention
  const index = lowerResponse.indexOf(lowerAgentName)
  const start = Math.max(0, index - 100)
  const end = Math.min(response.length, index + agentName.length + 100)
  const context = response.slice(start, end)
  
  // Simple sentiment analysis based on surrounding words
  const positiveWords = ['best', 'top', 'excellent', 'recommended', 'highly', 'great', 'outstanding', 'premier', 'expert', 'trusted', 'stands out', 'deep expertise', 'notable', 'leading']
  const negativeWords = ['avoid', 'not recommended', 'issues', 'problems', 'complaints']
  
  const contextLower = context.toLowerCase()
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
  
  if (positiveWords.some(word => contextLower.includes(word))) {
    sentiment = 'positive'
  } else if (negativeWords.some(word => contextLower.includes(word))) {
    sentiment = 'negative'
  }
  
  // Calculate rank based on position in response
  const beforeMention = lowerResponse.slice(0, index)
  
  // Check for numbered lists
  const numberedListMatches = beforeMention.match(/\d+\.\s/g)
  
  // Check for bullet points with names before our agent
  const bulletMatches = beforeMention.match(/[-•]\s*\*\*[^*]+\*\*/g)
  
  // Check if agent appears first (before "other" agents section)
  const otherAgentsIndex = lowerResponse.indexOf('other notable agents')
  const otherIndex = lowerResponse.indexOf('other agents')
  const alsoIndex = lowerResponse.indexOf('also include')
  
  let rank = 1
  if (numberedListMatches) {
    rank = numberedListMatches.length + 1
  } else if (bulletMatches) {
    rank = bulletMatches.length + 1
  }
  
  // If our agent appears before "other agents" section, they're likely #1
  if (otherAgentsIndex > 0 && index < otherAgentsIndex) {
    rank = 1
  } else if (otherIndex > 0 && index < otherIndex) {
    rank = 1
  } else if (alsoIndex > 0 && index < alsoIndex) {
    rank = 1
  }
  
  return {
    mentioned: true,
    rank,
    context,
    sentiment,
    competitorsMentioned: competitors,
  }
}

/**
 * Extract competitor names from LLM response
 */
function extractCompetitors(response: string, excludeAgent: string): Array<{ name: string; rank: number }> {
  const competitors: Array<{ name: string; rank: number }> = []
  const lowerExclude = excludeAgent.toLowerCase()
  
  // Pattern 1: Bold names like **Name** or **Name LastName**
  const boldPattern = /\*\*([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\*\*/g
  let match
  let rank = 1
  
  while ((match = boldPattern.exec(response)) !== null) {
    const name = match[1].trim()
    // Skip if it's our agent or contains common non-name words
    if (
      !name.toLowerCase().includes(lowerExclude) &&
      !name.toLowerCase().includes('other') &&
      !name.toLowerCase().includes('notable') &&
      !name.toLowerCase().includes('group') &&
      !name.toLowerCase().includes('team') &&
      !name.toLowerCase().includes('the cassina') &&
      name.split(' ').length >= 2 // Must have at least first and last name
    ) {
      // Check if already added
      if (!competitors.find(c => c.name.toLowerCase() === name.toLowerCase())) {
        competitors.push({ name, rank })
        rank++
      }
    }
  }
  
  // Pattern 2: Names with brokerages like "Name - Brokerage" or "Name of Brokerage"
  const brokeragePattern = /([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*(?:of|at|with|-|–)\s*(?:The\s)?([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g
  
  while ((match = brokeragePattern.exec(response)) !== null) {
    const name = match[1].trim()
    if (
      !name.toLowerCase().includes(lowerExclude) &&
      name.split(' ').length >= 2
    ) {
      if (!competitors.find(c => c.name.toLowerCase() === name.toLowerCase())) {
        competitors.push({ name, rank })
        rank++
      }
    }
  }
  
  // Pattern 3: Team names like "The X Team" or "X Group"
  const teamPattern = /(?:The\s)?([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(Team|Group|Realty|Real Estate)/g
  
  while ((match = teamPattern.exec(response)) !== null) {
    const name = match[0].trim()
    if (
      !name.toLowerCase().includes(lowerExclude) &&
      !name.toLowerCase().includes('cassina')
    ) {
      if (!competitors.find(c => c.name.toLowerCase() === name.toLowerCase())) {
        competitors.push({ name, rank })
        rank++
      }
    }
  }
  
  return competitors.slice(0, 10) // Limit to top 10 competitors
}
/**
 * Fill in variables in a prompt template
 */
export function renderPrompt(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  return rendered
}
