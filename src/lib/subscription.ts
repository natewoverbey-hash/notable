import { supabaseAdmin } from './supabase'

export interface SubscriptionStatus {
  isActive: boolean
  plan: string | null
  status: string
  hasUsedFreeScan: boolean
}

export async function getUserSubscription(clerkUserId: string): Promise<SubscriptionStatus> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('subscription_status, subscription_plan, has_used_free_scan')
    .eq('clerk_user_id', clerkUserId)
    .single()

  return {
    isActive: user?.subscription_status === 'active',
    plan: user?.subscription_plan || null,
    status: user?.subscription_status || 'free',
    hasUsedFreeScan: user?.has_used_free_scan || false,
  }
}

export function canRunScans(subscription: SubscriptionStatus): boolean {
  // Active subscribers can always run scans
  if (subscription.isActive) return true
  // Free users get one free scan
  if (!subscription.hasUsedFreeScan) return true
  return false
}

export function canViewCompetitors(subscription: SubscriptionStatus): boolean {
  // Active subscribers can always view
  if (subscription.isActive) return true
  // Free users can view if they've used their free scan (to see results)
  if (subscription.hasUsedFreeScan) return true
  return false
}

export function canViewScans(subscription: SubscriptionStatus): boolean {
  // Active subscribers can always view
  if (subscription.isActive) return true
  // Free users can view if they've used their free scan (to see results)
  if (subscription.hasUsedFreeScan) return true
  return false
}

export function getMaxAgents(subscription: SubscriptionStatus): number {
  return 1
}
