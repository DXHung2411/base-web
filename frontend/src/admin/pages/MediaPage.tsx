import { useState } from 'preact/hooks';
import { api, mediaUrl } from '../api';
import { errorMessage, useDebounced, useLoad } from '../hooks';
import { formatBytes, uploadFiles } from '../media';
import type { Media } from '../../types/api';
import { Button, EmptyState, Field, LoadingBlock, PageHeader, Pagination, TextInput } from '../ui/controls';
import { Modal, useConfirm } from '../ui/dialog';
import { useToast } from '../ui/toast';

const PAGE_SIZE = 24;
const accept = '.jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml';

export function MediaPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState<Media | null>(null);
  const debouncedSearch = useDebounced(search);
  const { data, loading, reload } = useLoad(
    () => api.media.list({ search: debouncedSearch, page, pageSize: PAGE_SIZE }),
    [debouncedSearch, page],
  );

  const upload = async (files: FileList | File[] | null) => {
    if (!files?.length) return;
    setUploading(true);
    const uploaded = await uploadFiles([...files], toast.error);
    setUploading(false);
    if (uploaded.length) {
      toast.success(`Đã tải lên ${uploaded.length} ảnh.`);
      setPage(1);
      await reload();
    }
  };

  const copyUrl = async (media: Media) => {
    const absolute = new URL(mediaUrl(media.fileUrl), window.location.href).href;
    try {
      await navigator.clipboard.writeText(absolute);
      toast.success('Đã sao chép đường dẫn ảnh.');
    } catch {
      toast.error('Không sao chép được. Hãy chọn và sao chép thủ công.');
    }
  };

  const remove = async (media: Media) => {
    const ok = await confirm({
      title: 'Xóa ảnh',
      message: `Xóa "${media.fileName}"? Các section đang dùng ảnh này sẽ bị mất ảnh.`,
      confirmLabel: 'Xóa ảnh',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.media.remove(media.id);
      toast.success('Đã xóa ảnh.');
      await reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <>
      <PageHeader title="Thư viện ảnh" description="JPG, PNG, WEBP hoặc SVG, tối đa 5 MB mỗi ảnh." />

      <div
        class={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed px-4 py-5 ${dragging ? 'border-stone-900 bg-stone-100' : 'border-stone-300'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer?.files ?? null); }}
      >
        <p class="text-sm text-stone-600">Kéo ảnh vào đây hoặc chọn từ máy.</p>
        <label class="cursor-pointer rounded-md bg-stone-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-stone-700">
          {uploading ? 'Đang tải lên...' : 'Chọn ảnh'}
          <input type="file" class="sr-only" multiple accept={accept} disabled={uploading} onChange={(e) => void upload(e.currentTarget.files)} />
        </label>
      </div>

      <TextInput
        class="mb-4 max-w-xs"
        placeholder="Tìm theo tên hoặc mô tả..."
        aria-label="Tìm ảnh"
        value={search}
        onInput={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
      />

      {loading && !data ? (
        <LoadingBlock />
      ) : !data?.items.length ? (
        <EmptyState title={debouncedSearch ? 'Không tìm thấy ảnh' : 'Chưa có ảnh nào'} hint={debouncedSearch ? 'Thử từ khóa khác.' : 'Tải ảnh đầu tiên lên để sử dụng trong các section.'} />
      ) : (
        <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {data.items.map((media) => (
            <li key={media.id} class="group">
              <img src={mediaUrl(media.fileUrl)} alt={media.altText ?? ''} loading="lazy" class="aspect-square w-full rounded-md border border-stone-200 bg-stone-100 object-cover" />
              <p class="mt-1.5 truncate text-xs font-medium text-stone-800" title={media.fileName}>{media.fileName}</p>
              <p class="text-xs text-stone-500">{formatBytes(media.sizeBytes)}</p>
              <div class="mt-1 flex flex-wrap gap-1">
                <Button variant="secondary" small onClick={() => void copyUrl(media)}>Sao chép URL</Button>
                <Button variant="ghost" small onClick={() => setEditing(media)}>Alt</Button>
                <Button variant="ghost" small onClick={() => void remove(media)}>Xóa</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />}

      {editing && (
        <AltTextModal
          media={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}
    </>
  );
}

function AltTextModal({ media, onClose, onSaved }: { media: Media; onClose: () => void; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const [altText, setAltText] = useState(media.altText ?? '');
  const [saving, setSaving] = useState(false);

  const save = async (event: Event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.media.update(media.id, altText);
      toast.success('Đã lưu mô tả ảnh.');
      await onSaved();
    } catch (error) {
      toast.error(errorMessage(error));
      setSaving(false);
    }
  };

  return (
    <Modal title="Mô tả ảnh (alt)" onClose={onClose} size="max-w-md">
      <form class="space-y-4" onSubmit={(event) => void save(event)}>
        <img src={mediaUrl(media.fileUrl)} alt="" class="mx-auto max-h-40 rounded-md" />
        <Field label="Mô tả" hint="Giúp người dùng đọc màn hình và công cụ tìm kiếm hiểu ảnh.">
          <TextInput value={altText} maxLength={300} autoFocus onInput={(e) => setAltText(e.currentTarget.value)} />
        </Field>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" loading={saving}>Lưu</Button>
        </div>
      </form>
    </Modal>
  );
}
