'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { IndianRupee, Repeat } from 'lucide-react';

import type { ClothingItemResponse, UpdateClothingItemPayload } from '@/lib/api';
import { CATEGORY_OPTIONS, COLOR_OPTIONS } from '@/lib/constants';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export type ItemDetailSheetProps = {
  item: ClothingItemResponse | null;
  isOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  error: string | null;
  aiState?: {
    isAnalyzing: boolean;
    error?: string | null;
    onRetry?: () => Promise<void> | void;
    onClearError?: () => void;
  };
  onUpdateTags?: (payload: { primaryCategory?: string | null; dominantColor?: string | null }) => Promise<void> | void;
  isUpdatingTags?: boolean;
  onClose: () => void;
  onSave: (payload: UpdateClothingItemPayload) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onMarkWorn?: (count?: number) => Promise<void> | void;
  isMarkingWear?: boolean;
};

const toNullable = (value: string) => (value.trim() === '' ? null : value.trim());

export const ItemDetailSheet = ({
  item,
  isOpen,
  isLoading,
  isSaving,
  isDeleting,
  error,
  aiState,
  onUpdateTags,
  isUpdatingTags = false,
  onClose,
  onSave,
  onDelete,
  onMarkWorn,
  isMarkingWear = false,
}: ItemDetailSheetProps) => {
  const [customName, setCustomName] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [overrideCategory, setOverrideCategory] = useState('');
  const [overrideColor, setOverrideColor] = useState('');
  const aiTags = item?.aiTags ?? null;
  const aiStatus = aiTags?.status ?? (aiState?.isAnalyzing ? 'processing' : 'idle');
  const isAiProcessing = aiStatus === 'processing';
  const aiErrorMessage = aiState?.error ?? aiTags?.error ?? null;
  const topCategories = (aiTags?.categories ?? []).filter((entry) => entry.label).slice(0, 3);
  const dominantColorSample = aiTags?.colors?.[0];
  const analyzedAtLabel = aiTags?.analyzedAt ? new Date(aiTags.analyzedAt).toLocaleString() : null;
  const manualTags = item?.userTags ?? null;
  const manualUpdatedAtLabel = manualTags?.updatedAt ? new Date(manualTags.updatedAt).toLocaleString() : null;
  const effectiveCategory = manualTags?.primaryCategory || aiTags?.primaryCategory;
  const effectiveColor = manualTags?.dominantColor || aiTags?.dominantColor;

  useEffect(() => {
    if (!item) {
      setCustomName('');
      setCategory('');
      setColor('');
      setNotes('');
      setPurchasePrice('');
      setIsFavorite(false);
      return;
    }

    setCustomName(item.customName ?? '');
    setCategory(item.category ?? '');
    setColor(item.color ?? '');
    setNotes(item.notes ?? '');
    setPurchasePrice(
      typeof item.purchasePrice === 'number' && Number.isFinite(item.purchasePrice)
        ? item.purchasePrice.toFixed(2)
        : ''
    );
    setIsFavorite(Boolean(item.isFavorite));
    setOverrideCategory(item.userTags?.primaryCategory ?? '');
    setOverrideColor(item.userTags?.dominantColor ?? '');
  }, [item]);

  useEffect(() => {
    setLocalError(error);
  }, [error]);

  const canSubmit = useMemo(() => !!item && !isSaving && !isDeleting, [item, isSaving, isDeleting]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!item) return;

    setLocalError(null);

    const trimmedPrice = purchasePrice.trim();
    let normalizedPrice: number | null = null;
    if (trimmedPrice !== '') {
      const parsed = Number.parseFloat(trimmedPrice);
      if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 0) {
        setLocalError('Purchase price must be a non-negative number.');
        return;
      }
      normalizedPrice = Math.round(parsed * 100) / 100;
    }

    try {
      await onSave({
        customName: toNullable(customName) ?? null,
        category: toNullable(category) ?? null,
        color: toNullable(color) ?? null,
        notes: toNullable(notes) ?? null,
        isFavorite,
        purchasePrice: normalizedPrice,
      });
    } catch (err) {
      if (err instanceof Error) {
        setLocalError(err.message);
      } else {
        setLocalError('Unable to save changes.');
      }
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setLocalError(null);
    try {
      await onDelete();
    } catch (err) {
      if (err instanceof Error) {
        setLocalError(err.message);
      } else {
        setLocalError('Unable to delete item.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8">
      <div className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
        >
          Close
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="relative h-80 w-full bg-slate-950">
            {isLoading ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                Loading…
              </div>
            ) : item?.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.customName || item.notes || item.originalName || 'Wardrobe item'}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-600">
                No image available
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
            <div>
              <h2 className="text-2xl font-semibold">
                {customName || item?.originalName || 'Wardrobe item'}
              </h2>
              {item?.uploadedAt && (
                <p className="text-xs text-slate-500">
                  Added {new Date(item.uploadedAt).toLocaleString()}
                </p>
              )}
            </div>

            {item && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Wear tracker
                  </span>
                  {onMarkWorn && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!onMarkWorn || isMarkingWear || isSaving || isDeleting) return;
                        setLocalError(null);
                        Promise.resolve(onMarkWorn())
                          .catch((err) => {
                            if (err instanceof Error) {
                              setLocalError(err.message);
                            } else {
                              setLocalError('Unable to log wear right now.');
                            }
                          });
                      }}
                      disabled={isMarkingWear || isSaving || isDeleting}
                      className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isMarkingWear ? 'Logging…' : 'Mark worn'}
                    </button>
                  )}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center">
                    <Repeat className="mx-auto mb-2 h-4 w-4 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Times worn</p>
                    <p className="mt-1 text-lg font-semibold text-slate-100">{item.timesWorn ?? 0}</p>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center">
                    <IndianRupee className="mx-auto mb-2 h-4 w-4 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Purchase price</p>
                    <p className="mt-1 text-base font-semibold text-slate-100">
                      {typeof item.purchasePrice === 'number' && Number.isFinite(item.purchasePrice)
                        ? currencyFormatter.format(item.purchasePrice)
                        : '—'}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center">
                    <IndianRupee className="mx-auto mb-2 h-4 w-4 text-emerald-300" />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Cost per wear</p>
                    <p className="mt-1 text-base font-semibold text-emerald-300">
                      {typeof item.costPerWear === 'number' && Number.isFinite(item.costPerWear)
                        ? currencyFormatter.format(item.costPerWear)
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  AI insights
                </span>
                {isAiProcessing && (
                  <span className="flex items-center gap-2 text-xs text-indigo-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                    Analyzing…
                  </span>
                )}
              </div>

              {aiErrorMessage && !isAiProcessing ? (
                <div className="mt-3 space-y-3 text-rose-300">
                  <p>{aiErrorMessage}</p>
                  <div className="flex flex-wrap gap-2">
                    {aiState?.onRetry && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!aiState.onRetry) return;
                          Promise.resolve(aiState.onRetry()).catch(() => undefined);
                        }}
                        className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/30"
                      >
                        Retry analysis
                      </button>
                    )}
                    {aiState?.onClearError && (
                      <button
                        type="button"
                        onClick={aiState.onClearError}
                        className="rounded-full border border-rose-500/40 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:border-rose-300 hover:text-rose-100"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              ) : aiStatus === 'complete' && aiTags ? (
                <div className="mt-3 space-y-4 text-sm text-slate-200">
                  {(effectiveCategory || effectiveColor) && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active tags</p>
                      {effectiveCategory && (
                        <p className="text-sm font-medium text-slate-100">
                          Category: {effectiveCategory}
                          {manualTags?.primaryCategory && <span className="ml-2 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">Manual</span>}
                        </p>
                      )}
                      {effectiveColor && (
                        <p className="text-sm font-medium text-slate-100">
                          Color: {effectiveColor}
                          {manualTags?.dominantColor && <span className="ml-2 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">Manual</span>}
                        </p>
                      )}
                      {manualUpdatedAtLabel && (
                        <p className="text-xs text-emerald-200/90">Manually adjusted {manualUpdatedAtLabel}</p>
                      )}
                    </div>
                  )}

                  {aiTags.primaryCategory && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI suggested category</p>
                      <p className="text-sm font-medium text-slate-100">{aiTags.primaryCategory}</p>
                      {topCategories.length > 0 && (
                        <ul className="space-y-1 text-xs text-slate-400">
                          {topCategories.map((entry) => (
                            <li key={entry.label} className="flex items-center justify-between">
                              <span>{entry.label}</span>
                              {typeof entry.confidence === 'number' && (
                                <span>{Math.round(entry.confidence * 100)}%</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {aiTags.dominantColor && (
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full border border-slate-700"
                        style={{ backgroundColor: dominantColorSample?.hex }}
                      />
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI dominant color</p>
                        <p className="text-sm font-medium text-slate-100">{aiTags.dominantColor}</p>
                        {dominantColorSample?.hex && (
                          <p className="text-xs text-slate-500">{dominantColorSample.hex}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {(analyzedAtLabel || aiTags.source) && (
                    <p className="text-xs text-slate-500">
                      {analyzedAtLabel ? `Updated ${analyzedAtLabel}` : 'Updated recently'}
                      {aiTags.source ? ` via ${aiTags.source}` : ''}
                    </p>
                  )}

                  {aiState?.onRetry && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!aiState.onRetry || isAiProcessing) return;
                        Promise.resolve(aiState.onRetry()).catch(() => undefined);
                      }}
                      disabled={isAiProcessing}
                      className="rounded-full border border-indigo-500/40 px-3 py-1 text-xs font-semibold text-indigo-200 transition hover:border-indigo-400 hover:text-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Re-run analysis
                    </button>
                  )}
                </div>
              ) : aiStatus === 'processing' ? (
                <p className="mt-3 text-xs text-indigo-200">AI is analyzing this item. Hang tight!</p>
              ) : aiStatus === 'failed' ? (
                <p className="mt-3 text-xs text-rose-300">
                  AI analysis could not complete. {aiState?.onRetry ? 'Try running it again.' : ''}
                </p>
              ) : (
                <p className="mt-3 text-xs text-slate-500">AI tags will appear here after analysis.</p>
              )}

              {onUpdateTags && (
                <form
                  className="mt-4 space-y-4 rounded-lg border border-slate-800 bg-slate-950/80 p-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!item) return;
                    setLocalError(null);
                    try {
                      await onUpdateTags({
                        primaryCategory: overrideCategory.trim() === '' ? null : overrideCategory,
                        dominantColor: overrideColor.trim() === '' ? null : overrideColor,
                      });
                    } catch (err) {
                      if (err instanceof Error) {
                        setLocalError(err.message);
                      } else {
                        setLocalError('Unable to update tags.');
                      }
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Manual override
                    </p>
                    {manualTags && (manualTags.primaryCategory || manualTags.dominantColor) ? (
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-0.5 text-[11px] text-emerald-200">
                        Active
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Optional</span>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-xs">
                      <span className="block uppercase tracking-[0.2em] text-slate-500">Category</span>
                      <select
                        value={overrideCategory}
                        onChange={(event) => setOverrideCategory(event.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        disabled={isUpdatingTags || isLoading}
                      >
                        <option value="">Use AI suggestion</option>
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 text-xs">
                      <span className="block uppercase tracking-[0.2em] text-slate-500">Color</span>
                      <select
                        value={overrideColor}
                        onChange={(event) => setOverrideColor(event.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        disabled={isUpdatingTags || isLoading}
                      >
                        <option value="">Use AI suggestion</option>
                        {COLOR_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="rounded-full bg-indigo-500/90 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isUpdatingTags || isLoading}
                    >
                      {isUpdatingTags ? 'Saving…' : 'Save override'}
                    </button>
                    {(manualTags?.primaryCategory || manualTags?.dominantColor) && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!onUpdateTags || !item) return;
                          setLocalError(null);
                          setOverrideCategory('');
                          setOverrideColor('');
                          try {
                            await onUpdateTags({ primaryCategory: null, dominantColor: null });
                          } catch (err) {
                            if (err instanceof Error) {
                              setLocalError(err.message);
                            } else {
                              setLocalError('Unable to clear overrides.');
                            }
                          }
                        }}
                        disabled={isUpdatingTags || isLoading}
                        className="rounded-full border border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Clear override
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Name</span>
                <input
                  type="text"
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder="Red linen shirt"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  disabled={isSaving || isDeleting || isLoading}
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Category</span>
                <input
                  type="text"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Top, Denim, Outerwear…"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  disabled={isSaving || isDeleting || isLoading}
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Primary color</span>
                <input
                  type="text"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  placeholder="Blue, Earth-tone, etc."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  disabled={isSaving || isDeleting || isLoading}
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Purchase price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={purchasePrice}
                  onChange={(event) => setPurchasePrice(event.target.value)}
                  placeholder="₹2499"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  disabled={isSaving || isDeleting || isLoading}
                />
              </label>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(event) => setIsFavorite(event.target.checked)}
                  disabled={isSaving || isDeleting || isLoading}
                  className="h-4 w-4 rounded border border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-slate-300">Mark as favorite</span>
              </label>
            </div>

            <label className="space-y-2 text-sm">
              <span className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Add fit notes, styling ideas, or care tips."
                className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                disabled={isSaving || isDeleting || isLoading}
              />
            </label>

            {(localError || error) && (
              <p className="text-sm text-rose-400">{localError || error}</p>
            )}

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={!item || isDeleting || isSaving}
                className="rounded-lg border border-rose-500/60 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? 'Deleting…' : 'Delete item'}
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
