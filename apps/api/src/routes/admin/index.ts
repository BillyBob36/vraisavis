import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma.js';
import { requireSuperAdmin } from '../../middleware/auth.js';
import { generateReferralCode } from '../../utils/helpers.js';
import { contractRoutes } from './contracts.js';

const createVendorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  commissionAmount: z.number().int().min(0).default(5000),
});

const updateVendorSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  phone: z.string().optional(),
  commissionAmount: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const updateRestaurantSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']).optional(),
  name: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  phone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  geoRadius: z.number().int().min(10).max(1000).optional(),
});

const createPlanSchema = z.object({
  name: z.string().min(2),
  priceMonthly: z.number().int().min(0),
  priceYearly: z.number().int().min(0),
  maxRestaurants: z.number().int().min(1),
  maxFeedbacksPerMonth: z.number().int().nullable().optional(),
  features: z.record(z.boolean()),
});

export async function adminRoutes(fastify: FastifyInstance) {
  // Middleware pour toutes les routes admin
  fastify.addHook('preHandler', requireSuperAdmin);

  // Dashboard
  fastify.get('/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    const [
      totalRestaurants,
      activeRestaurants,
      totalVendors,
      totalFeedbacks,
      pendingCommissions,
      subscriptionStats,
    ] = await Promise.all([
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { status: 'ACTIVE' } }),
      prisma.vendor.count(),
      prisma.feedback.count(),
      prisma.commission.count({ where: { status: 'PENDING' } }),
      prisma.subscription.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    // Calculer MRR approximatif
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    });
    
    const mrr = activeSubscriptions.reduce((sum, sub) => sum + sub.plan.priceMonthly, 0);

    return reply.send({
      stats: {
        totalRestaurants,
        activeRestaurants,
        totalVendors,
        totalFeedbacks,
        pendingCommissions,
        mrr,
        subscriptionStats,
      },
    });
  });

  // === VENDORS ===
  fastify.get('/vendors', async (request: FastifyRequest, reply: FastifyReply) => {
    const vendors = await prisma.vendor.findMany({
      include: {
        _count: {
          select: { restaurants: true, commissions: true },
        },
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            sentAt: true,
            signedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ vendors });
  });

  fastify.post('/vendors', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createVendorSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides', details: body.error.errors });
    }

    const { email, password, name, phone, commissionAmount } = body.data;

    const existing = await prisma.vendor.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: true, message: 'Cet email est déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Ne pas générer le referralCode à la création - il sera généré lors de la validation
    const vendor = await prisma.vendor.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        referralCode: null,
        commissionAmount,
        isValidated: false,
      },
    });

    // Envoi automatique du contrat vendeur si un template actif existe
    const activeTemplate = await prisma.contractTemplate.findFirst({
      where: { type: 'VENDOR_CONTRACT', isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    let contract = null;
    if (activeTemplate) {
      contract = await prisma.vendorContract.create({
        data: {
          vendorId: vendor.id,
          templateId: activeTemplate.id,
          vendorName: vendor.name,
          vendorEmail: vendor.email,
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    }

    return reply.status(201).send({
      vendor: {
        id: vendor.id,
        email: vendor.email,
        name: vendor.name,
        referralCode: vendor.referralCode,
      },
      contractSent: !!contract,
    });
  });

  fastify.patch('/vendors/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = updateVendorSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const updateData: any = { ...body.data };
    
    // Si un mot de passe est fourni, le hasher
    if (body.data.password) {
      updateData.passwordHash = await bcrypt.hash(body.data.password, 10);
      delete updateData.password;
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
    });

    return reply.send({ vendor });
  });

  fastify.delete('/vendors/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    // Soft delete - juste désactiver
    await prisma.vendor.update({
      where: { id },
      data: { isActive: false },
    });

    return reply.send({ message: 'Vendeur désactivé' });
  });

  // Valider un vendeur (après signature du contrat) - génère le referralCode
  fastify.post('/vendors/:id/validate', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        contracts: {
          where: { status: 'SIGNED' },
          orderBy: { signedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!vendor) {
      return reply.status(404).send({ error: true, message: 'Vendeur non trouvé' });
    }

    if (vendor.isValidated) {
      return reply.status(400).send({ error: true, message: 'Ce vendeur est déjà validé' });
    }

    // Vérifier que le contrat est signé
    if (vendor.contracts.length === 0) {
      return reply.status(400).send({ 
        error: true, 
        message: 'Le vendeur doit d\'abord signer son contrat avant d\'être validé' 
      });
    }

    // Générer le referralCode et valider
    const referralCode = generateReferralCode(vendor.name);

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: {
        referralCode,
        isValidated: true,
        validatedAt: new Date(),
      },
    });

    return reply.send({ 
      message: 'Vendeur validé avec succès',
      vendor: {
        id: updatedVendor.id,
        name: updatedVendor.name,
        referralCode: updatedVendor.referralCode,
        isValidated: updatedVendor.isValidated,
        validatedAt: updatedVendor.validatedAt,
      },
    });
  });

  // === RESTAURANTS ===
  fastify.get('/restaurants', async (request: FastifyRequest, reply: FastifyReply) => {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        manager: { select: { id: true, email: true, name: true } },
        vendor: { select: { id: true, name: true, referralCode: true } },
        subscription: { include: { plan: true } },
        _count: { select: { feedbacks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ restaurants });
  });

  fastify.patch('/restaurants/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = updateRestaurantSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: body.data,
    });

    return reply.send({ restaurant });
  });

  fastify.delete('/restaurants/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    // Vérifier les dépendances
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: { _count: { select: { feedbacks: true } } },
    });

    if (!restaurant) {
      return reply.status(404).send({ error: true, message: 'Restaurant non trouvé' });
    }

    // Suspendre plutôt que supprimer si des feedbacks existent
    if (restaurant._count.feedbacks > 0) {
      await prisma.restaurant.update({
        where: { id },
        data: { status: 'SUSPENDED' },
      });
      return reply.send({ message: 'Restaurant suspendu (données existantes)' });
    }

    await prisma.restaurant.delete({ where: { id } });
    return reply.send({ message: 'Restaurant supprimé' });
  });

  // === USERS ===
  fastify.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { managedRestaurants: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ users });
  });

  // === PLANS ===
  fastify.get('/plans', async (request: FastifyRequest, reply: FastifyReply) => {
    const plans = await prisma.plan.findMany({
      include: {
        _count: { select: { subscriptions: true } },
      },
      orderBy: { priceMonthly: 'asc' },
    });

    return reply.send({ plans });
  });

  fastify.post('/plans', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createPlanSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const plan = await prisma.plan.create({ data: body.data });
    return reply.status(201).send({ plan });
  });

  fastify.patch('/plans/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = createPlanSchema.partial().safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: body.data,
    });

    return reply.send({ plan });
  });

  // === COMMISSIONS ===
  fastify.get('/commissions', async (request: FastifyRequest, reply: FastifyReply) => {
    const commissions = await prisma.commission.findMany({
      include: {
        vendor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { triggeredAt: 'desc' },
    });

    return reply.send({ commissions });
  });

  fastify.patch('/commissions/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    // Marquer comme payé manuellement
    const commission = await prisma.commission.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    return reply.send({ commission });
  });

  // === SUBSCRIPTIONS ===
  fastify.get('/subscriptions', async (request: FastifyRequest, reply: FastifyReply) => {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        restaurant: { select: { id: true, name: true } },
        plan: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ subscriptions });
  });

  // Enregistrer les routes contracts
  await fastify.register(contractRoutes, { prefix: '/contracts' });
}
