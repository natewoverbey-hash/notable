'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export default function ScanButton({ agentId }: { agentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const runScan = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })
      const data = await res.json()
      
      if (data.requiresUpgrade) {
        router.push('/pricing')
        return
      }
      
      if (res.ok) {
        window.location.reload()
      } else {
        alert(data.error || 'Scan failed')
      }
    } catch (error) {
      alert('Scan failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={runScan}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-notable-100 text-notable-700 rounded-lg hover:bg-notable-200 transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Scanning...' : 'Run Scan'}
    </button>
  )
}
