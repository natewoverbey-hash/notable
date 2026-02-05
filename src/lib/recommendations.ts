// Enhanced Recommendation Types
export interface ActionStep {
  order: number
  title: string
  description: string
  link?: string
  is_completed?: boolean
}

export interface Recommendation {
  id: string
  priority: 'high' | 'medium' | 'low'
  category: 'visibility' | 'content' | 'reviews' | 'technical' | 'competitive'
  
  // Actionability level
  actionability: 'platform_solvable' | 'guided_action' | 'strategic'
  
  // Display
  title: string
  description: string
  
  // Jargon translation
  jargon_term?: string
  plain_english?: string
  
  // Action details
  action: string
  steps?: ActionStep[]
  
  // Platform-solvable features
  can_generate?: boolean
  generation_type?: 'content' | 'schema' | 'bio' | 'email_template'
  
  // Impact & Timeline
  impact: string
  expected_weeks_perplexity?: number
  expected_weeks_chatgpt?: number
  expected_weeks_claude?: number
  
  // Progress tracking
  status?: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  
  // Education
  why_it_matters?: string
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

  // 1. Overall visibility is critically low
  if (analysis.visibilityScore < 20) {
    recommendations.push({
      id: 'low-visibility',
      priority: 'high',
      category: 'visibility',
      actionability: 'guided_action',
      title: 'Your AI visibility is critically low',
      description: `You're only appearing in ${analysis.visibilityScore}% of AI searches. Most buyers using ChatGPT, Perplexity, or Claude won't find you when searching for agents.`,
      action: 'Focus on building your online presence with structured data, consistent business listings, and authoritative content.',
      why_it_matters: 'AI assistants recommend agents based on online authority. Low visibility means you\'re invisible to the growing number of buyers who start their search with AI.',
      impact: 'Could increase visibility by 50-100%',
      expected_weeks_perplexity: 2,
      expected_weeks_chatgpt: 6,
      expected_weeks_claude: 6,
      steps: [
        { order: 1, title: 'Audit your online presence', description: 'Google yourself and note where you appear (and don\'t appear)' },
        { order: 2, title: 'Claim all directory listings', description: 'Zillow, Realtor.com, Homes.com, FastExpert, etc.' },
        { order: 3, title: 'Ensure consistent information', description: 'Same name, phone, email across all platforms' },
        { order: 4, title: 'Add schema markup', description: 'We can generate this code for you (see recommendation below)' },
      ]
    })
  }

  // 2. Schema markup - HIGH PRIORITY, PLATFORM SOLVABLE
  if (analysis.visibilityScore < 40) {
    recommendations.push({
      id: 'schema-markup',
      priority: 'high',
      category: 'technical',
      actionability: 'platform_solvable',
      title: 'Add code that helps AI understand who you are',
      description: 'Right now, when AI looks at your website, it sees text—but it doesn\'t KNOW you\'re a real estate agent. Schema markup is like putting a label on your website.',
      jargon_term: 'schema markup',
      plain_english: 'Code that tells AI "I\'m a real estate agent in [your city] specializing in [your niche]"',
      action: 'Add LocalBusiness and RealEstateAgent schema to your website header.',
      can_generate: true,
      generation_type: 'schema',
      why_it_matters: 'Schema markup makes your information machine-readable. AI systems can instantly understand your name, location, specialties, and credentials—making you more likely to be recommended.',
      impact: '+15-25% visibility in ChatGPT and Claude',
      expected_weeks_perplexity: 2,
      expected_weeks_chatgpt: 4,
      expected_weeks_claude: 4,
      steps: [
        { order: 1, title: 'Generate your schema code', description: 'Click "Generate Schema Code" below—we\'ll create it based on your profile' },
        { order: 2, title: 'Copy the code', description: 'It\'s just a block of text you\'ll paste into your website' },
        { order: 3, title: 'Add to your website', description: 'Paste it in your website\'s header (or send to your web developer)' },
        { order: 4, title: 'Verify it works', description: 'Use Google\'s Rich Results Test to confirm', link: 'https://search.google.com/test/rich-results' },
      ]
    })
  }

