'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  })

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

      <form onSubmit={handleSubmit} className="card max-w-xl">
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
            <label className="label">Neighborhoods</label>
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

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Adding Agent...' : 'Add Agent'}
          </button>
        </div>
      </form>
    </div>
  )
}
