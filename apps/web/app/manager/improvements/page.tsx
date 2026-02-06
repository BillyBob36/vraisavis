'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search, ThumbsDown, Bell, Loader2, Send, Sparkles, CheckCircle2, Clock,
} from 'lucide-react';

interface Improvement {
  id: string;
  description: string;
  matchedFeedbackIds: string[];
  status: string;
  notifiedCount: number;
  createdAt: string;
}

interface MatchedFeedback {
  id: string;
  negativeText: string | null;
  positiveText: string;
  createdAt: string;
  serviceType: string;
  wantsNotify: boolean;
}

export default function ImprovementsPage() {
  const [improvementText, setImprovementText] = useState('');
  const [improvementLoading, setImprovementLoading] = useState(false);
  const [matchedFeedbacks, setMatchedFeedbacks] = useState<MatchedFeedback[]>([]);
  const [currentImprovement, setCurrentImprovement] = useState<Improvement | null>(null);
  const [notifiableCount, setNotifiableCount] = useState(0);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyResult, setNotifyResult] = useState<string | null>(null);

  // History
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await apiFetch('/api/v1/manager/improvements') as { improvements: Improvement[] };
      setImprovements(data.improvements || []);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!improvementText.trim()) return;
    setImprovementLoading(true);
    setMatchedFeedbacks([]);
    setCurrentImprovement(null);
    setNotifyResult(null);
    try {
      const data = await apiFetch('/api/v1/manager/improvements', {
        method: 'POST',
        body: JSON.stringify({ description: improvementText }),
      }) as {
        improvement: Improvement;
        matchedFeedbacks: MatchedFeedback[];
        notifiableCount: number;
      };
      setCurrentImprovement(data.improvement);
      setMatchedFeedbacks(data.matchedFeedbacks);
      setNotifiableCount(data.notifiableCount);
      loadHistory();
    } catch (error) {
      console.error('Erreur analyse:', error);
    } finally {
      setImprovementLoading(false);
    }
  };

  const handleNotify = async () => {
    if (!currentImprovement) return;
    setNotifyLoading(true);
    try {
      const data = await apiFetch(`/api/v1/manager/improvements/${currentImprovement.id}/notify`, {
        method: 'POST',
      }) as { message: string; notifiedCount: number };
      setNotifyResult(data.message);
      loadHistory();
    } catch (error) {
      console.error('Erreur notification:', error);
      setNotifyResult('Erreur lors de l\'envoi des notifications');
    } finally {
      setNotifyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Améliorations</h1>
        <p className="text-sm text-muted-foreground">
          Signalez vos améliorations et notifiez les clients concernés
        </p>
      </div>

      {/* Analyze Section */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Déclarer une amélioration</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Décrivez ce que vous avez amélioré. L&apos;IA va chercher les commentaires négatifs liés et proposer de notifier les clients concernés.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={improvementText}
              onChange={(e) => setImprovementText(e.target.value)}
              placeholder="Ex: Nous avons changé les chaises, amélioré la carte..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button
              onClick={handleAnalyze}
              disabled={improvementLoading || !improvementText.trim()}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-40 flex items-center gap-1"
            >
              {improvementLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Analyser
            </button>
          </div>

          {matchedFeedbacks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {matchedFeedbacks.length} commentaire(s) correspondant(s)
                </p>
                {notifiableCount > 0 && !notifyResult && (
                  <button
                    onClick={handleNotify}
                    disabled={notifyLoading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-40"
                  >
                    {notifyLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Notifier {notifiableCount} client(s)
                  </button>
                )}
              </div>

              {notifyResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  {notifyResult}
                </div>
              )}

              <div className="max-h-60 overflow-y-auto space-y-1">
                {matchedFeedbacks.map((f) => (
                  <div key={f.id} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg text-xs">
                    <ThumbsDown className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-gray-700 flex-1">{f.negativeText}</span>
                    {f.wantsNotify && <Bell className="h-3 w-3 text-violet-500 shrink-0 mt-0.5" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!improvementLoading && matchedFeedbacks.length === 0 && currentImprovement && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Aucun commentaire négatif ne correspond à cette amélioration.
            </p>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Historique</h2>
        {historyLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : improvements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              Aucune amélioration déclarée pour le moment
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {improvements.map((imp) => (
              <Card key={imp.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  {imp.status === 'NOTIFIED' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{imp.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(imp.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {' · '}
                      {(imp.matchedFeedbackIds as string[]).length} avis liés
                      {imp.status === 'NOTIFIED' && ` · ${imp.notifiedCount} client(s) notifié(s)`}
                    </p>
                  </div>
                  {imp.status === 'NOTIFIED' ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">Notifié</span>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">En attente</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
