import { prisma } from '../../lib/prisma.js';
import { config } from '../../config/env.js';
import { sendMessageToManager } from '../messaging/router.js';

/**
 * Generate daily summaries for all active restaurants.
 * Called by the nightly cron job at 22h.
 */
export async function generateDailySummaries(): Promise<void> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  // Get all active restaurants
  const restaurants = await prisma.restaurant.findMany({
    where: { status: 'ACTIVE' },
    include: { manager: true },
  });

  for (const restaurant of restaurants) {
    try {
      // Get today's feedbacks
      const feedbacks = await prisma.feedback.findMany({
        where: {
          restaurantId: restaurant.id,
          createdAt: { gte: startOfDay, lt: endOfDay },
        },
      });

      if (feedbacks.length === 0) {
        // Still create an empty summary record
        await prisma.feedbackSummary.upsert({
          where: {
            restaurantId_periodType_periodStart: {
              restaurantId: restaurant.id,
              periodType: 'DAILY',
              periodStart: startOfDay,
            },
          },
          update: { totalFeedbacks: 0 },
          create: {
            restaurantId: restaurant.id,
            periodType: 'DAILY',
            periodStart: startOfDay,
            periodEnd: endOfDay,
            totalFeedbacks: 0,
          },
        });
        continue;
      }

      // Generate AI summary if Azure OpenAI is configured
      let analysis = null;
      if (config.OPENAI_API_KEY) {
        analysis = await generateAISummary(feedbacks, restaurant.name);
      }

      // Upsert summary
      const analysisData = analysis ? {
        avgSentiment: analysis.avgSentiment,
        positiveSummary: analysis.positiveSummary,
        negativeSummary: analysis.negativeSummary,
        topStrengths: analysis.topStrengths as string[],
        topWeaknesses: analysis.topWeaknesses as string[],
        actionItems: analysis.actionItems as string[],
        rawAnalysis: analysis.raw as Record<string, string>,
      } : {};

      const summary = await prisma.feedbackSummary.upsert({
        where: {
          restaurantId_periodType_periodStart: {
            restaurantId: restaurant.id,
            periodType: 'DAILY',
            periodStart: startOfDay,
          },
        },
        update: {
          totalFeedbacks: feedbacks.length,
          ...analysisData,
        },
        create: {
          restaurantId: restaurant.id,
          periodType: 'DAILY',
          periodStart: startOfDay,
          periodEnd: endOfDay,
          totalFeedbacks: feedbacks.length,
          ...analysisData,
        },
      });

      // Send summary to manager via messaging
      const managerMessage = formatDailySummaryMessage(restaurant.name, summary, feedbacks.length);
      await sendMessageToManager(restaurant.managerId, managerMessage);

      console.log(`✅ Summary generated for ${restaurant.name}: ${feedbacks.length} feedbacks`);
    } catch (err) {
      console.error(`❌ Error generating summary for ${restaurant.name}:`, err);
    }
  }
}

/**
 * Generate weekly summary (aggregates daily summaries).
 * Called on Sunday nights.
 */
export async function generateWeeklySummaries(): Promise<void> {
  const now = new Date();
  const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(endOfWeek);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const restaurants = await prisma.restaurant.findMany({
    where: { status: 'ACTIVE' },
    include: { manager: true },
  });

  for (const restaurant of restaurants) {
    try {
      // Aggregate daily summaries for the week
      const dailySummaries = await prisma.feedbackSummary.findMany({
        where: {
          restaurantId: restaurant.id,
          periodType: 'DAILY',
          periodStart: { gte: startOfWeek, lt: endOfWeek },
        },
      });

      const totalFeedbacks = dailySummaries.reduce((sum: number, s: { totalFeedbacks: number }) => sum + s.totalFeedbacks, 0);

      const sentiments = dailySummaries
        .filter((s: { avgSentiment: number | null }) => s.avgSentiment !== null)
        .map((s: { avgSentiment: number | null }) => s.avgSentiment as number);
      const avgSentiment = sentiments.length > 0
        ? sentiments.reduce((a: number, b: number) => a + b, 0) / sentiments.length
        : null;

      const weeklyData = avgSentiment !== null ? { totalFeedbacks, avgSentiment } : { totalFeedbacks };

      await prisma.feedbackSummary.upsert({
        where: {
          restaurantId_periodType_periodStart: {
            restaurantId: restaurant.id,
            periodType: 'WEEKLY',
            periodStart: startOfWeek,
          },
        },
        update: weeklyData,
        create: {
          restaurantId: restaurant.id,
          periodType: 'WEEKLY',
          periodStart: startOfWeek,
          periodEnd: endOfWeek,
          totalFeedbacks,
          avgSentiment,
        },
      });

      console.log(`✅ Weekly summary for ${restaurant.name}: ${totalFeedbacks} feedbacks`);
    } catch (err) {
      console.error(`❌ Error generating weekly summary for ${restaurant.name}:`, err);
    }
  }
}

