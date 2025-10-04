'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  ApiError,
  ClothingItemResponse,
  UpdateClothingItemPayload,
  deleteWardrobeItem,
  fetchWardrobeItem,
  fetchWardrobeItems,
  updateWardrobeItem,
  uploadWardrobeItem,
  analyzeWardrobeItem,
  updateWardrobeItemTags,
  markWardrobeItemWorn,
} from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';

export type UseWardrobeResult = {
  items: ClothingItemResponse[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  upload: (input: { file: File; notes?: string; purchasePrice?: number | null }) => Promise<void>;
  refresh: () => Promise<void>;
  fetchById: (id: string) => Promise<ClothingItemResponse>;
  update: (id: string, payload: UpdateClothingItemPayload) => Promise<ClothingItemResponse>;
  remove: (id: string) => Promise<void>;
  clearError: () => void;
  analyze: (itemId: string) => Promise<ClothingItemResponse>;
  analyzingItemIds: string[];
  analysisErrors: Record<string, string>;
  clearAnalysisError: (itemId: string) => void;
  updateTags: (id: string, payload: { primaryCategory?: string | null; dominantColor?: string | null }) => Promise<ClothingItemResponse>;
  updatingTagItemIds: string[];
  markAsWorn: (id: string, count?: number) => Promise<ClothingItemResponse>;
};

export const useWardrobe = (): UseWardrobeResult => {
  const { status } = useAuth();
  const [items, setItems] = useState<ClothingItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzingItemIds, setAnalyzingItemIds] = useState<string[]>([]);
  const [analysisErrors, setAnalysisErrors] = useState<Record<string, string>>({});
  const [updatingTagItemIds, setUpdatingTagItemIds] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (status !== 'authenticated') {
      setItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchWardrobeItems();
      setItems(data.items ?? []);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unexpected error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      refresh();
    } else if (status === 'unauthenticated') {
      setItems([]);
    }
  }, [refresh, status]);

  const analyze = useCallback(async (itemId: string) => {
    setAnalyzingItemIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
    setAnalysisErrors((prev) => {
      if (!(itemId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    try {
      const response = await analyzeWardrobeItem({ itemId });
      let updatedItem = response.item;

      if (!updatedItem) {
        const fetched = await fetchWardrobeItem(itemId);
        updatedItem = fetched.item;
      } else if (!updatedItem.aiTags && response.aiTags) {
        updatedItem = { ...updatedItem, aiTags: response.aiTags };
      }

      if (!updatedItem) {
        throw new Error('AI analysis completed but item data could not be retrieved.');
      }

      setItems((prev) => {
        const exists = prev.some((existing) => existing._id === updatedItem._id);
        if (exists) {
          return prev.map((existing) => (existing._id === updatedItem._id ? updatedItem : existing));
        }
        return [updatedItem, ...prev];
      });

      return updatedItem;
    } catch (err) {
      let message = 'AI analysis failed.';
      if (err instanceof ApiError) {
        message = err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setAnalysisErrors((prev) => ({ ...prev, [itemId]: message }));
      throw err;
    } finally {
      setAnalyzingItemIds((prev) => prev.filter((existing) => existing !== itemId));
    }
  }, []);

  const clearAnalysisError = useCallback((itemId: string) => {
    setAnalysisErrors((prev) => {
      if (!(itemId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  const pollAiCompletion = useCallback(
    async (itemId: string) => {
      const maxAttempts = 8;
      const delayMs = 2000;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        try {
          const { item } = await fetchWardrobeItem(itemId);
          setItems((prev) => {
            const exists = prev.some((existing) => existing._id === item._id);
            if (exists) {
              return prev.map((existing) => (existing._id === item._id ? item : existing));
            }
            return [item, ...prev];
          });

          if (item.aiTags?.status && item.aiTags.status !== 'processing') {
            setAnalysisErrors((prev) => {
              const next = { ...prev };
              if (item.aiTags?.status === 'failed' && item.aiTags.error) {
                next[itemId] = item.aiTags.error;
              } else {
                delete next[itemId];
              }
              return next;
            });
            break;
          }
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) {
            break;
          }
          throw err;
        }
      }
    },
    [setItems, setAnalysisErrors]
  );

  const upload = useCallback(
    async ({ file, notes, purchasePrice }: { file: File; notes?: string; purchasePrice?: number | null }) => {
      if (status !== 'authenticated') {
        setError('Please sign in to upload items.');
        throw new ApiError(401, 'Not authenticated');
      }

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('image', file);
        if (notes?.trim()) {
          formData.append('notes', notes.trim());
        }
        if (
          typeof purchasePrice === 'number' &&
          Number.isFinite(purchasePrice) &&
          !Number.isNaN(purchasePrice) &&
          purchasePrice >= 0
        ) {
          formData.append('purchasePrice', purchasePrice.toFixed(2));
        }

        const { item } = await uploadWardrobeItem(formData);
        setItems((prev) => [item, ...prev]);

        if (item._id && (!item.aiTags || item.aiTags.status === 'processing')) {
          setAnalyzingItemIds((prev) => (prev.includes(item._id) ? prev : [...prev, item._id]));
          setAnalysisErrors((prev) => {
            if (!(item._id in prev)) {
              return prev;
            }
            const next = { ...prev };
            delete next[item._id];
            return next;
          });

          pollAiCompletion(item._id)
            .catch((err) => {
              let message = 'AI analysis failed.';
              if (err instanceof ApiError) {
                message = err.message;
              } else if (err instanceof Error) {
                message = err.message;
              }
              setAnalysisErrors((prev) => ({ ...prev, [item._id]: message }));
            })
            .finally(() => {
              setAnalyzingItemIds((prev) => prev.filter((existing) => existing !== item._id));
            });
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unexpected error. Please try again.');
        }
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [pollAiCompletion, status]
  );

  const clearError = useCallback(() => setError(null), []);

  const fetchById = useCallback(async (id: string) => {
    const { item } = await fetchWardrobeItem(id);
    setItems((prev) => {
      const exists = prev.find((existing) => existing._id === item._id);
      if (exists) {
        return prev.map((existing) => (existing._id === item._id ? item : existing));
      }
      return [item, ...prev];
    });
    return item;
  }, []);

  const update = useCallback(async (id: string, payload: UpdateClothingItemPayload) => {
    const { item } = await updateWardrobeItem(id, payload);
    setItems((prev) => prev.map((existing) => (existing._id === item._id ? item : existing)));
    return item;
  }, []);

  const markAsWorn = useCallback(async (id: string, count = 1) => {
    const { item } = await markWardrobeItemWorn(id, count > 0 ? { count } : {});
    setItems((prev) => prev.map((existing) => (existing._id === item._id ? item : existing)));
    return item;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteWardrobeItem(id);
    setItems((prev) => prev.filter((existing) => existing._id !== id));
    setAnalyzingItemIds((prev) => prev.filter((existing) => existing !== id));
    setAnalysisErrors((prev) => {
      if (!(id in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const updateTags = useCallback(
    async (id: string, payload: { primaryCategory?: string | null; dominantColor?: string | null }) => {
      setUpdatingTagItemIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      try {
        const { item } = await updateWardrobeItemTags(id, payload);
        setItems((prev) => prev.map((existing) => (existing._id === item._id ? item : existing)));
        return item;
      } finally {
        setUpdatingTagItemIds((prev) => prev.filter((existing) => existing !== id));
      }
    },
    []
  );

  return {
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
  };
};
