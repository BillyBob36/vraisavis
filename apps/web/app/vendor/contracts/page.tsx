'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';

interface VendorContract {
  id: string;
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'REJECTED';
  vendorName: string;
  vendorEmail: string;
  vendorAddress?: string;
  vendorPhone?: string;
  vendorStatut?: string;
  vendorSIRET?: string;
  vendorTVA?: string;
  vendorTVANumber?: string;
  vendorIBAN?: string;
  vendorCity?: string;
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  template: {
    id: string;
    type: string;
    version: string;
    companyName: string;
    contractContent: string;
    commissionRate?: number;
  };
}

export default function VendorContractsPage() {
  const [contracts, setContracts] = useState<VendorContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<VendorContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const { toast } = useToast();

  const [signatureData, setSignatureData] = useState({
    vendorAddress: '',
    vendorPhone: '',
    vendorStatut: '',
    vendorSIRET: '',
    vendorTVA: 'Non',
    vendorTVANumber: '',
    vendorIBAN: '',
    vendorCity: '',
    acceptTerms: false,
    fullName: '',
  });

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const response = await apiFetch('/api/v1/vendor/contracts') as { contracts: VendorContract[] };
      setContracts(response.contracts);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les contrats',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = async (contract: VendorContract) => {
    try {
      const response = await apiFetch(`/api/v1/vendor/contracts/${contract.id}`) as { contract: VendorContract };
      setSelectedContract(response.contract);
      setSignatureData({
        vendorAddress: response.contract.vendorAddress || '',
        vendorPhone: response.contract.vendorPhone || '',
        vendorStatut: response.contract.vendorStatut || '',
        vendorSIRET: response.contract.vendorSIRET || '',
        vendorTVA: response.contract.vendorTVA || 'Non',
        vendorTVANumber: response.contract.vendorTVANumber || '',
        vendorIBAN: response.contract.vendorIBAN || '',
        vendorCity: response.contract.vendorCity || '',
        acceptTerms: false,
        fullName: response.contract.vendorName,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le contrat',
        variant: 'destructive',
      });
    }
  };

  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContract) return;
    
    if (!signatureData.acceptTerms) {
      toast({
        title: 'Erreur',
        description: 'Vous devez accepter les termes du contrat',
        variant: 'destructive',
      });
      return;
    }

    setSigning(true);

    try {
      const signatureString = `Lu et approuvé, bon pour accord\n${signatureData.fullName}\n${new Date().toLocaleString('fr-FR')}`;
      
      await apiFetch('/api/v1/vendor/contracts/sign', {
        method: 'POST',
        body: JSON.stringify({
          contractId: selectedContract.id,
          vendorAddress: signatureData.vendorAddress,
          vendorPhone: signatureData.vendorPhone,
          vendorStatut: signatureData.vendorStatut,
          vendorSIRET: signatureData.vendorSIRET,
          vendorTVA: signatureData.vendorTVA,
          vendorTVANumber: signatureData.vendorTVANumber,
          vendorIBAN: signatureData.vendorIBAN,
          vendorCity: signatureData.vendorCity,
          signatureData: signatureString,
          acceptTerms: signatureData.acceptTerms,
        }),
      });

      toast({
        title: 'Contrat signé',
        description: 'Votre signature a été enregistrée avec succès',
      });

      setSelectedContract(null);
      loadContracts();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de signer le contrat',
        variant: 'destructive',
      });
    } finally {
      setSigning(false);
    }
  };

  const handleRejectContract = async (contractId: string) => {
    const reason = prompt('Raison du rejet (optionnel):');
    
    try {
      await apiFetch(`/api/v1/vendor/contracts/${contractId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      toast({ title: 'Contrat rejeté' });
      setSelectedContract(null);
      loadContracts();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter le contrat',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: { label: 'Brouillon', color: 'bg-gray-500' },
      SENT: { label: 'En attente', color: 'bg-blue-500' },
      SIGNED: { label: 'Signé', color: 'bg-green-500' },
      REJECTED: { label: 'Rejeté', color: 'bg-red-500' },
    };
    const badge = badges[status as keyof typeof badges] || badges.DRAFT;
    return (
      <span className={`${badge.color} text-white px-2 py-1 rounded text-xs`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  if (selectedContract) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => setSelectedContract(null)}
          className="mb-4"
        >
          ← Retour à la liste
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedContract.template.type === 'CGU_CGV' 
                ? 'Conditions Générales d\'Utilisation et de Vente' 
                : 'Contrat d\'Apporteur d\'Affaires'}
            </CardTitle>
            <p className="text-sm text-gray-500">
              Version {selectedContract.template.version} • {selectedContract.template.companyName}
            </p>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none mb-6 p-6 bg-gray-50 border rounded-lg max-h-[500px] overflow-y-auto prose-headings:text-gray-900 prose-h1:text-xl prose-h1:border-b prose-h1:pb-2 prose-h2:text-lg prose-h3:text-base prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:bg-amber-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:text-amber-800 prose-hr:my-4 prose-strong:text-gray-900 prose-li:my-0.5">
              <ReactMarkdown>
                {selectedContract.template.contractContent}
              </ReactMarkdown>
            </div>

            {selectedContract.status === 'SENT' && (
              <form onSubmit={handleSignContract} className="space-y-6 border-t pt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg text-blue-900 mb-1">Vos informations</h3>
                  <p className="text-sm text-blue-700">Ces informations seront intégrées au contrat. Les champs marqués * sont obligatoires.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nom complet / Raison sociale *</Label>
                    <Input
                      id="fullName"
                      value={signatureData.fullName}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Nom Prénom ou Raison sociale"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendorAddress">Adresse complète *</Label>
                    <Input
                      id="vendorAddress"
                      value={signatureData.vendorAddress}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, vendorAddress: e.target.value }))}
                      placeholder="Adresse complète"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendorPhone">Téléphone</Label>
                    <Input
                      id="vendorPhone"
                      value={signatureData.vendorPhone}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, vendorPhone: e.target.value }))}
                      placeholder="+33 6 XX XX XX XX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendorStatut">Statut *</Label>
                    <select
                      id="vendorStatut"
                      value={signatureData.vendorStatut}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, vendorStatut: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      required
                    >
                      <option value="">Sélectionnez votre statut</option>
                      <option value="Micro-entreprise">Micro-entreprise</option>
                      <option value="Entreprise individuelle">Entreprise individuelle</option>
                      <option value="Société">Société (SARL, SAS, etc.)</option>
                      <option value="Particulier">Particulier</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendorSIRET">SIRET (si applicable)</Label>
                    <Input
                      id="vendorSIRET"
                      value={signatureData.vendorSIRET}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, vendorSIRET: e.target.value }))}
                      placeholder="XXX XXX XXX XXXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendorTVA">Assujetti à la TVA</Label>
                    <select
                      id="vendorTVA"
                      value={signatureData.vendorTVA}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, vendorTVA: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="Non">Non</option>
                      <option value="Oui">Oui</option>
                    </select>
                  </div>

                  {signatureData.vendorTVA === 'Oui' && (
                    <div className="space-y-2">
                      <Label htmlFor="vendorTVANumber">N° TVA intracommunautaire</Label>
                      <Input
                        id="vendorTVANumber"
                        value={signatureData.vendorTVANumber}
                        onChange={(e) => setSignatureData(prev => ({ ...prev, vendorTVANumber: e.target.value }))}
                        placeholder="FRXX XXXXXXXXX"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="vendorCity">Ville de signature *</Label>
                    <Input
                      id="vendorCity"
                      value={signatureData.vendorCity}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, vendorCity: e.target.value }))}
                      placeholder="Paris"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={signatureData.acceptTerms}
                    onChange={(e) => setSignatureData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                    className="mt-1 h-4 w-4"
                  />
                  <label htmlFor="acceptTerms" className="text-sm">
                    <strong>Lu et approuvé, bon pour accord.</strong><br />
                    Je certifie avoir lu et compris l&apos;intégralité du contrat ci-dessus et j&apos;accepte sans réserve
                    tous ses termes et conditions. Je comprends que cette signature électronique a la même valeur
                    juridique qu&apos;une signature manuscrite conformément au règlement eIDAS.
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={signing || !signatureData.acceptTerms || !signatureData.vendorAddress || !signatureData.vendorStatut || !signatureData.vendorCity}
                    className="flex-1"
                  >
                    {signing ? 'Signature en cours...' : 'Signer électroniquement'}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleRejectContract(selectedContract.id)}
                  >
                    Rejeter
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  Votre signature sera horodatée et votre adresse IP sera enregistrée conformément
                  aux exigences légales de signature électronique (règlement eIDAS).
                </p>
              </form>
            )}

            {selectedContract.status === 'SIGNED' && (
              <div className="border-t pt-6">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-1">
                  <p className="font-semibold text-green-800">✓ Contrat signé</p>
                  <p className="text-sm text-green-700">
                    Signé le {new Date(selectedContract.signedAt!).toLocaleString('fr-FR')}
                  </p>
                  {selectedContract.vendorAddress && (
                    <p className="text-sm text-green-700">Adresse : {selectedContract.vendorAddress}</p>
                  )}
                  {selectedContract.vendorStatut && (
                    <p className="text-sm text-green-700">Statut : {selectedContract.vendorStatut}</p>
                  )}
                  {selectedContract.vendorSIRET && (
                    <p className="text-sm text-green-700">SIRET : {selectedContract.vendorSIRET}</p>
                  )}
                </div>
                <Button
                  className="mt-4"
                  onClick={() => {
                    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.vraisavis.fr'}/api/v1/vendor/contracts/${selectedContract.id}/pdf`, '_blank');
                  }}
                >
                  Télécharger le PDF signé
                </Button>
              </div>
            )}

            {selectedContract.status === 'REJECTED' && (
              <div className="border-t pt-6">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="font-semibold text-red-800">✗ Contrat rejeté</p>
                  <p className="text-sm text-red-700 mt-2">
                    Rejeté le {new Date(selectedContract.rejectedAt!).toLocaleString('fr-FR')}
                  </p>
                  {selectedContract.rejectionReason && (
                    <p className="text-sm text-red-700 mt-1">
                      Raison : {selectedContract.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Mes contrats</h1>

      <div className="grid gap-4">
        {contracts.map((contract) => (
          <Card key={contract.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>
                    {contract.template.type === 'CGU_CGV' 
                      ? 'CGU/CGV' 
                      : 'Contrat d\'Apporteur d\'Affaires'}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {contract.template.companyName} • Version {contract.template.version}
                  </p>
                </div>
                {getStatusBadge(contract.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {contract.sentAt && (
                  <p>
                    <span className="font-semibold">Envoyé le:</span>{' '}
                    {new Date(contract.sentAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
                {contract.signedAt && (
                  <p>
                    <span className="font-semibold">Signé le:</span>{' '}
                    {new Date(contract.signedAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
                {contract.status === 'SENT' && (
                  <div className="mt-4">
                    <Button onClick={() => handleViewContract(contract)}>
                      Consulter et signer
                    </Button>
                  </div>
                )}
                {contract.status === 'SIGNED' && (
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => handleViewContract(contract)}>
                      Consulter le contrat signé
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {contracts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Aucun contrat pour le moment.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
