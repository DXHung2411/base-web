import type { ApiFailure, ApiSuccess, PublicPage, PublicPageSummary } from '../types/api';
import { apiUrl } from './env';

async function get<T>(path: string): Promise<T | null> {
  const response = await fetch(`${apiUrl()}${path}`, { headers: { Accept: 'application/json' } });
  if (response.status === 404) return null;

  const body = (await response.json()) as ApiSuccess<T> | ApiFailure;
  if (!response.ok || !body.success) throw new Error(`API ${path} failed: ${response.status}`);
  return body.data;
}

export const getPublicPage = (slug: string) => get<PublicPage>(`/api/public/landing-pages/${encodeURIComponent(slug)}`);

export const getPreviewPage = (id: string, token: string) =>
  get<PublicPage>(`/api/public/preview/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`);

export const listPublicPages = async () => (await get<PublicPageSummary[]>('/api/public/landing-pages')) ?? [];

export const getPublicSettings = async () => (await get<Record<string, string>>('/api/public/settings')) ?? {};
