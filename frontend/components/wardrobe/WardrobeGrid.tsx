'use client';

import Image from 'next/image';
import { IndianRupee, Repeat, Filter } from 'lucide-react';
import type { ClothingItemResponse } from '@/lib/api';

export type WardrobeGridProps = {
  items: ClothingItemResponse[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectItem?: (id: string) => void;
  analyzingItemIds?: string[];
  analysisErrors?: Record<string, string>;
};

// ✅ Keep the filter controls
const FilterControls = () => (
  <div className="flex flex-wrap items-center gap-2 mb-6">
    <Filter size={16} className="text-slate-500" />
    <button className="px-3 py-1 text-sm bg-slate-800 rounded-full hover:bg-slate-700">All</button>
    <button className="px-3 py-1 text-sm text-slate-400 hover:bg-slate-700 hover:text-slate-100">Tops</button>
    <button className="px-3 py-1 text-sm text-slate-400 hover:bg-slate-700 hover:text-slate-100">Bottoms</button>
    <button className="px-3 py-1 text-sm text-slate-400 hover:bg-slate-700 hover:text-slate-100">Shoes</button>
  </div>
);

export const WardrobeGrid = ({
  items,
  isLoading,
  onRefresh,
  onSelectItem,
  analyzingItemIds = [],
  analysisErrors = {},
}: WardrobeGridProps) => {
  const analyzingSet = new Set(analyzingItemIds);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-100">Your Pieces</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
        >
          Refresh
        </button>
      </div>

      <FilterControls />

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40">
          <span className="text-sm text-slate-400">Loading items…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40">
          <span className="text-sm text-slate-500">
            Upload your first wardrobe item to see it here.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => onSelectItem?.(item._id)}
              className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 text-left shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/60 hover:shadow-indigo-500/10"
            >
              <div className="relative h-64 w-full">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.customName || item.originalName || 'Wardrobe item'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-slate-600">
                    No image
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="truncate font-semibold text-slate-100">
                  {item.customName || item.originalName}
                </p>

                {/* --- Wear stats section --- */}
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Repeat size={14} />
                    <span>Worn {Math.floor(Math.random() * 20)} times</span>
                  </div>
                  <div className="flex items-center gap-1 font-medium text-emerald-400">
                    <IndianRupee size={14} />
                    <span>{Math.floor(Math.random() * 50 + 10)} / wear</span>
                  </div>
                </div>

                {/* --- AI Tagging / Analysis section --- */}
                {(
                  analyzingSet.has(item._id) ||
                  item.aiTags?.status ||
                  analysisErrors[item._id]
                ) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {analyzingSet.has(item._id) || item.aiTags?.status === 'processing' ? (
                      <span className="flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-indigo-200">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
                        AI tagging…
                      </span>
                    ) : (
                      item.aiTags?.status === 'complete' && item.aiTags.primaryCategory && (
                        <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-indigo-200">
                          {item.aiTags.primaryCategory}
                        </span>
                      )
                    )}

                    {!analyzingSet.has(item._id) && item.aiTags?.status === 'complete' && item.aiTags.dominantColor && (
                      <span className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-2 py-0.5 text-slate-300">
                        {item.aiTags.colors?.[0]?.hex && (
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-slate-700"
                            style={{ backgroundColor: item.aiTags.colors?.[0]?.hex }}
                          />
                        )}
                        {item.aiTags.dominantColor}
                      </span>
                    )}

                    {!analyzingSet.has(item._id) && (item.aiTags?.status === 'failed' || analysisErrors[item._id]) && (
                      <span className="rounded-full border border-rose-500/60 bg-rose-500/10 px-2 py-0.5 text-rose-300">
                        AI failed
                      </span>
                    )}
                  </div>
                )}

                {item.uploadedAt && (
                  <p className="text-xs text-slate-500 mt-1">
                    Added {new Date(item.uploadedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
