import { useState } from 'preact/hooks';
import { api } from '../api';
import { errorMessage } from '../hooks';
import { useSession } from '../session';
import { Button, Field, TextInput } from '../ui/controls';

export function LoginPage() {
  const { signIn } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: Event) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      signIn(await api.auth.login(username.trim(), password));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <form class="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-6" onSubmit={(event) => void submit(event)} noValidate>
        <h1 class="text-lg font-semibold text-stone-900">Đăng nhập quản trị</h1>
        <p class="mt-1 mb-5 text-sm text-stone-500">Quản lý nội dung các landing page.</p>
        <div class="space-y-4">
          <Field label="Tên đăng nhập">
            <TextInput value={username} autoComplete="username" autoFocus onInput={(e) => setUsername(e.currentTarget.value)} />
          </Field>
          <Field label="Mật khẩu">
            <TextInput type="password" value={password} autoComplete="current-password" onInput={(e) => setPassword(e.currentTarget.value)} />
          </Field>
          {error && <p class="text-sm text-red-700" role="alert">{error}</p>}
          <Button type="submit" loading={loading} class="w-full">Đăng nhập</Button>
        </div>
      </form>
    </div>
  );
}
