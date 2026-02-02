import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserSubscription, canViewCompetitors } from '@/lib/subscription'
import UpgradePrompt from '@/components/upgrade-prompt'
import { Users, TrendingUp, AlertTriangle } from 'lucide-react'

interface Competitor {
  name: string
  mentions: number
  avgRank: number
  prompts: string[]
  llmProviders: string[]
}

export default async function CompetitorsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Check subscription
  const subscription = await getUserSubscription(userId)
  
  if (!canViewCompetitors(subscription)) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Competitors</h1>
          <p className="text-gray-600">See who's showing up instead of your agents</p>
        </div>
        <UpgradePrompt 
          feature="Competitor Intelligence" 
          description="Discover which agents are being recommended instead of you, track their rankings across all AI platforms, and find opportunities to improve."
        />
      </div>
    )
  }

  // Get user's agents
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  let competitors: Competitor[] = []
  let totalScans = 0
  let agentName = ''

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

      if (agents && agents.length > 0) {
        agentName = agents[0].name
        const agentIds = agents.map(a => a.id)

        const { data: scans } = await supabaseAdmin
          .from('scans')
          .select('competitors_mentioned, prompt_rendered, llm_provider')
          .in('agent_id', agentIds)
          .not('competitors_mentioned', 'is', null)
          .order('scanned_at', { ascending: false })
          .limit(500)

        totalScans = scans?.length || 0

        const competitorMap = new Map<string, {
          mentions: number
          ranks: number[]
          prompts: Set<string>
          providers: Set<string>
        }>()

        scans?.forEach(scan => {
          if (scan.competitors_mentioned && Array.isArray(scan.competitors_mentioned)) {
            scan.competitors_mentioned.forEach((comp: any) => {
              const name = typeof comp === 'string' ? comp : comp.name
              const rank = typeof comp === 'object' ? comp.rank : 1
              
              if (!name) return

              if (!competitorMap.has(name)) {
                competitorMap.set(name, {
                  mentions: 0,
                  ranks: [],
                  prompts: new Set(),
                  providers: new Set()
                })
              }
              
              const data = competitorMap.get(name)!
              data.mentions++
              data.ranks.push(rank)
              data.prompts.add(scan.prompt_rendered)
              data.providers.add(scan.llm_provider)
            })
          }
        })

        competitors = Array.from(competitorMap.entries())
          .map(([name, data]) => ({
            name,
            mentions: data.mentions,
            avgRank: Math.round((data.ranks.reduce((a, b) => a + b, 0) / data.ranks.length) * 10) / 10,
            prompts: Array.from(data.prompts),
            llmProviders: Array.from(data.providers)
          }))
          .sort((a, b) => b.mentions - a.mentions)
          .slice(0, 20)
      }
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Competitors</h1>
        <p className="text-gray-600">See who's showing up instead of {agentName || 'your agents'}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{competitors.length}</p>
            <p className="text-sm text-gray-600">Competitors Found</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{competitors[0]?.mentions || 0}</p>
            <p className="text-sm text-gray-600">Top Competitor Mentions</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-notable-100 rounded-full flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-notable-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalScans}</p>
            <p className="text-sm text-gray-600">Scans Analyzed</p>
          </div>
        </div>
      </div>

      {/* Top Competitors Table */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Competitors</h2>
        {competitors.length === 0 ? (
          <p className="text-gray-500">No competitor data yet. Run some scans to see who's being recommended.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Rank</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Competitor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Mentions</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Avg Position</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">LLMs</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((competitor, index) => (
                  <tr key={competitor.name} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-200 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{competitor.name}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-700">
                        {competitor.mentions}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">#{competitor.avgRank}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {competitor.llmProviders.map(provider => (
                          <span 
                            key={provider} 
                            className={`px-2 py-0.5 text-xs rounded ${
                              provider === 'perplexity' ? 'bg-blue-100 text-blue-700' :
                              provider === 'chatgpt' ? 'bg-green-100 text-green-700' :
                              provider === 'claude' ? 'bg-purple-100 text-purple-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {provider}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Competitor Details */}
      {competitors.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Where They're Appearing</h2>
          <div className="space-y-4">
            {competitors.slice(0, 5).map((competitor) => (
              <div key={competitor.name} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <h3 className="font-medium text-gray-900 mb-2">{competitor.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {competitor.prompts.slice(0, 3).map((prompt, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt}
                    </span>
                  ))}
                  {competitor.prompts.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{competitor.prompts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
