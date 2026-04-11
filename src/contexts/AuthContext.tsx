import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

export type AdminRole = 'ceo' | 'admin' | 'publisher';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  displayName: string;
  isActive: boolean;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

// sessionStorage key — tab-specific so new tabs start unauthenticated
const AUTH_CACHE_KEY = 'mayobebros-user-cache';
// Flag that marks this browser tab as an active admin session.
// sessionStorage is NOT shared with new tabs, so other tabs start at the
// login page even when one tab is already authenticated.
const ADMIN_TAB_KEY = 'mb-admin-tab';
const CEO_EMAIL = 'mclean@mayobebros.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const resolveInFlight = new Map<string, Promise<AdminUser | null>>();

async function resolveAdminUser(supabaseUser: { id: string; email?: string }): Promise<AdminUser | null> {
  const existing = resolveInFlight.get(supabaseUser.id);
  if (existing) return existing;

  const promise = (async () => {
    const email = supabaseUser.email || '';

    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('role, display_name, is_active')
      .eq('user_id', supabaseUser.id)
      .maybeSingle();

    if (adminRecord) {
      if (!adminRecord.is_active) return null;
      return {
        id: supabaseUser.id,
        email,
        role: adminRecord.role as AdminRole,
        displayName: adminRecord.display_name || email.split('@')[0],
        isActive: adminRecord.is_active,
      };
    }

    if (email.toLowerCase() === CEO_EMAIL.toLowerCase()) {
      await supabase.from('admin_users').upsert(
        {
          user_id: supabaseUser.id,
          email: email.toLowerCase(),
          display_name: 'Mclean Mbaga',
          role: 'ceo',
          is_active: true,
        },
        { onConflict: 'user_id' }
      ).then(() => {}).catch(() => {});
      return {
        id: supabaseUser.id,
        email,
        role: 'ceo',
        displayName: 'Mclean Mbaga',
        isActive: true,
      };
    }

    return null;
  })();

  resolveInFlight.set(supabaseUser.id, promise);
  promise.finally(() => resolveInFlight.delete(supabaseUser.id));
  return promise;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Read initial state from sessionStorage (tab-specific — never shares with new tabs)
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const cached = sessionStorage.getItem(AUTH_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;

    const finishLoading = () => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    };

    // ── Cross-tab logout listener ──────────────────────────────────────────
    // When another tab calls signOut it broadcasts ADMIN_LOGOUT. We respond
    // by clearing this tab's session state immediately.
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('admin-auth');
      bc.addEventListener('message', (e: MessageEvent) => {
        if (e.data?.type === 'ADMIN_LOGOUT') {
          setUser(null);
          sessionStorage.removeItem(AUTH_CACHE_KEY);
          sessionStorage.removeItem(ADMIN_TAB_KEY);
        }
      });
    } catch {
      // BroadcastChannel not supported (very old browsers)
    }

    // ── Supabase auth state listener ───────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Only accept SIGNED_IN events that originated from THIS tab.
          // Without this check, logging in on Tab A would also "log in"
          // Tab B because Supabase fires onAuthStateChange on all tabs
          // that share the same localStorage JWT.
          if (!sessionStorage.getItem(ADMIN_TAB_KEY)) {
            finishLoading();
            return;
          }
          if (session?.user) {
            const adminUser = await resolveAdminUser(session.user);
            if (adminUser) {
              setUser(adminUser);
              sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(adminUser));
            } else {
              setUser(null);
              sessionStorage.removeItem(AUTH_CACHE_KEY);
              sessionStorage.removeItem(ADMIN_TAB_KEY);
            }
          }
          finishLoading();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          sessionStorage.removeItem(AUTH_CACHE_KEY);
          sessionStorage.removeItem(ADMIN_TAB_KEY);
          finishLoading();
        }
      })();
    });

    const timeout = setTimeout(() => finishLoading(), 5000);

    // ── Initial session check ──────────────────────────────────────────────
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          // If the Supabase session exists but THIS tab hasn't authenticated,
          // another tab is logged in. Show the login page, not the dashboard.
          if (!sessionStorage.getItem(ADMIN_TAB_KEY)) {
            setUser(null);
            finishLoading();
            return;
          }
          const adminUser = await resolveAdminUser(session.user);
          if (adminUser) {
            setUser(adminUser);
            sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(adminUser));
          } else {
            setUser(null);
            sessionStorage.removeItem(AUTH_CACHE_KEY);
            sessionStorage.removeItem(ADMIN_TAB_KEY);
          }
          finishLoading();
        } else {
          // No Supabase session — try the server cookie session as fallback
          try {
            const { user: apiUser } = await api.auth.getSession();
            if (apiUser) {
              setUser({ ...apiUser, role: 'ceo', displayName: apiUser.email?.split('@')[0] || '', isActive: true });
              sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(apiUser));
              sessionStorage.setItem(ADMIN_TAB_KEY, '1');
            } else {
              setUser(null);
            }
          } catch {
            if (!sessionStorage.getItem(AUTH_CACHE_KEY)) setUser(null);
          }
          finishLoading();
        }
      })
      .catch(() => {
        api.auth.getSession()
          .then(({ user: apiUser }) => {
            if (apiUser) {
              setUser({ ...apiUser, role: 'ceo', displayName: apiUser.email?.split('@')[0] || '', isActive: true });
              sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(apiUser));
              sessionStorage.setItem(ADMIN_TAB_KEY, '1');
            }
          })
          .catch(() => {})
          .finally(() => finishLoading());
      });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
      bc?.close();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Mark this tab as the one initiating login BEFORE calling Supabase, so
    // that the onAuthStateChange(SIGNED_IN) handler (which may fire during
    // signInWithPassword) sees the flag and proceeds rather than ignoring it.
    sessionStorage.setItem(ADMIN_TAB_KEY, '1');

    // Primary path: Supabase client
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (!error && data.user) {
        const adminUser = await resolveAdminUser(data.user);
        if (!adminUser) {
          await supabase.auth.signOut();
          sessionStorage.removeItem(ADMIN_TAB_KEY);
          return { error: { message: 'Access denied. You are not authorized to access the admin panel.' } };
        }
        setUser(adminUser);
        sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(adminUser));
        return { error: null };
      }

      const isCredentialError = error?.message?.toLowerCase().includes('invalid login credentials');
      if (isCredentialError) {
        sessionStorage.removeItem(ADMIN_TAB_KEY);
        return { error: { message: 'Invalid email or password.' } };
      }
    } catch (supaErr: any) {
      console.warn('[AUTH] Supabase client error, trying server:', supaErr?.message);
    }

    // Server-side fallback
    try {
      const result = await api.auth.login(email, password);
      if (result.user) {
        try {
          const { data: retryData } = await supabase.auth.signInWithPassword({ email, password });
          if (retryData?.user) {
            const adminUser = await resolveAdminUser(retryData.user);
            if (adminUser) {
              setUser(adminUser);
              sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(adminUser));
              return { error: null };
            }
          }
        } catch {}

        const mapped: AdminUser = {
          id: result.user.id,
          email: result.user.email || '',
          role: (result.user.role as AdminRole) || 'publisher',
          displayName: result.user.displayName || result.user.email?.split('@')[0] || '',
          isActive: true,
        };
        setUser(mapped);
        sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(mapped));
        return { error: null };
      }
    } catch (apiError: any) {
      sessionStorage.removeItem(ADMIN_TAB_KEY);
      return { error: { message: apiError.message || 'Invalid email or password' } };
    }

    sessionStorage.removeItem(ADMIN_TAB_KEY);
    return { error: { message: 'Unable to sign in. Please try again.' } };
  };

  const signOut = async () => {
    // Step 1: Give open editors a chance to save a recovery draft before we
    // destroy the session. Components listen for this event.
    window.dispatchEvent(new Event('admin-before-logout'));
    await new Promise(r => setTimeout(r, 800));

    // Step 2: Clear this tab's session
    sessionStorage.removeItem(AUTH_CACHE_KEY);
    sessionStorage.removeItem(ADMIN_TAB_KEY);
    setUser(null);

    // Step 3: Broadcast logout to all other open admin tabs
    try {
      const bc = new BroadcastChannel('admin-auth');
      bc.postMessage({ type: 'ADMIN_LOGOUT' });
      bc.close();
    } catch {}

    // Step 4: Invalidate the Supabase JWT and server cookie
    try { await supabase.auth.signOut(); } catch {}
    try { await api.auth.logout(); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
