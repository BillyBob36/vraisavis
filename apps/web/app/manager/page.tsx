'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch, getToken } from '@/lib/api';
import { MessageSquare, Gift, Eye, Calendar } from 'lucide-react';

interface DashboardData {
  restaurant: { id: string; name: string; status: string };
  stats: {
    totalFeedbacks: number;
    unreadFeedbacks: number;
    todayFeedbacks: number;
    pendingClaims: number;
  };
  subscription: {
    status: string;
    plan: { name: string };
    currentPeriodEnd: string;
  } | null;
}

export default function ManagerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = getToken();
        const result = await apiFetch<DashboardData>('/api/v1/manager/dashboard', { token: token || '' });
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{data?.restaurant?.name || 'Dashboard'}</h1>
        <p className="text-muted-foreground">
          Statut: <span className={data?.restaurant?.status === 'ACTIVE' ? 'text-green-600' : 'text-orange-600'}>
            {data?.restaurant?.status === 'ACTIVE' ? 'Actif' : 'En attente'}
          </span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedbacks totaux</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.totalFeedbacks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non lus</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data?.stats?.unreadFeedbacks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aujourd&apos;hui</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.todayFeedbacks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lots à réclamer</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.pendingClaims || 0}</div>
          </CardContent>
        </Card>
      </div>

      {data?.subscription && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Abonnement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Plan {data.subscription.plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {data.subscription.status === 'TRIAL' ? 'Période d\'essai' : 'Actif'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Expire le {new Date(data.subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
