import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown, Minus, AlertCircle, Users, Search, Target, Play, Eye } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeScans, generateRecommendations } from '@/lib/recommendations'
import Recommendations from '@/components/recommendations'
import { VisibilityTrendChart, ProviderBreakdownChart, CompetitorSpotlight } from '@/components/charts'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  let agents: any[] = []
  let recentScans: any[] = []
  let visibilityHistory: any[] = []
  let overallScore = 0

  if (user) {
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (workspace) {
      const { data: agentData } = await supabaseAdmin
        .from('agents')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })

      agents = agentData || []

      if (agents.length > 0) {
        const scores = agents.filter(a => a.visibility_score !== null).map(a => a.visibility_score)
        if (scores.length > 0) {
          overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        }

        const agentIds = agents.map(a => a.id)
        
        // Get scans
        const { data: scanData } = await supabaseAdmin
          .from('scans')
          .select('*')
          .in('agent_id', agentIds)
          .order('scanned_at', { ascending: false })
          .limit(200)

        recentScans = scanData || []

        // Get visibility history for trend chart
        const { data: historyData } = await supabaseAdmin
          .from('visibility_scores')
          .select('*')
          .in('agent_id', agentIds)
          .order('created_at', { ascending: true })
          .limit(30)

        visibilityHistory = historyData || []
      }
    }
  }

  if (agents.length === 0) {
    return <EmptyState />
  }

  // Calculate provider scores
  const providerScores = calculateProviderScores(recentScans)
  
  // Generate recommendations
  const agentName = agents[0]?.name || 'Agent'
  const analysis = analyzeScans(recentScans, agentName)
  const recommendations = generateRecommendations(analysis)

  // Format data for charts
  const trendData = visibilityHistory.map(h => ({
    date: new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: h.overall_score
  }))

  const providerChartData = [
    { provider: 'Perplexity', score: providerScores.perplexity, color: '#3b82f6' },
    { provider: 'ChatGPT', score: providerScores.chatgpt, color: '#10b981' },
    { provider: 'Gemini', score: providerScores.gemini, color: '#eab308' },
  ]

  const topCompetitor = analysis.topCompetitors[0]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Monitor your AI visibility across all platforms</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/dashboard/agents" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-notable-100 text-notable-700 rounded-lg hover:bg-notable-200 transition-colors"
          >
            <Play className="h-4 w-4" />
            Run Scan
          </Link>
          <Link 
            href="/dashboard/competitors" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Eye className="h-4 w-4" />
            View Competitors
          </Link>
        </div>
      </div>
      
      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <ScoreCard 
          title="Overall Score"
          score={overallScore}
          change={0}
          trend="neutral"
          highlight={true}
        />
        <ScoreCard 
          title="Perplexity"
          score={providerScores.perplexity}
          change={0}
          trend={providerScores.perplexity > 0 ? "up" : "neutral"}
        />
        <ScoreCard 
          title="ChatGPT"
          score={providerScores.chatgpt}
          change={0}
          trend={providerScores.chatgpt > 0 ? "up" : "neutral"}
        />
        <ScoreCard 
          title="Gemini"
          score={providerScores.gemini}
          change={0}
          trend={providerScores.gemini > 0 ? "up" : "neutral"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Visibility Trend */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Visibility Trend</h2>
          <VisibilityTrendChart data={trendData} />
        </div>

        {/* Provider Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Score by Provider</h2>
          <ProviderBreakdownChart data={providerChartData} />
        </div>
      </div>

      {/* Competitor Spotlight + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Competitor Spotlight */}
        {topCompetitor && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Competitor</h2>
            <CompetitorSpotlight 
              competitor={topCompetitor.name}
              competitorMentions={topCompetitor.mentions}
              yourMentions={analysis.mentions}
            />
            <Link 
              href="/dashboard/competitors" 
              className="block text-center text-sm text-notable-600 hover:text-notable-700 mt-4"
            >
              View all competitors →
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="card flex flex-col justify-between">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-notable-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-notable-600" />
                </div>
                <span className="text-gray-600">Agents Monitored</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{agents.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Search className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-gray-600">Total Scans</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{recentScans.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Target className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="text-gray-600">Mentions Found</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{analysis.mentions}</span>
            </div>
          </div>
        </div>

        {/* Agent Card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Agent</h2>
          {agents.slice(0, 1).map((agent) => (
            <div key={agent.id} className="text-center">
              <div className="w-16 h-16 bg-notable-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-notable-600">
                  {agent.name.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <p className="font-semibold text-gray-900">{agent.name}</p>
              <p className="text-sm text-gray-500">{agent.brokerage}</p>
              <p className="text-sm text-gray-500">{agent.city}, {agent.state}</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-3xl font-bold text-notable-600">{agent.visibility_score ?? '--'}</p>
                <p className="text-xs text-gray-500">Visibility Score</p>
              </div>
            </div>
          ))}
          <Link 
            href="/dashboard/agents" 
            className="block text-center text-sm text-notable-600 hover:text-notable-700 mt-4"
          >
            Manage agents →
          </Link>
        </div>
      </div>

      {/* Recommendations Section */}
      {recentScans.length > 0 && recommendations.length > 0 && (
        <div className="mb-8">
          <Recommendations recommendations={recommendations} />
        </div>
      )}

      {/* Recent Scans */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Scans</h2>
          <Link href="/dashboard/scans" className="text-notable-600 hover:text-notable-700 text-sm font-medium">
            View All →
          </Link>
        </div>
        {recentScans.length === 0 ? (
          <p className="text-gray-500">No scans yet. Run a scan from the Agents page.</p>
        ) : (
          <div className="space-y-2">
            {recentScans.slice(0, 5).map((scan) => (
              <div key={scan.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${scan.mentioned ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600 truncate max-w-md">{scan.prompt_rendered}</span>
                </div>
                <span className="text-xs text-gray-400">{scan.llm_provider}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function calculateProviderScores(scans: any[]) {
  const providers = ['perplexity', 'chatgpt', 'gemini']
  const scores: Record<string, number> = {}

  for (const provider of providers) {
    const providerScans = scans.filter(s => s.llm_provider === provider)
    if (providerScans.length > 0) {
      const mentioned = providerScans.filter(s => s.mentioned).length
      scores[provider] = Math.round((mentioned / providerScans.length) * 100)
    } else {
      scores[provider] = 0
    }
  }

  return scores
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-notable-100 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="h-8 w-8 text-notable-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">No agents yet</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        Add your first agent to start monitoring your AI visibility across ChatGPT, Claude, Gemini, and more.
      </p>
      <Link href="/dashboard/agents/new" className="btn-primary inline-flex items-center">
        Add Your First Agent
        <ArrowRight className="ml-2 h-5 w-5" />
      </Link>
    </div>
  )
}

function ScoreCard({ 
  title, 
  score, 
  change, 
  trend,
  highlight = false
}: { 
  title: string
  score: number
  change: number
  trend: 'up' | 'down' | 'neutral'
  highlight?: boolean
}) {
  return (
    <div className={`card ${highlight ? 'ring-2 ring-notable-500 ring-offset-2' : ''}`}>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <div className="flex items-end justify-between">
        <span className={`text-3xl font-bold ${highlight ? 'text-notable-600' : 'text-gray-900'}`}>{score}</span>
        <div className={`flex items-center text-sm ${
          trend === 'up' ? 'text-green-600' : 
          trend === 'down' ? 'text-red-600' : 
          'text-gray-500'
        }`}>
          {trend === 'up' && <TrendingUp className="h-4 w-4 mr-1" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4 mr-1" />}
          {trend === 'neutral' && <Minus className="h-4 w-4 mr-1" />}
          {change !== 0 && <span>{change > 0 ? '+' : ''}{change}</span>}
        </div>
      </div>
    </div>
  )
}
