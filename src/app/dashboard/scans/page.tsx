import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserSubscription, canViewScans } from '@/lib/subscription'
import UpgradePrompt from '@/components/upgrade-prompt'
import { MessageSquare, Bot, Sparkles } from 'lucide-react'

export default async function ScansPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Check subscription
  const subscription = await getUserSubscription(userId)
  
  if (!canViewScans(subscription)) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Scan Results</h1>
          <p className="text-gray-600">See what AI assistants are saying about your agents</p>
        </div>
        <UpgradePrompt 
          feature="Scan Results" 
          description="See exactly what ChatGPT, Claude, Gemini, and Perplexity say when people search for agents in your area."
        />
      </div>
    )
  }

  // Get user's workspace
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  let scans: any[] = []
  let agents: any[] = []

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
        const { data: scanData } = await supabaseAdmin
          .from('scans')
          .select('*')
          .in('agent_id', agentIds)
          .order('scanned_at', { ascending: false })
          .limit(100)

        scans = scanData || []
      }
    }
  }

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent?.name || 'Unknown'
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'perplexity':
        return <Sparkles className="h-4 w-4 text-blue-600" />
      case 'chatgpt':
        return <Sparkles className="h-4 w-4 text-green-600" />
      case 'claude':
        return <Bot className="h-4 w-4 text-orange-600" />
      case 'gemini':
        return <MessageSquare className="h-4 w-4 text-blue-600" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'chatgpt':
        return 'ChatGPT'
      case 'claude':
        return 'Claude'
      case 'gemini':
        return 'Gemini'
      case 'perplexity':
        return 'Perplexity'
      default:
        return provider
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Scan Results</h1>
        <p className="text-gray-600">See what AI assistants are saying about your agents</p>
      </div>

      {scans.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No scans yet. Run a scan from the Agents page to see results.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scans.map((scan) => (
            <div key={scan.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getProviderIcon(scan.llm_provider)}
                  <span className="font-medium text-gray-900">{getProviderName(scan.llm_provider)}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{getAgentName(scan.agent_id)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {scan.mentioned ? (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      Mentioned
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                      Not Mentioned
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(scan.scanned_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Prompt:</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{scan.prompt_rendered}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Response:</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                  {scan.response_raw?.substring(0, 500)}
                  {scan.response_raw?.length > 500 && '...'}
                </p>
              </div>

              {scan.competitors_mentioned && scan.competitors_mentioned.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-1">Competitors Mentioned:</p>
                  <div className="flex flex-wrap gap-2">
                    {scan.competitors_mentioned.map((comp: any, i: number) => (
                      <span key={i} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                        {typeof comp === 'string' ? comp : comp.name}
                        {typeof comp === 'object' && comp.rank && (
                          <span className="ml-1 text-yellow-600">#{comp.rank}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
