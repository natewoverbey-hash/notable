'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewAgentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    brokerage: '',
    city: '',
    state: '',
    neighborhoods: '',
    websiteUrl: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          neighborhoods: formData.neighborhoods.split(',').map(n => n.trim()).filter(Boolean),
        }),
      })

      if (response.ok) {
        router.push('/dashboard/agents')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to create agent')
      }
    } catch (error) {
      alert('Failed to create agent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Link 
        href="/dashboard/agents" 
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Agents
      </Link>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Agent</h1>
        <p className="text-gray-600 mb-6">
          Enter the agent details to start monitoring their AI visibility.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agent Name */}
          <div>
            <label htmlFor="name" className="label">
              Agent Name *
            </label>
            <input
              type="text"
              id="name"
              required
              className="input"
              placeholder="e.g., Jackie Kelly"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Brokerage */}
          <div>
            <label htmlFor="brokerage" className="label">
              Brokerage
            </label>
            <input
              type="text"
              id="brokerage"
              className="input"
              placeholder="e.g., The Cassina Group"
              value={formData.brokerage}
              onChange={(e) => setFormData({ ...formData, brokerage: e.target.value })}
            />
          </div>

          {/* City & State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="label">
                City *
              </label>
              <input
                type="text"
                id="city"
                required
                className="input"
                placeholder="e.g., Mount Pleasant"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="state" className="label">
                State *
              </label>
              <input
                type="text"
                id="state"
                required
                className="input"
                placeholder="e.g., SC"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
          </div>

          {/* Neighborhoods */}
          <div>
            <label htmlFor="neighborhoods" className="label">
              Neighborhoods (comma-separated)
            </label>
            <input
              type="text"
              id="neighborhoods"
              className="input"
              placeholder="e.g., Old Village, Downtown Charleston, Sullivan's Island"
              value={formData.neighborhoods}
              onChange={(e) => setFormData({ ...formData, neighborhoods: e.target.value })}
            />
            <p className="mt-1 text-sm text-gray-500">
              Add neighborhoods to track hyperlocal visibility
            </p>
          </div>

          {/* Website */}
          <div>
            <label htmlFor="websiteUrl" className="label">
              Website URL
            </label>
            <input
              type="url"
              id="websiteUrl"
              className="input"
              placeholder="e.g., https://jackiekellyrealestate.com"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Creating...' : 'Create Agent'}
            </button>
            <Link href="/dashboard/agents" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
