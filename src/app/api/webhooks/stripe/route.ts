import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log('Webhook received:', body.type)

    switch (body.type) {
      case 'checkout.session.completed': {
        const session = body.data.object
        const clerkUserId = session.metadata?.clerk_user_id
        const customerId = session.customer
        const subscriptionId = session.subscription

        console.log('Processing checkout for clerk user:', clerkUserId)
        console.log('Customer ID:', customerId)
        console.log('Subscription ID:', subscriptionId)

        if (clerkUserId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = subscription.items.data[0]?.price.id
          
          let plan = 'beta'
          if (priceId === 'price_1SwRegBPHwuVGwffbLvtxebL') {
            plan = 'beta_annual'
          }

          console.log('Updating user with plan:', plan)

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
        const subscription = body.data.object
        const customerId = subscription.customer
        const status = subscription.status === 'active' ? 'active' : subscription.status

        await supabaseAdmin
          .from('users')
          .update({ subscription_status: status })
          .eq('stripe_customer_id', customerId)

        console.log(`Subscription updated for customer ${customerId}: ${status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = body.data.object
        const customerId = subscription.customer

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
        const invoice = body.data.object
        const customerId = invoice.customer

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
