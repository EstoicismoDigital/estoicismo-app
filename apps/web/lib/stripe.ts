import 'server-only';
import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});

export const STRIPE_PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY ?? '';
export const STRIPE_PRICE_ANNUAL = process.env.STRIPE_PRICE_ANNUAL ?? '';
