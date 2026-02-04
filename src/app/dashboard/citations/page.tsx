import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserSubscription, canViewScans } from '@/lib/subscription'
import UpgradePrompt from '@/components/upgrade-prompt'
import { Link2, ExternalLink, TrendingUp, AlertCircle } from 'lucide-react'

interface SourceData {
  source: string
  count: number
  url?: string
  providers: string[]
}

export default async function CitationsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const subscription = await getUserSubscription(userId)
  
  if (!canViewScans(subscription)) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Citations & Sources</h1>
          <p className="text-gray-600">See where AI gets its information about agents</p>
        </div>
        <UpgradePrompt 
          feature="Citation Analysis" 
          description="Discover which data sources AI assistants use when recommending agents, and optimize your presence on the platforms that matter."
        />
      </div>
    )
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  let sources: SourceData[] = []
  let totalScans = 0

  if (user) {
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (workspace) {
      const { data: agents } = await supabaseAdmin
        .from('agents')
        .select('id')
        .eq('workspace_id', workspace.id)

      if (agents && agents.length > 0) {
        const agentIds = agents.map(a => a.id)

        const { data: scans } = await supabaseAdmin
          .from('scans')
          .select('sources_cited, llm_provider')
          .in('agent_id', agentIds)
          .not('sources_cited', 'is', null)
          .order('scanned_at', { ascending: false })
          .limit(500)

        totalScans = scans?.length || 0

        const sourceMap = new Map<string, { count: number; url?: string; providers: Set<string> }>()

        scans?.forEach(scan => {
          if (scan.sources_cited && Array.isArray(scan.sources_cited)) {
            scan.sources_cited.forEach((src: any) => {
              const name = src.source
              if (!name) return

              if (!sourceMap.has(name)) {
                sourceMap.set(name, {
                  count: 0,
                  url: src.url,
                  providers: new Set()
                })
              }
              
              const data = sourceMap.get(name)!
              data.count += src.count || 1
              data.providers.add(scan.llm_provider)
              if (src.url && !data.url) {
                data.url = src.url
              }
            })
          }
        })

        sources = Array.from(sourceMap.entries())
          .map(([source, data]) => ({
            source,
            count: data.count,
            url: data.url,
            providers: Array.from(data.providers)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20)
      }
    }
  }

  const getSourceIcon = (source: string) => {
    const s = source.toLowerCase()
    if (s.includes('zillow')) return '🏠'
    if (s.includes('realtor')) return '🔑'
    if (s.includes('redfin')) return '🔴'
    if (s.includes('google')) return '🔍'
    if (s.includes('yelp')) return '⭐'
    if (s.includes('homes.com')) return '🏡'
    if (s.includes('mls')) return '📋'
    if (s.includes('fastexpert')) return '⚡'
    if (s.includes('homelight')) return '💡'
    return '🔗'
  }

  const getRecommendation = (source: string): string => {
    const s = source.toLowerCase()
    if (s.includes('zillow')) return 'Claim your Zillow profile and get more reviews'
    if (s.includes('realtor')) return 'Update your Realtor.com profile with recent sales'
    if (s.includes('google')) return 'Build your Google Business reviews to 50+'
    if (s.includes('yelp')) return 'Respond to Yelp reviews and add photos'
    if (s.includes('homes.com')) return 'Create/optimize your Homes.com agent profile'
    if (s.includes('mls')) return 'Ensure your MLS listings are complete with photos'
    if (s.includes('fastexpert')) return 'Verify your FastExpert profile and rankings'
    return 'Ensure your profile is complete and up-to-date'
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Citations & Sources</h1>
        <p className="text-gray-600">Where AI assistants get their information about agents</p>
      </div>

      {/* Insight Banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Why This Matters</h3>
            <p className="text-sm text-blue-700 mt-1">
              AI assistants pull data from these sources when recommending agents. 
              If you're not optimized on the top sources, you won't get recommended — even if you're a top producer.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-notable-100 rounded-full flex items-center justify-center">
            <Link2 className="h-6 w-6 text-notable-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{sources.length}</p>
            <p className="text-sm text-gray-600">Sources Detected</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{sources[0]?.source || 'N/A'}</p>
            <p className="text-sm text-gray-600">Top Source</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <ExternalLink className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalScans}</p>
            <p className="text-sm text-gray-600">Scans Analyzed</p>
          </div>
        </div>
      </div>

      {/* Sources Table */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Data Sources</h2>
        {sources.length === 0 ? (
          <p className="text-gray-500">No source data yet. Run some scans to see where AI gets its information.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Rank</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Source</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Citations</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Used By</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source, index) => (
                  <tr key={source.source} className="border-b border-gray-100 hover:bg-gray-50">
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
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getSourceIcon(source.source)}</span>
                        <span className="font-medium text-gray-900">{source.source}</span>
                        {source.url && (
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-notable-600 hover:text-notable-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                        {source.count}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {source.providers.map(provider => (
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
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {getRecommendation(source.source)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Optimization Tips */}
      {sources.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Optimization Priority</h2>
          <p className="text-gray-600 mb-4">
            Focus on these platforms first — they're the most cited by AI assistants:
          </p>
          <div className="space-y-3">
            {sources.slice(0, 3).map((source, index) => (
              <div key={source.source} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  'bg-orange-300 text-orange-800'
                }`}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{source.source}</p>
                  <p className="text-sm text-gray-600">{getRecommendation(source.source)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
