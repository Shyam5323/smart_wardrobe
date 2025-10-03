'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

import type { ClothingItemResponse, UpdateClothingItemPayload } from '@/lib/api';

export type ItemDetailSheetProps = {
  item: ClothingItemResponse | null;
  isOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: UpdateClothingItemPayload) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
};

const toNullable = (value: string) => (value.trim() === '' ? null : value.trim());

export const ItemDetailSheet = ({
  item,
  isOpen,
  isLoading,
  isSaving,
  isDeleting,
  error,
  onClose,
  onSave,
  onDelete,
}: ItemDetailSheetProps) => {
  const [customName, setCustomName] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) {
      setCustomName('');
      setCategory('');
      setColor('');
      setNotes('');
      setIsFavorite(false);
      return;
    }

    setCustomName(item.customName ?? '');
    setCategory(item.category ?? '');
    setColor(item.color ?? '');
    setNotes(item.notes ?? '');
    setIsFavorite(Boolean(item.isFavorite));
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

    try {
      await onSave({
        customName: toNullable(customName) ?? null,
        category: toNullable(category) ?? null,
        color: toNullable(color) ?? null,
        notes: toNullable(notes) ?? null,
        isFavorite,
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
