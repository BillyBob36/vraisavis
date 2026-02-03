'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch, getToken } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  status: string;
  createdAt: string;
  manager: { id: string; email: string; name: string };
  subscription: { status: string; plan: { name: string } } | null;
  _count: { feedbacks: number };
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const token = getToken();
        const result = await apiFetch<{ restaurants: Restaurant[] }>('/api/v1/vendor/restaurants', { token: token || '' });
        setRestaurants(result.restaurants);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Mes restaurants</h1>

      {restaurants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Vous n&apos;avez pas encore de restaurants liés à votre compte.
            </p>
            <p className="text-sm text-muted-foreground">
              Partagez votre lien de parrainage pour commencer !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{restaurant.name}</CardTitle>
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
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Adresse</p>
                    <p>{restaurant.address}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Manager</p>
                    <p>{restaurant.manager.name}</p>
                    <p className="text-xs text-muted-foreground">{restaurant.manager.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Abonnement</p>
                    <p>
                      {restaurant.subscription 
                        ? `${restaurant.subscription.plan.name} (${restaurant.subscription.status === 'TRIAL' ? 'Essai' : 'Actif'})`
                        : 'Aucun'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Feedbacks</p>
                    <p>{restaurant._count.feedbacks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Inscrit le</p>
                    <p>{formatDate(restaurant.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
