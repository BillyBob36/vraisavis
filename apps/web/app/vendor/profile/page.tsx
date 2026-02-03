'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch, getToken } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  referralCode: string;
  commissionAmount: number;
  stripeOnboarded: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getToken();
        const result = await apiFetch<{ vendor: Profile }>('/api/v1/vendor/profile', { token: token || '' });
        setProfile(result.vendor);
        setFormData({ name: result.vendor.name, phone: result.vendor.phone || '' });
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getToken();
      await apiFetch('/api/v1/vendor/profile', {
        method: 'PATCH',
        token: token || '',
        body: JSON.stringify(formData),
      });

      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Mon profil</h1>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
              <Button type="submit" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Code parrainage</p>
              <p className="font-mono">{profile?.referralCode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commission par restaurant</p>
              <p className="font-bold text-lg">{formatCurrency(profile?.commissionAmount || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Membre depuis</p>
              <p>{profile?.createdAt ? formatDate(profile.createdAt) : '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stripe Connect</CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.stripeOnboarded ? (
              <div className="flex items-center gap-2 text-green-600">
                <span>✓</span>
                <span>Compte Stripe configuré</span>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-4">
                  Configurez votre compte Stripe pour recevoir vos commissions automatiquement.
                </p>
                <Button disabled>
                  Configurer Stripe (bientôt disponible)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
