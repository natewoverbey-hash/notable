'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Check } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  const { isSignedIn } = useAuth()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (!isSignedIn) {
      window.location.href = '/sign-in?redirect_url=/pricing'
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType: billing }),
      })

      const { url, error } = await res.json()
      
      if (error) {
        alert(error)
        return
      }

      window.location.href = url
    } catch (error) {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const price = billing === 'monthly' ? 99 : 986
  const perMonth = billing === 'monthly' ? 99 : Math.round(986 / 12)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-notable-600">
            Notable
          </Link>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Link>
                <Link href="/sign-up" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Content */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            One Plan. Everything You Need to Improve.
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            For less than one Zillow lead, get the complete AI visibility improvement engine.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billing === 'monthly'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billing === 'annual'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-2 text-green-600 text-xs font-semibold">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-notable-500 p-8 max-w-md mx-auto">
          <div className="text-center mb-6">
            <span className="inline-block bg-notable-100 text-notable-700 text-sm font-semibold px-3 py-1 rounded-full mb-4">
              Notable Pro
            </span>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-gray-900">${perMonth}</span>
              <span className="text-gray-500">/month</span>
            </div>
            {billing === 'annual' && (
              <p className="text-sm text-gray-500 mt-2">
                Billed annually (${price}/year)
              </p>
            )}
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">AI scanning across ChatGPT, Gemini & Perplexity</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Visibility Score with historical trend tracking</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Competitor intelligence — see who AI recommends instead</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Personalized Action Plan with step-by-step playbook</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Before & after tracking to prove what's working</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Automated recurring scans</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Early access to new features</span>
            </li>
          </ul>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full btn-primary py-3 text-lg"
          >
            {loading ? 'Loading...' : 'Start Your Free Trial'}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            7-day free trial • Cancel anytime
          </p>
        </div>

        {/* FAQ or Trust */}
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Questions? Email us at{' '}
            <a href="mailto:support@withnotable.ai" className="text-notable-600 hover:underline">
              support@withnotable.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
