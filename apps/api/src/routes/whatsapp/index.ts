import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import {
  sendWhatsAppMessage,
  sendWhatsAppTypingAction,
  createWhatsAppInstance,
  getWhatsAppQRCode,
  getWhatsAppConnectionState,
  deleteWhatsAppInstance,
  resolveJidToPhone,
} from '../../services/messaging/whatsapp.js';
import { findManagerByWhatsApp } from '../../services/messaging/router.js';
import { processAgentMessage } from '../../services/ai-agent/agent.js';

// Evolution API webhook payload types
interface EvoWebhookPayload {
  event: string;
  instance: string;
  apikey?: string;
  data: {
    // messages.upsert
    key?: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
      participant?: string;
      senderPn?: string;
    };
    pushName?: string;
    sender?: string;
    participant?: string;
    senderPn?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
    };
    messageType?: string;
    messageTimestamp?: number;
    // connection.update
    state?: string;
    statusReason?: number;
    // qrcode.updated
    qrcode?: {
      base64?: string;
      code?: string;
    };
  };
}

// Dedupe incoming messages to avoid double replies when Evolution sends duplicate events.
// Keyed by instance + message id, kept only for a short window.
const RECENT_MSG_TTL_MS = 10_000;
const recentMessageIds = new Map<string, number>();

function shouldProcessMessage(instance: string, messageId?: string): boolean {
  if (!messageId) return true;
  const key = `${instance}:${messageId}`;
  const now = Date.now();
  const last = recentMessageIds.get(key);
  if (last && now - last < RECENT_MSG_TTL_MS) return false;
  recentMessageIds.set(key, now);

  // Opportunistic cleanup
  if (recentMessageIds.size > 1000) {
    for (const [k, t] of recentMessageIds) {
      if (now - t > RECENT_MSG_TTL_MS) recentMessageIds.delete(k);
    }
  }
  return true;
}

/**
 * Extract the phone number from a WhatsApp JID.
 * "33612345678@s.whatsapp.net" → "33612345678"
 */
function jidToPhone(jid: string): string {
  return jid.replace(/@.*$/, '');
}

/**
 * Extract text from an Evolution API message payload.
 */
function extractText(data: EvoWebhookPayload['data']): string | null {
  return (
    data.message?.conversation ||
    data.message?.extendedTextMessage?.text ||
    null
  );
}

