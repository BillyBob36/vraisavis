'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch, getToken } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface Vendor {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  referralCode: string;
  commissionAmount: number;
  isActive: boolean;
  createdAt: string;
  _count: { restaurants: number; commissions: number };
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    commissionAmount: 5000,
  });
  const { toast } = useToast();

  const fetchVendors = async () => {
    try {
      const token = getToken();
      const result = await apiFetch<{ vendors: Vendor[] }>('/api/v1/admin/vendors', { token: token || '' });
      setVendors(result.vendors);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getToken();
      await apiFetch('/api/v1/admin/vendors', {
        method: 'POST',
        token: token || '',
        body: JSON.stringify(formData),
      });

      toast({ title: 'Vendeur créé', description: 'Le compte a été créé avec succès' });
      setShowForm(false);
      setFormData({ email: '', password: '', name: '', phone: '', commissionAmount: 5000 });
      fetchVendors();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la création',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleVendorStatus = async (id: string, isActive: boolean) => {
    try {
      const token = getToken();
      await apiFetch(`/api/v1/admin/vendors/${id}`, {
        method: 'PATCH',
        token: token || '',
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchVendors();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Vendeurs</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showForm ? 'Annuler' : 'Nouveau vendeur'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Créer un vendeur</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={6}
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
              <div className="space-y-2">
                <Label htmlFor="commission">Commission (centimes)</Label>
                <Input
                  id="commission"
                  type="number"
                  value={formData.commissionAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, commissionAmount: parseInt(e.target.value) }))}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Création...' : 'Créer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {vendors.map((vendor) => (
          <Card key={vendor.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{vendor.name}</h3>
                  <p className="text-sm text-muted-foreground">{vendor.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  vendor.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {vendor.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="grid md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Code parrainage</p>
                  <p className="font-mono">{vendor.referralCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Commission</p>
                  <p>{formatCurrency(vendor.commissionAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Restaurants</p>
                  <p>{vendor._count.restaurants}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Inscrit le</p>
                  <p>{formatDate(vendor.createdAt)}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleVendorStatus(vendor.id, vendor.isActive)}
                >
                  {vendor.isActive ? 'Désactiver' : 'Activer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
