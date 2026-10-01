import { useState } from 'preact/hooks';
import { api } from '../api';
import { errorMessage, serverFieldErrors, useLoad } from '../hooks';
import { useSession } from '../session';
import type { User } from '../../types/api';
import { Badge, Button, EmptyState, Field, LoadingBlock, PageHeader, Select, TextInput } from '../ui/controls';
import { Modal, useConfirm } from '../ui/dialog';
import { useToast } from '../ui/toast';

const roleLabels: Record<string, string> = { Admin: 'Quản trị viên', Editor: 'Biên tập viên' };

export function UsersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { session } = useSession();
  const { data: users, loading, reload } = useLoad(() => api.users.list(), []);
  const [editing, setEditing] = useState<User | 'new' | null>(null);

  const remove = async (user: User) => {
    const ok = await confirm({ title: 'Xóa người dùng', message: `Xóa tài khoản "${user.username}"?`, confirmLabel: 'Xóa', danger: true });
    if (!ok) return;
    try {
      await api.users.remove(user.id);
      toast.success('Đã xóa người dùng.');
      await reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (loading && !users) return <LoadingBlock />;

  return (
    <>
      <PageHeader
        title="Người dùng"
        description="Quản trị viên có toàn quyền. Biên tập viên chỉ sửa nội dung, không quản lý người dùng và cài đặt chung."
        actions={<Button onClick={() => setEditing('new')}>Thêm người dùng</Button>}
      />
      {!users?.length ? (
        <EmptyState title="Chưa có người dùng" />
      ) : (
        <table class="w-full max-w-2xl text-left text-sm">
          <thead class="border-b border-stone-300 text-xs text-stone-500">
            <tr><th class="py-2 font-medium">Tên đăng nhập</th><th class="py-2 font-medium">Vai trò</th><th class="py-2 text-right font-medium">Thao tác</th></tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td class="py-3 font-medium text-stone-900">{user.username}{user.id === session.user.id && <span class="ml-2 text-xs font-normal text-stone-500">(bạn)</span>}</td>
                <td class="py-3"><Badge tone={user.role === 'Admin' ? 'green' : 'gray'}>{roleLabels[user.role] ?? user.role}</Badge></td>
                <td class="py-3 text-right">
                  <div class="inline-flex gap-1">
                    <Button variant="secondary" small onClick={() => setEditing(user)}>Sửa</Button>
                    <Button variant="ghost" small disabled={user.id === session.user.id} onClick={() => void remove(user)}>Xóa</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <UserModal
          user={editing === 'new' ? undefined : editing}
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

function UserModal({ user, onClose, onSaved }: { user?: User; onClose: () => void; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const [username, setUsername] = useState(user?.username ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role ?? 'Editor');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (event: Event) => {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!user && username.trim().length < 3) found.username = 'Tên đăng nhập tối thiểu 3 ký tự.';
    if ((!user || password) && password.length < 8) found.password = 'Mật khẩu tối thiểu 8 ký tự.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      if (user) await api.users.update(user.id, { role, newPassword: password || undefined });
      else await api.users.create({ username: username.trim(), password, role });
      toast.success('Đã lưu người dùng.');
      await onSaved();
    } catch (error) {
      const fieldErrors = serverFieldErrors(error);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else toast.error(errorMessage(error));
      setSaving(false);
    }
  };

  return (
    <Modal title={user ? `Sửa ${user.username}` : 'Thêm người dùng'} onClose={onClose} size="max-w-md">
      <form class="space-y-4" onSubmit={(event) => void submit(event)} noValidate>
        {!user && (
          <Field label="Tên đăng nhập" required error={errors.username}>
            <TextInput value={username} maxLength={50} autoComplete="off" autoFocus onInput={(e) => setUsername(e.currentTarget.value)} />
          </Field>
        )}
        <Field label={user ? 'Mật khẩu mới' : 'Mật khẩu'} required={!user} hint={user ? 'Để trống nếu không đổi.' : 'Tối thiểu 8 ký tự.'} error={errors.password ?? errors.newPassword}>
          <TextInput type="password" value={password} autoComplete="new-password" onInput={(e) => setPassword(e.currentTarget.value)} />
        </Field>
        <Field label="Vai trò">
          <Select value={role} onChange={(e) => setRole(e.currentTarget.value as User['role'])}>
            <option value="Editor">{roleLabels.Editor}</option>
            <option value="Admin">{roleLabels.Admin}</option>
          </Select>
        </Field>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" loading={saving}>Lưu</Button>
        </div>
      </form>
    </Modal>
  );
}
