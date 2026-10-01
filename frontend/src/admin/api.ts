import type {
  ApiFailure, ApiSuccess, LandingPage, LoginResult, Media, MenuItem, Paged, Section, SectionInput, Seo, SiteSetting, User,
} from '../types/api';

const SESSION_KEY = 'cms.session';

export interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly errors?: Record<string, string[]>) {
    super(message);
  }
}

let baseUrl = '';
let onUnauthorized: () => void = () => {};

export function configureApi(apiUrl: string, unauthorizedHandler: () => void) {
  baseUrl = apiUrl.replace(/\/$/, '');
  onUnauthorized = unauthorizedHandler;
}

export function mediaUrl(fileUrl: string): string {
  return fileUrl.startsWith('/uploads/') ? `${baseUrl}${fileUrl}` : fileUrl;
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage can be unavailable (private mode); the in-memory session still works.
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = loadSession()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError('Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng và thử lại.', 0);
  }

  const result = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;
  if (response.ok && result?.success) return result.data as T;

  if (response.status === 401 && token) {
    clearSession();
    onUnauthorized();
  }
  throw new ApiError(
    result && !result.success ? result.message : `Yêu cầu thất bại (${response.status}).`,
    response.status,
    result && !result.success ? result.errors : undefined,
  );
}

const query = (params: Record<string, string | number | boolean | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
};

export interface LandingPageInput {
  name: string;
  slug: string;
  title: string;
  description?: string;
}

export interface MenuItemInput {
  title: string;
  url: string;
  isVisible: boolean;
}

export const api = {
  auth: {
    login: (username: string, password: string) => request<LoginResult>('POST', '/api/auth/login', { username, password }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<null>('POST', '/api/auth/change-password', { currentPassword, newPassword }),
  },
  pages: {
    list: (params: { search?: string; isPublished?: boolean; page?: number; pageSize?: number }) =>
      request<Paged<LandingPage>>('GET', `/api/admin/landing-pages${query(params)}`),
    get: (id: number) => request<LandingPage>('GET', `/api/admin/landing-pages/${id}`),
    create: (input: LandingPageInput) => request<LandingPage>('POST', '/api/admin/landing-pages', input),
    update: (id: number, input: LandingPageInput) => request<LandingPage>('PUT', `/api/admin/landing-pages/${id}`, input),
    setPublished: (id: number, isPublished: boolean) =>
      request<LandingPage>('PATCH', `/api/admin/landing-pages/${id}/publish`, { isPublished }),
    remove: (id: number) => request<null>('DELETE', `/api/admin/landing-pages/${id}`),
    previewToken: (id: number) => request<{ token: string }>('POST', `/api/admin/landing-pages/${id}/preview-token`),
  },
  sections: {
    list: (pageId: number) => request<Section[]>('GET', `/api/admin/landing-pages/${pageId}/sections`),
    create: (pageId: number, input: SectionInput) => request<Section>('POST', `/api/admin/landing-pages/${pageId}/sections`, input),
    update: (id: number, input: SectionInput) => request<Section>('PUT', `/api/admin/sections/${id}`, input),
    remove: (id: number) => request<null>('DELETE', `/api/admin/sections/${id}`),
    reorder: (landingPageId: number, orderedIds: number[]) =>
      request<null>('PUT', '/api/admin/sections/reorder', { landingPageId, orderedIds }),
  },
  menu: {
    list: (landingPageId: number) => request<MenuItem[]>('GET', `/api/admin/menu${query({ landingPageId })}`),
    create: (landingPageId: number, input: MenuItemInput) => request<MenuItem>('POST', '/api/admin/menu', { landingPageId, ...input }),
    update: (id: number, input: MenuItemInput) => request<MenuItem>('PUT', `/api/admin/menu/${id}`, input),
    remove: (id: number) => request<null>('DELETE', `/api/admin/menu/${id}`),
    reorder: (landingPageId: number, orderedIds: number[]) =>
      request<null>('PUT', '/api/admin/menu/reorder', { landingPageId, orderedIds }),
  },
  seo: {
    get: (landingPageId: number) => request<Seo>('GET', `/api/admin/seo/${landingPageId}`),
    update: (landingPageId: number, input: Omit<Seo, 'landingPageId'>) =>
      request<Seo>('PUT', `/api/admin/seo/${landingPageId}`, input),
  },
  media: {
    list: (params: { search?: string; page?: number; pageSize?: number }) =>
      request<Paged<Media>>('GET', `/api/admin/media${query(params)}`),
    upload: (file: File, altText?: string) => {
      const form = new FormData();
      form.append('file', file);
      if (altText) form.append('altText', altText);
      return request<Media>('POST', '/api/admin/media', form);
    },
    update: (id: number, altText: string) => request<Media>('PUT', `/api/admin/media/${id}`, { altText }),
    remove: (id: number) => request<null>('DELETE', `/api/admin/media/${id}`),
  },
  settings: {
    list: () => request<SiteSetting[]>('GET', '/api/admin/settings'),
    update: (values: Record<string, string>) => request<null>('PUT', '/api/admin/settings', { values }),
  },
  users: {
    list: () => request<User[]>('GET', '/api/admin/users'),
    create: (input: { username: string; password: string; role: string }) => request<User>('POST', '/api/admin/users', input),
    update: (id: number, input: { role: string; newPassword?: string }) => request<User>('PUT', `/api/admin/users/${id}`, input),
    remove: (id: number) => request<null>('DELETE', `/api/admin/users/${id}`),
  },
};
