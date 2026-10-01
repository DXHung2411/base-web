import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import AboutSection from '../components/sections/About/AboutSection.astro';
import ContactSection from '../components/sections/Contact/ContactSection.astro';
import CtaSection from '../components/sections/Cta/CtaSection.astro';
import CustomSection from '../components/sections/Custom/CustomSection.astro';
import FaqSection from '../components/sections/Faq/FaqSection.astro';
import FeaturesSection from '../components/sections/Features/FeaturesSection.astro';
import GallerySection from '../components/sections/Gallery/GallerySection.astro';
import HeroSection from '../components/sections/Hero/HeroSection.astro';
import PricingSection from '../components/sections/Pricing/PricingSection.astro';
import ProductsSection from '../components/sections/Products/ProductsSection.astro';
import ServicesSection from '../components/sections/Services/ServicesSection.astro';
import StatsSection from '../components/sections/Stats/StatsSection.astro';
import TestimonialsSection from '../components/sections/Testimonials/TestimonialsSection.astro';
import type { SectionType } from '../types/sections';

/**
 * Maps a section type (as stored in the CMS) to its component. To add a section type:
 * 1. create components/sections/<Name>/<Name>Section.astro,
 * 2. add its settings type in types/sections.ts and its form in admin/sections/sectionDefs.ts,
 * 3. register it here and in SectionTypes on the backend.
 */
export const sectionComponents: Record<SectionType, AstroComponentFactory> = {
  hero: HeroSection,
  about: AboutSection,
  features: FeaturesSection,
  services: ServicesSection,
  products: ProductsSection,
  stats: StatsSection,
  pricing: PricingSection,
  testimonials: TestimonialsSection,
  faq: FaqSection,
  gallery: GallerySection,
  cta: CtaSection,
  contact: ContactSection,
  custom: CustomSection,
};
