import 'server-only';
import Stripe from 'stripe';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  _stripe = new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  });
  return _stripe;
}

// Proxy so `stripe.checkout.sessions.create(...)` works and lazy-initializes.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export const STRIPE_PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY ?? '';
export const STRIPE_PRICE_ANNUAL = process.env.STRIPE_PRICE_ANNUAL ?? '';
