import { prisma } from '../../lib/prisma.js';
import { sendTelegramMessage } from './telegram.js';
import { sendWhatsAppMessage } from './whatsapp.js';

/**
 * Send a message to a manager via their preferred messaging provider.
 * Falls back to any available provider if preferred is not configured.
 */
export async function sendMessageToManager(
  managerId: string,
  text: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: managerId },
    select: {
      preferredMessaging: true,
      telegramChatId: true,
      whatsappNumber: true,
      whatsappVerified: true,
      messagingOptIn: true,
    },
  });

  if (!user || !user.messagingOptIn) return false;

  // Try preferred provider first
  if (user.preferredMessaging === 'TELEGRAM' && user.telegramChatId) {
    return sendTelegramMessage(user.telegramChatId, text);
  }

  if (user.preferredMessaging === 'WHATSAPP' && user.whatsappNumber && user.whatsappVerified) {
    return sendWhatsAppMessage(user.whatsappNumber, text);
  }

  // Fallback: try any available provider
  if (user.telegramChatId) {
    return sendTelegramMessage(user.telegramChatId, text);
  }

  if (user.whatsappNumber && user.whatsappVerified) {
    return sendWhatsAppMessage(user.whatsappNumber, text);
  }

  return false;
}

/**
 * Identify a manager from a Telegram chat ID.
 */
export async function findManagerByTelegramChatId(chatId: string) {
  return prisma.user.findUnique({
    where: { telegramChatId: chatId },
    include: {
      managedRestaurants: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  });
}

/**
 * Identify a manager from a WhatsApp phone number.
 */
export async function findManagerByWhatsApp(phoneNumber: string) {
  return prisma.user.findFirst({
    where: {
      whatsappNumber: phoneNumber,
      whatsappVerified: true,
    },
    include: {
      managedRestaurants: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  });
}

/**
 * Get or create a messaging session for a manager+restaurant+provider combo.
 */
export async function getOrCreateSession(
  managerId: string,
  restaurantId: string,
  provider: 'TELEGRAM' | 'WHATSAPP' | 'WEB',
) {
  const existing = await prisma.messagingSession.findUnique({
    where: {
      managerId_restaurantId_provider: {
        managerId,
        restaurantId,
        provider,
      },
    },
  });

  if (existing) return existing;

  return prisma.messagingSession.create({
    data: {
      managerId,
      restaurantId,
      provider,
      conversationHistory: [],
    },
  });
}

/**
 * Append messages to a session's conversation history.
 * Keeps only the last 20 messages to avoid bloat.
 */
export async function appendToSession(
  sessionId: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>,
) {
  const session = await prisma.messagingSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) return null;

  const history = Array.isArray(session.conversationHistory) ? session.conversationHistory : [];
  const updated = [...history, ...messages].slice(-20); // Keep last 20

  return prisma.messagingSession.update({
    where: { id: sessionId },
    data: {
      conversationHistory: JSON.parse(JSON.stringify(updated)),
      lastMessageAt: new Date(),
    },
  });
}
