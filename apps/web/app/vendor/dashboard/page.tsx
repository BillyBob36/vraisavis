'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getUser } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Stats {
  totalRestaurants: number;
  activeRestaurants: number;
  pendingCommissions: number;
  totalCommissions: number;
  totalEarned: number;
}

interface Restaurant {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export default function VendorDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentRestaurants, setRecentRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'VENDOR') {
      router.push('/login');
      return;
    }

    loadDashboard();
  }, [router]);

  async function loadDashboard() {
    try {
      const data = await apiFetch('/api/v1/vendor/dashboard') as { stats: Stats; recentRestaurants: Restaurant[] };
      setStats(data.stats);
      setRecentRestaurants(data.recentRestaurants || []);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard Vendeur</h1>
        <p className="text-gray-600 mt-2">Gérez vos restaurants et commissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Restaurants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalRestaurants || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Restaurants Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.activeRestaurants || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Commissions en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats?.pendingCommissions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Gagné</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{((stats?.totalEarned || 0) / 100).toFixed(2)}€</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Restaurants Récents</CardTitle>
            <CardDescription>Vos 5 derniers restaurants affiliés</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRestaurants.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun restaurant pour le moment</p>
            ) : (
              <div className="space-y-4">
                {recentRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{restaurant.name}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(restaurant.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge variant={restaurant.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {restaurant.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>Gérez votre activité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => router.push('/vendor/restaurants')} 
              className="w-full"
              variant="outline"
            >
              Voir tous les restaurants
            </Button>
            <Button 
              onClick={() => router.push('/vendor/commissions')} 
              className="w-full"
              variant="outline"
            >
              Voir les commissions
            </Button>
            <Button 
              onClick={() => router.push('/vendor/profile')} 
              className="w-full"
              variant="outline"
            >
              Mon profil
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
