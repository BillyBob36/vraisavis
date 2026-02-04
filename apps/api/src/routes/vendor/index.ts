import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireVendor } from '../../middleware/auth.js';
import { config } from '../../config/env.js';
import { vendorContractRoutes } from './contracts.js';

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
});

const createRestaurantRequestSchema = z.object({
  managerEmail: z.string().email(),
  managerName: z.string().min(2),
  restaurantName: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

export async function vendorRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireVendor);

  // Dashboard
  fastify.get('/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    const vendorId = request.user.id;

    const [
      totalRestaurants,
      activeRestaurants,
      pendingCommissions,
      totalCommissions,
      totalEarned,
    ] = await Promise.all([
      prisma.restaurant.count({ where: { vendorId } }),
      prisma.restaurant.count({ where: { vendorId, status: 'ACTIVE' } }),
      prisma.commission.count({ where: { vendorId, status: 'PENDING' } }),
      prisma.commission.count({ where: { vendorId } }),
      prisma.commission.aggregate({
        where: { vendorId, status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    // Restaurants récents
    const recentRestaurants = await prisma.restaurant.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    return reply.send({
      stats: {
        totalRestaurants,
        activeRestaurants,
        pendingCommissions,
        totalCommissions,
        totalEarned: totalEarned._sum.amount || 0,
      },
      recentRestaurants,
    });
  });

  // Liste des restaurants
  fastify.get('/restaurants', async (request: FastifyRequest, reply: FastifyReply) => {
    const vendorId = request.user.id;

    const restaurants = await prisma.restaurant.findMany({
      where: { vendorId },
      include: {
        manager: { select: { id: true, email: true, name: true } },
        subscription: { include: { plan: true } },
        _count: { select: { feedbacks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ restaurants });
  });

  // Créer une demande de restaurant (pour un prospect)
  fastify.post('/restaurants', async (request: FastifyRequest, reply: FastifyReply) => {
    const vendorId = request.user.id;
    const body = createRestaurantRequestSchema.safeParse(request.body);
    
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides', details: body.error.errors });
    }

    const { managerEmail, managerName, restaurantName, address, phone, latitude, longitude } = body.data;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email: managerEmail } });
    if (existingUser) {
      return reply.status(409).send({ error: true, message: 'Cet email est déjà utilisé' });
    }

    // Récupérer le plan Starter
    const starterPlan = await prisma.plan.findFirst({ where: { name: 'Starter', isActive: true } });
    if (!starterPlan) {
      return reply.status(500).send({ error: true, message: 'Configuration manquante' });
    }

    // Créer le manager + restaurant en attente
    // Le mot de passe sera défini par le manager via un email de bienvenue
    const tempPassword = Math.random().toString(36).slice(-12);
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const user = await prisma.user.create({
      data: {
        email: managerEmail,
        passwordHash,
        name: managerName,
        role: 'MANAGER',
        managedRestaurants: {
          create: {
            name: restaurantName,
            address,
            phone,
            latitude,
            longitude,
            vendorId,
            status: 'PENDING',
            serviceHours: {
              lunch: { start: '12:00', end: '14:30' },
              dinner: { start: '19:00', end: '22:30' },
            },
            subscription: {
              create: {
                planId: starterPlan.id,
                status: 'TRIAL',
                currentPeriodStart: now,
                currentPeriodEnd: trialEnd,
                trialEndsAt: trialEnd,
              },
            },
          },
        },
      },
      include: {
        managedRestaurants: true,
      },
    });

    // TODO: Envoyer email au manager avec lien pour définir son mot de passe

    return reply.status(201).send({
      message: 'Restaurant créé avec succès',
      restaurant: user.managedRestaurants[0],
      tempPassword, // À retirer en prod, juste pour dev
    });
  });

  // Commissions
  fastify.get('/commissions', async (request: FastifyRequest, reply: FastifyReply) => {
    const vendorId = request.user.id;

    const commissions = await prisma.commission.findMany({
      where: { vendorId },
      orderBy: { triggeredAt: 'desc' },
    });

    // Ajouter les infos restaurant
    const commissionsWithRestaurant = await Promise.all(
      commissions.map(async (c) => {
        const restaurant = await prisma.restaurant.findUnique({
          where: { id: c.restaurantId },
          select: { id: true, name: true },
        });
        return { ...c, restaurant };
      })
    );

    return reply.send({ commissions: commissionsWithRestaurant });
  });

  // Lien de parrainage
  fastify.get('/referral-link', async (request: FastifyRequest, reply: FastifyReply) => {
    const vendor = await prisma.vendor.findUnique({
      where: { id: request.user.id },
      select: { 
        referralCode: true,
        isValidated: true,
      },
      
    });

    if (!vendor) {
      return reply.status(404).send({ error: true, message: 'Vendeur non trouvé' });
    }

    // Récupérer le statut du contrat
    const latestContract = await prisma.vendorContract.findFirst({
      where: { vendorId: request.user.id },
      orderBy: { createdAt: 'desc' },
      select: { status: true },
    });

    const contractStatus = latestContract?.status || 'NONE';

    // Si pas validé, ne pas retourner le lien
    if (!vendor.isValidated || !vendor.referralCode) {
      return reply.send({
        referralCode: null,
        referralLink: null,
        isValidated: false,
        contractStatus,
      });
    }

    const referralLink = `${config.WEB_URL}/register?ref=${vendor.referralCode}`;

    return reply.send({
      referralCode: vendor.referralCode,
      referralLink,
      isValidated: true,
      contractStatus,
    });
  });

  // Profil
  fastify.get('/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    const vendor = await prisma.vendor.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        referralCode: true,
        commissionAmount: true,
        stripeAccountId: true,
        stripeOnboarded: true,
        createdAt: true,
      },
    });

    if (!vendor) {
      return reply.status(404).send({ error: true, message: 'Vendeur non trouvé' });
    }

    return reply.send({ vendor });
  });

  fastify.patch('/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = updateProfileSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const vendor = await prisma.vendor.update({
      where: { id: request.user.id },
      data: body.data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
      },
    });

    return reply.send({ vendor });
  });

  // Stripe Connect onboarding - placeholder
  fastify.post('/stripe/connect', async (request: FastifyRequest, reply: FastifyReply) => {
    // TODO: Implémenter Stripe Connect onboarding
    return reply.status(501).send({ error: true, message: 'Stripe non configuré' });
  });

  // Enregistrer les routes contracts
  await fastify.register(vendorContractRoutes);
}
