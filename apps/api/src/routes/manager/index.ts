import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import QRCode from 'qrcode';
import { prisma } from '../../lib/prisma.js';
import { requireManager } from '../../middleware/auth.js';
import { config } from '../../config/env.js';
import { notifyClient } from '../../services/notifications/sender.js';
import { backfillFeedbacks } from '../../services/feedback-ai/index.js';

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
    Querystring: {
      page?: string;
      limit?: string;
      filter?: string;
      search?: string;
      sentiment?: string;
      dateFrom?: string;
      dateTo?: string;
      service?: string;
      wantsNotify?: string;
      sort?: string;
      order?: string;
    }
  }>, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const page = parseInt(request.query.page || '1');
    const limit = parseInt(request.query.limit || '20');
    const filter = request.query.filter;
    const search = request.query.search?.trim();
    const sentiment = request.query.sentiment;
    const dateFrom = request.query.dateFrom;
    const dateTo = request.query.dateTo;
    const service = request.query.service;
    const wantsNotify = request.query.wantsNotify;
    const sort = request.query.sort || 'createdAt';
    const order = request.query.order || 'desc';

    // Build where clause using AND array to avoid conflicts
    const andConditions: Record<string, unknown>[] = [];

    // Base filter
    const where: Record<string, unknown> = { restaurantId: restaurant.id };
    if (filter === 'unread') where.isRead = false;
    if (filter === 'unprocessed') where.isProcessed = false;

    // Search by keyword in positive or negative text
    if (search) {
      andConditions.push({
        OR: [
          { positiveText: { contains: search, mode: 'insensitive' } },
          { negativeText: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Sentiment filter
    if (sentiment === 'positive') {
      andConditions.push({ positiveText: { not: '' } });
      andConditions.push({ OR: [{ negativeText: null }, { negativeText: '' }] });
    } else if (sentiment === 'negative') {
      andConditions.push({ negativeText: { not: '' } });
      andConditions.push({ NOT: { negativeText: null } });
    }

    // Date range
    const createdAtFilter: Record<string, unknown> = {};
    if (dateFrom) createdAtFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      createdAtFilter.lte = endDate;
    }
    if (Object.keys(createdAtFilter).length > 0) {
      where.createdAt = createdAtFilter;
    }

    // Service type
    if (service && (service === 'lunch' || service === 'dinner')) {
      where.serviceType = service;
    }

    // Wants notification filter
    if (wantsNotify === 'true') {
      where.fingerprint = { OR: [{ wantNotifyOwn: true }, { wantNotifyOthers: true }] };
    }

    // Combine AND conditions
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Sort
    const orderBy: Record<string, string> = {};
    if (sort === 'createdAt' || sort === 'serviceType') {
      orderBy[sort] = order === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [feedbacks, total, totalAll, totalUnread] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          fingerprint: {
            select: {
              wantNotifyOwn: true,
              wantNotifyOthers: true,
              contactEmail: true,
              contactPhone: true,
            },
          },
        },
      }),
      prisma.feedback.count({ where }),
      prisma.feedback.count({ where: { restaurantId: restaurant.id } }),
      prisma.feedback.count({ where: { restaurantId: restaurant.id, isRead: false } }),
    ]);

    return reply.send({
      feedbacks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalAll,
        totalUnread,
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
    const rows = feedbacks.map((f: { createdAt: Date; serviceType: string; positiveText: string; negativeText: string | null; isRead: boolean; isProcessed: boolean }) => 
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
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const prize = await prisma.prize.findFirst({
      where: { id, restaurantId: restaurant.id },
    });
    if (!prize) {
      return reply.status(404).send({ error: true, message: 'Lot non trouvé' });
    }

    // Supprimer les dépendances puis le lot
    await prisma.$transaction([
      prisma.prizeClaim.deleteMany({ where: { prizeId: id } }),
      prisma.dailyPrizePool.deleteMany({ where: { prizeId: id } }),
      prisma.prize.delete({ where: { id } }),
    ]);

    return reply.send({ message: 'Lot supprimé définitivement' });
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

  // === MESSAGING SETTINGS ===
  fastify.get('/messaging', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        phone: true,
        preferredMessaging: true,
        telegramChatId: true,
        whatsappNumber: true,
        whatsappVerified: true,
        messagingOptIn: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: true, message: 'Utilisateur non trouvé' });
    }

    return reply.send({
      phone: user.phone,
      preferredMessaging: user.preferredMessaging,
      telegramLinked: !!user.telegramChatId,
      whatsappNumber: user.whatsappNumber,
      whatsappVerified: user.whatsappVerified,
      messagingOptIn: user.messagingOptIn,
    });
  });

  fastify.patch('/messaging', async (request: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      preferredMessaging: z.enum(['TELEGRAM', 'WHATSAPP']).nullable().optional(),
      messagingOptIn: z.boolean().optional(),
      phone: z.string().optional(),
    });

    const body = schema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const data: Record<string, unknown> = {};
    if (body.data.preferredMessaging !== undefined) data.preferredMessaging = body.data.preferredMessaging;
    if (body.data.messagingOptIn !== undefined) data.messagingOptIn = body.data.messagingOptIn;
    if (body.data.phone !== undefined) data.phone = body.data.phone;

    await prisma.user.update({
      where: { id: request.user.id },
      data,
    });

    return reply.send({ message: 'Paramètres de messagerie mis à jour' });
  });

  // Generate Telegram link
  fastify.post('/messaging/telegram-link', async (request: FastifyRequest, reply: FastifyReply) => {
    const managerId = request.user.id;

    // Generate a unique link code
    const code = `link_${managerId}_${Date.now().toString(36)}`;

    await prisma.messagingVerification.create({
      data: {
        managerId,
        phoneNumber: 'telegram-link',
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Try to get bot username
    let botLink = '';
    if (config.TELEGRAM_BOT_TOKEN) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/getMe`);
        const data = await res.json() as { result?: { username?: string } };
        const username = data.result?.username || 'VraisAvisBot';
        botLink = `https://t.me/${username}?start=${code}`;
      } catch {
        botLink = `Code: ${code}`;
      }
    }

    return reply.send({ code, botLink });
  });

  // Unlink Telegram
  fastify.delete('/messaging/telegram', async (request: FastifyRequest, reply: FastifyReply) => {
    await prisma.user.update({
      where: { id: request.user.id },
      data: {
        telegramChatId: null,
        preferredMessaging: null,
      },
    });

    return reply.send({ message: 'Telegram délié' });
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

  // === IMPROVEMENTS ===

  // Analyze: AI matches improvement text against negative feedbacks
  fastify.post('/improvements', async (request: FastifyRequest<{
    Body: { description: string }
  }>, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const { description } = request.body as { description: string };
    if (!description || description.trim().length < 3) {
      return reply.status(400).send({ error: true, message: 'Description trop courte' });
    }

    // Fetch negative feedbacks with fingerprints that want notifications
    const negativeFeedbacks = await prisma.feedback.findMany({
      where: {
        restaurantId: restaurant.id,
        negativeText: { not: '' },
        NOT: { negativeText: null },
      },
      include: {
        fingerprint: {
          select: {
            id: true,
            wantNotifyOwn: true,
            wantNotifyOthers: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    type FeedbackWithFP = typeof negativeFeedbacks[number];

    // Use Azure OpenAI to match the improvement against negative feedbacks
    const feedbackTexts = negativeFeedbacks.map((f: FeedbackWithFP, i: number) => `[${i}] ${f.negativeText}`).join('\n');

    const azureEndpoint = config.AZURE_OPENAI_ENDPOINT;
    const azureKey = config.AZURE_OPENAI_API_KEY;
    const deployment = config.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = config.AZURE_OPENAI_API_VERSION;

    let matchedIndices: number[] = [];

    if (azureEndpoint && azureKey) {
      try {
        const apiUrl = `${azureEndpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': azureKey,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `Tu es un assistant qui analyse des commentaires négatifs de clients de restaurant.
On te donne une amélioration faite par le restaurateur et une liste de commentaires négatifs numérotés.
Retourne UNIQUEMENT un tableau JSON d'indices (nombres) des commentaires qui sont directement liés à cette amélioration.
Si aucun commentaire ne correspond, retourne [].
Réponds UNIQUEMENT avec le tableau JSON, rien d'autre.`,
              },
              {
                role: 'user',
                content: `Amélioration : "${description.trim()}"\n\nCommentaires négatifs :\n${feedbackTexts}`,
              },
            ],
            temperature: 0.1,
            max_tokens: 1000,
          }),
        });

        if (res.ok) {
          const data = await res.json() as { choices: Array<{ message: { content: string } }> };
          const content = data.choices?.[0]?.message?.content?.trim() || '[]';
          const jsonMatch = content.match(/\[[\d\s,]*\]/);
          if (jsonMatch) {
            matchedIndices = JSON.parse(jsonMatch[0]);
          }
        } else {
          console.error('Azure OpenAI API error:', res.status, await res.text());
        }
      } catch (err) {
        console.error('OpenAI matching error:', err);
      }
    }

    // Fallback: simple keyword matching if AI fails
    if (matchedIndices.length === 0) {
      const keywords = description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      matchedIndices = negativeFeedbacks
        .map((f: FeedbackWithFP, i: number) => {
          const text = (f.negativeText || '').toLowerCase();
          const matches = keywords.filter(k => text.includes(k));
          return matches.length > 0 ? i : -1;
        })
        .filter((i: number) => i >= 0);
    }

    const matchedFeedbacks = matchedIndices
      .filter(i => i >= 0 && i < negativeFeedbacks.length)
      .map(i => negativeFeedbacks[i]);

    // Count notifiable clients
    const notifiableCount = matchedFeedbacks.filter(
      (f: FeedbackWithFP) => (f.fingerprint.wantNotifyOwn || f.fingerprint.wantNotifyOthers) &&
           (f.fingerprint.contactEmail || f.fingerprint.contactPhone)
    ).length;

    // Create improvement record
    const improvement = await prisma.improvement.create({
      data: {
        description: description.trim(),
        restaurantId: restaurant.id,
        matchedFeedbackIds: matchedFeedbacks.map(f => f.id),
      },
    });

    return reply.send({
      improvement,
      matchedFeedbacks: matchedFeedbacks.map((f: FeedbackWithFP) => ({
        id: f.id,
        negativeText: f.negativeText,
        positiveText: f.positiveText,
        createdAt: f.createdAt,
        serviceType: f.serviceType,
        wantsNotify: (f.fingerprint.wantNotifyOwn || f.fingerprint.wantNotifyOthers) &&
                     !!(f.fingerprint.contactEmail || f.fingerprint.contactPhone),
      })),
      notifiableCount,
    });
  });

  // List improvements
  fastify.get('/improvements', async (request: FastifyRequest, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const improvements = await prisma.improvement.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reply.send({ improvements });
  });

  // Notify clients about an improvement
  fastify.post('/improvements/:id/notify', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const { id } = request.params;

    const improvement = await prisma.improvement.findFirst({
      where: { id, restaurantId: restaurant.id },
    });

    if (!improvement) {
      return reply.status(404).send({ error: true, message: 'Amélioration non trouvée' });
    }

    if (improvement.status === 'NOTIFIED') {
      return reply.status(400).send({ error: true, message: 'Les clients ont déjà été notifiés pour cette amélioration' });
    }

    const feedbackIds = improvement.matchedFeedbackIds as string[];

    // Get unique fingerprints that want notifications
    const feedbacks = await prisma.feedback.findMany({
      where: { id: { in: feedbackIds } },
      include: {
        fingerprint: {
          select: {
            id: true,
            wantNotifyOwn: true,
            wantNotifyOthers: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
      },
    });

    // Deduplicate by fingerprint ID
    type NotifyFB = typeof feedbacks[number];
    const seen = new Set<string>();
    const uniqueFingerprints = feedbacks
      .filter((f: NotifyFB) => {
        if (seen.has(f.fingerprintId)) return false;
        seen.add(f.fingerprintId);
        return (f.fingerprint.wantNotifyOwn || f.fingerprint.wantNotifyOthers) &&
               (f.fingerprint.contactEmail || f.fingerprint.contactPhone);
      })
      .map((f: NotifyFB) => f.fingerprint);

    let notifiedCount = 0;
    const notifications: Array<{
      fingerprintId: string;
      channel: string;
      destination: string;
      success: boolean;
    }> = [];

    for (const fp of uniqueFingerprints) {
      const result = await notifyClient(
        restaurant.name,
        improvement.description,
        fp.contactEmail,
        fp.contactPhone,
      );

      if (result.emailSent) {
        notifications.push({
          fingerprintId: fp.id,
          channel: 'email',
          destination: fp.contactEmail!,
          success: true,
        });
        notifiedCount++;
      }

      if (result.smsSent) {
        notifications.push({
          fingerprintId: fp.id,
          channel: 'sms',
          destination: fp.contactPhone!,
          success: true,
        });
        notifiedCount++;
      }
    }

    // Save notifications
    if (notifications.length > 0) {
      await prisma.improvementNotification.createMany({
        data: notifications.map(n => ({
          improvementId: improvement.id,
          fingerprintId: n.fingerprintId,
          channel: n.channel,
          destination: n.destination,
          success: n.success,
        })),
      });
    }

    // Update improvement status
    await prisma.improvement.update({
      where: { id: improvement.id },
      data: {
        status: 'NOTIFIED',
        notifiedAt: new Date(),
        notifiedCount,
      },
    });

    return reply.send({
      success: true,
      notifiedCount,
      message: `${notifiedCount} notification(s) envoyée(s)`,
    });
  });

  // === BACKFILL AI ===
  fastify.post('/feedbacks/backfill-ai', async (request: FastifyRequest, reply: FastifyReply) => {
    const restaurant = await getManagerRestaurant(request.user.id);
    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    // Run backfill in background
    const result = await backfillFeedbacks(restaurant.id);

    return reply.send({
      success: true,
      processed: result.processed,
      errors: result.errors,
      message: `${result.processed} avis traités, ${result.errors} erreurs`,
    });
  });
}
