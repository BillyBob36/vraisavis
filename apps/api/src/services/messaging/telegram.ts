import { config } from '../../config/env.js';

const TELEGRAM_API = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}`;

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export async function sendTelegramMessage(chatId: string | number, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('Telegram sendMessage error:', err);
    return false;
  }
}

export async function setTelegramWebhook(webhookUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: config.TELEGRAM_WEBHOOK_SECRET,
        allowed_updates: ['message'],
      }),
    });
    const data = await res.json() as { ok: boolean };
    return data.ok;
  } catch (err) {
    console.error('Telegram setWebhook error:', err);
    return false;
  }
}

export async function sendTelegramTypingAction(chatId: string | number): Promise<void> {
  try {
    await fetch(`${TELEGRAM_API}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
    });
  } catch {
    // ignore
  }
}
