/**
 * Settings shape of each section type. These are the contract between the admin forms
 * (src/admin/sections/sectionDefs.ts) and the Astro components (src/components/sections).
 */
export const sectionTypes = [
  'hero', 'about', 'features', 'services', 'products', 'stats',
  'pricing', 'testimonials', 'faq', 'gallery', 'cta', 'contact', 'custom',
] as const;

export type SectionType = (typeof sectionTypes)[number];

export interface Img {
  src: string;
  alt?: string;
}

export interface Link {
  label: string;
  href: string;
}

export interface HeroSettings {
  eyebrow?: string;
  image?: Img;
  primaryCta?: Link;
  secondaryCta?: Link;
  facts?: { label: string; value: string }[];
}

export interface AboutSettings {
  quote?: string;
  quoteAuthor?: string;
  image?: Img;
  highlights?: string[];
}

export interface FeaturesSettings {
  items?: { title: string; description: string }[];
}

export interface ServicesSettings {
  items?: { title: string; description?: string; image?: Img; href?: string }[];
}

export interface ProductsSettings {
  items?: { name: string; price?: string; description?: string; image?: Img }[];
}

export interface StatsSettings {
  items?: { value: string; label: string }[];
}

export interface PricingSettings {
  note?: string;
  plans?: {
    name: string;
    price: string;
    unit?: string;
    description?: string;
    features?: string[];
    highlighted?: boolean;
    cta?: Link;
  }[];
}

export interface TestimonialsSettings {
  items?: { quote: string; name: string; detail?: string }[];
}

export interface FaqSettings {
  items?: { question: string; answer: string }[];
}

export interface GallerySettings {
  images?: Img[];
}

export interface CtaSettings {
  primaryCta?: Link;
  secondaryCta?: Link;
  note?: string;
}

export interface ContactSettings {
  /** Endpoint that receives the form POST (Formspree, Google Apps Script, your own API...). */
  formAction?: string;
  submitLabel?: string;
}

export interface CustomSettings {
  width?: 'narrow' | 'wide';
}

export interface SettingsByType {
  hero: HeroSettings;
  about: AboutSettings;
  features: FeaturesSettings;
  services: ServicesSettings;
  products: ProductsSettings;
  stats: StatsSettings;
  pricing: PricingSettings;
  testimonials: TestimonialsSettings;
  faq: FaqSettings;
  gallery: GallerySettings;
  cta: CtaSettings;
  contact: ContactSettings;
  custom: CustomSettings;
}

/** Props received by every section component. */
export interface SectionProps<T extends SectionType> {
  id: string;
  title?: string;
  subtitle?: string;
  content?: string;
  settings: SettingsByType[T];
}
