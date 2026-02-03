'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch, getToken } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Store, Users, MessageSquare, CreditCard } from 'lucide-react';

interface DashboardStats {
  stats: {
    totalRestaurants: number;
    activeRestaurants: number;
    totalVendors: number;
    totalFeedbacks: number;
    pendingCommissions: number;
    mrr: number;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = getToken();
        const result = await apiFetch<DashboardStats>('/api/v1/admin/dashboard', { token: token || '' });
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
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

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
            <CardTitle className="text-sm font-medium">Vendeurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVendors || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingCommissions || 0} commissions en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedbacks</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFeedbacks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total collectés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.mrr || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Revenu mensuel récurrent
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
