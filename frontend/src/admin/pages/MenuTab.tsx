import { useState } from 'preact/hooks';
import { api, type MenuItemInput } from '../api';
import { errorMessage, useLoad } from '../hooks';
import type { LandingPage, MenuItem } from '../../types/api';
import { Button, EmptyState, Field, LoadingBlock, TextInput, Toggle } from '../ui/controls';
import { Modal, useConfirm } from '../ui/dialog';
import { SortableList } from '../ui/SortableList';
import { useToast } from '../ui/toast';

export function MenuTab({ page, onChanged }: { page: LandingPage; onChanged: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { data: items, setData, loading, reload } = useLoad(() => api.menu.list(page.id), [page.id]);
  const [editing, setEditing] = useState<MenuItem | 'new' | null>(null);

  const reorder = async (next: MenuItem[]) => {
    setData(next);
    try {
      await api.menu.reorder(page.id, next.map((item) => item.id));
    } catch (error) {
      toast.error(errorMessage(error));
      await reload();
    }
  };

  const setVisible = async (item: MenuItem, isVisible: boolean) => {
    setData((items ?? []).map((entry) => (entry.id === item.id ? { ...entry, isVisible } : entry)));
    try {
      await api.menu.update(item.id, { title: item.title, url: item.url, isVisible });
    } catch (error) {
      toast.error(errorMessage(error));
      await reload();
    }
  };

  const remove = async (item: MenuItem) => {
    const ok = await confirm({ title: 'Xóa mục menu', message: `Xóa mục "${item.title}" khỏi menu?`, confirmLabel: 'Xóa', danger: true });
    if (!ok) return;
    try {
      await api.menu.remove(item.id);
      toast.success('Đã xóa mục menu.');
      await reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (loading && !items) return <LoadingBlock />;

  return (
    <div>
      <div class="mb-4 flex items-center justify-between gap-3">
        <p class="text-sm text-stone-500">Menu hiển thị trên thanh đầu trang của landing page này.</p>
        <Button onClick={() => setEditing('new')}>Thêm mục menu</Button>
      </div>

      {!items?.length ? (
        <EmptyState title="Chưa có mục menu" hint="Thêm liên kết tới các phần của trang, ví dụ #gia-tiec." />
      ) : (
        <SortableList
          items={items}
          onReorder={(next) => void reorder(next)}
          renderItem={(item) => (
            <div class="flex items-center gap-3">
              <div class={`min-w-0 flex-1 ${item.isVisible ? '' : 'opacity-50'}`}>
                <div class="truncate text-sm font-medium text-stone-900">{item.title}</div>
                <div class="truncate text-xs text-stone-500">{item.url}</div>
              </div>
              <Toggle checked={item.isVisible} onChange={(value) => void setVisible(item, value)} label={item.isVisible ? 'Đang hiển thị' : 'Đang ẩn'} />
              <Button variant="secondary" small onClick={() => setEditing(item)}>Sửa</Button>
              <Button variant="ghost" small onClick={() => void remove(item)}>Xóa</Button>
            </div>
          )}
        />
      )}

      {editing && (
        <MenuItemModal
          item={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSubmit={async (input) => {
            if (editing === 'new') await api.menu.create(page.id, input);
            else await api.menu.update(editing.id, input);
            toast.success('Đã lưu mục menu.');
            setEditing(null);
            await reload();
            onChanged();
          }}
        />
      )}
    </div>
  );
}

interface MenuItemModalProps {
  item?: MenuItem;
  onSubmit: (input: MenuItemInput) => Promise<void>;
  onClose: () => void;
}

function MenuItemModal({ item, onSubmit, onClose }: MenuItemModalProps) {
  const toast = useToast();
  const [title, setTitle] = useState(item?.title ?? '');
  const [url, setUrl] = useState(item?.url ?? '');
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async (event: Event) => {
    event.preventDefault();
    const found = {
      title: title.trim() ? undefined : 'Vui lòng nhập tên mục.',
      url: url.trim() ? undefined : 'Vui lòng nhập liên kết.',
    };
    setErrors(found);
    if (found.title || found.url) return;

    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), url: url.trim(), isVisible: item?.isVisible ?? true });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={item ? 'Sửa mục menu' : 'Thêm mục menu'} onClose={onClose}>
      <form class="space-y-4" onSubmit={(event) => void submit(event)} noValidate>
        <Field label="Tên hiển thị" required error={errors.title}>
          <TextInput value={title} maxLength={100} autoFocus onInput={(e) => setTitle(e.currentTarget.value)} />
        </Field>
        <Field label="Liên kết" required error={errors.url} hint="Neo trong trang (#gia-tiec), đường dẫn (/lien-he) hoặc địa chỉ đầy đủ (https://...).">
          <TextInput value={url} maxLength={500} onInput={(e) => setUrl(e.currentTarget.value)} />
        </Field>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" loading={saving}>Lưu</Button>
        </div>
      </form>
    </Modal>
  );
}