export async function whatsappRoutes(fastify: FastifyInstance) {
  /**
   * Evolution API webhook endpoint.
   * Receives all events from all WhatsApp instances.
   */
  fastify.post('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    // Optional: verify webhook secret via apikey header
    if (config.WHATSAPP_WEBHOOK_SECRET) {
      const apikey = (request.body as EvoWebhookPayload)?.apikey;
      if (apikey && apikey !== config.WHATSAPP_WEBHOOK_SECRET) {
        return reply.status(403).send({ error: 'Forbidden' });
      }
    }

    const payload = request.body as EvoWebhookPayload;

    console.log(`[WhatsApp] webhook received: event=${payload?.event} instance=${payload?.instance}`);

    if (!payload?.event || !payload?.instance) {
      return reply.status(200).send({ ok: true });
    }

    // Normalize event name: Evolution v2 sends MESSAGES_UPSERT or messages.upsert
    const eventNorm = payload.event?.toLowerCase().replace(/_/g, '.');

    // Handle different event types
    switch (eventNorm) {
      case 'messages.upsert':
        console.log(`[WhatsApp] messages.upsert fromMe=${payload.data?.key?.fromMe} jid=${payload.data?.key?.remoteJid} text=${JSON.stringify(payload.data?.message?.conversation)}`);
        await handleIncomingMessage(payload);
        break;

      case 'connection.update':
        await handleConnectionUpdate(payload);
        break;

      case 'qrcode.updated':
        console.log(`[WhatsApp] QR code updated for instance ${payload.instance}`);
        break;

      default:
        // Ignore other events
        break;
    }

    return reply.status(200).send({ ok: true });
  });

  /**
   * Create a new WhatsApp instance for a manager.
   * Called from the web dashboard settings.
   */
  fastify.post('/instance/create', async (request: FastifyRequest<{
    Body: { managerId: string };
  }>, reply: FastifyReply) => {
    const { managerId } = request.body;

    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      include: { managedRestaurants: { where: { status: 'ACTIVE' }, take: 1 } },
    });

    if (!manager || !manager.managedRestaurants[0]) {
      return reply.status(404).send({ error: 'Manager ou restaurant non trouvé' });
    }

    const restaurant = manager.managedRestaurants[0];
    const instanceName = `vraisavis-${restaurant.id}`;
    const webhookUrl = `${config.API_URL}/api/v1/whatsapp/webhook`;

    const result = await createWhatsAppInstance(instanceName, webhookUrl);

    if (!result) {
      return reply.status(500).send({ error: 'Erreur lors de la création de l\'instance WhatsApp' });
    }

    // Store instance name on the user record
    await prisma.user.update({
      where: { id: managerId },
      data: {
        whatsappNumber: instanceName, // Store instance name temporarily until paired
      },
    });

    return reply.send({
      instanceName,
      qrcode: result.qrcode,
    });
  });

  /**
   * Get QR code for an existing WhatsApp instance.
   */
  fastify.get('/instance/qrcode/:instanceName', async (request: FastifyRequest<{
    Params: { instanceName: string };
  }>, reply: FastifyReply) => {
    const { instanceName } = request.params;

    const qrcode = await getWhatsAppQRCode(instanceName);
    if (!qrcode) {
      return reply.status(404).send({ error: 'Instance non trouvée ou déjà connectée' });
    }

    return reply.send({ qrcode });
  });

  /**
   * Get connection state for an instance.
   */
  fastify.get('/instance/state/:instanceName', async (request: FastifyRequest<{
    Params: { instanceName: string };
  }>, reply: FastifyReply) => {
    const { instanceName } = request.params;

    const state = await getWhatsAppConnectionState(instanceName);
    return reply.send({ state: state || 'unknown' });
  });

  /**
   * Delete a WhatsApp instance.
   */
  fastify.delete('/instance/:instanceName', async (request: FastifyRequest<{
    Params: { instanceName: string };
  }>, reply: FastifyReply) => {
    const { instanceName } = request.params;

    const success = await deleteWhatsAppInstance(instanceName);

    if (success) {
      // Clear WhatsApp data from any user linked to this instance
      await prisma.user.updateMany({
        where: { whatsappNumber: instanceName },
        data: {
          whatsappNumber: null,
          whatsappVerified: false,
        },
      });
    }

    return reply.send({ success });
  });

  /**
   * Link WhatsApp: generate a link code (similar to Telegram flow).
   * Manager scans QR, then sends the code via WhatsApp to confirm.
   */
  fastify.get('/link-code/:managerId', async (request: FastifyRequest<{
    Params: { managerId: string };
  }>, reply: FastifyReply) => {
    const { managerId } = request.params;

    const code = `walink_${managerId}_${Date.now().toString(36)}`;

    await prisma.messagingVerification.create({
      data: {
        managerId,
        phoneNumber: 'whatsapp-link',
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    });

    return reply.send({ code });
  });
}

/**
 * Handle incoming WhatsApp messages.
 */
