import Image from 'next/image';

import type { ClothingItemResponse } from '@/lib/api';

export type WardrobeGridProps = {
  items: ClothingItemResponse[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectItem?: (id: string) => void;
};

export const WardrobeGrid = ({ items, isLoading, onRefresh, onSelectItem }: WardrobeGridProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">Your pieces</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
        >
          Refresh
        </button>
      </div>

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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => onSelectItem?.(item._id)}
              className="group overflow-hidden rounded-xl border border-slate-900/70 bg-slate-900/60 text-left shadow shadow-black/30 transition hover:-translate-y-1 hover:border-indigo-500/60 hover:shadow-lg hover:shadow-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
            >
              <div className="relative h-64 w-full bg-slate-900">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.customName || item.notes || item.originalName || 'Wardrobe item'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-600">
                    No image
                  </div>
                )}
              </div>
              <div className="space-y-1 p-4">
                <p className="text-sm font-semibold text-slate-100">
                  {item.customName || item.notes || item.originalName || 'Untitled piece'}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {item.category && <span className="rounded-full border border-slate-800 px-2 py-0.5">{item.category}</span>}
                  {item.color && <span className="rounded-full border border-slate-800 px-2 py-0.5">{item.color}</span>}
                </div>
                {item.uploadedAt && (
                  <p className="text-xs text-slate-500">
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
