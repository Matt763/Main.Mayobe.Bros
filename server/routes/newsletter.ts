import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../middleware/auth.js';
import { sendWelcomeEmail, sendFarewellEmail } from '../utils/resend.js';
import { logActivity } from '../utils/activityLogger.js';

const router = Router();

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

function getSiteUrl(): string {
  return process.env.VITE_SITE_URL || 'https://mayobebros.com';
}

router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const ip = (
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      'unknown'
    ).split(',')[0].trim();

    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many subscription attempts. Please try again later.' });
    }

    const { email, source = 'website' } = req.body;
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = getSupabase();
    const siteUrl = getSiteUrl();

    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active, unsubscribe_token')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      if (existing.is_active) {
        return res.status(409).json({ error: 'This email is already subscribed' });
      }
      const { data: reactivated } = await supabase
        .from('newsletter_subscribers')
        .update({
          is_active: true,
          unsubscribed_at: null,
          unsubscribe_reason: null,
          unsubscribe_feedback: null,
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${existing.unsubscribe_token}`;
      sendWelcomeEmail(normalizedEmail, unsubscribeUrl, siteUrl).catch(e =>
        console.error('[RESEND] Welcome email failed (reactivation):', e)
      );
      return res.json({ success: true, subscriber: reactivated, reactivated: true });
    }

    const { data: subscriber, error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: normalizedEmail,
        is_active: true,
        source,
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`;
    sendWelcomeEmail(normalizedEmail, unsubscribeUrl, siteUrl).catch(e =>
      console.error('[RESEND] Welcome email failed (new subscriber):', e)
    );
    logActivity({
      userName: normalizedEmail,
      userRole: 'user',
      activityType: 'subscriber',
      action: 'subscribed',
      description: `New subscriber "${normalizedEmail}" joined the newsletter.`,
      metadata: { source },
    });
    return res.json({ success: true, subscriber });
  } catch (err: any) {
    console.error('Newsletter subscribe error:', err);
    return res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// GET /unsubscribe?token=... — shows the survey page
router.get('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).send(errorPage('Invalid unsubscribe link.'));
    }
    const supabase = getSupabase();
    const { data: subscriber } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, is_active')
      .eq('unsubscribe_token', token)
      .maybeSingle();

    if (!subscriber) {
      return res.status(404).send(errorPage('Unsubscribe link not found or already used.'));
    }
    if (!subscriber.is_active) {
      return res.send(alreadyUnsubscribedPage(subscriber.email, getSiteUrl()));
    }
    return res.send(surveyPage(subscriber.email, token, getSiteUrl()));
  } catch (err: any) {
    console.error('Unsubscribe GET error:', err);
    return res.status(500).send(errorPage('Something went wrong. Please try again.'));
  }
});

// POST /unsubscribe — processes the survey and unsubscribes
router.post('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { token, reason, feedback } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).send(errorPage('Invalid unsubscribe link.'));
    }
    const supabase = getSupabase();
    const { data: subscriber } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, is_active, unsubscribe_token')
      .eq('unsubscribe_token', token)
      .maybeSingle();

    if (!subscriber) {
      return res.status(404).send(errorPage('Unsubscribe link not found.'));
    }
    if (!subscriber.is_active) {
      return res.send(alreadyUnsubscribedPage(subscriber.email, getSiteUrl()));
    }

    await supabase
      .from('newsletter_subscribers')
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_reason: reason || null,
        unsubscribe_feedback: feedback || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id);

    const siteUrl = getSiteUrl();
    const resubscribeUrl = `${siteUrl}/#newsletter`;
    sendFarewellEmail(subscriber.email, siteUrl, resubscribeUrl, reason || null).catch(e =>
      console.error('[RESEND] Farewell email failed:', e)
    );

    return res.send(farewellPage(subscriber.email, siteUrl));
  } catch (err: any) {
    console.error('Unsubscribe POST error:', err);
    return res.status(500).send(errorPage('Something went wrong. Please try again.'));
  }
});

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    const supabase = getSupabase();
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      if (existing.is_active) {
        return res.status(409).json({ error: 'Email already subscribed' });
      }
      const { data } = await supabase
        .from('newsletter_subscribers')
        .update({ is_active: true, unsubscribed_at: null, confirmed_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      return res.json(data);
    }

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: email.toLowerCase(), is_active: true, source: 'admin', confirmed_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch {
    res.status(500).json({ error: 'Failed to add subscriber' });
  }
});

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to update subscriber' });
  }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();
    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete subscriber' });
  }
});

