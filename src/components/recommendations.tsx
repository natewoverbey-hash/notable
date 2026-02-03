'use client'

import { useState } from 'react'
import { Recommendation } from '@/lib/recommendations'
import { AlertTriangle, FileText, Star, Code, Users, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'

interface RecommendationsProps {
  recommendations: Recommendation[]
}

export default function Recommendations({ recommendations }: RecommendationsProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'visibility':
        return <TrendingUp className="h-5 w-5" />
      case 'content':
        return <FileText className="h-5 w-5" />
      case 'reviews':
        return <Star className="h-5 w-5" />
      case 'technical':
        return <Code className="h-5 w-5" />
      case 'competitive':
        return <Users className="h-5 w-5" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50'
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'low':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">High Priority</span>
      case 'medium':
        return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Medium Priority</span>
      case 'low':
        return <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Low Priority</span>
      default:
        return null
    }
  }

  if (recommendations.length === 0) {
    return (
      <div className="card text-center py-8">
        <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Looking good!</h3>
        <p className="text-gray-600">No critical recommendations right now. Keep monitoring your visibility.</p>
      </div>
    )
  }

  const highPriorityCount = recommendations.filter(r => r.priority === 'high').length

  return (
    <div className="card">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-0 mb-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-900">
            {recommendations.length} Recommendations
          </span>
          {highPriorityCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              {highPriorityCount} high priority
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <span className="text-sm">{isExpanded ? 'Collapse' : 'Expand'}</span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`border-l-4 rounded-lg p-4 ${getPriorityStyles(rec.priority)}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-gray-600 mt-0.5">
                  {getCategoryIcon(rec.category)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                    {getPriorityBadge(rec.priority)}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-1">💡 Action:</p>
                    <p className="text-sm text-gray-700">{rec.action}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>Potential impact:</strong> {rec.impact}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsed Preview */}
      {!isExpanded && (
        <div className="flex gap-2 flex-wrap">
          {recommendations.slice(0, 3).map((rec) => (
            <span
              key={rec.id}
              className={`px-3 py-1 text-sm rounded-full ${
                rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}
            >
              {rec.title.length > 30 ? rec.title.substring(0, 30) + '...' : rec.title}
            </span>
          ))}
          {recommendations.length > 3 && (
            <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">
              +{recommendations.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
