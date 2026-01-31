import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'

export default async function AgentsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Get user's workspace
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  let agents: any[] = []

  if (user) {
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (workspace) {
      const { data } = await supabaseAdmin
        .from('agents')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })

      agents = data || []
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Agents</h1>
          <p className="text-gray-600">Manage the agents you're monitoring</p>
        </div>
        <Link href="/dashboard/agents/new" className="btn-primary inline-flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Add Agent
        </Link>
      </div>

      {agents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No agents yet. Add your first agent to get started.</p>
          <Link href="/dashboard/agents/new" className="btn-primary inline-flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Your First Agent
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                  <p className="text-sm text-gray-500">{agent.brokerage}</p>
                  <p className="text-sm text-gray-500">{agent.city}, {agent.state}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-notable-600">
                    {agent.visibility_score ?? '--'}
                  </div>
                  <p className="text-sm text-gray-500">Visibility Score</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
