// ─────────────────────────────────────────────────────────────────
// UPDATED RECOMMENDATION ENGINE (src/lib/recommendations.ts)
// Now accepts PlatformPresence[] to gate profile recommendations
// on verified data instead of guessing.
//
// KEY CHANGES from previous version:
// 1. generateRecommendations() accepts optional profilePresence param
// 2. Profile recs only fire when verified as 'not_found' or no audit yet
// 3. When profile IS confirmed, recs shift to "optimize" instead of "claim"
// 4. New helpers: getPresenceStatus(), shouldRecommendClaiming()
// ─────────────────────────────────────────────────────────────────

import { PlatformPresence } from '@/lib/profile-audit'

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
  actionability: 'platform_solvable' | 'guided_action' | 'strategic'
  title: string
  description: string
  jargon_term?: string
  plain_english?: string
  action: string
  steps?: ActionStep[]
  can_generate?: boolean
  generation_type?: 'content' | 'schema' | 'bio' | 'email_template'
  impact: string
  expected_weeks_perplexity?: number
  expected_weeks_chatgpt?: number
  expected_weeks_gemini?: number
  status?: 'pending' | 'in_progress' | 'completed' | 'dismissed'
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
  citationSources: Map<string, number>
  hasZillowCitations: boolean
  hasRealtorComCitations: boolean
  hasPersonalWebsiteCitations: boolean
  hasNewsCitations: boolean
  competitorCitationSources: Map<string, Set<string>>
}

// ── PRESENCE HELPERS ──────────────────────────────────────────────

type PresenceStatus = 'confirmed' | 'not_found' | 'unknown' | 'no_audit'

function getPresenceStatus(
  profilePresence: PlatformPresence[] | undefined,
  platform: string
): PresenceStatus {
  if (!profilePresence || profilePresence.length === 0) return 'no_audit'
  const entry = profilePresence.find(p => p.platform === platform)
  if (!entry) return 'no_audit'
  return entry.status
}

function shouldRecommendClaiming(status: PresenceStatus): boolean {
  return status === 'not_found' || status === 'no_audit' || status === 'unknown'
}

function isProfileConfirmed(status: PresenceStatus): boolean {
  return status === 'confirmed'
}

// ── RECOMMENDATION ENGINE ─────────────────────────────────────────

