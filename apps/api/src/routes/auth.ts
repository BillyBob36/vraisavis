import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config/env.js';
import { stripe } from '../services/stripe.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  restaurantName: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  acceptCGU: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter les CGU/CGV',
  }),
  cguVersion: z.string().optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides', details: body.error.errors });
    }

    const { email, password } = body.data;

    // Chercher dans users (admin/manager)
    let user = await prisma.user.findUnique({ where: { email } });
    let type: 'user' | 'vendor' = 'user';

    // Si pas trouvé, chercher dans vendors
    if (!user) {
      const vendor = await prisma.vendor.findUnique({ where: { email } });
      if (vendor) {
        const valid = await bcrypt.compare(password, vendor.passwordHash);
        if (!valid) {
          return reply.status(401).send({ error: true, message: 'Email ou mot de passe incorrect' });
        }

        if (!vendor.isActive) {
          return reply.status(403).send({ error: true, message: 'Compte désactivé' });
        }

        const token = fastify.jwt.sign({
          id: vendor.id,
          email: vendor.email,
          role: 'VENDOR' as const,
          type: 'vendor' as const,
        });

        return reply.send({
          token,
          user: {
            id: vendor.id,
            email: vendor.email,
            name: vendor.name,
            role: 'VENDOR',
          },
        });
      }

      return reply.status(401).send({ error: true, message: 'Email ou mot de passe incorrect' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: true, message: 'Email ou mot de passe incorrect' });
    }

    // Mettre à jour lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'user' as const,
    });

    return reply.send({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  });

  // Register (créer un manager + restaurant)
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides', details: body.error.errors });
    }

    const { email, password, name, restaurantName, address, phone, referralCode, latitude, longitude, cguVersion } = body.data;
    
    // Récupérer l'IP du client pour l'acceptation CGU
    const clientIP = request.ip;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(409).send({ error: true, message: 'Cet email est déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Trouver le vendeur si referralCode fourni
    let vendorId: string | null = null;
    if (referralCode) {
      const vendor = await prisma.vendor.findUnique({ where: { referralCode } });
      if (vendor && vendor.isActive) {
        vendorId = vendor.id;
      }
    }

    // Récupérer le plan Starter par défaut
    const starterPlan = await prisma.plan.findFirst({ where: { name: 'Starter', isActive: true } });
    if (!starterPlan) {
      return reply.status(500).send({ error: true, message: 'Configuration manquante' });
    }

    // 1. Créer customer Stripe
    let stripeCustomerId: string | null = null;
    let stripeSubscriptionId: string | null = null;
    let clientSecret: string | null = null;
    let stripeTrialEnd: Date | null = null;

    if (config.STRIPE_SECRET_KEY && config.STRIPE_PRICE_ID) {
      try {
        const customer = await stripe.customers.create({
          email,
          name: restaurantName,
          phone: phone || undefined,
          metadata: { restaurantName, referralCode: referralCode || 'none' },
        });
        stripeCustomerId = customer.id;

        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: config.STRIPE_PRICE_ID }],
          trial_period_days: 14,
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['pending_setup_intent'],
          metadata: {
            restaurantName,
            vendorId: vendorId || 'none',
            referralCode: referralCode || 'none',
          },
        });
        stripeSubscriptionId = subscription.id;
        stripeTrialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

        // Pendant le trial, Stripe crée un SetupIntent (pas de PaymentIntent car 0€)
        const setupIntent = subscription.pending_setup_intent as any;
        if (setupIntent?.client_secret) {
          clientSecret = setupIntent.client_secret;
        }
      } catch (stripeErr: any) {
        console.error('Erreur Stripe lors de l\'inscription:', stripeErr.message);
        // On continue sans Stripe — le resto fonctionnera en mode trial local
      }
    }

    // 2. Créer le manager + restaurant + subscription (trial)
    const now = new Date();
    const trialEnd = stripeTrialEnd || new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'MANAGER',
        managedRestaurants: {
          create: {
            name: restaurantName,
            address,
            phone,
            latitude,
            longitude,
            vendorId,
            status: 'ACTIVE',
            geoRadius: 100,
            stripeCustomerId,
            cguAcceptedAt: new Date(),
            cguAcceptedIP: clientIP,
            cguVersion: cguVersion || '1.0',
            serviceHours: {
              lunch: { start: '12:00', end: '14:30' },
              dinner: { start: '19:00', end: '22:30' },
            },
            subscription: {
              create: {
                planId: starterPlan.id,
                status: 'TRIAL',
                stripeSubscriptionId,
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

    // 3. Générer le QR code automatiquement
    const restaurant = user.managedRestaurants[0];
    if (restaurant) {
      const clientUrl = `${config.CLIENT_URL}/${restaurant.id}`;
      const qrCodeUrl = await QRCode.toDataURL(clientUrl, {
        width: 512,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { qrCodeUrl },
      });
    }

    return reply.status(201).send({
      message: 'Compte créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      clientSecret,
      trialEndsAt: trialEnd.toISOString(),
    });
  });

  // Get CGU/CGV content (public route)
  fastify.get('/cgu', async (request: FastifyRequest, reply: FastifyReply) => {
    const template = await prisma.contractTemplate.findFirst({
      where: { type: 'CGU_CGV', isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        version: true,
        contractContent: true,
        companyName: true,
        updatedAt: true,
      },
    });

    if (!template) {
      return reply.status(404).send({ error: true, message: 'CGU/CGV non disponibles' });
    }

    return reply.send({ cgu: template });
  });

  // Me - Get current user
  fastify.get('/me', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id, type } = request.user;

    if (type === 'vendor') {
      const vendor = await prisma.vendor.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          referralCode: true,
          stripeOnboarded: true,
        },
      });

      if (!vendor) {
        return reply.status(404).send({ error: true, message: 'Utilisateur non trouvé' });
      }

      return reply.send({ ...vendor, role: 'VENDOR' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: true, message: 'Utilisateur non trouvé' });
    }

    return reply.send(user);
  });

  // Update password
  fastify.patch('/password', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = updatePasswordSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const { id, type } = request.user;
    const { currentPassword, newPassword } = body.data;

    if (type === 'vendor') {
      const vendor = await prisma.vendor.findUnique({ where: { id } });
      if (!vendor) {
        return reply.status(404).send({ error: true, message: 'Utilisateur non trouvé' });
      }

      const valid = await bcrypt.compare(currentPassword, vendor.passwordHash);
      if (!valid) {
        return reply.status(400).send({ error: true, message: 'Mot de passe actuel incorrect' });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await prisma.vendor.update({
        where: { id },
        data: { passwordHash: newHash },
      });

      return reply.send({ message: 'Mot de passe mis à jour' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ error: true, message: 'Utilisateur non trouvé' });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return reply.status(400).send({ error: true, message: 'Mot de passe actuel incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash: newHash },
    });

    return reply.send({ message: 'Mot de passe mis à jour' });
  });

  // Forgot password - placeholder pour plus tard
  fastify.post('/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    // TODO: Implémenter avec envoi d'email
    return reply.send({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé' });
  });

  // Reset password - placeholder pour plus tard
  fastify.post('/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    // TODO: Implémenter avec token de réinitialisation
    return reply.status(501).send({ error: true, message: 'Fonctionnalité à venir' });
  });
}
