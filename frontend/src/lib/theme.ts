import type { SiteConfig } from './settingDefs';

/** Turns theme settings into CSS custom properties consumed by src/styles/global.css. */
export function themeToCss(site: SiteConfig): string {
  const declarations = [
    ['--theme-primary', site['theme.primaryColor']],
    ['--theme-secondary', site['theme.secondaryColor']],
    ['--theme-bg', site['theme.backgroundColor']],
    ['--theme-text', site['theme.textColor']],
    ['--theme-font', site['theme.fontFamily']],
    ['--theme-heading-font', site['theme.headingFontFamily']],
    ['--theme-radius', site['theme.borderRadius']],
  ];
  // Values come from admin-controlled settings: strip anything that could close the style block.
  return `:root{${declarations.map(([name, value]) => `${name}:${value.replace(/[<>{};]/g, '')}`).join(';')}}`;
}
