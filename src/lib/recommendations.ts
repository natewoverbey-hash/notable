export interface Recommendation {
  id: string
  priority: 'high' | 'medium' | 'low'
  category: 'visibility' | 'content' | 'reviews' | 'technical' | 'competitive'
  title: string
  description: string
  action: string
  impact: string
}

interface ScanAnalysis {
  totalScans: number
  mentions: number
  visibilityScore: number
  providerScores: {
    chatgpt: { scans: number; mentions: number }
    claude: { scans: number; mentions: number }
    gemini: { scans: number; mentions: number }
    perplexity: { scans: number; mentions: number }
  }
  missingQueryTypes: string[]
  topCompetitors: Array<{ name: string; mentions: number }>
  avgCompetitorMentions: number
}

export function generateRecommendations(analysis: ScanAnalysis): Recommendation[] {
  const recommendations: Recommendation[] = []

  // 1. Overall visibility is low
  if (analysis.visibilityScore < 20) {
    recommendations.push({
      id: 'low-visibility',
      priority: 'high',
      category: 'visibility',
      title: 'Your AI visibility is critically low',
      description: `You're only appearing in ${analysis.visibilityScore}% of AI searches. Most buyers using ChatGPT, Claude, or Perplexity won't find you.`,
      action: 'Focus on building your online presence with structured data, consistent NAP citations, and authoritative backlinks.',
      impact: 'Could increase visibility by 50-100%'
    })
  }

  // 2. Missing from specific providers
  const providers = ['chatgpt', 'claude', 'gemini', 'perplexity'] as const
  for (const provider of providers) {
    const data = analysis.providerScores[provider]
    if (data.scans > 0 && data.mentions === 0) {
      const providerName = provider === 'chatgpt' ? 'ChatGPT' : 
                          provider === 'claude' ? 'Claude' :
                          provider === 'gemini' ? 'Gemini' : 'Perplexity'
      recommendations.push({
        id: `missing-${provider}`,
        priority: 'high',
        category: 'visibility',
        title: `You're invisible on ${providerName}`,
        description: `${providerName} didn't mention you in any of ${data.scans} queries. This AI is used by millions of potential buyers.`,
        action: provider === 'perplexity' 
          ? 'Perplexity pulls from recent web content. Publish fresh blog posts and ensure your website is regularly updated.'
          : 'Ensure your website has proper schema markup and your business information is consistent across directories.',
        impact: `Could capture ${providerName} traffic`
      })
    }
  }

  // 3. Perplexity working but others aren't
  const perplexityRate = analysis.providerScores.perplexity.scans > 0 
    ? analysis.providerScores.perplexity.mentions / analysis.providerScores.perplexity.scans 
    : 0
  const otherRate = (
    (analysis.providerScores.chatgpt.mentions + analysis.providerScores.claude.mentions + analysis.providerScores.gemini.mentions) /
    Math.max(1, analysis.providerScores.chatgpt.scans + analysis.providerScores.claude.scans + analysis.providerScores.gemini.scans)
  )
  
  if (perplexityRate > 0.3 && otherRate < 0.1) {
    recommendations.push({
      id: 'perplexity-only',
      priority: 'medium',
      category: 'technical',
      title: 'You show up on Perplexity but not other AIs',
      description: 'Perplexity uses real-time web search, while ChatGPT and Claude rely on training data. You need to build more permanent authority.',
      action: 'Get listed on authoritative real estate directories (Zillow, Realtor.com, local MLS). Build backlinks from local news and community sites.',
      impact: 'Could expand visibility to ChatGPT and Claude users'
    })
  }

  // 4. Competitors dominating
  if (analysis.topCompetitors.length > 0 && analysis.topCompetitors[0].mentions > analysis.mentions * 3) {
    const topComp = analysis.topCompetitors[0]
    recommendations.push({
      id: 'competitor-dominance',
      priority: 'high',
      category: 'competitive',
      title: `${topComp.name} has ${Math.round(topComp.mentions / Math.max(1, analysis.mentions))}x your visibility`,
      description: `${topComp.name} appears ${topComp.mentions} times vs your ${analysis.mentions}. They're capturing leads that could be yours.`,
      action: 'Research their online presence. Check their Google reviews count, website content, and directory listings. Match and exceed their strategy.',
      impact: 'Could level the competitive playing field'
    })
  }

  // 5. Missing from specialty searches
  if (analysis.missingQueryTypes.includes('luxury')) {
    recommendations.push({
      id: 'missing-luxury',
      priority: 'medium',
      category: 'content',
      title: 'You\'re not appearing in luxury home searches',
      description: 'AI assistants aren\'t recommending you for high-end properties. This is a high-value segment.',
      action: 'Create dedicated luxury content on your website. Highlight luxury sales in your bio. Use terms like "luxury specialist" and mention specific high-end neighborhoods.',
      impact: 'Could capture high-commission luxury leads'
    })
  }

  if (analysis.missingQueryTypes.includes('relocation')) {
    recommendations.push({
      id: 'missing-relocation',
      priority: 'medium',
      category: 'content',
      title: 'Relocation buyers can\'t find you',
      description: 'People moving to your area are asking AI for agent recommendations, but you\'re not being suggested.',
      action: 'Create a relocation guide on your website. Mention relocation services in your bio. Get listed on relocation-specific directories.',
      impact: 'Could capture out-of-state buyer leads'
    })
  }

  if (analysis.missingQueryTypes.includes('first-time')) {
    recommendations.push({
      id: 'missing-firsttime',
      priority: 'low',
      category: 'content',
      title: 'First-time buyers aren\'t finding you',
      description: 'New buyers asking AI for help aren\'t being pointed to you.',
      action: 'Add first-time buyer resources to your website. Mention experience helping first-time buyers in your bio.',
      impact: 'Could capture entry-level market'
    })
  }

  // 6. Google Reviews recommendation (always good)
  if (analysis.visibilityScore < 50) {
    recommendations.push({
      id: 'google-reviews',
      priority: 'medium',
      category: 'reviews',
      title: 'Build your Google review count',
      description: 'AI assistants often reference agents with strong review profiles. More reviews = more AI mentions.',
      action: 'Ask every closed client for a Google review. Aim for 50+ reviews with a 4.8+ rating. Respond to all reviews professionally.',
      impact: 'Reviews are a major ranking factor for AI recommendations'
    })
  }

  // 7. Schema markup recommendation
  if (analysis.visibilityScore < 30) {
    recommendations.push({
      id: 'schema-markup',
      priority: 'high',
      category: 'technical',
      title: 'Add schema markup to your website',
      description: 'Structured data helps AI understand who you are and what you specialize in.',
      action: 'Add LocalBusiness and RealEstateAgent schema to your website. Include your name, brokerage, service areas, and specialties.',
      impact: 'Makes your information machine-readable for AI'
    })
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations.slice(0, 6) // Return top 6
}

export function analyzeScans(scans: any[], agentName: string): ScanAnalysis {
  const providerScores = {
    chatgpt: { scans: 0, mentions: 0 },
    claude: { scans: 0, mentions: 0 },
    gemini: { scans: 0, mentions: 0 },
    perplexity: { scans: 0, mentions: 0 },
  }

  const competitorMap = new Map<string, number>()
  const mentionedQueryTypes = new Set<string>()
  const allQueryTypes = new Set<string>()

  let totalMentions = 0

  scans.forEach(scan => {
    const provider = scan.llm_provider as keyof typeof providerScores
    if (providerScores[provider]) {
      providerScores[provider].scans++
      if (scan.mentioned) {
        providerScores[provider].mentions++
        totalMentions++
      }
    }

    // Track query types
    const prompt = scan.prompt_rendered?.toLowerCase() || ''
    if (prompt.includes('luxury') || prompt.includes('high-end')) {
      allQueryTypes.add('luxury')
      if (scan.mentioned) mentionedQueryTypes.add('luxury')
    }
    if (prompt.includes('relocation') || prompt.includes('moving to')) {
      allQueryTypes.add('relocation')
      if (scan.mentioned) mentionedQueryTypes.add('relocation')
    }
    if (prompt.includes('first-time') || prompt.includes('first time')) {
      allQueryTypes.add('first-time')
      if (scan.mentioned) mentionedQueryTypes.add('first-time')
    }
    if (prompt.includes('investment') || prompt.includes('investor')) {
      allQueryTypes.add('investment')
      if (scan.mentioned) mentionedQueryTypes.add('investment')
    }

    // Track competitors
    if (scan.competitors_mentioned) {
      scan.competitors_mentioned.forEach((comp: any) => {
        const name = typeof comp === 'string' ? comp : comp.name
        if (name && name.toLowerCase() !== agentName.toLowerCase()) {
          competitorMap.set(name, (competitorMap.get(name) || 0) + 1)
        }
      })
    }
  })

  const missingQueryTypes = Array.from(allQueryTypes).filter(qt => !mentionedQueryTypes.has(qt))

  const topCompetitors = Array.from(competitorMap.entries())
    .map(([name, mentions]) => ({ name, mentions }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 5)

  const avgCompetitorMentions = topCompetitors.length > 0
    ? topCompetitors.reduce((sum, c) => sum + c.mentions, 0) / topCompetitors.length
    : 0

  return {
    totalScans: scans.length,
    mentions: totalMentions,
    visibilityScore: scans.length > 0 ? Math.round((totalMentions / scans.length) * 100) : 0,
    providerScores,
    missingQueryTypes,
    topCompetitors,
    avgCompetitorMentions,
  }
}
