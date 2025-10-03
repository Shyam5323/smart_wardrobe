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
} from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';

export type UseWardrobeResult = {
  items: ClothingItemResponse[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  upload: (input: { file: File; notes?: string }) => Promise<void>;
  refresh: () => Promise<void>;
  fetchById: (id: string) => Promise<ClothingItemResponse>;
  update: (id: string, payload: UpdateClothingItemPayload) => Promise<ClothingItemResponse>;
  remove: (id: string) => Promise<void>;
  clearError: () => void;
};

export const useWardrobe = (): UseWardrobeResult => {
  const { status } = useAuth();
  const [items, setItems] = useState<ClothingItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const upload = useCallback(
    async ({ file, notes }: { file: File; notes?: string }) => {
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

        const { item } = await uploadWardrobeItem(formData);
        setItems((prev) => [item, ...prev]);
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
    [status]
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

  const remove = useCallback(async (id: string) => {
    await deleteWardrobeItem(id);
    setItems((prev) => prev.filter((existing) => existing._id !== id));
  }, []);

  return { items, isLoading, isUploading, error, upload, refresh, fetchById, update, remove, clearError };
};
