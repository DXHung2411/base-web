/**
 * Single source of truth for site-wide settings (stored as SiteSetting rows).
 * The admin Settings screen renders its form from this list, and the website reads
 * values through getSiteConfig(), falling back to the defaults here.
 */
export type SettingKind = 'text' | 'textarea' | 'color' | 'image';

export interface SettingDef {
  key: string;
  label: string;
  group: string;
  kind: SettingKind;
  default: string;
  hint?: string;
}

const def = (group: string, key: string, label: string, kind: SettingKind, defaultValue = '', hint?: string): SettingDef =>
  ({ group, key, label, kind, default: defaultValue, hint });

export const settingDefs = [
  def('Thương hiệu', 'company.name', 'Tên đơn vị', 'text', 'Tên đơn vị'),
  def('Thương hiệu', 'company.tagline', 'Câu giới thiệu ngắn', 'text'),
  def('Thương hiệu', 'brand.logoUrl', 'Logo', 'image'),
  def('Thương hiệu', 'brand.faviconUrl', 'Favicon', 'image', '/favicon.svg'),

  def('Liên hệ', 'company.phone', 'Điện thoại', 'text'),
  def('Liên hệ', 'company.email', 'Email', 'text'),
  def('Liên hệ', 'company.address', 'Địa chỉ', 'textarea'),
  def('Liên hệ', 'company.hours', 'Giờ làm việc', 'text'),

  def('Mạng xã hội', 'social.facebook', 'Facebook', 'text'),
  def('Mạng xã hội', 'social.instagram', 'Instagram', 'text'),
  def('Mạng xã hội', 'social.youtube', 'YouTube', 'text'),
  def('Mạng xã hội', 'social.tiktok', 'TikTok', 'text'),
  def('Mạng xã hội', 'social.zalo', 'Zalo', 'text'),

  def('Giao diện', 'theme.primaryColor', 'Màu nhấn (nút, liên kết)', 'color', '#7b2d26'),
  def('Giao diện', 'theme.secondaryColor', 'Màu phụ (chú thích, nhãn nhỏ)', 'color', '#7d6a45',
    'Dùng cho chữ nhỏ, nên chọn màu đủ tương phản với màu nền (tối thiểu 4.5:1).'),
  def('Giao diện', 'theme.backgroundColor', 'Màu nền', 'color', '#f5f0e6'),
  def('Giao diện', 'theme.textColor', 'Màu chữ', 'color', '#1d1916'),
  def('Giao diện', 'theme.fontFamily', 'Font nội dung', 'text', "'Be Vietnam Pro', system-ui, sans-serif",
    'Giá trị CSS font-family. Font mặc định được đóng gói sẵn trong website.'),
  def('Giao diện', 'theme.headingFontFamily', 'Font tiêu đề', 'text', "'Newsreader Variable', Georgia, serif"),
  def('Giao diện', 'theme.borderRadius', 'Bo góc cơ bản', 'text', '4px', 'Ví dụ: 0, 4px, 8px.'),

  def('Trang web', 'site.homeSlug', 'Landing page hiển thị ở trang chủ (slug)', 'text', 'home'),
  def('Trang web', 'header.ctaLabel', 'Nút trên thanh menu: nhãn', 'text'),
  def('Trang web', 'header.ctaUrl', 'Nút trên thanh menu: liên kết', 'text', '#lien-he'),
  def('Trang web', 'footer.text', 'Dòng bản quyền ở chân trang', 'text'),
] as const satisfies readonly SettingDef[];

export type SettingKey = (typeof settingDefs)[number]['key'];
export type SiteConfig = Record<SettingKey, string>;

export const settingGroups = [...new Set(settingDefs.map((setting) => setting.group))];

export function getSiteConfig(values: Record<string, string>): SiteConfig {
  const config = {} as SiteConfig;
  for (const setting of settingDefs) {
    const value = values[setting.key];
    config[setting.key] = value === undefined || value === '' ? setting.default : value;
  }
  return config;
}