router.get('/export', requireAuth, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('email, is_active, source, unsubscribe_reason, unsubscribe_feedback, confirmed_at, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = [
      ['Email', 'Status', 'Source', 'Unsubscribe Reason', 'Feedback', 'Confirmed At', 'Subscribed At'],
      ...(data || []).map(s => [
        s.email,
        s.is_active ? 'Active' : 'Unsubscribed',
        s.source || 'website',
        s.unsubscribe_reason || '',
        s.unsubscribe_feedback || '',
        s.confirmed_at ? new Date(s.confirmed_at).toLocaleDateString() : '',
        new Date(s.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
    res.send(csv);
  } catch {
    res.status(500).json({ error: 'Failed to export subscribers' });
  }
});

// ─── HTML Pages ───────────────────────────────────────────────────────────────

const REASONS = [
  { id: 'too-frequent', label: 'Emails arrive too frequently', icon: '📬' },
  { id: 'not-relevant', label: "Content isn't relevant to me anymore", icon: '🔍' },
  { id: 'prefer-website', label: 'I prefer browsing the website directly', icon: '🌐' },
  { id: 'inbox-overload', label: 'Too many emails in my inbox', icon: '📥' },
  { id: 'found-better', label: 'Found another source I prefer', icon: '🔄' },
  { id: 'never-signed-up', label: "I don't remember signing up", icon: '❓' },
];

function surveyPage(email: string, token: string, siteUrl: string): string {
  const reasonCards = REASONS.map(r => `
    <label class="reason-card" for="r-${r.id}">
      <input type="radio" id="r-${r.id}" name="reason" value="${r.id}" />
      <span class="reason-icon">${r.icon}</span>
      <span class="reason-text">${r.label}</span>
      <span class="reason-check">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </span>
    </label>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unsubscribe - Mayobe Bros</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px}
    .wrapper{width:100%;max-width:560px}

    /* Header */
    .brand-bar{background:#1e3a5f;border-radius:16px 16px 0 0;padding:20px 32px;display:flex;align-items:center;gap:10px}
    .brand-name{font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.3px}
    .brand-tag{font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1.2px;margin-left:8px}

    /* Card */
    .card{background:#fff;padding:36px 32px;border-top:0}
    .header-icon{width:60px;height:60px;background:#fef3c7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 0 20px;font-size:26px}
    h1{font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;letter-spacing:-0.3px}
    .subtitle{font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 6px}
    .email-pill{display:inline-block;background:#eff6ff;color:#1d4ed8;font-size:13px;font-weight:600;padding:4px 12px;border-radius:100px;margin:10px 0 24px}
    .section-label{font-size:11px;font-weight:600;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px}

    /* Reason cards */
    .reasons{display:flex;flex-direction:column;gap:8px;margin-bottom:24px}
    .reason-card{display:flex;align-items:center;gap:12px;padding:12px 16px;border:2px solid #e5e7eb;border-radius:12px;cursor:pointer;transition:all 0.15s ease;position:relative}
    .reason-card:hover{border-color:#93c5fd;background:#f8faff}
    .reason-card input[type=radio]{position:absolute;opacity:0;pointer-events:none}
    .reason-card.selected{border-color:#2563eb;background:#eff6ff}
    .reason-icon{font-size:18px;flex-shrink:0;width:28px;text-align:center}
    .reason-text{font-size:14px;color:#374151;font-weight:500;flex:1}
    .reason-check{width:22px;height:22px;border-radius:50%;border:2px solid #d1d5db;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s;color:transparent}
    .reason-card.selected .reason-check{background:#2563eb;border-color:#2563eb;color:#fff}

    /* Feedback */
    .feedback-wrap{margin-bottom:28px}
    .feedback-wrap label{font-size:13px;font-weight:500;color:#374151;display:block;margin-bottom:8px}
    textarea{width:100%;border:2px solid #e5e7eb;border-radius:10px;padding:12px 14px;font-size:14px;font-family:inherit;color:#374151;resize:vertical;min-height:80px;line-height:1.5;transition:border-color 0.15s;outline:none}
    textarea:focus{border-color:#2563eb}

    /* Buttons */
    .btn-row{display:flex;gap:12px;align-items:center}
    .btn-unsub{flex:1;padding:13px 24px;background:#dc2626;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:background 0.15s}
    .btn-unsub:hover{background:#b91c1c}
    .btn-unsub:disabled{opacity:0.6;cursor:not-allowed}
    .btn-stay{padding:13px 20px;background:#f3f4f6;color:#374151;border:none;border-radius:10px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;transition:background 0.15s;white-space:nowrap}
    .btn-stay:hover{background:#e5e7eb}

    /* Footer */
    .footer{background:#f8fafc;border-top:1px solid #e5e7eb;border-radius:0 0 16px 16px;padding:18px 32px;text-align:center}
    .footer p{font-size:12px;color:#9ca3af}
    .footer a{color:#9ca3af;text-decoration:underline}

    /* Loading state */
    .spinner{display:none;width:16px;height:16px;border:2px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;margin-right:8px}
    @keyframes spin{to{transform:rotate(360deg)}}
    .loading .spinner{display:inline-block}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="brand-bar">
      <span class="brand-name">Mayobe Bros</span>
      <span class="brand-tag">Newsletter</span>
    </div>

    <div class="card">
      <div class="header-icon">😔</div>
      <h1>Sorry to see you go</h1>
      <p class="subtitle">Before you leave, we'd love to know why. Your feedback helps us improve.</p>
      <div class="email-pill">${email}</div>

      <form id="unsubForm" action="/api/newsletter/unsubscribe" method="POST">
        <input type="hidden" name="token" value="${token}" />

        <p class="section-label">Why are you unsubscribing?</p>
        <div class="reasons" id="reasons">
          ${reasonCards}
        </div>

        <div class="feedback-wrap">
          <label for="feedback">Anything else you'd like to share? <span style="color:#9ca3af;font-weight:400">(optional)</span></label>
          <textarea id="feedback" name="feedback" placeholder="Tell us what we could do better..."></textarea>
        </div>

        <div class="btn-row">
          <a href="${siteUrl}" class="btn-stay">Keep my subscription</a>
          <button type="submit" class="btn-unsub" id="submitBtn">
            <span class="spinner"></span>
            Unsubscribe
          </button>
        </div>
      </form>
    </div>

    <div class="footer">
      <p>You subscribed at <strong style="color:#6b7280">mayobebros.com</strong> &nbsp;·&nbsp; <a href="${siteUrl}">Visit site</a></p>
    </div>
  </div>

  <script>
    const cards = document.querySelectorAll('.reason-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        card.querySelector('input').checked = true;
      });
    });

    document.getElementById('unsubForm').addEventListener('submit', function(e) {
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.classList.add('loading');
      btn.querySelector('.spinner').style.display = 'inline-block';
    });
  </script>
</body>
</html>`;
}

function farewellPage(email: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unsubscribed - Mayobe Bros</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 16px}
    .wrapper{width:100%;max-width:480px}
    .brand-bar{background:#1e3a5f;border-radius:16px 16px 0 0;padding:20px 32px}
    .brand-name{font-size:18px;font-weight:700;color:#fff}
    .card{background:#fff;padding:44px 36px;text-align:center}
    .icon{font-size:48px;margin-bottom:20px}
    h1{font-size:24px;font-weight:700;color:#111827;margin:0 0 12px;letter-spacing:-0.3px}
    .sub{font-size:15px;color:#6b7280;line-height:1.65;margin:0 0 8px}
    .email-pill{display:inline-block;background:#f3f4f6;color:#374151;font-size:13px;font-weight:600;padding:4px 14px;border-radius:100px;margin:10px 0 28px}
    .divider{width:40px;height:2px;background:#e5e7eb;margin:0 auto 24px}
    .note{font-size:13px;color:#9ca3af;line-height:1.6;margin-bottom:28px}
    .btn{display:inline-block;padding:13px 32px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600}
    .btn:hover{background:#162d4a}
    .footer{background:#f8fafc;border-top:1px solid #e5e7eb;border-radius:0 0 16px 16px;padding:18px 32px;text-align:center}
    .footer p{font-size:12px;color:#9ca3af}
    .footer a{color:#9ca3af;text-decoration:underline}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="brand-bar">
      <span class="brand-name">Mayobe Bros</span>
    </div>
    <div class="card">
      <div class="icon">👋</div>
      <h1>You've been unsubscribed</h1>
      <p class="sub">Thanks for being with us. We've removed you from our newsletter.</p>
      <div class="email-pill">${email}</div>
      <div class="divider"></div>
      <p class="note">You won't receive any more emails from Mayobe Bros. We appreciate your feedback — it helps us make our newsletter better for everyone.</p>
      <p class="note">Changed your mind? You can re-subscribe at any time from our website.</p>
      <a href="${siteUrl}" class="btn">Visit Mayobe Bros</a>
    </div>
    <div class="footer">
      <p><a href="${siteUrl}">mayobebros.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

function alreadyUnsubscribedPage(email: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Already Unsubscribed - Mayobe Bros</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 16px}
    .wrapper{width:100%;max-width:480px}
    .brand-bar{background:#1e3a5f;border-radius:16px 16px 0 0;padding:20px 32px}
    .brand-name{font-size:18px;font-weight:700;color:#fff}
    .card{background:#fff;padding:44px 36px;text-align:center}
    .icon{font-size:44px;margin-bottom:20px}
    h1{font-size:22px;font-weight:700;color:#111827;margin:0 0 10px}
    p{font-size:14px;color:#6b7280;line-height:1.65;margin-bottom:24px}
    .email-pill{display:inline-block;background:#f3f4f6;color:#374151;font-size:13px;font-weight:600;padding:4px 14px;border-radius:100px;margin-bottom:24px}
    .btn{display:inline-block;padding:13px 32px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600}
    .footer{background:#f8fafc;border-top:1px solid #e5e7eb;border-radius:0 0 16px 16px;padding:18px 32px;text-align:center}
    .footer p{font-size:12px;color:#9ca3af}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="brand-bar"><span class="brand-name">Mayobe Bros</span></div>
    <div class="card">
      <div class="icon">✓</div>
      <h1>Already unsubscribed</h1>
      <div class="email-pill">${email}</div>
      <p>You've already been removed from our newsletter. You won't receive any further emails from us.</p>
      <a href="${siteUrl}" class="btn">Visit Mayobe Bros</a>
    </div>
    <div class="footer"><p><a href="${siteUrl}" style="color:#9ca3af;text-decoration:underline;">mayobebros.com</a></p></div>
  </div>
</body>
</html>`;
}

function errorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Error - Mayobe Bros</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
    .card{background:#fff;border-radius:16px;padding:44px 36px;max-width:440px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.06)}
    h1{font-size:22px;font-weight:700;color:#111;margin-bottom:10px}
    p{color:#6b7280;line-height:1.6;margin-bottom:24px}
    a{display:inline-block;padding:12px 28px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:10px;font-weight:600}
  </style>
</head>
<body>
  <div class="card">
    <h1>Something went wrong</h1>
    <p>${message}</p>
    <a href="/">Return to Mayobe Bros</a>
  </div>
</body>
</html>`;
}

export default router;
