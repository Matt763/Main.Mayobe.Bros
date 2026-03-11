import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

export type AdminRole = 'ceo' | 'admin' | 'staff';

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

const AUTH_CACHE_KEY = 'mayobebros-user-cache';
const CEO_EMAIL = 'mclean@mayobebros.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function resolveAdminUser(supabaseUser: { id: string; email?: string }): Promise<AdminUser | null> {
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
    );
    return {
      id: supabaseUser.id,
      email,
      role: 'ceo',
      displayName: 'Mclean Mbaga',
      isActive: true,
    };
  }

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const cached = localStorage.getItem(AUTH_CACHE_KEY);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (session?.user) {
          const adminUser = await resolveAdminUser(session.user);
          if (adminUser) {
            setUser(adminUser);
            localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(adminUser));
          } else {
            setUser(null);
            localStorage.removeItem(AUTH_CACHE_KEY);
          }
          finishLoading();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(AUTH_CACHE_KEY);
          finishLoading();
        }
      })();
    });

    const timeout = setTimeout(() => finishLoading(), 5000);

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          const adminUser = await resolveAdminUser(session.user);
          if (adminUser) {
            setUser(adminUser);
            localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(adminUser));
          } else {
            setUser(null);
            localStorage.removeItem(AUTH_CACHE_KEY);
          }
          finishLoading();
        } else {
          try {
            const { user: apiUser } = await api.auth.getSession();
            if (apiUser) {
              setUser({ ...apiUser, role: 'ceo', displayName: apiUser.email?.split('@')[0] || '', isActive: true });
              localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(apiUser));
            } else {
              setUser(null);
            }
          } catch {
            if (!localStorage.getItem(AUTH_CACHE_KEY)) setUser(null);
          }
          finishLoading();
        }
      })
      .catch(() => {
        api.auth.getSession()
          .then(({ user: apiUser }) => {
            if (apiUser) {
              setUser({ ...apiUser, role: 'ceo', displayName: apiUser.email?.split('@')[0] || '', isActive: true });
              localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(apiUser));
            }
          })
          .catch(() => {})
          .finally(() => finishLoading());
      });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (!error && data.user) {
        const adminUser = await resolveAdminUser(data.user);
        if (!adminUser) {
          await supabase.auth.signOut();
          return { error: { message: 'Access denied. You are not authorized to access the admin panel.' } };
        }
        setUser(adminUser);
        localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(adminUser));
        return { error: null };
      }
    } catch {}

    try {
      const { user: apiUser } = await api.auth.login(email, password);
      const mapped: AdminUser = { ...apiUser, role: 'ceo', displayName: apiUser.email?.split('@')[0] || '', isActive: true };
      setUser(mapped);
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(mapped));
      return { error: null };
    } catch (apiError: any) {
      return { error: { message: apiError.message } };
    }
  };

  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch {}
    try { await api.auth.logout(); } catch {}
    setUser(null);
    localStorage.removeItem(AUTH_CACHE_KEY);
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
