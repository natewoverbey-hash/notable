'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function NewAgentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
    setLoading(true)

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
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
        alert(data.error || 'Failed to create agent')
      }
    } catch (error) {
      alert('Failed to create agent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Agent</h1>
        <p className="text-gray-600">Enter the details of the agent you want to monitor</p>
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
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Adding Agent...' : 'Add Agent'}
        </button>
      </form>
    </div>
  )
}
