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
    console.log('[FINGERPRINT] hash:', hash.substring(0, 12), 'restaurant:', restaurantId);

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

    const currentService = getCurrentService(hours);

    // Déjà joué ce service aujourd'hui ?
    if (
      fingerprint.lastPlayedAt &&
      isToday(fingerprint.lastPlayedAt) &&
      fingerprint.lastServiceType === currentService
    ) {
      console.log('[FINGERPRINT] BLOCKED - lastPlayedAt:', fingerprint.lastPlayedAt, 'lastService:', fingerprint.lastServiceType, 'currentService:', currentService);
      return reply.send({
        fingerprintId: fingerprint.id,
        canPlay: false,
        reason: 'already_played_this_service',
        message: 'Vous avez déjà participé pendant ce service',
      });
    }

    console.log('[FINGERPRINT] OK canPlay=true, lastPlayedAt:', fingerprint.lastPlayedAt, 'lastService:', fingerprint.lastServiceType, 'currentService:', currentService);
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

    const serviceType = getCurrentService(hours);

    console.log('[FEEDBACK] fingerprintId:', fingerprintId, 'serviceType:', serviceType, 'lastPlayedAt:', fingerprint.lastPlayedAt, 'lastService:', fingerprint.lastServiceType);

    // Vérifier si déjà participé pendant ce service
    if (
      fingerprint.lastPlayedAt &&
      isToday(fingerprint.lastPlayedAt) &&
      fingerprint.lastServiceType === serviceType
    ) {
      console.log('[FEEDBACK] BLOCKED - already participated');
      return reply.status(403).send({
        error: true,
        message: 'Vous avez déjà participé pendant ce service',
      });
    }

    console.log('[FEEDBACK] OK - creating feedback');
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

    console.log('[SPIN] fingerprintId:', fingerprintId, 'lastPlayedAt:', fingerprint.lastPlayedAt, 'lastService:', fingerprint.lastServiceType, 'currentService:', currentService);
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
