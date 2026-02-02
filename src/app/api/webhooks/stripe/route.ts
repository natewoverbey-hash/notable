import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('No stripe-signature header')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    console.error('Signature received:', signature.substring(0, 50) + '...')
    console.error('Webhook secret starts with:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('Webhook received:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const clerkUserId = session.metadata?.clerk_user_id
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        console.log('Processing checkout for clerk user:', clerkUserId)

        if (clerkUserId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = subscription.items.data[0]?.price.id
          
          let plan = 'beta'
          if (priceId === 'price_1SwRegBPHwuVGwffbLvtxebL') {
            plan = 'beta_annual'
          }

          const { error } = await supabaseAdmin
            .from('users')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active',
              subscription_plan: plan,
            })
            .eq('clerk_user_id', clerkUserId)

          if (error) {
            console.error('Supabase update error:', error)
          } else {
            console.log(`Subscription activated for user ${clerkUserId}`)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const status = subscription.status === 'active' ? 'active' : subscription.status

        await supabaseAdmin
          .from('users')
          .update({ subscription_status: status })
          .eq('stripe_customer_id', customerId)

        console.log(`Subscription updated for customer ${customerId}: ${status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabaseAdmin
          .from('users')
          .update({
            subscription_status: 'canceled',
            subscription_plan: null,
          })
          .eq('stripe_customer_id', customerId)

        console.log(`Subscription canceled for customer ${customerId}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabaseAdmin
          .from('users')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        console.log(`Payment failed for customer ${customerId}`)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
