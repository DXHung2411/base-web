import { useEffect, useState } from 'preact/hooks';
import { api } from '../api';
import { errorMessage, serverFieldErrors, useLoad } from '../hooks';
import { ImageField } from '../sections/FieldsEditor';
import type { LandingPage, Seo } from '../../types/api';
import { Button, Field, LoadingBlock, TextInput, Textarea } from '../ui/controls';
import { useToast } from '../ui/toast';

type SeoValues = Omit<Seo, 'landingPageId'>;

export function SeoTab({ page }: { page: LandingPage }) {
  const toast = useToast();
  const { data, loading } = useLoad(() => api.seo.get(page.id), [page.id]);
  const [values, setValues] = useState<SeoValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setValues(data);
  }, [data]);

  if (loading && !data) return <LoadingBlock />;

  const set = (patch: Partial<SeoValues>) => setValues((current) => ({ ...current, ...patch }));

  const save = async (event: Event) => {
    event.preventDefault();
    if (values.canonicalUrl && !/^https?:\/\//.test(values.canonicalUrl)) {
      setErrors({ canonicalUrl: 'Canonical URL phải bắt đầu bằng http:// hoặc https://' });
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await api.seo.update(page.id, values);
      toast.success('Đã lưu SEO.');
    } catch (error) {
      const fieldErrors = serverFieldErrors(error);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const titleLength = values.metaTitle?.length ?? 0;
  const descriptionLength = values.metaDescription?.length ?? 0;

  return (
    <form class="max-w-xl space-y-4" onSubmit={(event) => void save(event)} noValidate>
      <p class="text-sm text-stone-500">Để trống để dùng tiêu đề và mô tả của landing page.</p>
      <Field label="Meta title" hint={`${titleLength}/60 ký tự khuyến nghị`} error={errors.metaTitle}>
        <TextInput value={values.metaTitle ?? ''} maxLength={200} onInput={(e) => set({ metaTitle: e.currentTarget.value })} />
      </Field>
      <Field label="Meta description" hint={`${descriptionLength}/160 ký tự khuyến nghị`} error={errors.metaDescription}>
        <Textarea rows={3} maxLength={500} value={values.metaDescription ?? ''} onInput={(e) => set({ metaDescription: e.currentTarget.value })} />
      </Field>
      <Field label="Từ khóa" hint="Cách nhau bằng dấu phẩy." error={errors.keywords}>
        <TextInput value={values.keywords ?? ''} maxLength={500} onInput={(e) => set({ keywords: e.currentTarget.value })} />
      </Field>
      <ImageField
        label="Ảnh chia sẻ (Open Graph), khuyến nghị 1200×630"
        value={values.ogImage ? { src: values.ogImage } : undefined}
        onChange={(image) => set({ ogImage: image?.src })}
      />
      <Field label="Canonical URL" hint="Địa chỉ chính thức của trang, ví dụ https://ten-mien.vn/" error={errors.canonicalUrl}>
        <TextInput value={values.canonicalUrl ?? ''} maxLength={500} onInput={(e) => set({ canonicalUrl: e.currentTarget.value })} />
      </Field>
      <Button type="submit" loading={saving}>Lưu SEO</Button>
    </form>
  );
}
