import { useState } from 'preact/hooks';
import { mediaUrl } from '../api';
import type { Img } from '../../types/sections';
import { Button, Field, Select, TextInput, Textarea } from '../ui/controls';
import { MediaPicker } from '../ui/MediaPicker';
import type { Field as FieldDef } from './sectionDefs';

type Values = Record<string, unknown>;

interface FieldsEditorProps {
  fields: FieldDef[];
  value: Values;
  onChange: (value: Values) => void;
}

const isBlank = (value: unknown) =>
  value === undefined || value === '' || value === null ||
  (typeof value === 'object' && !Array.isArray(value) && Object.values(value as Values).every(isBlank));

/** Writes a key, dropping it when blank so saved JSON stays free of empty strings. */
const withValue = (values: Values, key: string, next: unknown): Values => {
  const copy = { ...values };
  if (isBlank(next)) delete copy[key];
  else copy[key] = next;
  return copy;
};

const moveItem = <T,>(list: T[], from: number, to: number) => {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

/** Renders a form from field definitions. Lists nest FieldsEditor recursively. */
export function FieldsEditor({ fields, value, onChange }: FieldsEditorProps) {
  return (
    <div class="space-y-4">
      {fields.map((field) => (
        <FieldControl
          key={field.key}
          field={field}
          value={value[field.key]}
          onChange={(next) => onChange(withValue(value, field.key, next))}
        />
      ))}
    </div>
  );
}

interface FieldControlProps {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FieldControl({ field, value, onChange }: FieldControlProps) {
  switch (field.kind) {
    case 'text':
      return (
        <Field label={field.label} hint={field.hint}>
          <TextInput value={(value as string) ?? ''} placeholder={field.placeholder} onInput={(e) => onChange(e.currentTarget.value)} />
        </Field>
      );
    case 'textarea':
      return (
        <Field label={field.label} hint={field.hint}>
          <Textarea rows={field.rows} value={(value as string) ?? ''} onInput={(e) => onChange(e.currentTarget.value)} />
        </Field>
      );
    case 'boolean':
      return (
        <label class="flex items-center gap-2 text-sm text-stone-800">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.currentTarget.checked)} />
          {field.label}
        </label>
      );
    case 'select':
      return (
        <Field label={field.label}>
          <Select value={(value as string) ?? field.options[0].value} onChange={(e) => onChange(e.currentTarget.value)}>
            {field.options.map((option) => <option value={option.value}>{option.label}</option>)}
          </Select>
        </Field>
      );
    case 'link': {
      const link = (value as { label?: string; href?: string } | undefined) ?? {};
      return (
        <fieldset>
          <legend class="mb-1 text-sm font-medium text-stone-800">{field.label}</legend>
          <div class="grid gap-2 sm:grid-cols-2">
            <TextInput placeholder="Nhãn nút" aria-label={`${field.label}: nhãn`} value={link.label ?? ''}
              onInput={(e) => onChange({ ...link, label: e.currentTarget.value })} />
            <TextInput placeholder="Liên kết, ví dụ #lien-he" aria-label={`${field.label}: liên kết`} value={link.href ?? ''}
              onInput={(e) => onChange({ ...link, href: e.currentTarget.value })} />
          </div>
        </fieldset>
      );
    }
    case 'image':
      return <ImageField label={field.label} value={value as Img | undefined} onChange={onChange} />;
    case 'imageList':
      return <ImageListField label={field.label} value={(value as Img[] | undefined) ?? []} onChange={onChange} />;
    case 'stringList':
      return <StringListField field={field} value={(value as string[] | undefined) ?? []} onChange={onChange} />;
    case 'list':
      return <ListField field={field} value={(value as Values[] | undefined) ?? []} onChange={onChange} />;
  }
}

