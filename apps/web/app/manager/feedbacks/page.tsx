'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ThumbsUp, ThumbsDown, Search, X, ChevronDown, ChevronUp,
  Bell, BellOff, ChevronLeft, ChevronRight,
  Sun, Moon, Coffee, Filter, Loader2, CalendarDays, EyeOff,
} from 'lucide-react';

interface FingerprintInfo {
  wantNotifyOwn: boolean;
  wantNotifyOthers: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
}

interface ExclusionTag {
  ruleId: string;
  ruleLabel: string;
}

interface ExclusionRule {
  id: string;
  label: string;
  description: string;
  isActive: boolean;
}

interface Feedback {
  id: string;
  positiveText: string;
  negativeText: string | null;
  positiveRating: number | null;
  negativeRating: number | null;
  serviceType: string;
  isRead: boolean;
  isProcessed: boolean;
  createdAt: string;
  fingerprint?: FingerprintInfo;
  excludedByRules: ExclusionTag[];
}

type SentimentFilter = 'all' | 'positive' | 'negative';

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
  const [service, setService] = useState<string>('');
  const [wantsNotify, setWantsNotify] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Date range
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Exclusion filter
  const [exclusionFilter, setExclusionFilter] = useState('');
  const [exclusionRules, setExclusionRules] = useState<ExclusionRule[]>([]);
  const [showExclusionMenu, setShowExclusionMenu] = useState(false);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');
    if (search) params.set('search', search);
    if (sentiment !== 'all') params.set('sentiment', sentiment);
    if (service) params.set('service', service);
    if (wantsNotify) params.set('wantsNotify', 'true');
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (exclusionFilter) params.set('exclusionFilter', exclusionFilter);

    return params.toString();
  }, [page, search, sentiment, service, wantsNotify, dateFrom, dateTo, exclusionFilter]);

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

  // Load exclusion rules
  useEffect(() => {
    apiFetch('/api/v1/manager/exclusion-rules').then((data: unknown) => {
      const d = data as { rules: ExclusionRule[] };
      setExclusionRules(d.rules || []);
    }).catch(() => {});
  }, []);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setSentiment('all');
    setPage(1);
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
      <div>
        <h1 className="text-2xl font-bold">Avis clients</h1>
        <p className="text-sm text-muted-foreground">
          {totalAll} avis au total · {totalUnread} non lus
        </p>
      </div>

      {/* Satisfaction average */}
      {feedbacks.length > 0 && (() => {
        const rated = feedbacks.filter(f => f.positiveRating != null && f.negativeRating != null);
        if (rated.length === 0) return null;
        const avgPos = rated.reduce((s, f) => s + (f.positiveRating ?? 0), 0) / rated.length;
        const avgNeg = rated.reduce((s, f) => s + (f.negativeRating ?? 0), 0) / rated.length;
        return (
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-semibold text-green-700">{avgPos.toFixed(1)}/5</span>
              <span className="text-xs text-green-500">moy. positif</span>
            </div>
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
              <ThumbsDown className="h-4 w-4 text-red-400" />
              <span className="text-sm font-semibold text-red-600">{avgNeg.toFixed(1)}/5</span>
              <span className="text-xs text-red-400">moy. négatif</span>
            </div>
          </div>
        );
      })()}

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

      {/* Filter Bar */}
      <div className="space-y-3">
        {/* Date range */}
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
            />
            <span className="text-xs text-gray-400">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <div className="w-px h-6 bg-gray-200 self-center hidden sm:block" />

          {/* Quick date presets */}
          <div className="flex gap-1">
            <button
              onClick={() => {
                const d = new Date();
                setDateFrom(d.toISOString().split('T')[0]);
                setDateTo(d.toISOString().split('T')[0]);
                setPage(1);
              }}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 transition"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => {
                const d = new Date(); d.setDate(d.getDate() - 7);
                setDateFrom(d.toISOString().split('T')[0]);
                setDateTo(new Date().toISOString().split('T')[0]);
                setPage(1);
              }}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 transition"
            >
              7j
            </button>
            <button
              onClick={() => {
                const d = new Date(); d.setMonth(d.getMonth() - 1);
                setDateFrom(d.toISOString().split('T')[0]);
                setDateTo(new Date().toISOString().split('T')[0]);
                setPage(1);
              }}
              className="px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 transition"
            >
              30j
            </button>
          </div>
        </div>

        {/* Service + Notify chips */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-3.5 w-3.5 text-gray-400 shrink-0" />

          {/* Service */}
          <Chip active={service === ''} onClick={() => { setService(''); setPage(1); }}>Tous services</Chip>
          <Chip active={service === 'dejeuner'} onClick={() => { setService('dejeuner'); setPage(1); }}>
            <Sun className="h-3 w-3 inline mr-1" />Déjeuner
          </Chip>
          <Chip active={service === 'diner'} onClick={() => { setService('diner'); setPage(1); }}>
            <Moon className="h-3 w-3 inline mr-1" />Dîner
          </Chip>
          <Chip active={service === 'gouter'} onClick={() => { setService('gouter'); setPage(1); }}>
            <Coffee className="h-3 w-3 inline mr-1" />Goûter
          </Chip>

          <div className="w-px h-6 bg-gray-200 self-center hidden sm:block" />

          {/* Notify */}
          <Chip active={wantsNotify} onClick={() => { setWantsNotify(!wantsNotify); setPage(1); }}>
            <Bell className="h-3 w-3 inline mr-1" />Veulent être prévenus
          </Chip>

          {/* Exclusion filter */}
          {exclusionRules.length > 0 && (
            <>
              <div className="w-px h-6 bg-gray-200 self-center hidden sm:block" />
              <div className="relative">
                <button
                  onClick={() => setShowExclusionMenu(!showExclusionMenu)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    exclusionFilter
                      ? 'bg-orange-100 text-orange-700 border border-orange-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <EyeOff className="h-3 w-3" />
                  Exclusions
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showExclusionMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[220px] py-1">
                    <button
                      onClick={() => { setExclusionFilter(''); setShowExclusionMenu(false); setPage(1); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${!exclusionFilter ? 'font-bold text-blue-600' : ''}`}
                    >
                      Tout afficher
                    </button>
                    <button
                      onClick={() => { setExclusionFilter('hide_all'); setShowExclusionMenu(false); setPage(1); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${exclusionFilter === 'hide_all' ? 'font-bold text-blue-600' : ''}`}
                    >
                      Masquer tous les exclus
                    </button>
                    <button
                      onClick={() => { setExclusionFilter('only_excluded'); setShowExclusionMenu(false); setPage(1); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${exclusionFilter === 'only_excluded' ? 'font-bold text-blue-600' : ''}`}
                    >
                      Uniquement les exclus
                    </button>
                    {exclusionRules.length > 0 && (
                      <div className="border-t my-1" />
                    )}
                    {exclusionRules.map(rule => (
                      <button
                        key={rule.id}
                        onClick={() => { setExclusionFilter(`hide:${rule.id}`); setShowExclusionMenu(false); setPage(1); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${exclusionFilter === `hide:${rule.id}` ? 'font-bold text-blue-600' : ''}`}
                      >
                        Masquer : {rule.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Sentiment: only visible when search is active */}
          {search && (
            <>
              <div className="w-px h-6 bg-gray-200 self-center hidden sm:block" />
              <span className="text-xs text-gray-400">Chercher dans :</span>
              <Chip active={sentiment === 'all'} onClick={() => { setSentiment('all'); setPage(1); }}>Tout</Chip>
              <Chip active={sentiment === 'positive'} onClick={() => { setSentiment('positive'); setPage(1); }}>
                👍 Positifs
              </Chip>
              <Chip active={sentiment === 'negative'} onClick={() => { setSentiment('negative'); setPage(1); }}>
                👎 Négatifs
              </Chip>
            </>
          )}
        </div>
      </div>

      {/* Active filters summary */}
      {(search || sentiment !== 'all' || dateFrom || dateTo || service || wantsNotify) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{total} résultat(s)</span>
          <button
            onClick={() => {
              setSearch(''); setSearchInput(''); setSentiment('all');
              setDateFrom(''); setDateTo(''); setService(''); setWantsNotify(false); setPage(1);
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
          <div className="hidden md:grid md:grid-cols-[100px_1fr_1fr_60px_80px_40px] gap-2 px-4 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
            <span>Date</span>
            <span>👍 Positif</span>
            <span>👎 Négatif</span>
            <span>Notes</span>
            <span>Service</span>
            <span></span>
          </div>

          {feedbacks.map((fb, i) => {
            const isExpanded = expandedId === fb.id;
            const hasNotify = wantsNotifyBadge(fb.fingerprint);
            const isExcluded = fb.excludedByRules && fb.excludedByRules.length > 0;

            return (
              <div key={fb.id}>
                {/* Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                  className={`grid grid-cols-1 md:grid-cols-[100px_1fr_1fr_60px_80px_40px] gap-1 md:gap-2 px-4 py-3 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                    isExcluded ? 'opacity-60' : ''
                  } ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
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
                    {isExcluded && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700 border border-orange-200 md:mt-1">
                        <EyeOff className="h-2.5 w-2.5" />Exclu
                      </span>
                    )}
                    {/* Mobile: badges inline */}
                    <div className="flex gap-1 md:hidden ml-auto">
                      <Badge variant={fb.serviceType === 'dejeuner' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                        {fb.serviceType === 'dejeuner' ? '☀️' : fb.serviceType === 'diner' ? '🌙' : '☕'}
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

                  {/* Ratings (desktop) */}
                  <div className="hidden md:flex items-center gap-1">
                    {fb.positiveRating != null && (
                      <span className="text-xs font-semibold text-green-600">{fb.positiveRating}</span>
                    )}
                    {fb.positiveRating != null && fb.negativeRating != null && (
                      <span className="text-xs text-gray-300">/</span>
                    )}
                    {fb.negativeRating != null && (
                      <span className="text-xs font-semibold text-red-500">{fb.negativeRating}</span>
                    )}
                    {fb.positiveRating == null && fb.negativeRating == null && (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>

                  {/* Service (desktop) */}
                  <div className="hidden md:flex items-center">
                    <Badge variant={fb.serviceType === 'dejeuner' ? 'default' : 'secondary'} className="text-[10px]">
                      {fb.serviceType === 'dejeuner' ? 'Déjeuner' : fb.serviceType === 'diner' ? 'Dîner' : fb.serviceType === 'gouter' ? 'Goûter' : fb.serviceType}
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
                        <div className="flex items-center gap-2 mb-1">
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-semibold text-green-700">Positif</span>
                          {fb.positiveRating != null && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">{fb.positiveRating}/5</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{fb.positiveText}</p>
                      </div>
                      {fb.negativeText && (
                        <div className="bg-red-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <ThumbsDown className="h-4 w-4 text-red-400" />
                            <span className="text-xs font-semibold text-red-600">À améliorer</span>
                            {fb.negativeRating != null && (
                              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{fb.negativeRating}/5</span>
                            )}
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
                    {isExcluded && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 mb-1">
                          <EyeOff className="h-3.5 w-3.5" /> Avis exclu
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {fb.excludedByRules.map((rule) => (
                            <span key={rule.ruleId} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-orange-100 text-orange-800 border border-orange-200">
                              {rule.ruleLabel}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
