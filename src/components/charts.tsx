'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface TrendDataPoint {
  date: string
  score: number
}

interface ProviderScore {
  provider: string
  score: number
  color: string
}

export function VisibilityTrendChart({ data }: { data: TrendDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400">
        Run more scans to see your visibility trend
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px'
          }}
          formatter={(value: number) => [`${value}%`, 'Visibility']}
        />
        <Line 
          type="monotone" 
          dataKey="score" 
          stroke="#0ea5e9" 
          strokeWidth={3}
          dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: '#0ea5e9' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function ProviderBreakdownChart({ data }: { data: ProviderScore[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
        <XAxis 
          type="number" 
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis 
          type="category" 
          dataKey="provider"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px'
          }}
          formatter={(value: number) => [`${value}%`, 'Visibility']}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CompetitorSpotlight({ 
  competitor, 
  competitorMentions, 
  yourMentions 
}: { 
  competitor: string
  competitorMentions: number
  yourMentions: number
}) {
  const ratio = yourMentions > 0 ? Math.round(competitorMentions / yourMentions) : competitorMentions
  const yourPercentage = competitorMentions + yourMentions > 0 
    ? Math.round((yourMentions / (competitorMentions + yourMentions)) * 100)
    : 0
  const competitorPercentage = 100 - yourPercentage

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-gray-600">Top Competitor</p>
          <p className="font-semibold text-gray-900">{competitor}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-red-600">{ratio}x</p>
          <p className="text-xs text-gray-500">more mentions</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">You</span>
            <span className="font-medium">{yourMentions} mentions</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-notable-500 rounded-full transition-all duration-500"
              style={{ width: `${yourPercentage}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{competitor}</span>
            <span className="font-medium">{competitorMentions} mentions</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 rounded-full transition-all duration-500"
              style={{ width: `${competitorPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
