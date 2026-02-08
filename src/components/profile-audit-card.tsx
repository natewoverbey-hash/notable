'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react'

interface ProfileAuditCardProps {
  platform: string
  label: string
  status: string       // 'confirmed' | 'not_found' | 'unknown'
  source: string       // 'llm_audit' | 'citation' | 'user_reported' | 'none'
  profileUrl: string | null
  agentName: string
  userId: string
}

// Platform-specific help text
const PLATFORM_HELP: Record<string, { checkUrl: string; description: string }> = {
  zillow: {
    checkUrl: 'https://www.zillow.com/agent-finder/',
    description: 'Search for your name on Zillow\'s agent finder to see if you have a profile.',
  },
  homes_com: {
    checkUrl: 'https://www.homes.com/real-estate-agents/',
    description: 'Search for your name on Homes.com to check for an existing profile.',
  },
  realtor_com: {
    checkUrl: 'https://www.realtor.com/realestateagents/',
    description: 'Search your name on Realtor.com to find your agent profile.',
  },
  bing_places: {
    checkUrl: 'https://www.bingplaces.com/',
    description: 'Sign into Bing Places for Business to check if you have a listing.',
  },
  google_business: {
    checkUrl: 'https://business.google.com/',
    description: 'Sign into Google Business Profile to check your listing.',
  },
  fastexpert: {
    checkUrl: 'https://www.fastexpert.com/',
    description: 'Search for your name on FastExpert to see if you have a profile.',
  },
}

// What each platform impacts
const PLATFORM_IMPACT: Record<string, string> = {
  zillow: 'Cited in 40%+ of AI agent recommendations',
  homes_com: 'Growing citation source across all AI platforms',
  realtor_com: 'Major directory that AI uses for agent data',
  bing_places: 'Critical for ChatGPT visibility — feeds directly into it',
  google_business: 'Critical for Gemini visibility — Google\'s AI reads this first',
  fastexpert: 'Emerging directory used by AI for agent discovery',
}

export default function ProfileAuditCard({
  platform,
  label,
  status: initialStatus,
  source: initialSource,
  profileUrl: initialProfileUrl,
  agentName,
  userId,
}: ProfileAuditCardProps) {
  const [status, setStatus] = useState(initialStatus)
  const [source, setSource] = useState(initialSource)
  const [profileUrl, setProfileUrl] = useState(initialProfileUrl || '')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [saved, setSaved] = useState(false)

  const help = PLATFORM_HELP[platform]
  const impact = PLATFORM_IMPACT[platform]

  const handleConfirm = async (newStatus: 'confirmed' | 'not_found') => {
    // If they're saying "I have this" and we don't have a URL, show the input
    if (newStatus === 'confirmed' && !profileUrl && status !== 'confirmed') {
      setShowUrlInput(true)
      setIsExpanded(true)
      return
    }

    setIsSaving(true)
    setSaved(false)

    try {
      const res = await fetch('/api/profile-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          agentName,
          platform,
          status: newStatus,
          profileUrl: newStatus === 'confirmed' ? profileUrl : undefined,
        }),
      })

      if (res.ok) {
        setStatus(newStatus)
        setSource('user_reported')
        setShowUrlInput(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error('Failed to update profile status:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmitUrl = async () => {
    if (!profileUrl.trim()) return
    await handleConfirm('confirmed')
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />
      case 'not_found':
        return <XCircle className="h-6 w-6 text-red-400" />
      default:
        return <HelpCircle className="h-6 w-6 text-gray-400" />
    }
  }

  const getStatusText = () => {
    if (source === 'user_reported') {
      return status === 'confirmed' ? 'Confirmed by you' : 'Marked as missing'
    }
    switch (status) {
      case 'confirmed':
        return 'Found by scan'
      case 'not_found':
        return 'Not found by scan'
      default:
        return 'Couldn\'t determine'
    }
  }

  const getStatusBg = () => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 border-green-200'
      case 'not_found':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${getStatusBg()}`}>
      {/* Main row */}
      <div className="flex items-center gap-4 p-4">
        {/* Status icon */}
        <div className="flex-shrink-0">{getStatusIcon()}</div>

        {/* Platform info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{label}</h3>
            {saved && (
              <span className="text-xs text-green-600 font-medium animate-pulse">
                ✓ Saved
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{getStatusText()}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {status !== 'confirmed' && (
            <button
              onClick={() => handleConfirm('confirmed')}
              disabled={isSaving}
              className="text-sm px-3 py-1.5 rounded-lg bg-green-100 text-green-700 
                         hover:bg-green-200 font-medium transition-colors
                         disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'I have this'
              )}
            </button>
          )}
          {status !== 'not_found' && (
            <button
              onClick={() => handleConfirm('not_found')}
              disabled={isSaving}
              className="text-sm px-3 py-1.5 rounded-lg bg-red-100 text-red-700 
                         hover:bg-red-200 font-medium transition-colors
                         disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "I don't have this"
              )}
            </button>
          )}
          {/* Undo: if user-reported, show the opposite to let them change */}
          {source === 'user_reported' && (
            <button
              onClick={() =>
                handleConfirm(status === 'confirmed' ? 'not_found' : 'confirmed')
              }
              disabled={isSaving}
              className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
            >
              Change
            </button>
          )}

          {/* Expand for details */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* URL input (shown when user clicks "I have this" and no URL exists) */}
      {showUrlInput && (
        <div className="px-4 pb-3 border-t border-green-200 bg-green-50">
          <div className="flex items-center gap-2 mt-3">
            <input
              type="url"
              placeholder={`Paste your ${label} profile URL (optional)`}
              value={profileUrl}
              onChange={e => setProfileUrl(e.target.value)}
              className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-notable-500 
                         focus:border-notable-500"
              onKeyDown={e => e.key === 'Enter' && handleSubmitUrl()}
            />
            <button
              onClick={handleSubmitUrl}
              disabled={isSaving}
              className="btn-primary text-sm px-4 py-2"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </button>
            <button
              onClick={() => {
                // Allow confirming without URL
                handleConfirm('confirmed')
              }}
              className="text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap"
            >
              Skip URL
            </button>
          </div>
          {help && (
            <p className="text-xs text-gray-500 mt-2">
              Not sure?{' '}
              <a
                href={help.checkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-notable-600 hover:text-notable-700"
              >
                Check {label} →
              </a>
            </p>
          )}
        </div>
      )}

      {/* Expanded details */}
      {isExpanded && !showUrlInput && (
        <div className="px-4 pb-4 border-t border-gray-200 bg-white">
          <div className="mt-3 space-y-2">
            {/* Why this platform matters */}
            {impact && (
              <p className="text-sm text-gray-600">
                <strong className="text-gray-700">Why it matters:</strong> {impact}
              </p>
            )}

            {/* Profile URL if we have one */}
            {profileUrl && status === 'confirmed' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Profile:</span>
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-notable-600 hover:text-notable-700 
                             flex items-center gap-1 truncate"
                >
                  {profileUrl}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </div>
            )}

            {/* Help checking */}
            {help && status !== 'confirmed' && (
              <div className="bg-gray-50 rounded-lg p-3 mt-2">
                <p className="text-sm text-gray-600">{help.description}</p>
                <a
                  href={help.checkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-notable-600 hover:text-notable-700 
                             flex items-center gap-1 mt-1 font-medium"
                >
                  Check {label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
