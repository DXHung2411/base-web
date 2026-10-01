import type { SectionType } from './sections';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface User {
  id: number;
  username: string;
  role: 'Admin' | 'Editor';
}

export interface LoginResult {
  token: string;
  expiresAt: string;
  user: User;
}

export interface LandingPage {
  id: number;
  name: string;
  slug: string;
  title: string;
  description?: string;
  isPublished: boolean;
  sectionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: number;
  landingPageId: number;
  sectionType: SectionType;
  title?: string;
  subtitle?: string;
  content?: string;
  sortOrder: number;
  isVisible: boolean;
  settings: Record<string, unknown>;
}

export type SectionInput = Pick<Section, 'sectionType' | 'title' | 'subtitle' | 'content' | 'isVisible' | 'settings'>;

export interface MenuItem {
  id: number;
  landingPageId: number;
  title: string;
  url: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface Seo {
  landingPageId: number;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export interface Media {
  id: number;
  fileName: string;
  fileUrl: string;
  altText?: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface SiteSetting {
  key: string;
  value: string;
  description?: string;
}

/** Shape returned by the public API (and used to render the website). */
export interface PublicSection {
  id: number;
  sectionType: SectionType;
  title?: string;
  subtitle?: string;
  content?: string;
  settings: Record<string, unknown>;
}

export interface PublicPage {
  slug: string;
  title: string;
  description?: string;
  updatedAt: string;
  seo?: Omit<Seo, 'landingPageId'>;
  menu: { title: string; url: string }[];
  sections: PublicSection[];
}

export interface PublicPageSummary {
  slug: string;
  updatedAt: string;
}
