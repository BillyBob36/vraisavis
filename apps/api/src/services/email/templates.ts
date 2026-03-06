import { sendEmail } from '../notifications/sender.js';
import { config } from '../../config/env.js';

const BRAND_COLOR = '#2563eb';
const BRAND_NAME = 'VraisAvis';
const DASHBOARD_URL = config.FRONTEND_URL || 'https://app.vraisavis.fr';

function wrap(content: string): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 0;">
      <div style="background: ${BRAND_COLOR}; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">🍽️ ${BRAND_NAME}</h1>
      </div>
      <div style="padding: 28px 24px; background: #fff; border: 1px solid #e5e7eb; border-top: none;">
        ${content}
      </div>
      <div style="padding: 16px 24px; background: #f9fafb; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">
          ${BRAND_NAME} — La voix de vos clients, en temps réel.<br/>
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    </div>
  `;
}

function btn(url: string, label: string): string {
  return `<a href="${url}" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">${label}</a>`;
}

// ─── WELCOME ────────────────────────────────────────────────
export async function sendWelcomeEmail(email: string, name: string, restaurantName: string, trialDays: number): Promise<boolean> {
  const html = wrap(`
    <h2 style="color: #111; margin: 0 0 16px;">Bienvenue ${name} !</h2>
    <p style="color: #374151; line-height: 1.6;">
      Votre restaurant <strong>${restaurantName}</strong> est maintenant actif sur ${BRAND_NAME}.
    </p>
    <p style="color: #374151; line-height: 1.6;">
      Vous bénéficiez d'un <strong>essai gratuit de ${trialDays} jours</strong>. Pendant cette période, profitez de toutes les fonctionnalités :
    </p>
    <ul style="color: #374151; line-height: 1.8; padding-left: 20px;">
      <li>Collecte d'avis clients en temps réel</li>
      <li>Analyse IA de vos retours</li>
      <li>Assistant IA personnel (WhatsApp/Telegram)</li>
      <li>Bilans quotidiens automatiques</li>
      <li>Jeu de fidélisation (machine à sous)</li>
    </ul>
    <div style="text-align: center; margin: 24px 0;">
      ${btn(`${DASHBOARD_URL}/login`, 'Accéder à mon tableau de bord')}
    </div>
    <p style="color: #6b7280; font-size: 13px;">
      Une question ? Répondez simplement à votre assistant IA sur WhatsApp ou Telegram.
    </p>
  `);

  return sendEmail(email, `Bienvenue sur ${BRAND_NAME}, ${name} !`, html);
}

