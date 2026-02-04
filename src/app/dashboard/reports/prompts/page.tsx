import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserSubscription, canViewScans } from '@/lib/subscription'
import UpgradePrompt from '@/components/upgrade-prompt'
import { CheckCircle, XCircle, Minus, Filter, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import prompts from '@/lib/prompts/real-estate.json'

interface PromptPerformance {
  promptId: number
  promptTemplate: string
  category: string
  providers: {
    perplexity: { mentioned: boolean; rank: number | null } | null
    chatgpt: { mentioned: boolean; rank: number | null } | null
    gemini: { mentioned: boolean; rank: number | null } | null
  }
  overallScore: number
  mentionCount: number
}

export default async function PromptPerformancePage({
  searchParams,
}: {
  searchParams: { filter?: string; category?: string }
}) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const subscription = await getUserSubscription(userId)
  
  if (!canViewScans(subscription)) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Prompt Performance</h1>
          <p className="text-gray-600">See which searches you're winning and losing</p>
        </div>
        <UpgradePrompt 
          feature="Prompt Performance Report" 
          description="See exactly which AI prompts mention you and which don't, so you know where to focus your optimization efforts."
        />
      </div>
    )
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  let promptPerformance: PromptPerformance[] = []
  let categories: string[] = []

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

        // Get the most recent scan batch
        const { data: latestBatch } = await supabaseAdmin
          .from('scan_batches')
          .select('id')
          .in('agent_id', agentIds)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .single()

        if (latestBatch) {
          // Get all scans from the latest batch
          const { data: scans } = await supabaseAdmin
            .from('scans')
            .select('prompt_id, llm_provider, mentioned, mention_rank')
            .eq('batch_id', latestBatch.id)

          // Build prompt performance map
          const promptMap = new Map<number, PromptPerformance>()

          // Initialize from prompts library
          const promptsData = prompts.prompts as Array<{
            id: number
            template: string
            category: string
          }>

          // Get unique categories
          categories = [...new Set(promptsData.map(p => p.category))]

          promptsData.forEach(prompt => {
            promptMap.set(prompt.id, {
              promptId: prompt.id,
              promptTemplate: prompt.template,
              category: prompt.category,
              providers: {
                perplexity: null,
                chatgpt: null,
                gemini: null,
              },
              overallScore: 0,
              mentionCount: 0,
            })
          })

          // Fill in scan results
          scans?.forEach(scan => {
            const perf = promptMap.get(scan.prompt_id)
            if (perf) {
              const provider = scan.llm_provider as 'perplexity' | 'chatgpt' | 'gemini'
              if (provider in perf.providers) {
                perf.providers[provider] = {
                  mentioned: scan.mentioned,
                  rank: scan.mention_rank,
                }
              }
            }
          })

          // Calculate overall scores
          promptMap.forEach(perf => {
            const providers = Object.values(perf.providers).filter(p => p !== null)
            if (providers.length > 0) {
              perf.mentionCount = providers.filter(p => p?.mentioned).length
              perf.overallScore = Math.round((perf.mentionCount / providers.length) * 100)
            }
          })

          promptPerformance = Array.from(promptMap.values())
            .filter(p => Object.values(p.providers).some(pr => pr !== null)) // Only show prompts that were scanned
        }
      }
    }
  }

  // Apply filters
  const filter = searchParams.filter || 'all'
  const categoryFilter = searchParams.category || 'all'

  let filteredPrompts = promptPerformance

  if (filter === 'mentioned') {
    filteredPrompts = filteredPrompts.filter(p => p.mentionCount > 0)
  } else if (filter === 'missing') {
    filteredPrompts = filteredPrompts.filter(p => p.mentionCount === 0)
  } else if (filter === 'partial') {
    filteredPrompts = filteredPrompts.filter(p => p.mentionCount > 0 && p.overallScore < 100)
  }

  if (categoryFilter !== 'all') {
    filteredPrompts = filteredPrompts.filter(p => p.category === categoryFilter)
  }

  // Sort by overall score (worst first to highlight opportunities)
  filteredPrompts.sort((a, b) => a.overallScore - b.overallScore)

  // Calculate summary stats
  const totalPrompts = promptPerformance.length
  const fullyMentioned = promptPerformance.filter(p => p.overallScore === 100).length
  const partialMentioned = promptPerformance.filter(p => p.overallScore > 0 && p.overallScore < 100).length
  const notMentioned = promptPerformance.filter(p => p.overallScore === 0).length

  const ProviderBadge = ({ result }: { result: { mentioned: boolean; rank: number | null } | null }) => {
    if (result === null) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">
          <Minus className="h-3 w-3" />
          N/A
        </span>
      )
    }
    if (result.mentioned) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3" />
          #{result.rank || '?'}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-100 text-red-700">
        <XCircle className="h-3 w-3" />
        Miss
      </span>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Prompt Performance</h1>
        <p className="text-gray-600">See which AI searches mention you and which don't</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Filter className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalPrompts}</p>
              <p className="text-sm text-gray-600">Total Prompts</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{fullyMentioned}</p>
              <p className="text-sm text-gray-600">Fully Visible</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{partialMentioned}</p>
              <p className="text-sm text-gray-600">Partial Visibility</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{notMentioned}</p>
              <p className="text-sm text-gray-600">Not Mentioned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex gap-2">
              
                href="/dashboard/reports/prompts?filter=all"
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'all' 
                    ? 'bg-notable-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </a>
              
                href="/dashboard/reports/prompts?filter=missing"
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'missing' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Missing
              </a>
              
                href="/dashboard/reports/prompts?filter=partial"
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'partial' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Partial
              </a>
              
                href="/dashboard/reports/prompts?filter=mentioned"
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'mentioned' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mentioned
              </a>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="flex gap-2 flex-wrap">
              
                href={`/dashboard/reports/prompts?filter=${filter}&category=all`}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  categoryFilter === 'all' 
                    ? 'bg-notable-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </a>
              {categories.map(cat => (
                
                  key={cat}
                  href={`/dashboard/reports/prompts?filter=${filter}&category=${encodeURIComponent(cat)}`}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
                    categoryFilter === cat 
                      ? 'bg-notable-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Performance Table */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {filter === 'missing' ? 'Prompts Where You\'re Not Showing Up' :
           filter === 'partial' ? 'Prompts With Partial Visibility' :
           filter === 'mentioned' ? 'Prompts Where You\'re Visible' :
           'All Prompts'}
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({filteredPrompts.length} prompts)
          </span>
        </h2>
        
        {filteredPrompts.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">
            {filter === 'missing' ? '🎉 Great news! You\'re showing up in all scanned prompts.' :
             filter === 'mentioned' ? 'No prompts with mentions yet. Run a scan to see results.' :
             'No prompts match the current filters.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Prompt</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Perplexity
                    </span>
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      ChatGPT
                    </span>
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      Gemini
                    </span>
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrompts.map((prompt) => (
                  <tr key={prompt.promptId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-900 max-w-md truncate" title={prompt.promptTemplate}>
                        {prompt.promptTemplate.length > 70 
                          ? prompt.promptTemplate.substring(0, 70) + '...' 
                          : prompt.promptTemplate}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 capitalize">
                        {prompt.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ProviderBadge result={prompt.providers.perplexity} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ProviderBadge result={prompt.providers.chatgpt} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ProviderBadge result={prompt.providers.gemini} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-12 py-1 rounded-full text-sm font-medium ${
                        prompt.overallScore === 100 ? 'bg-green-100 text-green-700' :
                        prompt.overallScore > 0 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {prompt.overallScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Insight Box */}
      {notMentioned > 0 && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Visibility Gap Detected</h3>
              <p className="text-sm text-red-700 mt-1">
                You're not showing up in {notMentioned} prompt{notMentioned > 1 ? 's' : ''}. 
                Click "Missing" above to see which searches you're invisible in, then check the 
                Citations page to see which data sources to optimize.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
