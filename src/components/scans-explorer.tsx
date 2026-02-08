'use client'

import React, { useState, useMemo } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Globe,
  Eye,
  EyeOff,
  Users,
  Hash,
  Calendar,
  Sparkles,
  MessageSquare,
  Zap,
} from 'lucide-react'

interface Scan {
  id: string
  batch_id: string
  agent_id: string
  prompt_id: number
  prompt_rendered: string
  llm_provider: string
  llm_model: string
  response_raw: string
  response_tokens: number
  mentioned: boolean
  mention_rank: number | null
  mention_context: string | null
  sentiment: string | null
  competitors_mentioned: any[]
  sources_cited: any[]
  latency_ms: number
  error_message: string | null
  scanned_at: string
}

interface Agent {
  id: string
  name: string
}

interface Batch {
  id: string
  agent_id: string
  status: string
  prompts_total: number
  prompts_completed: number
  started_at: string
  completed_at: string | null
}

interface ScansExplorerProps {
  scans: Scan[]
  agents: Agent[]
  batches: Batch[]
}

// Provider display config
const PROVIDERS: Record<string, { name: string; color: string; bg: string; border: string; icon: string }> = {
  chatgpt: { name: 'ChatGPT', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: '🟢' },
  perplexity: { name: 'Perplexity', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: '🔵' },
  gemini: { name: 'Gemini', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: '🟣' },
  claude: { name: 'Claude', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: '🟠' },
}

function getProvider(key: string) {
  return PROVIDERS[key] || { name: key, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', icon: '⚪' }
}

// Extract sources from sources_cited
// Format: [{url?, count?, source?}] — ChatGPT has URLs, Gemini often only has source names
function extractSources(sourcesCited: any[]): { domain: string; url: string; sourceName: string; count: number }[] {
  if (!sourcesCited || !Array.isArray(sourcesCited)) return []

  const sources: { domain: string; url: string; sourceName: string; count: number }[] = []

  for (const source of sourcesCited) {
    try {
      const url = typeof source === 'string' ? source : source?.url || ''
      const sourceName = source?.source || ''
      const count = source?.count || 1

      let domain = ''
      if (url) {
        try {
          domain = new URL(url).hostname.replace('www.', '')
        } catch {
          domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
        }
      } else if (sourceName) {
        // No URL — use source name as the domain label (common with Gemini)
        domain = sourceName
      } else {
        continue
      }

      sources.push({ domain, url, sourceName, count })
    } catch {
      // skip bad entries
    }
  }

  return sources
}

// Parse URLs from response text as a fallback
function extractUrlsFromResponse(text: string): { domain: string; url: string }[] {
  if (!text) return []
  const urlRegex = /https?:\/\/[^\s\)>\]"']+/g
  const matches = text.match(urlRegex) || []
  const seen = new Set<string>()

  return matches
    .map(url => {
      try {
        const domain = new URL(url).hostname.replace('www.', '')
        if (seen.has(domain)) return null
        seen.add(domain)
        return { domain, url }
      } catch {
        return null
      }
    })
    .filter(Boolean) as { domain: string; url: string }[]
}

