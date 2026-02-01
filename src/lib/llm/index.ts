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
export function parseAgentMention(
  response: string,
  agentName: string
): ParsedMention {
  const lowerResponse = response.toLowerCase()
  const lowerAgentName = agentName.toLowerCase()
  
  // Check if agent is mentioned
  const mentioned = lowerResponse.includes(lowerAgentName)
  
  if (!mentioned) {
    return {
      mentioned: false,
      rank: null,
      context: null,
      sentiment: null,
      competitorsMentioned: [],
    }
  }
  
  // Find the context around the mention
  const index = lowerResponse.indexOf(lowerAgentName)
  const start = Math.max(0, index - 100)
  const end = Math.min(response.length, index + agentName.length + 100)
  const context = response.slice(start, end)
  
  // Simple sentiment analysis based on surrounding words
  const positiveWords = ['best', 'top', 'excellent', 'recommended', 'highly', 'great', 'outstanding', 'premier', 'expert', 'trusted']
  const negativeWords = ['avoid', 'not recommended', 'issues', 'problems', 'complaints']
  
  const contextLower = context.toLowerCase()
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
  
  if (positiveWords.some(word => contextLower.includes(word))) {
    sentiment = 'positive'
  } else if (negativeWords.some(word => contextLower.includes(word))) {
    sentiment = 'negative'
  }
  
  // Calculate rank (simple: count how many names appear before this one)
  const beforeMention = lowerResponse.slice(0, index)
  const numberedListMatches = beforeMention.match(/\d+\./g)
  const rank = numberedListMatches ? numberedListMatches.length + 1 : 1
  
  return {
    mentioned: true,
    rank,
    context,
    sentiment,
    competitorsMentioned: [],
  }
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
