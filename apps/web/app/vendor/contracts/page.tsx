'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface VendorContract {
  id: string;
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'REJECTED';
  vendorName: string;
  vendorEmail: string;
  vendorAddress?: string;
  vendorSIRET?: string;
  vendorIBAN?: string;
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
    vendorSIRET: '',
    vendorIBAN: '',
    acceptTerms: false,
    fullName: '',
  });

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const response = await apiFetch('/vendor/contracts');
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
      const response = await apiFetch(`/vendor/contracts/${contract.id}`);
      setSelectedContract(response.contract);
      setSignatureData({
        vendorAddress: response.contract.vendorAddress || '',
        vendorSIRET: response.contract.vendorSIRET || '',
        vendorIBAN: response.contract.vendorIBAN || '',
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
      
      await apiFetch('/vendor/contracts/sign', {
        method: 'POST',
        body: JSON.stringify({
          contractId: selectedContract.id,
          vendorAddress: signatureData.vendorAddress,
          vendorSIRET: signatureData.vendorSIRET,
          vendorIBAN: signatureData.vendorIBAN,
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
      await apiFetch(`/vendor/contracts/${contractId}/reject`, {
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
            <div className="prose max-w-none mb-6 p-4 bg-gray-50 rounded max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">
                {selectedContract.template.contractContent}
              </pre>
            </div>

            {selectedContract.status === 'SENT' && (
              <form onSubmit={handleSignContract} className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg">Informations pour la signature</h3>

                <div className="space-y-2">
                  <Label htmlFor="vendorAddress">Adresse complète</Label>
                  <Input
                    id="vendorAddress"
                    value={signatureData.vendorAddress}
                    onChange={(e) => setSignatureData(prev => ({ ...prev, vendorAddress: e.target.value }))}
                    placeholder="Adresse complète"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorSIRET">SIRET (optionnel)</Label>
                  <Input
                    id="vendorSIRET"
                    value={signatureData.vendorSIRET}
                    onChange={(e) => setSignatureData(prev => ({ ...prev, vendorSIRET: e.target.value }))}
                    placeholder="Numéro SIRET si applicable"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorIBAN">IBAN pour versement des commissions</Label>
                  <Input
                    id="vendorIBAN"
                    value={signatureData.vendorIBAN}
                    onChange={(e) => setSignatureData(prev => ({ ...prev, vendorIBAN: e.target.value }))}
                    placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet pour signature</Label>
                  <Input
                    id="fullName"
                    value={signatureData.fullName}
                    onChange={(e) => setSignatureData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex items-start space-x-2 p-4 bg-yellow-50 rounded">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={signatureData.acceptTerms}
                    onChange={(e) => setSignatureData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                    className="mt-1"
                  />
                  <label htmlFor="acceptTerms" className="text-sm">
                    <strong>Lu et approuvé, bon pour accord.</strong><br />
                    Je certifie avoir lu et compris l'intégralité du contrat ci-dessus et j'accepte sans réserve 
                    tous ses termes et conditions. Je comprends que cette signature électronique a la même valeur 
                    juridique qu'une signature manuscrite.
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={signing || !signatureData.acceptTerms}>
                    {signing ? 'Signature en cours...' : 'Signer électroniquement'}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleRejectContract(selectedContract.id)}
                  >
                    Rejeter le contrat
                  </Button>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  Votre signature sera horodatée et votre adresse IP sera enregistrée conformément 
                  aux exigences légales de signature électronique.
                </p>
              </form>
            )}

            {selectedContract.status === 'SIGNED' && (
              <div className="border-t pt-6">
                <div className="bg-green-50 p-4 rounded">
                  <p className="font-semibold text-green-800">✓ Contrat signé</p>
                  <p className="text-sm text-green-700 mt-2">
                    Signé le {new Date(selectedContract.signedAt!).toLocaleString('fr-FR')}
                  </p>
                  {selectedContract.vendorAddress && (
                    <p className="text-sm text-green-700 mt-1">
                      Adresse: {selectedContract.vendorAddress}
                    </p>
                  )}
                  {selectedContract.vendorSIRET && (
                    <p className="text-sm text-green-700 mt-1">
                      SIRET: {selectedContract.vendorSIRET}
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedContract.status === 'REJECTED' && (
              <div className="border-t pt-6">
                <div className="bg-red-50 p-4 rounded">
                  <p className="font-semibold text-red-800">✗ Contrat rejeté</p>
                  <p className="text-sm text-red-700 mt-2">
                    Rejeté le {new Date(selectedContract.rejectedAt!).toLocaleString('fr-FR')}
                  </p>
                  {selectedContract.rejectionReason && (
                    <p className="text-sm text-red-700 mt-1">
                      Raison: {selectedContract.rejectionReason}
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
