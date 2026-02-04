import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireSuperAdmin } from '../../middleware/auth.js';

const createTemplateSchema = z.object({
  type: z.enum(['CGU_CGV', 'VENDOR_CONTRACT']),
  version: z.string().default('1.0'),
  companyName: z.string(),
  companyLegalForm: z.string(),
  companyCapital: z.string(),
  companyAddress: z.string(),
  companyRCS: z.string(),
  companySIRET: z.string(),
  companyVAT: z.string(),
  companyPhone: z.string(),
  companyEmail: z.string().email(),
  companyDirector: z.string(),
  hostingProvider: z.string(),
  hostingAddress: z.string(),
  dpoEmail: z.string().email().optional(),
  mediatorName: z.string(),
  mediatorAddress: z.string(),
  mediatorWebsite: z.string().url(),
  jurisdiction: z.string(),
  monthlyPrice: z.number().int().optional(),
  commissionRate: z.number().optional(),
  commissionDuration: z.number().int().optional(),
  contractContent: z.string(),
});

const updateTemplateSchema = createTemplateSchema.partial();

const sendContractSchema = z.object({
  vendorId: z.string(),
  templateId: z.string(),
});

export async function contractRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireSuperAdmin);

  // Liste des templates
  fastify.get('/templates', async (request: FastifyRequest, reply: FastifyReply) => {
    const templates = await prisma.contractTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { vendorContracts: true },
        },
      },
    });

    return reply.send({ templates });
  });

  // Créer un template
  fastify.post('/templates', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createTemplateSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides', details: body.error.errors });
    }

    const template = await prisma.contractTemplate.create({
      data: body.data,
    });

    return reply.status(201).send({ template });
  });

  // Modifier un template
  fastify.patch('/templates/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = updateTemplateSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const template = await prisma.contractTemplate.update({
      where: { id },
      data: body.data,
    });

    return reply.send({ template });
  });

  // Supprimer un template (soft delete)
  fastify.delete('/templates/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    await prisma.contractTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return reply.send({ message: 'Template désactivé' });
  });

  // Envoyer un contrat à un vendeur
  fastify.post('/contracts/send', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = sendContractSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides' });
    }

    const { vendorId, templateId } = body.data;

    // Vérifier que le vendeur existe
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return reply.status(404).send({ error: true, message: 'Vendeur non trouvé' });
    }

    // Vérifier que le template existe
    const template = await prisma.contractTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      return reply.status(404).send({ error: true, message: 'Template non trouvé' });
    }

    // Créer le contrat
    const contract = await prisma.vendorContract.create({
      data: {
        vendorId,
        templateId,
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        vendorAddress: null,
        status: 'SENT',
        sentAt: new Date(),
      },
      include: {
        vendor: true,
        template: true,
      },
    });

    // TODO: Envoyer email au vendeur avec lien vers le contrat

    return reply.status(201).send({ contract });
  });

  // Liste des contrats envoyés
  fastify.get('/contracts', async (request: FastifyRequest, reply: FastifyReply) => {
    const contracts = await prisma.vendorContract.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        template: {
          select: {
            id: true,
            type: true,
            version: true,
          },
        },
      },
    });

    return reply.send({ contracts });
  });

  // Détails d'un contrat
  fastify.get('/contracts/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    const contract = await prisma.vendorContract.findUnique({
      where: { id },
      include: {
        vendor: true,
        template: true,
      },
    });

    if (!contract) {
      return reply.status(404).send({ error: true, message: 'Contrat non trouvé' });
    }

    return reply.send({ contract });
  });
}
