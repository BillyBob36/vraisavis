import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { 
  calculateDistance, 
  isWithinTimeRange, 
  isToday, 
  generateUniqueCode, 
  addDays,
  getTodayDateString 
} from '../../utils/helpers.js';

const verifyLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  restaurantId: z.string(),
});

const fingerprintSchema = z.object({
  hash: z.string().min(32),
  restaurantId: z.string(),
});

const feedbackSchema = z.object({
  fingerprintId: z.string(),
  restaurantId: z.string(),
  positiveText: z.string().min(10),
  negativeText: z.string().optional(),
});

const spinSchema = z.object({
  fingerprintId: z.string(),
  restaurantId: z.string(),
});

const claimSchema = z.object({
  code: z.string(),
});

export async function clientRoutes(fastify: FastifyInstance) {
  // Pas d'authentification requise - routes publiques

  // Vérifier la localisation
  fastify.post('/verify-location', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = verifyLocationSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const { latitude, longitude, restaurantId } = body.data;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        geoRadius: true,
        status: true,
        serviceHours: true,
        welcomeMessage: true,
      },
    });

    if (!restaurant) {
      return reply.status(404).send({ 
        allowed: false, 
        message: 'Restaurant non trouvé' 
      });
    }

    if (restaurant.status !== 'ACTIVE') {
      return reply.status(403).send({ 
        allowed: false, 
        message: 'Ce restaurant n\'accepte pas de feedback actuellement' 
      });
    }

    // Calculer la distance
    const distance = calculateDistance(
      latitude, 
      longitude, 
      restaurant.latitude, 
      restaurant.longitude
    );

    if (distance > restaurant.geoRadius) {
      return reply.send({
        allowed: false,
        message: 'Vous devez être dans le restaurant pour laisser un feedback',
        distance: Math.round(distance),
        maxDistance: restaurant.geoRadius,
      });
    }

    // Vérifier les horaires de service
    const serviceHours = restaurant.serviceHours as {
      lunch: { start: string; end: string };
      dinner: { start: string; end: string };
    };

    let currentService: string | null = null;
    if (isWithinTimeRange(serviceHours.lunch.start, serviceHours.lunch.end)) {
      currentService = 'lunch';
    } else if (isWithinTimeRange(serviceHours.dinner.start, serviceHours.dinner.end)) {
      currentService = 'dinner';
    }

    if (!currentService) {
      return reply.send({
        allowed: false,
        message: 'Le restaurant est actuellement fermé',
        serviceHours,
      });
    }

    return reply.send({
      allowed: true,
      message: restaurant.welcomeMessage || 'Bienvenue ! Laissez-nous votre avis.',
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
      },
      currentService,
    });
  });

  // Enregistrer/vérifier fingerprint
  fastify.post('/fingerprint', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = fingerprintSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const { hash, restaurantId } = body.data;

    // Chercher fingerprint existant
    let fingerprint = await prisma.fingerprint.findUnique({
      where: { hash_restaurantId: { hash, restaurantId } },
    });

    // Créer si n'existe pas
    if (!fingerprint) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3); // Expire dans 3 mois

      fingerprint = await prisma.fingerprint.create({
        data: {
          hash,
          restaurantId,
          expiresAt,
        },
      });

      return reply.send({
        fingerprintId: fingerprint.id,
        canPlay: true,
      });
    }

    // Vérifier si peut jouer
    const serviceHours = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { serviceHours: true },
    });

    if (!serviceHours) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    const hours = serviceHours.serviceHours as {
      lunch: { start: string; end: string };
      dinner: { start: string; end: string };
    };

    let currentService: string | null = null;
    if (isWithinTimeRange(hours.lunch.start, hours.lunch.end)) {
      currentService = 'lunch';
    } else if (isWithinTimeRange(hours.dinner.start, hours.dinner.end)) {
      currentService = 'dinner';
    }

    // Déjà joué ce service aujourd'hui ?
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

    return reply.send({
      fingerprintId: fingerprint.id,
      canPlay: true,
    });
  });

  // Soumettre un feedback
  fastify.post('/feedback', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = feedbackSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const { fingerprintId, restaurantId, positiveText, negativeText } = body.data;

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

    let serviceType = 'lunch';
    if (isWithinTimeRange(hours.dinner.start, hours.dinner.end)) {
      serviceType = 'dinner';
    }

    // Créer le feedback
    const feedback = await prisma.feedback.create({
      data: {
        restaurantId,
        fingerprintId,
        positiveText,
        negativeText,
        serviceType,
      },
    });

    return reply.status(201).send({
      feedbackId: feedback.id,
      canSpin: true,
      message: 'Merci pour votre avis !',
    });
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

    let currentService = 'lunch';
    if (isWithinTimeRange(hours.dinner.start, hours.dinner.end)) {
      currentService = 'dinner';
    }

    // Vérifier si déjà joué
    if (
      fingerprint.lastPlayedAt &&
      isToday(fingerprint.lastPlayedAt) &&
      fingerprint.lastServiceType === currentService
    ) {
      return reply.status(403).send({
        error: true,
        message: 'Vous avez déjà joué pendant ce service',
      });
    }

    // Récupérer les lots disponibles
    const today = getTodayDateString();
    const pools = await prisma.dailyPrizePool.findMany({
      where: { 
        restaurantId, 
        date: new Date(today),
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

    // Mettre à jour le fingerprint
    await prisma.fingerprint.update({
      where: { id: fingerprintId },
      data: {
        lastPlayedAt: new Date(),
        lastServiceType: currentService,
      },
    });

    // Si pas de lots disponibles
    if (availablePrizes.length === 0) {
      return reply.send({
        won: false,
        message: restaurant.thankYouMessage || 'Merci pour votre participation !',
      });
    }

    // Tirage au sort pondéré
    const totalWeight = availablePrizes.reduce((sum, p) => sum + p.probability, 0);
    const random = Math.random() * (totalWeight + 0.3); // 30% de chance de ne rien gagner

    let cumulative = 0;
    let wonPrize = null;

    for (const prize of availablePrizes) {
      cumulative += prize.probability;
      if (random <= cumulative) {
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
        serviceHours: true,
        status: true,
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
