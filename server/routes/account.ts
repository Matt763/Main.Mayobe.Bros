/**
 * Reader-side account management routes — password change/set/reset.
 *
 *   GET  /api/account/status                   reader auth   account info + hasPassword
 *   POST /api/account/password/start           reader auth   send 5-char code (purpose: change|set)
 *   POST /api/account/password/verify          reader auth   verify code + set new password
 *   POST /api/account/password/forgot          public        send reset code (silent if user not found)
 *   POST /api/account/password/reset           public        verify code + set new password
 *   GET  /api/account/security/revoke          public        "wasn't me" — lock + fresh reset email
 *
 * Admin/staff/publisher accounts are blocked from these endpoints — they manage
 * their own credentials through the admin auth flow.
 */

import { Router } from 'express';
import { requireReaderAuth } from '../middleware/readerAuth.js';
import { getSupabaseAdmin } from '../utils/supabase.js';
import {
  generateCode, persistCode, verifyCode, signRevokeToken, verifyRevokeToken,
} from '../utils/passwordCodes.js';
import {
  sendPasswordVerificationEmail, sendPasswordChangedEmail,
} from '../utils/resend.js';

const router = Router();

function getSiteUrl(): string {
  return (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://www.mayobebros.com').replace(/\/$/, '');
}

async function isAdminAccount(userId: string): Promise<boolean> {
  const supa = getSupabaseAdmin();
  const { data } = await supa
    .from('admin_users')
    .select('user_id, is_active')
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data && data.is_active);
}

async function getDisplayName(userId: string, fallback: string | null): Promise<string> {
  const supa = getSupabaseAdmin();
  const { data } = await supa.from('registered_users').select('name').eq('id', userId).maybeSingle();
  return (data?.name && String(data.name).trim()) || fallback || 'Reader';
}

async function userHasPassword(userId: string): Promise<boolean> {
  const supa = getSupabaseAdmin();
  try {
    const { data } = await supa.auth.admin.getUserById(userId);
    const identities = data?.user?.identities || [];
    // Email identity OR explicit email provider in app_metadata signals a password is set.
    return identities.some((i: any) => i?.provider === 'email');
  } catch {
    return false;
  }
}

// ── GET /api/account/status ───────────────────────────────────────────────────
router.get('/status', requireReaderAuth, async (req, res) => {
  try {
    const u = req.readerUser!;
    const [hasPassword, adminAccount] = await Promise.all([
      userHasPassword(u.id),
      isAdminAccount(u.id),
    ]);
    res.json({
      id: u.id,
      email: u.email,
      name: await getDisplayName(u.id, u.name),
      hasPassword,
      isOAuthOnly: !hasPassword,
      isAdminAccount: adminAccount,
      passwordManagementAvailable: !adminAccount, // readers only
    });
  } catch (err: any) {
    console.error('[account] status error:', err);
    res.status(500).json({ error: err?.message || 'Failed to load status' });
  }
});

// ── POST /api/account/password/start ──────────────────────────────────────────
// body: { purpose: 'change' | 'set' }
router.post('/password/start', requireReaderAuth, async (req, res) => {
  try {
    const u = req.readerUser!;
    if (await isAdminAccount(u.id)) {
      return res.status(403).json({ error: 'Admin accounts manage credentials in the admin panel.' });
    }

    const purpose = req.body?.purpose === 'set' ? 'set' : 'change';
    const hasPwd = await userHasPassword(u.id);
    if (purpose === 'set' && hasPwd) {
      return res.status(400).json({ error: 'You already have a password. Use change instead.' });
    }
    if (purpose === 'change' && !hasPwd) {
      return res.status(400).json({ error: 'No password is set. Use set-password instead.' });
    }
    if (!u.email) return res.status(400).json({ error: 'Account has no email on file.' });

    const code = generateCode();
    await persistCode({ userId: u.id, email: u.email, code, purpose });
    const name = await getDisplayName(u.id, u.name);
    await sendPasswordVerificationEmail(u.email, name, code, purpose, getSiteUrl());

    res.json({ ok: true, sentTo: maskEmail(u.email) });
  } catch (err: any) {
    console.error('[account] password/start error:', err);
    res.status(500).json({ error: err?.message || 'Failed to send code' });
  }
});

