import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/env.js';

export async function webhookRoutes(fastify: FastifyInstance) {
  // Stripe webhooks - placeholder
  fastify.post('/stripe', {
    config: {
      rawBody: true,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    // TODO: Implémenter la vérification de signature Stripe
    // const sig = request.headers['stripe-signature'];
    
    if (!config.STRIPE_SECRET_KEY || !config.STRIPE_WEBHOOK_SECRET) {
      return reply.status(503).send({ error: true, message: 'Stripe non configuré' });
    }

    // Placeholder pour les différents événements
    const body = request.body as { type?: string; data?: { object?: Record<string, unknown> } };
    const eventType = body?.type;

    fastify.log.info(`Webhook Stripe reçu: ${eventType}`);

    switch (eventType) {
      case 'checkout.session.completed':
        // TODO: Gérer inscription payée
        break;

      case 'invoice.paid':
        // TODO: Gérer paiement réussi + trigger commission vendeur
        break;

      case 'invoice.payment_failed':
        // TODO: Mettre à jour statut subscription
        break;

      case 'customer.subscription.updated':
        // TODO: Sync statut subscription
        break;

      case 'customer.subscription.deleted':
        // TODO: Marquer subscription comme annulée
        break;

      default:
        fastify.log.info(`Événement Stripe non géré: ${eventType}`);
    }

    return reply.send({ received: true });
  });
}
