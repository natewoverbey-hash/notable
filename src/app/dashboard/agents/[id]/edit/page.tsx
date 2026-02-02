'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const PROPERTY_TYPES = [
  'Single Family Homes',
  'Condos/Townhomes',
  'Luxury',
  'Waterfront',
  'Historic Homes',
  'New Construction',
  'Investment/Rental',
  'Land/Lots',
]

const BUYER_TYPES = [
  'First-Time Buyers',
  'Relocations',
  'Move-Up Buyers',
  'Downsizers/Retirees',
  'Investors',
  'Military/VA',
  'Second Home/Vacation',
]

const LUXURY_THRESHOLDS = [
  { label: '$500K+', value: 500000 },
  { label: '$750K+', value: 750000 },
  { label: '$1M+', value: 1000000 },
  { label: '$1.5M+', value: 1500000 },
  { label: '$2M+', value: 2000000 },
  { label: '$3M+', value: 3000000 },
  { label: '$5M+', value: 5000000 },
]

export default function EditAgentPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    brokerage: '',
    city: '',
    state: '',
    neighborhoods: '',
    website_url: '',
    property_types: [] as string[],
    buyer_types: [] as string[],
    luxury_threshold: 1000000,
  })

  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${agentId}`)
        if (res.ok) {
          const { agent } = await res.json()
          setFormData({
            name: agent.name || '',
            brokerage: agent.brokerage || '',
            city: agent.city || '',
            state: agent.state || '',
            neighborhoods: agent.neighborhoods?.join(', ') || '',
            website_url: agent.website_url || '',
            property_types: agent.property_types || [],
            buyer_types: agent.buyer_types || [],
            luxury_threshold: agent.luxury_threshold || 1000000,
          })
        }
      } catch (error) {
        console.error('Failed to fetch agent:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAgent()
  }, [agentId])

  const handlePropertyTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      property_types: prev.property_types.includes(type)
        ? prev.property_types.filter(t => t !== type)
        : [...prev.property_types, type]
    }))
  }

  const handleBuyerTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      buyer_types: prev.buyer_types.includes(type)
        ? prev.buyer_types.filter(t => t !== type)
        : [...prev.buyer_types, type]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          neighborhoods: formData.neighborhoods
            .split(',')
            .map((n) => n.trim())
            .filter(Boolean),
        }),
      })

      if (res.ok) {
        router.push('/dashboard/agents')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update agent')
      }
    } catch (error) {
      alert('Failed to update agent')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading agent...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/dashboard/agents" className="text-notable-600 hover:text-notable-700 inline-flex items-center mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Agents
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Agent</h1>
        <p className="text-gray-600">Update {formData.name}'s profile and specialties</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Agent Name *</label>
              <input
                type="text"
                className="input"
                placeholder="Jackie Kelly"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Brokerage</label>
              <input
                type="text"
                className="input"
                placeholder="The Cassina Group"
                value={formData.brokerage}
                onChange={(e) => setFormData({ ...formData, brokerage: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Mount Pleasant"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">State *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="SC"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Neighborhoods / Areas</label>
              <input
                type="text"
                className="input"
                placeholder="Old Village, I'On, Park West (comma separated)"
                value={formData.neighborhoods}
                onChange={(e) => setFormData({ ...formData, neighborhoods: e.target.value })}
              />
              <p className="text-sm text-gray-500 mt-1">Separate multiple neighborhoods with commas</p>
            </div>

            <div>
              <label className="label">Website URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://www.example.com/agent-profile"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Property Specialties */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Property Specialties</h2>
          <p className="text-sm text-gray-600 mb-4">Select the property types this agent focuses on. We'll tailor the AI scans accordingly.</p>
          <div className="grid grid-cols-2 gap-3">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handlePropertyTypeToggle(type)}
                className={`p-3 text-left rounded-lg border-2 transition-colors ${
                  formData.property_types.includes(type)
                    ? 'border-notable-500 bg-notable-50 text-notable-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Buyer Types */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Buyer Types</h2>
          <p className="text-sm text-gray-600 mb-4">Select the buyer types this agent typically works with.</p>
          <div className="grid grid-cols-2 gap-3">
            {BUYER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleBuyerTypeToggle(type)}
                className={`p-3 text-left rounded-lg border-2 transition-colors ${
                  formData.buyer_types.includes(type)
                    ? 'border-notable-500 bg-notable-50 text-notable-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Luxury Threshold */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Luxury Price Threshold</h2>
          <p className="text-sm text-gray-600 mb-4">
            What price point is considered "luxury" in this agent's market? This helps us scan for the right luxury-related queries.
          </p>
          <div className="grid grid-cols-4 gap-3">
            {LUXURY_THRESHOLDS.map((threshold) => (
              <button
                key={threshold.value}
                type="button"
                onClick={() => setFormData({ ...formData, luxury_threshold: threshold.value })}
                className={`p-3 text-center rounded-lg border-2 transition-colors ${
                  formData.luxury_threshold === threshold.value
                    ? 'border-notable-500 bg-notable-50 text-notable-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {threshold.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/dashboard/agents" className="btn-secondary px-8">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
