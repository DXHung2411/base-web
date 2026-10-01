/** Splits admin-entered text into paragraphs on blank lines. */
export function paragraphs(text: string | undefined): string[] {
  return (text ?? '').split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
