import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { CreditCard, User, Mail, Calendar, ExternalLink } from 'lucide-react'
import ManageSubscriptionButton from './manage-subscription-button'

export default async function SettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  let planName = 'Free'
  if (user?.subscription_plan === 'beta_annual') {
    planName = 'Beta (Annual)'
  } else if (user?.subscription_plan === 'beta') {
    planName = 'Beta (Monthly)'
  }
  
  let statusColor = 'text-gray-600 bg-gray-100'
  if (user?.subscription_status === 'active') {
    statusColor = 'text-green-600 bg-green-100'
  } else if (user?.subscription_status === 'past_due') {
    statusColor = 'text-yellow-600 bg-yellow-100'
  } else if (user?.subscription_status === 'canceled') {
    statusColor = 'text-red-600 bg-red-100'
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and subscription</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            Account
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900">{user?.email || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Member since</span>
              <span className="font-medium text-gray-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-500" />
            Subscription
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Plan</span>
              <span className="font-medium text-gray-900">{planName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Status</span>
              <span className={`px-2 py-1 text-sm font-medium rounded-full ${statusColor}`}>
                {user?.subscription_status || 'Free'}
              </span>
            </div>
            {user?.subscription_status === 'active' && (
              <div className="pt-4">
                <ManageSubscriptionButton />
              </div>
            )}
            {user?.subscription_status !== 'active' && (
              <div className="pt-4">
                <a href="/pricing" className="btn-primary inline-flex items-center">
                  Upgrade to Beta
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            Usage
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Free scan used</span>
              <span className="font-medium text-gray-900">
                {user?.has_used_free_scan ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Agents limit</span>
              <span className="font-medium text-gray-900">1</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-gray-600 mb-4">
            Have questions or feedback? We would love to hear from you.
          </p>
          
            href="mailto:support@notable.ai"
            className="inline-flex items-center gap-2 text-notable-600 hover:text-notable-700"
          >
            <Mail className="h-4 w-4" />
            support@notable.ai
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
