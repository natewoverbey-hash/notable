// ─────────────────────────────────────────────────────────────────
// PROFILE AUDIT
// Uses Perplexity (which searches the live web) to verify whether
// an agent has claimed profiles on key platforms. Results are
// stored in the agent_profiles table and consumed by the
// recommendation engine to avoid recommending actions already done.
//
// Usage:
//   import { runProfileAudit, getAgentPresence } from '@/lib/profile-audit'
//
//   // Run audit (during scan or on agent setup)
//   await runProfileAudit(userId, agentName, location)
//
//   // Get cached results (for recommendation engine)
//   const presence = await getAgentPresence(userId)
// ─────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface PlatformPresence {
  platform: string
  label: string
  status: 'confirmed' | 'not_found' | 'unknown'
  source: 'llm_audit' | 'citation' | 'user_reported'
  profileUrl?: string
  checkedAt?: Date
}

export const PLATFORMS = [
  { key: 'zillow', label: 'Zillow' },
  { key: 'homes_com', label: 'Homes.com' },
  { key: 'realtor_com', label: 'Realtor.com' },
  { key: 'bing_places', label: 'Bing Places' },
  { key: 'google_business', label: 'Google Business Profile' },
  { key: 'fastexpert', label: 'FastExpert' },
] as const

export type PlatformKey = typeof PLATFORMS[number]['key']

// ─────────────────────────────────────────────────────────────────
// PERPLEXITY AUDIT PROMPT
// Perplexity searches the live web, so this is equivalent to
// Googling "does Jackie Kelly have a Zillow profile" — but
// structured and parseable.
// ─────────────────────────────────────────────────────────────────

function buildAuditPrompt(agentName: string, location: string): string {
  return `I need to verify whether the real estate agent "${agentName}" in ${location} has active profiles on specific platforms. Please search for each one and report what you find.

Check these platforms:
1. Zillow (zillow.com) - Search for their agent profile page
2. Homes.com (homes.com) - Search for their agent profile page
3. Realtor.com (realtor.com) - Search for their agent profile page
4. Bing Places - Search Bing Maps for their business listing
5. Google Business Profile - Search Google Maps for their business listing
6. FastExpert (fastexpert.com) - Search for their agent profile page

For each platform, respond with ONLY a JSON object. No other text, no markdown, no explanation. Just the JSON:

{
  "zillow": { "status": "FOUND" or "NOT_FOUND" or "UNKNOWN", "url": "profile URL if found or null" },
  "homes_com": { "status": "FOUND" or "NOT_FOUND" or "UNKNOWN", "url": "profile URL if found or null" },
  "realtor_com": { "status": "FOUND" or "NOT_FOUND" or "UNKNOWN", "url": "profile URL if found or null" },
  "bing_places": { "status": "FOUND" or "NOT_FOUND" or "UNKNOWN", "url": "profile URL if found or null" },
  "google_business": { "status": "FOUND" or "NOT_FOUND" or "UNKNOWN", "url": "profile URL if found or null" },
  "fastexpert": { "status": "FOUND" or "NOT_FOUND" or "UNKNOWN", "url": "profile URL if found or null" }
}`
}

// ─────────────────────────────────────────────────────────────────
// RUN PROFILE AUDIT
// Calls Perplexity API, parses response, stores in Supabase.
// Call this during scans or on agent setup.
// Returns the parsed presence data.
// ─────────────────────────────────────────────────────────────────

