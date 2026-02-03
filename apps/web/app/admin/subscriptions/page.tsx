'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch, getToken } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  restaurant: { id: string; name: string };
  plan: { id: string; name: string };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const token = getToken();
        const result = await apiFetch<{ subscriptions: Subscription[] }>('/api/v1/admin/subscriptions', { token: token || '' });
        setSubscriptions(result.subscriptions);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  const byStatus = {
    TRIAL: subscriptions.filter(s => s.status === 'TRIAL'),
    ACTIVE: subscriptions.filter(s => s.status === 'ACTIVE'),
    OTHER: subscriptions.filter(s => !['TRIAL', 'ACTIVE'].includes(s.status)),
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Abonnements</h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">En essai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{byStatus.TRIAL.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{byStatus.ACTIVE.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Autres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{byStatus.OTHER.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des abonnements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium">{sub.restaurant.name}</p>
                  <p className="text-sm text-muted-foreground">Plan {sub.plan.name}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    sub.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-700' 
                      : sub.status === 'TRIAL'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {sub.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expire le {formatDate(sub.currentPeriodEnd)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
