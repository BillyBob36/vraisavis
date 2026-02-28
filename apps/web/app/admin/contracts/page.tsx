'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface ContractTemplate {
  id: string;
  type: 'CGU_CGV' | 'VENDOR_CONTRACT';
  version: string;
  companyName: string;
  companyLegalForm: string;
  companyCapital: string;
  companyAddress: string;
  companyRCS: string;
  companySIRET: string;
  companyVAT: string;
  companyPhone: string;
  companyEmail: string;
  companyDirector: string;
  hostingProvider: string;
  hostingAddress: string;
  dpoEmail?: string;
  mediatorName: string;
  mediatorAddress: string;
  mediatorWebsite: string;
  jurisdiction: string;
  monthlyPrice?: number;
  commissionRate?: number;
  commissionDuration?: number;
  contractContent: string;
  isActive: boolean;
  createdAt: string;
  _count?: { vendorContracts: number };
}

export default function ContractsPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    type: 'VENDOR_CONTRACT' as 'CGU_CGV' | 'VENDOR_CONTRACT',
    version: '1.0',
    companyName: '',
    companyLegalForm: '',
    companyCapital: '',
    companyAddress: '',
    companyRCS: '',
    companySIRET: '',
    companyVAT: '',
    companyPhone: '',
    companyEmail: '',
    companyDirector: '',
    hostingProvider: '',
    hostingAddress: '',
    dpoEmail: '',
    mediatorName: '',
    mediatorAddress: '',
    mediatorWebsite: '',
    jurisdiction: '',
    monthlyPrice: 4900,
    commissionRate: 25,
    commissionDuration: 12,
    contractContent: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await apiFetch('/api/v1/admin/contracts/templates') as { templates: ContractTemplate[] };
      setTemplates(response.templates);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        monthlyPrice: formData.type === 'CGU_CGV' ? formData.monthlyPrice : undefined,
        commissionRate: formData.type === 'VENDOR_CONTRACT' ? formData.commissionRate : undefined,
        commissionDuration: formData.type === 'VENDOR_CONTRACT' ? formData.commissionDuration : undefined,
      };

      if (editingTemplate) {
        await apiFetch(`/api/v1/admin/contracts/templates/${editingTemplate.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        toast({ title: 'Template modifié avec succès' });
      } else {
        await apiFetch('/api/v1/admin/contracts/templates', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        toast({ title: 'Template créé avec succès' });
      }

      setShowForm(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le template',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (template: ContractTemplate) => {
    setEditingTemplate(template);
    setFormData({
      type: template.type,
      version: template.version,
      companyName: template.companyName,
      companyLegalForm: template.companyLegalForm,
      companyCapital: template.companyCapital,
      companyAddress: template.companyAddress,
      companyRCS: template.companyRCS,
      companySIRET: template.companySIRET,
      companyVAT: template.companyVAT,
      companyPhone: template.companyPhone,
      companyEmail: template.companyEmail,
      companyDirector: template.companyDirector,
      hostingProvider: template.hostingProvider,
      hostingAddress: template.hostingAddress,
      dpoEmail: template.dpoEmail || '',
      mediatorName: template.mediatorName,
      mediatorAddress: template.mediatorAddress,
      mediatorWebsite: template.mediatorWebsite,
      jurisdiction: template.jurisdiction,
      monthlyPrice: template.monthlyPrice || 4900,
      commissionRate: template.commissionRate || 25,
      commissionDuration: template.commissionDuration || 12,
      contractContent: template.contractContent,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver ce template ?')) return;

    try {
      await apiFetch(`/api/v1/admin/contracts/templates/${id}`, { method: 'DELETE' });
      toast({ title: 'Template désactivé' });
      loadTemplates();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de désactiver le template',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="p-4 sm:p-8">Chargement...</div>;
  }

  if (showForm) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{editingTemplate ? 'Modifier' : 'Créer'} un template de contrat</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type de contrat</Label>
                  <select
                    id="type"
                    className="w-full border rounded px-3 py-2"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  >
                    <option value="VENDOR_CONTRACT">Contrat Apporteur d'Affaires</option>
                    <option value="CGU_CGV">CGU/CGV Restaurant</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <h3 className="font-semibold text-lg mt-6">Informations légales de la société</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de la société</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyLegalForm">Forme juridique</Label>
                  <Input
                    id="companyLegalForm"
                    placeholder="SASU, SAS, SARL..."
                    value={formData.companyLegalForm}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyLegalForm: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyCapital">Capital social</Label>
                  <Input
                    id="companyCapital"
                    placeholder="10000€"
                    value={formData.companyCapital}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyCapital: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyRCS">Numéro RCS</Label>
                  <Input
                    id="companyRCS"
                    value={formData.companyRCS}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyRCS: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySIRET">SIRET</Label>
                  <Input
                    id="companySIRET"
                    value={formData.companySIRET}
                    onChange={(e) => setFormData(prev => ({ ...prev, companySIRET: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyVAT">N° TVA intracommunautaire</Label>
                  <Input
                    id="companyVAT"
                    value={formData.companyVAT}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyVAT: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Téléphone</Label>
                  <Input
                    id="companyPhone"
                    value={formData.companyPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyPhone: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">Adresse du siège social</Label>
                <Input
                  id="companyAddress"
                  value={formData.companyAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDirector">Directeur de la publication</Label>
                <Input
                  id="companyDirector"
                  value={formData.companyDirector}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyDirector: e.target.value }))}
                  required
                />
              </div>

              <h3 className="font-semibold text-lg mt-6">Hébergeur</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hostingProvider">Nom de l'hébergeur</Label>
                  <Input
                    id="hostingProvider"
                    value={formData.hostingProvider}
                    onChange={(e) => setFormData(prev => ({ ...prev, hostingProvider: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hostingAddress">Adresse de l'hébergeur</Label>
                  <Input
                    id="hostingAddress"
                    value={formData.hostingAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, hostingAddress: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dpoEmail">Email DPO (optionnel)</Label>
                <Input
                  id="dpoEmail"
                  type="email"
                  value={formData.dpoEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, dpoEmail: e.target.value }))}
                />
              </div>

              <h3 className="font-semibold text-lg mt-6">Médiateur</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mediatorName">Nom du médiateur</Label>
                  <Input
                    id="mediatorName"
                    value={formData.mediatorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, mediatorName: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mediatorWebsite">Site web du médiateur</Label>
                  <Input
                    id="mediatorWebsite"
                    type="url"
                    value={formData.mediatorWebsite}
                    onChange={(e) => setFormData(prev => ({ ...prev, mediatorWebsite: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mediatorAddress">Adresse du médiateur</Label>
                <Input
                  id="mediatorAddress"
                  value={formData.mediatorAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, mediatorAddress: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jurisdiction">Juridiction compétente</Label>
                <Input
                  id="jurisdiction"
                  placeholder="Tribunaux de Paris"
                  value={formData.jurisdiction}
                  onChange={(e) => setFormData(prev => ({ ...prev, jurisdiction: e.target.value }))}
                  required
                />
              </div>

              {formData.type === 'CGU_CGV' && (
                <div className="space-y-2">
                  <Label htmlFor="monthlyPrice">Prix mensuel (centimes)</Label>
                  <Input
                    id="monthlyPrice"
                    type="number"
                    value={formData.monthlyPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyPrice: parseInt(e.target.value) }))}
                    required
                  />
                  <p className="text-sm text-gray-500">{(formData.monthlyPrice / 100).toFixed(2)}€</p>
                </div>
              )}

              {formData.type === 'VENDOR_CONTRACT' && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="commissionRate">Taux de commission (%)</Label>
                      <Input
                        id="commissionRate"
                        type="number"
                        step="0.01"
                        value={formData.commissionRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commissionDuration">Durée commission (mois)</Label>
                      <Input
                        id="commissionDuration"
                        type="number"
                        value={formData.commissionDuration}
                        onChange={(e) => setFormData(prev => ({ ...prev, commissionDuration: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="contractContent">Contenu du contrat (Markdown)</Label>
                <Textarea
                  id="contractContent"
                  rows={10}
                  value={formData.contractContent}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractContent: e.target.value }))}
                  placeholder="Collez ici le contrat complet en Markdown..."
                  required
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="flex-1 sm:flex-none">
                  {editingTemplate ? 'Modifier' : 'Créer'} le template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTemplate(null);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Templates de contrats</h1>
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">Créer un template</Button>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">
                    {template.type === 'CGU_CGV' ? 'CGU/CGV Restaurant' : 'Contrat Apporteur d\'Affaires'}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    Version {template.version} • {template.companyName}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                    Modifier
                  </Button>
                  {template.isActive && (
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(template.id)}>
                      Désactiver
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">SIRET:</p>
                  <p>{template.companySIRET}</p>
                </div>
                <div>
                  <p className="font-semibold">Email:</p>
                  <p>{template.companyEmail}</p>
                </div>
                <div>
                  <p className="font-semibold">Juridiction:</p>
                  <p>{template.jurisdiction}</p>
                </div>
                <div>
                  <p className="font-semibold">Contrats envoyés:</p>
                  <p>{template._count?.vendorContracts || 0}</p>
                </div>
                {template.commissionRate && (
                  <div>
                    <p className="font-semibold">Commission:</p>
                    <p>{template.commissionRate}% pendant {template.commissionDuration} mois</p>
                  </div>
                )}
                <div>
                  <p className="font-semibold">Statut:</p>
                  <p className={template.isActive ? 'text-green-600' : 'text-red-600'}>
                    {template.isActive ? 'Actif' : 'Inactif'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Aucun template de contrat. Créez-en un pour commencer.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