  // 3. Missing from specific providers
  const providers = ['chatgpt', 'claude', 'gemini', 'perplexity'] as const
  for (const provider of providers) {
    const data = analysis.providerScores[provider]
    if (data.scans > 0 && data.mentions === 0) {
      const providerName = provider === 'chatgpt' ? 'ChatGPT' : 
                          provider === 'claude' ? 'Claude' :
                          provider === 'gemini' ? 'Gemini' : 'Perplexity'
      
      const isPerplexity = provider === 'perplexity'
      
      recommendations.push({
        id: `missing-${provider}`,
        priority: 'high',
        category: 'visibility',
        actionability: 'guided_action',
        title: `You're invisible on ${providerName}`,
        description: `${providerName} didn't mention you in any of ${data.scans} test queries. ${
          isPerplexity 
            ? 'Perplexity uses real-time web search, so fresh content helps.'
            : `${providerName} relies on training data, which updates less frequently.`
        }`,
        action: isPerplexity 
          ? 'Publish fresh blog posts and ensure your website is regularly updated with current listings and market insights.'
          : 'Build authority through directory listings, reviews, and authoritative backlinks.',
        why_it_matters: `${providerName} is used by millions of potential home buyers. Being invisible means you're missing leads.`,
        impact: `Could capture ${providerName} traffic`,
        expected_weeks_perplexity: isPerplexity ? 2 : 4,
        expected_weeks_chatgpt: isPerplexity ? 4 : 6,
        expected_weeks_claude: isPerplexity ? 4 : 6,
        steps: isPerplexity ? [
          { order: 1, title: 'Create fresh content', description: 'Write a blog post about your local market (we can help generate this)' },
          { order: 2, title: 'Update your website', description: 'Add recent testimonials, current listings, market stats' },
          { order: 3, title: 'Be active on social', description: 'Perplexity indexes social media—post regularly about local real estate' },
        ] : [
          { order: 1, title: 'Claim directory profiles', description: 'Zillow, Realtor.com, Homes.com, FastExpert, local MLS sites' },
          { order: 2, title: 'Build Google reviews', description: 'Ask past clients for reviews—aim for 50+ with 4.8+ rating' },
          { order: 3, title: 'Get local press mentions', description: 'Reach out to local news for market commentary opportunities' },
        ]
      })
    }
  }

