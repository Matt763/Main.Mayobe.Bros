import { Router } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../utils/supabase.js';
import { sendAccountWelcomeEmail, sendForgotPasswordEmail, sendWelcomeEmail } from '../utils/resend.js';
import { setAdminCookie, clearAdminCookie } from '../middleware/auth.js';

const router = Router();

function getSiteUrl(): string {
  return process.env.VITE_SITE_URL || 'https://mayobebros.com';
}

function getServiceRoleClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

function generateMemberCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `MB-${code}`;
}

// Shared helper — subscribe email to newsletter and send welcome email if new.
// Called after both server-side signup and client-side sync-user.
async function autoSubscribeNewsletter(
  supabase: SupabaseClient,
  email: string,
  siteUrl: string
): Promise<void> {
  const { data: existingSub } = await supabase
    .from('newsletter_subscribers')
    .select('id, is_active, unsubscribe_token')
    .eq('email', email)
    .maybeSingle();

  if (existingSub) {
    if (!existingSub.is_active) {
      await supabase
        .from('newsletter_subscribers')
        .update({ is_active: true, unsubscribed_at: null, confirmed_at: new Date().toISOString() })
        .eq('id', existingSub.id);
      if (existingSub.unsubscribe_token) {
        const unsubUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${existingSub.unsubscribe_token}`;
        await sendWelcomeEmail(email, unsubUrl, siteUrl);
      }
    }
    // Already active — no action needed
  } else {
    const { data: newSub } = await supabase
      .from('newsletter_subscribers')
      .insert({ email, is_active: true, source: 'signup', confirmed_at: new Date().toISOString() })
      .select('id, unsubscribe_token')
      .single();

    if (newSub?.unsubscribe_token) {
      const unsubUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${newSub.unsubscribe_token}`;
      await sendWelcomeEmail(email, unsubUrl, siteUrl);
    }
  }
}

// POST /api/auth/signup — server-side account creation that bypasses Supabase's
// email confirmation rate limit (free tier: 4/hr). Uses admin API to create and
// auto-confirm the user, then sends our branded Resend welcome email.
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const supabase = getServiceRoleClient();
    const siteUrl = getSiteUrl();
    const displayName = (name || '').trim() || email.split('@')[0];

    // Create user via admin API — email_confirm: true skips Supabase's confirmation
    // email entirely, so we never hit the free-tier 4-emails/hr rate limit.
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    });

    if (createErr) {
      const msg = createErr.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
      }
      return res.status(400).json({ error: msg || 'Failed to create account' });
    }

    const userId = created.user.id;

    // Insert into registered_users (idempotent — skip if already there)
    const { data: existing } = await supabase
      .from('registered_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!existing) {
      await supabase.from('registered_users').insert({
        id: userId,
        email: email.trim().toLowerCase(),
        name: displayName,
        avatar_url: null,
        provider: 'email',
        last_sign_in_at: new Date().toISOString(),
      }).catch(e => console.error('[AUTH] signup registered_users insert failed:', e));

      // Send welcome emails synchronously before responding so they're guaranteed to fire
      await Promise.allSettled([
        sendAccountWelcomeEmail(email.trim().toLowerCase(), displayName, siteUrl)
          .catch(e => console.error('[AUTH] signup account welcome email failed:', e)),
        autoSubscribeNewsletter(supabase, email.trim().toLowerCase(), siteUrl)
          .catch(e => console.error('[AUTH] signup newsletter subscription failed:', e)),
      ]);
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('[AUTH] signup error:', err);
    return res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/sync-user — upsert registered_users record and send welcome email for new users.
// Called from the frontend after every sign-in/sign-up.
// Uses service role key so it works regardless of RLS policies.
router.post('/sync-user', async (req, res) => {
  try {
    const { userId, email, name, avatarUrl, provider } = req.body;
    if (!userId || !email) return res.status(400).json({ error: 'userId and email required' });

    const supabase = getServiceRoleClient();
    const siteUrl = getSiteUrl();

    const { data: existing } = await supabase
      .from('registered_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('registered_users')
        .update({
          name: name || '',
          avatar_url: avatarUrl || null,
          provider: provider || 'email',
          last_sign_in_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      return res.json({ success: true, isNew: false });
    }

    // New user — insert record
    const { error: insertErr } = await supabase
      .from('registered_users')
      .insert({
        id: userId,
        email,
        name: name || '',
        avatar_url: avatarUrl || null,
        provider: provider || 'email',
        last_sign_in_at: new Date().toISOString(),
      });

    if (insertErr) throw insertErr;

    // Send emails synchronously before responding — guarantees delivery even on
    // Vercel serverless where code after res.json() may not complete.
    const displayName = name || email.split('@')[0];
    await Promise.allSettled([
      sendAccountWelcomeEmail(email, displayName, siteUrl)
        .catch(e => console.error('[AUTH] sync-user welcome email failed:', e)),
      autoSubscribeNewsletter(supabase, email, siteUrl)
        .catch(e => console.error('[AUTH] sync-user newsletter subscription failed:', e)),
    ]);

    return res.json({ success: true, isNew: true });
  } catch (err: any) {
    console.error('[AUTH] sync-user error:', err);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// POST /api/auth/welcome-email — send branded account welcome email
router.post('/welcome-email', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'email and name required' });
    res.json({ success: true }); // respond immediately, send async
    sendAccountWelcomeEmail(email, name, getSiteUrl()).catch(e =>
      console.error('[RESEND] Account welcome email failed:', e)
    );
  } catch (error) {
    console.error('[AUTH] welcome-email error:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

// POST /api/auth/forgot-password — email the user's secret code so they can reset
router.post('/forgot-password', async (req, res) => {
  // Always respond immediately — never reveal whether an email exists
  res.json({ success: true });

  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') return;

    const supabase = getSupabaseClient();
    const { data: user } = await supabase
      .from('registered_users')
      .select('id, email, name, secret_code')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (!user) return;

    let secretCode: string = user.secret_code;
    if (!secretCode) {
      secretCode = generateMemberCode();
      await supabase
        .from('registered_users')
        .update({ secret_code: secretCode })
        .eq('id', user.id);
    }

    await sendForgotPasswordEmail(
      user.email,
      user.name || 'User',
      secretCode,
      getSiteUrl()
    );
  } catch (e) {
    console.error('[AUTH] forgot-password error:', e);
  }
});

// POST /api/auth/exchange — take a Supabase access_token, verify it server-side,
// and issue an admin_auth cookie so requireAuth works for all subsequent API calls.
// Called by the frontend after every successful Supabase sign-in or session restore.
router.post('/exchange', async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'access_token required' });

    const supabase = getServiceRoleClient();
    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    if (error || !user) return res.status(401).json({ error: 'Invalid Supabase token' });

    const CEO_EMAIL = 'mclean@mayobebros.com';
    const isCEO = user.email?.toLowerCase() === CEO_EMAIL;

    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!isCEO && (!adminRecord || !adminRecord.is_active)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.session.userId = user.id;
    req.session.email = user.email;
    setAdminCookie(res, user.id, user.email || '');

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const supabase = getSupabaseClient();

    // First attempt
    let { data, error } = await supabase.auth.signInWithPassword({ email, password });

    // If email not confirmed, auto-confirm via service role using user_id from admin_users
    if (error?.message?.toLowerCase().includes('email not confirmed') ||
        error?.message?.toLowerCase().includes('not confirmed')) {
      try {
        const { data: adminRow } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('email', email.toLowerCase())
          .maybeSingle();
        if (adminRow?.user_id) {
          await supabase.auth.admin.updateUserById(adminRow.user_id, { email_confirm: true });
          const retry = await supabase.auth.signInWithPassword({ email, password });
          data = retry.data;
          error = retry.error;
        }
      } catch (adminErr) {
        console.error('[AUTH] Auto-confirm failed:', adminErr);
      }
    }

    if (error || !data?.user) {
      const msg = error?.message || 'Invalid email or password';
      return res.status(401).json({ error: msg });
    }

    // Look up the admin_users record for role + display name
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('role, display_name, is_active')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (!adminRecord || !adminRecord.is_active) {
      return res.status(403).json({ error: 'Access denied. You are not authorized to access the admin panel.' });
    }

    req.session.userId = data.user.id;
    req.session.email = data.user.email;

    // Set stateless signed cookie as fallback for Vercel cold-start session loss
    setAdminCookie(res, data.user.id, data.user.email || '');

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email || '',
        role: adminRecord.role,
        displayName: adminRecord.display_name || email.split('@')[0],
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  clearAdminCookie(res);
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/session', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ user: null });
  }

  res.json({
    user: {
      id: req.session.userId,
      email: req.session.email || '',
      role: 'admin',
    }
  });
});

export default router;
