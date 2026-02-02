import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const PRICES = {
  BETA_MONTHLY: 'price_1SwRe8BPHwuVGwffhQF5mFrI',
  BETA_ANNUAL: 'price_1SwRegBPHwuVGwffbLvtxebL',
}
