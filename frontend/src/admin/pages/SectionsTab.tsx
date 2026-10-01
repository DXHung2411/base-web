import { useState } from 'preact/hooks';
import { api } from '../api';
import { errorMessage, useLoad } from '../hooks';
import { SectionEditor } from '../sections/SectionEditor';
import { sectionDefByType, sectionDefs, type SectionDef } from '../sections/sectionDefs';
import type { LandingPage, Section } from '../../types/api';
import { Button, EmptyState, LoadingBlock, Toggle } from '../ui/controls';
import { Modal, useConfirm } from '../ui/dialog';
import { SortableList } from '../ui/SortableList';
import { useToast } from '../ui/toast';

interface EditingState {
  def: SectionDef;
  section?: Section;
}

export function SectionsTab({ page, onChanged }: { page: LandingPage; onChanged: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { data: sections, setData, loading, reload } = useLoad(() => api.sections.list(page.id), [page.id]);
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState<EditingState | null>(null);

  const refresh = async () => {
    await reload();
    onChanged();
  };

  const reorder = async (next: Section[]) => {
    setData(next);
    try {
      await api.sections.reorder(page.id, next.map((section) => section.id));
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error));
      await reload();
    }
  };

  const setVisible = async (section: Section, isVisible: boolean) => {
    setData((sections ?? []).map((item) => (item.id === section.id ? { ...item, isVisible } : item)));
    try {
      await api.sections.update(section.id, { ...section, isVisible });
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error));
      await reload();
    }
  };

  const remove = async (section: Section) => {
    const label = section.title || sectionDefByType(section.sectionType)?.label || section.sectionType;
    const ok = await confirm({
      title: 'Xóa section',
      message: `Xóa section "${label}"? Thao tác này không thể hoàn tác.`,
      confirmLabel: 'Xóa section',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.sections.remove(section.id);
      toast.success('Đã xóa section.');
      await refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (loading && !sections) return <LoadingBlock />;

  return (
    <div>
      <div class="mb-4 flex items-center justify-between gap-3">
        <p class="text-sm text-stone-500">Kéo thả để đổi thứ tự hiển thị trên trang.</p>
        <Button onClick={() => setPicking(true)}>Thêm section</Button>
      </div>

      {!sections?.length ? (
        <EmptyState title="Trang chưa có section nào" hint="Thêm section đầu tiên, thường là Hero." action={<Button onClick={() => setPicking(true)}>Thêm section</Button>} />
      ) : (
        <SortableList
          items={sections}
          onReorder={(next) => void reorder(next)}
          renderItem={(section) => {
            const def = sectionDefByType(section.sectionType);
            return (
              <div class="flex items-center gap-3">
                <div class={`min-w-0 flex-1 ${section.isVisible ? '' : 'opacity-50'}`}>
                  <div class="text-xs text-stone-500">{def?.label ?? section.sectionType}</div>
                  <div class="truncate text-sm font-medium text-stone-900">{section.title || '(Không có tiêu đề)'}</div>
                </div>
                <Toggle checked={section.isVisible} onChange={(value) => void setVisible(section, value)} label={section.isVisible ? 'Đang hiển thị' : 'Đang ẩn'} />
                <Button variant="secondary" small disabled={!def} onClick={() => def && setEditing({ def, section })}>Sửa</Button>
                <Button variant="ghost" small onClick={() => void remove(section)}>Xóa</Button>
              </div>
            );
          }}
        />
      )}

      {picking && (
        <Modal title="Chọn loại section" onClose={() => setPicking(false)} size="max-w-xl">
          <ul class="divide-y divide-stone-200">
            {sectionDefs.map((def) => (
              <li key={def.type}>
                <button
                  type="button"
                  class="block w-full px-1 py-3 text-left hover:bg-stone-50"
                  onClick={() => {
                    setPicking(false);
                    setEditing({ def });
                  }}
                >
                  <span class="block text-sm font-medium text-stone-900">{def.label}</span>
                  <span class="block text-xs text-stone-500">{def.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {editing && (
        <SectionEditor
          pageId={page.id}
          def={editing.def}
          section={editing.section}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void refresh();
          }}
        />
      )}
    </div>
  );
}
