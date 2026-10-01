import { useState } from 'preact/hooks';
import { api, mediaUrl } from '../api';
import { useDebounced, useLoad } from '../hooks';
import { uploadFiles } from '../media';
import type { Media } from '../../types/api';
import { Button, EmptyState, LoadingBlock, Pagination, TextInput } from './controls';
import { Modal } from './dialog';
import { useToast } from './toast';

interface MediaPickerProps {
  multiple?: boolean;
  onSelect: (media: Media[]) => void;
  onClose: () => void;
}

const PAGE_SIZE = 12;

export function MediaPicker({ multiple, onSelect, onClose }: MediaPickerProps) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const debouncedSearch = useDebounced(search);
  const { data, loading, reload } = useLoad(
    () => api.media.list({ search: debouncedSearch, page, pageSize: PAGE_SIZE }),
    [debouncedSearch, page],
  );

  const toggle = (media: Media) => {
    if (!multiple) return onSelect([media]);
    setSelected((current) =>
      current.some((item) => item.id === media.id) ? current.filter((item) => item.id !== media.id) : [...current, media],
    );
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const uploaded = await uploadFiles([...files], toast.error);
    setUploading(false);
    if (uploaded.length) {
      toast.success(`Đã tải lên ${uploaded.length} ảnh.`);
      if (multiple) setSelected((current) => [...current, ...uploaded]);
      else return onSelect([uploaded[0]]);
      setPage(1);
      await reload();
    }
  };

  return (
    <Modal title="Thư viện ảnh" onClose={onClose} size="max-w-3xl">
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <TextInput
          class="max-w-xs"
          placeholder="Tìm theo tên hoặc mô tả..."
          value={search}
          onInput={(event) => {
            setSearch(event.currentTarget.value);
            setPage(1);
          }}
          aria-label="Tìm ảnh"
        />
        <label class="cursor-pointer rounded-md border border-stone-300 px-3.5 py-2 text-sm font-medium hover:bg-stone-50">
          {uploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
          <input
            type="file"
            class="sr-only"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
            disabled={uploading}
            onChange={(event) => void upload(event.currentTarget.files)}
          />
        </label>
      </div>

      {loading && !data ? (
        <LoadingBlock />
      ) : !data?.items.length ? (
        <EmptyState title="Chưa có ảnh nào" hint="Tải ảnh lên để sử dụng." />
      ) : (
        <ul class="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {data.items.map((media) => {
            const isSelected = selected.some((item) => item.id === media.id);
            return (
              <li key={media.id}>
                <button
                  type="button"
                  onClick={() => toggle(media)}
                  class={`block w-full overflow-hidden rounded-md border-2 text-left ${isSelected ? 'border-stone-900' : 'border-transparent hover:border-stone-300'}`}
                  title={media.fileName}
                >
                  <img src={mediaUrl(media.fileUrl)} alt={media.altText ?? ''} loading="lazy" class="aspect-square w-full bg-stone-100 object-cover" />
                  <span class="block truncate px-1 py-1 text-xs text-stone-600">{media.fileName}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />}

      {multiple && (
        <div class="mt-4 flex items-center justify-between border-t border-stone-200 pt-4">
          <span class="text-sm text-stone-600">Đã chọn {selected.length} ảnh</span>
          <Button disabled={!selected.length} onClick={() => onSelect(selected)}>Thêm vào section</Button>
        </div>
      )}
    </Modal>
  );
}
