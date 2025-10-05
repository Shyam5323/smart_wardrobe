"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ApiError,
  OutfitCombination,
  OutfitCombinationsResponse,
  NextPurchaseSuggestion,
  NextPurchaseResponse,
  WeatherAwareOutfitResponse,
  fetchOutfitCombinations,
  fetchNextPurchaseIdeas,
  fetchWeatherAwareOutfit,
} from '@/lib/api';
import { RefreshCw, Sparkles, ThermometerSun, ShoppingBag, Shirt } from 'lucide-react';

type TabKey = 'combinations' | 'next-purchase' | 'weather-outfit';

type StyleAdvisorPanelProps = {
  onSelectItem?: (id: string) => Promise<void> | void;
};

const TAB_METADATA: Record<TabKey, { label: string; description: string; icon: ReactNode }> = {
  combinations: {
    label: 'Smart outfits',
    description: 'AI-curated looks built from your wardrobe.',
    icon: <Shirt className="h-4 w-4" />,
  },
  'next-purchase': {
    label: 'Next buy intel',
    description: 'Fill wardrobe gaps with strategic additions.',
    icon: <ShoppingBag className="h-4 w-4" />,
  },
  'weather-outfit': {
    label: 'Weather fit',
    description: 'Dress for today using pieces you own.',
    icon: <ThermometerSun className="h-4 w-4" />,
  },
};

