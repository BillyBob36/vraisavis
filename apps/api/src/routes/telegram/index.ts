import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { TelegramUpdate } from '../../services/messaging/telegram.js';
import { sendTelegramMessage, sendTelegramTypingAction } from '../../services/messaging/telegram.js';
import { findManagerByTelegramChatId } from '../../services/messaging/router.js';
import { processAgentMessage } from '../../services/ai-agent/agent.js';

export async function telegramRoutes(fastify: FastifyInstance) {
  /**
   * Telegram webhook endpoint.
   * Receives all incoming messages from Telegram.
   */
  fastify.post('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    // Verify webhook secret if configured
    if (config.TELEGRAM_WEBHOOK_SECRET) {
      const secretHeader = request.headers['x-telegram-bot-api-secret-token'];
      if (secretHeader !== config.TELEGRAM_WEBHOOK_SECRET) {
        return reply.status(403).send({ error: 'Forbidden' });
      }
    }

    const update = request.body as TelegramUpdate;

    // Only handle text messages
    if (!update.message?.text) {
      return reply.status(200).send({ ok: true });
    }

    const chatId = update.message.chat.id.toString();
    const text = update.message.text.trim();
    const firstName = update.message.from.first_name || '';

    // Handle /start command — link Telegram to account
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length > 1) {
        // /start <linkCode> — Link this Telegram chat to a manager account
        const linkCode = parts[1];
        return await handleLinkAccount(chatId, linkCode, firstName, reply);
      }

      // Plain /start — check if already linked
      const manager = await findManagerByTelegramChatId(chatId);
      if (manager) {
        const restaurantName = manager.managedRestaurants[0]?.name || 'votre restaurant';
        await sendTelegramMessage(chatId,
          `👋 Bonjour ${manager.name} !\n\nJe suis votre assistant IA pour *${restaurantName}*.\n\nVous pouvez me demander :\n• 📊 Les avis du jour/semaine/mois\n• 🎁 Gérer vos lots (lister, ajouter, supprimer)\n• 📈 Les statistiques\n\nEssayez par exemple : "Quels sont les avis du jour ?"`,
        );
      } else {
        await sendTelegramMessage(chatId,
          `👋 Bienvenue sur VraisAvis !\n\nPour lier ce chat à votre compte, allez dans votre tableau de bord → Paramètres → Messagerie, puis cliquez sur "Lier Telegram".`,
        );
      }
      return reply.status(200).send({ ok: true });
    }

    // Handle /help command
    if (text === '/help') {
      await sendTelegramMessage(chatId,
        `🤖 *Commandes disponibles :*\n\n• "Avis du jour" — Voir les avis d'aujourd'hui\n• "Avis de la semaine" — Voir les avis de la semaine\n• "Mes lots" — Lister les lots de la machine à sous\n• "Stats" — Statistiques générales\n• "Ajouter un lot [nom]" — Ajouter un nouveau lot\n• "Supprimer le lot [nom]" — Désactiver un lot\n\nOu posez n'importe quelle question en langage naturel !`,
      );
      return reply.status(200).send({ ok: true });
    }

    // Regular message — route to AI agent
    const manager = await findManagerByTelegramChatId(chatId);
    if (!manager) {
      await sendTelegramMessage(chatId,
        `❌ Ce chat n'est pas lié à un compte VraisAvis.\n\nAllez dans votre tableau de bord → Paramètres → Messagerie pour lier votre compte.`,
      );
      return reply.status(200).send({ ok: true });
    }

    const restaurant = manager.managedRestaurants[0];
    if (!restaurant) {
      await sendTelegramMessage(chatId, '❌ Aucun restaurant actif trouvé sur votre compte.');
      return reply.status(200).send({ ok: true });
    }

    // Show typing indicator
    await sendTelegramTypingAction(chatId);

    // Process through AI agent
    const response = await processAgentMessage(
      manager.id,
      restaurant.id,
      text,
      'TELEGRAM',
    );

    await sendTelegramMessage(chatId, response);
    return reply.status(200).send({ ok: true });
  });

  /**
   * Setup webhook endpoint (called once by admin).
   */
  fastify.post('/setup-webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!config.TELEGRAM_BOT_TOKEN) {
      return reply.status(400).send({ error: 'TELEGRAM_BOT_TOKEN not configured' });
    }

    const webhookUrl = `${config.API_URL}/api/v1/telegram/webhook`;

    const { setTelegramWebhook } = await import('../../services/messaging/telegram.js');
    const success = await setTelegramWebhook(webhookUrl);

    if (success) {
      return reply.send({ message: 'Webhook configuré', url: webhookUrl });
    }
    return reply.status(500).send({ error: 'Échec de la configuration du webhook' });
  });

  /**
   * Generate a Telegram link code for a manager.
   * Called from the web dashboard.
   */
  fastify.get('/link-code/:managerId', async (request: FastifyRequest<{
    Params: { managerId: string };
  }>, reply: FastifyReply) => {
    const { managerId } = request.params;

    // Generate a simple time-based link code
    const code = `link_${managerId}_${Date.now().toString(36)}`;

    // Store temporarily (expires in 10 minutes)
    await prisma.messagingVerification.create({
      data: {
        managerId,
        phoneNumber: 'telegram-link',
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const botUsername = config.TELEGRAM_BOT_TOKEN
      ? `https://t.me/${await getBotUsername()}?start=${code}`
      : null;

    return reply.send({ code, botLink: botUsername });
  });
}

async function handleLinkAccount(
  chatId: string,
  linkCode: string,
  firstName: string,
  reply: FastifyReply,
) {
  // Find the verification record
  const verification = await prisma.messagingVerification.findFirst({
    where: {
      code: linkCode,
      phoneNumber: 'telegram-link',
      verified: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!verification) {
    await sendTelegramMessage(chatId,
      '❌ Code de liaison invalide ou expiré. Veuillez en générer un nouveau depuis votre tableau de bord.',
    );
    return reply.status(200).send({ ok: true });
  }

  // Link the Telegram chat to the manager
  await prisma.user.update({
    where: { id: verification.managerId },
    data: {
      telegramChatId: chatId,
      preferredMessaging: 'TELEGRAM',
      messagingOptIn: true,
    },
  });

  // Mark verification as used
  await prisma.messagingVerification.update({
    where: { id: verification.id },
    data: { verified: true },
  });

  const manager = await prisma.user.findUnique({
    where: { id: verification.managerId },
    include: { managedRestaurants: { take: 1 } },
  });

  const restaurantName = manager?.managedRestaurants[0]?.name || 'votre restaurant';

  await sendTelegramMessage(chatId,
    `✅ Compte lié avec succès !\n\n👋 Bonjour ${firstName} ! Je suis votre assistant IA pour *${restaurantName}*.\n\nDemandez-moi par exemple :\n• "Quels sont les avis du jour ?"\n• "Mes lots"\n• "Stats de la semaine"`,
  );

  return reply.status(200).send({ ok: true });
}

async function getBotUsername(): Promise<string> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/getMe`,
    );
    const data = await res.json() as { result: { username: string } };
    return data.result.username;
  } catch {
    return 'VraisAvisBot';
  }
}
