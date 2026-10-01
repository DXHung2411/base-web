import { api } from '../api';
import { useLoad } from '../hooks';
import { navigate } from '../router';
import { Badge, EmptyState, LoadingBlock, PageHeader } from '../ui/controls';

const formatDate = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export function DashboardPage() {
  const { data, loading } = useLoad(async () => {
    const [all, published, media, recent] = await Promise.all([
      api.pages.list({ pageSize: 1 }),
      api.pages.list({ isPublished: true, pageSize: 1 }),
      api.media.list({ pageSize: 1 }),
      api.pages.list({ pageSize: 5 }),
    ]);
    return { all: all.total, published: published.total, media: media.total, recent: recent.items };
  }, []);

  if (loading || !data) return <LoadingBlock />;

  const stats = [
    { label: 'Landing page', value: data.all },
    { label: 'Đã xuất bản', value: data.published },
    { label: 'Bản nháp', value: data.all - data.published },
    { label: 'Ảnh trong thư viện', value: data.media },
  ];

  return (
    <>
      <PageHeader title="Tổng quan" />
      <dl class="mb-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-stone-200 py-5 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt class="text-xs text-stone-500">{stat.label}</dt>
            <dd class="text-2xl font-semibold text-stone-900">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <h2 class="mb-3 text-sm font-semibold text-stone-800">Chỉnh sửa gần đây</h2>
      {data.recent.length === 0 ? (
        <EmptyState title="Chưa có landing page nào" hint="Vào mục Landing page để tạo trang đầu tiên." />
      ) : (
        <ul class="divide-y divide-stone-200 border-y border-stone-200">
          {data.recent.map((page) => (
            <li key={page.id}>
              <button type="button" class="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-stone-50" onClick={() => navigate(`/pages/${page.id}`)}>
                <span>
                  <span class="block text-sm font-medium text-stone-900">{page.name}</span>
                  <span class="block text-xs text-stone-500">/{page.slug} · cập nhật {formatDate(page.updatedAt)}</span>
                </span>
                <Badge tone={page.isPublished ? 'green' : 'gray'}>{page.isPublished ? 'Đã xuất bản' : 'Bản nháp'}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
