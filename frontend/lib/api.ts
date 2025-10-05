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

export type UserTags = {
  primaryCategory?: string | null;
  dominantColor?: string | null;
  updatedAt?: string;
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
  userTags?: UserTags | null;
  purchasePrice?: number;
  timesWorn?: number;
  costPerWear?: number | null;
};

export type WearLogItem = {
  itemId: string | null;
  count: number;
  wornAt: string;
  item: ClothingItemResponse | null;
};

export type WearLogDay = {
  date: string;
  items: WearLogItem[];
};

export type WearLogResponse = {
  logs: WearLogDay[];
  meta: {
    from: string;
    to: string;
    days: number;
    totalEntries: number;
  };
};

export type SuggestedWardrobeItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  category?: string | null;
  color?: string | null;
  timesWorn?: number;
  purchasePrice?: number | null;
  costPerWear?: number | null;
  isFavorite?: boolean;
  note?: string | null;
  reason?: string | null;
};

export type OutfitCombination = {
  title: string;
  summary: string;
  occasion?: string;
  stylingTips: string[];
  items: SuggestedWardrobeItem[];
};

export type OutfitCombinationsResponse = {
  combinations: OutfitCombination[];
  meta: {
    provider: string;
    model: string;
    generatedAt: string;
    usedFallback: boolean;
    rawText?: string;
  };
};

export type NextPurchaseSuggestion = {
  title: string;
  rationale: string;
  currentGaps: string[];
  suggestedItems: Array<{
    name: string;
    category: string | null;
    reason: string;
  }>;
  budgetThoughts: string;
};

export type NextPurchaseResponse = {
  recommendations: NextPurchaseSuggestion[];
  meta: {
    provider: string;
    model: string;
    generatedAt: string;
    usedFallback: boolean;
    rawText?: string;
  };
};

export type WeatherAwareOutfit = {
  title: string;
  summary: string;
  stylingTips: string[];
  weatherNotes: string;
  items: SuggestedWardrobeItem[];
};

export type WeatherAwareOutfitResponse = {
  location: {
    city?: string;
    region?: string;
    country?: string;
  };
  weather: {
    location: string;
    temperatureC: number | null;
    feelsLikeC: number | null;
    conditions?: string | null;
    description?: string | null;
    humidity?: number | null;
    windSpeed?: number | null;
  };
  outfit: WeatherAwareOutfit;
  meta: {
    provider: string;
    model: string;
    generatedAt: string;
    usedFallback: boolean;
    rawText?: string;
  };
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
  purchasePrice?: number | null;
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

export const updateWardrobeItemTags = (
  id: string,
  payload: { primaryCategory?: string | null; dominantColor?: string | null }
) =>
  apiFetch<{ item: ClothingItemResponse }>(`/api/items/${id}/tags`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    auth: true,
  });

export const markWardrobeItemWorn = (
  id: string,
  payload: { count?: number } = {}
) =>
  apiFetch<{ item: ClothingItemResponse }>(`/api/items/${id}/wear`, {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: true,
  });

export const fetchWearLogs = (params: { from?: string; to?: string; days?: number } = {}) => {
  const search = new URLSearchParams();
  if (params.from) {
    search.set('from', params.from);
  }
  if (params.to) {
    search.set('to', params.to);
  }
  if (typeof params.days === 'number' && Number.isFinite(params.days)) {
    search.set('days', String(params.days));
  }

  const query = search.toString();
  const path = `/api/items/wear/logs${query ? `?${query}` : ''}`;

  return apiFetch<WearLogResponse>(path, {
    auth: true,
  });
};

export const fetchOutfitCombinations = () =>
  apiFetch<OutfitCombinationsResponse>('/api/ai/style/combinations', {
    method: 'POST',
    auth: true,
  });

export const fetchNextPurchaseIdeas = () =>
  apiFetch<NextPurchaseResponse>('/api/ai/style/next-purchase', {
    method: 'POST',
    auth: true,
  });

export const fetchWeatherAwareOutfit = () =>
  apiFetch<WeatherAwareOutfitResponse>('/api/ai/style/weather-outfit', {
    method: 'POST',
    auth: true,
  });
