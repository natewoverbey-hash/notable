import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('clerk_user_id', userId)
      .single()

    if (!user?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: 'https://notable-nine.vercel.app/dashboard/settings',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    return NextResponse.json({ error: 'Failed to create billing portal' }, { status: 500 })
  }
}
