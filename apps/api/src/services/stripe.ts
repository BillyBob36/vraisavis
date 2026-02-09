import Stripe from 'stripe';
import { config } from '../config/env.js';

function createStripeClient(): Stripe {
  if (!config.STRIPE_SECRET_KEY) {
    // Return a proxy that throws clear errors when used without config
    return new Proxy({} as Stripe, {
      get(_, prop) {
        if (prop === 'webhooks') {
          return {
            constructEvent: () => { throw new Error('Stripe non configuré (STRIPE_SECRET_KEY manquant)'); },
          };
        }
        return () => { throw new Error('Stripe non configuré (STRIPE_SECRET_KEY manquant)'); };
      },
    });
  }
  return new Stripe(config.STRIPE_SECRET_KEY, { typescript: true });
}

export const stripe = createStripeClient();
