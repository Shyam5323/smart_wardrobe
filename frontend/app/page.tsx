'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Home from '@/components/Home'
import { UploadPanel } from '@/components/wardrobe/UploadPanel';
import { WardrobeGrid } from '@/components/wardrobe/WardrobeGrid';
import { ItemDetailSheet } from '@/components/wardrobe/ItemDetailSheet';
import { useWardrobe } from '@/hooks/useWardrobe';
import type { ClothingItemResponse, UpdateClothingItemPayload } from '@/lib/api';

export default function HomePage() {
  // All of your friend's original state and data-fetching logic is preserved
  const {
    items,
    isLoading,
    isUploading,
    error,
    upload,
    refresh,
    fetchById,
    update,
    remove,
    clearError,
  } = useWardrobe();

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItemResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDetailSaving, setIsDetailSaving] = useState(false);
  const [isDetailDeleting, setIsDetailDeleting] = useState(false);

  return (
    <>
      <Navbar />
      <Home />
      
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
            My Wardrobe
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Add pieces to your virtual closet and build your next look.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
          <UploadPanel
            onUpload={upload}
            isUploading={isUploading}
            error={error}
            onErrorClear={clearError}
          />
          <WardrobeGrid
            items={items}
            isLoading={isLoading}
            onRefresh={refresh}
            onSelectItem={async (id) => {
              setIsDetailOpen(true);
              setIsDetailLoading(true);
              setDetailError(null);
              try {
                const item = await fetchById(id);
                setSelectedItem(item);
              } catch (err) {
                setDetailError(err instanceof Error ? err.message : 'Unable to load item.');
              } finally {
                setIsDetailLoading(false);
              }
            }}
          />
        </section>
      </div>

      <ItemDetailSheet
        item={selectedItem}
        isOpen={isDetailOpen}
        isLoading={isDetailLoading}
        isSaving={isDetailSaving}
        isDeleting={isDetailDeleting}
        error={detailError}
        onClose={() => {
          if (isDetailSaving || isDetailDeleting) return;
          setIsDetailOpen(false);
          setSelectedItem(null);
          setDetailError(null);
        }}
        onSave={async (payload: UpdateClothingItemPayload) => {
          if (!selectedItem) return;
          setIsDetailSaving(true);
          setDetailError(null);
          try {
            const updated = await update(selectedItem._id, payload);
            setSelectedItem(updated);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to save changes.';
            setDetailError(message);
            throw err;
          } finally {
            setIsDetailSaving(false);
          }
        }}
        onDelete={async () => {
          if (!selectedItem) return;
          setIsDetailDeleting(true);
          setDetailError(null);
          try {
            await remove(selectedItem._id);
            setSelectedItem(null);
            setIsDetailOpen(false);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to delete item.';
            setDetailError(message);
            throw err;
          } finally {
            setIsDetailDeleting(false);
          }
        }}
      />
    </>
  );
}