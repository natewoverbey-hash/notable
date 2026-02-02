import Link from 'next/link'
import { Lock } from 'lucide-react'

interface UpgradePromptProps {
  feature: string
  description?: string
}

export default function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  return (
    <div className="card text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="h-8 w-8 text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Upgrade to Access {feature}
      </h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {description || `Get full access to ${feature.toLowerCase()} and all other premium features with Notable Beta.`}
      </p>
      <Link href="/pricing" className="btn-primary">
        Upgrade for $29/month
      </Link>
    </div>
  )
}
