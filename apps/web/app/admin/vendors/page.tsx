'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch, getToken } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, X, FileText, Download } from 'lucide-react';

interface VendorContract {
  id: string;
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'REJECTED';
  sentAt?: string;
  signedAt?: string;
}

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
  contracts?: VendorContract[];
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    commissionAmount: 50,
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
      const dataToSend = {
        ...formData,
        commissionAmount: Math.round(formData.commissionAmount * 100),
      };

      if (editingVendor) {
        await apiFetch(`/api/v1/admin/vendors/${editingVendor.id}`, {
          method: 'PATCH',
          token: token || '',
          body: JSON.stringify(dataToSend),
        });
        toast({ title: 'Vendeur modifié', description: 'Le profil a été mis à jour' });
      } else {
        await apiFetch('/api/v1/admin/vendors', {
          method: 'POST',
          token: token || '',
          body: JSON.stringify(dataToSend),
        });
        toast({ title: 'Vendeur créé', description: 'Le compte a été créé avec succès' });
      }

      setShowForm(false);
      setEditingVendor(null);
      setFormData({ email: '', password: '', name: '', phone: '', commissionAmount: 50 });
      fetchVendors();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      email: vendor.email,
      password: '',
      name: vendor.name,
      phone: vendor.phone || '',
      commissionAmount: vendor.commissionAmount / 100,
    });
    setShowForm(true);
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
        <Button onClick={() => {
          setShowForm(!showForm);
          setEditingVendor(null);
          setFormData({ email: '', password: '', name: '', phone: '', commissionAmount: 50 });
        }}>
          {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showForm ? 'Annuler' : 'Nouveau vendeur'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingVendor ? 'Modifier le vendeur' : 'Créer un vendeur'}</CardTitle>
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
                <Label htmlFor="password">Mot de passe {editingVendor && '(laisser vide pour ne pas changer)'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required={!editingVendor}
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
                <Label htmlFor="commission">Commission (€)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.commissionAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, commissionAmount: parseFloat(e.target.value) }))}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Enregistrement...' : (editingVendor ? 'Modifier' : 'Créer')}
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
              <div className="grid md:grid-cols-5 gap-4 mt-4 text-sm">
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
                  <p className="text-muted-foreground">Contrat</p>
                  {vendor.contracts && vendor.contracts.length > 0 ? (
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      vendor.contracts[0].status === 'SIGNED' ? 'bg-green-100 text-green-700' :
                      vendor.contracts[0].status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                      vendor.contracts[0].status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {vendor.contracts[0].status === 'SIGNED' ? '✓ Signé' :
                       vendor.contracts[0].status === 'SENT' ? '⏳ En attente' :
                       vendor.contracts[0].status === 'REJECTED' ? '✗ Rejeté' : 'Brouillon'}
                    </span>
                  ) : (
                    <span className="text-gray-400">Aucun</span>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Inscrit le</p>
                  <p>{formatDate(vendor.createdAt)}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(vendor)}
                >
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleVendorStatus(vendor.id, vendor.isActive)}
                >
                  {vendor.isActive ? 'Désactiver' : 'Activer'}
                </Button>
                {vendor.contracts && vendor.contracts.length > 0 && vendor.contracts[0].status === 'SIGNED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const token = getToken();
                      window.open(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.vraisavis.fr'}/api/v1/admin/contracts/${vendor.contracts![0].id}/pdf?token=${token}`, '_blank');
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF Contrat
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
