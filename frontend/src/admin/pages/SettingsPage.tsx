import { useEffect, useState } from 'preact/hooks';
import { api } from '../api';
import { errorMessage, useLoad } from '../hooks';
import { settingDefs, settingGroups, type SettingDef } from '../../lib/settingDefs';
import { ImageField } from '../sections/FieldsEditor';
import { Button, Field, LoadingBlock, PageHeader, TextInput, Textarea } from '../ui/controls';
import { useToast } from '../ui/toast';

export function SettingsPage() {
  const toast = useToast();
  const { data, loading, reload } = useLoad(() => api.settings.list(), []);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    const loaded = Object.fromEntries(data.map((setting) => [setting.key, setting.value]));
    setValues(loaded);
    setSaved(loaded);
  }, [data]);

  if (loading && !data) return <LoadingBlock />;

  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const save = async (event: Event) => {
    event.preventDefault();
    const changed = Object.fromEntries(
      settingDefs.filter((def) => (values[def.key] ?? '') !== (saved[def.key] ?? '')).map((def) => [def.key, values[def.key] ?? '']),
    );
    if (!Object.keys(changed).length) {
      toast.success('Không có thay đổi nào để lưu.');
      return;
    }
    setSaving(true);
    try {
      await api.settings.update(changed);
      toast.success('Đã lưu cài đặt.');
      await reload();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Cài đặt chung" description="Áp dụng cho mọi landing page: thương hiệu, liên hệ, mạng xã hội và giao diện." />
      <form class="max-w-2xl space-y-10" onSubmit={(event) => void save(event)}>
        {settingGroups.map((group) => (
          <section key={group}>
            <h2 class="mb-4 border-b border-stone-200 pb-2 text-sm font-semibold text-stone-900">{group}</h2>
            <div class="space-y-4">
              {settingDefs.filter((def) => def.group === group).map((def) => (
                <SettingControl key={def.key} def={def} value={values[def.key] ?? ''} onChange={(value) => set(def.key, value)} />
              ))}
            </div>
          </section>
        ))}
        <Button type="submit" loading={saving}>Lưu cài đặt</Button>
      </form>
    </>
  );
}

function SettingControl({ def, value, onChange }: { def: SettingDef; value: string; onChange: (value: string) => void }) {
  if (def.kind === 'image') {
    return <ImageField label={def.label} value={value ? { src: value } : undefined} onChange={(image) => onChange(image?.src ?? '')} />;
  }
  if (def.kind === 'textarea') {
    return (
      <Field label={def.label} hint={def.hint}>
        <Textarea rows={3} value={value} placeholder={def.default} onInput={(e) => onChange(e.currentTarget.value)} />
      </Field>
    );
  }
  if (def.kind === 'color') {
    const current = value || def.default;
    return (
      <Field label={def.label} hint={def.hint}>
        <span class="flex items-center gap-2">
          <input type="color" class="h-9 w-12 cursor-pointer rounded border border-stone-300 bg-white p-0.5" value={current} onInput={(e) => onChange(e.currentTarget.value)} aria-label={def.label} />
          <TextInput class="max-w-[9rem]" value={value} placeholder={def.default} onInput={(e) => onChange(e.currentTarget.value)} />
        </span>
      </Field>
    );
  }
  return (
    <Field label={def.label} hint={def.hint}>
      <TextInput value={value} placeholder={def.default} onInput={(e) => onChange(e.currentTarget.value)} />
    </Field>
  );
}