  // 4. Perplexity working but others aren't
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
      actionability: 'strategic',
      title: 'You show up on Perplexity but not other AIs',
      description: 'Perplexity uses real-time web search (like Google), while ChatGPT and Claude rely on training data that updates less frequently. You need to build more permanent authority.',
      action: 'Get listed on authoritative directories that AI systems trust for training data.',
      why_it_matters: 'Perplexity visibility is great but temporary—it changes with each search. ChatGPT/Claude visibility is more stable once you\'re in their training data.',
      impact: 'Could expand visibility to ChatGPT and Claude users',
      expected_weeks_perplexity: 1,
      expected_weeks_chatgpt: 8,
      expected_weeks_claude: 8,
      steps: [
        { order: 1, title: 'Focus on Wikipedia-level sources', description: 'Get mentioned on local chamber of commerce, industry associations' },
        { order: 2, title: 'Build authoritative backlinks', description: 'Local news sites, real estate publications, community sites' },
        { order: 3, title: 'Maintain consistency', description: 'Keep your information identical across all platforms' },
      ]
    })
  }

  // 5. Competitor dominance
  if (analysis.topCompetitors.length > 0 && analysis.avgCompetitorMentions > analysis.mentions * 2) {
    const topComp = analysis.topCompetitors[0]
    recommendations.push({
      id: 'competitor-dominance',
      priority: 'high',
      category: 'competitive',
      actionability: 'strategic',
      title: `${topComp.name} has ${Math.round(topComp.mentions / Math.max(1, analysis.mentions))}x your visibility`,
      description: `Your top competitor is being mentioned ${topComp.mentions} times vs. your ${analysis.mentions}. They're capturing leads that could be yours.`,
      action: 'Analyze what makes them visible and differentiate your positioning.',
      why_it_matters: 'When AI recommends competitors instead of you, you lose leads before you even know they exist.',
      impact: 'Competitive parity could double your lead flow',
      expected_weeks_perplexity: 4,
      expected_weeks_chatgpt: 8,
      expected_weeks_claude: 8,
      steps: [
        { order: 1, title: 'Research their online presence', description: 'Google them—where do they appear that you don\'t?' },
        { order: 2, title: 'Check their reviews', description: 'How many reviews do they have? What do clients say?' },
        { order: 3, title: 'Find your unique angle', description: 'What can you specialize in that they don\'t?' },
        { order: 4, title: 'Create differentiated content', description: 'Blog about your unique expertise and local knowledge' },
      ]
    })
  }

  // 6. Missing from query types
  if (analysis.missingQueryTypes.includes('luxury')) {
    recommendations.push({
      id: 'missing-luxury',
      priority: 'medium',
      category: 'content',
      actionability: 'platform_solvable',
      title: 'You\'re not appearing in luxury searches',
      description: 'When people ask AI about luxury or high-end real estate, you\'re not being recommended.',
      action: 'Create content that establishes your luxury market expertise.',
      can_generate: true,
      generation_type: 'content',
      why_it_matters: 'Luxury buyers often use AI for research. If you work in the luxury market, you\'re missing high-value leads.',
      impact: 'Could capture high-value luxury leads',
      expected_weeks_perplexity: 2,
      expected_weeks_chatgpt: 6,
      expected_weeks_claude: 6,
      steps: [
        { order: 1, title: 'Create luxury-focused content', description: 'We can generate a blog post about luxury homes in your area' },
        { order: 2, title: 'Update your bio', description: 'Mention luxury home experience, price ranges you\'ve sold' },
        { order: 3, title: 'Showcase luxury listings', description: 'Feature high-end properties prominently on your website' },
      ]
    })
  }

  if (analysis.missingQueryTypes.includes('relocation')) {
    recommendations.push({
      id: 'missing-relocation',
      priority: 'medium',
      category: 'content',
      actionability: 'platform_solvable',
      title: 'Relocation buyers can\'t find you',
      description: 'People asking AI about moving to your area aren\'t being pointed to you.',
      action: 'Create a comprehensive relocation guide for your market.',
      can_generate: true,
      generation_type: 'content',
      why_it_matters: 'Relocation clients often have higher budgets and urgency. They heavily rely on AI for research since they don\'t have local connections.',
      impact: 'Could capture out-of-state buyer leads',
      expected_weeks_perplexity: 2,
      expected_weeks_chatgpt: 6,
      expected_weeks_claude: 6,
      steps: [
        { order: 1, title: 'Create a relocation guide', description: 'We can generate comprehensive content about moving to your area' },
        { order: 2, title: 'Cover practical topics', description: 'Schools, neighborhoods, cost of living, commute times' },
        { order: 3, title: 'Add to your website', description: 'Make it a dedicated page that ranks for "[city] relocation guide"' },
      ]
    })
  }

  if (analysis.missingQueryTypes.includes('first-time')) {
    recommendations.push({
      id: 'missing-firsttime',
      priority: 'low',
      category: 'content',
      actionability: 'platform_solvable',
      title: 'First-time buyers aren\'t finding you',
      description: 'New buyers asking AI for help aren\'t being pointed to you.',
      action: 'Create first-time buyer resources and mention this expertise in your bio.',
      can_generate: true,
      generation_type: 'content',
      why_it_matters: 'First-time buyers are often overwhelmed and turn to AI for guidance. Being their recommended agent builds long-term client relationships.',
      impact: 'Could capture entry-level market',
      expected_weeks_perplexity: 2,
      expected_weeks_chatgpt: 6,
      expected_weeks_claude: 6,
      steps: [
        { order: 1, title: 'Create a first-time buyer guide', description: 'We can generate helpful content for new buyers' },
        { order: 2, title: 'Update your bio', description: 'Mention your experience helping first-time buyers' },
        { order: 3, title: 'Add testimonials', description: 'Feature reviews from first-time buyers you\'ve helped' },
      ]
    })
  }

  // 7. Google Reviews recommendation
  if (analysis.visibilityScore < 50) {
    recommendations.push({
      id: 'google-reviews',
      priority: 'medium',
      category: 'reviews',
      actionability: 'guided_action',
      title: 'Build your Google review count',
      description: 'AI assistants reference agents with strong review profiles. More positive reviews = more AI mentions.',
      action: 'Systematically ask every closed client for a Google review.',
      can_generate: true,
      generation_type: 'email_template',
      why_it_matters: 'Reviews signal trust and quality to AI systems. Agents with 50+ reviews and 4.8+ ratings are significantly more likely to be recommended.',
      impact: 'Reviews are a major ranking factor for AI recommendations',
      expected_weeks_perplexity: 4,
      expected_weeks_chatgpt: 8,
      expected_weeks_claude: 8,
      steps: [
        { order: 1, title: 'Get your Google Business Profile link', description: 'This is the direct link clients will use to leave reviews' },
        { order: 2, title: 'Send review requests', description: 'We can generate email/text templates for you' },
        { order: 3, title: 'Time it right', description: 'Ask within 48 hours of closing while the experience is fresh' },
        { order: 4, title: 'Respond to all reviews', description: 'Professional responses show engagement and build trust' },
        { order: 5, title: 'Aim for 50+ reviews', description: 'This is the threshold where AI starts taking notice' },
      ]
    })
  }

  // 8. Update Zillow profile
  if (analysis.visibilityScore < 30) {
    recommendations.push({
      id: 'update-zillow',
      priority: 'medium',
      category: 'visibility',
      actionability: 'guided_action',
      title: 'Optimize your Zillow profile',
      description: 'Zillow is one of the most-cited sources by AI assistants. An optimized profile increases your chances of being mentioned.',
      action: 'Update your Zillow profile with specialty keywords and complete information.',
      why_it_matters: 'AI systems frequently cite Zillow when recommending agents. A complete, keyword-rich profile makes you more likely to be mentioned.',
      impact: 'Zillow is cited in 40%+ of AI real estate responses',
      expected_weeks_perplexity: 1,
      expected_weeks_chatgpt: 4,
      expected_weeks_claude: 4,
      steps: [
        { order: 1, title: 'Log into Zillow Agent Hub', description: 'Go to zillow.com/agent-hub and sign in', link: 'https://www.zillow.com/agent-hub/' },
        { order: 2, title: 'Complete every field', description: 'Bio, specialties, service areas, languages, certifications' },
        { order: 3, title: 'Add keyword-rich bio', description: 'Mention your city, neighborhoods, property types, buyer types' },
        { order: 4, title: 'Upload professional photo', description: 'High-quality headshot, not a casual photo' },
        { order: 5, title: 'Link to your website', description: 'This helps build authority signals' },
      ]
    })
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations
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
    if (prompt.includes('luxury') || prompt.includes('high-end') || prompt.includes('million')) {
      allQueryTypes.add('luxury')
      if (scan.mentioned) mentionedQueryTypes.add('luxury')
    }
    if (prompt.includes('relocation') || prompt.includes('moving to') || prompt.includes('relocating')) {
      allQueryTypes.add('relocation')
      if (scan.mentioned) mentionedQueryTypes.add('relocation')
    }
    if (prompt.includes('first-time') || prompt.includes('first time') || prompt.includes('new buyer')) {
      allQueryTypes.add('first-time')
      if (scan.mentioned) mentionedQueryTypes.add('first-time')
    }
    if (prompt.includes('investment') || prompt.includes('investor') || prompt.includes('rental')) {
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
