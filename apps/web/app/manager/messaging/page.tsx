'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface MessagingSettings {
  phone: string | null;
  preferredMessaging: 'TELEGRAM' | 'WHATSAPP' | null;
  telegramLinked: boolean;
  whatsappNumber: string | null;
  whatsappVerified: boolean;
  messagingOptIn: boolean;
  summaryHour: number;
}

export default function MessagingPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<MessagingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [whatsappCode, setWhatsappCode] = useState<string | null>(null);
  const [botPhone, setBotPhone] = useState<string | null>(null);
  const [waMode, setWaMode] = useState<'choice' | 'mobile' | 'desktop'>('choice');
  const [waLinkLoading, setWaLinkLoading] = useState(false);
  const [waUnlinkLoading, setWaUnlinkLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }

    try {
      const res = await fetch(`${API_URL}/api/v1/manager/messaging`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching messaging settings:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Poll WhatsApp link status while code is displayed
  useEffect(() => {
    if (!whatsappCode) return;
    const token = getToken();
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/manager/messaging/whatsapp-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.linked) {
          clearInterval(interval);
          setWhatsappCode(null);
          await fetchSettings();
          setMessage({ type: 'success', text: '✅ WhatsApp lié avec succès !' });
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [whatsappCode, fetchSettings]);

  const saveSettings = async (updates: Partial<MessagingSettings>) => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/v1/manager/messaging`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Paramètres sauvegardés' });
        await fetchSettings();
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    } finally {
      setSaving(false);
    }
  };

  const generateTelegramLink = async () => {
    const token = getToken();
    if (!token) return;
    setLinkLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/manager/messaging/telegram-link`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTelegramLink(data.botLink);
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la génération du lien' });
    } finally {
      setLinkLoading(false);
    }
  };

  const unlinkTelegram = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/manager/messaging/telegram`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Telegram délié' });
        setTelegramLink(null);
        await fetchSettings();
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la déconnexion' });
    }
  };

  const generateWhatsappCode = async () => {
    const token = getToken();
    if (!token) {
      setMessage({ type: 'error', text: 'Session expirée, veuillez vous reconnecter' });
      return;
    }
    setWaLinkLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/manager/messaging/whatsapp-link`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setWhatsappCode(data.code);
        if (data.botPhone) setBotPhone(data.botPhone);
        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        setWaMode(isMobile ? 'mobile' : 'desktop');
      } else {
        const err = await res.text();
        setMessage({ type: 'error', text: `Erreur serveur (${res.status}): ${err}` });
      }
    } catch (e) {
      setMessage({ type: 'error', text: `Erreur réseau: ${String(e)}` });
    } finally {
      setWaLinkLoading(false);
    }
  };

  const unlinkWhatsapp = async () => {
    const token = getToken();
    if (!token) return;
    setWaUnlinkLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/manager/messaging/whatsapp`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'WhatsApp délié' });
        setWhatsappCode(null);
        await fetchSettings();
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la déconnexion' });
    } finally {
      setWaUnlinkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Messagerie & Assistant IA</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configurez votre assistant IA pour gérer votre restaurant depuis Telegram ou WhatsApp.
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Opt-in */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800">Recevoir les bilans quotidiens</p>
            <p className="text-sm text-gray-500">Résumé des avis envoyé chaque soir</p>
          </div>
          <button
            onClick={() => saveSettings({ messagingOptIn: !settings?.messagingOptIn })}
            disabled={saving}
            className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${
              settings?.messagingOptIn ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings?.messagingOptIn ? 'translate-x-6' : ''
            }`} />
          </button>
        </div>
        {settings?.messagingOptIn && (
          <div className="flex items-center gap-3 pt-1">
            <label className="text-sm text-gray-600 shrink-0">Heure d&apos;envoi :</label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings?.summaryHour ?? 22}
              onChange={(e) => saveSettings({ summaryHour: parseInt(e.target.value) })}
              disabled={saving}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}h00</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Provider Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Canal de messagerie</h2>
        <p className="text-sm text-gray-500">Choisissez comment communiquer avec votre assistant.</p>

        <div className="grid grid-cols-2 gap-3">
          {/* Telegram */}
          <button
            onClick={() => saveSettings({ preferredMessaging: 'TELEGRAM' })}
            disabled={saving}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              settings?.preferredMessaging === 'TELEGRAM'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">✈️</div>
            <p className="font-semibold text-gray-900">Telegram</p>
            <p className="text-xs text-gray-500 mt-1">Gratuit, instantané</p>
            {settings?.telegramLinked && (
              <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                ✓ Lié
              </span>
            )}
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => saveSettings({ preferredMessaging: 'WHATSAPP' })}
            disabled={saving}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              settings?.preferredMessaging === 'WHATSAPP'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">💬</div>
            <p className="font-semibold text-gray-900">WhatsApp</p>
            <p className="text-xs text-gray-500 mt-1">Simple et rapide</p>
            {settings?.whatsappVerified && (
              <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                ✓ Lié
              </span>
            )}
          </button>
        </div>
      </div>

      {/* WhatsApp Setup */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Configuration WhatsApp</h2>

        {settings?.whatsappVerified ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <span className="text-green-600 text-lg">✅</span>
              <p className="text-sm font-medium text-green-800">
                Votre WhatsApp est lié{settings.whatsappNumber ? ` (${settings.whatsappNumber})` : ''}. Vous pouvez discuter avec votre assistant IA directement sur WhatsApp.
              </p>
            </div>
            <button
              onClick={unlinkWhatsapp}
              disabled={waUnlinkLoading}
              className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
            >
              {waUnlinkLoading ? 'Déconnexion...' : 'Délier mon WhatsApp'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Liez votre WhatsApp pour discuter avec votre assistant IA et recevoir les bilans quotidiens.
            </p>

            {whatsappCode ? (
              <div className="space-y-4">
                {/* Mode switcher */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setWaMode('mobile')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      waMode === 'mobile' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-xl mb-1">👆</div>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">J&apos;utilise actuellement le téléphone que je veux lier</p>
                    <p className="text-xs text-gray-500 mt-1">Ouvre WhatsApp directement avec le message prêt à envoyer</p>
                  </button>
                  <button
                    onClick={() => setWaMode('desktop')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      waMode === 'desktop' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-xl mb-1">🖥️</div>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">Je suis sur ordinateur</p>
                    <p className="text-xs text-gray-500 mt-1">QR code à scanner avec l’appareil photo du téléphone</p>
                  </button>
                </div>

                {/* Option A — lien direct */}
                {waMode === 'mobile' && (
                  <div className="space-y-3">
                    {botPhone ? (
                      <a
                        href={`https://wa.me/${botPhone}?text=${encodeURIComponent(whatsappCode)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                      >
                        <span>💬</span> Ouvrir WhatsApp et envoyer le code
                      </a>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700">Copiez ce code et envoyez-le au bot WhatsApp :</p>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                          <code className="flex-1 text-sm font-mono text-gray-800 break-all">{whatsappCode}</code>
                          <button
                            onClick={() => { navigator.clipboard.writeText(whatsappCode ?? ''); setMessage({ type: 'success', text: 'Code copié !' }); }}
                            className="shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >Copier</button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 text-center">Le message sera pré-rempli — il suffit d&apos;envoyer</p>
                  </div>
                )}

                {/* Option B — QR code */}
                {waMode === 'desktop' && (
                  <div className="flex flex-col items-center space-y-3">
                    {botPhone ? (
                      <>
                        <div className="p-3 bg-white rounded-xl border border-gray-200 inline-block">
                          <QRCodeSVG
                            value={`https://wa.me/${botPhone}?text=${encodeURIComponent(whatsappCode ?? '')}`}
                            size={192}
                            fgColor="#111827"
                            bgColor="#ffffff"
                          />
                        </div>
                        <div className="space-y-1 text-center">
                          <p className="text-sm text-gray-700 font-medium">
                            📸 Ouvrez l’<strong>appareil photo</strong> de votre téléphone et scannez ce QR
                          </p>
                          <p className="text-xs text-gray-500">
                            WhatsApp s’ouvrira automatiquement avec le message pré-rempli
                          </p>
                          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            <p className="text-xs text-amber-700">
                              ⚠️ Ne pas utiliser le scanner QR <em>dans</em> WhatsApp (Appareils connectés) — utiliser l’appareil photo normal du téléphone
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full space-y-2">
                        <p className="text-sm text-gray-700">Copiez ce code et envoyez-le au bot WhatsApp :</p>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                          <code className="flex-1 text-sm font-mono text-gray-800 break-all">{whatsappCode}</code>
                          <button
                            onClick={() => { navigator.clipboard.writeText(whatsappCode ?? ''); setMessage({ type: 'success', text: 'Code copié !' }); }}
                            className="shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >Copier</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-400 text-center">Ce code expire dans 10 minutes</p>
                <button
                  onClick={() => { setWhatsappCode(null); setBotPhone(null); setWaMode('choice'); }}
                  className="text-xs text-gray-400 hover:text-gray-600 block mx-auto"
                >
                  ← Recommencer
                </button>
              </div>
            ) : (
              <button
                onClick={generateWhatsappCode}
                disabled={waLinkLoading}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {waLinkLoading ? 'Génération...' : '💬 Lier mon WhatsApp'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Telegram Setup */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Configuration Telegram</h2>

        {settings?.telegramLinked ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <span className="text-green-600 text-lg">✅</span>
              <p className="text-sm font-medium text-green-800">
                Votre compte Telegram est lié. Vous pouvez discuter avec votre assistant IA directement sur Telegram.
              </p>
            </div>
            <button
              onClick={unlinkTelegram}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Délier mon compte Telegram
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Liez votre compte Telegram pour discuter avec votre assistant IA et recevoir les bilans quotidiens.
            </p>

            {telegramLink ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700 font-medium">
                  Cliquez sur le lien ci-dessous pour ouvrir Telegram et lier votre compte :
                </p>
                <a
                  href={telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
                >
                  ✈️ Ouvrir Telegram
                </a>
                <p className="text-xs text-gray-400 text-center">
                  Ce lien expire dans 10 minutes
                </p>
              </div>
            ) : (
              <button
                onClick={generateTelegramLink}
                disabled={linkLoading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {linkLoading ? 'Génération...' : '🔗 Lier mon Telegram'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* What can the AI do */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-indigo-900">Que peut faire votre assistant ?</h2>
        <ul className="space-y-2 text-sm text-indigo-800">
          <li className="flex items-start gap-2">
            <span className="mt-0.5">📊</span>
            <span><strong>Consulter les avis</strong> — &quot;Quels sont les avis du jour ?&quot;, &quot;Résumé de la semaine&quot;</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">🎁</span>
            <span><strong>Gérer les lots</strong> — &quot;Mes lots&quot;, &quot;Ajoute un café gratuit&quot;, &quot;Supprime le lot dessert&quot;</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">📈</span>
            <span><strong>Statistiques</strong> — &quot;Stats du mois&quot;, &quot;Combien de visiteurs aujourd&apos;hui ?&quot;</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">🔔</span>
            <span><strong>Bilans automatiques</strong> — Résumé envoyé chaque soir à 22h</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
