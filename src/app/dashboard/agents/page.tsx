import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ExternalLink, MoreVertical } from 'lucide-react'

export default async function AgentsPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // TODO: Fetch agents from database
  const agents: any[] = []

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
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  )
}

function AgentCard({ agent }: { agent: any }) {
  return (
    <div className="card flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-gray-900">{agent.name}</h3>
        <p className="text-sm text-gray-600">
          {agent.brokerage && `${agent.brokerage} • `}
          {agent.city}, {agent.state}
        </p>
        {agent.neighborhoods?.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            {agent.neighborhoods.join(', ')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{agent.visibilityScore || '--'}</p>
          <p className="text-xs text-gray-500">Visibility Score</p>
        </div>
        <Link 
          href={`/dashboard/agents/${agent.id}`}
          className="btn-secondary text-sm"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}
