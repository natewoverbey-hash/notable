import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { Download, Users, Search, TrendingUp, Database, BarChart3 } from 'lucide-react'
import Link from 'next/link'

// Add your Clerk user ID here
const ADMIN_USER_IDS = ['user_39GX6ddhwNFDKgReYooPZ8KB8NO']

export default async function AdminDashboard() {
  const { userId } = await auth()
  
  if (!userId || !ADMIN_USER_IDS.includes(userId)) {
    redirect('/dashboard')
  }

  // Aggregate stats across ALL users
  const { count: totalUsers } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: totalAgents } = await supabaseAdmin
    .from('agents')
    .select('*', { count: 'exact', head: true })

  const { count: totalScans } = await supabaseAdmin
    .from('scans')
    .select('*', { count: 'exact', head: true })

  const { data: recentScans } = await supabaseAdmin
    .from('scans')
    .select('*')
    .order('scanned_at', { ascending: false })
    .limit(1000)

  // Calculate aggregate insights
  const mentionRate = recentScans 
    ? Math.round((recentScans.filter(s => s.mentioned).length / recentScans.length) * 100)
    : 0

  // Provider breakdown
  const providerStats = recentScans?.reduce((acc, scan) => {
    const provider = scan.llm_provider
    if (!acc[provider]) {
      acc[provider] = { total: 0, mentioned: 0 }
    }
    acc[provider].total++
    if (scan.mentioned) acc[provider].mentioned++
    return acc
  }, {} as Record<string, { total: number; mentioned: number }>) || {}

  // Source citations aggregation
  const sourceCounts: Record<string, number> = {}
  recentScans?.forEach(scan => {
    if (scan.sources_cited && Array.isArray(scan.sources_cited)) {
      scan.sources_cited.forEach((source: any) => {
        const name = source.source || source.name
        if (name) {
          sourceCounts[name] = (sourceCounts[name] || 0) + (source.count || 1)
        }
      })
    }
  })
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Top competitors mentioned
  const competitorCounts: Record<string, number> = {}
  recentScans?.forEach(scan => {
    if (scan.competitors_mentioned && Array.isArray(scan.competitors_mentioned)) {
      scan.competitors_mentioned.forEach((comp: any) => {
        const name = comp.name
        if (name) {
          competitorCounts[name] = (competitorCounts[name] || 0) + 1
        }
      })
    }
  })
  const topCompetitors = Object.entries(competitorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Platform-wide insights and data</p>
          </div>
          <Link 
            href="/admin/export"
            className="inline-flex items-center gap-2 px-4 py-2 bg-notable-600 text-white rounded-lg hover:bg-notable-700"
          >
            <Download className="h-4 w-4" />
            Export All Data
          </Link>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalUsers || 0}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Database className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalAgents || 0}</p>
                <p className="text-sm text-gray-600">Total Agents</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Search className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalScans || 0}</p>
                <p className="text-sm text-gray-600">Total Scans</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mentionRate}%</p>
                <p className="text-sm text-gray-600">Avg Mention Rate</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Provider Performance */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Provider Mention Rates
            </h2>
            <div className="space-y-4">
              {Object.entries(providerStats).map(([provider, stats]) => {
                const s = stats as { total: number; mentioned: number }
                const rate = Math.round((s.mentioned / s.total) * 100)
                return (
                  <div key={provider}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium capitalize">{provider}</span>
                      <span className="text-gray-600">{rate}% ({s.mentioned}/{s.total})</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-notable-600 h-2 rounded-full" 
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Sources */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Top Cited Sources (Blog Insight 📝)
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              "Where AI gets its real estate data"
            </p>
            <div className="space-y-2">
              {topSources.map(([source, count], index) => (
                <div key={source} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-gray-900">{source}</span>
                  </div>
                  <span className="text-sm text-gray-600">{count} citations</span>
                </div>
              ))}
              {topSources.length === 0 && (
                <p className="text-gray-500 text-sm">No source data yet</p>
              )}
            </div>
          </div>

          {/* Top Competitors */}
          <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Most Recommended Agents Across Platform (Blog Insight 📝)
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              "The agents AI recommends most in your markets"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topCompetitors.map(([name, count], index) => (
                <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${index < 3 ? 'text-notable-600' : 'text-gray-500'}`}>
                      #{index + 1}
                    </span>
                    <span className="text-gray-900 text-sm">{name}</span>
                  </div>
                  <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                    {count}x
                  </span>
                </div>
              ))}
              {topCompetitors.length === 0 && (
                <p className="text-gray-500 text-sm">No competitor data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Blog Ideas Section */}
        <div className="mt-8 bg-gradient-to-r from-notable-50 to-blue-50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">📝 Content Ideas From Your Data</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• "Which data sources do AI assistants trust most for real estate?" (Use top sources data)</li>
            <li>• "Why {mentionRate}% of agents are invisible to AI search" (Use mention rate)</li>
            <li>• "ChatGPT vs Perplexity: Which recommends better agents?" (Use provider comparison)</li>
            <li>• "The top 10 most AI-visible agents in [Market]" (Use competitor data with permission)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
