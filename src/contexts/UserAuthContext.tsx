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

async function autoSubscribeNewsletter(email: string) {
  try {
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      if (!existing.is_active) {
        await supabase
          .from('newsletter_subscribers')
          .update({ is_active: true, unsubscribed_at: null })
          .eq('id', existing.id);
      }
    } else {
      await supabase
        .from('newsletter_subscribers')
        .insert({ email, is_active: true, subscribed_at: new Date().toISOString() });
    }
  } catch {}
}

async function generateSecretCode(userId: string) {
  try {
    await fetch('/api/secret-codes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userType: 'member' }),
    });
  } catch {}
}

async function syncRegisteredUser(suUser: any) {
  try {
    const id = suUser.id;
    const email = suUser.email || '';
    const name =
      suUser.user_metadata?.full_name ||
      suUser.user_metadata?.name ||
      email.split('@')[0] ||
      'User';
    const avatar_url = suUser.user_metadata?.avatar_url || suUser.user_metadata?.picture || null;
    const provider = suUser.app_metadata?.provider === 'google' ? 'google' : 'email';

    const { data: existing } = await supabase
      .from('registered_users')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('registered_users')
        .update({
          name,
          avatar_url,
          provider,
          last_sign_in_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } else {
      await supabase
        .from('registered_users')
        .insert({ id, email, name, avatar_url, provider, last_sign_in_at: new Date().toISOString() });
      // New user — send welcome email (works for Google OAuth and any first-time sign-in)
      fetch('/api/auth/welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      }).catch(() => {});
    }
  } catch {}
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
          const u = buildUser(session.user);
          setPublicUser(u);
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            await autoSubscribeNewsletter(u.email);
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
      if (session?.user) {
        const u = buildUser(session.user);
        setPublicUser(u);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
      } else if (!localStorage.getItem(USER_CACHE_KEY)) {
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
    if (data.user) {
      await autoSubscribeNewsletter(email);
      await syncRegisteredUser(data.user);
      // Send branded account welcome email for email sign-ups
      fetch('/api/auth/welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      }).catch(() => {});
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
