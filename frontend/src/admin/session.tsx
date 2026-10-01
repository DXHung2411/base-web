import { createContext, type ComponentChildren } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks';
import { clearSession, configureApi, loadSession, saveSession, type Session } from './api';
import { useToast } from './ui/toast';

interface SessionApi {
  session: Session;
  signIn: (session: Session) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionApi | null>(null);

export function useSession(): SessionApi {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside SessionProvider');
  return context;
}

interface SessionProviderProps {
  apiUrl: string;
  /** Rendered while signed out. It receives signIn through useSession(). */
  signedOut: ComponentChildren;
  children: ComponentChildren;
}

/** Owns the login state: restores it on load, signs out on 401 and when the token expires. */
export function SessionProvider({ apiUrl, signedOut, children }: SessionProviderProps) {
  const toast = useToast();
  const [session, setSession] = useState<Session | null>(() => {
    configureApi(apiUrl, () => {});
    return loadSession();
  });

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  useEffect(() => {
    configureApi(apiUrl, () => {
      setSession(null);
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    });
  }, [apiUrl, toast]);

  useEffect(() => {
    if (!session) return;
    const remaining = new Date(session.expiresAt).getTime() - Date.now();
    const timer = setTimeout(() => {
      signOut();
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }, Math.min(remaining, 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [session, signOut, toast]);

  const value = useMemo<SessionApi | null>(
    () => ({
      session: session as Session,
      signIn: (next) => {
        saveSession(next);
        setSession(next);
      },
      signOut,
    }),
    [session, signOut],
  );

  return <SessionContext.Provider value={value}>{session ? children : signedOut}</SessionContext.Provider>;
}
