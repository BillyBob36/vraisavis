import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import QRCode from 'qrcode';
import { prisma } from '../../lib/prisma.js';
import { requireManager } from '../../middleware/auth.js';
import { config } from '../../config/env.js';

const updateRestaurantSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  phone: z.string().nullable().optional(),
  geoRadius: z.number().int().min(10).max(1000).optional(),
  serviceHours: z.object({
    lunch: z.object({ start: z.string(), end: z.string() }),
    dinner: z.object({ start: z.string(), end: z.string() }),
  }).optional(),
  welcomeMessage: z.string().nullable().optional(),
  thankYouMessage: z.string().nullable().optional(),
  clientTemplate: z.enum(['classic', 'glass']).optional(),
});

const createPrizeSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  probability: z.number().min(0).max(1),
  maxPerDay: z.number().int().min(1).optional(),
  maxPerWeek: z.number().int().min(1).optional(),
});

const updatePrizeSchema = createPrizeSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export async function managerRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireManager);

  // Helper pour récupérer le restaurant du manager
  async function getManagerRestaurant(userId: string) {
    return prisma.restaurant.findFirst({
      where: { managerId: userId },
    });
  }

  // Dashboard
  fastify.get('/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalFeedbacks,
      unreadFeedbacks,
      todayFeedbacks,
      pendingClaims,
      subscription,
    ] = await Promise.all([
      prisma.feedback.count({ where: { restaurantId: restaurant.id } }),
      prisma.feedback.count({ where: { restaurantId: restaurant.id, isRead: false } }),
      prisma.feedback.count({ 
        where: { 
          restaurantId: restaurant.id, 
          createdAt: { gte: today } 
        } 
      }),
      prisma.prizeClaim.count({ 
        where: { 
          restaurantId: restaurant.id, 
          status: 'PENDING' 
        } 
      }),
      prisma.subscription.findUnique({
        where: { restaurantId: restaurant.id },
        include: { plan: true },
      }),
    ]);

    // Stats des 7 derniers jours
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyFeedbacks = await prisma.feedback.groupBy({
      by: ['createdAt'],
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: weekAgo },
      },
      _count: true,
    });

    return reply.send({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        status: restaurant.status,
      },
      stats: {
        totalFeedbacks,
        unreadFeedbacks,
        todayFeedbacks,
        pendingClaims,
      },
      subscription,
      weeklyFeedbacks,
    });
  });

  // === FEEDBACKS ===
  fastify.get('/feedbacks', async (request: FastifyRequest<{
    Querystring: { page?: string; limit?: string; filter?: string }
  }>, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const page = parseInt(request.query.page || '1');
    const limit = parseInt(request.query.limit || '20');
    const filter = request.query.filter;

    const where: Record<string, unknown> = { restaurantId: restaurant.id };
    if (filter === 'unread') where.isRead = false;
    if (filter === 'unprocessed') where.isProcessed = false;

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feedback.count({ where }),
    ]);

    return reply.send({
      feedbacks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  fastify.patch('/feedbacks/:id', async (request: FastifyRequest<{
    Params: { id: string };
    Body: { isRead?: boolean; isProcessed?: boolean };
  }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { isRead, isProcessed } = request.body as { isRead?: boolean; isProcessed?: boolean };

    const feedback = await prisma.feedback.update({
      where: { id },
      data: { isRead, isProcessed },
    });

    return reply.send({ feedback });
  });

  fastify.get('/feedbacks/export', async (request: FastifyRequest, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' },
    });

    // Générer CSV
    const headers = 'Date,Service,Positif,Négatif,Lu,Traité\n';
    const rows = feedbacks.map(f => 
      `"${f.createdAt.toISOString()}","${f.serviceType}","${f.positiveText.replace(/"/g, '""')}","${(f.negativeText || '').replace(/"/g, '""')}","${f.isRead}","${f.isProcessed}"`
    ).join('\n');

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', `attachment; filename="feedbacks-${restaurant.id}.csv"`);
    return reply.send(headers + rows);
  });

  // === PRIZES ===
  fastify.get('/prizes', async (request: FastifyRequest, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const prizes = await prisma.prize.findMany({
      where: { restaurantId: restaurant.id },
      include: {
        _count: { select: { claims: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ prizes });
  });

  fastify.post('/prizes', async (request: FastifyRequest, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const body = createPrizeSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const prize = await prisma.prize.create({
      data: {
        ...body.data,
        restaurantId: restaurant.id,
      },
    });

    return reply.status(201).send({ prize });
  });

  fastify.patch('/prizes/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = updatePrizeSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const prize = await prisma.prize.update({
      where: { id },
      data: body.data,
    });

    return reply.send({ prize });
  });

  fastify.delete('/prizes/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    // Soft delete - désactiver
    await prisma.prize.update({
      where: { id },
      data: { isActive: false },
    });

    return reply.send({ message: 'Lot désactivé' });
  });

  // === CLAIMS ===
  fastify.get('/claims', async (request: FastifyRequest<{
    Querystring: { status?: string }
  }>, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const where: Record<string, unknown> = { restaurantId: restaurant.id };
    if (request.query.status) {
      where.status = request.query.status.toUpperCase();
    }

    const claims = await prisma.prizeClaim.findMany({
      where,
      include: {
        prize: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ claims });
  });

  // === RESTAURANT ===
  fastify.get('/restaurant', async (request: FastifyRequest, reply: FastifyReply) => {
    const restaurant = await prisma.restaurant.findFirst({
      where: { managerId: request.user.id },
      include: {
        subscription: { include: { plan: true } },
      },
    });

    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    return reply.send({ restaurant });
  });

  fastify.patch('/restaurant', async (request: FastifyRequest, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const body = updateRestaurantSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const updated = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: body.data,
    });

    return reply.send({ restaurant: updated });
  });

  // Générer QR Code
  fastify.post('/restaurant/qrcode', async (request: FastifyRequest, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const url = `${config.CLIENT_URL}/r/${restaurant.id}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { qrCodeUrl: qrDataUrl },
    });

    return reply.send({ qrCodeUrl: qrDataUrl, url });
  });

  // === SUBSCRIPTION ===
  fastify.get('/subscription', async (request: FastifyRequest, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { restaurantId: restaurant.id },
      include: {
        plan: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    return reply.send({ subscription });
  });

  // Upgrade - placeholder pour Stripe
  fastify.post('/subscription/upgrade', async (request: FastifyRequest, reply: FastifyReply) => {
    // TODO: Implémenter avec Stripe Checkout
    return reply.status(501).send({ error: true, message: 'Stripe non configuré' });
  });

  // Cancel - placeholder pour Stripe
  fastify.post('/subscription/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    // TODO: Implémenter avec Stripe
    return reply.status(501).send({ error: true, message: 'Stripe non configuré' });
  });

  // === STATS ===
  fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Feedbacks par jour (utiliser Prisma au lieu de raw query)
    const feedbacksByDay = await prisma.feedback.groupBy({
      by: ['createdAt'],
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    });

    // Feedbacks par service
    const feedbacksByService = await prisma.feedback.groupBy({
      by: ['serviceType'],
      where: { restaurantId: restaurant.id },
      _count: true,
    });

    // Lots les plus gagnés
    const topPrizes = await prisma.prizeClaim.groupBy({
      by: ['prizeId'],
      where: { restaurantId: restaurant.id },
      _count: true,
      orderBy: { _count: { prizeId: 'desc' } },
      take: 5,
    });

    // Totaux
    const totalFeedbacks = await prisma.feedback.count({
      where: { restaurantId: restaurant.id },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayFeedbacks = await prisma.feedback.count({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: todayStart },
      },
    });

    const totalPrizesClaimed = await prisma.prizeClaim.count({
      where: { restaurantId: restaurant.id, status: 'CLAIMED' },
    });

    const todayPrizesClaimed = await prisma.prizeClaim.count({
      where: {
        restaurantId: restaurant.id,
        status: 'CLAIMED',
        claimedAt: { gte: todayStart },
      },
    });

    const uniqueVisitors = await prisma.fingerprint.count({
      where: { restaurantId: restaurant.id },
    });

    const daysActive = Math.max(1, Math.ceil((Date.now() - restaurant.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    const averageFeedbacksPerDay = totalFeedbacks / daysActive;

    return reply.send({
      totalFeedbacks,
      todayFeedbacks,
      totalPrizesClaimed,
      todayPrizesClaimed,
      uniqueVisitors,
      averageFeedbacksPerDay,
      feedbacksByDay,
      feedbacksByService,
      topPrizes,
    });
  });
}
