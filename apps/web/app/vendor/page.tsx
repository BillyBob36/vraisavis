'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch, getToken } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Store, Wallet, Clock, TrendingUp } from 'lucide-react';

interface DashboardData {
  stats: {
    totalRestaurants: number;
    activeRestaurants: number;
    pendingCommissions: number;
    totalCommissions: number;
    totalEarned: number;
  };
  recentRestaurants: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
  }>;
}

export default function VendorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = getToken();
        const result = await apiFetch<DashboardData>('/api/v1/vendor/dashboard', { token: token || '' });
        setData(result);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  const stats = data?.stats;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard Vendeur</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRestaurants || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeRestaurants || 0} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions en attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.pendingCommissions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total commissions</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCommissions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total gagné</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.totalEarned || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {data?.recentRestaurants && data.recentRestaurants.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Restaurants récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentRestaurants.map((restaurant) => (
                <div key={restaurant.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{restaurant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(restaurant.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    restaurant.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {restaurant.status === 'ACTIVE' ? 'Actif' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
