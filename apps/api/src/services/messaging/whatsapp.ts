import { config } from '../../config/env.js';

const WHATSAPP_API = `https://graph.facebook.com/v18.0/${config.WHATSAPP_PHONE_NUMBER_ID}`;

export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  if (!config.WHATSAPP_TOKEN) return false;
  
  try {
    const res = await fetch(`${WHATSAPP_API}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('WhatsApp sendMessage error:', err);
    return false;
  }
}

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string = 'fr',
  parameters: string[] = [],
): Promise<boolean> {
  if (!config.WHATSAPP_TOKEN) return false;

  try {
    const components = parameters.length > 0
      ? [{
          type: 'body',
          parameters: parameters.map(p => ({ type: 'text', text: p })),
        }]
      : [];

    const res = await fetch(`${WHATSAPP_API}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('WhatsApp sendTemplate error:', err);
    return false;
  }
}
