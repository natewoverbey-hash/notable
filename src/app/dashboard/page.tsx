import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown, Minus, AlertCircle, Users, Search, Target, Lightbulb } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeScans, generateRecommendations } from '@/lib/recommendations'
import Recommendations from '@/components/recommendations'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Get user's workspace and agents
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  let agents: any[] = []
  let recentScans: any[] = []
  let overallScore = 0

  if (user) {
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (workspace) {
      // Get agents
      const { data: agentData } = await supabaseAdmin
        .from('agents')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })

      agents = agentData || []

      // Calculate overall score (average of all agents)
      if (agents.length > 0) {
        const scores = agents.filter(a => a.visibility_score !== null).map(a => a.visibility_score)
        if (scores.length > 0) {
          overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        }
      }

      // Get recent scans (more for accurate stats)
      const agentIds = agents.map(a => a.id)
      if (agentIds.length > 0) {
        const { data: scanData } = await supabaseAdmin
          .from('scans')
          .select('*')
          .in('agent_id', agentIds)
          .order('scanned_at', { ascending: false })
          .limit(200)

        recentScans = scanData || []
      }
    }
  }

  if (agents.length === 0) {
    return <EmptyState />
  }

  // Get per-provider scores from recent scans
  const providerScores = calculateProviderScores(recentScans)

  // Generate recommendations
  const agentName = agents[0]?.name || 'Agent'
  const analysis = analyzeScans(recentScans, agentName)
  const recommendations = generateRecommendations(analysis)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Monitor your AI visibility across all platforms</p>
      </div>
      
      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ScoreCard 
          title="Overall Score"
          score={overallScore}
          change={0}
          trend="neutral"
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
          trend="neutral"
        />
        <ScoreCard 
          title="Claude"
          score={providerScores.claude}
          change={0}
          trend="neutral"
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-notable-100 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-notable-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
            <p className="text-sm text-gray-600">Agents Monitored</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Search className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{recentScans.length}</p>
            <p className="text-sm text-gray-600">Prompts Scanned</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <Target className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{recentScans.filter(s => s.mentioned).length}</p>
            <p className="text-sm text-gray-600">Mentions Found</p>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      {recentScans.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">Recommendations</h2>
          </div>
          <Recommendations recommendations={recommendations} />
        </div>
      )}

      {/* Agents List */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Agents</h2>
          <Link href="/dashboard/agents" className="text-notable-600 hover:text-notable-700 text-sm font-medium">
            View All →
          </Link>
        </div>
        <div className="space-y-3">
          {agents.slice(0, 3).map((agent) => (
            <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{agent.name}</p>
                <p className="text-sm text-gray-500">{agent.city}, {agent.state}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-notable-600">{agent.visibility_score ?? '--'}</p>
                <p className="text-xs text-gray-500">Visibility Score</p>
              </div>
            </div>
          ))}
        </div>
      </div>

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
  const providers = ['perplexity', 'chatgpt', 'claude', 'gemini']
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
  trend 
}: { 
  title: string
  score: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="card">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-gray-900">{score}</span>
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