interface AIAnalysis {
  avgSentiment: number;
  positiveSummary: string;
  negativeSummary: string;
  topStrengths: string[];
  topWeaknesses: string[];
  actionItems: string[];
  raw: Record<string, unknown>;
}

async function generateAISummary(
  feedbacks: Array<{ positiveText: string; negativeText: string | null }>,
  restaurantName: string,
): Promise<AIAnalysis | null> {
  try {
    const feedbackText = feedbacks.map((f, i) => {
      const neg = f.negativeText ? `\n  Négatif: ${f.negativeText}` : '';
      return `${i + 1}. Positif: ${f.positiveText}${neg}`;
    }).join('\n');

    const url = 'https://api.openai.com/v1/chat/completions';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: `Tu es un analyste de feedback client pour le restaurant "${restaurantName}". Analyse les avis ci-dessous et réponds en JSON strict avec cette structure :
{
  "avgSentiment": <float -1 à 1>,
  "positiveSummary": "<résumé des points positifs en 2-3 phrases>",
  "negativeSummary": "<résumé des points négatifs en 2-3 phrases, ou null si aucun>",
  "topStrengths": ["force1", "force2", "force3"],
  "topWeaknesses": ["faiblesse1", "faiblesse2"],
  "actionItems": ["action concrète 1", "action concrète 2"]
}`,
          },
          {
            role: 'user',
            content: `Voici les ${feedbacks.length} avis du jour :\n\n${feedbackText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) return null;

    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const parsed = JSON.parse(data.choices[0].message.content);

    return {
      avgSentiment: parsed.avgSentiment ?? 0,
      positiveSummary: parsed.positiveSummary ?? '',
      negativeSummary: parsed.negativeSummary ?? '',
      topStrengths: parsed.topStrengths ?? [],
      topWeaknesses: parsed.topWeaknesses ?? [],
      actionItems: parsed.actionItems ?? [],
      raw: parsed,
    };
  } catch (err) {
    console.error('AI summary generation error:', err);
    return null;
  }
}

function formatDailySummaryMessage(
  restaurantName: string,
  summary: { totalFeedbacks: number; avgSentiment: number | null; positiveSummary: string | null; negativeSummary: string | null },
  feedbackCount: number,
): string {
  const lines = [`📋 *Bilan du jour — ${restaurantName}*\n`];
  lines.push(`📊 ${feedbackCount} avis reçus aujourd'hui`);

  if (summary.avgSentiment !== null) {
    const pct = Math.round(summary.avgSentiment * 100);
    const emoji = pct > 60 ? '😊' : pct > 30 ? '🙂' : pct > 0 ? '😐' : '😟';
    lines.push(`${emoji} Satisfaction : ${pct}%`);
  }

  if (summary.positiveSummary) {
    lines.push(`\n✅ *Points forts :*\n${summary.positiveSummary}`);
  }

  if (summary.negativeSummary) {
    lines.push(`\n⚠️ *À améliorer :*\n${summary.negativeSummary}`);
  }

  lines.push('\n💡 Répondez à ce message pour en savoir plus !');
  return lines.join('\n');
}
