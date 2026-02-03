'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Gift, Plus, Trash2, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Prize {
  id: string;
  name: string;
  description: string | null;
  probability: number;
  dailyLimit: number;
  isActive: boolean;
}

export default function PrizesPage() {
  const { toast } = useToast();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    probability: 0.1,
    dailyLimit: 5,
  });

  useEffect(() => {
    loadPrizes();
  }, []);

  const loadPrizes = async () => {
    try {
      const data = await apiFetch('/api/v1/manager/prizes');
      setPrizes(data.prizes || []);
    } catch (error) {
      console.error('Erreur chargement lots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPrize) {
        await apiFetch(`/api/v1/manager/prizes/${editingPrize.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
        });
        toast({ title: 'Lot modifié' });
      } else {
        await apiFetch('/api/v1/manager/prizes', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        toast({ title: 'Lot créé' });
      }
      setDialogOpen(false);
      setEditingPrize(null);
      setFormData({ name: '', description: '', probability: 0.1, dailyLimit: 5 });
      loadPrizes();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (prize: Prize) => {
    setEditingPrize(prize);
    setFormData({
      name: prize.name,
      description: prize.description || '',
      probability: prize.probability,
      dailyLimit: prize.dailyLimit,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce lot ?')) return;
    try {
      await apiFetch(`/api/v1/manager/prizes/${id}`, { method: 'DELETE' });
      toast({ title: 'Lot supprimé' });
      loadPrizes();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const toggleActive = async (prize: Prize) => {
    try {
      await apiFetch(`/api/v1/manager/prizes/${prize.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !prize.isActive }),
      });
      loadPrizes();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lots</h1>
          <p className="text-muted-foreground">Gérez les lots à gagner</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open: boolean) => {
          setDialogOpen(open);
          if (!open) {
            setEditingPrize(null);
            setFormData({ name: '', description: '', probability: 0.1, dailyLimit: 5 });
          }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Ajouter un lot</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPrize ? 'Modifier le lot' : 'Nouveau lot'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du lot</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Café offert"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Un café au choix"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="probability">Probabilité (0-1)</Label>
                  <Input
                    id="probability"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyLimit">Limite/jour</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    min="1"
                    value={formData.dailyLimit}
                    onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingPrize ? 'Modifier' : 'Créer'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {prizes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun lot configuré</p>
            <p className="text-sm">Créez des lots pour que vos clients puissent les gagner</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prizes.map((prize) => (
            <Card key={prize.id} className={!prize.isActive ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{prize.name}</CardTitle>
                  <Badge variant={prize.isActive ? 'default' : 'secondary'}>
                    {prize.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {prize.description && (
                  <p className="text-sm text-muted-foreground">{prize.description}</p>
                )}
                <div className="flex justify-between text-sm">
                  <span>Probabilité: {(prize.probability * 100).toFixed(0)}%</span>
                  <span>Max/jour: {prize.dailyLimit}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(prize)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActive(prize)}>
                    {prize.isActive ? 'Désactiver' : 'Activer'}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(prize.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
