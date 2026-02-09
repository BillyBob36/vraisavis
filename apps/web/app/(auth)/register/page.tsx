'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const LocationPicker = dynamic(
  () => import('@/components/ui/location-picker').then((mod) => mod.LocationPicker),
  { ssr: false, loading: () => <div className="h-64 w-full rounded-lg border border-input bg-muted animate-pulse" /> }
);

interface CGUData {
  id: string;
  version: string;
  contractContent: string;
  companyName: string;
}

// Fonction pour formater le texte en gras (** **)
const formatBoldText = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

function CheckoutForm({ onSuccess, onSkip, trialEndsAt }: { onSuccess: () => void; onSkip: () => void; trialEndsAt: string | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    const { error: submitError } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: `${window.location.origin}/login` },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'Erreur lors de la validation');
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  const trialDate = trialEndsAt ? new Date(trialEndsAt).toLocaleDateString('fr-FR') : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? 'Traitement...' : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Démarrer l'essai gratuit
          </>
        )}
      </Button>
      <button
        type="button"
        onClick={onSkip}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Passer cette étape →
      </button>
      <p className="text-xs text-center text-muted-foreground">
        Essai gratuit 14 jours. Aucun prélèvement aujourd'hui.
        {trialDate && <> Premier paiement le {trialDate}.</>}
      </p>
    </form>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'cgu' | 'payment'>('form');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [cguData, setCguData] = useState<CGUData | null>(null);
  const [cguLoading, setCguLoading] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [acceptCGU, setAcceptCGU] = useState(false);
  const cguContainerRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    restaurantName: '',
    address: '',
    phone: '',
    referralCode: '',
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    // Récupérer le code de parrainage depuis l'URL
    const ref = searchParams.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref }));
    }
  }, [searchParams]);

  // Charger les CGU quand on passe à l'étape CGU
  useEffect(() => {
    if (step === 'cgu' && !cguData) {
      loadCGU();
    }
  }, [step]);

  const loadCGU = async () => {
    setCguLoading(true);
    try {
      const response = await apiFetch('/api/v1/auth/cgu') as { cgu: CGUData };
      setCguData(response.cgu);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les CGU/CGV',
        variant: 'destructive',
      });
      setStep('form');
    } finally {
      setCguLoading(false);
    }
  };

  // Détecter le scroll jusqu'en bas
  const handleCGUScroll = () => {
    if (cguContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = cguContainerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleLocationSelect = (location: { address: string; latitude: number; longitude: number }) => {
    setFormData(prev => ({
      ...prev,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  };

  // Étape 1: Valider le formulaire et passer aux CGU
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.latitude === 0 && formData.longitude === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner l\'emplacement de votre restaurant sur la carte',
        variant: 'destructive',
      });
      return;
    }

    setStep('cgu');
  };

  // Étape 2: Soumettre l'inscription après acceptation CGU
  const handleFinalSubmit = async () => {
    if (!acceptCGU) {
      toast({
        title: 'Erreur',
        description: 'Vous devez accepter les CGU/CGV pour continuer',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await apiFetch<{ message: string; clientSecret?: string; trialEndsAt?: string }>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          acceptCGU: true,
          cguVersion: cguData?.version || '1.0',
        }),
      });

      // Si Stripe est configuré et qu'on a un clientSecret, aller à l'étape paiement
      if (result.clientSecret && stripePromise) {
        setClientSecret(result.clientSecret);
        setTrialEndsAt(result.trialEndsAt || null);
        setStep('payment');
      } else {
        // Pas de Stripe, rediriger directement
        toast({
          title: 'Compte créé',
          description: 'Vous pouvez maintenant vous connecter',
        });
        router.push('/login');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la création',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Étape Paiement (collecte de carte)
  if (step === 'payment' && clientSecret && stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold text-center mb-2">🍽️ VraisAvis</h1>
            <CardTitle>Moyen de paiement</CardTitle>
            <CardDescription>
              Ajoutez votre carte pour démarrer votre essai gratuit de 14 jours.
              Aucun prélèvement avant la fin de l'essai.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <CheckoutForm
                onSuccess={() => {
                  toast({
                    title: 'Compte créé avec succès !',
                    description: 'Votre essai gratuit de 14 jours a commencé.',
                  });
                  router.push('/login');
                }}
                onSkip={() => {
                  toast({
                    title: 'Compte créé',
                    description: 'Vous pourrez ajouter votre carte plus tard.',
                  });
                  router.push('/login');
                }}
                trialEndsAt={trialEndsAt}
              />
            </Elements>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Étape CGU
  if (step === 'cgu') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold text-center mb-2">🍽️ VraisAvis</h1>
            <CardTitle>Conditions Générales d'Utilisation et de Vente</CardTitle>
            <CardDescription>
              Veuillez lire attentivement les CGU/CGV ci-dessous et les accepter pour finaliser votre inscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cguLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : cguData ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Version {cguData.version} • {cguData.companyName}
                </div>
                
                <div
                  ref={cguContainerRef}
                  onScroll={handleCGUScroll}
                  className="h-96 overflow-y-auto border rounded-lg p-4 bg-white text-sm"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  <div className="space-y-2">
                    {cguData.contractContent.split('\n').map((line, index) => {
                      const trimmedLine = line.trim();
                      
                      // Séparateurs
                      if (trimmedLine === '***' || trimmedLine === '---') {
                        return <hr key={index} className="my-4 border-gray-300" />;
                      }
                      // Titres
                      if (line.startsWith('#### ')) {
                        return <h4 key={index} className="text-sm font-semibold mt-3 mb-1">{line.replace('#### ', '')}</h4>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={index} className="text-base font-semibold mt-4 mb-2 text-gray-800">{line.replace('### ', '')}</h3>;
                      }
                      if (line.startsWith('## ')) {
                        return <h2 key={index} className="text-lg font-bold mt-6 mb-3 text-gray-900 border-b pb-1">{line.replace('## ', '')}</h2>;
                      }
                      if (line.startsWith('# ')) {
                        return <h1 key={index} className="text-xl font-bold mt-4 mb-3 text-center">{line.replace('# ', '')}</h1>;
                      }
                      // Listes numérotées
                      if (/^\d+\.\s/.test(trimmedLine)) {
                        const content = trimmedLine.replace(/^\d+\.\s/, '');
                        return <p key={index} className="ml-4 my-1">{trimmedLine.match(/^\d+/)?.[0]}. {formatBoldText(content)}</p>;
                      }
                      // Listes avec tirets (sous-listes indentées)
                      if (line.startsWith('    - ')) {
                        return <p key={index} className="ml-8 my-0.5">• {formatBoldText(line.replace('    - ', ''))}</p>;
                      }
                      // Listes avec tirets
                      if (line.startsWith('- ')) {
                        return <p key={index} className="ml-4 my-0.5">• {formatBoldText(line.replace('- ', ''))}</p>;
                      }
                      // Ligne vide
                      if (trimmedLine === '') {
                        return <div key={index} className="h-2" />;
                      }
                      // Paragraphe normal avec gras inline
                      return <p key={index} className="my-1 text-gray-700">{formatBoldText(line)}</p>;
                    })}
                  </div>
                </div>

                {!hasScrolledToBottom && (
                  <p className="text-center text-sm text-amber-600 mt-2 animate-pulse">
                    ⬇️ Veuillez faire défiler jusqu'en bas pour pouvoir accepter les CGU/CGV
                  </p>
                )}

                {hasScrolledToBottom && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptCGU}
                        onChange={(e) => setAcceptCGU(e.target.checked)}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm">
                        <strong>J'ai lu et j'accepte les Conditions Générales d'Utilisation et de Vente</strong>
                        <br />
                        <span className="text-muted-foreground">
                          En cochant cette case, je reconnais avoir pris connaissance des CGU/CGV et les accepter sans réserve.
                        </span>
                      </span>
                    </label>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('form')}
                    className="flex-1"
                  >
                    ← Retour
                  </Button>
                  <Button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={!acceptCGU || loading}
                    className="flex-1"
                  >
                    {loading ? 'Création...' : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Créer mon compte
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center text-red-500">
                Impossible de charger les CGU/CGV. Veuillez réessayer.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Étape Formulaire
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold text-center mb-8">🍽️ VraisAvis</h1>
          <CardDescription>Créez votre compte restaurant</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Votre nom</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Jean Dupont"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Nom du restaurant</Label>
              <Input
                id="restaurantName"
                name="restaurantName"
                placeholder="Chez Jean"
                value={formData.restaurantName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Emplacement du restaurant</Label>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialLatitude={48.8566}
                initialLongitude={2.3522}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="06 12 34 56 78"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Utilisé pour votre assistant IA (Telegram/WhatsApp)
              </p>
            </div>
            {formData.referralCode && (
              <div className="space-y-2">
                <Label htmlFor="referralCode">Code parrainage</Label>
                <Input
                  id="referralCode"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleChange}
                  disabled
                />
              </div>
            )}
            <Button type="submit" className="w-full">
              Continuer →
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
