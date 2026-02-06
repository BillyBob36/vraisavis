import { prisma } from '../../lib/prisma.js';

/**
 * Tool: consulter_avis
 * Retrieves feedbacks for a restaurant for a given period.
 * First checks pre-computed summaries, falls back to raw feedbacks.
 */
export async function consulterAvis(
  restaurantId: string,
  period: 'today' | 'yesterday' | 'week' | 'month' | 'all',
): Promise<string> {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      start = new Date(y.getFullYear(), y.getMonth(), y.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    }
    case 'week':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case 'all':
    default:
      start = new Date(2020, 0, 1);
      break;
  }

  // Try to find a pre-computed summary first (for yesterday, completed weeks/months)
  if (period === 'yesterday') {
    const summary = await prisma.feedbackSummary.findFirst({
      where: {
        restaurantId,
        periodType: 'DAILY',
        periodStart: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
      },
    });
    if (summary) {
      return formatSummary(summary);
    }
  }

  // Fall back to raw feedbacks
  const feedbacks = await prisma.feedback.findMany({
    where: {
      restaurantId,
      createdAt: { gte: start, lt: end },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  if (feedbacks.length === 0) {
    return `Aucun avis trouvé pour la période "${period}".`;
  }

  const lines = feedbacks.map((f: { createdAt: Date; positiveText: string; negativeText: string | null }, i: number) => {
    const date = f.createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const neg = f.negativeText ? `\n   ⚠️ À améliorer : ${f.negativeText}` : '';
    return `${i + 1}. [${date}] ✅ ${f.positiveText}${neg}`;
  });

  return `📊 ${feedbacks.length} avis (${period}) :\n\n${lines.join('\n\n')}`;
}

/**
 * Tool: gerer_lots
 * Manages prizes: list, add, edit, remove, stats.
 */
export async function gererLots(
  restaurantId: string,
  action: 'list' | 'add' | 'edit' | 'remove' | 'deactivate' | 'stats',
  params?: {
    prizeId?: string;
    name?: string;
    description?: string;
    probability?: number;
    maxPerDay?: number;
    maxPerWeek?: number;
    isActive?: boolean;
  },
): Promise<string> {
  switch (action) {
    case 'list': {
      const prizes = await prisma.prize.findMany({
        where: { restaurantId },
        include: { _count: { select: { claims: true } } },
        orderBy: { createdAt: 'desc' },
      });

      if (prizes.length === 0) return '🎁 Aucun lot configuré.';

      const lines = prizes.map((p: { name: string; isActive: boolean; probability: number; maxPerDay: number | null; maxPerWeek: number | null; _count: { claims: number } }) => {
        const status = p.isActive ? '✅' : '❌';
        const limits: string[] = [];
        if (p.maxPerDay) limits.push(`${p.maxPerDay}/jour`);
        if (p.maxPerWeek) limits.push(`${p.maxPerWeek}/sem`);
        const limitsStr = limits.length > 0 ? ` (${limits.join(', ')})` : '';
        return `${status} **${p.name}** — prob: ${(p.probability * 100).toFixed(0)}%, gagné ${p._count.claims}x${limitsStr}`;
      });

      return `🎁 ${prizes.length} lots :\n\n${lines.join('\n')}`;
    }

    case 'add': {
      if (!params?.name || params.probability === undefined) {
        return '❌ Pour ajouter un lot, précisez au moins le nom et la probabilité.';
      }

      const prize = await prisma.prize.create({
        data: {
          restaurantId,
          name: params.name,
          description: params.description || null,
          probability: params.probability,
          maxPerDay: params.maxPerDay || null,
          maxPerWeek: params.maxPerWeek || null,
        },
      });

      return `✅ Lot "${prize.name}" ajouté avec ${(prize.probability * 100).toFixed(0)}% de probabilité.`;
    }

    case 'edit': {
      if (!params?.prizeId) {
        return '❌ Précisez l\'ID du lot à modifier.';
      }

      const data: Record<string, unknown> = {};
      if (params.name) data.name = params.name;
      if (params.description !== undefined) data.description = params.description;
      if (params.probability !== undefined) data.probability = params.probability;
      if (params.maxPerDay !== undefined) data.maxPerDay = params.maxPerDay;
      if (params.maxPerWeek !== undefined) data.maxPerWeek = params.maxPerWeek;
      if (params.isActive !== undefined) data.isActive = params.isActive;

      const prize = await prisma.prize.update({
        where: { id: params.prizeId },
        data,
      });

      return `✅ Lot "${prize.name}" mis à jour.`;
    }

    case 'remove': {
      let prizeToDelete;
      if (params?.prizeId) {
        prizeToDelete = await prisma.prize.findFirst({
          where: { id: params.prizeId, restaurantId },
        });
      } else if (params?.name) {
        prizeToDelete = await prisma.prize.findFirst({
          where: { restaurantId, name: { contains: params.name, mode: 'insensitive' } },
        });
      }
      if (!prizeToDelete) return '❌ Lot non trouvé. Précisez le nom ou l\'ID du lot à supprimer.';

      await prisma.$transaction([
        prisma.prizeClaim.deleteMany({ where: { prizeId: prizeToDelete.id } }),
        prisma.dailyPrizePool.deleteMany({ where: { prizeId: prizeToDelete.id } }),
        prisma.prize.delete({ where: { id: prizeToDelete.id } }),
      ]);
      return `🗑️ Lot "${prizeToDelete.name}" supprimé définitivement.`;
    }

    case 'deactivate': {
      let prizeToToggle;
      if (params?.prizeId) {
        prizeToToggle = await prisma.prize.findFirst({
          where: { id: params.prizeId, restaurantId },
        });
      } else if (params?.name) {
        prizeToToggle = await prisma.prize.findFirst({
          where: { restaurantId, name: { contains: params.name, mode: 'insensitive' } },
        });
      }
      if (!prizeToToggle) return '❌ Lot non trouvé.';

      const newActive = params?.isActive !== undefined ? params.isActive : !prizeToToggle.isActive;
      await prisma.prize.update({
        where: { id: prizeToToggle.id },
        data: { isActive: newActive },
      });
      return newActive
        ? `✅ Lot "${prizeToToggle.name}" réactivé.`
        : `⏸️ Lot "${prizeToToggle.name}" désactivé.`;
    }

    case 'stats': {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalClaims, todayClaims, pendingClaims] = await Promise.all([
        prisma.prizeClaim.count({ where: { restaurantId } }),
        prisma.prizeClaim.count({ where: { restaurantId, createdAt: { gte: today } } }),
        prisma.prizeClaim.count({ where: { restaurantId, status: 'PENDING' } }),
      ]);

      return `📊 Statistiques lots :\n• Total gagné : ${totalClaims}\n• Aujourd'hui : ${todayClaims}\n• En attente de réclamation : ${pendingClaims}`;
    }

    default:
      return '❌ Action non reconnue. Utilisez : list, add, edit, remove, stats.';
  }
}

/**
 * Tool: stats
 * General statistics for the restaurant.
 */
export async function stats(
  restaurantId: string,
  period: 'today' | 'week' | 'month' | 'all',
): Promise<string> {
  const now = new Date();
  let start: Date;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case 'all':
    default:
      start = new Date(2020, 0, 1);
      break;
  }

  const [feedbackCount, claimCount, uniqueVisitors, pendingClaims] = await Promise.all([
    prisma.feedback.count({
      where: { restaurantId, createdAt: { gte: start } },
    }),
    prisma.prizeClaim.count({
      where: { restaurantId, createdAt: { gte: start } },
    }),
    prisma.fingerprint.count({
      where: { restaurantId, createdAt: { gte: start } },
    }),
    prisma.prizeClaim.count({
      where: { restaurantId, status: 'PENDING' },
    }),
  ]);

  return `📊 Stats (${period}) :\n• Avis reçus : ${feedbackCount}\n• Visiteurs uniques : ${uniqueVisitors}\n• Lots gagnés : ${claimCount}\n• Lots en attente : ${pendingClaims}`;
}

