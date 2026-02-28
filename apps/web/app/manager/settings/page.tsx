'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiFetch, getToken } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Save, Bot, Loader2, Search, MapPin, X } from 'lucide-react';

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

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  welcomeMessage: string | null;
  thankYouMessage: string | null;
  clientTemplate: string;
  googleReviewUrl: string | null;
  geoRadius: number;
  serviceHours: {
    lunch: { start: string; end: string };
    dinner: { start: string; end: string };
  };
}

interface GooglePlaceResult {
  placeId: string;
  name: string;
  address: string;
  googleReviewUrl: string;
}

function GooglePlacesCard({ googleReviewUrl, onSelect, onClear }: { googleReviewUrl: string | null; onSelect: (url: string) => void; onClear: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GooglePlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pastedUrl, setPastedUrl] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [resolvedPlace, setResolvedPlace] = useState<{ name: string; address: string; googleReviewUrl: string } | null>(null);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await apiFetch(`/api/v1/manager/google-places/search?query=${encodeURIComponent(q)}`) as { results: GooglePlaceResult[] };
        setResults(data.results);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const handleSelect = (place: GooglePlaceResult) => {
    onSelect(place.googleReviewUrl);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const handlePasteUrl = async (url: string) => {
    setPastedUrl(url);
    setResolveError('');
    setResolvedPlace(null);

    if (!url || (!url.includes('maps.app.goo.gl') && !url.includes('google.com/maps') && !url.includes('goo.gl/maps'))) {
      if (url.length > 5) setResolveError('Collez un lien Google Maps (ex: https://maps.app.goo.gl/...)');
      return;
    }

    setResolving(true);
    try {
      const data = await apiFetch('/api/v1/manager/google-places/resolve-url', {
        method: 'POST',
        body: JSON.stringify({ url }),
      }) as { name: string; address: string; googleReviewUrl: string };
      setResolvedPlace(data);
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : 'Impossible de résoudre cette URL');
    } finally {
      setResolving(false);
    }
  };

  const isInvalidExisting = googleReviewUrl && !googleReviewUrl.includes('search.google.com/local/writereview?placeid=');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avis Google</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {googleReviewUrl && !isInvalidExisting ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <MapPin className="h-5 w-5 text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-800">Restaurant Google lié</p>
                <p className="text-xs text-green-600 truncate">{googleReviewUrl}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClear} className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Les clients ayant donné 5/5 positif et ≤1/5 négatif seront invités à laisser un avis Google.
              Leur commentaire sera copié automatiquement dans le presse-papier.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {isInvalidExisting && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-orange-800">⚠️ Lien actuel invalide</p>
                <p className="text-xs text-orange-600">Le lien actuel ({googleReviewUrl}) ne redirige pas vers le formulaire d&apos;avis Google. Utilisez une des méthodes ci-dessous pour le corriger.</p>
              </div>
            )}

            {/* Method 1: Paste Google Maps URL */}
            <div className="space-y-2">
              <Label htmlFor="googleMapsUrl">Collez un lien Google Maps</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="googleMapsUrl"
                  value={pastedUrl}
                  onChange={(e) => handlePasteUrl(e.target.value)}
                  placeholder="https://maps.app.goo.gl/... ou https://google.com/maps/..."
                  className="pl-9"
                />
                {resolving && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {resolveError && <p className="text-xs text-red-500">{resolveError}</p>}
              {resolvedPlace && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-blue-800">{resolvedPlace.name}</p>
                  <p className="text-xs text-blue-600">{resolvedPlace.address}</p>
                  <Button size="sm" onClick={() => onSelect(resolvedPlace.googleReviewUrl)} className="mt-1">
                    Utiliser ce restaurant
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Ouvrez Google Maps, cherchez votre restaurant, cliquez &quot;Partager&quot; et collez le lien ici.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Method 2: Search by name */}
            <div className="relative space-y-2">
              <Label htmlFor="googlePlacesSearch">Rechercher par nom</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="googlePlacesSearch"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Tapez le nom de votre restaurant..."
                  className="pl-9"
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {results.map((place) => (
                    <button
                      key={place.placeId}
                      type="button"
                      onClick={() => handleSelect(place)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b last:border-b-0"
                    >
                      <p className="text-sm font-semibold text-gray-900">{place.name}</p>
                      <p className="text-xs text-gray-500">{place.address}</p>
                    </button>
                  ))}
                </div>
              )}
              {showResults && results.length === 0 && !searching && query.length >= 3 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Aucun restaurant trouvé</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Messaging state
  const [msgSettings, setMsgSettings] = useState<MessagingSettings | null>(null);
  const [msgLoading, setMsgLoading] = useState(true);
  const [msgSaving, setMsgSaving] = useState(false);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [whatsappCode, setWhatsappCode] = useState<string | null>(null);
  const [botPhone, setBotPhone] = useState<string | null>(null);
  const [waMode, setWaMode] = useState<'choice' | 'mobile' | 'desktop'>('choice');
  const [waLinkLoading, setWaLinkLoading] = useState(false);
  const [waUnlinkLoading, setWaUnlinkLoading] = useState(false);

  useEffect(() => {
    loadRestaurant();
    loadMessaging();
  }, []);

  const loadRestaurant = async () => {
    try {
      const data = await apiFetch('/api/v1/manager/restaurant') as { restaurant: Restaurant };
      setRestaurant(data.restaurant);
    } catch (error) {
      console.error('Erreur chargement restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessaging = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/manager/messaging`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMsgSettings(await res.json());
    } catch (err) {
      console.error('Error fetching messaging:', err);
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const saveMsgSettings = async (updates: Partial<MessagingSettings>) => {
    const token = getToken();
    if (!token) return;
    setMsgSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/manager/messaging`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        toast({ title: 'Paramètres messagerie sauvegardés' });
        await loadMessaging();
      } else {
        toast({ title: 'Erreur', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erreur réseau', variant: 'destructive' });
    } finally {
      setMsgSaving(false);
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
      toast({ title: 'Erreur génération lien', variant: 'destructive' });
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
        toast({ title: 'Telegram délié' });
        setTelegramLink(null);
        await loadMessaging();
      }
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const generateWhatsappCode = async () => {
    const token = getToken();
    if (!token) {
      toast({ title: 'Session expirée, veuillez vous reconnecter', variant: 'destructive' });
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
        toast({ title: `Erreur serveur (${res.status})`, description: err, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erreur réseau', description: String(e), variant: 'destructive' });
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
        toast({ title: 'WhatsApp délié' });
        setWhatsappCode(null);
        await loadMessaging();
      }
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    } finally {
      setWaUnlinkLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    setSaving(true);
    try {
      await apiFetch('/api/v1/manager/restaurant', {
        method: 'PATCH',
        body: JSON.stringify({
          name: restaurant.name,
          address: restaurant.address,
          phone: restaurant.phone,
          welcomeMessage: restaurant.welcomeMessage,
          thankYouMessage: restaurant.thankYouMessage,
          clientTemplate: restaurant.clientTemplate,
          googleReviewUrl: restaurant.googleReviewUrl || null,
          geoRadius: restaurant.geoRadius,
          serviceHours: restaurant.serviceHours,
        }),
      });
      toast({ title: 'Paramètres sauvegardés' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  if (!restaurant) {
    return <div className="text-center text-muted-foreground">Restaurant non trouvé</div>;
  }

  return (
    <div className="space-y-6 px-1 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Configurez votre restaurant</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du restaurant</Label>
                <Input
                  id="name"
                  value={restaurant.name}
                  onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={restaurant.phone || ''}
                  onChange={(e) => setRestaurant({ ...restaurant, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={restaurant.address}
                onChange={(e) => setRestaurant({ ...restaurant, address: e.target.value })}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Messages personnalisés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Message de bienvenue</Label>
              <Textarea
                id="welcomeMessage"
                value={restaurant.welcomeMessage || ''}
                onChange={(e) => setRestaurant({ ...restaurant, welcomeMessage: e.target.value })}
                placeholder="Bienvenue ! Donnez-nous votre avis..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thankYouMessage">Message de remerciement</Label>
              <Textarea
                id="thankYouMessage"
                value={restaurant.thankYouMessage || ''}
                onChange={(e) => setRestaurant({ ...restaurant, thankYouMessage: e.target.value })}
                placeholder="Merci pour votre participation !"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template expérience client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choisissez le style visuel de l'expérience proposée à vos clients
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div
                onClick={() => setRestaurant({ ...restaurant, clientTemplate: 'classic' })}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  restaurant.clientTemplate === 'classic'
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center space-y-2">
                  <div className="text-3xl">🎨</div>
                  <p className="font-semibold">Classique</p>
                  <p className="text-xs text-muted-foreground">Design épuré et moderne, idéal pour tous types de restaurants</p>
                </div>
              </div>
              <div
                onClick={() => setRestaurant({ ...restaurant, clientTemplate: 'glass' })}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  restaurant.clientTemplate === 'glass'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center space-y-2">
                  <div className="text-3xl">✨</div>
                  <p className="font-semibold">Liquid Glass</p>
                  <p className="text-xs text-muted-foreground">Effet glassmorphism élégant avec transparences et reflets</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <GooglePlacesCard
          googleReviewUrl={restaurant.googleReviewUrl}
          onSelect={(url) => setRestaurant({ ...restaurant, googleReviewUrl: url })}
          onClear={() => setRestaurant({ ...restaurant, googleReviewUrl: null })}
        />

        <Card>
          <CardHeader>
            <CardTitle>Zone de participation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="geoRadius">Rayon de géolocalisation (mètres)</Label>
              <Input
                id="geoRadius"
                type="number"
                min="10"
                max="500"
                value={restaurant.geoRadius}
                onChange={(e) => setRestaurant({ ...restaurant, geoRadius: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Distance maximale pour participer (défaut: 100m)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horaires de service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Déjeuner</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="time"
                    value={restaurant.serviceHours.lunch.start}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRestaurant({
                      ...restaurant,
                      serviceHours: {
                        ...restaurant.serviceHours,
                        lunch: { ...restaurant.serviceHours.lunch, start: e.target.value }
                      }
                    })}
                  />
                  <span>à</span>
                  <Input
                    type="time"
                    value={restaurant.serviceHours.lunch.end}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRestaurant({
                      ...restaurant,
                      serviceHours: {
                        ...restaurant.serviceHours,
                        lunch: { ...restaurant.serviceHours.lunch, end: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dîner</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="time"
                    value={restaurant.serviceHours.dinner.start}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRestaurant({
                      ...restaurant,
                      serviceHours: {
                        ...restaurant.serviceHours,
                        dinner: { ...restaurant.serviceHours.dinner, start: e.target.value }
                      }
                    })}
                  />
                  <span>à</span>
                  <Input
                    type="time"
                    value={restaurant.serviceHours.dinner.end}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRestaurant({
                      ...restaurant,
                      serviceHours: {
                        ...restaurant.serviceHours,
                        dinner: { ...restaurant.serviceHours.dinner, end: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="w-full md:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </form>

      {/* Assistant IA & Messagerie */}
      <div className="border-t pt-6 mt-2">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold">Assistant IA & Messagerie</h2>
        </div>

        {msgLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Notifications toggle */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">Recevoir les bilans quotidiens</p>
                    <p className="text-sm text-gray-500">Résumé des avis envoyé chaque soir</p>
                  </div>
                  <button
                    onClick={() => saveMsgSettings({ messagingOptIn: !msgSettings?.messagingOptIn })}
                    disabled={msgSaving}
                    className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${
                      msgSettings?.messagingOptIn ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      msgSettings?.messagingOptIn ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>
                {msgSettings?.messagingOptIn && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 shrink-0">Heure d&apos;envoi :</label>
                    <select
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={msgSettings?.summaryHour ?? 22}
                      onChange={(e) => saveMsgSettings({ summaryHour: parseInt(e.target.value) })}
                      disabled={msgSaving}
                    >
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={h}>{String(h).padStart(2, '0')}h00</option>
                      ))}
                    </select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Provider Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Canal de messagerie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500">Choisissez comment communiquer avec votre assistant.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => saveMsgSettings({ preferredMessaging: 'TELEGRAM' })}
                    disabled={msgSaving}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      msgSettings?.preferredMessaging === 'TELEGRAM'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">✈️</div>
                    <p className="font-semibold text-gray-900">Telegram</p>
                    <p className="text-xs text-gray-500 mt-1">Gratuit, instantané</p>
                    {msgSettings?.telegramLinked && (
                      <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Lié</span>
                    )}
                  </button>
                  <button
                    onClick={() => saveMsgSettings({ preferredMessaging: 'WHATSAPP' })}
                    disabled={msgSaving}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      msgSettings?.preferredMessaging === 'WHATSAPP'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">💬</div>
                    <p className="font-semibold text-gray-900">WhatsApp</p>
                    <p className="text-xs text-gray-500 mt-1">Simple et rapide</p>
                    {msgSettings?.whatsappVerified && (
                      <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Lié</span>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Setup */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                {msgSettings?.whatsappVerified ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <span className="text-green-600 text-lg">✅</span>
                      <p className="text-sm font-medium text-green-800">
                        Votre WhatsApp est lié{msgSettings.whatsappNumber ? ` (${msgSettings.whatsappNumber})` : ''}. Discutez avec votre assistant IA directement sur WhatsApp.
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
                            <p className="text-xs text-gray-500 mt-1">Affiche un QR code à scanner avec le téléphone à lier</p>
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
                                    onClick={() => { navigator.clipboard.writeText(whatsappCode ?? ''); toast({ title: 'Code copié !' }); }}
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
                            <div className="p-3 bg-white rounded-xl border border-gray-200 inline-block">
                              <QRCodeSVG
                                value={botPhone
                                  ? `https://wa.me/${botPhone}?text=${encodeURIComponent(whatsappCode ?? '')}`
                                  : (whatsappCode ?? '')}
                                size={192}
                                fgColor="#111827"
                                bgColor="#ffffff"
                              />
                            </div>
                            <p className="text-sm text-gray-600 text-center">
                              Scannez ce QR code avec votre téléphone pour ouvrir WhatsApp avec le message prêt à envoyer
                            </p>
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
              </CardContent>
            </Card>

            {/* Telegram Setup */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration Telegram</CardTitle>
              </CardHeader>
              <CardContent>
                {msgSettings?.telegramLinked ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <span className="text-green-600 text-lg">✅</span>
                      <p className="text-sm font-medium text-green-800">
                        Votre compte Telegram est lié. Discutez avec votre assistant IA directement sur Telegram.
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
                        <a
                          href={telegramLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
                        >
                          ✈️ Ouvrir Telegram
                        </a>
                        <p className="text-xs text-gray-400 text-center">Ce lien expire dans 10 minutes</p>
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
              </CardContent>
            </Card>

            {/* What can the AI do */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6 space-y-3">
              <h3 className="text-lg font-semibold text-indigo-900">Que peut faire votre assistant ?</h3>
              <ul className="space-y-2 text-sm text-indigo-800">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">📊</span>
                  <span><strong>Consulter les avis</strong> — &quot;Quels sont les avis du jour ?&quot;, &quot;Résumé de la semaine&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">🎁</span>
                  <span><strong>Gérer les lots</strong> — &quot;Mes lots&quot;, &quot;Ajoute un café gratuit&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">📈</span>
                  <span><strong>Statistiques</strong> — &quot;Stats du mois&quot;, &quot;Combien de visiteurs ?&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">🔔</span>
                  <span><strong>Bilans automatiques</strong> — Résumé envoyé chaque soir à 22h</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
