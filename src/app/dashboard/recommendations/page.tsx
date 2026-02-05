import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, Sparkles, ChevronDown, ChevronRight, ExternalLink, Zap, BookOpen, Target } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeScans, generateRecommendations, Recommendation } from '@/lib/recommendations'
import RecommendationCard from '@/components/recommendation-card'

export default async function RecommendationsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  let recommendations: Recommendation[] = []
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
        .limit(1)

      if (agents && agents.length > 0) {
        agentName = agents[0].name
        
        const { data: scans } = await supabaseAdmin
          .from('scans')
          .select('*')
          .eq('agent_id', agents[0].id)
          .order('created_at', { ascending: false })
          .limit(200)

        if (scans && scans.length > 0) {
          const analysis = analyzeScans(scans, agentName)
          recommendations = generateRecommendations(analysis)
        }
      }
    }
  }

  const highPriority = recommendations.filter(r => r.priority === 'high')
  const mediumPriority = recommendations.filter(r => r.priority === 'medium')
  const lowPriority = recommendations.filter(r => r.priority === 'low')

  const platformSolvable = recommendations.filter(r => r.actionability === 'platform_solvable')
  const totalTasks = recommendations.reduce((acc, r) => acc + (r.steps?.length || 1), 0)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="text-notable-600 hover:text-notable-700 text-sm font-medium flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Your Action Center</h1>
        <p className="text-gray-600 mt-1">
          Personalized recommendations to improve your AI visibility
        </p>
      </div>

      {/* Progress Overview */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Progress</h2>
          <span className="text-sm text-gray-500">{totalTasks} total tasks</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{highPriority.length}</div>
            <div className="text-sm text-red-700">High Priority</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{mediumPriority.length}</div>
            <div className="text-sm text-yellow-700">Medium Priority</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{lowPriority.length}</div>
            <div className="text-sm text-blue-700">Low Priority</div>
          </div>
        </div>

        {platformSolvable.length > 0 && (
          <div className="bg-gradient-to-r from-notable-50 to-purple-50 rounded-lg p-4 border border-notable-200">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-notable-600" />
              <span className="font-semibold text-notable-800">Quick Wins Available</span>
            </div>
            <p className="text-sm text-notable-700">
              {platformSolvable.length} recommendation{platformSolvable.length > 1 ? 's' : ''} can be solved with one click—we'll generate the content for you.
            </p>
          </div>
        )}
      </div>

      {/* Understanding AI Timelines */}
      <div className="card mb-8 bg-gray-50">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-gray-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">How AI Updates Work</h3>
            <p className="text-sm text-gray-600 mb-3">
              Different AI systems update at different speeds. Here's what to expect:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="font-medium text-gray-900">Perplexity</div>
                <div className="text-gray-500">1-2 weeks</div>
                <div className="text-xs text-gray-400 mt-1">Uses real-time web search</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="font-medium text-gray-900">ChatGPT</div>
                <div className="text-gray-500">4-8 weeks</div>
                <div className="text-xs text-gray-400 mt-1">Updates training data periodically</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="font-medium text-gray-900">Claude</div>
                <div className="text-gray-500">4-8 weeks</div>
                <div className="text-xs text-gray-400 mt-1">Uses training data + some search</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High Priority */}
      {highPriority.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-gray-900">High Priority</h2>
            <span className="text-sm text-gray-500">({highPriority.length})</span>
          </div>
          <div className="space-y-4">
            {highPriority.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority */}
      {mediumPriority.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-gray-900">Medium Priority</h2>
            <span className="text-sm text-gray-500">({mediumPriority.length})</span>
          </div>
          <div className="space-y-4">
            {mediumPriority.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Low Priority */}
      {lowPriority.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-gray-900">Low Priority</h2>
            <span className="text-sm text-gray-500">({lowPriority.length})</span>
          </div>
          <div className="space-y-4">
            {lowPriority.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {recommendations.length === 0 && (
        <div className="card text-center py-12">
          <Target className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Looking good!</h3>
          <p className="text-gray-600">
            Run a scan to get personalized recommendations for improving your AI visibility.
          </p>
          <Link href="/dashboard/agents" className="btn-primary mt-4 inline-block">
            Go to Agents
          </Link>
        </div>
      )}
    </div>
  )
}
