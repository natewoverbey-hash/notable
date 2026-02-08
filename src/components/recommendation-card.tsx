'use client'

import { useState } from 'react'
import { Recommendation } from '@/lib/recommendations'
import { 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  Zap, 
  Clock, 
  CheckCircle2,
  Sparkles,
  FileText,
  Code,
  Mail,
  AlertCircle,
  TrendingUp,
  Star,
  Users,
  UserCircle
} from 'lucide-react'

interface RecommendationCardProps {
  recommendation: Recommendation
}

export default function RecommendationCard({ recommendation: rec }: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const toggleStep = (stepOrder: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepOrder) 
        ? prev.filter(s => s !== stepOrder)
        : [...prev, stepOrder]
    )
  }

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
      case 'profiles':
        return <UserCircle className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-white'
      case 'medium':
        return 'border-l-yellow-500 bg-white'
      case 'low':
        return 'border-l-blue-500 bg-white'
      default:
        return 'border-l-gray-500 bg-white'
    }
  }

  const getActionabilityBadge = (actionability: string) => {
    switch (actionability) {
      case 'platform_solvable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            <Zap className="h-3 w-3" />
            Quick Fix
          </span>
        )
      case 'guided_action':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            <FileText className="h-3 w-3" />
            Step-by-Step
          </span>
        )
      case 'strategic':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
            <Clock className="h-3 w-3" />
            Long-term
          </span>
        )
      default:
        return null
    }
  }

  const getGenerateButtonText = (type?: string) => {
    switch (type) {
      case 'schema':
        return 'Generate Schema Code'
      case 'content':
        return 'Generate Content Draft'
      case 'bio':
        return 'Rewrite My Bio'
      case 'email_template':
        return 'Generate Email Template'
      default:
        return 'Generate'
    }
  }

  return (
    <div className={`border-l-4 rounded-lg shadow-sm ${getPriorityStyles(rec.priority)}`}>
      {/* Header - Always Visible */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          <div className="text-gray-500 mt-0.5">
            {getCategoryIcon(rec.category)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-gray-900">{rec.title}</h3>
              {getActionabilityBadge(rec.actionability)}
            </div>
            <p className="text-sm text-gray-600">{rec.description}</p>
            
            {/* Impact & Timeline Preview */}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {rec.impact}
              </span>
              {rec.expected_weeks_perplexity && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {rec.expected_weeks_perplexity}-{rec.expected_weeks_chatgpt || 8} weeks
                </span>
              )}
            </div>
          </div>
          <div className="text-gray-400">
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          {/* Jargon Translation */}
          {rec.jargon_term && rec.plain_english && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-100">
              <div className="text-xs font-medium text-blue-700 mb-1">What is &ldquo;{rec.jargon_term}&rdquo;?</div>
              <p className="text-sm text-blue-800">{rec.plain_english}</p>
            </div>
          )}

          {/* Why It Matters */}
          {rec.why_it_matters && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Why this matters</h4>
              <p className="text-sm text-gray-600">{rec.why_it_matters}</p>
            </div>
          )}

          {/* Timeline Breakdown */}
          {rec.expected_weeks_perplexity && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Expected Timeline</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white rounded-lg p-2 border border-gray-200">
                  <div className="text-xs text-gray-500">Perplexity</div>
                  <div className="font-semibold text-gray-900">{rec.expected_weeks_perplexity} wk</div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-gray-200">
                  <div className="text-xs text-gray-500">ChatGPT</div>
                  <div className="font-semibold text-gray-900">{rec.expected_weeks_chatgpt || '?'} wk</div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-gray-200">
                  <div className="text-xs text-gray-500">Gemini</div>
                  <div className="font-semibold text-gray-900">{rec.expected_weeks_gemini || '?'} wk</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Steps */}
          {rec.steps && rec.steps.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Steps to Complete</h4>
              <div className="space-y-2">
                {rec.steps.map((step) => (
                  <div 
                    key={step.order}
                    className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      completedSteps.includes(step.order) ? 'bg-green-50' : 'bg-white hover:bg-gray-100'
                    }`}
                    onClick={() => toggleStep(step.order)}
                  >
                    <div className={`mt-0.5 ${completedSteps.includes(step.order) ? 'text-green-600' : 'text-gray-400'}`}>
                      {completedSteps.includes(step.order) ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-medium text-gray-500">
                          {step.order}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium text-sm ${completedSteps.includes(step.order) ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                      {step.link && (
                        <a 
                          href={step.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-notable-600 hover:text-notable-700 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button for Platform-Solvable */}
          {rec.can_generate && (
            <div className="flex items-center gap-3">
              <button className="btn-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {getGenerateButtonText(rec.generation_type)}
              </button>
              <span className="text-xs text-gray-500">Coming soon</span>
            </div>
          )}

          {/* Mark Complete Button */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {completedSteps.length} of {rec.steps?.length || 1} steps completed
            </div>
            <button className="text-sm text-notable-600 hover:text-notable-700 font-medium">
              Mark as Complete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
