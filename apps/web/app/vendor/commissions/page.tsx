'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch, getToken } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Commission {
  id: string;
  amount: number;
  status: string;
  triggeredAt: string;
  paidAt: string | null;
  restaurant: { id: string; name: string } | null;
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        const token = getToken();
        const result = await apiFetch<{ commissions: Commission[] }>('/api/v1/vendor/commissions', { token: token || '' });
        setCommissions(result.commissions);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommissions();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  const pendingTotal = commissions
    .filter(c => c.status === 'PENDING')
    .reduce((sum, c) => sum + c.amount, 0);

  const paidTotal = commissions
    .filter(c => c.status === 'PAID')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Commissions</h1>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(pendingTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(paidTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune commission pour le moment
            </p>
          ) : (
            <div className="space-y-4">
              {commissions.map((commission) => (
                <div 
                  key={commission.id} 
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{commission.restaurant?.name || 'Restaurant supprimé'}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(commission.triggeredAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(commission.amount)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      commission.status === 'PAID' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {commission.status === 'PAID' ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