// ── POST /api/account/password/verify ─────────────────────────────────────────
// body: { code, newPassword, currentPassword? }
router.post('/password/verify', requireReaderAuth, async (req, res) => {
  try {
    const u = req.readerUser!;
    if (await isAdminAccount(u.id)) {
      return res.status(403).json({ error: 'Admin accounts manage credentials in the admin panel.' });
    }
    const { code, newPassword, currentPassword } = req.body || {};
    if (!code || !newPassword) return res.status(400).json({ error: 'Missing code or new password.' });
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const hasPwd = await userHasPassword(u.id);
    const purpose: 'change' | 'set' = hasPwd ? 'change' : 'set';

    // For 'change', also require current password (defense in depth)
    if (purpose === 'change') {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required.' });
      const supa = getSupabaseAdmin();
      const { error: signInErr } = await supa.auth.signInWithPassword({
        email: u.email!, password: currentPassword,
      });
      if (signInErr) return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const verify = await verifyCode({ userId: u.id, code: String(code).trim().toUpperCase(), purpose });
    if (!verify.ok) {
      const map: Record<string, string> = {
        invalid_code: 'Invalid verification code.',
        expired: 'Verification code expired. Request a new one.',
        too_many_attempts: 'Too many attempts. Request a new code.',
        server_error: 'Server error.',
      };
      return res.status(400).json({ error: map[(verify as any).reason] || 'Verification failed.' });
    }

    const supa = getSupabaseAdmin();
    const { error: updErr } = await supa.auth.admin.updateUserById(u.id, { password: String(newPassword) });
    if (updErr) throw updErr;

    const revokeUrl = `${getSiteUrl()}/api/account/security/revoke?token=${encodeURIComponent(signRevokeToken(u.id))}`;
    const name = await getDisplayName(u.id, u.name);
    if (u.email) await sendPasswordChangedEmail(u.email, name, revokeUrl, getSiteUrl());

    res.json({ ok: true });
  } catch (err: any) {
    console.error('[account] password/verify error:', err);
    res.status(500).json({ error: err?.message || 'Failed to update password' });
  }
});

// ── POST /api/account/password/forgot ─────────────────────────────────────────
// body: { email } — public; never reveal whether the email exists.
router.post('/password/forgot', async (req, res) => {
  res.json({ ok: true }); // respond immediately
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return;

    const supa = getSupabaseAdmin();
    const { data: ru } = await supa
      .from('registered_users')
      .select('id, email, name')
      .eq('email', email)
      .maybeSingle();
    if (!ru) return;

    if (await isAdminAccount(ru.id)) return; // admin accounts use a different flow

    const code = generateCode();
    await persistCode({ userId: ru.id, email: ru.email, code, purpose: 'reset' });
    await sendPasswordVerificationEmail(ru.email, ru.name || 'Reader', code, 'reset', getSiteUrl());
  } catch (err) {
    console.error('[account] password/forgot error:', err);
  }
});