async function handleIncomingMessage(payload: EvoWebhookPayload) {
  const { data, instance } = payload;

  // Skip messages from ourselves
  if (data.key?.fromMe) return;

  // Dedupe (Evolution can emit duplicates during sync)
  if (!shouldProcessMessage(instance, data.key?.id)) return;

  const text = extractText(data);
  if (!text) return;

  const remoteJid = data.key?.remoteJid;
  if (!remoteJid || remoteJid.includes('@g.us')) return; // Ignore group messages

  const firstName = data.pushName || '';

  // Resolve @lid JID using senderPn (official field from Evolution/Baileys)
  // senderPn contains the real phone number when WhatsApp sends a @lid JID
  let sendTo: string;
  if (remoteJid.endsWith('@lid')) {
    const senderPn = data.key?.senderPn || data.senderPn;
    if (senderPn) {
      sendTo = `${senderPn}@s.whatsapp.net`;
      console.log(`[WhatsApp] @lid resolved via senderPn: ${remoteJid} → ${sendTo}`);
    } else {
      // No senderPn available — store @lid and ask user to add bot to contacts
      sendTo = remoteJid;
      console.log(`[WhatsApp] @lid with no senderPn: ${remoteJid} — asking user to add contact`);
    }
  } else {
    sendTo = remoteJid;
  }

  // Extract plain number for DB lookups (strip @domain)
  const phone = sendTo.replace(/@.*$/, '');
  console.log(`[WhatsApp] sendTo=${sendTo} phone=${phone} text="${text}"`);

  // Handle link command
  if (text.startsWith('walink_')) {
    // If @lid with no senderPn, we can't store a usable number — ask to add contact
    if (remoteJid.endsWith('@lid') && sendTo === remoteJid) {
      await sendWhatsAppMessage(
        remoteJid,
        `⚠️ Pour lier votre compte, veuillez d'abord **ajouter ce numéro à vos contacts WhatsApp**, puis renvoyez le code de liaison.`,
        instance,
      );
      return;
    }
    await handleLinkAccount(sendTo, text.trim(), firstName, instance);
    return;
  }

  // If @lid with no senderPn and not a link command, try finding by @lid stored or ask to add contact
  const manager = await findManagerByWhatsApp(sendTo);

  // Handle /start or "Bonjour" as intro
  if (text === '/start' || text.toLowerCase() === 'bonjour' || text.toLowerCase() === 'start') {
    if (manager) {
      const restaurantName = manager.managedRestaurants[0]?.name || 'votre restaurant';
      await sendWhatsAppMessage(
        sendTo,
        `👋 Bonjour ${manager.name} !\n\nJe suis votre assistant IA pour *${restaurantName}*.\n\nVous pouvez me demander :\n• 📊 Les avis du jour/semaine/mois\n• 🎁 Gérer vos lots (lister, ajouter, supprimer)\n• 📈 Les statistiques\n\nEssayez par exemple : "Quels sont les avis du jour ?"`,
        instance,
      );
    } else {
      await sendWhatsAppMessage(
        sendTo,
        `👋 Bienvenue sur VraisAvis !\n\nPour lier ce WhatsApp à votre compte, allez dans votre tableau de bord → Paramètres → Messagerie, puis cliquez sur "Lier WhatsApp" et envoyez le code ici.`,
        instance,
      );
    }
    return;
  }

  // Handle /help
  if (text === '/help' || text.toLowerCase() === 'aide') {
    await sendWhatsAppMessage(
      sendTo,
      `🤖 *Commandes disponibles :*\n\n• "Avis du jour" — Voir les avis d'aujourd'hui\n• "Avis de la semaine" — Voir les avis de la semaine\n• "Mes lots" — Lister les lots de la machine à sous\n• "Stats" — Statistiques générales\n• "Ajouter un lot [nom]" — Ajouter un nouveau lot\n• "Supprimer le lot [nom]" — Désactiver un lot\n\nOu posez n'importe quelle question en langage naturel !`,
      instance,
    );
    return;
  }

  // Regular message → AI agent
  if (!manager) {
    await sendWhatsAppMessage(
      sendTo,
      `❌ Ce numéro n'est pas lié à un compte VraisAvis.\n\nAllez dans votre tableau de bord → Paramètres → Messagerie pour lier votre WhatsApp.`,
      instance,
    );
    return;
  }

  const restaurant = manager.managedRestaurants[0];
  if (!restaurant) {
    await sendWhatsAppMessage(sendTo, '❌ Aucun restaurant actif trouvé sur votre compte.', instance);
    return;
  }

  // Show typing indicator
  await sendWhatsAppTypingAction(sendTo, instance);

  // Process through AI agent
  try {
    const response = await processAgentMessage(
      manager.id,
      restaurant.id,
      text,
      'WHATSAPP',
    );

    await sendWhatsAppMessage(sendTo, response, instance);
  } catch (err) {
    console.error('[WhatsApp] Agent processing error:', err);
    await sendWhatsAppMessage(
      sendTo,
      '❌ Désolé, le service est momentanément indisponible. Réessayez dans quelques minutes.',
      instance,
    );
  }
}

/**
 * Handle WhatsApp link account flow.
 */
async function handleLinkAccount(
  phone: string,
  linkCode: string,
  firstName: string,
  instanceName: string,
) {
  const verification = await prisma.messagingVerification.findFirst({
    where: {
      code: linkCode,
      phoneNumber: 'whatsapp-link',
      verified: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!verification) {
    await sendWhatsAppMessage(
      phone,
      '❌ Code de liaison invalide ou expiré. Veuillez en générer un nouveau depuis votre tableau de bord.',
      instanceName,
    );
    return;
  }

  // Store resolved phone number
  await prisma.user.update({
    where: { id: verification.managerId },
    data: {
      whatsappNumber: phone,
      whatsappVerified: true,
      preferredMessaging: 'WHATSAPP',
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

  await sendWhatsAppMessage(
    phone,
    `✅ Compte lié avec succès !\n\n👋 Bonjour ${firstName || manager?.name || ''} ! Je suis votre assistant IA pour *${restaurantName}*.\n\nDemandez-moi par exemple :\n• "Quels sont les avis du jour ?"\n• "Mes lots"\n• "Stats de la semaine"`,
    instanceName,
  );
}

/**
 * Handle connection state changes.
 */
async function handleConnectionUpdate(payload: EvoWebhookPayload) {
  const { instance, data } = payload;
  const state = data.state;

  console.log(`[WhatsApp] Connection update for ${instance}: ${state}`);

  if (state === 'open') {
    // Instance connected — update any user linked to this instance
    console.log(`[WhatsApp] Instance ${instance} is now connected`);
  } else if (state === 'close') {
    console.log(`[WhatsApp] Instance ${instance} disconnected`);
  }
}