/**
 * Tool: signaler_amelioration
 * Manager signals an improvement, AI finds matching negative feedbacks and offers to notify clients.
 */
export async function signalerAmelioration(
  restaurantId: string,
  action: 'analyze' | 'notify',
  params?: {
    description?: string;
    improvementId?: string;
  },
): Promise<string> {
  if (action === 'analyze') {
    if (!params?.description) {
      return '❌ Décrivez l\'amélioration que vous avez apportée (ex: "Nous avons changé les chaises du restaurant").';
    }

    const negativeFeedbacks = await prisma.feedback.findMany({
      where: {
        restaurantId,
        negativeText: { not: { in: [null, ''] } },
      },
      include: {
        fingerprint: {
          select: {
            id: true,
            wantNotifyOwn: true,
            wantNotifyOthers: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    if (negativeFeedbacks.length === 0) {
      return '📭 Aucun commentaire négatif trouvé dans votre restaurant.';
    }

    // Simple keyword matching (AI agent itself will do the smart matching via its own reasoning)
    const keywords = params.description.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const matched = negativeFeedbacks.filter((f: { negativeText: string | null }) => {
      const text = (f.negativeText || '').toLowerCase();
      return keywords.some((k: string) => text.includes(k));
    });

    if (matched.length === 0) {
      return `🔍 Aucun commentaire négatif ne semble correspondre à "${params.description}". Vos clients n'ont pas mentionné ce point.`;
    }

    const notifiable = matched.filter(
      (f: { fingerprint: { wantNotifyOwn: boolean; wantNotifyOthers: boolean; contactEmail: string | null; contactPhone: string | null } }) =>
        (f.fingerprint.wantNotifyOwn || f.fingerprint.wantNotifyOthers) &&
        (f.fingerprint.contactEmail || f.fingerprint.contactPhone)
    );

    // Save improvement
    const improvement = await prisma.improvement.create({
      data: {
        description: params.description,
        restaurantId,
        matchedFeedbackIds: matched.map((f: { id: string }) => f.id),
      },
    });

    const lines = matched.slice(0, 10).map((f: { negativeText: string | null; createdAt: Date }, i: number) => {
      const date = f.createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      return `${i + 1}. [${date}] "${f.negativeText}"`;
    });

    let response = `🎯 ${matched.length} commentaire(s) négatif(s) correspondent à "${params.description}" :\n\n${lines.join('\n')}`;

    if (notifiable.length > 0) {
      response += `\n\n📬 ${notifiable.length} client(s) souhaitent être prévenus des améliorations.`;
      response += `\n💡 Voulez-vous les notifier ? Dites "oui, notifier" et je m'en occupe. (ID: ${improvement.id})`;
    } else {
      response += `\n\nℹ️ Aucun client n'a demandé à être notifié pour ces commentaires.`;
    }

    return response;
  }

  if (action === 'notify') {
    if (!params?.improvementId) {
      return '❌ Précisez l\'ID de l\'amélioration à notifier.';
    }

    const improvement = await prisma.improvement.findFirst({
      where: { id: params.improvementId, restaurantId },
    });

    if (!improvement) return '❌ Amélioration non trouvée.';
    if (improvement.status === 'NOTIFIED') return '✅ Les clients ont déjà été notifiés pour cette amélioration.';

    const feedbackIds = improvement.matchedFeedbackIds as string[];
    const feedbacks = await prisma.feedback.findMany({
      where: { id: { in: feedbackIds } },
      include: {
        fingerprint: {
          select: {
            id: true,
            wantNotifyOwn: true,
            wantNotifyOthers: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
      },
    });

    const seen = new Set<string>();
    const toNotify = feedbacks.filter((f: { fingerprintId: string; fingerprint: { wantNotifyOwn: boolean; wantNotifyOthers: boolean; contactEmail: string | null; contactPhone: string | null } }) => {
      if (seen.has(f.fingerprintId)) return false;
      seen.add(f.fingerprintId);
      return (f.fingerprint.wantNotifyOwn || f.fingerprint.wantNotifyOthers) &&
             (f.fingerprint.contactEmail || f.fingerprint.contactPhone);
    });

    // Import notifyClient dynamically
    const { notifyClient } = await import('../notifications/sender.js');

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    let notifiedCount = 0;

    for (const f of toNotify) {
      const result = await notifyClient(
        restaurant?.name || 'Votre restaurant',
        improvement.description,
        f.fingerprint.contactEmail,
        f.fingerprint.contactPhone,
      );
      if (result.emailSent || result.smsSent) notifiedCount++;
    }

    await prisma.improvement.update({
      where: { id: improvement.id },
      data: { status: 'NOTIFIED', notifiedAt: new Date(), notifiedCount },
    });

    return `✅ ${notifiedCount} client(s) notifié(s) de votre amélioration "${improvement.description}". Bravo pour cette initiative ! 🎉`;
  }

  return '❌ Action non reconnue. Utilisez : analyze ou notify.';
}

// Helper to format a pre-computed summary
function formatSummary(summary: {
  totalFeedbacks: number;
  avgSentiment: number | null;
  positiveSummary: string | null;
  negativeSummary: string | null;
  topStrengths: unknown;
  topWeaknesses: unknown;
  actionItems: unknown;
}): string {
  const lines = [`📊 Résumé (${summary.totalFeedbacks} avis) :`];

  if (summary.avgSentiment !== null) {
    const emoji = summary.avgSentiment > 0.5 ? '😊' : summary.avgSentiment > 0 ? '🙂' : '😐';
    lines.push(`${emoji} Sentiment moyen : ${(summary.avgSentiment * 100).toFixed(0)}%`);
  }

  if (summary.positiveSummary) {
    lines.push(`\n✅ **Points forts :**\n${summary.positiveSummary}`);
  }

  if (summary.negativeSummary) {
    lines.push(`\n⚠️ **À améliorer :**\n${summary.negativeSummary}`);
  }

  const strengths = summary.topStrengths as string[] | null;
  if (strengths && Array.isArray(strengths) && strengths.length > 0) {
    lines.push(`\n💪 Top points forts : ${strengths.join(', ')}`);
  }

  const weaknesses = summary.topWeaknesses as string[] | null;
  if (weaknesses && Array.isArray(weaknesses) && weaknesses.length > 0) {
    lines.push(`\n📌 Points à travailler : ${weaknesses.join(', ')}`);
  }

  const actions = summary.actionItems as string[] | null;
  if (actions && Array.isArray(actions) && actions.length > 0) {
    lines.push(`\n🎯 Actions suggérées :\n${actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`);
  }

  return lines.join('\n');
}
