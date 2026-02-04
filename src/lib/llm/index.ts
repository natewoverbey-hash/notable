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
  
  // Words/phrases that are NOT competitor names - expanded list
  const falsePositives = [
    // Generic terms
    'online platforms', 'google reviews', 'local recommendations', 'open houses',
    'brokerage websites', 'local publications', 'local real estate', 'professional organizations',
    'social media', 'word of mouth', 'local community', 'other notable', 'other agents',
    'real estate agencies', 'online reviews', 'local forums', 'community boards',
    'note:', 'disclaimer', 'important', 'contact', 'recommended', 'steps to find',
    'ways to find', 'methods', 'tips', 'suggestions', 'neighborhood knowledge',
    'local listings', 'community involvement', 'interview potential', 'local real estate',
    // Websites/platforms
    'zillow', 'realtor.com', 'redfin', 'yelp', 'facebook', 'linkedin', 'google',
    'charleston trident association', 'national association', 'mls data',
    // Neighborhoods and locations
    'old village', 'old mount pleasant', 'mount pleasant', 'charleston', 'daniel island',
    'sullivans island', "sullivan's island", 'isle of palms', 'james island', 'johns island', 
    'west ashley', 'north charleston', 'park west', 'dunes west', 'rivertowne',
    'shem creek', 'i\'on', 'ion', 'belle hall', 'snee farm', 'seaside farms',
    'adgers wharf', 'broad st', 'broad street', 'bay st', 'bay street',
    'fulton hall', 'queensborough', 'coleman blvd', 'johnnie dodds',
    'long point', 'highway 17', 'hwy 17', 'king street', 'meeting street',
    'granary square', 'central park',
    // Generic real estate terms
    'networking events', 'open house', 'local agents', 'top agents', 'best agents',
    'real estate', 'luxury homes', 'waterfront', 'historic homes', 'local experts',
    'client testimonials', 'search results', 'available data', 'current listings',
    'professional associations', 'referrals'
  ]
  
  // Common real estate brokerages - these should be INCLUDED in competitors when part of a team name
  const knownBrokerages = [
    'keller williams', 'coldwell banker', 'carolina one', 're/max', 'remax',
    'century 21', 'berkshire hathaway', 'sotheby', 'compass', 'exp realty',
    'the cassina group', 'cassina group', 'dunes properties', 'engel & völkers', 
    'engel and volkers', 'william means', 'handsome properties', 'agentowned',
    'carolina elite', 'charleston premier', 'the boulevard company'
  ]

  // Patterns that indicate this is NOT a person's name
  const notPersonPatterns = [
    /\b(team|group|realty|real estate|properties|homes|inc|llc|company|association|organization|platform|website|review|office|agency)\b/i,
    /\b(rd|road|st|street|ave|avenue|blvd|boulevard|dr|drive|ln|lane|ct|court|way|cir|circle|pl|place|hwy|highway)\b/i,
    /\b(north|south|east|west|upper|lower|old|new|greater|downtown|uptown|midtown)\s+(charleston|village|mount|mt|pleasant)/i,
    /^\d+\s/,  // Starts with number (address)
    /\s#\d+/,  // Contains unit number
    /\s\d{5}/,  // Contains zip code
    /\.com|\.net|\.org/i,  // URLs
    /^(the|a|an)\s/i,  // Starts with article (likely not a person)
  ]
  
  let rank = 1
  const seen = new Set<string>()
  
  // Pattern 1: Bold names like **First Last** or **First Last of Brokerage**
  const boldPattern = /\*\*([^*]+)\*\*/g
  let match
  
  while ((match = boldPattern.exec(response)) !== null) {
    const fullMatch = match[1].trim()
    
    // Extract just the name if it includes "of Brokerage" or similar
    let name = fullMatch
    const ofMatch = fullMatch.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z']+)+?)(?:\s+(?:of|at|with|from|,|\())/i)
    if (ofMatch) {
      name = ofMatch[1].trim()
    }
    
    // Clean up the name
    name = name.replace(/\s*\([^)]*\)\s*/g, '').trim()  // Remove parentheticals
    name = name.replace(/\s*,.*$/, '').trim()  // Remove everything after comma
    
    const lowerName = name.toLowerCase()
    
    // Skip if it's our agent
    if (lowerName.includes(lowerExclude) || lowerExclude.includes(lowerName)) continue
    
    // Skip false positives
    if (falsePositives.some(fp => lowerName.includes(fp) || lowerName === fp)) continue
    
    // Skip if matches "not a person" patterns
    if (notPersonPatterns.some(pattern => pattern.test(name))) continue
    
    // Skip standalone brokerage names (but allow "Name at Brokerage")
    if (knownBrokerages.some(b => lowerName === b)) continue
    
    // Must look like a person's name: 2-4 capitalized words
    const words = name.split(/\s+/)
    if (words.length < 2 || words.length > 4) continue
    
    // Each word should start with capital letter and be reasonable length
    const looksLikeName = words.every(word => {
      return /^[A-Z][a-z']+$/.test(word) && word.length >= 2 && word.length <= 15
    })
    if (!looksLikeName) continue
    
    // Skip if contains numbers
    if (/\d/.test(name)) continue
    
    // Add if not already seen
    const normalizedName = name.toLowerCase()
    if (!seen.has(normalizedName)) {
      seen.add(normalizedName)
      competitors.push({ name, rank })
      rank++
    }
  }
  
  // Pattern 2: Names in brackets [Name](url) - common in web search results
  const bracketPattern = /\[([A-Z][a-z]+(?:\s[A-Z][a-z']+)+)\]\s*\(/g
  
  while ((match = bracketPattern.exec(response)) !== null) {
    const name = match[1].trim()
    const lowerName = name.toLowerCase()
    
    if (lowerName.includes(lowerExclude) || lowerExclude.includes(lowerName)) continue
    if (falsePositives.some(fp => lowerName.includes(fp) || lowerName === fp)) continue
    if (notPersonPatterns.some(pattern => pattern.test(name))) continue
    
    const words = name.split(/\s+/)
    if (words.length < 2 || words.length > 4) continue
    if (/\d/.test(name)) continue
    
    const normalizedName = name.toLowerCase()
    if (!seen.has(normalizedName)) {
      seen.add(normalizedName)
      competitors.push({ name, rank })
      rank++
    }
  }
  
  // Pattern 3: Numbered list items with names: "1. First Last" or "1. **First Last**"
  const numberedPattern = /\d+\.\s+\*?\*?([A-Z][a-z]+\s[A-Z][a-z']+(?:\s[A-Z][a-z']+)?)\*?\*?/g
  
  while ((match = numberedPattern.exec(response)) !== null) {
    const name = match[1].trim()
    const lowerName = name.toLowerCase()
    
    if (lowerName.includes(lowerExclude) || lowerExclude.includes(lowerName)) continue
    if (falsePositives.some(fp => lowerName.includes(fp) || lowerName === fp)) continue
    if (notPersonPatterns.some(pattern => pattern.test(name))) continue
    
    const words = name.split(/\s+/)
    if (words.length < 2 || words.length > 4) continue
    if (/\d/.test(name)) continue
    
    const normalizedName = name.toLowerCase()
    if (!seen.has(normalizedName)) {
      seen.add(normalizedName)
      competitors.push({ name, rank })
      rank++
    }
  }
  
  // Pattern 4: "Agent: First Last" or "Name: First Last" patterns
  const labeledPattern = /(?:agent|realtor|broker|name):\s*([A-Z][a-z]+\s[A-Z][a-z']+(?:\s[A-Z][a-z']+)?)/gi
  
  while ((match = labeledPattern.exec(response)) !== null) {
    const name = match[1].trim()
    const lowerName = name.toLowerCase()
    
    if (lowerName.includes(lowerExclude) || lowerExclude.includes(lowerName)) continue
    if (falsePositives.some(fp => lowerName.includes(fp) || lowerName === fp)) continue
    if (notPersonPatterns.some(pattern => pattern.test(name))) continue
    
    const words = name.split(/\s+/)
    if (words.length < 2 || words.length > 4) continue
    
    const normalizedName = name.toLowerCase()
    if (!seen.has(normalizedName)) {
      seen.add(normalizedName)
      competitors.push({ name, rank })
      rank++
    }
  }
  
  return competitors.slice(0, 15)
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
