import { config } from '../../config/env.js';

// ============================================
// WhatsApp via Evolution API (self-hosted)
// ============================================

const EVOLUTION_API_URL = config.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = config.EVOLUTION_API_KEY;

function evoHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: EVOLUTION_API_KEY,
  };
}

/**
 * Send a text message via Evolution API.
 * @param instanceName - Evolution instance name (one per restaurant/manager)
 * @param to - WhatsApp number in international format (e.g. "33612345678")
 * @param text - Message text
 */
export async function sendWhatsAppMessage(
  to: string,
  text: string,
  instanceName?: string,
  quotedKey?: { remoteJid: string; id: string; fromMe: boolean },
): Promise<boolean> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return false;

  const instance = instanceName || config.WHATSAPP_DEFAULT_INSTANCE || 'vraisavis-default';

  // No delay for @lid JIDs — Evolution v2.3.7 may reject @lid with delay > 0
  const delay = to.endsWith('@lid') ? 0 : 1000;
  const body: Record<string, unknown> = { number: to, text, delay };

  // For @lid JIDs, pass quoted context so Baileys uses the existing Signal session
  if (quotedKey) {
    body.quoted = { key: quotedKey };
  }

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: evoHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('WhatsApp sendMessage error:', res.status, errText);
    }
    return res.ok;
  } catch (err) {
    console.error('WhatsApp sendMessage error:', err);
    return false;
  }
}

/**
 * Resolve a WhatsApp JID (including @lid) to a real phone number via Evolution API.
 * "@lid" JIDs cannot be used directly for sending — we need the real number.
 * Returns the stripped number (e.g. "306998120577") or the stripped JID as fallback.
 */
export async function resolveJidToPhone(
  jid: string,
  instanceName?: string,
): Promise<string> {
  // If it's already a plain @s.whatsapp.net JID, just strip the domain
  if (jid.includes('@s.whatsapp.net')) {
    return jid.replace(/@.*$/, '');
  }

  // For @lid or unknown formats, try to resolve via Evolution API
  const stripped = jid.replace(/@.*$/, '');
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return stripped;

  const instance = instanceName || config.WHATSAPP_DEFAULT_INSTANCE || 'vraisavis-bot';

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/chat/whatsappNumbers/${instance}`, {
      method: 'POST',
      headers: evoHeaders(),
      body: JSON.stringify({ numbers: [stripped] }),
    });
    if (!res.ok) return stripped;

    const data = await res.json() as Array<{ exists?: boolean; jid?: string; number?: string }>;
    const found = data.find((d) => d.exists && d.number);
    if (found?.number) {
      console.log(`[WhatsApp] Resolved @lid ${jid} → ${found.number}`);
      return found.number;
    }
  } catch (err) {
    console.error('[WhatsApp] resolveJidToPhone error:', err);
  }

  return stripped;
}

/**
 * Send typing indicator (composing) via Evolution API.
 */
export async function sendWhatsAppTypingAction(
  to: string,
  instanceName?: string,
): Promise<void> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return;

  const instance = instanceName || config.WHATSAPP_DEFAULT_INSTANCE || 'vraisavis-default';

  try {
    await fetch(`${EVOLUTION_API_URL}/chat/updatePresence/${instance}`, {
      method: 'POST',
      headers: evoHeaders(),
      body: JSON.stringify({ number: to, presence: 'composing' }),
    });
  } catch {
    // ignore
  }
}

/**
 * Create a new Evolution API instance for a restaurant.
 */
export async function createWhatsAppInstance(
  instanceName: string,
  webhookUrl?: string,
): Promise<{ instanceName: string; qrcode?: { base64?: string; code?: string } } | null> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return null;

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: evoHeaders(),
      body: JSON.stringify({
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
        webhook: webhookUrl
          ? {
              url: webhookUrl,
              byEvents: false,
              base64: true,
              events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
            }
          : undefined,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('WhatsApp createInstance error:', res.status, errText);
      return null;
    }
    return res.json() as Promise<{ instanceName: string; qrcode?: { base64?: string; code?: string } }>;
  } catch (err) {
    console.error('WhatsApp createInstance error:', err);
    return null;
  }
}

/**
 * Get QR code to connect a WhatsApp instance.
 */
export async function getWhatsAppQRCode(
  instanceName: string,
): Promise<{ base64?: string; code?: string } | null> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return null;

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: evoHeaders(),
    });
    if (!res.ok) return null;
    return res.json() as Promise<{ base64?: string; code?: string }>;
  } catch {
    return null;
  }
}

/**
 * Get the connection state of an instance.
 */
export async function getWhatsAppConnectionState(
  instanceName: string,
): Promise<'open' | 'close' | 'connecting' | null> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return null;

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: evoHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json() as { instance: string; state: string };
    return data.state as 'open' | 'close' | 'connecting';
  } catch {
    return null;
  }
}

/**
 * Delete an Evolution API instance.
 */
export async function deleteWhatsAppInstance(instanceName: string): Promise<boolean> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return false;

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: evoHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Get the phone number of the default bot instance.
 * Returns e.g. "33699812057" from ownerJid "33699812057@s.whatsapp.net"
 */
export async function getBotPhoneNumber(): Promise<string | null> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return null;

  const preferredInstance = config.WHATSAPP_DEFAULT_INSTANCE || 'vraisavis-bot';

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: evoHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json() as Array<{ name?: string; ownerJid?: string; connectionStatus?: string }>;

    // First try the configured instance name
    let found = data.find((i) => i.name === preferredInstance && i.ownerJid);
    // Fallback: any open/connected instance with an ownerJid
    if (!found) {
      found = data.find((i) => i.ownerJid && (i.connectionStatus === 'open' || i.connectionStatus === 'connected'));
    }

    if (!found?.ownerJid) return null;
    return found.ownerJid.replace(/@.*$/, '');
  } catch {
    return null;
  }
}

/**
 * Check if a phone number is on WhatsApp.
 */
export async function isOnWhatsApp(
  number: string,
  instanceName?: string,
): Promise<boolean> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return false;

  const instance = instanceName || config.WHATSAPP_DEFAULT_INSTANCE || 'vraisavis-default';

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/chat/whatsappNumbers/${instance}`, {
      method: 'POST',
      headers: evoHeaders(),
      body: JSON.stringify({ numbers: [number] }),
    });
    if (!res.ok) return false;
    const data = await res.json() as Array<{ exists: boolean }>;
    return data?.[0]?.exists ?? false;
  } catch {
    return false;
  }
}