export async function runProfileAudit(
  userId: string,
  agentName: string,
  location: string
): Promise<PlatformPresence[]> {
  console.log(`[Profile Audit] Starting audit for ${agentName} in ${location}`)

  // Call Perplexity API
  const prompt = buildAuditPrompt(agentName, location)
  let rawResponse = ''

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant. Respond only with valid JSON. No markdown, no explanation, no preamble.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1, // Low temperature for factual accuracy
      }),
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    rawResponse = data.choices?.[0]?.message?.content || ''
    console.log(`[Profile Audit] Raw response: ${rawResponse.substring(0, 200)}...`)
  } catch (error) {
    console.error(`[Profile Audit] Perplexity API call failed:`, error)
    // Return unknown status for all platforms if API fails
    return PLATFORMS.map(p => ({
      platform: p.key,
      label: p.label,
      status: 'unknown' as const,
      source: 'llm_audit' as const,
    }))
  }

  // Parse the response
  const parsed = parseAuditResponse(rawResponse)

  // Store results in Supabase
  const results: PlatformPresence[] = []

  for (const platform of PLATFORMS) {
    const auditResult = parsed.get(platform.key)
    const status = auditResult?.status || 'unknown'
    const profileUrl = auditResult?.url || null

    const presence: PlatformPresence = {
      platform: platform.key,
      label: platform.label,
      status: status as 'confirmed' | 'not_found' | 'unknown',
      source: 'llm_audit',
      profileUrl: profileUrl || undefined,
      checkedAt: new Date(),
    }
    results.push(presence)

    // Upsert into database
    try {
      const { error } = await supabase
        .from('agent_profiles')
        .upsert(
          {
            user_id: userId,
            agent_name: agentName,
            platform: platform.key,
            status,
            source: 'llm_audit',
            profile_url: profileUrl,
            raw_response: rawResponse,
            checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,platform',
          }
        )

      if (error) {
        console.error(`[Profile Audit] Failed to store ${platform.key}:`, error)
      }
    } catch (err) {
      console.error(`[Profile Audit] DB error for ${platform.key}:`, err)
    }
  }

  console.log(`[Profile Audit] Completed. Found: ${results.filter(r => r.status === 'confirmed').map(r => r.label).join(', ') || 'none'}`)
  console.log(`[Profile Audit] Not found: ${results.filter(r => r.status === 'not_found').map(r => r.label).join(', ') || 'none'}`)

  return results
}

// ─────────────────────────────────────────────────────────────────
// PARSE AUDIT RESPONSE
// Handles messy LLM output — extracts JSON, normalizes statuses
// ─────────────────────────────────────────────────────────────────

interface AuditResult {
  status: 'confirmed' | 'not_found' | 'unknown'
  url: string | null
}

function parseAuditResponse(response: string): Map<string, AuditResult> {
  const results = new Map<string, AuditResult>()

  try {
    // Strip markdown code blocks if present
    let cleaned = response
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    // Find the JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[Profile Audit] No JSON found in response')
      return results
    }

    const parsed = JSON.parse(jsonMatch[0])

    for (const [platform, data] of Object.entries(parsed)) {
      const entry = data as any

      // Handle both { status, url } format and simple string format
      let status: string
      let url: string | null = null

      if (typeof entry === 'string') {
        status = entry
      } else if (typeof entry === 'object' && entry !== null) {
        status = entry.status || 'UNKNOWN'
        url = entry.url || entry.profile_url || null
      } else {
        status = 'UNKNOWN'
      }

      // Normalize status
      const normalized = status.toUpperCase().trim()
      let finalStatus: 'confirmed' | 'not_found' | 'unknown'

      if (normalized === 'FOUND' || normalized === 'CONFIRMED' || normalized === 'YES' || normalized === 'ACTIVE') {
        finalStatus = 'confirmed'
      } else if (normalized === 'NOT_FOUND' || normalized === 'NOT FOUND' || normalized === 'NO' || normalized === 'INACTIVE') {
        finalStatus = 'not_found'
      } else {
        finalStatus = 'unknown'
      }

      // Validate URL if present
      if (url && url !== 'null' && url !== 'N/A' && url !== 'n/a') {
        try {
          new URL(url) // Validate it's a real URL
        } catch {
          url = null
        }
      } else {
        url = null
      }

      results.set(platform, { status: finalStatus, url })
    }
  } catch (error) {
    console.error('[Profile Audit] Parse error:', error)
  }

  return results
}

// ─────────────────────────────────────────────────────────────────
// GET AGENT PRESENCE (cached from DB)
// Call this from the recommendation engine. Returns stored
// profile data without making a new API call.
// ─────────────────────────────────────────────────────────────────

