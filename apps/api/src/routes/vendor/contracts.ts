import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireVendor } from '../../middleware/auth.js';

const signContractSchema = z.object({
  contractId: z.string(),
  vendorAddress: z.string().optional(),
  vendorSIRET: z.string().optional(),
  vendorIBAN: z.string().optional(),
  signatureData: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter les termes du contrat',
  }),
});

export async function vendorContractRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireVendor);

  // Liste des contrats du vendeur
  fastify.get('/contracts', async (request: FastifyRequest, reply: FastifyReply) => {
    const vendorId = request.user.id;

    const contracts = await prisma.vendorContract.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: {
            id: true,
            type: true,
            version: true,
            companyName: true,
          },
        },
      },
    });

    return reply.send({ contracts });
  });

  // Détails d'un contrat
  fastify.get('/contracts/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const vendorId = request.user.id;

    const contract = await prisma.vendorContract.findFirst({
      where: { id, vendorId },
      include: {
        template: true,
      },
    });

    if (!contract) {
      return reply.status(404).send({ error: true, message: 'Contrat non trouvé' });
    }

    // Marquer comme vu si pas encore vu
    if (!contract.viewedAt) {
      await prisma.vendorContract.update({
        where: { id },
        data: { viewedAt: new Date() },
      });
    }

    return reply.send({ contract });
  });

  // Signer un contrat
  fastify.post('/contracts/sign', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = signContractSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: true, message: 'Données invalides', details: body.error.errors });
    }

    const { contractId, vendorAddress, vendorSIRET, vendorIBAN, signatureData } = body.data;
    const vendorId = request.user.id;

    // Vérifier que le contrat existe et appartient au vendeur
    const contract = await prisma.vendorContract.findFirst({
      where: { id: contractId, vendorId },
    });

    if (!contract) {
      return reply.status(404).send({ error: true, message: 'Contrat non trouvé' });
    }

    // Vérifier que le contrat n'est pas déjà signé
    if (contract.status === 'SIGNED') {
      return reply.status(400).send({ error: true, message: 'Ce contrat est déjà signé' });
    }

    // Récupérer l'IP du client
    const signatureIP = request.ip;

    // Signer le contrat
    const signedContract = await prisma.vendorContract.update({
      where: { id: contractId },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
        signatureIP,
        signatureData,
        vendorAddress: vendorAddress || contract.vendorAddress,
        vendorSIRET: vendorSIRET || contract.vendorSIRET,
        vendorIBAN: vendorIBAN || contract.vendorIBAN,
      },
      include: {
        template: true,
      },
    });

    return reply.send({ contract: signedContract, message: 'Contrat signé avec succès' });
  });

  // Rejeter un contrat
  fastify.post('/contracts/:id/reject', async (request: FastifyRequest<{ Params: { id: string }; Body: { reason?: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { reason } = request.body;
    const vendorId = request.user.id;

    const contract = await prisma.vendorContract.findFirst({
      where: { id, vendorId },
    });

    if (!contract) {
      return reply.status(404).send({ error: true, message: 'Contrat non trouvé' });
    }

    if (contract.status === 'SIGNED') {
      return reply.status(400).send({ error: true, message: 'Impossible de rejeter un contrat déjà signé' });
    }

    await prisma.vendorContract.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    return reply.send({ message: 'Contrat rejeté' });
  });
}
