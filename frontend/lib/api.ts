import { API_BASE_URL } from './constants';
import { getToken } from './storage';

export type ApiErrorPayload = {
  message?: string;
  [key: string]: unknown;
};

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export type User = {
  _id: string;
  email: string;
  displayName?: string;
  profilePicture?: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

const buildUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
};

type RequestOptions = RequestInit & {
  auth?: boolean;
  parseJson?: boolean;
};

export const apiFetch = async <T = unknown>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { auth = false, parseJson = true, headers, ...init } = options;
  const finalHeaders = new Headers(headers);

  if (!(init.body instanceof FormData)) {
    finalHeaders.set('Accept', 'application/json');
    if (!finalHeaders.has('Content-Type') && init.method && init.method !== 'GET') {
      finalHeaders.set('Content-Type', 'application/json');
    }
  }

  if (auth) {
    const token = getToken();
    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers: finalHeaders,
  });

  if (!response.ok) {
    let payload: ApiErrorPayload | undefined;
    if (response.headers.get('Content-Type')?.includes('application/json')) {
      payload = await response.json().catch(() => undefined);
    }
    throw new ApiError(response.status, payload?.message || response.statusText, payload);
  }

  if (!parseJson) {
    return undefined as T;
  }

  const data = await response.json();
  return data as T;
};

export const signup = (input: { email: string; password: string; displayName?: string }) =>
  apiFetch<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const login = (input: { email: string; password: string }) =>
  apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const fetchCurrentUser = () =>
  apiFetch<{ user: User }>('/api/auth/me', {
    auth: true,
  });

export type AiCategory = {
  label: string;
  confidence?: number;
};

export type AiColor = {
  name: string;
  hex?: string;
  rgb?: {
    r: number;
    g: number;
    b: number;
  };
};

export type AiTags = {
  status: 'idle' | 'processing' | 'complete' | 'failed';
  source?: string;
  analyzedAt?: string;
  primaryCategory?: string;
  categories?: AiCategory[];
  dominantColor?: string;
  colors?: AiColor[];
  error?: string;
};

export type ClothingItemResponse = {
  _id: string;
  imageUrl: string | null;
  notes?: string;
  uploadedAt?: string;
  originalName?: string;
  customName?: string;
  category?: string;
  color?: string;
  isFavorite?: boolean;
  updatedAt?: string;
  aiTags?: AiTags | null;
};

export const fetchWardrobeItems = () =>
  apiFetch<{ items: ClothingItemResponse[] }>('/api/items', {
    auth: true,
  });

export type AnalyzeItemResponse = {
  aiTags: AiTags;
  item?: ClothingItemResponse;
};

export const analyzeWardrobeItem = (payload: { itemId?: string; imageUrl?: string }) =>
  apiFetch<AnalyzeItemResponse>('/api/ai/analyze-item', {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: true,
  });

export const uploadWardrobeItem = (formData: FormData) =>
  apiFetch<{ item: ClothingItemResponse }>('/api/items/upload', {
    method: 'POST',
    body: formData,
    auth: true,
    headers: {},
  });

export const fetchWardrobeItem = (id: string) =>
  apiFetch<{ item: ClothingItemResponse }>(`/api/items/${id}`, {
    auth: true,
  });

export type UpdateClothingItemPayload = {
  customName?: string | null;
  category?: string | null;
  color?: string | null;
  notes?: string | null;
  isFavorite?: boolean;
};

export const updateWardrobeItem = (id: string, payload: UpdateClothingItemPayload) =>
  apiFetch<{ item: ClothingItemResponse }>(`/api/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    auth: true,
  });

export const deleteWardrobeItem = (id: string) =>
  apiFetch<void>(`/api/items/${id}`, {
    method: 'DELETE',
    auth: true,
    parseJson: false,
  });
