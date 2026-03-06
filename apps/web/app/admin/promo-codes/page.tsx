'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { apiFetch, getToken } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, PowerOff, Copy } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  trialDays: number;
  maxUses: number;
  usedCount: number;
  skipStripe: boolean;
  isActive: boolean;
  description: string | null;
  expiresAt: string | null;
  createdAt: string;
  _count: { subscriptions: number };
}

const DEFAULT_FORM = {
  code: '',
  trialDays: 30,
  description: '',
};

function generateCode(): string {
  const prefix = 'TEST';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}${suffix}`;
}

export default function PromoCodesPage() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);

  const token = getToken('SUPER_ADMIN') || getToken() || '';

  const load = async () => {
    try {
      const res = await apiFetch<{ promoCodes: PromoCode[] }>('/api/v1/admin/promo-codes', { token });
      setCodes(res.promoCodes);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;

    setCreating(true);
    try {
      await apiFetch('/api/v1/admin/promo-codes', {
        method: 'POST',
        token,
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          trialDays: form.trialDays,
          maxUses: 1,
          skipStripe: true,
          description: form.description || null,
        }),
      });
      toast({ title: 'Code créé ✅', description: `Code ${form.code.toUpperCase()} créé (usage unique, ${form.trialDays}j)` });
      setForm(DEFAULT_FORM);
      setShowForm(false);
      load();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (code: PromoCode) => {
    try {
      await apiFetch(`/api/v1/admin/promo-codes/${code.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ isActive: !code.isActive }),
      });
      toast({ title: code.isActive ? 'Code désactivé' : 'Code réactivé' });
      load();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (code: PromoCode) => {
    if (!confirm(`Supprimer le code "${code.code}" ?`)) return;
    try {
      await apiFetch(`/api/v1/admin/promo-codes/${code.id}`, {
        method: 'DELETE',
        token,
      });
      toast({ title: 'Code supprimé' });
      load();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: `"${code}" copié` });
  };

  const activeCodes = codes.filter(c => c.isActive && c.usedCount === 0);
  const usedCodes = codes.filter(c => c.usedCount > 0);
  const inactiveCodes = codes.filter(c => !c.isActive && c.usedCount === 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Codes Promo</h1>
          <p className="text-muted-foreground mt-1">Codes d'essai gratuit usage unique — sans CB requise</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un code
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Nouveau code promo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      placeholder="Ex: TESTJUIN2026"
                      value={form.code}
                      onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      className="font-mono"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setForm({ ...form, code: generateCode() })}
                    >
                      Générer
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Sera automatiquement en majuscules. Usage unique.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trialDays">Durée de l'essai</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="trialDays"
                      type="number"
                      min={1}
                      max={365}
                      value={form.trialDays}
                      onChange={e => setForm({ ...form, trialDays: parseInt(e.target.value) || 30 })}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">jours gratuits</span>
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
                  <Input
                    id="description"
                    placeholder="Ex: Restaurant test Lyon — Démo salon pro"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Création...' : 'Créer le code'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); }}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">Chargement...</div>
      ) : codes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Aucun code promo. Créez-en un pour offrir un essai gratuit à un restaurant de test.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeCodes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Disponibles ({activeCodes.length})
              </h2>
              <div className="space-y-2">
                {activeCodes.map(code => (
                  <CodeRow key={code.id} code={code} onToggle={handleToggle} onDelete={handleDelete} onCopy={copyCode} />
                ))}
              </div>
            </div>
          )}

          {usedCodes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Utilisés ({usedCodes.length})
              </h2>
              <div className="space-y-2">
                {usedCodes.map(code => (
                  <CodeRow key={code.id} code={code} onToggle={handleToggle} onDelete={handleDelete} onCopy={copyCode} />
                ))}
              </div>
            </div>
          )}

          {inactiveCodes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Désactivés ({inactiveCodes.length})
              </h2>
              <div className="space-y-2">
                {inactiveCodes.map(code => (
                  <CodeRow key={code.id} code={code} onToggle={handleToggle} onDelete={handleDelete} onCopy={copyCode} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CodeRow({
  code,
  onToggle,
  onDelete,
  onCopy,
}: {
  code: PromoCode;
  onToggle: (c: PromoCode) => void;
  onDelete: (c: PromoCode) => void;
  onCopy: (s: string) => void;
}) {
  const isUsed = code.usedCount > 0;

  return (
    <Card className={`${!code.isActive ? 'opacity-50' : ''}`}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-base tracking-widest">{code.code}</span>
              {isUsed ? (
                <Badge variant="secondary">Utilisé</Badge>
              ) : code.isActive ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">Disponible</Badge>
              ) : (
                <Badge variant="outline">Désactivé</Badge>
              )}
              <span className="text-sm text-muted-foreground">{code.trialDays} jours gratuits</span>
            </div>
            {code.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{code.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isUsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(code.code)}
                title="Copier le code"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {!isUsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle(code)}
                title={code.isActive ? 'Désactiver' : 'Réactiver'}
              >
                <PowerOff className={`h-4 w-4 ${code.isActive ? 'text-orange-500' : 'text-green-500'}`} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(code)}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
