'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch, getToken } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Share2 } from 'lucide-react';

interface ReferralData {
  referralCode: string;
  referralLink: string;
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
    if (navigator.share && data) {
      try {
        await navigator.share({
          title: 'FoodBack - Inscription',
          text: 'Inscrivez votre restaurant sur FoodBack !',
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
