import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { processFeedbackAI } from '../../services/feedback-ai/index.js';
import { 
  calculateDistance, 
  isWithinTimeRange, 
  isToday, 
  generateUniqueCode, 
  addDays,
  getTodayDateString,
  getCurrentService 
} from '../../utils/helpers.js';

const fingerprintSchema = z.object({
  hash: z.string().min(32),
  restaurantId: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const feedbackSchema = z.object({
  fingerprintId: z.string(),
  restaurantId: z.string(),
  positiveText: z.string().min(10),
  negativeText: z.string().optional(),
  positiveRating: z.number().int().min(1).max(5),
  negativeRating: z.number().int().min(0).max(5),
});

const spinSchema = z.object({
  fingerprintId: z.string(),
  restaurantId: z.string(),
});

const contactPrefsSchema = z.object({
  fingerprintId: z.string(),
  restaurantId: z.string(),
  wantNotifyOwn: z.boolean(),
  wantNotifyOthers: z.boolean(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
});

const claimSchema = z.object({
  code: z.string(),
});

export async function clientRoutes(fastify: FastifyInstance) {
  // Pas d'authentification requise - routes publiques

  // Enregistrer/vérifier fingerprint (point d'entrée unique : horaires + géo + doublon)
  fastify.post('/fingerprint', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = fingerprintSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const { hash, restaurantId, latitude, longitude } = body.data;

    // 1. Récupérer le restaurant avec toutes les infos nécessaires
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        serviceHours: true,
        latitude: true,
        longitude: true,
        geoRadius: true,
        status: true,
      },
    });

    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    if (restaurant.status !== 'ACTIVE') {
      return reply.send({ fingerprintId: null, canPlay: false, reason: 'inactive', message: 'Ce restaurant n\'accepte pas de feedback actuellement' });
    }

    // 2. Vérifier les horaires de service
    const hours = restaurant.serviceHours as {
      lunch: { start: string; end: string };
      dinner: { start: string; end: string };
    };

    const isInLunch = isWithinTimeRange(hours.lunch.start, hours.lunch.end);
    const isInDinner = isWithinTimeRange(hours.dinner.start, hours.dinner.end);

    if (!isInLunch && !isInDinner) {
      return reply.send({
        fingerprintId: null,
        canPlay: false,
        reason: 'closed',
        message: 'Le restaurant est actuellement fermé',
      });
    }

    // 3. Vérifier la géolocalisation (si fournie)
    if (latitude !== undefined && longitude !== undefined) {
      const distance = calculateDistance(latitude, longitude, restaurant.latitude, restaurant.longitude);
      if (distance > restaurant.geoRadius) {
        return reply.send({
          fingerprintId: null,
          canPlay: false,
          reason: 'too_far',
          message: 'Vous devez être dans le restaurant pour participer',
        });
      }
    }

    // 4. Chercher ou créer le fingerprint
    let fingerprint = await prisma.fingerprint.findUnique({
      where: { hash_restaurantId: { hash, restaurantId } },
    });

    if (!fingerprint) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);

      fingerprint = await prisma.fingerprint.create({
        data: { hash, restaurantId, expiresAt },
      });

      return reply.send({ fingerprintId: fingerprint.id, canPlay: true });
    }

    // 5. Vérifier si déjà joué ce service
    const currentService = getCurrentService(hours);

    if (
      fingerprint.lastPlayedAt &&
      isToday(fingerprint.lastPlayedAt) &&
      fingerprint.lastServiceType === currentService
    ) {
      return reply.send({
        fingerprintId: fingerprint.id,
        canPlay: false,
        reason: 'already_played_this_service',
        message: 'Vous avez déjà participé pendant ce service',
      });
    }

    return reply.send({ fingerprintId: fingerprint.id, canPlay: true });
  });

  // Soumettre un feedback
  fastify.post('/feedback', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = feedbackSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const { fingerprintId, restaurantId, positiveText, negativeText, positiveRating, negativeRating } = body.data;

    // Vérifier fingerprint
    const fingerprint = await prisma.fingerprint.findUnique({
      where: { id: fingerprintId },
    });

    if (!fingerprint || fingerprint.restaurantId !== restaurantId) {
      return reply.status(400).send({ error: true, message: 'Session invalide' });
    }

    // Déterminer le service actuel
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { serviceHours: true },
    });

    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const hours = restaurant.serviceHours as {
      lunch: { start: string; end: string };
      dinner: { start: string; end: string };
    };

    const serviceType = getCurrentService(hours);

    // Vérifier si déjà participé pendant ce service
    if (
      fingerprint.lastPlayedAt &&
      isToday(fingerprint.lastPlayedAt) &&
      fingerprint.lastServiceType === serviceType
    ) {
      return reply.status(403).send({
        error: true,
        message: 'Vous avez déjà participé pendant ce service',
      });
    }

    // Marquer comme ayant participé AVANT de créer le feedback
    await prisma.fingerprint.update({
      where: { id: fingerprintId },
      data: {
        lastPlayedAt: new Date(),
        lastServiceType: serviceType,
      },
    });

    // Créer le feedback
    const feedback = await prisma.feedback.create({
      data: {
        restaurantId,
        fingerprintId,
        positiveText,
        negativeText,
        positiveRating,
        negativeRating,
        serviceType,
      },
    });

    // Fire-and-forget: normalize + embed in background
    processFeedbackAI(feedback.id).catch(err => console.error('Background AI processing failed:', err));

    return reply.status(201).send({
      feedbackId: feedback.id,
      canSpin: true,
      message: 'Merci pour votre avis !',
    });
  });

  // Enregistrer les préférences de contact
  fastify.post('/contact-prefs', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = contactPrefsSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const { fingerprintId, restaurantId, wantNotifyOwn, wantNotifyOthers, contactEmail, contactPhone } = body.data;

    const fingerprint = await prisma.fingerprint.findUnique({
      where: { id: fingerprintId },
    });

    if (!fingerprint || fingerprint.restaurantId !== restaurantId) {
      return reply.status(400).send({ error: true, message: 'Session invalide' });
    }

    const needsContact = wantNotifyOwn || wantNotifyOthers;
    if (needsContact && !contactEmail && !contactPhone) {
      return reply.status(400).send({ error: true, message: 'Veuillez fournir un email ou un numéro de téléphone' });
    }

    await prisma.fingerprint.update({
      where: { id: fingerprintId },
      data: {
        wantNotifyOwn,
        wantNotifyOthers,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
      },
    });

    return reply.send({ success: true, message: 'Préférences enregistrées' });
  });

  // Tourner la machine à sous
  fastify.post('/spin', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = spinSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const { fingerprintId, restaurantId } = body.data;

    // Vérifier fingerprint
    const fingerprint = await prisma.fingerprint.findUnique({
      where: { id: fingerprintId },
    });

    if (!fingerprint || fingerprint.restaurantId !== restaurantId) {
      return reply.status(400).send({ error: true, message: 'Session invalide' });
    }

    // Récupérer le service actuel
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { serviceHours: true, thankYouMessage: true },
    });

    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const hours = restaurant.serviceHours as {
      lunch: { start: string; end: string };
      dinner: { start: string; end: string };
    };

    const currentService = getCurrentService(hours);

    // Note: la vérification anti-doublon est faite dans /feedback (pas ici)
    // Le spin est autorisé si le feedback a été soumis dans cette session

    // Récupérer les lots actifs du restaurant
    const today = getTodayDateString();
    const todayDate = new Date(today);

    // Récupérer tous les lots actifs du restaurant
    const activePrizes = await prisma.prize.findMany({
      where: { restaurantId, isActive: true },
    });

    // Auto-créer les dailyPrizePool pour aujourd'hui si elles n'existent pas
    for (const prize of activePrizes) {
      const existingPool = await prisma.dailyPrizePool.findUnique({
        where: { prizeId_date: { prizeId: prize.id, date: todayDate } },
      });
      if (!existingPool) {
        await prisma.dailyPrizePool.create({
          data: {
            prizeId: prize.id,
            restaurantId,
            date: todayDate,
            allocated: prize.maxPerDay || 10,
            claimed: 0,
          },
        });
      }
    }

    // Récupérer les pools du jour
    const pools = await prisma.dailyPrizePool.findMany({
      where: { 
        restaurantId, 
        date: todayDate,
      },
      include: { prize: true },
    });

    // Filtrer les lots encore disponibles
    const availablePrizes = pools
      .filter(p => p.claimed < p.allocated && p.prize.isActive)
      .map(p => ({
        ...p.prize,
        poolId: p.id,
        remaining: p.allocated - p.claimed,
      }));

    // Si pas de lots disponibles
    if (availablePrizes.length === 0) {
      return reply.send({
        won: false,
        message: restaurant.thankYouMessage || 'Merci pour votre participation !',
      });
    }

    // Tirage au sort pondéré par probabilité
    // probability = 1 signifie 100% de chance de gagner ce lot
    // On tire un nombre entre 0 et 1, puis on parcourt les lots
    const random = Math.random();

    // Trier par probabilité décroissante pour favoriser les lots à haute probabilité
    const sortedPrizes = [...availablePrizes].sort((a, b) => b.probability - a.probability);

    let wonPrize = null;

    for (const prize of sortedPrizes) {
      if (random <= prize.probability) {
        wonPrize = prize;
        break;
      }
    }

    // Si gagné
    if (wonPrize) {
      const code = generateUniqueCode();
      const expiresAt = addDays(new Date(), 7);

      await prisma.$transaction([
        prisma.prizeClaim.create({
          data: {
            code,
            prizeId: wonPrize.id,
            restaurantId,
            fingerprintId,
            expiresAt,
          },
        }),
        prisma.dailyPrizePool.update({
          where: { id: wonPrize.poolId },
          data: { claimed: { increment: 1 } },
        }),
      ]);

      return reply.send({
        won: true,
        prize: {
          name: wonPrize.name,
          description: wonPrize.description,
          code,
          expiresAt,
        },
        message: 'Félicitations ! Vous avez gagné !',
      });
    }

    return reply.send({
      won: false,
      message: restaurant.thankYouMessage || 'Pas de chance cette fois, mais merci !',
    });
  });

  // Vérifier un code cadeau (sans le consommer)
  fastify.post('/claim/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = claimSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Code invalide' });
    }

    const { code } = body.data;

    const claim = await prisma.prizeClaim.findUnique({
      where: { code },
      include: { prize: true },
    });

    if (!claim) {
      return reply.status(404).send({ error: true, message: 'Code non trouvé' });
    }

    if (claim.status === 'CLAIMED') {
      return reply.status(400).send({ error: true, message: 'Ce code a déjà été utilisé' });
    }

    if (claim.status === 'EXPIRED' || claim.expiresAt < new Date()) {
      await prisma.prizeClaim.update({
        where: { id: claim.id },
        data: { status: 'EXPIRED' },
      });
      return reply.status(400).send({ error: true, message: 'Ce code a expiré' });
    }

    return reply.send({
      valid: true,
      prize: {
        name: claim.prize.name,
        description: claim.prize.description,
      },
    });
  });

  // Réclamer un lot (validation par le personnel)
  fastify.post('/claim', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = claimSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Code invalide' });
    }

    const { code } = body.data;

    const claim = await prisma.prizeClaim.findUnique({
      where: { code },
      include: { prize: true },
    });

    if (!claim) {
      return reply.status(404).send({ error: true, message: 'Code non trouvé' });
    }

    if (claim.status === 'CLAIMED') {
      return reply.status(400).send({ error: true, message: 'Ce code a déjà été utilisé' });
    }

    if (claim.status === 'EXPIRED' || claim.expiresAt < new Date()) {
      await prisma.prizeClaim.update({
        where: { id: claim.id },
        data: { status: 'EXPIRED' },
      });
      return reply.status(400).send({ error: true, message: 'Ce code a expiré' });
    }

    // Marquer comme réclamé
    await prisma.prizeClaim.update({
      where: { id: claim.id },
      data: {
        status: 'CLAIMED',
        claimedAt: new Date(),
      },
    });

    return reply.send({
      success: true,
      prize: {
        name: claim.prize.name,
        description: claim.prize.description,
      },
      message: 'Cadeau validé ! Bonne dégustation !',
    });
  });

  // Récupérer les infos d'un restaurant (pour la page publique)
  fastify.get('/restaurant/:id', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    const { id } = request.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        welcomeMessage: true,
        thankYouMessage: true,
        serviceHours: true,
        status: true,
        clientTemplate: true,
        googleReviewUrl: true,
        prizes: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    if (restaurant.status !== 'ACTIVE') {
      return reply.status(403).send({ 
        error: true, 
        message: 'Ce restaurant n\'accepte pas de feedback actuellement' 
      });
    }

    return reply.send({ restaurant });
  });
}