// ─── TRIAL ENDING 24h (all subscribers) ─────────────────────
export async function sendTrialEnding24hEmail(email: string, name: string, restaurantName: string, isPromo: boolean): Promise<boolean> {
  const subject = `⏰ Votre essai gratuit se termine demain — ${restaurantName}`;

  const promoBlock = isPromo ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 13px;">
        <strong>Envie de continuer ?</strong> Passez à l'offre payante pour garder toutes vos fonctionnalités actives et ne perdre aucune donnée.
      </p>
    </div>
    <div style="background: #eff6ff; border-left: 4px solid ${BRAND_COLOR}; padding: 14px 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af; font-size: 13px;">
        <strong>💼 Devenez apporteur d'affaires !</strong><br/>
        En devenant client ${BRAND_NAME}, vous pouvez aussi recommander notre solution à d'autres restaurateurs et <strong>générer des revenus passifs complémentaires</strong> grâce à notre programme d'affiliation.
      </p>
    </div>
  ` : `
    <p style="color: #374151; line-height: 1.6;">
      Conformément à la réglementation, nous vous informons que votre période d'essai se termine <strong>demain</strong>.
      Votre abonnement passera alors automatiquement en mode payant. Vous pouvez résilier à tout moment depuis votre tableau de bord si vous ne souhaitez pas continuer.
    </p>
  `;

  const html = wrap(`
    <h2 style="color: #111; margin: 0 0 16px;">Bonjour ${name},</h2>
    <p style="color: #374151; line-height: 1.6;">
      L'essai gratuit de <strong>${restaurantName}</strong> se termine <strong>demain</strong>.
    </p>
    ${promoBlock}
    <div style="text-align: center; margin: 24px 0;">
      ${btn(`${DASHBOARD_URL}/manager/settings`, 'Gérer mon abonnement')}
    </div>
  `);

  return sendEmail(email, subject, html);
}

// ─── TRIAL ENDING 48h (promo only) ─────────────────────────
export async function sendTrialEnding48hEmail(email: string, name: string, restaurantName: string): Promise<boolean> {
  const html = wrap(`
    <h2 style="color: #111; margin: 0 0 16px;">Bonjour ${name},</h2>
    <p style="color: #374151; line-height: 1.6;">
      Votre essai gratuit de <strong>${restaurantName}</strong> se termine dans <strong>48 heures</strong>.
    </p>
    <p style="color: #374151; line-height: 1.6;">
      Nous espérons que ${BRAND_NAME} vous a convaincu ! Voici ce que vous perdriez en ne passant pas à l'offre payante :
    </p>
    <ul style="color: #374151; line-height: 1.8; padding-left: 20px;">
      <li>Vos données d'avis et analyses IA</li>
      <li>Votre assistant personnel WhatsApp/Telegram</li>
      <li>Vos bilans automatiques</li>
    </ul>
    <div style="background: #eff6ff; border-left: 4px solid ${BRAND_COLOR}; padding: 14px 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af; font-size: 13px;">
        <strong>💼 Bonus :</strong> En devenant client, vous devenez aussi éligible à notre <strong>programme d'apporteur d'affaires</strong>.
        Recommandez ${BRAND_NAME} et gagnez des revenus passifs sur chaque nouveau restaurant inscrit grâce à vous !
      </p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      ${btn(`${DASHBOARD_URL}/manager/settings`, 'Passer à l\'offre payante')}
    </div>
  `);

  return sendEmail(email, `⏰ Plus que 48h d'essai gratuit — ${restaurantName}`, html);
}

// ─── PAID PERIOD STARTED ────────────────────────────────────
export async function sendPaidPeriodStartedEmail(email: string, name: string, restaurantName: string): Promise<boolean> {
  const html = wrap(`
    <h2 style="color: #111; margin: 0 0 16px;">Bonjour ${name},</h2>
    <p style="color: #374151; line-height: 1.6;">
      Votre essai gratuit est terminé. L'abonnement payant de <strong>${restaurantName}</strong> est maintenant <strong>actif</strong>.
    </p>
    <p style="color: #374151; line-height: 1.6;">
      Votre carte bancaire sera débitée selon votre formule d'abonnement. Vous pouvez consulter vos factures et gérer votre abonnement à tout moment.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      ${btn(`${DASHBOARD_URL}/manager/settings`, 'Gérer mon abonnement')}
    </div>
    <p style="color: #6b7280; font-size: 13px;">
      Merci pour votre confiance ! Toute l'équipe ${BRAND_NAME} est à votre service.
    </p>
  `);

  return sendEmail(email, `✅ Votre abonnement ${BRAND_NAME} est actif — ${restaurantName}`, html);
}

// ─── PASSWORD RESET ─────────────────────────────────────────
export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string): Promise<boolean> {
  const html = wrap(`
    <h2 style="color: #111; margin: 0 0 16px;">Réinitialisation du mot de passe</h2>
    <p style="color: #374151; line-height: 1.6;">
      Bonjour ${name},
    </p>
    <p style="color: #374151; line-height: 1.6;">
      Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
    </p>
    <div style="text-align: center; margin: 24px 0;">
      ${btn(resetUrl, 'Réinitialiser mon mot de passe')}
    </div>
    <p style="color: #6b7280; font-size: 13px;">
      Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
    </p>
    <p style="color: #9ca3af; font-size: 12px; word-break: break-all;">
      Lien direct : ${resetUrl}
    </p>
  `);

  return sendEmail(email, `Réinitialisation de votre mot de passe ${BRAND_NAME}`, html);
}
