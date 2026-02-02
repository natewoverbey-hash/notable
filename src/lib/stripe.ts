import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export const PRICES = {
  BETA_MONTHLY: process.env.STRIPE_BETA_MONTHLY_PRICE_ID!,
  BETA_ANNUAL: process.env.STRIPE_BETA_ANNUAL_PRICE_ID!,
}
