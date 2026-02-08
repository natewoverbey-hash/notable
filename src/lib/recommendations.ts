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
  category: 'visibility' | 'content' | 'reviews' | 'technical' | 'competitive' | 'profiles'
  
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
  expected_weeks_gemini?: number
  
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
    gemini: { scans: number; mentions: number }
    perplexity: { scans: number; mentions: number }
  }
  missingQueryTypes: string[]
  topCompetitors: Array<{ name: string; mentions: number }>
  avgCompetitorMentions: number
  // New: citation source tracking
  citationSources: Map<string, number>
  hasZillowCitations: boolean
  hasRealtorComCitations: boolean
  hasPersonalWebsiteCitations: boolean
  hasNewsCitations: boolean
  // New: content signals from responses
  competitorCitationSources: Map<string, Set<string>>
}

// ─────────────────────────────────────────────────────────────────
// RECOMMENDATION ENGINE
// ─────────────────────────────────────────────────────────────────

export function generateRecommendations(analysis: ScanAnalysis): Recommendation[] {
  const recommendations: Recommendation[] = []

  // ═══════════════════════════════════════════════════════════════
  // TIER 1: HIGH-IMPACT, DATA-DRIVEN RECOMMENDATIONS
  // These fire based on actual scan findings, not score thresholds
  // ═══════════════════════════════════════════════════════════════

  // 1. BING PLACES PROFILE (Critical for ChatGPT)
  // ChatGPT pulls directly from Bing's index. No Bing Places = invisible on ChatGPT.
  // Always recommend if ChatGPT mentions are low relative to scans
  const chatgptMentionRate = analysis.providerScores.chatgpt.scans > 0
    ? analysis.providerScores.chatgpt.mentions / analysis.providerScores.chatgpt.scans
    : 0

  if (chatgptMentionRate < 0.3 && analysis.providerScores.chatgpt.scans > 0) {
    recommendations.push({
      id: 'bing-places',
      priority: 'high',
      category: 'profiles',
      actionability: 'guided_action',
      title: 'Claim your Bing Places profile',
      description: 'ChatGPT pulls agent data directly from Bing\'s index. Without a Bing Places profile, ChatGPT has limited information about you and is less likely to recommend you.',
      jargon_term: 'Bing Places',
      plain_english: 'A free business listing on Bing (Microsoft\'s search engine) that feeds data directly into ChatGPT',
      action: 'Create or claim your Bing Places for Business listing with complete, keyword-rich information.',
      why_it_matters: 'ChatGPT is the most-used AI assistant. It relies on Bing\'s data to recommend local professionals. If you\'re not in Bing Places, ChatGPT literally doesn\'t know you exist.',
      impact: '+10-20 points on ChatGPT visibility',
      expected_weeks_perplexity: 2,
      expected_weeks_chatgpt: 3,
      expected_weeks_gemini: 4,
      steps: [
        { order: 1, title: 'Go to Bing Places for Business', description: 'Visit the Bing Places portal and sign in with a Microsoft account', link: 'https://www.bingplaces.com/' },
        { order: 2, title: 'Search for your business', description: 'Check if a listing already exists — if so, claim it' },
        { order: 3, title: 'Complete every field', description: 'Business name, address, phone, website, hours, categories' },
        { order: 4, title: 'Select the right category', description: 'Choose "Real Estate Agent" as your primary category' },
        { order: 5, title: 'Add a keyword-rich description', description: 'Mention your city, neighborhoods, specialties, and years of experience' },
        { order: 6, title: 'Verify your listing', description: 'Complete phone or mail verification to activate' },
      ]
    })
  }

  // 2. SCHEMA MARKUP (Platform-solvable — we generate the code)
  // This is always high-value. Fire if visibility is below 50% or agent is missing from any provider.
  const anyProviderMissing = Object.values(analysis.providerScores).some(
    p => p.scans > 0 && p.mentions === 0
  )
  if (analysis.visibilityScore < 50 || anyProviderMissing) {
    recommendations.push({
      id: 'schema-markup',
      priority: 'high',
      category: 'technical',
      actionability: 'platform_solvable',
      title: 'Add structured data so AI knows who you are',
      description: 'When AI reads your website, it sees text — but it doesn\'t automatically understand you\'re a real estate agent. Schema markup labels your information in a way AI systems can instantly parse.',
      jargon_term: 'Schema markup',
      plain_english: 'A block of code you add to your website that tells AI: "I\'m a real estate agent named [X] in [city], specializing in [neighborhoods]"',
      action: 'Add RealEstateAgent and LocalBusiness schema to your website.',
      can_generate: true,
      generation_type: 'schema',
      why_it_matters: 'Schema makes your information machine-readable. AI systems can instantly identify your name, location, specialties, credentials, and reviews — making you significantly more likely to be recommended.',
      impact: '+10-20 points across all platforms',
      expected_weeks_perplexity: 1,
      expected_weeks_chatgpt: 4,
      expected_weeks_gemini: 4,
      steps: [
        { order: 1, title: 'Generate your schema code', description: 'Click "Generate" below — we\'ll create it using your profile information' },
        { order: 2, title: 'Copy the code', description: 'It\'s a block of JSON-LD text — no coding knowledge needed' },
        { order: 3, title: 'Send to your web developer', description: 'Ask them to paste it in the <head> section of your homepage. If you manage your own site, paste it before the closing </head> tag.' },
        { order: 4, title: 'Verify it works', description: 'Use Google\'s Rich Results Test to confirm it\'s valid', link: 'https://search.google.com/test/rich-results' },
      ]
    })
  }

  // 3. MISSING FROM SPECIFIC PROVIDERS
  // Data-driven: only fires when scan data shows zero mentions on a platform
  const providers = ['chatgpt', 'gemini', 'perplexity'] as const
  for (const provider of providers) {
    const data = analysis.providerScores[provider]
    if (data.scans > 0 && data.mentions === 0) {
      const providerName = provider === 'chatgpt' ? 'ChatGPT' :
                          provider === 'gemini' ? 'Gemini' : 'Perplexity'

      const isPerplexity = provider === 'perplexity'
      const isGemini = provider === 'gemini'

      // Don't duplicate the Bing Places recommendation for ChatGPT
      if (provider === 'chatgpt' && recommendations.some(r => r.id === 'bing-places')) {
        continue
      }

      let description: string
      let steps: ActionStep[]

      if (isPerplexity) {
        description = `Perplexity didn't mention you in any of ${data.scans} test queries. Perplexity searches the live web in real-time, so fresh, crawlable content is the fastest way to get noticed.`
        steps = [
          { order: 1, title: 'Publish a market update blog post', description: 'Write about current conditions in your market — Perplexity loves fresh content (we can help generate this)' },
          { order: 2, title: 'Update your website with current listings', description: 'Active listings and recent sales signal that you\'re an active agent' },
          { order: 3, title: 'Check your robots.txt', description: 'Make sure your website isn\'t blocking AI crawlers. Look for "User-agent: PerplexityBot" in your robots.txt file.' },
          { order: 4, title: 'Post on social media regularly', description: 'Perplexity indexes social platforms — share local market insights weekly' },
        ]
      } else if (isGemini) {
        description = `Gemini didn't mention you in any of ${data.scans} test queries. Google\'s AI pulls from Google\'s own index, so your Google Business Profile and Google reviews matter most here.`
        steps = [
          { order: 1, title: 'Optimize your Google Business Profile', description: 'Complete every field, add photos, post updates weekly', link: 'https://business.google.com/' },
          { order: 2, title: 'Build Google reviews', description: 'Gemini heavily weights Google reviews. Aim for 50+ with a 4.8+ rating.' },
          { order: 3, title: 'Create content on your website', description: 'Google indexes your site — publish neighborhood guides and market updates' },
          { order: 4, title: 'Ensure mobile optimization', description: 'Google penalizes sites that aren\'t mobile-friendly' },
        ]
      } else {
        description = `${providerName} didn't mention you in any of ${data.scans} test queries. ${providerName} relies on training data and web sources, so building broad online authority is key.`
        steps = [
          { order: 1, title: 'Claim directory profiles', description: 'Zillow, Realtor.com, Homes.com, FastExpert, and local MLS sites' },
          { order: 2, title: 'Build Google and Bing reviews', description: 'Reviews signal trust — aim for 50+ across platforms' },
          { order: 3, title: 'Get mentioned in local press', description: 'Local news features and market commentary build authority' },
        ]
      }

      recommendations.push({
        id: `missing-${provider}`,
        priority: 'high',
        category: 'visibility',
        actionability: 'guided_action',
        title: `You're invisible on ${providerName}`,
        description,
        action: `Take specific steps to build your presence on ${providerName}.`,
        why_it_matters: `${providerName} is used by millions of potential home buyers. Every search where you don't appear is a lead going to a competitor.`,
        impact: `Could capture ${providerName} recommendations`,
        expected_weeks_perplexity: isPerplexity ? 2 : 4,
        expected_weeks_chatgpt: provider === 'chatgpt' ? 4 : 6,
        expected_weeks_gemini: isGemini ? 3 : 6,
        steps,
      })
    }
  }

  // 4. COMPETITOR DOMINANCE (Data-driven from scan results)
  if (analysis.topCompetitors.length > 0 && analysis.avgCompetitorMentions > analysis.mentions * 1.5) {
    const topComp = analysis.topCompetitors[0]
    const multiplier = Math.round(topComp.mentions / Math.max(1, analysis.mentions))
    
    // Build competitor-specific insights from citation data
    const compSources = analysis.competitorCitationSources.get(topComp.name)
    let competitorInsight = ''
    if (compSources && compSources.size > 0) {
      const sourceList = Array.from(compSources).slice(0, 3).join(', ')
      competitorInsight = ` AI is citing them from sources like ${sourceList}.`
    }

    recommendations.push({
      id: 'competitor-dominance',
      priority: 'high',
      category: 'competitive',
      actionability: 'strategic',
      title: `${topComp.name} is getting ${multiplier}x more AI mentions than you`,
      description: `Your top competitor appeared ${topComp.mentions} times vs. your ${analysis.mentions} mentions across all AI platforms.${competitorInsight} Every mention they get is a potential lead you're losing.`,
      action: 'Close the gap by matching their presence on key platforms and differentiating your positioning.',
      why_it_matters: 'AI typically recommends only 3-5 agents per query. If your competitor consistently takes one of those spots, you need to earn your way in.',
      impact: 'Closing the gap could significantly increase your lead flow',
      expected_weeks_perplexity: 4,
      expected_weeks_chatgpt: 8,
      expected_weeks_gemini: 6,
      steps: [
        { order: 1, title: 'Audit their online presence', description: `Search "${topComp.name} real estate" — note every platform they appear on that you don't` },
        { order: 2, title: 'Match their directory coverage', description: 'Claim profiles on every platform where they have a presence' },
        { order: 3, title: 'Compare review counts', description: 'Check their Google, Zillow, and Realtor.com reviews — you need to match or exceed them' },
        { order: 4, title: 'Find your differentiator', description: 'What neighborhoods, property types, or client types can you own that they don\'t emphasize?' },
        { order: 5, title: 'Create differentiated content', description: 'Publish content about your unique expertise — neighborhood guides, market analysis for your niche' },
      ]
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // TIER 2: BEST-PRACTICE RECOMMENDATIONS
  // Always valuable for improving AI visibility in real estate
  // ═══════════════════════════════════════════════════════════════

  // 5. HOMES.COM PROFILE
  if (analysis.visibilityScore < 60) {
    recommendations.push({
      id: 'homes-com-profile',
      priority: 'medium',
      category: 'profiles',
      actionability: 'guided_action',
      title: 'Claim your Homes.com profile',
      description: 'Homes.com is an emerging source that AI platforms reference. Having a complete profile here adds another authoritative signal about your business.',
      action: 'Create or claim your free Homes.com agent profile.',
      why_it_matters: 'The more authoritative sources that list you with consistent information, the more confident AI systems are in recommending you. Homes.com is growing in AI citation frequency.',
      impact: 'Adds another authoritative citation source',
      expected_weeks_perplexity: 2,
      expected_weeks_chatgpt: 6,
      expected_weeks_gemini: 4,
      steps: [
        { order: 1, title: 'Visit Homes.com', description: 'Go to the agent sign-up page', link: 'https://www.homes.com/real-estate-agents/' },
        { order: 2, title: 'Search for your name', description: 'You may already have a listing — claim it if so' },
        { order: 3, title: 'Complete your profile', description: 'Add your bio, specialties, service areas, and photo' },
        { order: 4, title: 'Match your other profiles', description: 'Use the same name, phone, and specialties as your Zillow and Google profiles' },
      ]
    })
  }

  // 6. GOOGLE REVIEWS CAMPAIGN
  const overallMentionRate = analysis.totalScans > 0 ? analysis.mentions / analysis.totalScans : 0
  if (overallMentionRate < 0.5) {
    recommendations.push({
      id: 'google-reviews',
      priority: 'medium',
      category: 'reviews',
      actionability: 'platform_solvable',
      title: 'Launch a Google review campaign',
      description: 'AI assistants heavily weight review signals when deciding which agents to recommend. Agents with 50+ Google reviews and 4.8+ ratings show up significantly more often.',
      action: 'Systematically request reviews from past clients using our email template.',
      can_generate: true,
      generation_type: 'email_template',
      why_it_matters: 'Reviews are one of the strongest trust signals for AI systems. They directly impact whether ChatGPT, Gemini, and Perplexity recommend you over competitors.',
      impact: 'Reviews are a top-3 ranking factor for AI recommendations',
      expected_weeks_perplexity: 3,
      expected_weeks_chatgpt: 8,
      expected_weeks_gemini: 4,
      steps: [
        { order: 1, title: 'Get your Google review link', description: 'In Google Business Profile, go to "Ask for reviews" to get your direct link', link: 'https://business.google.com/' },
        { order: 2, title: 'Generate a review request email', description: 'Click "Generate" — we\'ll create a template you can send to past clients' },
        { order: 3, title: 'Send to your 10 most recent clients', description: 'Start with clients who closed in the last 6 months — they\'re most likely to respond' },
        { order: 4, title: 'Follow up after 3 days', description: 'A gentle reminder doubles your response rate' },
        { order: 5, title: 'Respond to every review', description: 'Thank reviewers by name — this engagement signal matters to AI' },
      ]
    })
  }

  // 7. ZILLOW PROFILE OPTIMIZATION
  if (!analysis.hasZillowCitations && analysis.visibilityScore < 50) {
    recommendations.push({
      id: 'optimize-zillow',
      priority: 'medium',
      category: 'profiles',
      actionability: 'guided_action',
      title: 'Optimize your Zillow profile',
      description: 'Zillow is one of the most frequently cited sources by AI assistants when recommending real estate agents. AI isn\'t pulling your Zillow profile in its responses, which means it may be incomplete or missing key information.',
      action: 'Update your Zillow profile with complete information and keyword-rich content.',
      why_it_matters: 'Zillow is cited in 40%+ of AI real estate responses. An optimized profile dramatically increases your chances of being recommended.',
      impact: 'Zillow is the #1 cited source for agent recommendations',
      expected_weeks_perplexity: 1,
      expected_weeks_chatgpt: 4,
      expected_weeks_gemini: 3,
      steps: [
        { order: 1, title: 'Log into Zillow Agent Hub', description: 'Access your agent profile', link: 'https://www.zillow.com/agent-hub/' },
        { order: 2, title: 'Complete every single field', description: 'Bio, specialties, service areas, languages, certifications, education' },
        { order: 3, title: 'Write a keyword-rich bio', description: 'Mention your city, specific neighborhoods, property types, and buyer types by name' },
        { order: 4, title: 'Add your best professional photo', description: 'High-quality headshot — not a casual or group photo' },
        { order: 5, title: 'Link to your website', description: 'This creates a two-way authority signal between your site and Zillow' },
        { order: 6, title: 'Request Zillow reviews', description: 'Zillow-specific reviews compound with your Google reviews' },
      ]
    })
  }

  // 8. BIO OPTIMIZATION (Platform-solvable — we generate the bio)
  if (analysis.visibilityScore < 40) {
    recommendations.push({
      id: 'bio-optimization',
      priority: 'medium',
      category: 'content',
      actionability: 'platform_solvable',
      title: 'Optimize your bio for AI discovery',
      description: 'AI systems scan your bio across platforms to understand what you specialize in. A generic bio means AI doesn\'t know when to recommend you. A keyword-rich bio tells AI exactly which searches should include you.',
      jargon_term: 'Keyword-rich bio',
      plain_english: 'A professional bio that naturally mentions your city, neighborhoods, property types, and client types so AI can match you to relevant searches',
      action: 'Update your bio across all platforms with consistent, keyword-rich content.',
      can_generate: true,
      generation_type: 'bio',
      why_it_matters: 'Your bio is one of the primary text sources AI uses to decide when to recommend you. If your bio says "experienced agent" without naming neighborhoods or specialties, AI has no reason to recommend you for specific searches.',
      impact: 'Directly improves relevance matching across all AI platforms',
      expected_weeks_perplexity: 1,
      expected_weeks_chatgpt: 6,
      expected_weeks_gemini: 4,
      steps: [
        { order: 1, title: 'Generate your optimized bio', description: 'Click "Generate" — we\'ll create a bio using your profile data and market specialties' },
        { order: 2, title: 'Update your website bio', description: 'Replace your current About page bio with the optimized version' },
        { order: 3, title: 'Update Zillow bio', description: 'Copy the same bio (or a shortened version) to your Zillow profile' },
        { order: 4, title: 'Update Realtor.com bio', description: 'Consistency across platforms reinforces your authority' },
        { order: 5, title: 'Update Google Business Profile', description: 'Add your optimized description to your Google listing' },
      ]
    })
  }

  // 9. NAP CONSISTENCY
  if (analysis.visibilityScore < 50) {
    recommendations.push({
      id: 'nap-consistency',
      priority: 'medium',
      category: 'technical',
      actionability: 'guided_action',
      title: 'Ensure your information is identical everywhere',
      description: 'AI systems cross-reference your name, address, and phone number across the web. If your information is inconsistent (different phone numbers, old addresses, name variations), AI loses confidence that you\'re a real, active agent.',
      jargon_term: 'NAP consistency',
      plain_english: 'Your Name, Address, and Phone number should be exactly the same on every website and directory where you appear',
      action: 'Audit and correct your business information across all online platforms.',
      why_it_matters: 'Inconsistent information confuses AI systems. If Zillow says "Jane Smith, ABC Realty" but Google says "Jane M. Smith, ABC Real Estate," AI may treat these as different people — splitting your authority.',
      impact: 'Consistent NAP strengthens all other recommendations',
      expected_weeks_perplexity: 2,
      expected_weeks_chatgpt: 6,
      expected_weeks_gemini: 4,
      steps: [
        { order: 1, title: 'Choose your canonical information', description: 'Decide on the exact name, address, phone, and brokerage name you\'ll use everywhere' },
        { order: 2, title: 'Audit your profiles', description: 'Check Google, Zillow, Realtor.com, Homes.com, Bing, your website, and social media' },
        { order: 3, title: 'Fix any inconsistencies', description: 'Update every profile to match your canonical information exactly' },
        { order: 4, title: 'Check your brokerage website', description: 'Make sure your team page matches your other profiles' },
      ]
    })
  }

  // 10. PERPLEXITY WORKING BUT OTHERS AREN'T
  const perplexityRate = analysis.providerScores.perplexity.scans > 0
    ? analysis.providerScores.perplexity.mentions / analysis.providerScores.perplexity.scans
    : 0
  const otherRate = (
    (analysis.providerScores.chatgpt.mentions + analysis.providerScores.gemini.mentions) /
    Math.max(1, analysis.providerScores.chatgpt.scans + analysis.providerScores.gemini.scans)
  )

  if (perplexityRate > 0.3 && otherRate < 0.1) {
    recommendations.push({
      id: 'perplexity-only',
      priority: 'medium',
      category: 'technical',
      actionability: 'strategic',
      title: 'You show up on Perplexity but not ChatGPT or Gemini',
      description: 'Perplexity searches the live web (like Google), so it\'s finding you in real-time. But ChatGPT and Gemini rely more on established data sources and training data. You need to build more permanent authority that persists beyond a single search.',
      action: 'Focus on authoritative directories and structured data that ChatGPT and Gemini trust.',
      why_it_matters: 'Perplexity visibility is great but volatile — it changes with every search. ChatGPT and Gemini visibility is more stable once you\'re established in their data sources.',
      impact: 'Expands your reach to ChatGPT and Gemini users',
      expected_weeks_perplexity: 1,
      expected_weeks_chatgpt: 8,
      expected_weeks_gemini: 6,
      steps: [
        { order: 1, title: 'Claim Bing Places profile', description: 'This is ChatGPT\'s primary local data source' },
        { order: 2, title: 'Optimize Google Business Profile', description: 'This is Gemini\'s primary local data source' },
        { order: 3, title: 'Get listed on authoritative directories', description: 'Chamber of commerce, local business associations, industry sites' },
        { order: 4, title: 'Build review volume', description: 'Reviews on Google and Zillow reinforce your authority in training data' },
      ]
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // TIER 3: CONTENT GAP RECOMMENDATIONS
  // Based on query types where the agent isn't appearing
  // ═══════════════════════════════════════════════════════════════

  if (analysis.missingQueryTypes.includes('luxury')) {
    recommendations.push({
      id: 'missing-luxury',
      priority: 'medium',
      category: 'content',
      actionability: 'platform_solvable',
      title: 'You\'re not appearing in luxury home searches',
      description: 'When buyers ask AI about luxury or high-end real estate in your area, you\'re not being recommended. This is a high-value segment worth capturing.',
      action: 'Create content that establishes your luxury market expertise.',
      can_generate: true,
      generation_type: 'content',
      why_it_matters: 'Luxury buyers are more likely to use AI for research and typically represent higher commission opportunities. Appearing in these searches is high-ROI.',
      impact: 'Could capture high-value luxury leads',
      expected_weeks_perplexity: 2,
      expected_weeks_chatgpt: 6,
      expected_weeks_gemini: 5,
      steps: [
        { order: 1, title: 'Generate a luxury market blog post', description: 'Click "Generate" — we\'ll create content about luxury homes in your market' },
        { order: 2, title: 'Update your bio', description: 'Add luxury home experience, price ranges, and notable sales' },
        { order: 3, title: 'Showcase luxury listings', description: 'Feature high-end properties prominently on your website with detailed descriptions' },
        { order: 4, title: 'Add relevant certifications', description: 'Mention CLHMS, luxury designations, or high-end experience in all profiles' },
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
      description: 'People asking AI about moving to your area aren\'t being pointed to you. Relocation clients often have higher budgets and urgency.',
      action: 'Create a comprehensive relocation guide for your market.',
      can_generate: true,
      generation_type: 'content',
      why_it_matters: 'Relocation clients rely heavily on AI because they don\'t have local connections. They search for "best agent for someone moving to [your city]" — and right now, AI isn\'t recommending you.',
      impact: 'Could capture out-of-state buyer leads',
      expected_weeks_perplexity: 2,
      expected_weeks_chatgpt: 6,
      expected_weeks_gemini: 5,
      steps: [
        { order: 1, title: 'Generate a relocation guide', description: 'Click "Generate" — we\'ll create comprehensive content about moving to your area' },
        { order: 2, title: 'Cover practical topics', description: 'Schools, neighborhoods, cost of living, commute times, lifestyle' },
        { order: 3, title: 'Publish as a dedicated page', description: 'Create a standalone page on your site targeting "[city] relocation guide"' },
        { order: 4, title: 'Mention relocation in your bio', description: 'Add "relocation specialist" or "helping families move to [city]" to all profiles' },
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
      description: 'New buyers asking AI for help aren\'t being pointed to you. These clients are especially likely to use AI since they\'re unfamiliar with the home-buying process.',
      action: 'Create first-time buyer resources and highlight this expertise across your profiles.',
      can_generate: true,
      generation_type: 'content',
      why_it_matters: 'First-time buyers are often overwhelmed and turn to AI as their first step. Being their recommended agent builds long-term relationships and referrals.',
      impact: 'Captures entry-level market segment',
      expected_weeks_perplexity: 2,
      expected_weeks_chatgpt: 6,
      expected_weeks_gemini: 5,
      steps: [
        { order: 1, title: 'Generate a first-time buyer guide', description: 'Click "Generate" — we\'ll create helpful, approachable content for new buyers' },
        { order: 2, title: 'Update your bio', description: 'Mention your experience helping first-time buyers through the process' },
        { order: 3, title: 'Add client testimonials', description: 'Feature reviews from first-time buyers — their words resonate with similar prospects' },
      ]
    })
  }

  if (analysis.missingQueryTypes.includes('investment')) {
    recommendations.push({
      id: 'missing-investment',
      priority: 'low',
      category: 'content',
      actionability: 'platform_solvable',
      title: 'Investment property buyers aren\'t finding you',
      description: 'When people ask AI about investment properties or rental opportunities in your area, you\'re not being recommended.',
      action: 'Create content about the investment property market in your area.',
      can_generate: true,
      generation_type: 'content',
      why_it_matters: 'Real estate investors often use AI to research new markets. They represent repeat business and typically buy multiple properties.',
      impact: 'Could capture investor and rental property leads',
      expected_weeks_perplexity: 2,
      expected_weeks_chatgpt: 6,
      expected_weeks_gemini: 5,
      steps: [
        { order: 1, title: 'Generate an investment guide', description: 'Click "Generate" — we\'ll create content about investment opportunities in your market' },
        { order: 2, title: 'Include rental yield data', description: 'Investors want numbers — average rents, cap rates, appreciation trends' },
        { order: 3, title: 'Update your bio', description: 'Mention investment property experience across all profiles' },
      ]
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // SORT AND RETURN
  // ═══════════════════════════════════════════════════════════════

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations
}

// ─────────────────────────────────────────────────────────────────
// SCAN ANALYSIS ENGINE
// ─────────────────────────────────────────────────────────────────

export function analyzeScans(scans: any[], agentName: string): ScanAnalysis {
  const providerScores = {
    chatgpt: { scans: 0, mentions: 0 },
    gemini: { scans: 0, mentions: 0 },
    perplexity: { scans: 0, mentions: 0 },
  }

  const competitorMap = new Map<string, number>()
  const competitorCitationSources = new Map<string, Set<string>>()
  const citationSources = new Map<string, number>()
  const mentionedQueryTypes = new Set<string>()
  const allQueryTypes = new Set<string>()

  let totalMentions = 0
  let hasZillowCitations = false
  let hasRealtorComCitations = false
  let hasPersonalWebsiteCitations = false
  let hasNewsCitations = false

  scans.forEach(scan => {
    const provider = scan.llm_provider as keyof typeof providerScores

    // Skip Claude scans — we no longer track this provider
    if (provider === 'claude' as any) return

    if (providerScores[provider]) {
      providerScores[provider].scans++
      if (scan.mentioned) {
        providerScores[provider].mentions++
        totalMentions++
      }
    }

    // Track citation sources from scan responses
    if (scan.citations && Array.isArray(scan.citations)) {
      scan.citations.forEach((citation: any) => {
        const url = typeof citation === 'string' ? citation : citation?.url || ''
        if (url) {
          const domain = extractDomain(url)
          citationSources.set(domain, (citationSources.get(domain) || 0) + 1)

          if (domain.includes('zillow')) hasZillowCitations = true
          if (domain.includes('realtor.com')) hasRealtorComCitations = true
          if (domain.includes('news') || domain.includes('journal') || domain.includes('times')) hasNewsCitations = true
          // Could check for personal website if we had the agent's domain
        }
      })
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

    // Track competitors and their citation sources
    if (scan.competitors_mentioned) {
      scan.competitors_mentioned.forEach((comp: any) => {
        const name = typeof comp === 'string' ? comp : comp.name
        if (name && name.toLowerCase() !== agentName.toLowerCase()) {
          competitorMap.set(name, (competitorMap.get(name) || 0) + 1)

          // Track which sources cite this competitor
          if (scan.citations && Array.isArray(scan.citations)) {
            if (!competitorCitationSources.has(name)) {
              competitorCitationSources.set(name, new Set())
            }
            scan.citations.forEach((citation: any) => {
              const url = typeof citation === 'string' ? citation : citation?.url || ''
              if (url) {
                competitorCitationSources.get(name)!.add(extractDomain(url))
              }
            })
          }
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

  // Calculate total scans excluding any legacy Claude scans
  const totalValidScans = providerScores.chatgpt.scans + providerScores.gemini.scans + providerScores.perplexity.scans

  return {
    totalScans: totalValidScans,
    mentions: totalMentions,
    visibilityScore: totalValidScans > 0 ? Math.round((totalMentions / totalValidScans) * 100) : 0,
    providerScores,
    missingQueryTypes,
    topCompetitors,
    avgCompetitorMentions,
    citationSources,
    hasZillowCitations,
    hasRealtorComCitations,
    hasPersonalWebsiteCitations,
    hasNewsCitations,
    competitorCitationSources,
  }
}

// Helper: extract domain from URL
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return hostname.replace('www.', '')
  } catch {
    return url
  }
}
