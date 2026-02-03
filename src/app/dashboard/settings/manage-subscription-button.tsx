'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/billing-portal', {
        method: 'POST',
      })
      const { url, error } = await res.json()

      if (error) {
        alert(error)
        return
      }

      window.location.href = url
    } catch (error) {
      alert('Failed to open billing portal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleManageSubscription}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Manage Subscription'}
      <ExternalLink className="h-4 w-4" />
    </button>
  )
}
