'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch, getToken } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { LocationPicker } from '@/components/ui/location-picker';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  latitude: number;
  longitude: number;
  geoRadius: number;
  googleReviewUrl: string | null;
  status: string;
}

export default function EditRestaurantPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    latitude: 48.8566,
    longitude: 2.3522,
    geoRadius: 100,
    googleReviewUrl: '',
  });

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const token = getToken();
      const result = await apiFetch<{ restaurants: Restaurant[] }>('/api/v1/admin/restaurants', { token: token || '' });
      const resto = result.restaurants.find((r: Restaurant) => r.id === params.id);
      if (resto) {
        setRestaurant(resto);
        setFormData({
          name: resto.name,
          address: resto.address,
          phone: resto.phone || '',
          latitude: resto.latitude,
          longitude: resto.longitude,
          geoRadius: resto.geoRadius,
          googleReviewUrl: resto.googleReviewUrl || '',
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getToken();
      await apiFetch(`/api/v1/admin/restaurants/${params.id}`, {
        method: 'PATCH',
        token: token || '',
        body: JSON.stringify(formData),
      });

      toast({ title: 'Restaurant mis à jour' });
      router.push('/admin/restaurants');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  if (!restaurant) {
    return <div className="flex items-center justify-center h-64">Restaurant non trouvé</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Modifier le restaurant</h1>
        <p className="text-gray-600 mt-2">{restaurant.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du restaurant</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du restaurant</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="geoRadius">Rayon de géolocalisation (mètres)</Label>
              <Input
                id="geoRadius"
                type="number"
                min="10"
                max="1000"
                value={formData.geoRadius}
                onChange={(e) => setFormData(prev => ({ ...prev, geoRadius: parseInt(e.target.value) }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleReviewUrl">Lien avis Google</Label>
              <Input
                id="googleReviewUrl"
                type="url"
                value={formData.googleReviewUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, googleReviewUrl: e.target.value }))}
                placeholder="https://search.google.com/local/writereview?placeid=ChIJ..."
              />
              {formData.googleReviewUrl && !formData.googleReviewUrl.includes('search.google.com/local/writereview?placeid=') && (
                <p className="text-sm text-red-500 font-medium">
                  ⚠️ Cette URL ne redirigera pas vers le formulaire d&apos;avis. Le format correct est : https://search.google.com/local/writereview?placeid=ChIJ...
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Utilisez le <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Place ID Finder</a> pour trouver le Place ID (format ChIJ...), puis collez : https://search.google.com/local/writereview?placeid=VOTRE_PLACE_ID
              </p>
            </div>

            <div className="space-y-2">
              <Label>Adresse et localisation</Label>
              <LocationPicker
                initialAddress={formData.address}
                initialLatitude={formData.latitude}
                initialLongitude={formData.longitude}
                onLocationSelect={(location) => {
                  setFormData(prev => ({
                    ...prev,
                    address: location.address,
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }));
                }}
              />
              <p className="text-sm text-muted-foreground">
                Cliquez sur la carte ou faites glisser le marqueur pour ajuster la position
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                  required
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                  required
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/restaurants')}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
