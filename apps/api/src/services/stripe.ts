import Stripe from 'stripe';
import { config } from '../config/env.js';

export const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  typescript: true,
});