// Single scan result with expandable response
function ScanRow({ scan, agentName }: { scan: Scan; agentName: string }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const sources = useMemo(() => {
    return extractSources(scan.sources_cited)
  }, [scan.sources_cited])

  const competitors = scan.competitors_mentioned || []

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      {/* Collapsed row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Expand icon */}
        <div className="flex-shrink-0 text-gray-400">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>

        {/* Mentioned badge */}
        <div className="flex-shrink-0">
          {scan.mentioned ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-400" />
          )}
        </div>

        {/* Prompt text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 truncate">{scan.prompt_rendered}</p>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {scan.mention_rank && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {scan.mention_rank}
            </span>
          )}
          {sources.length > 0 && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {sources.length}
            </span>
          )}
          {competitors.length > 0 && (
            <span className="text-xs text-yellow-600 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {competitors.length}
            </span>
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
          {/* Full prompt */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Prompt
            </h4>
            <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
              {scan.prompt_rendered}
            </p>
          </div>

          {/* Full response */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Full Response
            </h4>
            <div className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 max-h-80 overflow-y-auto whitespace-pre-wrap">
              {scan.response_raw || 'No response recorded'}
            </div>
          </div>

          {/* Mention context */}
          {scan.mention_context && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Mention Context
              </h4>
              <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">
                &ldquo;...{scan.mention_context}...&rdquo;
              </p>
            </div>
          )}

          {/* Sources cited */}
          {sources.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Sources Cited ({sources.length})
              </h4>
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {sources.map((source, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2">
                    <Globe className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 flex-shrink-0">
                      {source.sourceName || source.domain}
                    </span>
                    {source.count > 1 && (
                      <span className="text-xs text-gray-400">×{source.count}</span>
                    )}
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-notable-600 hover:text-notable-700 truncate flex items-center gap-1 ml-auto"
                      >
                        {source.domain}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competitors */}
          {competitors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Competitors Mentioned
              </h4>
              <div className="flex flex-wrap gap-2">
                {competitors.map((comp: any, i: number) => {
                  const name = typeof comp === 'string' ? comp : comp.name
                  const rank = typeof comp === 'object' ? comp.rank : null
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200"
                    >
                      {name}
                      {rank && (
                        <span className="text-yellow-500">#{rank}</span>
                      )}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

// LLM section within a batch
function LLMSection({
  provider,
  scans,
  agentName,
  defaultOpen,
}: {
  provider: string
  scans: Scan[]
  agentName: string
  defaultOpen: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const p = getProvider(provider)
  const mentioned = scans.filter(s => s.mentioned).length
  const total = scans.length
  const mentionRate = total > 0 ? Math.round((mentioned / total) * 100) : 0

  // Aggregate all sources across scans for this provider
  const allSources = useMemo(() => {
    const sourceMap = new Map<string, { count: number; url: string; sourceName: string }>()
    for (const scan of scans) {
      const sources = extractSources(scan.sources_cited)
      for (const s of sources) {
        const key = s.sourceName || s.domain
        const existing = sourceMap.get(key)
        if (existing) {
          existing.count += s.count
        } else {
          sourceMap.set(key, { count: s.count, url: s.url, sourceName: s.sourceName || s.domain })
        }
      }
    }
    return Array.from(sourceMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
  }, [scans])

  return (
    <div className={`border rounded-lg overflow-hidden ${p.border}`}>
      {/* Provider header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 ${p.bg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{p.icon}</span>
          <div className="text-left">
            <h3 className={`font-semibold ${p.color}`}>{p.name}</h3>
            <p className="text-xs text-gray-500">
              {mentioned}/{total} prompts mentioned • {mentionRate}% visibility
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mini visibility bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  mentionRate > 50 ? 'bg-green-500' : mentionRate > 20 ? 'bg-yellow-500' : 'bg-red-400'
                }`}
                style={{ width: `${mentionRate}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-600">{mentionRate}%</span>
          </div>

          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="bg-white">
          {/* Top sources for this provider */}
          {allSources.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Top Sources {p.name} is Citing
              </h4>
              <div className="flex flex-wrap gap-2">
                {allSources.map(([key, { count, sourceName }]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white border border-gray-200 rounded-full"
                  >
                    <Globe className="h-3 w-3 text-gray-400" />
                    <span className="font-medium text-gray-700">{sourceName}</span>
                    <span className="text-gray-400">×{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Individual scan results */}
          <div className="p-3 space-y-1">
            {scans.map(scan => (
              <ScanRow key={scan.id} scan={scan} agentName={agentName} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ScansExplorer({ scans, agents, batches }: ScansExplorerProps) {
  const [filterMentioned, setFilterMentioned] = useState<'all' | 'mentioned' | 'not_mentioned'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(() => {
    // Auto-expand the most recent batch
    if (batches.length > 0) return new Set([batches[0].id])
    return new Set<string>()
  })

  const getAgentName = (agentId: string) => {
    return agents.find(a => a.id === agentId)?.name || 'Unknown'
  }

  // Filter scans
  const filteredScans = useMemo(() => {
    let result = scans

    if (filterMentioned === 'mentioned') {
      result = result.filter(s => s.mentioned)
    } else if (filterMentioned === 'not_mentioned') {
      result = result.filter(s => !s.mentioned)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        s =>
          s.prompt_rendered?.toLowerCase().includes(q) ||
          s.response_raw?.toLowerCase().includes(q)
      )
    }

    return result
  }, [scans, filterMentioned, searchQuery])

  // Group by batch
  const groupedByBatch = useMemo(() => {
    const groups = new Map<string, Scan[]>()

    for (const scan of filteredScans) {
      const batchId = scan.batch_id || 'ungrouped'
      if (!groups.has(batchId)) groups.set(batchId, [])
      groups.get(batchId)!.push(scan)
    }

    return groups
  }, [filteredScans])

  // Sort batches by date (most recent first)
  const sortedBatchIds = useMemo(() => {
    return Array.from(groupedByBatch.keys()).sort((a, b) => {
      const batchA = batches.find(batch => batch.id === a)
      const batchB = batches.find(batch => batch.id === b)
      const dateA = batchA?.started_at || '0'
      const dateB = batchB?.started_at || '0'
      return dateB.localeCompare(dateA)
    })
  }, [groupedByBatch, batches])

  const toggleBatch = (batchId: string) => {
    setExpandedBatches(prev => {
      const next = new Set(prev)
      if (next.has(batchId)) {
        next.delete(batchId)
      } else {
        next.add(batchId)
      }
      return next
    })
  }

  // Overall stats
  const totalMentions = filteredScans.filter(s => s.mentioned).length
  const overallRate = filteredScans.length > 0
    ? Math.round((totalMentions / filteredScans.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card py-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{filteredScans.length}</div>
          <div className="text-sm text-gray-500">Total Responses</div>
        </div>
        <div className="card py-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalMentions}</div>
          <div className="text-sm text-gray-500">Mentions</div>
        </div>
        <div className="card py-4 text-center">
          <div className={`text-2xl font-bold ${overallRate > 50 ? 'text-green-600' : overallRate > 20 ? 'text-yellow-600' : 'text-red-600'}`}>
            {overallRate}%
          </div>
          <div className="text-sm text-gray-500">Visibility Rate</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search prompts or responses..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-notable-500 focus:border-notable-500"
            />
          </div>

          {/* Mention filter */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilterMentioned('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterMentioned === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMentioned('mentioned')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                filterMentioned === 'mentioned'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="h-3 w-3" />
              Mentioned
            </button>
            <button
              onClick={() => setFilterMentioned('not_mentioned')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                filterMentioned === 'not_mentioned'
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <EyeOff className="h-3 w-3" />
              Not Mentioned
            </button>
          </div>
        </div>
      </div>

      {/* Batch groups */}
      {sortedBatchIds.map(batchId => {
        const batchScans = groupedByBatch.get(batchId)!
        const batch = batches.find(b => b.id === batchId)
        const isExpanded = expandedBatches.has(batchId)

        const batchDate = batch?.started_at
          ? new Date(batch.started_at).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
          : 'Unknown Date'

        const batchAgent = batch ? getAgentName(batch.agent_id) : 'Unknown'
        const batchMentions = batchScans.filter(s => s.mentioned).length
        const batchRate = batchScans.length > 0
          ? Math.round((batchMentions / batchScans.length) * 100)
          : 0

        // Group scans by provider within this batch
        const byProvider = new Map<string, Scan[]>()
        for (const scan of batchScans) {
          const prov = scan.llm_provider
          if (!byProvider.has(prov)) byProvider.set(prov, [])
          byProvider.get(prov)!.push(scan)
        }

        // Sort providers: chatgpt, perplexity, gemini, claude, then others
        const providerOrder = ['chatgpt', 'perplexity', 'gemini', 'claude']
        const sortedProviders = Array.from(byProvider.keys()).sort((a, b) => {
          const ai = providerOrder.indexOf(a)
          const bi = providerOrder.indexOf(b)
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
        })

        return (
          <div key={batchId} className="card p-0 overflow-hidden">
            {/* Batch header */}
            <button
              onClick={() => toggleBatch(batchId)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div className="text-left">
                  <h2 className="font-semibold text-gray-900">{batchDate}</h2>
                  <p className="text-sm text-gray-500">
                    {batchAgent} • {batchScans.length} responses across{' '}
                    {byProvider.size} AI{byProvider.size > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className={`text-lg font-bold ${
                    batchRate > 50 ? 'text-green-600' : batchRate > 20 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {batchRate}%
                  </div>
                  <div className="text-xs text-gray-400">visibility</div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded batch content — grouped by LLM */}
            {isExpanded && (
              <div className="border-t border-gray-100 p-4 space-y-4">
                {sortedProviders.map((provider, idx) => (
                  <LLMSection
                    key={provider}
                    provider={provider}
                    scans={byProvider.get(provider)!}
                    agentName={batchAgent}
                    defaultOpen={idx === 0}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {filteredScans.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No results match your filters.</p>
        </div>
      )}
    </div>
  )
}
