// components/wardrobe/WardrobeGrid.tsx
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
        <h2 className="text-2xl font-semibold text-slate-100">Your Pieces</h2>
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
        // THIS DIV CREATES THE RESPONSIVE GRID FOR THE CARDS
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
                    alt={item.originalName || 'Wardrobe item'}
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
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {item.category && <span className="rounded-full border border-slate-700 px-2 py-0.5">{item.category}</span>}
                  {item.color && <span className="rounded-full border border-slate-700 px-2 py-0.5">{item.color}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};