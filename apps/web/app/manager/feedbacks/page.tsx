'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ThumbsUp, ThumbsDown, Search, X, ChevronDown, ChevronUp,
  Bell, BellOff, Send, Sparkles, ChevronLeft, ChevronRight,
  Sun, Moon, Filter, Loader2,
} from 'lucide-react';

interface FingerprintInfo {
  wantNotifyOwn: boolean;
  wantNotifyOthers: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
}

interface Feedback {
  id: string;
  positiveText: string;
  negativeText: string | null;
  serviceType: string;
  isRead: boolean;
  isProcessed: boolean;
  createdAt: string;
  fingerprint?: FingerprintInfo;
}

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

type SentimentFilter = 'all' | 'positive' | 'negative';
type PeriodFilter = 'all' | 'today' | 'week' | 'month';

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAll, setTotalAll] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sentiment, setSentiment] = useState<SentimentFilter>('all');
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [service, setService] = useState<string>('');
  const [wantsNotify, setWantsNotify] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Improvements
  const [showImprovement, setShowImprovement] = useState(false);
  const [improvementText, setImprovementText] = useState('');
  const [improvementLoading, setImprovementLoading] = useState(false);
  const [matchedFeedbacks, setMatchedFeedbacks] = useState<MatchedFeedback[]>([]);
  const [currentImprovement, setCurrentImprovement] = useState<Improvement | null>(null);
  const [notifiableCount, setNotifiableCount] = useState(0);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyResult, setNotifyResult] = useState<string | null>(null);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');
    if (search) params.set('search', search);
    if (sentiment !== 'all') params.set('sentiment', sentiment);
    if (service) params.set('service', service);
    if (wantsNotify) params.set('wantsNotify', 'true');

    if (period === 'today') {
      params.set('dateFrom', new Date().toISOString().split('T')[0]);
    } else if (period === 'week') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      params.set('dateFrom', d.toISOString().split('T')[0]);
    } else if (period === 'month') {
      const d = new Date(); d.setDate(d.getDate() - 30);
      params.set('dateFrom', d.toISOString().split('T')[0]);
    }

    return params.toString();
  }, [page, search, sentiment, service, wantsNotify, period]);

  const loadFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const query = buildQuery();
      const data = await apiFetch(`/api/v1/manager/feedbacks?${query}`) as {
        feedbacks: Feedback[];
        pagination: { total: number; pages: number };
        stats: { totalAll: number; totalUnread: number };
      };
      setFeedbacks(data.feedbacks || []);
      setTotal(data.pagination.total);
      setPages(data.pagination.pages);
      setTotalAll(data.stats.totalAll);
      setTotalUnread(data.stats.totalUnread);
    } catch (error) {
      console.error('Erreur chargement feedbacks:', error);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { loadFeedbacks(); }, [loadFeedbacks]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
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
    } catch (error) {
      console.error('Erreur notification:', error);
      setNotifyResult('Erreur lors de l\'envoi des notifications');
    } finally {
      setNotifyLoading(false);
    }
  };

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + '…' : text;

  const wantsNotifyBadge = (fp?: FingerprintInfo) =>
    fp && (fp.wantNotifyOwn || fp.wantNotifyOthers) && (fp.contactEmail || fp.contactPhone);

  // Chip component
  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Header + Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Avis clients</h1>
          <p className="text-sm text-muted-foreground">
            {totalAll} avis au total · {totalUnread} non lus
          </p>
        </div>
        <button
          onClick={() => setShowImprovement(!showImprovement)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showImprovement
              ? 'bg-violet-100 text-violet-700 border border-violet-200'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Mes améliorations
        </button>
      </div>

      {/* Improvement Section */}
      {showImprovement && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Décrivez votre amélioration</label>
              <p className="text-xs text-muted-foreground mb-2">
                L'IA va chercher les commentaires négatifs liés et proposer de notifier les clients concernés.
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
                    ✅ {notifyResult}
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

            {improvementLoading === false && matchedFeedbacks.length === 0 && currentImprovement && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Aucun commentaire négatif ne correspond à cette amélioration.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Rechercher dans les avis..."
            className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
          />
          {searchInput && (
            <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {/* Period */}
        <div className="flex gap-1 items-center">
          <Filter className="h-3 w-3 text-gray-400" />
          <Chip active={period === 'all'} onClick={() => { setPeriod('all'); setPage(1); }}>Tout</Chip>
          <Chip active={period === 'today'} onClick={() => { setPeriod('today'); setPage(1); }}>Aujourd'hui</Chip>
          <Chip active={period === 'week'} onClick={() => { setPeriod('week'); setPage(1); }}>7 jours</Chip>
          <Chip active={period === 'month'} onClick={() => { setPeriod('month'); setPage(1); }}>30 jours</Chip>
        </div>

        <div className="w-px h-6 bg-gray-200 self-center hidden sm:block" />

        {/* Sentiment */}
        <Chip active={sentiment === 'all'} onClick={() => { setSentiment('all'); setPage(1); }}>Tous</Chip>
        <Chip active={sentiment === 'positive'} onClick={() => { setSentiment('positive'); setPage(1); }}>
          👍 Positifs
        </Chip>
        <Chip active={sentiment === 'negative'} onClick={() => { setSentiment('negative'); setPage(1); }}>
          👎 Négatifs
        </Chip>

        <div className="w-px h-6 bg-gray-200 self-center hidden sm:block" />

        {/* Service */}
        <Chip active={service === ''} onClick={() => { setService(''); setPage(1); }}>Tous services</Chip>
        <Chip active={service === 'lunch'} onClick={() => { setService('lunch'); setPage(1); }}>
          <Sun className="h-3 w-3 inline mr-1" />Déjeuner
        </Chip>
        <Chip active={service === 'dinner'} onClick={() => { setService('dinner'); setPage(1); }}>
          <Moon className="h-3 w-3 inline mr-1" />Dîner
        </Chip>

        <div className="w-px h-6 bg-gray-200 self-center hidden sm:block" />

        {/* Notify */}
        <Chip active={wantsNotify} onClick={() => { setWantsNotify(!wantsNotify); setPage(1); }}>
          <Bell className="h-3 w-3 inline mr-1" />Veulent être prévenus
        </Chip>
      </div>

      {/* Active filters summary */}
      {(search || sentiment !== 'all' || period !== 'all' || service || wantsNotify) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{total} résultat(s)</span>
          <button
            onClick={() => {
              setSearch(''); setSearchInput(''); setSentiment('all');
              setPeriod('all'); setService(''); setWantsNotify(false); setPage(1);
            }}
            className="text-blue-600 hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Feedbacks Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : feedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun avis ne correspond à vos filtres
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white">
          {/* Desktop header */}
          <div className="hidden md:grid md:grid-cols-[100px_1fr_1fr_80px_40px] gap-2 px-4 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
            <span>Date</span>
            <span>👍 Positif</span>
            <span>👎 Négatif</span>
            <span>Service</span>
            <span></span>
          </div>

          {feedbacks.map((fb, i) => {
            const isExpanded = expandedId === fb.id;
            const hasNotify = wantsNotifyBadge(fb.fingerprint);

            return (
              <div key={fb.id}>
                {/* Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                  className={`grid grid-cols-1 md:grid-cols-[100px_1fr_1fr_80px_40px] gap-1 md:gap-2 px-4 py-3 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  } ${!fb.isRead ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                >
                  {/* Date */}
                  <div className="flex items-center gap-2 md:block">
                    <span className="text-xs text-gray-500">
                      {new Date(fb.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className="text-xs text-gray-400 md:block">
                      {new Date(fb.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {/* Mobile: badges inline */}
                    <div className="flex gap-1 md:hidden ml-auto">
                      <Badge variant={fb.serviceType === 'lunch' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                        {fb.serviceType === 'lunch' ? '☀️' : '🌙'}
                      </Badge>
                      {hasNotify && (
                        <span className="text-violet-500"><Bell className="h-3 w-3" /></span>
                      )}
                    </div>
                  </div>

                  {/* Positive */}
                  <div className="flex items-start gap-1.5">
                    <ThumbsUp className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5 hidden md:block" />
                    <span className="text-sm text-gray-700 line-clamp-1 md:line-clamp-1">
                      <span className="md:hidden text-green-500 mr-1">👍</span>
                      {isExpanded ? fb.positiveText : truncate(fb.positiveText, 80)}
                    </span>
                  </div>

                  {/* Negative */}
                  <div className="flex items-start gap-1.5">
                    {fb.negativeText ? (
                      <>
                        <ThumbsDown className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5 hidden md:block" />
                        <span className="text-sm text-gray-500 line-clamp-1 md:line-clamp-1">
                          <span className="md:hidden text-red-400 mr-1">👎</span>
                          {isExpanded ? fb.negativeText : truncate(fb.negativeText, 80)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-300 italic">—</span>
                    )}
                  </div>

                  {/* Service (desktop) */}
                  <div className="hidden md:flex items-center">
                    <Badge variant={fb.serviceType === 'lunch' ? 'default' : 'secondary'} className="text-[10px]">
                      {fb.serviceType === 'lunch' ? 'Déjeuner' : 'Dîner'}
                    </Badge>
                  </div>

                  {/* Notify + expand (desktop) */}
                  <div className="hidden md:flex items-center gap-1">
                    {hasNotify && (
                      <Bell className="h-3.5 w-3.5 text-violet-500" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-blue-50/30 border-b space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-semibold text-green-700">Positif</span>
                        </div>
                        <p className="text-sm text-gray-700">{fb.positiveText}</p>
                      </div>
                      {fb.negativeText && (
                        <div className="bg-red-50 rounded-lg p-3">
                          <div className="flex items-center gap-1 mb-1">
                            <ThumbsDown className="h-4 w-4 text-red-400" />
                            <span className="text-xs font-semibold text-red-600">À améliorer</span>
                          </div>
                          <p className="text-sm text-gray-700">{fb.negativeText}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      {hasNotify ? (
                        <span className="flex items-center gap-1 text-violet-600">
                          <Bell className="h-3 w-3" /> Souhaite être prévenu(e)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <BellOff className="h-3 w-3" /> Ne souhaite pas être prévenu(e)
                        </span>
                      )}
                      <span>·</span>
                      <span>{fb.isRead ? 'Lu' : 'Non lu'}</span>
                      <span>·</span>
                      <span>{fb.isProcessed ? 'Traité' : 'Non traité'}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} sur {pages} — {total} résultat(s)
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(pages, page + 1))}
              disabled={page >= pages}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
