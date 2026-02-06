import { config } from '../../config/env.js';
import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getEmailTransporter() {
  if (!transporter && config.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const transport = getEmailTransporter();
  if (!transport) {
    console.warn('SMTP not configured, skipping email to', to);
    return false;
  }

  try {
    await transport.sendMail({
      from: `VraisAvis <${config.FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('Email send error:', err);
    return false;
  }
}

export async function sendSMS(
  to: string,
  body: string,
): Promise<boolean> {
  if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN || !config.TWILIO_PHONE_NUMBER) {
    console.warn('Twilio not configured, skipping SMS to', to);
    return false;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`).toString('base64');

    const params = new URLSearchParams({
      To: to,
      From: config.TWILIO_PHONE_NUMBER,
      Body: body,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Twilio SMS error:', res.status, errorText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('SMS send error:', err);
    return false;
  }
}

export async function notifyClient(
  restaurantName: string,
  improvement: string,
  contactEmail: string | null,
  contactPhone: string | null,
): Promise<{ emailSent: boolean; smsSent: boolean }> {
  const result = { emailSent: false, smsSent: false };

  const smsText = `${restaurantName} : Suite à vos remarques, nous avons apporté une amélioration — ${improvement}. Merci pour votre retour ! — VraisAvis`;

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

  if (contactPhone) {
    result.smsSent = await sendSMS(contactPhone, smsText);
  }

  return result;
}
