import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireSuperAdmin } from '../../middleware/auth.js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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

  // Générer et télécharger le PDF d'un contrat signé
  fastify.get('/contracts/:id/pdf', async (request: FastifyRequest<{ Params: { id: string }; Querystring: { token?: string } }>, reply: FastifyReply) => {
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

    // Fonction pour ajouter du texte avec retour à la ligne
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
            return { y, needNewPage: true, remainingText: words.slice(words.indexOf(word)).join(' ') };
          }
        } else {
          line = testLine;
        }
      }
      
      if (line) {
        page.drawText(line, { x: margin, y, size: fontSize, font: currentFont, color: rgb(0, 0, 0) });
        y -= lineHeight;
      }
      
      return { y, needNewPage: false, remainingText: '' };
    };

    // Préparer le contenu du contrat avec les données du vendeur
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

    // Créer les pages
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Titre
    page.drawText('CONTRAT D\'APPORTEUR D\'AFFAIRES', {
      x: margin,
      y,
      size: 16,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= 30;

    // Contenu du contrat (simplifié pour le PDF)
    const lines = contractContent.split('\n');
    for (const line of lines) {
      if (y < margin + 50) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#')) {
        // Titre de section
        y -= 10;
        const result = addTextToPage(page, trimmedLine.replace(/^#+\s*/, ''), y, true);
        y = result.y - 5;
      } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        // Texte en gras
        const result = addTextToPage(page, trimmedLine.replace(/\*\*/g, ''), y, true);
        y = result.y;
      } else if (trimmedLine) {
        // Texte normal
        const result = addTextToPage(page, trimmedLine.replace(/\*\*/g, ''), y, false);
        y = result.y;
      } else {
        y -= lineHeight / 2;
      }
    }

    // Ajouter la signature si le contrat est signé
    if (contract.status === 'SIGNED' && contract.signedAt) {
      if (y < margin + 150) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      y -= 30;
      page.drawText('SIGNATURE ÉLECTRONIQUE', { x: margin, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
      y -= 20;
      page.drawText(`Signé électroniquement le ${new Date(contract.signedAt).toLocaleString('fr-FR')}`, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
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
      
      // Afficher la signature si disponible
      if (contract.signatureData) {
        page.drawText('Mention manuscrite : "Lu et approuvé, bon pour accord"', { x: margin, y, size: fontSize, font: fontBold, color: rgb(0, 0, 0) });
        y -= lineHeight;
        page.drawText(contract.signatureData.split('\n')[1] || contract.vendorName, { x: margin, y, size: 14, font: fontBold, color: rgb(0, 0.2, 0.5) });
      }

      // Pied de page légal
      y -= 40;
      page.drawText('Ce document a été signé électroniquement conformément au règlement eIDAS.', { x: margin, y, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
      y -= 10;
      page.drawText(`ID du contrat : ${contract.id}`, { x: margin, y, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
    }

    const pdfBytes = await pdfDoc.save();

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="contrat-${contract.vendorName.replace(/\s+/g, '-')}-${contractDate}.pdf"`);
    
    return reply.send(Buffer.from(pdfBytes));
  });
}
