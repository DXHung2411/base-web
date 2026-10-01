import { useState } from 'preact/hooks';
import { ApiError, type LandingPageInput } from '../api';
import { errorMessage, serverFieldErrors } from '../hooks';
import { slugPattern, slugify } from '../slug';
import { Button, Field, TextInput, Textarea } from '../ui/controls';
import { useToast } from '../ui/toast';

interface PageFormProps {
  initial?: LandingPageInput;
  submitLabel: string;
  onSubmit: (input: LandingPageInput) => Promise<void>;
  onCancel?: () => void;
}

export function PageForm({ initial, submitLabel, onSubmit, onCancel }: PageFormProps) {
  const toast = useToast();
  const [values, setValues] = useState<LandingPageInput>(initial ?? { name: '', slug: '', title: '', description: '' });
  // Slug and title follow the name until the user edits them directly.
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [titleTouched, setTitleTouched] = useState(Boolean(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<LandingPageInput>) => setValues((current) => ({ ...current, ...patch }));

  const validate = () => {
    const found: Record<string, string> = {};
    if (!values.name.trim()) found.name = 'Vui lòng nhập tên trang.';
    if (!values.slug) found.slug = 'Vui lòng nhập slug.';
    else if (!slugPattern.test(values.slug)) found.slug = 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.';
    if (!values.title.trim()) found.title = 'Vui lòng nhập tiêu đề trang.';
    return found;
  };

  const submit = async (event: Event) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await onSubmit({ ...values, description: values.description?.trim() || undefined });
    } catch (error) {
      const fieldErrors = serverFieldErrors(error);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else if (error instanceof ApiError && error.status === 409) setErrors({ slug: error.message });
      else toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form class="space-y-4" onSubmit={(event) => void submit(event)} noValidate>
      <Field label="Tên trang (nội bộ)" required error={errors.name}>
        <TextInput
          value={values.name}
          maxLength={200}
          onInput={(e) => set({
            name: e.currentTarget.value,
            ...(slugTouched ? {} : { slug: slugify(e.currentTarget.value) }),
            ...(titleTouched ? {} : { title: e.currentTarget.value }),
          })}
        />
      </Field>
      <Field label="Slug" required error={errors.slug} hint="Đường dẫn của trang, ví dụ: tiec-cuoi">
        <TextInput
          value={values.slug}
          maxLength={100}
          onInput={(e) => {
            setSlugTouched(true);
            set({ slug: e.currentTarget.value });
          }}
        />
      </Field>
      <Field label="Tiêu đề trang" required error={errors.title} hint="Hiển thị trên tab trình duyệt và kết quả tìm kiếm.">
        <TextInput
          value={values.title}
          maxLength={200}
          onInput={(e) => {
            setTitleTouched(true);
            set({ title: e.currentTarget.value });
          }}
        />
      </Field>
      <Field label="Mô tả ngắn" error={errors.description}>
        <Textarea rows={3} maxLength={500} value={values.description ?? ''} onInput={(e) => set({ description: e.currentTarget.value })} />
      </Field>
      <div class="flex justify-end gap-2 pt-2">
        {onCancel && <Button variant="secondary" onClick={onCancel}>Hủy</Button>}
        <Button type="submit" loading={saving}>{submitLabel}</Button>
      </div>
    </form>
  );
}
