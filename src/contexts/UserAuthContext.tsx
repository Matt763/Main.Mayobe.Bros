import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  provider: 'email' | 'google';
}

interface UserAuthContextType {
  publicUser: PublicUser | null;
  publicLoading: boolean;
  signUpEmail: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signInEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInGoogle: () => Promise<{ error: string | null }>;
  publicSignOut: () => Promise<void>;
}

const USER_CACHE_KEY = 'mayobebros-public-user';
const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

async function generateSecretCode(userId: string) {
  try {
    await fetch('/api/secret-codes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userType: 'member' }),
    });
  } catch {}
}

// Returns true when this is the user's first ever sign-in (new account).
// The server handles welcome email + newsletter subscription for new users.
async function syncRegisteredUser(suUser: any): Promise<boolean> {
  try {
    const email = suUser.email || '';
    const name =
      suUser.user_metadata?.full_name ||
      suUser.user_metadata?.name ||
      email.split('@')[0] ||
      'User';
    const avatarUrl = suUser.user_metadata?.avatar_url || suUser.user_metadata?.picture || null;
    const provider = suUser.app_metadata?.provider === 'google' ? 'google' : 'email';

    const res = await fetch('/api/auth/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: suUser.id, email, name, avatarUrl, provider }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.isNew === true;
    }
  } catch {}
  return false;
}

export function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const [publicUser, setPublicUser] = useState<PublicUser | null>(() => {
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [publicLoading, setPublicLoading] = useState(true);

  const buildUser = (su: any): PublicUser => ({
    id: su.id,
    email: su.email || '',
    name:
      su.user_metadata?.full_name ||
      su.user_metadata?.name ||
      su.email?.split('@')[0] ||
      'User',
    avatar_url: su.user_metadata?.avatar_url || su.user_metadata?.picture || null,
    provider: su.app_metadata?.provider === 'google' ? 'google' : 'email',
  });

  useEffect(() => {
    let settled = false;
    const finish = () => { if (!settled) { settled = true; setPublicLoading(false); } };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (session?.user) {
          // If an admin is logged in on this tab the Supabase session belongs to
          // the admin, not a public user. Skip so the public-user state stays null.
          if (sessionStorage.getItem('mb-admin-tab')) { finish(); return; }
          const u = buildUser(session.user);
          setPublicUser(u);
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            // sync-user handles welcome email + newsletter subscription for new users server-side
            await syncRegisteredUser(session.user);
            generateSecretCode(u.id);
            const returnPath = sessionStorage.getItem('mayobebros-return-path');
            if (returnPath && returnPath !== '/' && returnPath !== window.location.pathname) {
              sessionStorage.removeItem('mayobebros-return-path');
              window.location.href = returnPath;
            }
          }
          finish();
        } else if (event === 'SIGNED_OUT') {
          setPublicUser(null);
          localStorage.removeItem(USER_CACHE_KEY);
          finish();
        }
      })();
    });

    const timer = setTimeout(finish, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Same guard: admin session on this tab must not bleed into public state
      if (session?.user && !sessionStorage.getItem('mb-admin-tab')) {
        const u = buildUser(session.user);
        setPublicUser(u);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
      } else if (!session?.user && !localStorage.getItem(USER_CACHE_KEY)) {
        setPublicUser(null);
      }
      finish();
    }).catch(finish);

    return () => { clearTimeout(timer); subscription.unsubscribe(); };
  }, []);

  const signUpEmail = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) return { error: error.message };
    // If Supabase requires email confirmation, SIGNED_IN won't fire until the user
    // confirms, so we sync now. If autoConfirm is on, SIGNED_IN fires and also syncs —
    // the second call is a no-op (isNew=false) and sends no duplicate emails.
    if (data.user) {
      await syncRegisteredUser(data.user);
    }
    return { error: null };
  };

  const signInEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signInGoogle = async () => {
    sessionStorage.setItem('mayobebros-return-path', window.location.pathname + window.location.search);
    const redirectTo = import.meta.env.VITE_SITE_URL
      ? import.meta.env.VITE_SITE_URL
      : window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const publicSignOut = async () => {
    await supabase.auth.signOut();
    setPublicUser(null);
    localStorage.removeItem(USER_CACHE_KEY);
  };

  return (
    <UserAuthContext.Provider value={{ publicUser, publicLoading, signUpEmail, signInEmail, signInGoogle, publicSignOut }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useUserAuth must be used within UserAuthProvider');
  return ctx;
}
