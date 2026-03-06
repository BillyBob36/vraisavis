import { prisma } from '../../lib/prisma.js';
import { generateEmbedding, searchByEmbedding, getThemeCounts } from '../feedback-ai/embedder.js';

// Helper: compute date range from period name
function periodToRange(period: string): { start: Date; end: Date } {
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
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'last_month': {
      start = new Date(now);
      start.setMonth(start.getMonth() - 2);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setMonth(end.getMonth() - 1);
      end.setHours(0, 0, 0, 0);
      break;
    }
    case 'quarter':
      start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      break;
    case 'last_quarter': {
      start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setMonth(end.getMonth() - 3);
      end.setHours(0, 0, 0, 0);
      break;
    }
    case 'all':
    default:
      start = new Date(2020, 0, 1);
      break;
  }
  return { start, end };
}

/**
 * Tool: consulter_avis
 * Retrieves feedbacks with optional semantic search, sentiment filter, and service filter.
 * If a search query is provided, uses embedding similarity search across ALL feedbacks.
 * Otherwise, returns feedbacks for the given period.
 */
export async function consulterAvis(
  restaurantId: string,
  params: {
    period?: string;
    search?: string;
    sentiment?: 'positive' | 'negative' | 'all';
    service?: 'lunch' | 'dinner';
    limit?: number;
  },
): Promise<string> {
  const period = params.period || 'month';
  const { start, end } = periodToRange(period);
  const limit = params.limit || 50;

  // Build base where clause
  const where: Record<string, unknown> = {
    restaurantId,
    createdAt: { gte: start, lt: end },
    excludedByRules: { equals: [] },
  };

  if (params.sentiment === 'negative') {
    where.negativeText = { not: '' };
    where.NOT = { negativeText: null };
  } else if (params.sentiment === 'positive') {
    where.OR = [{ negativeText: null }, { negativeText: '' }];
  }

  if (params.service) {
    where.serviceType = params.service;
  }

  // If search query provided, try semantic search first, then fallback to text search
  if (params.search) {
    try {
      const queryEmbedding = await generateEmbedding(params.search);
      const results = await searchByEmbedding(restaurantId, queryEmbedding, {
        limit,
        sentiment: params.sentiment || 'all',
        dateFrom: period !== 'all' ? start : undefined,
        dateTo: period !== 'all' ? end : undefined,
        serviceType: params.service,
        excludeExcluded: true,
      });

      if (results.length > 0) {
        const lines = results.map((f, i: number) => {
          const date = new Date(f.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
          const sim = (f.similarity * 100).toFixed(0);
          let text = `${i + 1}. [${date}] (pertinence: ${sim}%)`;
          text += `\n   POSITIF: "${f.positiveText}"`;
          if (f.negativeText) text += `\n   NÉGATIF: "${f.negativeText}"`;
          return text;
        });

        return `🔍 ${results.length} avis trouvés pour "${params.search}" (${period}).\nATTENTION: Les textes ci-dessous sont les CITATIONS EXACTES des clients. Ne les reformule JAMAIS.\n\n${lines.join('\n\n')}`;
      }
    } catch (err) {
      console.error('Semantic search failed, falling back to text search:', err);
    }

    // Fallback: text-based search (LIKE) for feedbacks not yet embedded
    const searchTerm = params.search;
    const textSearchOr = [
      { positiveText: { contains: searchTerm, mode: 'insensitive' as const } },
      { negativeText: { contains: searchTerm, mode: 'insensitive' as const } },
    ];

    let textWhere: Record<string, unknown>;
    if (params.sentiment === 'positive') {
      textWhere = {
        restaurantId,
        createdAt: { gte: start, lt: end },
        ...(params.service ? { serviceType: params.service } : {}),
        AND: [
          { OR: [{ negativeText: null }, { negativeText: '' }] },
          { OR: textSearchOr },
        ],
      };
    } else {
      textWhere = { ...where, OR: textSearchOr };
    }

    const textResults = await prisma.feedback.findMany({
      where: textWhere,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const textTotal = await prisma.feedback.count({ where: textWhere });

    if (textResults.length > 0) {
      type FB = typeof textResults[number];
      const lines = textResults.map((f: FB, i: number) => {
        const date = f.createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        let text = `${i + 1}. [${date}]`;
        text += `\n   POSITIF: "${f.positiveText}"`;
        if (f.negativeText) text += `\n   NÉGATIF: "${f.negativeText}"`;
        return text;
      });
      const showing = textTotal > limit ? ` (${limit} affichés sur ${textTotal} au total)` : '';
      return `🔍 ${textTotal} avis contenant "${params.search}" (${period})${showing}.\nATTENTION: Les textes ci-dessous sont les CITATIONS EXACTES des clients. Ne les reformule JAMAIS.\n\n${lines.join('\n\n')}`;
    }

    return `Aucun avis trouvé pour "${params.search}" (${period}).`;
  }

  // Try pre-computed summary for yesterday
  if (period === 'yesterday' && !params.sentiment && !params.service) {
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

  const feedbacks = await prisma.feedback.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const total = await prisma.feedback.count({ where });

  if (feedbacks.length === 0) {
    return `Aucun avis trouvé pour la période "${period}"${params.sentiment ? ` (${params.sentiment})` : ''}.`;
  }

  type FB = typeof feedbacks[number];
  const lines = feedbacks.map((f: FB, i: number) => {
    const date = f.createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    let text = `${i + 1}. [${date}]`;
    text += `\n   POSITIF: "${f.positiveText}"`;
    if (f.negativeText) text += `\n   NÉGATIF: "${f.negativeText}"`;
    return text;
  });

  const showing = total > limit ? ` (${limit} affichés sur ${total} au total)` : '';
  return `📊 ${total} avis (${period})${showing}.\nATTENTION: Les textes ci-dessous sont les CITATIONS EXACTES des clients. Ne les reformule JAMAIS, cite-les entre guillemets.\n\n${lines.join('\n\n')}`;
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
        negativeText: { not: '' },
        NOT: { negativeText: null },
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

    type FBWithFP = typeof negativeFeedbacks[number];

    if (negativeFeedbacks.length === 0) {
      return '📭 Aucun commentaire négatif trouvé dans votre restaurant.';
    }

    // Simple keyword matching (AI agent itself will do the smart matching via its own reasoning)
    const keywords = params.description.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const matched = negativeFeedbacks.filter((f: FBWithFP) => {
      const text = (f.negativeText || '').toLowerCase();
      return keywords.some((k: string) => text.includes(k));
    });

    if (matched.length === 0) {
      return `🔍 Aucun commentaire négatif ne semble correspondre à "${params.description}". Vos clients n'ont pas mentionné ce point.`;
    }

    const notifiable = matched.filter(
      (f: FBWithFP) =>
        (f.fingerprint.wantNotifyOwn || f.fingerprint.wantNotifyOthers) &&
        (f.fingerprint.contactEmail || f.fingerprint.contactPhone)
    );

    // Save improvement
    const improvement = await prisma.improvement.create({
      data: {
        description: params.description,
        restaurantId,
        matchedFeedbackIds: matched.map((f: FBWithFP) => f.id),
      },
    });

    const lines = matched.slice(0, 10).map((f: FBWithFP, i: number) => {
      const date = f.createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      return `${i + 1}. [${date}] "${f.negativeText}"`;
    });

    let response = `🎯 ${matched.length} commentaire(s) négatif(s) correspondent à "${params.description}" :\n\n${lines.join('\n')}`;

    if (notifiable.length > 0) {
      response += `\n\n📬 ${notifiable.length} client(s) souhaitent être prévenus des améliorations.`;
      response += `\n\n✅ Amélioration enregistrée — ID: \`${improvement.id}\``;
      response += `\n\n👉 Pour notifier ces clients, confirme en disant "oui, notifier". J'utiliserai l'ID ci-dessus automatiquement.`;
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

    type FBNotify = typeof feedbacks[number];
    const seen = new Set<string>();
    const toNotify = feedbacks.filter((f: FBNotify) => {
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
      if (result.emailSent || result.whatsappSent) notifiedCount++;
    }

    await prisma.improvement.update({
      where: { id: improvement.id },
      data: { status: 'NOTIFIED', notifiedAt: new Date(), notifiedCount },
    });

    return `✅ ${notifiedCount} client(s) notifié(s) de votre amélioration "${improvement.description}". Bravo pour cette initiative ! 🎉`;
  }

  return '❌ Action non reconnue. Utilisez : analyze ou notify.';
}

/**
 * Tool: analyser_tendances
 * Compares feedback themes between two periods to identify trends.
 * Can also give a snapshot of top themes for a single period.
 */
export async function analyserTendances(
  restaurantId: string,
  params: {
    period: string;
    compareTo?: string;
    sentiment?: 'positive' | 'negative' | 'all';
    service?: 'lunch' | 'dinner';
  },
): Promise<string> {
  const sentiment = params.sentiment || 'negative';
  const { start: s1, end: e1 } = periodToRange(params.period);

  // Get counts for current period
  const currentThemes = await getThemeCounts(restaurantId, s1, e1, sentiment);
  const currentTotal = await prisma.feedback.count({
    where: {
      restaurantId,
      createdAt: { gte: s1, lt: e1 },
      excludedByRules: { equals: [] },
      ...(sentiment === 'negative' ? { negativeText: { not: '' }, NOT: { negativeText: null } } : {}),
      ...(sentiment === 'positive' ? { OR: [{ negativeText: null }, { negativeText: '' }] } : {}),
      ...(params.service ? { serviceType: params.service } : {}),
    },
  });

  // If compareTo is provided, get counts for comparison period
  if (params.compareTo) {
    const { start: s2, end: e2 } = periodToRange(params.compareTo);
    const prevThemes = await getThemeCounts(restaurantId, s2, e2, sentiment);
    const prevTotal = await prisma.feedback.count({
      where: {
        restaurantId,
        createdAt: { gte: s2, lt: e2 },
        excludedByRules: { equals: [] },
        ...(sentiment === 'negative' ? { negativeText: { not: '' }, NOT: { negativeText: null } } : {}),
        ...(sentiment === 'positive' ? { OR: [{ negativeText: null }, { negativeText: '' }] } : {}),
        ...(params.service ? { serviceType: params.service } : {}),
      },
    });

    // Merge all themes
    const allThemes = new Set([...Object.keys(currentThemes), ...Object.keys(prevThemes)]);

    const trends: Array<{ theme: string; current: number; previous: number; change: number }> = [];
    for (const theme of allThemes) {
      const current = currentThemes[theme] || 0;
      const previous = prevThemes[theme] || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);
      trends.push({ theme, current, previous, change });
    }

    // Sort by absolute change
    trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    const rising = trends.filter(t => t.change > 10);
    const declining = trends.filter(t => t.change < -10);
    const stable = trends.filter(t => Math.abs(t.change) <= 10);

    const sentimentLabel = sentiment === 'negative' ? 'négatifs' : sentiment === 'positive' ? 'positifs' : 'tous';
    const lines: string[] = [
      `📊 Comparaison tendances (${sentimentLabel}) :`,
      `📅 ${params.period} : ${currentTotal} avis | ${params.compareTo} : ${prevTotal} avis`,
    ];

    if (rising.length > 0) {
      lines.push(`\n📈 **En hausse :**`);
      for (const t of rising.slice(0, 5)) {
        lines.push(`  • ${t.theme} : ${t.previous} → ${t.current} (+${t.change.toFixed(0)}%)`);
      }
    }

    if (declining.length > 0) {
      lines.push(`\n📉 **En baisse :**`);
      for (const t of declining.slice(0, 5)) {
        lines.push(`  • ${t.theme} : ${t.previous} → ${t.current} (${t.change.toFixed(0)}%)`);
      }
    }

    if (stable.length > 0) {
      lines.push(`\n🔄 **Stable :** ${stable.map(t => t.theme).join(', ')}`);
    }

    // Common themes
    const common = trends.filter(t => t.current > 0 && t.previous > 0);
    if (common.length > 0) {
      lines.push(`\n🔗 **Thèmes communs :** ${common.map(t => t.theme).join(', ')}`);
    }

    // New themes (only in current)
    const newThemes = trends.filter(t => t.current > 0 && t.previous === 0);
    if (newThemes.length > 0) {
      lines.push(`\n🆕 **Nouveaux thèmes :** ${newThemes.map(t => `${t.theme} (${t.current}x)`).join(', ')}`);
    }

    // Resolved themes (only in previous)
    const resolved = trends.filter(t => t.current === 0 && t.previous > 0);
    if (resolved.length > 0) {
      lines.push(`\n✅ **Résolus :** ${resolved.map(t => `${t.theme} (était ${t.previous}x)`).join(', ')}`);
    }

    return lines.join('\n');
  }

  // Single period: just show top themes
  if (Object.keys(currentThemes).length === 0) {
    // Fallback: extract themes in-memory from raw feedback text
    const rawFeedbacks = await prisma.feedback.findMany({
      where: {
        restaurantId,
        createdAt: { gte: s1, lt: e1 },
        excludedByRules: { equals: [] },
        ...(sentiment === 'negative' ? { negativeText: { not: '' }, NOT: { negativeText: null } } : {}),
        ...(params.service ? { serviceType: params.service } : {}),
      },
      select: { positiveText: true, negativeText: true },
      take: 500,
    });
    if (rawFeedbacks.length === 0) {
      return `Aucun avis trouvé pour la période "${params.period}".`;
    }
    const fallbackCounts: Record<string, number> = {};
    for (const fb of rawFeedbacks) {
      const text = `${fb.positiveText} ${fb.negativeText ?? ''}`.toLowerCase();
      const KEYWORDS: Record<string, string[]> = {
        attente: ['attente', 'attendre', 'long', 'lent', 'rapide', 'minutes', 'délai'],
        service: ['service', 'serveur', 'serveuse', 'personnel', 'staff'],
        nourriture: ['plat', 'cuisine', 'nourriture', 'goût', 'saveur', 'cuisson', 'cuit', 'frais', 'fade', 'recette'],
        prix: ['prix', 'cher', 'coût', 'tarif', 'addition'],
        ambiance: ['ambiance', 'atmosphère', 'musique', 'décor', 'cadre'],
        propreté: ['propre', 'propreté', 'sale', 'hygiène'],
        quantité: ['quantité', 'portion', 'copieux', 'insuffisant'],
        température: ['froid', 'chaud', 'tiède', 'température'],
        accueil: ['accueil', 'bienvenue', 'sourire', 'aimable', 'sympathique'],
        carte: ['carte', 'menu', 'choix', 'variété', 'option'],
        boisson: ['boisson', 'vin', 'bière', 'cocktail', 'café'],
        dessert: ['dessert', 'gâteau', 'tarte', 'glace', 'sucré'],
        bruit: ['bruit', 'bruyant', 'calme', 'sonore'],
        propreté_toilettes: ['toilette', 'wc', 'sanitaire'],
      };
      for (const [theme, keywords] of Object.entries(KEYWORDS)) {
        if (keywords.some(kw => text.includes(kw))) {
          fallbackCounts[theme] = (fallbackCounts[theme] ?? 0) + 1;
        }
      }
    }
    if (Object.keys(fallbackCounts).length === 0) {
      return `${rawFeedbacks.length} avis trouvés pour "${params.period}" mais aucun thème extrait.`;
    }
    const sentimentLabel = sentiment === 'negative' ? 'négatifs' : sentiment === 'positive' ? 'positifs' : 'tous';
    const sorted2 = Object.entries(fallbackCounts).sort((a, b) => b[1] - a[1]);
    const maxVal = sorted2[0][1];
    const lines2: string[] = [`📊 Top thèmes ${sentimentLabel} (${params.period}, ${rawFeedbacks.length} avis) :` ];
    for (const [theme, count] of sorted2.slice(0, 10)) {
      const pct = ((count / rawFeedbacks.length) * 100).toFixed(0);
      const bar = '█'.repeat(Math.max(1, Math.round(count / maxVal * 10)));
      lines2.push(`  ${bar} ${theme} : ${count} (${pct}%)`);
    }
    return lines2.join('\n');
  }

  const sentimentLabel = sentiment === 'negative' ? 'négatifs' : sentiment === 'positive' ? 'positifs' : 'tous';
  const sorted = Object.entries(currentThemes).sort((a, b) => b[1] - a[1]);
  const lines: string[] = [
    `📊 Top thèmes ${sentimentLabel} (${params.period}, ${currentTotal} avis) :`,
  ];

  for (const [theme, count] of sorted.slice(0, 10)) {
    const pct = currentTotal > 0 ? ((count / currentTotal) * 100).toFixed(0) : '0';
    const bar = '█'.repeat(Math.max(1, Math.round(count / Math.max(...sorted.map(s => s[1])) * 10)));
    lines.push(`  ${bar} ${theme} : ${count} (${pct}%)`);
  }

  return lines.join('\n');
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