export function generateRecommendations(
  analysis: ScanAnalysis,
  profilePresence?: PlatformPresence[]  // ← NEW PARAM
): Recommendation[] {
  const recommendations: Recommendation[] = []

  // ═══ TIER 1: HIGH-IMPACT ════════════════════════════════════════

  // 1. BING PLACES
  const chatgptMentionRate = analysis.providerScores.chatgpt.scans > 0
    ? analysis.providerScores.chatgpt.mentions / analysis.providerScores.chatgpt.scans
    : 0

  if (chatgptMentionRate < 0.3 && analysis.providerScores.chatgpt.scans > 0) {
    const bingStatus = getPresenceStatus(profilePresence, 'bing_places')

    if (shouldRecommendClaiming(bingStatus)) {
      const verifiedText = bingStatus === 'not_found'
        ? ' We verified that you don\'t currently have a Bing Places listing.'
        : ''
      recommendations.push({
        id: 'bing-places',
        priority: 'high',
        category: 'profiles',
        actionability: 'guided_action',
        title: 'Claim your Bing Places profile',
        description: `ChatGPT pulls agent data directly from Bing's index. Without a Bing Places profile, ChatGPT has limited information about you.${verifiedText}`,
        jargon_term: 'Bing Places',
        plain_english: 'A free business listing on Bing (Microsoft\'s search engine) that feeds data directly into ChatGPT',
        action: 'Create or claim your Bing Places for Business listing.',
        why_it_matters: 'ChatGPT relies on Bing\'s data to recommend local professionals. If you\'re not in Bing Places, ChatGPT literally doesn\'t know you exist.',
        impact: '+10-20 points on ChatGPT visibility',
        expected_weeks_perplexity: 2, expected_weeks_chatgpt: 3, expected_weeks_gemini: 4,
        steps: [
          { order: 1, title: 'Go to Bing Places for Business', description: 'Visit the Bing Places portal and sign in with a Microsoft account', link: 'https://www.bingplaces.com/' },
          { order: 2, title: 'Search for your business', description: 'Check if a listing already exists — if so, claim it' },
          { order: 3, title: 'Complete every field', description: 'Business name, address, phone, website, hours, categories' },
          { order: 4, title: 'Select the right category', description: 'Choose "Real Estate Agent" as your primary category' },
          { order: 5, title: 'Add a keyword-rich description', description: 'Mention your city, neighborhoods, specialties, and years of experience' },
          { order: 6, title: 'Verify your listing', description: 'Complete phone or mail verification to activate' },
        ]
      })
    } else if (isProfileConfirmed(bingStatus)) {
      // Has Bing Places but ChatGPT still not mentioning → optimize
      recommendations.push({
        id: 'optimize-bing-places',
        priority: 'high',
        category: 'profiles',
        actionability: 'guided_action',
        title: 'Optimize your Bing Places listing — ChatGPT still isn\'t finding you',
        description: 'You have a Bing Places listing, but ChatGPT mentioned you in less than 30% of test queries. Your listing may need more detail.',
        action: 'Update your Bing Places listing with more complete, keyword-rich content.',
        why_it_matters: 'Having a listing is step one — but it needs to be complete for ChatGPT to confidently recommend you.',
        impact: '+10-15 points on ChatGPT visibility',
        expected_weeks_perplexity: 2, expected_weeks_chatgpt: 3, expected_weeks_gemini: 4,
        steps: [
          { order: 1, title: 'Log into Bing Places', description: 'Visit your existing listing', link: 'https://www.bingplaces.com/' },
          { order: 2, title: 'Audit every field', description: 'Is your description detailed? Do you list all service areas?' },
          { order: 3, title: 'Add a detailed description', description: 'Include city, neighborhoods, property types, years of experience' },
          { order: 4, title: 'Add photos', description: 'Professional headshot and office photos build trust signals' },
          { order: 5, title: 'Verify NAP consistency', description: 'Name, address, phone must match Google, Zillow, and website exactly' },
        ]
      })
    }
  }

  // 2. SCHEMA MARKUP (not profile-dependent)
  const anyProviderMissing = Object.values(analysis.providerScores).some(
    p => p.scans > 0 && p.mentions === 0
  )
  if (analysis.visibilityScore < 50 || anyProviderMissing) {
    recommendations.push({
      id: 'schema-markup', priority: 'high', category: 'technical', actionability: 'platform_solvable',
      title: 'Add structured data so AI knows who you are',
      description: 'Schema markup labels your information in a way AI systems can instantly parse.',
      jargon_term: 'Schema markup',
      plain_english: 'A block of code you add to your website that tells AI: "I\'m a real estate agent named [X] in [city], specializing in [neighborhoods]"',
      action: 'Add RealEstateAgent and LocalBusiness schema to your website.',
      can_generate: true, generation_type: 'schema',
      why_it_matters: 'Schema makes your information machine-readable, making you significantly more likely to be recommended.',
      impact: '+10-20 points across all platforms',
      expected_weeks_perplexity: 1, expected_weeks_chatgpt: 4, expected_weeks_gemini: 4,
      steps: [
        { order: 1, title: 'Generate your schema code', description: 'Click "Generate" below — we\'ll create it using your profile information' },
        { order: 2, title: 'Copy the code', description: 'It\'s a block of JSON-LD text — no coding knowledge needed' },
        { order: 3, title: 'Send to your web developer', description: 'Ask them to paste it in the <head> section of your homepage.' },
        { order: 4, title: 'Verify it works', description: 'Use Google\'s Rich Results Test to confirm', link: 'https://search.google.com/test/rich-results' },
      ]
    })
  }

  // 3. MISSING FROM SPECIFIC PROVIDERS
  const providers = ['chatgpt', 'gemini', 'perplexity'] as const
  for (const provider of providers) {
    const data = analysis.providerScores[provider]
    if (data.scans > 0 && data.mentions === 0) {
      const providerName = provider === 'chatgpt' ? 'ChatGPT' : provider === 'gemini' ? 'Gemini' : 'Perplexity'
      const isPerplexity = provider === 'perplexity'
      const isGemini = provider === 'gemini'

      if (provider === 'chatgpt' && recommendations.some(r => r.id === 'bing-places' || r.id === 'optimize-bing-places')) continue

      let description: string
      let steps: ActionStep[]

      if (isPerplexity) {
        description = `Perplexity didn't mention you in any of ${data.scans} test queries. Fresh, crawlable content is the fastest way to get noticed.`
        steps = [
          { order: 1, title: 'Publish a market update blog post', description: 'Perplexity loves fresh content (we can help generate this)' },
          { order: 2, title: 'Update your website with current listings', description: 'Active listings signal you\'re an active agent' },
          { order: 3, title: 'Check your robots.txt', description: 'Look for "User-agent: PerplexityBot" — make sure it\'s not blocked' },
          { order: 4, title: 'Post on social media regularly', description: 'Perplexity indexes social platforms' },
        ]
      } else if (isGemini) {
        description = `Gemini didn't mention you in any of ${data.scans} test queries. Google's AI pulls from Google's own index.`
        steps = [
          { order: 1, title: 'Optimize your Google Business Profile', description: 'Complete every field, add photos, post updates weekly', link: 'https://business.google.com/' },
          { order: 2, title: 'Build Google reviews', description: 'Aim for 50+ with a 4.8+ rating.' },
          { order: 3, title: 'Create content on your website', description: 'Publish neighborhood guides and market updates' },
          { order: 4, title: 'Ensure mobile optimization', description: 'Google penalizes sites that aren\'t mobile-friendly' },
        ]
      } else {
        description = `${providerName} didn't mention you in any of ${data.scans} test queries.`
        steps = [
          { order: 1, title: 'Claim directory profiles', description: 'Zillow, Realtor.com, Homes.com, FastExpert' },
          { order: 2, title: 'Build Google and Bing reviews', description: 'Aim for 50+ across platforms' },
          { order: 3, title: 'Get mentioned in local press', description: 'Local news features build authority' },
        ]
      }

      recommendations.push({
        id: `missing-${provider}`, priority: 'high', category: 'visibility', actionability: 'guided_action',
        title: `You're invisible on ${providerName}`, description,
        action: `Take specific steps to build your presence on ${providerName}.`,
        why_it_matters: `${providerName} is used by millions of potential home buyers.`,
        impact: `Could capture ${providerName} recommendations`,
        expected_weeks_perplexity: isPerplexity ? 2 : 4,
        expected_weeks_chatgpt: provider === 'chatgpt' ? 4 : 6,
        expected_weeks_gemini: isGemini ? 3 : 6,
        steps,
      })
    }
  }

  // 4. COMPETITOR DOMINANCE
  if (analysis.topCompetitors.length > 0 && analysis.avgCompetitorMentions > analysis.mentions * 1.5) {
    const topComp = analysis.topCompetitors[0]
    const multiplier = Math.round(topComp.mentions / Math.max(1, analysis.mentions))
    const compSources = analysis.competitorCitationSources.get(topComp.name)
    let competitorInsight = ''
    if (compSources && compSources.size > 0) {
      competitorInsight = ` AI is citing them from sources like ${Array.from(compSources).slice(0, 3).join(', ')}.`
    }
    recommendations.push({
      id: 'competitor-dominance', priority: 'high', category: 'competitive', actionability: 'strategic',
      title: `${topComp.name} is getting ${multiplier}x more AI mentions than you`,
      description: `Your top competitor appeared ${topComp.mentions} times vs. your ${analysis.mentions} mentions.${competitorInsight}`,
      action: 'Close the gap by matching their presence on key platforms.',
      why_it_matters: 'AI typically recommends only 3-5 agents per query.',
      impact: 'Closing the gap could significantly increase your lead flow',
      expected_weeks_perplexity: 4, expected_weeks_chatgpt: 8, expected_weeks_gemini: 6,
      steps: [
        { order: 1, title: 'Audit their online presence', description: `Search "${topComp.name} real estate" — note every platform they appear on` },
        { order: 2, title: 'Match their directory coverage', description: 'Claim profiles on every platform where they have a presence' },
        { order: 3, title: 'Compare review counts', description: 'Check their Google, Zillow, and Realtor.com reviews' },
        { order: 4, title: 'Find your differentiator', description: 'What neighborhoods or client types can you own?' },
        { order: 5, title: 'Create differentiated content', description: 'Publish content about your unique expertise' },
      ]
    })
  }

  // ═══ TIER 2: BEST-PRACTICE (now gated on presence) ═════════════

  // 5. HOMES.COM — only if NOT confirmed
  const homesStatus = getPresenceStatus(profilePresence, 'homes_com')
  if (shouldRecommendClaiming(homesStatus) && analysis.visibilityScore < 60) {
    const verifiedText = homesStatus === 'not_found' ? ' We checked and couldn\'t find an existing Homes.com profile for you.' : ''
    recommendations.push({
      id: 'homes-com-profile', priority: 'medium', category: 'profiles', actionability: 'guided_action',
      title: 'Claim your Homes.com profile',
      description: `Homes.com is an emerging source that AI platforms reference.${verifiedText}`,
      action: 'Create or claim your free Homes.com agent profile.',
      why_it_matters: 'More authoritative sources with consistent information = more AI confidence.',
      impact: 'Adds another authoritative citation source',
      expected_weeks_perplexity: 2, expected_weeks_chatgpt: 6, expected_weeks_gemini: 4,
      steps: [
        { order: 1, title: 'Visit Homes.com', description: 'Go to the agent sign-up page', link: 'https://www.homes.com/real-estate-agents/' },
        { order: 2, title: 'Search for your name', description: 'You may already have a listing — claim it if so' },
        { order: 3, title: 'Complete your profile', description: 'Add your bio, specialties, service areas, and photo' },
        { order: 4, title: 'Match your other profiles', description: 'Use the same name, phone, and specialties as your other profiles' },
      ]
    })
  }
  // If homesStatus === 'confirmed': skip entirely (already has it)

  // 6. GOOGLE REVIEWS (not profile-dependent)
  const overallMentionRate = analysis.totalScans > 0 ? analysis.mentions / analysis.totalScans : 0
  if (overallMentionRate < 0.5) {
    recommendations.push({
      id: 'google-reviews', priority: 'medium', category: 'reviews', actionability: 'platform_solvable',
      title: 'Launch a Google review campaign',
      description: 'Agents with 50+ Google reviews and 4.8+ ratings show up significantly more often.',
      action: 'Systematically request reviews from past clients.',
      can_generate: true, generation_type: 'email_template',
      why_it_matters: 'Reviews are one of the strongest trust signals for AI systems.',
      impact: 'Reviews are a top-3 ranking factor for AI recommendations',
      expected_weeks_perplexity: 3, expected_weeks_chatgpt: 8, expected_weeks_gemini: 4,
      steps: [
        { order: 1, title: 'Get your Google review link', description: 'In Google Business Profile, go to "Ask for reviews"', link: 'https://business.google.com/' },
        { order: 2, title: 'Generate a review request email', description: 'Click "Generate" — we\'ll create a template' },
        { order: 3, title: 'Send to your 10 most recent clients', description: 'Start with clients from the last 6 months' },
        { order: 4, title: 'Follow up after 3 days', description: 'A gentle reminder doubles response rate' },
        { order: 5, title: 'Respond to every review', description: 'Engagement signals matter to AI' },
      ]
    })
  }

  // 7. ZILLOW — now gated on presence
  const zillowStatus = getPresenceStatus(profilePresence, 'zillow')
  if (!analysis.hasZillowCitations && analysis.visibilityScore < 50) {
    if (shouldRecommendClaiming(zillowStatus)) {
      const verifiedText = zillowStatus === 'not_found' ? ' We checked and couldn\'t find a Zillow profile for you.' : ''
      recommendations.push({
        id: 'claim-zillow', priority: 'medium', category: 'profiles', actionability: 'guided_action',
        title: 'Create your Zillow agent profile',
        description: `Zillow is cited in 40%+ of AI real estate responses. AI isn't pulling any Zillow data for you.${verifiedText}`,
        action: 'Create your Zillow agent profile with complete information.',
        why_it_matters: 'Without a Zillow profile, you\'re missing the single biggest citation source.',
        impact: 'Zillow is the #1 cited source for agent recommendations',
        expected_weeks_perplexity: 1, expected_weeks_chatgpt: 4, expected_weeks_gemini: 3,
        steps: [
          { order: 1, title: 'Go to Zillow Agent Hub', description: 'Create your agent account', link: 'https://www.zillow.com/agent-hub/' },
          { order: 2, title: 'Complete every field', description: 'Bio, specialties, service areas, certifications' },
          { order: 3, title: 'Write a keyword-rich bio', description: 'Mention neighborhoods, property types, buyer types' },
          { order: 4, title: 'Add your best professional photo', description: 'High-quality headshot' },
          { order: 5, title: 'Link to your website', description: 'Creates a two-way authority signal' },
        ]
      })
    } else if (isProfileConfirmed(zillowStatus)) {
      // Has Zillow but AI not citing it → optimize
      recommendations.push({
        id: 'optimize-zillow', priority: 'medium', category: 'profiles', actionability: 'guided_action',
        title: 'Optimize your Zillow profile — AI isn\'t citing it',
        description: 'You have a Zillow profile, but AI isn\'t citing it. It may be incomplete or missing key information.',
        action: 'Update your Zillow profile with more keyword-rich content.',
        why_it_matters: 'Zillow is cited in 40%+ of AI responses. Having a profile is step one — it needs to be optimized.',
        impact: 'Could unlock Zillow as a citation source across all AI platforms',
        expected_weeks_perplexity: 1, expected_weeks_chatgpt: 4, expected_weeks_gemini: 3,
        steps: [
          { order: 1, title: 'Log into Zillow Agent Hub', description: 'Review your current profile', link: 'https://www.zillow.com/agent-hub/' },
          { order: 2, title: 'Audit your bio', description: 'Does it mention specific neighborhoods and property types?' },
          { order: 3, title: 'Check your specialties', description: 'Make sure all service areas are selected' },
          { order: 4, title: 'Update your photo', description: 'Professional headshot' },
          { order: 5, title: 'Request Zillow reviews', description: 'Reviews compound with Google reviews' },
        ]
      })
    }
  }

  // 8. BIO OPTIMIZATION (not profile-dependent)
  if (analysis.visibilityScore < 40) {
    recommendations.push({
      id: 'bio-optimization', priority: 'medium', category: 'content', actionability: 'platform_solvable',
      title: 'Optimize your bio for AI discovery',
      description: 'A keyword-rich bio tells AI exactly which searches should include you.',
      jargon_term: 'Keyword-rich bio',
      plain_english: 'A professional bio that naturally mentions your city, neighborhoods, property types, and client types',
      action: 'Update your bio across all platforms with consistent, keyword-rich content.',
      can_generate: true, generation_type: 'bio',
      why_it_matters: 'Your bio is one of the primary text sources AI uses to decide when to recommend you.',
      impact: 'Directly improves relevance matching across all AI platforms',
      expected_weeks_perplexity: 1, expected_weeks_chatgpt: 6, expected_weeks_gemini: 4,
      steps: [
        { order: 1, title: 'Generate your optimized bio', description: 'Click "Generate" — we\'ll create a bio using your profile data' },
        { order: 2, title: 'Update your website bio', description: 'Replace your About page bio' },
        { order: 3, title: 'Update Zillow bio', description: 'Copy the same bio to Zillow' },
        { order: 4, title: 'Update Realtor.com bio', description: 'Consistency reinforces authority' },
        { order: 5, title: 'Update Google Business Profile', description: 'Add optimized description to Google' },
      ]
    })
  }

  // 9. NAP CONSISTENCY
  if (analysis.visibilityScore < 50) {
    recommendations.push({
      id: 'nap-consistency', priority: 'medium', category: 'technical', actionability: 'guided_action',
      title: 'Ensure your information is identical everywhere',
      description: 'AI cross-references your name, address, and phone across the web. Inconsistencies split your authority.',
      jargon_term: 'NAP consistency',
      plain_english: 'Your Name, Address, and Phone number should be exactly the same everywhere',
      action: 'Audit and correct your business information across all platforms.',
      why_it_matters: 'If Zillow says "Jane Smith, ABC Realty" but Google says "Jane M. Smith, ABC Real Estate," AI may treat these as different people.',
      impact: 'Consistent NAP strengthens all other recommendations',
      expected_weeks_perplexity: 2, expected_weeks_chatgpt: 6, expected_weeks_gemini: 4,
      steps: [
        { order: 1, title: 'Choose your canonical information', description: 'Decide on exact name, address, phone, brokerage' },
        { order: 2, title: 'Audit your profiles', description: 'Check Google, Zillow, Realtor.com, Homes.com, Bing, website, social media' },
        { order: 3, title: 'Fix inconsistencies', description: 'Update every profile to match exactly' },
        { order: 4, title: 'Check brokerage website', description: 'Make sure team page matches' },
      ]
    })
  }

  // 10. PERPLEXITY-ONLY PATTERN
  const perplexityRate = analysis.providerScores.perplexity.scans > 0
    ? analysis.providerScores.perplexity.mentions / analysis.providerScores.perplexity.scans : 0
  const otherRate = (analysis.providerScores.chatgpt.mentions + analysis.providerScores.gemini.mentions) /
    Math.max(1, analysis.providerScores.chatgpt.scans + analysis.providerScores.gemini.scans)

  if (perplexityRate > 0.3 && otherRate < 0.1) {
    recommendations.push({
      id: 'perplexity-only', priority: 'medium', category: 'technical', actionability: 'strategic',
      title: 'You show up on Perplexity but not ChatGPT or Gemini',
      description: 'Perplexity searches the live web but ChatGPT and Gemini rely on established data sources.',
      action: 'Focus on authoritative directories and structured data.',
      why_it_matters: 'Perplexity visibility is volatile. ChatGPT and Gemini are more stable once established.',
      impact: 'Expands your reach to ChatGPT and Gemini users',
      expected_weeks_perplexity: 1, expected_weeks_chatgpt: 8, expected_weeks_gemini: 6,
      steps: [
        { order: 1, title: 'Claim Bing Places profile', description: 'ChatGPT\'s primary local data source' },
        { order: 2, title: 'Optimize Google Business Profile', description: 'Gemini\'s primary local data source' },
        { order: 3, title: 'Get listed on authoritative directories', description: 'Chamber of commerce, local business associations' },
        { order: 4, title: 'Build review volume', description: 'Reviews reinforce authority in training data' },
      ]
    })
  }

  // ═══ TIER 3: CONTENT GAP (unchanged) ═══════════════════════════

  if (analysis.missingQueryTypes.includes('luxury')) {
    recommendations.push({
      id: 'missing-luxury', priority: 'medium', category: 'content', actionability: 'platform_solvable',
      title: 'You\'re not appearing in luxury home searches',
      description: 'Luxury buyers asking AI aren\'t being pointed to you.',
      action: 'Create content that establishes luxury market expertise.',
      can_generate: true, generation_type: 'content',
      why_it_matters: 'Luxury buyers represent higher commissions and are more likely to use AI.',
      impact: 'Could capture high-value luxury leads',
      expected_weeks_perplexity: 2, expected_weeks_chatgpt: 6, expected_weeks_gemini: 5,
      steps: [
        { order: 1, title: 'Generate a luxury market blog post', description: 'Click "Generate"' },
        { order: 2, title: 'Update your bio', description: 'Add luxury experience, price ranges, notable sales' },
        { order: 3, title: 'Showcase luxury listings', description: 'Feature high-end properties prominently' },
        { order: 4, title: 'Add relevant certifications', description: 'CLHMS, luxury designations' },
      ]
    })
  }

  if (analysis.missingQueryTypes.includes('relocation')) {
    recommendations.push({
      id: 'missing-relocation', priority: 'medium', category: 'content', actionability: 'platform_solvable',
      title: 'Relocation buyers can\'t find you',
      description: 'People asking AI about moving to your area aren\'t being pointed to you.',
      action: 'Create a comprehensive relocation guide.',
      can_generate: true, generation_type: 'content',
      why_it_matters: 'Relocation clients rely heavily on AI because they don\'t have local connections.',
      impact: 'Could capture out-of-state buyer leads',
      expected_weeks_perplexity: 2, expected_weeks_chatgpt: 6, expected_weeks_gemini: 5,
      steps: [
        { order: 1, title: 'Generate a relocation guide', description: 'Click "Generate"' },
        { order: 2, title: 'Cover practical topics', description: 'Schools, neighborhoods, cost of living, commute times' },
        { order: 3, title: 'Publish as a dedicated page', description: 'Target "[city] relocation guide"' },
        { order: 4, title: 'Mention relocation in your bio', description: 'Add "relocation specialist" to all profiles' },
      ]
    })
  }

  if (analysis.missingQueryTypes.includes('first-time')) {
    recommendations.push({
      id: 'missing-firsttime', priority: 'low', category: 'content', actionability: 'platform_solvable',
      title: 'First-time buyers aren\'t finding you',
      description: 'New buyers using AI aren\'t being pointed to you.',
      action: 'Create first-time buyer resources.',
      can_generate: true, generation_type: 'content',
      why_it_matters: 'First-time buyers turn to AI as their first step.',
      impact: 'Captures entry-level market segment',
      expected_weeks_perplexity: 2, expected_weeks_chatgpt: 6, expected_weeks_gemini: 5,
      steps: [
        { order: 1, title: 'Generate a first-time buyer guide', description: 'Click "Generate"' },
        { order: 2, title: 'Update your bio', description: 'Mention first-time buyer experience' },
        { order: 3, title: 'Add client testimonials', description: 'Feature first-time buyer reviews' },
      ]
    })
  }

  if (analysis.missingQueryTypes.includes('investment')) {
    recommendations.push({
      id: 'missing-investment', priority: 'low', category: 'content', actionability: 'platform_solvable',
      title: 'Investment property buyers aren\'t finding you',
      description: 'AI isn\'t recommending you for investment property searches.',
      action: 'Create investment property content.',
      can_generate: true, generation_type: 'content',
      why_it_matters: 'Investors represent repeat business and multiple properties.',
      impact: 'Could capture investor and rental property leads',
      expected_weeks_perplexity: 2, expected_weeks_chatgpt: 6, expected_weeks_gemini: 5,
      steps: [
        { order: 1, title: 'Generate an investment guide', description: 'Click "Generate"' },
        { order: 2, title: 'Include rental yield data', description: 'Average rents, cap rates, appreciation trends' },
        { order: 3, title: 'Update your bio', description: 'Mention investment property experience' },
      ]
    })
  }

  // ═══ SORT AND RETURN ════════════════════════════════════════════

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations
}

