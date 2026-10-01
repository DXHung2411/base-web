import { createContext, type ComponentChildren } from 'preact';
import { useCallback, useContext, useEffect, useRef, useState } from 'preact/hooks';
import { Button } from './controls';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
  /** Tailwind max-width class, e.g. "max-w-2xl". */
  size?: string;
}

/** Native <dialog>: focus trapping, Escape to close and the backdrop come from the browser. */
export function Modal({ title, onClose, children, size = 'max-w-lg' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      class={`m-auto w-full ${size} rounded-lg border border-stone-300 bg-white p-0 text-stone-900 shadow-lg backdrop:bg-stone-900/40`}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
    >
      <div class="flex items-center justify-between border-b border-stone-200 px-5 py-3">
        <h2 class="text-base font-semibold">{title}</h2>
        <button type="button" class="rounded p-1 text-stone-500 hover:bg-stone-100" onClick={onClose} aria-label="Đóng">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div class="max-h-[75vh] overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: ComponentChildren }) {
  const [pending, setPending] = useState<{ options: ConfirmOptions; resolve: (value: boolean) => void } | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (options) => new Promise((resolve) => setPending({ options, resolve })),
    [],
  );

  const settle = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <Modal title={pending.options.title} onClose={() => settle(false)} size="max-w-md">
          <p class="text-sm text-stone-700">{pending.options.message}</p>
          <div class="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => settle(false)}>Hủy</Button>
            <Button variant={pending.options.danger ? 'danger' : 'primary'} onClick={() => settle(true)}>
              {pending.options.confirmLabel ?? 'Xác nhận'}
            </Button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}
