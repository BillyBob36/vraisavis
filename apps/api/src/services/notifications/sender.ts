import { Resend } from 'resend';
import { config } from '../../config/env.js';

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!resendClient && config.RESEND_API_KEY) {
    resendClient = new Resend(config.RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Send email via Resend.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('📧 Resend not configured, skipping email to', to);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: config.FROM_EMAIL,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('📧 Resend error:', error);
      return false;
    }

    console.log(`📧 Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error('📧 Email send error:', err);
    return false;
  }
}

/**
 * Send WhatsApp message via Evolution API (replaces SMS/Twilio).
 * Phone should be in international format (e.g. 33612345678 or +33612345678).
 */
export async function sendWhatsApp(
  phone: string,
  text: string,
): Promise<boolean> {
  if (!config.EVOLUTION_API_URL || !config.EVOLUTION_API_KEY) {
    console.warn('📱 Evolution API not configured, skipping WhatsApp to', phone);
    return false;
  }

  try {
    // Normalize phone to JID format
    const cleaned = phone.replace(/[^0-9]/g, '');
    const jid = `${cleaned}@s.whatsapp.net`;

    const instanceName = 'vraisavis-bot';
    const url = `${config.EVOLUTION_API_URL}/message/sendText/${instanceName}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: jid,
        text,
        delay: 0,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('📱 WhatsApp send error:', res.status, errorText);
      return false;
    }

    console.log(`📱 WhatsApp sent to ${cleaned}`);
    return true;
  } catch (err) {
    console.error('📱 WhatsApp send error:', err);
    return false;
  }
}

/**
 * Notify a client about a restaurant improvement.
 * Uses email (Resend) and/or WhatsApp (Evolution API).
 */
export async function notifyClient(
  restaurantName: string,
  improvement: string,
  contactEmail: string | null,
  contactWhatsApp: string | null,
): Promise<{ emailSent: boolean; whatsappSent: boolean }> {
  const result = { emailSent: false, whatsappSent: false };

  const whatsappText = `🍽️ *${restaurantName}*\n\nSuite à vos remarques, le restaurant a apporté une amélioration :\n\n✅ _${improvement}_\n\nMerci pour votre retour constructif, il a été entendu !\n\n— VraisAvis`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">🍽️ ${restaurantName}</h2>
      <p>Bonjour,</p>
      <p>Suite à vos remarques, le restaurant a apporté une amélioration :</p>
      <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <strong>${improvement}</strong>
      </div>
      <p>Merci pour votre retour constructif, il a été entendu !</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">
        Ce message est envoyé automatiquement par VraisAvis car vous avez souhaité être informé(e) des améliorations.
        Vos coordonnées restent anonymes et ne sont pas partagées avec le restaurateur.
      </p>
    </div>
  `;

  if (contactEmail) {
    result.emailSent = await sendEmail(
      contactEmail,
      `${restaurantName} a pris en compte vos remarques`,
      emailHtml,
    );
  }

  if (contactWhatsApp) {
    result.whatsappSent = await sendWhatsApp(contactWhatsApp, whatsappText);
  }

  return result;
}
