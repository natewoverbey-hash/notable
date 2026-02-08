// ─────────────────────────────────────────────────────────────────
// API Route: /api/profile-audit
//
// POST - Run a new profile audit for the authenticated user
// GET  - Get cached profile presence data
//
// This route can be called:
//   1. Automatically during a scan (if audit is stale)
//   2. Manually from the dashboard (user clicks "Check my profiles")
//   3. On agent setup (first-time onboarding)
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  runProfileAudit,
  getAgentPresence,
  isAuditStale,
  updateProfileStatus,
  type PlatformKey,
} from '@/lib/profile-audit'

// GET /api/profile-audit — return cached presence data
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const presence = await getAgentPresence(userId)
    const stale = await isAuditStale(userId)

    return NextResponse.json({
      presence,
      isStale: stale,
      hasBeenAudited: presence.length > 0,
    })
  } catch (error) {
    console.error('[Profile Audit API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 })
  }
}

// POST /api/profile-audit — run a new audit or update a specific platform
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Option 1: Run full audit
    if (body.action === 'audit') {
      const { agentName, location } = body

      if (!agentName || !location) {
        return NextResponse.json(
          { error: 'agentName and location are required' },
          { status: 400 }
        )
      }

      // Check if audit is fresh enough (don't re-run within 24 hours unless forced)
      if (!body.force) {
        const stale = await isAuditStale(userId, 1) // 1 day
        if (!stale) {
          const presence = await getAgentPresence(userId)
          return NextResponse.json({
            presence,
            cached: true,
            message: 'Audit is recent. Use force: true to re-run.',
          })
        }
      }

      const presence = await runProfileAudit(userId, agentName, location)

      return NextResponse.json({
        presence,
        cached: false,
        auditedAt: new Date().toISOString(),
      })
    }

    // Option 2: User manually confirms/denies a specific platform
    if (body.action === 'update') {
      const { agentName, platform, status, profileUrl } = body

      if (!platform || !status || !agentName) {
        return NextResponse.json(
          { error: 'agentName, platform, and status are required' },
          { status: 400 }
        )
      }

      if (!['confirmed', 'not_found'].includes(status)) {
        return NextResponse.json(
          { error: 'status must be "confirmed" or "not_found"' },
          { status: 400 }
        )
      }

      await updateProfileStatus(
        userId,
        agentName,
        platform as PlatformKey,
        status,
        profileUrl
      )

      return NextResponse.json({ success: true, platform, status })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Profile Audit API] POST error:', error)
    return NextResponse.json({ error: 'Failed to run profile audit' }, { status: 500 })
  }
}
