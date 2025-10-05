'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/components/providers/AuthProvider';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import CapsuleSection from '@/components/landing/CapsuleSection';

import { UploadPanel } from '@/components/wardrobe/UploadPanel';
import { WardrobeGrid } from '@/components/wardrobe/WardrobeGrid';
import { ItemDetailSheet } from '@/components/wardrobe/ItemDetailSheet';
import StyleAdvisorPanel from '@/components/wardrobe/StyleAdvisorPanel';
import WearCalendar from '@/components/wardrobe/WearCalendar';
import { useWardrobe } from '@/hooks/useWardrobe';
import {
  fetchWearLogs,
  type ClothingItemResponse,
  type UpdateClothingItemPayload,
  type WearLogDay,
} from '@/lib/api';

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
    updateTags,
    updatingTagItemIds,
    markAsWorn,
  } = useWardrobe();

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItemResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDetailSaving, setIsDetailSaving] = useState(false);
  const [isDetailDeleting, setIsDetailDeleting] = useState(false);
  const [isMarkingWear, setIsMarkingWear] = useState(false);

  const [wearLogs, setWearLogs] = useState<WearLogDay[]>([]);
  const [isWearLogsLoading, setIsWearLogsLoading] = useState(false);
  const [wearLogsError, setWearLogsError] = useState<string | null>(null);

  const loadWearLogs = useCallback(async () => {
    if (status !== 'authenticated') {
      return;
    }

    setIsWearLogsLoading(true);
    setWearLogsError(null);

    try {
      const { logs } = await fetchWearLogs({ days: 120 });
      setWearLogs(logs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load outfit history.';
      setWearLogsError(message);
    } finally {
      setIsWearLogsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (!selectedItem) return;
    const latest = items.find((item) => item._id === selectedItem._id);
    if (latest && latest !== selectedItem) {
      setSelectedItem(latest);
    }
  }, [items, selectedItem]);

  useEffect(() => {
    if (status === 'authenticated') {
      void loadWearLogs();
    } else if (status === 'unauthenticated') {
      setWearLogs([]);
      setWearLogsError(null);
    }
  }, [status, loadWearLogs]);

  const selectedAnalysisError = selectedItem
    ? analysisErrors[selectedItem._id] ?? selectedItem.aiTags?.error ?? null
    : null;
  const isSelectedAnalyzing = selectedItem
    ? analyzingItemIds.includes(selectedItem._id) || selectedItem.aiTags?.status === 'processing'
    : false;
  const isSelectedUpdatingTags = selectedItem
    ? updatingTagItemIds.includes(selectedItem._id)
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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 lg:px-8">
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4 lg:gap-6">
        <div className="max-w-2xl">
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

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        
        <div className="flex min-w-0 flex-col gap-10">
          <section className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
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
                setIsMarkingWear(false);
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

          <StyleAdvisorPanel
            onSelectItem={async (id) => {
              setIsDetailOpen(true);
              setIsDetailLoading(true);
              setIsMarkingWear(false);
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
        </div>

        <WearCalendar
          logs={wearLogs}
          isLoading={isWearLogsLoading}
          errorMessage={wearLogsError}
          onRefresh={() => {
            void loadWearLogs();
          }}
        />
      </div>

      <ItemDetailSheet
        item={selectedItem}
        isOpen={isDetailOpen}
        isLoading={isDetailLoading}
        isSaving={isDetailSaving}
        isDeleting={isDetailDeleting}
        error={detailError}
        isUpdatingTags={isSelectedUpdatingTags}
        isMarkingWear={isMarkingWear}
        onClose={() => {
          if (isDetailSaving || isDetailDeleting) return;
          setIsDetailOpen(false);
          setSelectedItem(null);
          setDetailError(null);
          setIsMarkingWear(false);
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
        onMarkWorn=
          {selectedItem
            ? async () => {
                setDetailError(null);
                setIsMarkingWear(true);
                try {
                  const updated = await markAsWorn(selectedItem._id);
                  setSelectedItem(updated);
                  await loadWearLogs();
                } catch (err) {
                  const message = err instanceof Error ? err.message : 'Unable to log wear.';
                  setDetailError(message);
                  throw err;
                } finally {
                  setIsMarkingWear(false);
                }
              }
            : undefined}
        onUpdateTags={
          selectedItem
            ? async (payload) => {
                setDetailError(null);
                try {
                  const updated = await updateTags(selectedItem._id, payload);
                  setSelectedItem(updated);
                } catch (err) {
                  const message = err instanceof Error ? err.message : 'Unable to update tags.';
                  setDetailError(message);
                  throw err;
                }
              }
            : undefined
        }
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
