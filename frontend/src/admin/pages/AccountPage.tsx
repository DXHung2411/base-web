import { useState } from 'preact/hooks';
import { api } from '../api';
import { errorMessage } from '../hooks';
import { useSession } from '../session';
import { Button, Field, PageHeader, TextInput } from '../ui/controls';
import { useToast } from '../ui/toast';

export function AccountPage() {
  const toast = useToast();
  const { session } = useSession();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (event: Event) => {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!current) found.current = 'Vui lòng nhập mật khẩu hiện tại.';
    if (next.length < 8) found.next = 'Mật khẩu mới tối thiểu 8 ký tự.';
    if (confirmation !== next) found.confirmation = 'Mật khẩu nhập lại không khớp.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await api.auth.changePassword(current, next);
      toast.success('Đã đổi mật khẩu.');
      setCurrent('');
      setNext('');
      setConfirmation('');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Tài khoản" description={`Đăng nhập với tên ${session.user.username} (${session.user.role}).`} />
      <form class="max-w-sm space-y-4" onSubmit={(event) => void submit(event)} noValidate>
        <h2 class="text-sm font-semibold text-stone-900">Đổi mật khẩu</h2>
        <Field label="Mật khẩu hiện tại" error={errors.current}>
          <TextInput type="password" value={current} autoComplete="current-password" onInput={(e) => setCurrent(e.currentTarget.value)} />
        </Field>
        <Field label="Mật khẩu mới" error={errors.next}>
          <TextInput type="password" value={next} autoComplete="new-password" onInput={(e) => setNext(e.currentTarget.value)} />
        </Field>
        <Field label="Nhập lại mật khẩu mới" error={errors.confirmation}>
          <TextInput type="password" value={confirmation} autoComplete="new-password" onInput={(e) => setConfirmation(e.currentTarget.value)} />
        </Field>
        <Button type="submit" loading={saving}>Đổi mật khẩu</Button>
      </form>
    </>
  );
}
