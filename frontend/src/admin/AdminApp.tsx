import { useState } from 'preact/hooks';
import { matchRoute, navigate, useHashPath } from './router';
import { useSession, SessionProvider } from './session';
import { AccountPage } from './pages/AccountPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { MediaPage } from './pages/MediaPage';
import { PageEditorPage } from './pages/PageEditorPage';
import { PagesListPage } from './pages/PagesListPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { ConfirmProvider } from './ui/dialog';
import { ToastProvider } from './ui/toast';

export default function AdminApp({ apiUrl }: { apiUrl: string }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <SessionProvider apiUrl={apiUrl} signedOut={<LoginPage />}>
          <Shell />
        </SessionProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

const navItems = [
  { path: '/', label: 'Tổng quan', adminOnly: false },
  { path: '/pages', label: 'Landing page', adminOnly: false },
  { path: '/media', label: 'Thư viện ảnh', adminOnly: false },
  { path: '/settings', label: 'Cài đặt chung', adminOnly: true },
  { path: '/users', label: 'Người dùng', adminOnly: true },
];

function Shell() {
  const { session, signOut } = useSession();
  const path = useHashPath();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = session.user.role === 'Admin';
  const visibleItems = navItems.filter((item) => isAdmin || !item.adminOnly);
  const isActive = (itemPath: string) => (itemPath === '/' ? path === '/' : path.startsWith(itemPath));

  return (
    <div class="min-h-screen bg-stone-50 text-stone-900 md:flex">
      <aside class={`${menuOpen ? 'block' : 'hidden'} border-b border-stone-200 bg-stone-900 text-stone-200 md:sticky md:top-0 md:block md:h-screen md:w-56 md:shrink-0 md:border-b-0`}>
        <div class="px-5 py-4 text-sm font-semibold text-white">Landing CMS</div>
        <nav class="px-2 pb-3" aria-label="Điều hướng chính">
          {visibleItems.map((item) => (
            <a
              key={item.path}
              href={`#${item.path}`}
              onClick={() => setMenuOpen(false)}
              aria-current={isActive(item.path) ? 'page' : undefined}
              class={`block rounded-md px-3 py-2 text-sm ${isActive(item.path) ? 'bg-stone-700 text-white' : 'hover:bg-stone-800'}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <div class="min-w-0 flex-1">
        <header class="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:px-8">
          <button type="button" class="rounded-md border border-stone-300 px-2.5 py-1 text-sm md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
            Menu
          </button>
          <span class="hidden md:block" />
          <div class="flex items-center gap-3 text-sm">
            <a href="#/account" class="text-stone-700 hover:underline">{session.user.username} <span class="text-stone-500">({session.user.role})</span></a>
            <button type="button" class="rounded-md border border-stone-300 px-2.5 py-1 hover:bg-stone-50" onClick={signOut}>Đăng xuất</button>
          </div>
        </header>
        <main class="px-4 py-6 md:px-8">
          <Routes path={path} isAdmin={isAdmin} />
        </main>
      </div>
    </div>
  );
}

function Routes({ path, isAdmin }: { path: string; isAdmin: boolean }) {
  const editor = matchRoute('/pages/:id/:tab?', path);
  if (path === '/' || path === '') return <DashboardPage />;
  if (matchRoute('/pages', path)) return <PagesListPage />;
  if (editor && Number.isInteger(Number(editor.id))) return <PageEditorPage key={editor.id} pageId={Number(editor.id)} tab={editor.tab} />;
  if (matchRoute('/media', path)) return <MediaPage />;
  if (matchRoute('/settings', path) && isAdmin) return <SettingsPage />;
  if (matchRoute('/users', path) && isAdmin) return <UsersPage />;
  if (matchRoute('/account', path)) return <AccountPage />;

  return (
    <div class="py-16 text-center text-stone-600">
      <p class="font-medium">Không tìm thấy trang</p>
      <button type="button" class="mt-3 text-sm underline" onClick={() => navigate('/')}>Về tổng quan</button>
    </div>
  );
}
