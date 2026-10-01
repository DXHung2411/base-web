import { useState } from 'preact/hooks';
import { api } from '../api';
import { errorMessage, useDebounced, useLoad } from '../hooks';
import { navigate } from '../router';
import { Badge, Button, EmptyState, LoadingBlock, PageHeader, Pagination, Select, TextInput } from '../ui/controls';
import { Modal, useConfirm } from '../ui/dialog';
import { useToast } from '../ui/toast';
import { PageForm } from './PageForm';

const PAGE_SIZE = 10;
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

export function PagesListPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const debouncedSearch = useDebounced(search);

  const { data, loading, reload } = useLoad(
    () => api.pages.list({
      search: debouncedSearch,
      isPublished: status === '' ? undefined : status === 'published',
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedSearch, status, page],
  );

  const togglePublished = async (id: number, isPublished: boolean) => {
    try {
      await api.pages.setPublished(id, isPublished);
      toast.success(isPublished ? 'Đã xuất bản trang.' : 'Đã chuyển trang về bản nháp.');
      await reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const remove = async (id: number, name: string) => {
    const ok = await confirm({
      title: 'Xóa landing page',
      message: `Xóa "${name}" sẽ xóa luôn toàn bộ section, menu và SEO của trang. Thao tác này không thể hoàn tác.`,
      confirmLabel: 'Xóa trang',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.pages.remove(id);
      toast.success('Đã xóa landing page.');
      await reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <>
      <PageHeader
        title="Landing page"
        description="Mỗi landing page có section, menu và SEO riêng."
        actions={<Button onClick={() => setCreating(true)}>Tạo landing page</Button>}
      />

      <div class="mb-4 flex flex-wrap gap-2">
        <TextInput
          class="max-w-xs"
          placeholder="Tìm theo tên hoặc slug..."
          aria-label="Tìm landing page"
          value={search}
          onInput={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
        />
        <Select class="max-w-[11rem]" aria-label="Lọc theo trạng thái" value={status} onChange={(e) => { setStatus(e.currentTarget.value); setPage(1); }}>
          <option value="">Tất cả trạng thái</option>
          <option value="published">Đã xuất bản</option>
          <option value="draft">Bản nháp</option>
        </Select>
      </div>

      {loading && !data ? (
        <LoadingBlock />
      ) : !data?.items.length ? (
        <EmptyState
          title={debouncedSearch || status ? 'Không có trang phù hợp' : 'Chưa có landing page nào'}
          hint={debouncedSearch || status ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Tạo trang đầu tiên để bắt đầu thêm section.'}
          action={!debouncedSearch && !status && <Button onClick={() => setCreating(true)}>Tạo landing page</Button>}
        />
      ) : (
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-left text-sm">
            <thead class="border-b border-stone-300 text-xs text-stone-500">
              <tr>
                <th class="py-2 pr-3 font-medium">Tên</th>
                <th class="py-2 pr-3 font-medium">Trạng thái</th>
                <th class="py-2 pr-3 font-medium">Section</th>
                <th class="py-2 pr-3 font-medium">Cập nhật</th>
                <th class="py-2 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td class="py-3 pr-3">
                    <button type="button" class="text-left font-medium text-stone-900 hover:underline" onClick={() => navigate(`/pages/${item.id}`)}>{item.name}</button>
                    <div class="text-xs text-stone-500">/{item.slug}</div>
                  </td>
                  <td class="py-3 pr-3"><Badge tone={item.isPublished ? 'green' : 'gray'}>{item.isPublished ? 'Đã xuất bản' : 'Bản nháp'}</Badge></td>
                  <td class="py-3 pr-3">{item.sectionCount}</td>
                  <td class="py-3 pr-3 text-stone-600">{formatDate(item.updatedAt)}</td>
                  <td class="py-3 text-right">
                    <div class="inline-flex gap-1">
                      <Button variant="secondary" small onClick={() => navigate(`/pages/${item.id}`)}>Sửa</Button>
                      <Button variant="secondary" small onClick={() => void togglePublished(item.id, !item.isPublished)}>
                        {item.isPublished ? 'Gỡ xuất bản' : 'Xuất bản'}
                      </Button>
                      <Button variant="ghost" small onClick={() => void remove(item.id, item.name)}>Xóa</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />}

      {creating && (
        <Modal title="Tạo landing page" onClose={() => setCreating(false)}>
          <PageForm
            submitLabel="Tạo trang"
            onCancel={() => setCreating(false)}
            onSubmit={async (input) => {
              const created = await api.pages.create(input);
              toast.success('Đã tạo landing page.');
              navigate(`/pages/${created.id}`);
            }}
          />
        </Modal>
      )}
    </>
  );
}
