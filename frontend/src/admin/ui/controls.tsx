import type { ComponentChildren, ComponentProps } from 'preact';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-stone-900 text-white hover:bg-stone-700 disabled:bg-stone-400',
  secondary: 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 disabled:text-stone-400',
  danger: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-red-300',
  ghost: 'text-stone-700 hover:bg-stone-100 disabled:text-stone-400',
};

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  loading?: boolean;
  small?: boolean;
}

export function Button({ variant = 'primary', loading, small, disabled, children, class: className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      class={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${
        small ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm'
      } ${buttonStyles[variant]} ${className ?? ''}`}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg class="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" role="status" aria-label="Đang tải">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".25" stroke-width="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
  );
}

export function LoadingBlock() {
  return (
    <div class="flex justify-center py-16 text-stone-500">
      <Spinner size={28} />
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ComponentChildren }) {
  return (
    <div class="rounded-md border border-dashed border-stone-300 px-6 py-12 text-center">
      <p class="font-medium text-stone-800">{title}</p>
      {hint && <p class="mt-1 text-sm text-stone-500">{hint}</p>}
      {action && <div class="mt-4">{action}</div>}
    </div>
  );
}

const inputStyles =
  'w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-700 disabled:bg-stone-100';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ComponentChildren;
}

export function Field({ label, error, hint, required, children }: FieldProps) {
  return (
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-800">
        {label}
        {required && <span class="text-red-700"> *</span>}
      </span>
      {children}
      {hint && !error && <span class="mt-1 block text-xs text-stone-500">{hint}</span>}
      {error && <span class="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  );
}

export function TextInput(props: ComponentProps<'input'>) {
  return <input type="text" {...props} class={`${inputStyles} ${props.class ?? ''}`} />;
}

export function Textarea(props: ComponentProps<'textarea'>) {
  return <textarea rows={4} {...props} class={`${inputStyles} ${props.class ?? ''}`} />;
}

export function Select(props: ComponentProps<'select'>) {
  return <select {...props} class={`${inputStyles} ${props.class ?? ''}`} />;
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={() => onChange(!checked)}
      class={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-stone-900' : 'bg-stone-300'}`}
    >
      <span class={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}

export function Badge({ tone, children }: { tone: 'green' | 'gray'; children: ComponentChildren }) {
  const styles = tone === 'green' ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-700';
  return <span class={`inline-block rounded px-2 py-0.5 text-xs font-medium ${styles}`}>{children}</span>;
}

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount === 1) return null;
  return (
    <div class="mt-4 flex items-center justify-between text-sm text-stone-600">
      <span>{total} mục</span>
      <div class="flex items-center gap-2">
        <Button variant="secondary" small disabled={page <= 1} onClick={() => onChange(page - 1)}>Trước</Button>
        <span>{page} / {pageCount}</span>
        <Button variant="secondary" small disabled={page >= pageCount} onClick={() => onChange(page + 1)}>Sau</Button>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ComponentChildren }) {
  return (
    <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-stone-900">{title}</h1>
        {description && <p class="mt-1 text-sm text-stone-500">{description}</p>}
      </div>
      {actions && <div class="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
