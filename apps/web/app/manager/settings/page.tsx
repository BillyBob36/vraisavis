'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Save } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  welcomeMessage: string | null;
  thankYouMessage: string | null;
  clientTemplate: string;
  geoRadius: number;
  serviceHours: {
    lunch: { start: string; end: string };
    dinner: { start: string; end: string };
  };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRestaurant();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
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
    </div>
  );
}
