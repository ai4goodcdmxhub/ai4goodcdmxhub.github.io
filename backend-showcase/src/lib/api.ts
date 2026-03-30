export type SentimentResult = {
  score: number;
  comparative: number;
  tokens: string[];
  words: string[];
  positive: string[];
  negative: string[];
};

export type SocialSource = 'twitter' | 'facebook' | 'bluesky';

export type SocialPost = {
  id: string;
  text: string;
  created_at?: string;
  sentiment: SentimentResult;
  source: SocialSource;
};

export type SearchParams = {
  query: string;
  maxResults?: number;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

async function handleResponse<T>(response: Response, defaultMessage: string): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const backendMessage =
      data && typeof data === 'object' && 'error' in data ? String((data as { error?: unknown }).error) : '';
    throw new Error(backendMessage || defaultMessage);
  }

  return data as T;
}

function buildSearchUrl(path: string, params: SearchParams): string {
  const search = new URLSearchParams({ query: params.query });
  if (typeof params.maxResults === 'number') {
    search.set('maxResults', String(params.maxResults));
  }
  return `${API_BASE_URL}${path}?${search.toString()}`;
}

export async function fetchTwitterPosts(params: SearchParams): Promise<SocialPost[]> {
  const response = await fetch(buildSearchUrl('/api/twitter/search', params));
  return handleResponse<SocialPost[]>(response, 'No se pudieron cargar los posts de Twitter');
}

export async function fetchFacebookPosts(params: SearchParams): Promise<SocialPost[]> {
  const response = await fetch(buildSearchUrl('/api/facebook/search', params));
  return handleResponse<SocialPost[]>(response, 'No se pudieron cargar los posts de Facebook');
}

export async function fetchBlueskyPosts(params: SearchParams): Promise<SocialPost[]> {
  const response = await fetch(buildSearchUrl('/api/bluesky/search', params));
  return handleResponse<SocialPost[]>(response, 'No se pudieron cargar los posts de Bluesky');
}

export async function fetchAllSocialPosts(params: SearchParams): Promise<SocialPost[]> {
  const response = await fetch(buildSearchUrl('/api/social/search', params));
  return handleResponse<SocialPost[]>(response, 'No se pudieron cargar los posts de redes sociales');
}