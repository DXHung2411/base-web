import { api, type LandingPageInput } from '../api';
import { errorMessage, useLoad } from '../hooks';
import { navigate } from '../router';
import { Badge, Button, LoadingBlock, PageHeader } from '../ui/controls';
import { useConfirm } from '../ui/dialog';
import { useToast } from '../ui/toast';
import { MenuTab } from './MenuTab';
import { PageForm } from './PageForm';
import { SectionsTab } from './SectionsTab';
import { SeoTab } from './SeoTab';

const tabs = [
  { id: 'sections', label: 'Section' },
  { id: 'menu', label: 'Menu' },
  { id: 'seo', label: 'SEO' },
  { id: 'info', label: 'Thông tin trang' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function PageEditorPage({ pageId, tab }: { pageId: number; tab?: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { data: page, loading, reload } = useLoad(() => api.pages.get(pageId), [pageId]);
  const activeTab: TabId = tabs.some((item) => item.id === tab) ? (tab as TabId) : 'sections';

  if (loading && !page) return <LoadingBlock />;
  if (!page) return null;

  const togglePublished = async () => {
    try {
      await api.pages.setPublished(page.id, !page.isPublished);
      toast.success(page.isPublished ? 'Đã chuyển trang về bản nháp.' : 'Đã xuất bản trang.');
      await reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: 'Xóa landing page',
      message: `Xóa "${page.name}" sẽ xóa luôn toàn bộ section, menu và SEO của trang. Thao tác này không thể hoàn tác.`,
      confirmLabel: 'Xóa trang',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.pages.remove(page.id);
      toast.success('Đã xóa landing page.');
      navigate('/pages');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const savePageInfo = async (input: LandingPageInput) => {
    await api.pages.update(page.id, input);
    toast.success('Đã lưu thông tin trang.');
    await reload();
  };

  return (
    <>
      <button type="button" class="mb-2 text-sm text-stone-500 hover:text-stone-900" onClick={() => navigate('/pages')}>← Danh sách landing page</button>
      <PageHeader
        title={page.name}
        description={`/${page.slug}`}
        actions={
          <>
            <Badge tone={page.isPublished ? 'green' : 'gray'}>{page.isPublished ? 'Đã xuất bản' : 'Bản nháp'}</Badge>
            {page.isPublished && <a class="rounded-md border border-stone-300 px-3.5 py-2 text-sm font-medium hover:bg-stone-50" href={`/${page.slug}`} target="_blank" rel="noopener">Xem trang</a>}
            <Button variant={page.isPublished ? 'secondary' : 'primary'} onClick={() => void togglePublished()}>
              {page.isPublished ? 'Gỡ xuất bản' : 'Xuất bản'}
            </Button>
          </>
        }
      />

      <nav class="mb-6 flex gap-1 border-b border-stone-200" aria-label="Các phần của landing page">
        {tabs.map((item) => (
          <a
            key={item.id}
            href={`#/pages/${page.id}/${item.id}`}
            aria-current={item.id === activeTab ? 'page' : undefined}
            class={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${item.id === activeTab ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-900'}`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {activeTab === 'sections' && <SectionsTab page={page} onChanged={() => void reload()} />}
      {activeTab === 'menu' && <MenuTab page={page} onChanged={() => void reload()} />}
      {activeTab === 'seo' && <SeoTab page={page} />}
      {activeTab === 'info' && (
        <div class="max-w-xl">
          <PageForm
            initial={{ name: page.name, slug: page.slug, title: page.title, description: page.description }}
            submitLabel="Lưu thông tin"
            onSubmit={savePageInfo}
          />
          <div class="mt-10 border-t border-stone-200 pt-5">
            <h2 class="text-sm font-semibold text-red-800">Xóa landing page</h2>
            <p class="mt-1 mb-3 text-sm text-stone-600">Xóa toàn bộ section, menu và SEO của trang này.</p>
            <Button variant="danger" onClick={() => void remove()}>Xóa landing page</Button>
          </div>
        </div>
      )}
    </>
  );
}
