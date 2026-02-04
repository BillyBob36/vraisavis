import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Contenu des CGU/CGV importé depuis newsCGU.md
import * as fs from 'fs';
import * as path from 'path';

// Lire le contenu du fichier cgu-cgv-content.md
const cguFilePath = path.join(__dirname, './cgu-cgv-content.md');
const cguContent = fs.existsSync(cguFilePath) 
  ? fs.readFileSync(cguFilePath, 'utf-8')
  : `# CONDITIONS GÉNÉRALES D'UTILISATION ET DE VENTE (CGU/CGV)

**Plateforme VraisAvis - Service SaaS pour Restaurateurs**

**Version 2.0 - En vigueur au 1er février 2026**

Contenu complet disponible sur demande.`;

async function main() {
  console.log('Création du template CGU/CGV pour restaurants...');

  const existingTemplate = await prisma.contractTemplate.findFirst({
    where: { type: 'CGU_CGV', isActive: true },
  });

  if (existingTemplate) {
    console.log('Un template CGU/CGV actif existe déjà, mise à jour...');
    await prisma.contractTemplate.update({
      where: { id: existingTemplate.id },
      data: {
        version: '2.0',
        companyName: 'KAISER JOHANN (KAISER CO)',
        companyLegalForm: 'Entrepreneur individuel (Micro-entreprise)',
        companyCapital: 'Non applicable (EI)',
        companyAddress: '61 RUE DE LYON, 75012 PARIS',
        companyRCS: 'Non inscrit au RCS (Entrepreneur individuel)',
        companySIRET: '791 069 610 00032',
        companyVAT: 'FR52791069610',
        companyPhone: '+33 7 83 82 61 30',
        companyEmail: 'contact@vraisavis.fr',
        companyDirector: 'KAISER JOHANN',
        hostingProvider: 'Hetzner Online GmbH',
        hostingAddress: 'Industriestr. 25, 91710 Gunzenhausen, Allemagne',
        mediatorName: 'CM2C - Centre de Médiation de la Consommation de Conciliateurs de Justice',
        mediatorAddress: '14 rue Saint-Jean, 75017 PARIS',
        mediatorWebsite: 'https://www.cm2c.net',
        jurisdiction: 'Tribunaux compétents de Paris',
        monthlyPrice: 4900,
        contractContent: cguContent,
      },
    });
    console.log('Template CGU/CGV mis à jour vers version 2.0 !');
  } else {
    await prisma.contractTemplate.create({
      data: {
        type: 'CGU_CGV',
        version: '2.0',
        companyName: 'KAISER JOHANN (KAISER CO)',
        companyLegalForm: 'Entrepreneur individuel (Micro-entreprise)',
        companyCapital: 'Non applicable (EI)',
        companyAddress: '61 RUE DE LYON, 75012 PARIS',
        companyRCS: 'Non inscrit au RCS (Entrepreneur individuel)',
        companySIRET: '791 069 610 00032',
        companyVAT: 'FR52791069610',
        companyPhone: '+33 7 83 82 61 30',
        companyEmail: 'contact@vraisavis.fr',
        companyDirector: 'KAISER JOHANN',
        hostingProvider: 'Hetzner Online GmbH',
        hostingAddress: 'Industriestr. 25, 91710 Gunzenhausen, Allemagne',
        mediatorName: 'CM2C - Centre de Médiation de la Consommation de Conciliateurs de Justice',
        mediatorAddress: '14 rue Saint-Jean, 75017 PARIS',
        mediatorWebsite: 'https://www.cm2c.net',
        jurisdiction: 'Tribunaux compétents de Paris',
        monthlyPrice: 4900,
        contractContent: cguContent,
        isActive: true,
      },
    });
    console.log('Template CGU/CGV version 2.0 créé !');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
