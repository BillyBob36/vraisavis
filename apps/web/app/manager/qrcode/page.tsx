'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { QrCode, Download, RefreshCw, Copy, ExternalLink } from 'lucide-react';

export default function QRCodePage() {
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [clientUrl, setClientUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    try {
      const data = await apiFetch('/api/v1/manager/restaurant') as { restaurant: { id: string; qrCodeUrl: string | null } };
      setQrCodeUrl(data.restaurant?.qrCodeUrl || null);
      if (data.restaurant?.id) {
        setClientUrl(`${window.location.origin}/r/${data.restaurant.id}`);
      }
    } catch (error) {
      console.error('Erreur chargement QR:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    setGenerating(true);
    try {
      const data = await apiFetch('/api/v1/manager/restaurant/qrcode', { method: 'POST' }) as { qrCodeUrl: string; url: string };
      setQrCodeUrl(data.qrCodeUrl);
      setClientUrl(data.url);
      toast({ title: 'QR Code généré !' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'qrcode-vraisavis.png';
    link.click();
  };

  const copyUrl = () => {
    if (!clientUrl) return;
    navigator.clipboard.writeText(clientUrl);
    toast({ title: 'Lien copié !' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">QR Code</h1>
        <p className="text-muted-foreground">Affichez ce QR Code dans votre restaurant</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Votre QR Code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            {qrCodeUrl ? (
              <>
                <div className="bg-white p-4 rounded-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={downloadQRCode}>
                    <Download className="h-4 w-4 mr-2" /> Télécharger
                  </Button>
                  <Button variant="outline" onClick={generateQRCode} disabled={generating}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                    Régénérer
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <QrCode className="h-24 w-24 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Aucun QR Code généré</p>
                <Button onClick={generateQRCode} disabled={generating}>
                  {generating ? 'Génération...' : 'Générer le QR Code'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lien de participation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientUrl ? (
              <>
                <div className="p-3 bg-muted rounded-lg break-all text-sm">
                  {clientUrl}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyUrl}>
                    <Copy className="h-4 w-4 mr-2" /> Copier
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={clientUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" /> Ouvrir
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Générez d'abord un QR Code</p>
            )}

            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Comment utiliser ?</h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Téléchargez et imprimez le QR Code</li>
                <li>Affichez-le sur vos tables ou à la caisse</li>
                <li>Vos clients scannent et laissent leur avis</li>
                <li>Ils tentent leur chance à la machine à sous</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
