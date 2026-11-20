import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { env } from '../../lib/env';
import { supabase } from '../../lib/supabase';
import {
  enterPreviewRoleSession,
  getAuthSessionState,
  signOutUser,
  type AuthSessionState,
} from '../../services/auth.service';
import type { ProfileRow, UserRole } from '../../types/database';

interface AuthContextValue {
  userId: string | null;
  email: string | null;
  profile: ProfileRow | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPreviewSession: boolean;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  enterPreviewSession: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<AuthSessionState>({
    userId: null,
    email: null,
    profile: null,
    isPreviewSession: !env.isSupabaseConfigured,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const next = await getAuthSessionState();
      setSessionState(next);
    } catch {
      setSessionState({
        userId: null,
        email: null,
        profile: null,
        isPreviewSession: !env.isSupabaseConfigured,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuth();

    if (!env.isSupabaseConfigured || !supabase) {
      return;
    }

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void refreshAuth();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [refreshAuth]);

  const signOut = useCallback(async () => {
    await signOutUser();
    await refreshAuth();
  }, [refreshAuth]);

  const enterPreviewSession = useCallback((role: UserRole) => {
    const next = enterPreviewRoleSession(role);
    setSessionState(next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      userId: sessionState.userId,
      email: sessionState.email,
      profile: sessionState.profile,
      isAdmin: sessionState.profile?.role === 'admin',
      isAuthenticated: Boolean(sessionState.userId),
      isLoading,
      isPreviewSession: sessionState.isPreviewSession,
      refreshAuth,
      signOut,
      enterPreviewSession,
    }),
    [sessionState, isLoading, refreshAuth, signOut, enterPreviewSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return ctx;
}