// ── SCAN ANALYSIS ENGINE ──────────────────────────────────────────

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
    if (provider === 'claude' as any) return

    if (providerScores[provider]) {
      providerScores[provider].scans++
      if (scan.mentioned) {
        providerScores[provider].mentions++
        totalMentions++
      }
    }

    if (scan.citations && Array.isArray(scan.citations)) {
      scan.citations.forEach((citation: any) => {
        const url = typeof citation === 'string' ? citation : citation?.url || ''
        if (url) {
          const domain = extractDomain(url)
          citationSources.set(domain, (citationSources.get(domain) || 0) + 1)
          if (domain.includes('zillow')) hasZillowCitations = true
          if (domain.includes('realtor.com')) hasRealtorComCitations = true
          if (domain.includes('news') || domain.includes('journal') || domain.includes('times')) hasNewsCitations = true
        }
      })
    }

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

    if (scan.competitors_mentioned) {
      scan.competitors_mentioned.forEach((comp: any) => {
        const name = typeof comp === 'string' ? comp : comp.name
        if (name && name.toLowerCase() !== agentName.toLowerCase()) {
          competitorMap.set(name, (competitorMap.get(name) || 0) + 1)
          if (scan.citations && Array.isArray(scan.citations)) {
            if (!competitorCitationSources.has(name)) competitorCitationSources.set(name, new Set())
            scan.citations.forEach((citation: any) => {
              const url = typeof citation === 'string' ? citation : citation?.url || ''
              if (url) competitorCitationSources.get(name)!.add(extractDomain(url))
            })
          }
        }
      })
    }
  })

  const missingQueryTypes = Array.from(allQueryTypes).filter(qt => !mentionedQueryTypes.has(qt))
  const topCompetitors = Array.from(competitorMap.entries())
    .map(([name, mentions]) => ({ name, mentions }))
    .sort((a, b) => b.mentions - a.mentions).slice(0, 5)
  const avgCompetitorMentions = topCompetitors.length > 0
    ? topCompetitors.reduce((sum, c) => sum + c.mentions, 0) / topCompetitors.length : 0
  const totalValidScans = providerScores.chatgpt.scans + providerScores.gemini.scans + providerScores.perplexity.scans

  return {
    totalScans: totalValidScans,
    mentions: totalMentions,
    visibilityScore: totalValidScans > 0 ? Math.round((totalMentions / totalValidScans) * 100) : 0,
    providerScores, missingQueryTypes, topCompetitors, avgCompetitorMentions,
    citationSources, hasZillowCitations, hasRealtorComCitations, hasPersonalWebsiteCitations, hasNewsCitations,
    competitorCitationSources,
  }
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}
