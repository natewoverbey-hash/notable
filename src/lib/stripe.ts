import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const PRICES = {
  PRO_MONTHLY: 'price_1SyasWBPHwuVGwffyYMKlwPY',
  PRO_ANNUAL: 'price_1SyaswBPHwuVGwffgsL2DdjM',
}
