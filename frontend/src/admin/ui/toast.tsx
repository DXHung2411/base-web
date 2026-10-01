import { createContext, type ComponentChildren } from 'preact';
import { useCallback, useContext, useMemo, useState } from 'preact/hooks';

type ToastKind = 'success' | 'error';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi>({ success: () => {}, error: () => {} });
export const useToast = () => useContext(ToastContext);

let nextId = 1;

export function ToastProvider({ children }: { children: ComponentChildren }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId++;
    setItems((current) => [...current, { id, kind, message }]);
    setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), kind === 'error' ? 6000 : 3500);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({ success: (message) => push('success', message), error: (message) => push('error', message) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div class="fixed right-4 bottom-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" role="status" aria-live="polite">
        {items.map((item) => (
          <div
            key={item.id}
            class={`rounded-md border px-4 py-3 text-sm shadow-sm ${
              item.kind === 'error' ? 'border-red-300 bg-red-50 text-red-900' : 'border-stone-300 bg-white text-stone-900'
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
