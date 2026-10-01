import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { ApiError } from './api';
import { useToast } from './ui/toast';

/** Loads data on mount / when deps change, tracking loading and error state. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const loadRef = useRef(load);
  loadRef.current = load;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loadRef.current());
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Không tải được dữ liệu.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, loading, error, reload };
}

export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Maps server validation errors ({ Slug: [...] }) to lower-camel field names. */
export function serverFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.errors) return {};
  return Object.fromEntries(
    Object.entries(error.errors).map(([key, messages]) => [key.charAt(0).toLowerCase() + key.slice(1), messages[0]]),
  );
}

export const errorMessage = (error: unknown) => (error instanceof ApiError ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
