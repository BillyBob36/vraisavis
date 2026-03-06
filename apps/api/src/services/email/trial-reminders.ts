import { prisma } from '../../lib/prisma.js';
import { sendTrialEnding24hEmail, sendTrialEnding48hEmail, sendPaidPeriodStartedEmail } from './templates.js';
import { sendWhatsApp } from '../notifications/sender.js';

/**
 * Check all TRIAL subscriptions and send appropriate reminders:
 * - 48h before trial end: email + WhatsApp (promo codes only)
 * - 24h before trial end: email (all) + WhatsApp (promo codes only)
 * - Trial ended & now ACTIVE: paid period started email
 * 
 * Called hourly by cron scheduler.
 */
export async function checkTrialReminders(): Promise<void> {
  const now = new Date();

  // ─── 1. 48h reminder (promo only) ─────────────────────────
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const subs48h = await prisma.subscription.findMany({
    where: {
      status: 'TRIAL',
      trialEndsAt: { lte: in48h },
      trialReminder48hSent: false,
      promoCodeId: { not: null },
    },
    include: {
      restaurant: { include: { manager: true } },
    },
  });

  for (const sub of subs48h) {
    const mgr = sub.restaurant.manager;
    if (!mgr) continue;

    try {
      await sendTrialEnding48hEmail(mgr.email, mgr.name, sub.restaurant.name);

      // WhatsApp reminder if manager has whatsapp linked
      if (mgr.whatsappNumber) {
        const waText = `⏰ *Rappel VraisAvis*\n\nBonjour ${mgr.name},\n\nVotre essai gratuit pour *${sub.restaurant.name}* se termine dans *48 heures*.\n\n🚀 Passez à l'offre payante pour conserver toutes vos données et fonctionnalités.\n\n💼 *Bonus :* En devenant client, vous pouvez aussi devenir apporteur d'affaires et générer des revenus passifs !\n\n👉 ${process.env.FRONTEND_URL || 'https://app.vraisavis.fr'}/manager/settings`;
        await sendWhatsApp(mgr.whatsappNumber, waText);
      }

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { trialReminder48hSent: true },
      });

      console.log(`📧 48h trial reminder sent to ${mgr.email} (${sub.restaurant.name})`);
    } catch (err) {
      console.error(`❌ 48h reminder error for ${mgr.email}:`, err);
    }
  }

  // ─── 2. 24h reminder (all trials) ─────────────────────────
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const subs24h = await prisma.subscription.findMany({
    where: {
      status: 'TRIAL',
      trialEndsAt: { lte: in24h },
      trialReminder24hSent: false,
    },
    include: {
      restaurant: { include: { manager: true } },
    },
  });

  for (const sub of subs24h) {
    const mgr = sub.restaurant.manager;
    if (!mgr) continue;

    const isPromo = !!sub.promoCodeId;

    try {
      await sendTrialEnding24hEmail(mgr.email, mgr.name, sub.restaurant.name, isPromo);

      // WhatsApp reminder for promo users
      if (isPromo && mgr.whatsappNumber) {
        const waText = `⏰ *Dernier jour d'essai — VraisAvis*\n\nBonjour ${mgr.name},\n\nVotre essai gratuit pour *${sub.restaurant.name}* se termine *demain*.\n\n✅ Passez à l'offre payante maintenant pour ne rien perdre.\n\n💼 En devenant client VraisAvis, vous devenez aussi éligible à notre *programme d'apporteur d'affaires* : recommandez-nous et gagnez des revenus passifs complémentaires !\n\n👉 ${process.env.FRONTEND_URL || 'https://app.vraisavis.fr'}/manager/settings`;
        await sendWhatsApp(mgr.whatsappNumber, waText);
      }

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { trialReminder24hSent: true },
      });

      console.log(`📧 24h trial reminder sent to ${mgr.email} (${sub.restaurant.name}) [promo=${isPromo}]`);
    } catch (err) {
      console.error(`❌ 24h reminder error for ${mgr.email}:`, err);
    }
  }

  // ─── 3. Paid period started (trial ended, now ACTIVE) ─────
  const activeSubs = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      paidStartEmailSent: false,
      trialEndsAt: { lte: now },
    },
    include: {
      restaurant: { include: { manager: true } },
    },
  });

  for (const sub of activeSubs) {
    const mgr = sub.restaurant.manager;
    if (!mgr) continue;

    try {
      await sendPaidPeriodStartedEmail(mgr.email, mgr.name, sub.restaurant.name);

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { paidStartEmailSent: true },
      });

      console.log(`📧 Paid period started email sent to ${mgr.email} (${sub.restaurant.name})`);
    } catch (err) {
      console.error(`❌ Paid start email error for ${mgr.email}:`, err);
    }
  }
}
