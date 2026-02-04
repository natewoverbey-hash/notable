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
  sourcesCited: Array<{ source: string; url?: string; count: number }>
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
  
  // Extract sources from the response
  const sources = extractSources(response)
  
  if (!mentioned) {
    return {
      mentioned: false,
      rank: null,
      context: null,
      sentiment: null,
      competitorsMentioned: competitors,
      sourcesCited: sources,
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
    sourcesCited: sources,
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
    'local networking', 'local market expertise', 'investment property knowledge',
    'strong communication skills', 'network of local professionals',
    'important considerations', 'research each agent', 'interview multiple agents',
    'what to look for', 'where to find', 'examples of what', 'here are some',
    'sales data', 'market knowledge', 'marketing plan', 'good luck',
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
    'professional associations', 'referrals', 'experience', 'disclaimer'
  ]
  
  // Common real estate brokerages
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
  
  /**
   * Helper function to validate and add a competitor name
   */
  function tryAddCompetitor(rawName: string): boolean {
    // Clean up the name - remove colons, parentheticals, etc.
    let name = rawName.trim()
    name = name.replace(/:$/, '').trim()  // Remove trailing colon
    name = name.replace(/\s*\([^)]*\)\s*/g, '').trim()  // Remove parentheticals
    name = name.replace(/\s*,.*$/, '').trim()  // Remove everything after comma
    name = name.replace(/\s*[-–—].*$/, '').trim()  // Remove everything after dash
    
    // Extract just the name if it includes "of Brokerage" or similar
    const ofMatch = name.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z']+)+?)(?:\s+(?:of|at|with|from))/i)
    if (ofMatch) {
      name = ofMatch[1].trim()
    }
    
    const lowerName = name.toLowerCase()
    
    // Skip if empty or too short
    if (name.length < 4) return false
    
    // Skip if it's our agent
    if (lowerName.includes(lowerExclude) || lowerExclude.includes(lowerName)) return false
    
    // Skip false positives
    if (falsePositives.some(fp => lowerName.includes(fp) || lowerName === fp)) return false
    
    // Skip if matches "not a person" patterns
    if (notPersonPatterns.some(pattern => pattern.test(name))) return false
    
    // Skip standalone brokerage names
    if (knownBrokerages.some(b => lowerName === b)) return false
    
    // Must look like a person's name: 2-4 words
    const words = name.split(/\s+/)
    if (words.length < 2 || words.length > 4) return false
    
    // Each word should start with capital letter and be reasonable length
    const looksLikeName = words.every(word => {
      return /^[A-Z][a-z']+$/.test(word) && word.length >= 2 && word.length <= 15
    })
    if (!looksLikeName) return false
    
    // Skip if contains numbers
    if (/\d/.test(name)) return false
    
    // Add if not already seen
    const normalizedName = name.toLowerCase()
    if (!seen.has(normalizedName)) {
      seen.add(normalizedName)
      competitors.push({ name, rank })
      rank++
      return true
    }
    return false
  }
  
  let match
  
  // Pattern 1: Bold names like **First Last** or **First Last:** (Gemini format)
  const boldPattern = /\*\*([^*]+)\*\*/g
  
  while ((match = boldPattern.exec(response)) !== null) {
    tryAddCompetitor(match[1])
  }
  
  // Pattern 2: Bullet points with names: "* Name:" or "- Name:" or "• Name"
  const bulletPattern = /^[\s]*[*•\-]\s+([A-Z][a-z]+(?:\s[A-Z][a-z']+)+):?/gm
  
  while ((match = bulletPattern.exec(response)) !== null) {
    tryAddCompetitor(match[1])
  }
  
  // Pattern 3: Names in brackets [Name](url) - common in web search results
  const bracketPattern = /\[([A-Z][a-z]+(?:\s[A-Z][a-z']+)+)\]\s*\(/g
  
  while ((match = bracketPattern.exec(response)) !== null) {
    tryAddCompetitor(match[1])
  }
  
  // Pattern 4: Numbered list items with names: "1. First Last" or "1. **First Last**"
  const numberedPattern = /\d+\.\s+\*?\*?([A-Z][a-z]+(?:\s[A-Z][a-z']+)+)\*?\*?/g
  
  while ((match = numberedPattern.exec(response)) !== null) {
    tryAddCompetitor(match[1])
  }
  
  // Pattern 5: "Agent: First Last" or "Name: First Last" patterns
  const labeledPattern = /(?:agent|realtor|broker|name):\s*([A-Z][a-z]+(?:\s[A-Z][a-z']+)+)/gi
  
  while ((match = labeledPattern.exec(response)) !== null) {
    tryAddCompetitor(match[1])
  }
  
  // Pattern 6: Names followed by brokerage in parentheses or after dash
  // e.g., "Kara Lyles (Handsome Properties)" or "Kara Lyles - Handsome Properties"
  const nameWithBrokeragePattern = /([A-Z][a-z]+\s[A-Z][a-z']+(?:\s[A-Z][a-z']+)?)\s*(?:\(|[-–—])\s*(?:The\s)?(?:Cassina|William Means|Handsome|Coldwell|Carolina One|Dunes|Keller|Sotheby)/gi
  
  while ((match = nameWithBrokeragePattern.exec(response)) !== null) {
    tryAddCompetitor(match[1])
  }
  
  return competitors.slice(0, 15)
}
/**
 * Extract cited sources from LLM response
 */
function extractSources(response: string): Array<{ source: string; url?: string; count: number }> {
  const sourceMap = new Map<string, { url?: string; count: number }>()
  
  // Known source domains to look for
  const knownSources: Record<string, string> = {
    'homes.com': 'Homes.com',
    'zillow.com': 'Zillow',
    'zillow': 'Zillow',
    'realtor.com': 'Realtor.com',
    'redfin.com': 'Redfin',
    'redfin': 'Redfin',
    'yelp.com': 'Yelp',
    'yelp': 'Yelp',
    'google.com': 'Google',
    'google': 'Google',
    'facebook.com': 'Facebook',
    'linkedin.com': 'LinkedIn',
    'trulia.com': 'Trulia',
    'realtrends.com': 'RealTrends',
    'fastexpert.com': 'FastExpert',
    'fastexpert': 'FastExpert',
    'homelight.com': 'HomeLight',
    'homelight': 'HomeLight',
    'compass.com': 'Compass',
    'coldwellbanker.com': 'Coldwell Banker',
    'kw.com': 'Keller Williams',
    'kellerwilliams': 'Keller Williams',
    'sothebysrealty.com': "Sotheby's",
    'christiesrealestate.com': "Christie's",
    'berkshirehathaway': 'Berkshire Hathaway',
    'century21.com': 'Century 21',
    'exp realty': 'eXp Realty',
    'exprealty': 'eXp Realty',
    'cassina': 'The Cassina Group',
    'dunesproperties': 'Dunes Properties',
    'carolinaone': 'Carolina One',
    'williammeans': 'William Means',
    'charlestonrealestate': 'Charleston Real Estate',
    'agent pronto': 'Agent Pronto',
    'agentpronto': 'Agent Pronto',
    'effectiveagents': 'EffectiveAgents',
    'ratemyagent': 'RateMyAgent',
  }
  
  // Pattern 1: Parenthetical citations like (Homes.com) or (Source Name)
  const parenPattern = /\(([^)]+(?:\.com|\.org|\.net)?)\)/gi
  let match
  
  while ((match = parenPattern.exec(response)) !== null) {
    const citation = match[1].trim().toLowerCase()
    
    // Check if it matches a known source
    for (const [key, displayName] of Object.entries(knownSources)) {
      if (citation.includes(key)) {
        const existing = sourceMap.get(displayName)
        if (existing) {
          existing.count++
        } else {
          sourceMap.set(displayName, { count: 1 })
        }
        break
      }
    }
  }
  
  // Pattern 2: Bracketed citations with numbers like [1], [2] followed by source info
  // This captures Perplexity-style citations
  const bracketRefPattern = /\[(\d+)\]/g
  const citationCount = (response.match(bracketRefPattern) || []).length
  
  // Pattern 3: URLs in the response
  const urlPattern = /https?:\/\/(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+)[^\s)"]*/gi
  
  while ((match = urlPattern.exec(response)) !== null) {
    const fullUrl = match[0]
    const domain = match[1].toLowerCase()
    
    // Extract the main domain name
    const domainParts = domain.split('.')
    const mainDomain = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domain
    
    // Check if it matches a known source
    let foundSource = false
    for (const [key, displayName] of Object.entries(knownSources)) {
      if (domain.includes(key) || mainDomain === key.replace('.com', '')) {
        const existing = sourceMap.get(displayName)
        if (existing) {
          existing.count++
          if (!existing.url) existing.url = fullUrl
        } else {
          sourceMap.set(displayName, { url: fullUrl, count: 1 })
        }
        foundSource = true
        break
      }
    }
    
    // If not a known source but looks like a real estate site, add it
    if (!foundSource && /realty|realtor|homes|property|estate/i.test(domain)) {
      const displayName = mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1)
      const existing = sourceMap.get(displayName)
      if (existing) {
        existing.count++
      } else {
        sourceMap.set(displayName, { url: fullUrl, count: 1 })
      }
    }
  }
  
  // Pattern 4: Plain text mentions of sources
  const textPatterns = [
    { pattern: /\bZillow\b/gi, source: 'Zillow' },
    { pattern: /\bRealtor\.com\b/gi, source: 'Realtor.com' },
    { pattern: /\bRedfin\b/gi, source: 'Redfin' },
    { pattern: /\bHomes\.com\b/gi, source: 'Homes.com' },
    { pattern: /\bYelp\b/gi, source: 'Yelp' },
    { pattern: /\bGoogle\s*(?:Reviews?|Business|Maps)?\b/gi, source: 'Google' },
    { pattern: /\bFastExpert\b/gi, source: 'FastExpert' },
    { pattern: /\bHomeLight\b/gi, source: 'HomeLight' },
    { pattern: /\bRealTrends\b/gi, source: 'RealTrends' },
    { pattern: /\bMLS\b/g, source: 'MLS' },
    { pattern: /\bCharleston\s*(?:Trident\s*)?(?:Association|MLS)\b/gi, source: 'Charleston MLS' },
  ]
  
  for (const { pattern, source } of textPatterns) {
    const matches = response.match(pattern)
    if (matches && matches.length > 0) {
      const existing = sourceMap.get(source)
      if (existing) {
        // Don't double count if we already found via URL
        if (matches.length > existing.count) {
          existing.count = matches.length
        }
      } else {
        sourceMap.set(source, { count: matches.length })
      }
    }
  }
  
  // Convert map to sorted array
  return Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      url: data.url,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
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
