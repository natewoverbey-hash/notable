import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserSubscription, canViewScans } from '@/lib/subscription'
import UpgradePrompt from '@/components/upgrade-prompt'
import { CheckCircle, XCircle, Minus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import prompts from '@/lib/prompts/real-estate.json'

interface PromptPerformance {
  promptId: number
  promptTemplate: string
  category: string
  perplexity: { mentioned: boolean; rank: number | null } | null
  chatgpt: { mentioned: boolean; rank: number | null } | null
  gemini: { mentioned: boolean; rank: number | null } | null
  overallScore: number
  mentionCount: number
}

function ProviderBadge({ result }: { result: { mentioned: boolean; rank: number | null } | null }) {
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
          <p className="text-gray-600">See which searches you are winning and losing</p>
        </div>
        <UpgradePrompt 
          feature="Prompt Performance Report" 
          description="See exactly which AI prompts mention you and which do not, so you know where to focus your optimization efforts."
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

        const { data: latestBatch } = await supabaseAdmin
          .from('scan_batches')
          .select('id')
          .in('agent_id', agentIds)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .single()

        if (latestBatch) {
          const { data: scans } = await supabaseAdmin
          .from('scans')
          .select('prompt_id, llm_provider, mentioned, mention_rank, prompt_rendered')
          .eq('batch_id', latestBatch.id)

          const promptMap = new Map<number, PromptPerformance>()

          const promptsData = prompts.prompts as Array<{
            id: number
            template: string
            category: string
          }>

          categories = Array.from(new Set(promptsData.map(p => p.category)))

          promptsData.forEach(prompt => {
            promptMap.set(prompt.id, {
              promptId: prompt.id,
              promptTemplate: '', // Will be filled from actual scan
              category: prompt.category,
              perplexity: null,
              chatgpt: null,
              gemini: null,
              overallScore: 0,
              mentionCount: 0,
            })
          })

          scans?.forEach(scan => {
            const perf = promptMap.get(scan.prompt_id)
            if (perf) {
              // Use the rendered prompt from the scan
              if (!perf.promptTemplate && scan.prompt_rendered) {
                perf.promptTemplate = scan.prompt_rendered
              }
              const provider = scan.llm_provider as 'perplexity' | 'chatgpt' | 'gemini'
              if (provider === 'perplexity' || provider === 'chatgpt' || provider === 'gemini') {
                perf[provider] = {
                  mentioned: scan.mentioned,
                  rank: scan.mention_rank,
                }
              }
            }
          })

          promptMap.forEach(perf => {
            const results = [perf.perplexity, perf.chatgpt, perf.gemini].filter(p => p !== null)
            if (results.length > 0) {
              perf.mentionCount = results.filter(p => p?.mentioned).length
              perf.overallScore = Math.round((perf.mentionCount / results.length) * 100)
            }
          })

          promptPerformance = Array.from(promptMap.values())
            .filter(p => p.perplexity !== null || p.chatgpt !== null || p.gemini !== null)
        }
      }
    }
  }

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

  filteredPrompts.sort((a, b) => a.overallScore - b.overallScore)

  const totalPrompts = promptPerformance.length
  const fullyMentioned = promptPerformance.filter(p => p.overallScore === 100).length
  const partialMentioned = promptPerformance.filter(p => p.overallScore > 0 && p.overallScore < 100).length
  const notMentioned = promptPerformance.filter(p => p.overallScore === 0).length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Prompt Performance</h1>
        <p className="text-gray-600">See which AI searches mention you and which do not</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-2xl font-bold text-gray-900">{totalPrompts}</p>
          <p className="text-sm text-gray-600">Total Prompts</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-green-600">{fullyMentioned}</p>
          <p className="text-sm text-gray-600">Fully Visible</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-yellow-600">{partialMentioned}</p>
          <p className="text-sm text-gray-600">Partial Visibility</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-red-600">{notMentioned}</p>
          <p className="text-sm text-gray-600">Not Mentioned</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex gap-2">
              <a href="/dashboard/reports/prompts?filter=all" className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'all' ? 'bg-notable-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All</a>
              <a href="/dashboard/reports/prompts?filter=missing" className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'missing' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Missing</a>
              <a href="/dashboard/reports/prompts?filter=partial" className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'partial' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Partial</a>
              <a href="/dashboard/reports/prompts?filter=mentioned" className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'mentioned' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Mentioned</a>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="flex gap-2 flex-wrap">
              <a href={`/dashboard/reports/prompts?filter=${filter}&category=all`} className={`px-3 py-1.5 text-sm rounded-lg ${categoryFilter === 'all' ? 'bg-notable-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All</a>
              {categories.map(cat => (
                <a key={cat} href={`/dashboard/reports/prompts?filter=${filter}&category=${encodeURIComponent(cat)}`} className={`px-3 py-1.5 text-sm rounded-lg capitalize ${categoryFilter === cat ? 'bg-notable-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{cat}</a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {filter === 'missing' ? 'Prompts Where You Are Not Showing Up' : filter === 'partial' ? 'Prompts With Partial Visibility' : filter === 'mentioned' ? 'Prompts Where You Are Visible' : 'All Prompts'}
          <span className="text-sm font-normal text-gray-500 ml-2">({filteredPrompts.length})</span>
        </h2>
        
        {filteredPrompts.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">No prompts match the current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Prompt</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Perplexity</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">ChatGPT</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Gemini</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrompts.map((prompt) => (
                  <tr key={prompt.promptId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 max-w-lg">
                      <p className="text-sm text-gray-900" title={prompt.promptTemplate}>
                        {prompt.promptTemplate}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 capitalize">{prompt.category}</span>
                    </td>
                    <td className="py-3 px-4 text-center"><ProviderBadge result={prompt.perplexity} /></td>
                    <td className="py-3 px-4 text-center"><ProviderBadge result={prompt.chatgpt} /></td>
                    <td className="py-3 px-4 text-center"><ProviderBadge result={prompt.gemini} /></td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-12 py-1 rounded-full text-sm font-medium ${prompt.overallScore === 100 ? 'bg-green-100 text-green-700' : prompt.overallScore > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
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

      {notMentioned > 0 && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Visibility Gap Detected</h3>
              <p className="text-sm text-red-700 mt-1">
                You are not showing up in {notMentioned} prompt{notMentioned > 1 ? 's' : ''}. 
                Click the Missing filter above to see which searches you are invisible in.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
