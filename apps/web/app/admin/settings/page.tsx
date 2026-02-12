'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch, getToken } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface Restaurant {
  id: string;
  name: string;
}

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const { toast } = useToast();

  // Fingerprint deletion state
  const [fpModalOpen, setFpModalOpen] = useState(false);
  const [fpStep, setFpStep] = useState<1 | 2 | 3>(1);
  const [fpRestaurants, setFpRestaurants] = useState<Restaurant[]>([]);
  const [fpLoadingRestos, setFpLoadingRestos] = useState(false);
  const [fpSelectedResto, setFpSelectedResto] = useState<Restaurant | null>(null);
  const [fpDate, setFpDate] = useState('');
  const [fpService, setFpService] = useState<'lunch' | 'dinner' | null>(null);
  const [fpDeleting, setFpDeleting] = useState(false);
  const [fpSearch, setFpSearch] = useState('');

  const openFpModal = async () => {
    setFpModalOpen(true);
    setFpStep(1);
    setFpSelectedResto(null);
    setFpDate('');
    setFpService(null);
    setFpSearch('');
    setFpLoadingRestos(true);
    try {
      const data = await apiFetch('/api/v1/admin/restaurants') as { restaurants: Restaurant[] };
      setFpRestaurants(data.restaurants);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les restaurants', variant: 'destructive' });
    } finally {
      setFpLoadingRestos(false);
    }
  };

  const handleFpDelete = async () => {
    if (!fpSelectedResto || !fpDate || !fpService) return;
    setFpDeleting(true);
    try {
      const data = await apiFetch('/api/v1/admin/fingerprints', {
        method: 'DELETE',
        body: JSON.stringify({
          restaurantId: fpSelectedResto.id,
          date: fpDate,
          serviceType: fpService,
        }),
      }) as { deleted: number; message: string };
      toast({ title: 'Suppression effectuée', description: data.message });
      setFpModalOpen(false);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    } finally {
      setFpDeleting(false);
    }
  };

  const filteredRestos = fpRestaurants.filter(r =>
    r.name.toLowerCase().includes(fpSearch.toLowerCase())
  );

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const token = getToken();
      await apiFetch('/api/v1/auth/password', {
        method: 'PATCH',
        token: token || '',
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      toast({ title: 'Mot de passe modifié', description: 'Votre mot de passe a été mis à jour' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la modification',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Paramètres</h1>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Changer le mot de passe</CardTitle>
            <CardDescription>
              Modifiez votre mot de passe de connexion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Modification...' : 'Modifier le mot de passe'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suppression de fingerprints</CardTitle>
            <CardDescription>
              Réinitialiser les fingerprints pour permettre aux clients de rejouer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={openFpModal}>
              Supprimer des fingerprints
            </Button>
          </CardContent>
        </Card>

        {/* Fingerprint deletion modal */}
        {fpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setFpModalOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Step 1: Choose restaurant */}
              {fpStep === 1 && (
                <>
                  <h3 className="text-lg font-bold">Étape 1 — Choisir le restaurant</h3>
                  <Input
                    placeholder="Rechercher un restaurant..."
                    value={fpSearch}
                    onChange={(e) => setFpSearch(e.target.value)}
                  />
                  {fpLoadingRestos ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Chargement...</p>
                  ) : (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {filteredRestos.map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => { setFpSelectedResto(r); setFpStep(2); }}
                          className={`w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium ${
                            fpSelectedResto?.id === r.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          {r.name}
                        </button>
                      ))}
                      {filteredRestos.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucun restaurant trouvé</p>
                      )}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setFpModalOpen(false)}>Annuler</Button>
                  </div>
                </>
              )}

              {/* Step 2: Choose date */}
              {fpStep === 2 && (
                <>
                  <h3 className="text-lg font-bold">Étape 2 — Choisir la date</h3>
                  <p className="text-sm text-muted-foreground">Restaurant : <strong>{fpSelectedResto?.name}</strong></p>
                  <div className="space-y-2">
                    <Label htmlFor="fpDate">Date</Label>
                    <Input
                      id="fpDate"
                      type="date"
                      value={fpDate}
                      onChange={(e) => setFpDate(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setFpStep(1)}>Retour</Button>
                    <Button disabled={!fpDate} onClick={() => setFpStep(3)}>Suivant</Button>
                  </div>
                </>
              )}

              {/* Step 3: Choose service + confirm */}
              {fpStep === 3 && (
                <>
                  <h3 className="text-lg font-bold">Étape 3 — Choisir le service</h3>
                  <p className="text-sm text-muted-foreground">
                    Restaurant : <strong>{fpSelectedResto?.name}</strong><br />
                    Date : <strong>{fpDate ? new Date(fpDate).toLocaleDateString('fr-FR') : ''}</strong>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFpService('lunch')}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        fpService === 'lunch'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="text-2xl mb-1">☀️</div>
                      <div className="text-sm font-semibold">Midi</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFpService('dinner')}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        fpService === 'dinner'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="text-2xl mb-1">🌙</div>
                      <div className="text-sm font-semibold">Soir</div>
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setFpStep(2)}>Retour</Button>
                    <Button
                      variant="destructive"
                      disabled={!fpService || fpDeleting}
                      onClick={handleFpDelete}
                    >
                      {fpDeleting ? 'Suppression...' : 'Supprimer'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Configuration Stripe</CardTitle>
            <CardDescription>
              Configurez vos clés Stripe pour les paiements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Les clés Stripe sont configurées via les variables d&apos;environnement sur le serveur.
            </p>
            <p className="text-sm">
              Statut: <span className="text-orange-600">Non configuré</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration Email</CardTitle>
            <CardDescription>
              Configuration SMTP pour les emails transactionnels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              La configuration email est gérée via les variables d&apos;environnement.
            </p>
            <p className="text-sm">
              Statut: <span className="text-orange-600">Non configuré</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
