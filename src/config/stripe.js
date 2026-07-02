import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET || 'dummy_stripe_secret';
export const stripe = new Stripe(stripeSecret, {
  apiVersion: '2022-11-15' // or stable version compatible with the package
});
