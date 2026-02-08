import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield, RefreshCw } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import { getAgentPresence, PLATFORMS } from '@/lib/profile-audit'
import ProfileAuditCard from '@/components/profile-audit-card'

export default async function ProfileAuditPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Get agent info for display
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  let agentName = ''
  let agentId = ''

  if (user) {
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (workspace) {
      const { data: agents } = await supabaseAdmin
        .from('agents')
        .select('id, name')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (agents && agents.length > 0) {
        agentName = agents[0].name
        agentId = agents[0].id
      }
    }
  }

  // Get current audit data
  const presence = await getAgentPresence(userId)

  // Check if audit has been run
  const hasAuditData = presence.length > 0
  const lastChecked = presence[0]?.checkedAt
    ? new Date(presence[0].checkedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  // Build display data — show all platforms even if not in audit
  const displayPlatforms = PLATFORMS.map(p => {
    const audit = presence.find(a => a.platform === p.key)
    return {
      key: p.key,
      label: p.label,
      status: audit?.status || 'unknown',
      source: audit?.source || 'none',
      profileUrl: audit?.profileUrl || null,
    }
  })

  const confirmed = displayPlatforms.filter(p => p.status === 'confirmed')
  const notFound = displayPlatforms.filter(p => p.status === 'not_found')
  const unknown = displayPlatforms.filter(p => p.status === 'unknown')

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-notable-600 hover:text-notable-700 text-sm font-medium flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-notable-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Audit</h1>
            <p className="text-gray-600">
              Verify your online presence so we can give you accurate recommendations
            </p>
          </div>
        </div>
      </div>

      {/* Explainer */}
      <div className="card mb-6 bg-notable-50 border border-notable-200">
        <p className="text-sm text-notable-800">
          We scanned the web to check which platforms have a profile for{' '}
          <strong>{agentName || 'you'}</strong>. Review the results below and
          correct anything that&apos;s wrong — this ensures your recommendations
          are based on your <em>actual</em> gaps, not guesses.
        </p>
        {lastChecked && (
          <p className="text-xs text-notable-600 mt-2 flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Last checked: {lastChecked}
          </p>
        )}
      </div>

      {/* Summary */}
      {hasAuditData && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center py-4">
            <div className="text-2xl font-bold text-green-600">{confirmed.length}</div>
            <div className="text-sm text-gray-600">Found</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-2xl font-bold text-red-600">{notFound.length}</div>
            <div className="text-sm text-gray-600">Not Found</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-2xl font-bold text-gray-400">{unknown.length}</div>
            <div className="text-sm text-gray-600">Uncertain</div>
          </div>
        </div>
      )}

      {/* Platform Cards */}
      {hasAuditData ? (
        <div className="space-y-3 mb-8">
          {displayPlatforms.map(platform => (
            <ProfileAuditCard
              key={platform.key}
              platform={platform.key}
              label={platform.label}
              status={platform.status}
              source={platform.source}
              profileUrl={platform.profileUrl}
              agentName={agentName}
              userId={userId}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12 mb-8">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No audit data yet
          </h3>
          <p className="text-gray-600 mb-4">
            Run a scan first — the profile audit runs automatically alongside it.
          </p>
          <Link href="/dashboard/agents" className="btn-primary inline-block">
            Go to Agents
          </Link>
        </div>
      )}

      {/* Continue to Recommendations */}
      {hasAuditData && (
        <div className="card bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Looking good?</h3>
              <p className="text-sm text-gray-600">
                Once everything is correct, your recommendations will be tailored
                to your actual profile gaps.
              </p>
            </div>
            <Link
              href="/dashboard/recommendations"
              className="btn-primary whitespace-nowrap"
            >
              View Recommendations →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