// ── POST /api/account/password/reset ──────────────────────────────────────────
// body: { email, code, newPassword } — public, verifies the reset code.
router.post('/password/reset', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim().toUpperCase();
    const newPassword = String(req.body?.newPassword || '');
    if (!email || !code || !newPassword) return res.status(400).json({ error: 'Missing fields.' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const supa = getSupabaseAdmin();
    const { data: ru } = await supa
      .from('registered_users')
      .select('id, email, name')
      .eq('email', email)
      .maybeSingle();
    if (!ru) return res.status(400).json({ error: 'Invalid code.' }); // generic — don't reveal

    if (await isAdminAccount(ru.id)) {
      return res.status(403).json({ error: 'This flow is not available for admin accounts.' });
    }

    const verify = await verifyCode({ userId: ru.id, code, purpose: 'reset' });
    if (!verify.ok) {
      const map: Record<string, string> = {
        invalid_code: 'Invalid verification code.',
        expired: 'Code expired. Request a new one.',
        too_many_attempts: 'Too many attempts. Request a new code.',
      };
      return res.status(400).json({ error: map[(verify as any).reason] || 'Verification failed.' });
    }

    const { error: updErr } = await supa.auth.admin.updateUserById(ru.id, { password: newPassword });
    if (updErr) throw updErr;

    const revokeUrl = `${getSiteUrl()}/api/account/security/revoke?token=${encodeURIComponent(signRevokeToken(ru.id))}`;
    await sendPasswordChangedEmail(ru.email, ru.name || 'Reader', revokeUrl, getSiteUrl());
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[account] password/reset error:', err);
    res.status(500).json({ error: err?.message || 'Reset failed' });
  }
});

// ── GET /api/account/security/revoke?token=...  ───────────────────────────────
// "Wasn't me" link from the password-changed email. Idempotent.
//   1. Validate signed token
//   2. Reset the user's password to a random value (locks attacker out)
//   3. Send a fresh reset code so the user can regain access
router.get('/security/revoke', async (req, res) => {
  const token = String(req.query.token || '');
  const valid = verifyRevokeToken(token);
  if (!valid) {
    return res
      .status(400)
      .type('html')
      .send(securePage('Link expired',
        'This security link is no longer valid. If you still need to secure your account, request a fresh "Forgot password" email from the sign-in page.'));
  }

  try {
    const supa = getSupabaseAdmin();
    const { data: ru } = await supa
      .from('registered_users')
      .select('id, email, name')
      .eq('id', valid.userId)
      .maybeSingle();

    if (!ru) {
      return res.status(404).type('html').send(securePage('Account not found', 'No account matched this link.'));
    }

    // Lock attacker out: rotate password to a long random string.
    const lockPwd = require('crypto').randomBytes(48).toString('base64url');
    await supa.auth.admin.updateUserById(ru.id, { password: lockPwd });

    // Send a fresh reset code so the legitimate user can set their own.
    const code = generateCode();
    await persistCode({ userId: ru.id, email: ru.email, code, purpose: 'reset' });
    await sendPasswordVerificationEmail(ru.email, ru.name || 'Reader', code, 'reset', getSiteUrl());

    res.type('html').send(securePage(
      'Account locked & reset email sent',
      `Your account has been locked and a fresh reset code has been sent to <strong>${maskEmail(ru.email)}</strong>. Use that code on the <a href="${getSiteUrl()}/forgot-password" style="color:#0f1c2e;font-weight:600;">password reset page</a> to set a new password.`,
    ));
  } catch (err: any) {
    console.error('[account] revoke error:', err);
    res.status(500).type('html').send(securePage('Server error', 'We could not complete this action. Please try again or contact support.'));
  }
});

function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'•'.repeat(Math.max(2, local.length - 2))}${domain}`;
}

function securePage(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · Mayobe Bros</title>
<style>
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; background:#0f1c2e; color:#e8e8ec; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
  .card { max-width:520px; background:#ffffff; color:#0f1c2e; border-radius:18px; padding:36px 32px; box-shadow:0 30px 80px rgba(0,0,0,0.4); }
  h1 { font-family:Georgia,serif; font-size:24px; margin:0 0 14px; letter-spacing:-0.4px; }
  p  { font-size:15px; line-height:1.7; color:#374151; margin:0; }
  .gold { display:inline-block; padding:4px 12px; border-radius:999px; background:#0f1c2e; color:#c9a000; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin-bottom:18px; }
</style>
</head>
<body>
  <div class="card">
    <span class="gold">Mayobe Bros · Security</span>
    <h1>${title}</h1>
    <p>${bodyHtml}</p>
  </div>
</body></html>`;
}

export default router;
