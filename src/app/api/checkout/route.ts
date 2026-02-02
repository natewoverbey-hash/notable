import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe, PRICES } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { priceType } = body // 'monthly' or 'annual'

    const priceId = priceType === 'annual' ? PRICES.BETA_ANNUAL : PRICES.BETA_MONTHLY

    // Get user email from Clerk or Supabase
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email, stripe_customer_id')
      .eq('clerk_user_id', userId)
      .single()

    let customerId = user?.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          clerk_user_id: userId,
        },
      })
      customerId = customer.id

      // Save customer ID to database
      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('clerk_user_id', userId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        clerk_user_id: userId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
