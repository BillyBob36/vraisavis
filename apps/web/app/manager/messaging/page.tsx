'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface MessagingSettings {
  phone: string | null;
  preferredMessaging: 'TELEGRAM' | 'WHATSAPP' | null;
  telegramLinked: boolean;
  whatsappNumber: string | null;
  whatsappVerified: boolean;
  messagingOptIn: boolean;
}

export default function MessagingPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<MessagingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messagerie & Assistant IA</h1>
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
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">Recevoir les bilans quotidiens</p>
            <p className="text-sm text-gray-500">Résumé des avis envoyé chaque soir à 22h</p>
          </div>
          <button
            onClick={() => saveSettings({ messagingOptIn: !settings?.messagingOptIn })}
            disabled={saving}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings?.messagingOptIn ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings?.messagingOptIn ? 'translate-x-6' : ''
            }`} />
          </button>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
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
            <p className="text-xs text-gray-500 mt-1">Bientôt disponible</p>
            {settings?.whatsappVerified && (
              <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                ✓ Vérifié
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Telegram Setup */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
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
