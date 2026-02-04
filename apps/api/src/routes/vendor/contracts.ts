import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireVendor } from '../../middleware/auth.js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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

  // Télécharger le PDF du contrat signé
  fastify.get('/contracts/:id/pdf', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const vendorId = request.user.id;

    const contract = await prisma.vendorContract.findFirst({
      where: { id, vendorId },
      include: {
        vendor: true,
        template: true,
      },
    });

    if (!contract) {
      return reply.status(404).send({ error: true, message: 'Contrat non trouvé' });
    }

    if (contract.status !== 'SIGNED') {
      return reply.status(400).send({ error: true, message: 'Le contrat doit être signé pour télécharger le PDF' });
    }

    // Générer le PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const fontSize = 10;
    const lineHeight = 14;
    const margin = 50;
    const pageWidth = 595;
    const pageHeight = 842;
    const contentWidth = pageWidth - 2 * margin;

    const addTextToPage = (page: any, text: string, startY: number, isBold = false) => {
      const currentFont = isBold ? fontBold : font;
      const words = text.split(' ');
      let line = '';
      let y = startY;
      
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const width = currentFont.widthOfTextAtSize(testLine, fontSize);
        
        if (width > contentWidth && line) {
          page.drawText(line, { x: margin, y, size: fontSize, font: currentFont, color: rgb(0, 0, 0) });
          line = word;
          y -= lineHeight;
          
          if (y < margin) {
            return { y, needNewPage: true };
          }
        } else {
          line = testLine;
        }
      }
      
      if (line) {
        page.drawText(line, { x: margin, y, size: fontSize, font: currentFont, color: rgb(0, 0, 0) });
        y -= lineHeight;
      }
      
      return { y, needNewPage: false };
    };

    const contractDate = contract.signedAt ? new Date(contract.signedAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    
    let contractContent = contract.template.contractContent
      .replace(/\[NOM PRÉNOM ou RAISON SOCIALE de l'apporteur\]/g, contract.vendorName)
      .replace(/\[Si personne physique : adresse complète\]/g, contract.vendorAddress || 'Non renseigné')
      .replace(/\[Si personne morale : forme juridique, siège social, RCS, SIRET\]/g, contract.vendorSIRET || '')
      .replace(/\[EMAIL APPORTEUR\]/g, contract.vendorEmail)
      .replace(/\[ADRESSE APPORTEUR\]/g, contract.vendorAddress || 'Non renseigné')
      .replace(/\[VILLE\]/g, 'Paris')
      .replace(/\[DATE\]/g, contractDate)
      .replace(/\[CODE_UNIQUE_APPORTEUR\]/g, contract.vendor.referralCode)
      .replace(/\[CODE_UNIQUE\]/g, contract.vendor.referralCode);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    page.drawText('CONTRAT D\'APPORTEUR D\'AFFAIRES', {
      x: margin, y, size: 16, font: fontBold, color: rgb(0, 0, 0),
    });
    y -= 30;

    const lines = contractContent.split('\n');
    for (const line of lines) {
      if (y < margin + 50) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#')) {
        y -= 10;
        const result = addTextToPage(page, trimmedLine.replace(/^#+\s*/, ''), y, true);
        y = result.y - 5;
      } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        const result = addTextToPage(page, trimmedLine.replace(/\*\*/g, ''), y, true);
        y = result.y;
      } else if (trimmedLine) {
        const result = addTextToPage(page, trimmedLine.replace(/\*\*/g, ''), y, false);
        y = result.y;
      } else {
        y -= lineHeight / 2;
      }
    }

    // Signature
    if (y < margin + 150) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    y -= 30;
    page.drawText('SIGNATURE ÉLECTRONIQUE', { x: margin, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    y -= 20;
    page.drawText(`Signé électroniquement le ${new Date(contract.signedAt!).toLocaleString('fr-FR')}`, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
    y -= lineHeight;
    page.drawText(`Par : ${contract.vendorName}`, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
    y -= lineHeight;
    page.drawText(`Email : ${contract.vendorEmail}`, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
    y -= lineHeight;
    if (contract.signatureIP) {
      page.drawText(`Adresse IP : ${contract.signatureIP}`, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
      y -= lineHeight;
    }
    y -= 20;
    
    if (contract.signatureData) {
      page.drawText('Mention manuscrite : "Lu et approuvé, bon pour accord"', { x: margin, y, size: fontSize, font: fontBold, color: rgb(0, 0, 0) });
      y -= lineHeight;
      page.drawText(contract.signatureData.split('\n')[1] || contract.vendorName, { x: margin, y, size: 14, font: fontBold, color: rgb(0, 0.2, 0.5) });
    }

    y -= 40;
    page.drawText('Ce document a été signé électroniquement conformément au règlement eIDAS.', { x: margin, y, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
    y -= 10;
    page.drawText(`ID du contrat : ${contract.id}`, { x: margin, y, size: 8, font, color: rgb(0.5, 0.5, 0.5) });

    const pdfBytes = await pdfDoc.save();

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="contrat-${contract.vendorName.replace(/\s+/g, '-')}-${contractDate}.pdf"`);
    
    return reply.send(Buffer.from(pdfBytes));
  });
}
