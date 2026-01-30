import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // TODO: Fetch real data from database
  // For now, showing placeholder UI
  const hasAgents = false // Will check database

  if (!hasAgents) {
    return <EmptyState />
  }

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
          score={72}
          change={5}
          trend="up"
        />
        <ScoreCard 
          title="ChatGPT"
          score={85}
          change={12}
          trend="up"
        />
        <ScoreCard 
          title="Claude"
          score={68}
          change={-3}
          trend="down"
        />
        <ScoreCard 
          title="Gemini"
          score={54}
          change={0}
          trend="neutral"
        />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h2>
        <p className="text-gray-500">No scans yet. Add an agent to get started.</p>
      </div>
    </div>
  )
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
          {change > 0 ? '+' : ''}{change}
        </div>
      </div>
    </div>
  )
}