const formatDateLabel = (iso?: string | null) => {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString(undefined, {
    hour: 'numeric',
    minute: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const StyleAdvisorPanel = ({ onSelectItem }: StyleAdvisorPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>('combinations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [combinationData, setCombinationData] = useState<OutfitCombinationsResponse | null>(null);
  const [nextPurchaseData, setNextPurchaseData] = useState<NextPurchaseResponse | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherAwareOutfitResponse | null>(null);

  const fetchData = useCallback(
    async (tab: TabKey, force = false) => {
      if (!force) {
        if (tab === 'combinations' && combinationData) return;
        if (tab === 'next-purchase' && nextPurchaseData) return;
        if (tab === 'weather-outfit' && weatherData) return;
      }

      setLoading(true);
      setError(null);

      try {
        if (tab === 'combinations') {
          const result = await fetchOutfitCombinations();
          setCombinationData(result);
        } else if (tab === 'next-purchase') {
          const result = await fetchNextPurchaseIdeas();
          setNextPurchaseData(result);
        } else if (tab === 'weather-outfit') {
          const result = await fetchWeatherAwareOutfit();
          setWeatherData(result);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unable to fetch style insights right now.');
        }
      } finally {
        setLoading(false);
      }
    },
    [combinationData, nextPurchaseData, weatherData]
  );

  useEffect(() => {
    void fetchData(activeTab);
  }, [activeTab, fetchData]);

  const handleRefresh = useCallback(() => {
    void fetchData(activeTab, true);
  }, [activeTab, fetchData]);

  const meta = useMemo(() => {
    if (activeTab === 'combinations') return combinationData?.meta ?? null;
    if (activeTab === 'next-purchase') return nextPurchaseData?.meta ?? null;
    if (activeTab === 'weather-outfit') return weatherData?.meta ?? null;
    return null;
  }, [activeTab, combinationData, nextPurchaseData, weatherData]);

  const generatedAtLabel = formatDateLabel(meta?.generatedAt);

  const renderCombinations = (combinations: OutfitCombination[]) => {
    if (!combinations.length) {
      return <p className="text-sm text-slate-400">Upload a few pieces to see full outfits.</p>;
    }

    return (
      <ul className="space-y-6">
        {combinations.map((combo, index) => (
          <li
            key={`${combo.title}-${index}`}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{combo.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{combo.summary}</p>
              </div>
              {combo.occasion && (
                <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
                  {combo.occasion}
                </span>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pieces</p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {combo.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-100">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        {[item.category, item.color].filter(Boolean).join(' • ') || 'Wardrobe staple'}
                      </p>
                      {item.reason && (
                        <p className="mt-1 text-xs text-slate-500">{item.reason}</p>
                      )}
                    </div>
                    {onSelectItem && (
                      <button
                        type="button"
                        onClick={() => {
                          void onSelectItem(item.id);
                        }}
                        className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-indigo-400 hover:text-indigo-200"
                      >
                        View
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {combo.stylingTips.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Styling tips</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                  {combo.stylingTips.map((tip, tipIndex) => (
                    <li key={tipIndex}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const renderNextPurchases = (recommendations: NextPurchaseSuggestion[]) => {
    if (!recommendations.length) {
      return <p className="text-sm text-slate-400">AI will highlight smart additions once you add more wardrobe data.</p>;
    }

    return (
      <ul className="space-y-6">
        {recommendations.map((rec, index) => (
          <li
            key={`${rec.title}-${index}`}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20"
          >
            <h3 className="text-lg font-semibold text-slate-100">{rec.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{rec.rationale}</p>

            {rec.currentGaps.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current gaps</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                  {rec.currentGaps.map((gap, gapIndex) => (
                    <li key={gapIndex}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {rec.suggestedItems.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Consider</p>
                <ul className="space-y-2">
                  {rec.suggestedItems.map((suggestion, suggestionIndex) => (
                    <li
                      key={`${suggestion.name}-${suggestionIndex}`}
                      className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                    >
                      <p className="text-sm font-medium text-slate-100">{suggestion.name}</p>
                      <p className="text-xs text-slate-400">
                        {suggestion.category ? `Category: ${suggestion.category}` : 'Versatile staple'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{suggestion.reason}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-3 text-xs text-slate-400">{rec.budgetThoughts}</p>
          </li>
        ))}
      </ul>
    );
  };

  const renderWeatherOutfit = (response: WeatherAwareOutfitResponse) => {
    if (!response) {
      return <p className="text-sm text-slate-400">Checking the forecast…</p>;
    }

    const { outfit, weather } = response;

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">{outfit.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{outfit.summary}</p>
            </div>
            <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200">
              <p>{weather.location}</p>
              <p className="text-xs text-indigo-100/80">
                {weather.temperatureC !== null ? `${Math.round(weather.temperatureC)}°C` : '—'} · {weather.conditions || 'Current conditions'}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pieces</p>
            <ul className="space-y-3">
              {outfit.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {[item.category, item.color].filter(Boolean).join(' • ') || 'Wardrobe staple'}
                    </p>
                    {item.reason && (
                      <p className="mt-1 text-xs text-slate-500">{item.reason}</p>
                    )}
                  </div>
                  {onSelectItem && (
                    <button
                      type="button"
                      onClick={() => {
                        void onSelectItem(item.id);
                      }}
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-indigo-400 hover:text-indigo-200"
                    >
                      View
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {outfit.stylingTips.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Styling tips</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                {outfit.stylingTips.map((tip, tipIndex) => (
                  <li key={tipIndex}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-400">{outfit.weatherNotes}</p>
        </div>
      </div>
    );
  };

  const content = (() => {
    if (loading) {
      return <p className="text-sm text-slate-400">Generating fresh insights…</p>;
    }

    if (error) {
      return <p className="text-sm text-rose-400">{error}</p>;
    }

    if (activeTab === 'combinations') {
      return renderCombinations(combinationData?.combinations ?? []);
    }

    if (activeTab === 'next-purchase') {
      return renderNextPurchases(nextPurchaseData?.recommendations ?? []);
    }

    if (activeTab === 'weather-outfit') {
      return weatherData ? renderWeatherOutfit(weatherData) : <p className="text-sm text-slate-400">Still gathering weather context…</p>;
    }

    return null;
  })();

  return (
    <section className="mt-12 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl shadow-black/30">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-100">
            <Sparkles className="h-5 w-5 text-indigo-300" />
            Smart style advisor
          </h2>
          <p className="text-sm text-slate-400">
            Real-time looks, shopping cues, and weather-aware ideas—powered by your wardrobe data.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-indigo-400 hover:text-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(Object.keys(TAB_METADATA) as TabKey[]).map((tab) => {
          const tabData = TAB_METADATA[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                isActive
                  ? 'border-indigo-400 bg-indigo-500/20 text-indigo-100'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-600 hover:text-slate-100'
              }`}
            >
              {tabData.icon}
              <span>{tabData.label}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-slate-400">
        {TAB_METADATA[activeTab].description}
      </p>

      <div className="mt-6 space-y-6">
        {content}
        {meta && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-500">
            <p>
              Model: <span className="font-medium text-slate-300">{meta.model}</span>
              {meta.usedFallback && <span className="ml-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">Fallback used</span>}
            </p>
            {generatedAtLabel && <p className="mt-1">Generated {generatedAtLabel}</p>}
          </div>
        )}
      </div>
    </section>
  );
};

export default StyleAdvisorPanel;
