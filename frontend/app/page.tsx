'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/components/providers/AuthProvider';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import CapsuleSection from '@/components/landing/CapsuleSection';

import { UploadPanel } from '@/components/wardrobe/UploadPanel';
import { WardrobeGrid } from '@/components/wardrobe/WardrobeGrid';
import { ItemDetailSheet } from '@/components/wardrobe/ItemDetailSheet';
import { useWardrobe } from '@/hooks/useWardrobe';
import type { ClothingItemResponse, UpdateClothingItemPayload } from '@/lib/api';

export default function HomePage() {
  const { status, user, logout } = useAuth();
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
    analyze,
    analyzingItemIds,
    analysisErrors,
    clearAnalysisError,
  } = useWardrobe();

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItemResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDetailSaving, setIsDetailSaving] = useState(false);
  const [isDetailDeleting, setIsDetailDeleting] = useState(false);

  useEffect(() => {
    if (!selectedItem) return;
    const latest = items.find((item) => item._id === selectedItem._id);
    if (latest && latest !== selectedItem) {
      setSelectedItem(latest);
    }
  }, [items, selectedItem]);

  const selectedAnalysisError = selectedItem
    ? analysisErrors[selectedItem._id] ?? selectedItem.aiTags?.error ?? null
    : null;
  const isSelectedAnalyzing = selectedItem
    ? analyzingItemIds.includes(selectedItem._id) || selectedItem.aiTags?.status === 'processing'
    : false;

  // 1️⃣ Loading state
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-slate-400">Loading your wardrobe…</span>
      </div>
    );
  }

  // 2️⃣ Unauthenticated users → show landing page
  if (status === 'unauthenticated') {
    return (
      <>
        <HeroSection />
        <FeaturesSection />
        <CapsuleSection />
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 px-6 py-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-slate-700 px-6 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Create account
            </Link>
          </div>
        </div>
      </>
    );
  }

  // 3️⃣ Authenticated users → show wardrobe dashboard
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-12 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Wardrobe Uploader</h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Add pieces to your virtual closet and preview them instantly before AI styling kicks in.
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm">
          <div className="text-left">
            <p className="font-medium text-slate-100">{user?.displayName || user?.email}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
          >
            Log out
          </button>
        </div>
      </header>

      <section className="grid gap-10 lg:grid-cols-[360px_1fr]">
        <UploadPanel
          onUpload={upload}
          isUploading={isUploading}
          error={error}
          onErrorClear={clearError}
        />
        <WardrobeGrid
          items={items}
          isLoading={isLoading}
          analyzingItemIds={analyzingItemIds}
          analysisErrors={analysisErrors}
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
        aiState={
          selectedItem
            ? {
                isAnalyzing: isSelectedAnalyzing,
                error: selectedAnalysisError,
                onRetry: async () => {
                  clearAnalysisError(selectedItem._id);
                  await analyze(selectedItem._id);
                },
                onClearError: () => clearAnalysisError(selectedItem._id),
              }
            : undefined
        }
      />
    </div>
  );
}
