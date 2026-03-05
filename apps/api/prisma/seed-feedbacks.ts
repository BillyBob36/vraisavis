/**
 * Seed script: charge ~100 avis/jour sur les 60 derniers jours
 * depuis vraisavis_500_paires-avis.md dans le restaurant du premier manager ACTIVE.
 *
 * Usage: npx ts-node prisma/seed-feedbacks.ts
 * Ou via le container API: docker exec <container> npx ts-node prisma/seed-feedbacks.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Parse le fichier MD et retourne un tableau de { positiveText, negativeText }
function parseFeedbacksMd(filePath: string): Array<{ positiveText: string; negativeText: string }> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const pairs: Array<{ positiveText: string; negativeText: string }> = [];

  // Regex: capture positif et négatif de chaque paire "Client NNN"
  const blockRegex = /\*\*Client \d+\*\*\s*\n- ✅ \*\*Point fort :\*\* (.+)\n- ❌ \*\*Point faible :\*\* (.+)/g;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(content)) !== null) {
    pairs.push({
      positiveText: match[1].trim(),
      negativeText: match[2].trim(),
    });
  }
  return pairs;
}

const SERVICE_TYPES = ['midi', 'soir', 'midi', 'soir', 'midi', 'soir'];

function randomServiceType(): string {
  return SERVICE_TYPES[Math.floor(Math.random() * SERVICE_TYPES.length)];
}

function randomRating(positive: boolean): number {
  if (positive) return Math.floor(Math.random() * 3) + 3; // 3-5
  return Math.floor(Math.random() * 3) + 1; // 1-3
}

async function main() {
  console.log('🌱 Seed feedbacks — 60 jours x ~100 avis/jour');

  // Trouver le premier restaurant ACTIVE
  const restaurant = await prisma.restaurant.findFirst({
    where: { status: 'ACTIVE' },
    include: { manager: true },
  });

  if (!restaurant) {
    console.error('❌ Aucun restaurant ACTIVE trouvé en DB. Créez-en un d\'abord.');
    process.exit(1);
  }

  console.log(`📍 Restaurant cible: "${restaurant.name}" (${restaurant.id})`);
  console.log(`👤 Manager: ${restaurant.manager.email}`);

  // Compter les feedbacks existants (évite doublons si re-run)
  const existingCount = await prisma.feedback.count({ where: { restaurantId: restaurant.id } });
  if (existingCount > 500) {
    console.log(`⚠️  ${existingCount} feedbacks déjà présents. Supprimez-les d'abord si besoin.`);
    console.log('   Pour nettoyer: DELETE FROM feedbacks WHERE restaurant_id = \'<id>\';');
    process.exit(0);
  }

  // Charger les paires d'avis depuis le fichier MD
  const mdPath = path.resolve(__dirname, '../../../vraisavis_500_paires-avis.md');
  if (!fs.existsSync(mdPath)) {
    console.error(`❌ Fichier non trouvé: ${mdPath}`);
    process.exit(1);
  }

  const pairs = parseFeedbacksMd(mdPath);
  console.log(`📄 ${pairs.length} paires d'avis chargées depuis le fichier MD`);

  if (pairs.length === 0) {
    console.error('❌ Aucune paire parsée — vérifiez le format du fichier MD');
    process.exit(1);
  }

  const DAYS = 60;
  const PER_DAY = 100;
  const TOTAL = DAYS * PER_DAY;

  const now = new Date();
  let inserted = 0;

  for (let day = DAYS - 1; day >= 0; day--) {
    const dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() - day);
    dayDate.setHours(0, 0, 0, 0);

    const batchData = [];

    for (let i = 0; i < PER_DAY; i++) {
      // Cycle sur les paires (500 paires → 50k feedbacks possibles)
      const pairIdx = (inserted + i) % pairs.length;
      const pair = pairs[pairIdx];

      // Heure aléatoire dans la journée
      const feedbackDate = new Date(dayDate);
      const hour = 11 + Math.floor(Math.random() * 11); // 11h-22h
      const min = Math.floor(Math.random() * 60);
      feedbackDate.setHours(hour, min, Math.floor(Math.random() * 60));

      // Fingerprint unique par feedback (simule des clients différents)
      const fpHash = crypto.randomBytes(16).toString('hex');
      const fpExpiresAt = new Date(feedbackDate);
      fpExpiresAt.setDate(fpExpiresAt.getDate() + 30);

      batchData.push({ pair, feedbackDate, fpHash, fpExpiresAt });
    }

    // Insérer en batch (fingerprints puis feedbacks)
    for (const { pair, feedbackDate, fpHash, fpExpiresAt } of batchData) {
      const fp = await prisma.fingerprint.create({
        data: {
          hash: fpHash,
          restaurantId: restaurant.id,
          lastPlayedAt: feedbackDate,
          lastServiceType: randomServiceType(),
          createdAt: feedbackDate,
          expiresAt: fpExpiresAt,
        },
      });

      await prisma.feedback.create({
        data: {
          positiveText: pair.positiveText,
          negativeText: pair.negativeText,
          positiveRating: randomRating(true),
          negativeRating: randomRating(false),
          serviceType: randomServiceType(),
          restaurantId: restaurant.id,
          fingerprintId: fp.id,
          createdAt: feedbackDate,
          isRead: Math.random() > 0.3,
          isProcessed: false,
        },
      });

      inserted++;
    }

    const progress = Math.round((inserted / TOTAL) * 100);
    const dateStr = dayDate.toISOString().split('T')[0];
    console.log(`  📅 ${dateStr}: +${PER_DAY} avis (total: ${inserted}/${TOTAL} — ${progress}%)`);
  }

  console.log(`\n✅ ${inserted} feedbacks insérés sur ${DAYS} jours pour "${restaurant.name}"`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
