/** "Tiệc cưới 2026" -> "tiec-cuoi-2026" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