export async function getAgentPresence(userId: string): Promise<PlatformPresence[]> {
  try {
    const { data, error } = await supabase
      .from('agent_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('platform')

    if (error) {
      console.error('[Profile Audit] Failed to fetch presence:', error)
      return []
    }

    if (!data || data.length === 0) {
      return [] // No audit has been run yet
    }

    return data.map(row => ({
      platform: row.platform,
      label: PLATFORMS.find(p => p.key === row.platform)?.label || row.platform,
      status: row.status as 'confirmed' | 'not_found' | 'unknown',
      source: row.source as 'llm_audit' | 'citation' | 'user_reported',
      profileUrl: row.profile_url || undefined,
      checkedAt: row.checked_at ? new Date(row.checked_at) : undefined,
    }))
  } catch (err) {
    console.error('[Profile Audit] DB error:', err)
    return []
  }
}

// ─────────────────────────────────────────────────────────────────
// CHECK IF AUDIT IS STALE
// Returns true if the audit is older than `maxAgeDays` or
// has never been run. Use this to decide whether to re-audit.
// ─────────────────────────────────────────────────────────────────

export async function isAuditStale(userId: string, maxAgeDays: number = 7): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('agent_profiles')
      .select('checked_at')
      .eq('user_id', userId)
      .order('checked_at', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      return true // Never audited
    }

    const lastCheck = new Date(data[0].checked_at)
    const ageMs = Date.now() - lastCheck.getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)

    return ageDays > maxAgeDays
  } catch {
    return true
  }
}

// ─────────────────────────────────────────────────────────────────
// UPDATE FROM USER INPUT
// When an agent confirms "I already have a Zillow profile" or
// "I don't have Bing Places", store that as user_reported (highest
// confidence source).
// ─────────────────────────────────────────────────────────────────

export async function updateProfileStatus(
  userId: string,
  agentName: string,
  platform: PlatformKey,
  status: 'confirmed' | 'not_found',
  profileUrl?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('agent_profiles')
      .upsert(
        {
          user_id: userId,
          agent_name: agentName,
          platform,
          status,
          source: 'user_reported',
          profile_url: profileUrl || null,
          checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,platform',
        }
      )

    if (error) {
      console.error(`[Profile Audit] Failed to update ${platform}:`, error)
    }
  } catch (err) {
    console.error(`[Profile Audit] DB error updating ${platform}:`, err)
  }
}

// ─────────────────────────────────────────────────────────────────
// ENRICH FROM CITATIONS
// After a scan, call this to update presence based on citation
// data. Weaker signal than LLM audit, but free and automatic.
// Only upgrades status (won't overwrite confirmed → unknown).
// ─────────────────────────────────────────────────────────────────

export async function enrichFromCitations(
  userId: string,
  agentName: string,
  citationSources: Map<string, number>
): Promise<void> {
  const platformMappings: Record<string, PlatformKey> = {
    'zillow.com': 'zillow',
    'homes.com': 'homes_com',
    'realtor.com': 'realtor_com',
    'fastexpert.com': 'fastexpert',
  }

  for (const [domain] of citationSources) {
    for (const [pattern, platformKey] of Object.entries(platformMappings)) {
      if (domain.includes(pattern)) {
        // Only upsert if we don't already have a confirmed or user_reported entry
        const { data: existing } = await supabase
          .from('agent_profiles')
          .select('status, source')
          .eq('user_id', userId)
          .eq('platform', platformKey)
          .single()

        // Don't downgrade user_reported or confirmed from LLM audit
        if (existing?.source === 'user_reported') continue
        if (existing?.status === 'confirmed' && existing?.source === 'llm_audit') continue

        await supabase
          .from('agent_profiles')
          .upsert(
            {
              user_id: userId,
              agent_name: agentName,
              platform: platformKey,
              status: 'confirmed',
              source: 'citation',
              checked_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,platform',
            }
          )
      }
    }
  }
}
