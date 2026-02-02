import { supabaseAdmin } from './supabase'

export interface SubscriptionStatus {
  isActive: boolean
  plan: string | null
  status: string
}

export async function getUserSubscription(clerkUserId: string): Promise<SubscriptionStatus> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('subscription_status, subscription_plan')
    .eq('clerk_user_id', clerkUserId)
    .single()

  return {
    isActive: user?.subscription_status === 'active',
    plan: user?.subscription_plan || null,
    status: user?.subscription_status || 'free',
  }
}

export function canRunScans(subscription: SubscriptionStatus): boolean {
  return subscription.isActive
}

export function canViewCompetitors(subscription: SubscriptionStatus): boolean {
  return subscription.isActive
}

export function canViewScans(subscription: SubscriptionStatus): boolean {
  return subscription.isActive
}

export function getMaxAgents(subscription: SubscriptionStatus): number {
  // Beta plan gets 1 agent, Team would get 5
  return 1
}
