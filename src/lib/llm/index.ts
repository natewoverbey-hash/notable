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
  
  // Words/phrases that are NOT competitor names
  const falsePositives = [
    'online platforms', 'google reviews', 'local recommendations', 'open houses',
    'brokerage websites', 'local publications', 'local real estate', 'professional organizations',
    'social media', 'word of mouth', 'local community', 'other notable', 'other agents',
    'real estate agencies', 'online reviews', 'local forums', 'community boards',
    'zillow', 'realtor.com', 'redfin', 'yelp', 'facebook', 'linkedin', 'google',
    'charleston trident association', 'national association', 'mls data',
    'note:', 'disclaimer', 'important', 'contact', 'recommended', 'steps to find',
    'ways to find', 'methods', 'tips', 'suggestions'
  ]
  
  // Common real estate brokerages (to extract but mark as brokerage, not agent)
  const knownBrokerages = [
    'keller williams', 'coldwell banker', 'carolina one', 're/max', 'remax',
    'century 21', 'berkshire hathaway', 'sotheby', 'compass', 'exp realty',
    'the cassina group', 'dunes properties', 'engel & völkers', 'engel and volkers'
  ]
  
  let rank = 1
  
  // Pattern 1: Bold names like **First Last** (most reliable for Perplexity)
  const boldPattern = /\*\*([A-Z][a-z]+(?:\s[A-Z][a-z']+)+)\*\*/g
  let match
  
  while ((match = boldPattern.exec(response)) !== null) {
    const name = match[1].trim()
    const lowerName = name.toLowerCase()
    
    // Skip if it's our agent
    if (lowerName.includes(lowerExclude) || lowerExclude.includes(lowerName)) continue
    
    // Skip false positives
    if (falsePositives.some(fp => lowerName.includes(fp) || fp.includes(lowerName))) continue
    
    // Skip if it's just a brokerage name (no person name)
    if (knownBrokerages.some(b => lowerName === b)) continue
    
    // Skip if contains certain words that indicate it's not a person
    if (/\b(team|group|realty|real estate|properties|homes|inc|llc|company|association|organization|platform|website|review)\b/i.test(name)) continue
    
    // Must look like a person's name (2-3 words, no numbers)
    const words = name.split(' ')
    if (words.length < 2 || words.length > 4) continue
    if (/\d/.test(name)) continue
    
    // Check if already added
    if (!competitors.find(c => c.name.toLowerCase() === lowerName)) {
      competitors.push({ name, rank })
      rank++
    }
  }
  
  // Pattern 2: "Name of/at/with Brokerage" pattern
  const agentBrokeragePattern = /([A-Z][a-z]+\s[A-Z][a-z']+(?:\s[A-Z][a-z']+)?)\s*(?:of|at|with|,)\s*(?:The\s)?([A-Z][a-z]+(?:\s[A-Z][a-z]+)*(?:\s(?:Real Estate|Realty|Properties|Group|Team))?)/g
  
  while ((match = agentBrokeragePattern.exec(response)) !== null) {
    const name = match[1].trim()
    const lowerName = name.toLowerCase()
    
    // Same validations
    if (lowerName.includes(lowerExclude) || lowerExclude.includes(lowerName)) continue
    if (falsePositives.some(fp => lowerName.includes(fp))) continue
    if (/\b(team|group|realty|real estate|properties)\b/i.test(name)) continue
    
    const words = name.split(' ')
    if (words.length < 2 || words.length > 4) continue
    if (/\d/.test(name)) continue
    
    if (!competitors.find(c => c.name.toLowerCase() === lowerName)) {
      competitors.push({ name, rank })
      rank++
    }
  }
  
  return competitors.slice(0, 10)
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
