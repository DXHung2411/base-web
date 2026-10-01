import { useState } from 'preact/hooks';
import { api } from '../api';
import { errorMessage } from '../hooks';
import type { Section, SectionInput } from '../../types/api';
import { Button, Field, TextInput, Textarea, Toggle } from '../ui/controls';
import { Modal } from '../ui/dialog';
import { useToast } from '../ui/toast';
import { FieldsEditor } from './FieldsEditor';
import type { SectionDef } from './sectionDefs';

interface SectionEditorProps {
  pageId: number;
  def: SectionDef;
  /** Present when editing; absent when creating a new section. */
  section?: Section;
  onSaved: (section: Section) => void;
  onClose: () => void;
}

export function SectionEditor({ pageId, def, section, onSaved, onClose }: SectionEditorProps) {
  const toast = useToast();
  const initial = section ?? { ...def.defaults, isVisible: true };
  const [title, setTitle] = useState(initial.title ?? '');
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? '');
  const [content, setContent] = useState(initial.content ?? '');
  const [isVisible, setIsVisible] = useState(initial.isVisible);
  const [settings, setSettings] = useState<Record<string, unknown>>(initial.settings);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const input: SectionInput = {
      sectionType: def.type,
      title: title.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      content: content.trim() || undefined,
      isVisible,
      settings,
    };
    setSaving(true);
    try {
      const saved = section ? await api.sections.update(section.id, input) : await api.sections.create(pageId, input);
      toast.success('Đã lưu section.');
      onSaved(saved);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`${section ? 'Sửa' : 'Thêm'} section: ${def.label}`} onClose={onClose} size="max-w-2xl">
      <div class="space-y-4">
        {def.title && (
          <Field label={def.title}>
            <TextInput value={title} maxLength={300} onInput={(e) => setTitle(e.currentTarget.value)} />
          </Field>
        )}
        {def.subtitle && (
          <Field label={def.subtitle}>
            <TextInput value={subtitle} maxLength={500} onInput={(e) => setSubtitle(e.currentTarget.value)} />
          </Field>
        )}
        {def.content && (
          <Field label={def.content}>
            <Textarea rows={def.type === 'custom' ? 10 : 6} value={content} onInput={(e) => setContent(e.currentTarget.value)} />
          </Field>
        )}
        <FieldsEditor fields={def.settings} value={settings} onChange={setSettings} />
        <label class="flex items-center gap-3 text-sm text-stone-800">
          <Toggle checked={isVisible} onChange={setIsVisible} label="Hiển thị section" />
          Hiển thị trên website
        </label>
      </div>
      <div class="mt-6 flex justify-end gap-2 border-t border-stone-200 pt-4">
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button loading={saving} onClick={() => void save()}>Lưu section</Button>
      </div>
    </Modal>
  );
}
