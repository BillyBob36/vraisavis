import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/env.js';
import { stripe } from '../services/stripe.js';

export async function webhookRoutes(fastify: FastifyInstance) {
  // Stripe needs raw body for signature verification
  fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => {
    done(null, body);
  });

  fastify.post('/stripe', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!config.STRIPE_SECRET_KEY || !config.STRIPE_WEBHOOK_SECRET) {
      return reply.status(503).send({ error: true, message: 'Stripe non configuré' });
    }

    const sig = request.headers['stripe-signature'] as string;
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body as Buffer,
        sig,
        config.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err: any) {
      console.error('⚠️ Webhook signature failed:', err.message);
      return reply.status(400).send({ error: true, message: `Webhook Error: ${err.message}` });
    }

    console.log(`📨 Webhook Stripe: ${event.type}`);

    try {
      switch (event.type) {

        case 'invoice.paid': {
          const invoice = event.data.object as any;
          if (!invoice.subscription) break;

          const sub = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: invoice.subscription as string },
            include: { restaurant: { include: { vendor: true } } },
          });

          if (!sub) {
            console.warn(`⚠️ Subscription introuvable pour ${invoice.subscription}`);
            break;
          }

          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: 'ACTIVE',
              currentPeriodStart: new Date(invoice.period_start * 1000),
              currentPeriodEnd: new Date(invoice.period_end * 1000),
            },
          });

          // Enregistrer le paiement
          await prisma.payment.create({
            data: {
              subscriptionId: sub.id,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: 'succeeded',
              stripePaymentId: invoice.payment_intent as string || invoice.id,
              invoiceUrl: invoice.hosted_invoice_url || null,
            },
          });

          console.log(`✅ Subscription ${invoice.subscription} → ACTIVE`);

          // Split paiement vendeur si applicable
          if (sub.restaurant.vendorId && sub.restaurant.vendor?.stripeAccountId) {
            await handleVendorPayout(invoice, sub);
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          if (!invoice.subscription) break;

          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: { status: 'PAST_DUE' },
          });

          console.log(`❌ Paiement échoué: ${invoice.subscription}`);
          break;
        }

        case 'customer.subscription.updated': {
          const sub = event.data.object as any;

          const statusMap: Record<string, string> = {
            active: 'ACTIVE',
            past_due: 'PAST_DUE',
            canceled: 'CANCELED',
            trialing: 'TRIAL',
            incomplete: 'TRIAL',
            incomplete_expired: 'EXPIRED',
            unpaid: 'PAST_DUE',
          };

          const mappedStatus = statusMap[sub.status] || 'ACTIVE';

          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: sub.id as string },
            data: {
              status: mappedStatus as any,
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end || false,
            },
          });

          console.log(`🔄 Subscription ${sub.id} → ${mappedStatus}`);
          break;
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object as any;

          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: sub.id as string },
            data: {
              status: 'CANCELED',
              canceledAt: new Date(),
            },
          });

          // Suspendre le restaurant
          const canceledSub = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: sub.id as string },
          });
          if (canceledSub) {
            await prisma.restaurant.update({
              where: { id: canceledSub.restaurantId },
              data: { status: 'SUSPENDED' },
            });
          }

          console.log(`🛑 Subscription ${sub.id} annulée, restaurant suspendu`);
          break;
        }

        default:
          console.log(`ℹ️ Événement Stripe non géré: ${event.type}`);
      }

      return reply.send({ received: true });

    } catch (error: any) {
      console.error('Erreur traitement webhook:', error);
      return reply.status(500).send({ error: true, message: error.message });
    }
  });
}

async function handleVendorPayout(invoice: any, subscription: any) {
  const vendorAmount = subscription.restaurant.vendor.commissionAmount || 2500; // centimes

  try {
    const transfer = await stripe.transfers.create({
      amount: vendorAmount,
      currency: 'eur',
      destination: subscription.restaurant.vendor.stripeAccountId,
      transfer_group: `SUB_${subscription.id}`,
      metadata: {
        restaurantId: subscription.restaurant.id,
        vendorId: subscription.restaurant.vendorId,
        invoiceId: invoice.id,
      },
    });

    await prisma.commission.create({
      data: {
        vendorId: subscription.restaurant.vendorId,
        restaurantId: subscription.restaurant.id,
        amount: vendorAmount,
        status: 'PAID',
        paidAt: new Date(),
        stripeTransferId: transfer.id,
      },
    });

    console.log(`💰 Commission vendeur: ${vendorAmount / 100}€ → ${transfer.id}`);
  } catch (error: any) {
    console.error('Erreur transfert vendeur:', error.message);

    // Enregistrer la commission en PENDING pour retry manuel
    await prisma.commission.create({
      data: {
        vendorId: subscription.restaurant.vendorId,
        restaurantId: subscription.restaurant.id,
        amount: vendorAmount,
        status: 'PENDING',
      },
    });
  }
}