export function ImageField({ label, value, onChange }: { label: string; value?: Img; onChange: (value: Img | undefined) => void }) {
  const [picking, setPicking] = useState(false);
  return (
    <div>
      <span class="mb-1 block text-sm font-medium text-stone-800">{label}</span>
      <div class="flex items-start gap-3">
        <div class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-stone-300 bg-stone-100 text-xs text-stone-400">
          {value?.src ? <img src={mediaUrl(value.src)} alt="" class="h-full w-full object-cover" /> : 'Chưa có'}
        </div>
        <div class="min-w-0 flex-1 space-y-2">
          <div class="flex gap-2">
            <Button variant="secondary" small onClick={() => setPicking(true)}>Chọn từ thư viện</Button>
            {value?.src && <Button variant="ghost" small onClick={() => onChange(undefined)}>Xóa ảnh</Button>}
          </div>
          <TextInput placeholder="Hoặc dán đường dẫn ảnh" aria-label={`${label}: đường dẫn`} value={value?.src ?? ''}
            onInput={(e) => onChange({ ...value, src: e.currentTarget.value })} />
          <TextInput placeholder="Mô tả ảnh (alt)" aria-label={`${label}: mô tả`} value={value?.alt ?? ''}
            onInput={(e) => onChange({ src: value?.src ?? '', alt: e.currentTarget.value })} />
        </div>
      </div>
      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onSelect={([media]) => {
            onChange({ src: media.fileUrl, alt: media.altText ?? value?.alt ?? '' });
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}

function ImageListField({ label, value, onChange }: { label: string; value: Img[]; onChange: (value: Img[]) => void }) {
  const [picking, setPicking] = useState(false);
  const update = (index: number, next: Img) => onChange(value.map((item, i) => (i === index ? next : item)));
  return (
    <div>
      <span class="mb-1 block text-sm font-medium text-stone-800">{label} ({value.length})</span>
      <ul class="space-y-2">
        {value.map((image, index) => (
          <li key={`${image.src}-${index}`} class="flex items-center gap-2 rounded-md border border-stone-200 p-2">
            <img src={mediaUrl(image.src)} alt="" class="h-12 w-12 shrink-0 rounded object-cover" />
            <TextInput class="min-w-0 flex-1" placeholder="Mô tả ảnh (alt)" aria-label="Mô tả ảnh" value={image.alt ?? ''}
              onInput={(e) => update(index, { ...image, alt: e.currentTarget.value })} />
            <Button variant="ghost" small disabled={index === 0} aria-label="Chuyển lên" onClick={() => onChange(moveItem(value, index, index - 1))}>▲</Button>
            <Button variant="ghost" small disabled={index === value.length - 1} aria-label="Chuyển xuống" onClick={() => onChange(moveItem(value, index, index + 1))}>▼</Button>
            <Button variant="ghost" small aria-label="Xóa ảnh" onClick={() => onChange(value.filter((_, i) => i !== index))}>Xóa</Button>
          </li>
        ))}
      </ul>
      <Button variant="secondary" small class="mt-2" onClick={() => setPicking(true)}>Thêm ảnh</Button>
      {picking && (
        <MediaPicker
          multiple
          onClose={() => setPicking(false)}
          onSelect={(items) => {
            onChange([...value, ...items.map((media) => ({ src: media.fileUrl, alt: media.altText ?? '' }))]);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}

function StringListField({ field, value, onChange }: { field: Extract<FieldDef, { kind: 'stringList' }>; value: string[]; onChange: (value: string[]) => void }) {
  return (
    <div>
      <span class="mb-1 block text-sm font-medium text-stone-800">{field.label}</span>
      <ul class="space-y-2">
        {value.map((text, index) => (
          <li key={index} class="flex gap-2">
            <TextInput value={text} aria-label={`${field.label} ${index + 1}`}
              onInput={(e) => onChange(value.map((item, i) => (i === index ? e.currentTarget.value : item)))} />
            <Button variant="ghost" small aria-label="Xóa dòng" onClick={() => onChange(value.filter((_, i) => i !== index))}>Xóa</Button>
          </li>
        ))}
      </ul>
      <Button variant="secondary" small class="mt-2" onClick={() => onChange([...value, ''])}>{field.addLabel}</Button>
    </div>
  );
}

function ListField({ field, value, onChange }: { field: Extract<FieldDef, { kind: 'list' }>; value: Values[]; onChange: (value: Values[]) => void }) {
  return (
    <div>
      <span class="mb-1 block text-sm font-medium text-stone-800">{field.label} ({value.length})</span>
      <ul class="space-y-2">
        {value.map((item, index) => (
          <li key={index} class="rounded-md border border-stone-200">
            <details open={!item[field.itemTitleKey]}>
              <summary class="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm">
                <span class="min-w-0 truncate font-medium">{(item[field.itemTitleKey] as string) || `Mục ${index + 1}`}</span>
                <span class="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" small disabled={index === 0} aria-label="Chuyển lên" onClick={(e) => { e.preventDefault(); onChange(moveItem(value, index, index - 1)); }}>▲</Button>
                  <Button variant="ghost" small disabled={index === value.length - 1} aria-label="Chuyển xuống" onClick={(e) => { e.preventDefault(); onChange(moveItem(value, index, index + 1)); }}>▼</Button>
                  <Button variant="ghost" small aria-label="Xóa mục" onClick={(e) => { e.preventDefault(); onChange(value.filter((_, i) => i !== index)); }}>Xóa</Button>
                </span>
              </summary>
              <div class="border-t border-stone-200 p-3">
                <FieldsEditor fields={field.fields} value={item} onChange={(next) => onChange(value.map((entry, i) => (i === index ? next : entry)))} />
              </div>
            </details>
          </li>
        ))}
      </ul>
      <Button variant="secondary" small class="mt-2" onClick={() => onChange([...value, {}])}>{field.addLabel}</Button>
    </div>
  );
}
