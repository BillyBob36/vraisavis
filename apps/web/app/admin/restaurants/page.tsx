'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiFetch, getToken } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  status: string;
  createdAt: string;
  manager: { id: string; email: string; name: string };
  vendor: { id: string; name: string; referralCode: string } | null;
  subscription: { status: string; plan: { name: string } } | null;
  _count: { feedbacks: number };
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRestaurants = async () => {
    try {
      const token = getToken();
      const result = await apiFetch<{ restaurants: Restaurant[] }>('/api/v1/admin/restaurants', { token: token || '' });
      setRestaurants(result.restaurants);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = getToken();
      await apiFetch(`/api/v1/admin/restaurants/${id}`, {
        method: 'PATCH',
        token: token || '',
        body: JSON.stringify({ status }),
      });
      toast({ title: 'Statut mis à jour' });
      fetchRestaurants();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    }
  };

  const deleteRestaurant = async (id: string, name: string, managerEmail: string) => {
    // Première confirmation
    if (!confirm(`Supprimer le restaurant "${name}" ?\n\nLe compte manager (${managerEmail}) sera également supprimé.`)) {
      return;
    }

    try {
      const token = getToken();
      const result = await apiFetch<{ message: string }>(`/api/v1/admin/restaurants/${id}`, {
        method: 'DELETE',
        token: token || '',
      });
      toast({ title: 'Succès', description: result.message });
      fetchRestaurants();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le restaurant',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Restaurants</h1>

      <div className="grid gap-4">
        {restaurants.map((restaurant) => (
          <Card key={restaurant.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">{restaurant.name}</h3>
                  <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  restaurant.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-700' 
                    : restaurant.status === 'SUSPENDED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {restaurant.status === 'ACTIVE' ? 'Actif' : restaurant.status === 'SUSPENDED' ? 'Suspendu' : 'En attente'}
                </span>
              </div>
              
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Manager</p>
                  <p>{restaurant.manager.name}</p>
                  <p className="text-xs text-muted-foreground">{restaurant.manager.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vendeur</p>
                  <p>{restaurant.vendor?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Abonnement</p>
                  <p>
                    {restaurant.subscription 
                      ? `${restaurant.subscription.plan.name} (${restaurant.subscription.status})`
                      : 'Aucun'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Feedbacks</p>
                  <p>{restaurant._count.feedbacks}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => window.location.href = `/admin/restaurants/edit/${restaurant.id}`}>
                  Modifier
                </Button>
                {restaurant.status === 'PENDING' && (
                  <Button size="sm" onClick={() => updateStatus(restaurant.id, 'ACTIVE')}>
                    Activer
                  </Button>
                )}
                {restaurant.status === 'ACTIVE' && (
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(restaurant.id, 'SUSPENDED')}>
                    Suspendre
                  </Button>
                )}
                {restaurant.status === 'SUSPENDED' && (
                  <Button size="sm" onClick={() => updateStatus(restaurant.id, 'ACTIVE')}>
                    Réactiver
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteRestaurant(restaurant.id, restaurant.name, restaurant.manager?.email || '')}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
