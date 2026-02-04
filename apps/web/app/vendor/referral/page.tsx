'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch, getToken } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Share2, AlertCircle, Clock, FileText } from 'lucide-react';
import Link from 'next/link';

interface ReferralData {
  referralCode: string | null;
  referralLink: string | null;
  isValidated: boolean;
  contractStatus: 'NONE' | 'SENT' | 'SIGNED' | 'REJECTED';
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReferral = async () => {
      try {
        const token = getToken();
        const result = await apiFetch<ReferralData>('/api/v1/vendor/referral-link', { token: token || '' });
        setData(result);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferral();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copié !',
      description: `${label} copié dans le presse-papier`,
    });
  };

  const shareLink = async () => {
    if (navigator.share && data && data.referralLink) {
      try {
        await navigator.share({
          title: 'VraisAvis - Inscription',
          text: 'Inscrivez votre restaurant sur VraisAvis !',
          url: data.referralLink,
        });
      } catch (error) {
        console.error('Erreur partage:', error);
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  // Si le vendeur n'est pas validé, afficher un message d'attente
  if (!data?.isValidated) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Lien de parrainage</h1>

        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-amber-100">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle>Lien de parrainage non disponible</CardTitle>
                <CardDescription>
                  Votre compte doit être validé pour accéder à votre lien de parrainage
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Étapes requises
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-amber-700">
                {data?.contractStatus === 'SIGNED' ? (
                  <>
                    <li className="line-through text-green-600">✓ Contrat signé</li>
                    <li className="font-semibold">Attendre la validation par l&apos;administrateur</li>
                  </>
                ) : data?.contractStatus === 'REJECTED' ? (
                  <li className="text-red-600">Votre contrat a été rejeté. Veuillez contacter l&apos;administrateur.</li>
                ) : (
                  <>
                    <li className="font-semibold">
                      Signer votre contrat de partenariat
                      {data?.contractStatus === 'SENT' && (
                        <Link href="/vendor/contracts" className="ml-2 text-blue-600 underline">
                          → Voir le contrat
                        </Link>
                      )}
                    </li>
                    <li>Attendre la validation par l&apos;administrateur</li>
                  </>
                )}
              </ol>
            </div>

            {data?.contractStatus === 'SENT' && (
              <Link href="/vendor/contracts">
                <Button className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Signer mon contrat
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vendeur validé - afficher le lien de parrainage
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Lien de parrainage</h1>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Votre code parrainage</CardTitle>
            <CardDescription>
              Partagez ce code avec vos prospects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                value={data?.referralCode || ''} 
                readOnly 
                className="font-mono text-lg"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(data?.referralCode || '', 'Code')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lien d&apos;inscription</CardTitle>
            <CardDescription>
              Les restaurants qui s&apos;inscrivent via ce lien seront liés à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={data?.referralLink || ''} 
                readOnly 
                className="text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(data?.referralLink || '', 'Lien')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            {'share' in navigator && (
              <Button onClick={shareLink} className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Partager le lien
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comment ça marche ?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Partagez votre lien avec un restaurateur</li>
              <li>Il s&apos;inscrit via votre lien</li>
              <li>Son restaurant est automatiquement lié à votre compte</li>
              <li>Quand il passe à un abonnement payant, vous recevez votre commission</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
