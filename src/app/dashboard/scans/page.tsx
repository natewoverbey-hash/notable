import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserSubscription, canViewScans } from '@/lib/subscription'
import UpgradePrompt from '@/components/upgrade-prompt'
import ScansExplorer from '@/components/scans-explorer'

export default async function ScansPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const subscription = await getUserSubscription(userId)
  const showUpgradeBanner = !subscription.isActive && subscription.hasUsedFreeScan

  if (!canViewScans(subscription)) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Scan Results</h1>
          <p className="text-gray-600">
            See what AI assistants are saying about your agents
          </p>
        </div>
        <UpgradePrompt
          feature="Scan Results"
          description="Run your first free scan to see what AI assistants say about you."
        />
      </div>
    )
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  let scans: any[] = []
  let agents: any[] = []
  let batches: any[] = []

  if (user) {
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (workspace) {
      const { data: agentData } = await supabaseAdmin
        .from('agents')
        .select('id, name')
        .eq('workspace_id', workspace.id)

      agents = agentData || []
      const agentIds = agents.map(a => a.id)

      if (agentIds.length > 0) {
        // Get batches for context
        const { data: batchData } = await supabaseAdmin
          .from('scan_batches')
          .select('*')
          .in('agent_id', agentIds)
          .order('started_at', { ascending: false })
          .limit(20)

        batches = batchData || []

        // Get all scans
        const { data: scanData } = await supabaseAdmin
          .from('scans')
          .select('*')
          .in('agent_id', agentIds)
          .order('scanned_at', { ascending: false })
          .limit(500)

        scans = scanData || []
      }
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Scan Results</h1>
        <p className="text-gray-600">
          Investigate what AI assistants are saying — and sourcing — about you
        </p>
      </div>

      {showUpgradeBanner && (
        <div className="mb-6 p-4 bg-gradient-to-r from-notable-500 to-notable-600 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">You&apos;ve used your free scan!</h3>
              <p className="text-sm text-notable-100">
                Upgrade to run weekly scans and track your progress over time.
              </p>
            </div>
            <a
              href="/pricing"
              className="px-4 py-2 bg-white text-notable-600 font-medium rounded-lg hover:bg-notable-50 transition-colors"
            >
              Upgrade Now
            </a>
          </div>
        </div>
      )}

      {scans.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            No scans yet. Run a scan from the Agents page to see results.
          </p>
        </div>
      ) : (
        <ScansExplorer
          scans={scans}
          agents={agents}
          batches={batches}
        />
      )}
    </div>
  )
}
