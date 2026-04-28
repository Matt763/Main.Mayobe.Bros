# 5-Day "What You Missed" Digest Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically send a "What You Missed" digest email to all active newsletter subscribers every 5 days, containing every post published in that window, using a beautiful branded email template.

**Architecture:** A Vercel cron job fires daily at 08:00 UTC, hits `GET /api/newsletter/digest-cron`, which calls `dispatchFiveDayDigest()` — a new utility that checks `digest_send_log` for the last send date, fetches posts from the window, and emails all active subscribers via Resend. The email template reuses existing `htmlShell`/`sharedHeader`/`sharedFooter` helpers for brand consistency.

**Tech Stack:** Express.js, Supabase (postgres), Resend email API, Vercel Cron, TypeScript

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `server/utils/digestDispatch.ts` | 5-day timing check, post fetch, subscriber loop, log write |
| Modify | `server/utils/resend.ts` | Add `DigestPost` interface, `buildFiveDayDigestEmail()`, `sendFiveDayDigestEmail()` |
| Modify | `server/routes/newsletter.ts` | Add `GET /digest-cron` endpoint |
| Modify | `vercel.json` | Add `crons` array entry |
| Modify | `mayobe_database_setup.sql` | Add `digest_send_log` table definition |

---

## Task 1: Create digest_send_log table in Supabase

**Files:**
- Modify: `mayobe_database_setup.sql` (append at end)

- [ ] **Step 1: Run this SQL in your Supabase dashboard → SQL Editor**

```sql
CREATE TABLE IF NOT EXISTS digest_send_log (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start     timestamptz NOT NULL,
  period_end       timestamptz NOT NULL,
  post_count       integer,
  subscriber_count integer,
  status           text        NOT NULL DEFAULT 'pending', -- pending | sent | skipped | failed
  error            text,
  sent_at          timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE digest_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to digest log"
  ON digest_send_log FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Anon server can manage digest log"
  ON digest_send_log FOR ALL TO anon
  USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Verify table exists**

In Supabase dashboard → Table Editor, confirm `digest_send_log` appears with columns: `id`, `period_start`, `period_end`, `post_count`, `subscriber_count`, `status`, `error`, `sent_at`, `created_at`.

- [ ] **Step 3: Add table definition to mayobe_database_setup.sql**

Append to the end of `mayobe_database_setup.sql`:

```sql
-- ─── digest_send_log ──────────────────────────────────────────────────────────
-- Tracks 5-day digest email dispatches. No unique constraint — retries are safe.
CREATE TABLE IF NOT EXISTS digest_send_log (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start     timestamptz NOT NULL,
  period_end       timestamptz NOT NULL,
  post_count       integer,
  subscriber_count integer,
  status           text        NOT NULL DEFAULT 'pending', -- pending | sent | failed
  error            text,
  sent_at          timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE digest_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to digest log"
  ON digest_send_log FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Anon server can manage digest log"
  ON digest_send_log FOR ALL TO anon
  USING (true) WITH CHECK (true);
```

- [ ] **Step 4: Commit**

```bash
git add mayobe_database_setup.sql
git commit -m "chore: add digest_send_log table definition"
```

---

## Task 2: Add digest email template to resend.ts

**Files:**
- Modify: `server/utils/resend.ts` (append before the last export)

- [ ] **Step 1: Add `DigestPost` interface and `buildFiveDayDigestEmail` function**

Find the line `export async function sendPostDigestEmail(` in `server/utils/resend.ts`. Insert the following block **above** it:

```typescript
// ─── 7. 5-Day "What You Missed" Digest ───────────────────────────────────────

export interface DigestPost {
  title: string;
  excerpt: string;
  featuredImage?: string;
  url: string;
  category: string;
  author: string;
  readingTime?: number;
  publishedAt: string;
}

export function buildFiveDayDigestEmail(
  unsubscribeUrl: string,
  siteUrl: string,
  posts: DigestPost[],
  dateRange: { start: Date; end: Date },
  totalPostCount: number
): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dateRangeStr = `${fmt(dateRange.start)} – ${fmt(dateRange.end)}`;
  const year = dateRange.end.getFullYear();

  const postCards = posts.map(post => {
    const imageBlock = post.featuredImage
      ? `<img src="${post.featuredImage}" alt="" style="width:100%;height:200px;object-fit:cover;border-radius:10px 10px 0 0;display:block;" />`
      : `<div style="width:100%;height:120px;background:linear-gradient(135deg,#0f1c2e 0%,#1e3a5f 100%);border-radius:10px 10px 0 0;text-align:center;line-height:120px;">
           <span style="font-size:11px;font-weight:700;color:rgba(201,160,0,0.85);letter-spacing:1.5px;text-transform:uppercase;vertical-align:middle;">${post.category}</span>
         </div>`;

    const meta = [
      post.readingTime ? `${post.readingTime} min read` : '',
      new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ].filter(Boolean).join(' · ');

    return `
      <tr>
        <td style="padding-bottom:24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid #e9edf2;border-radius:12px;overflow:hidden;background:#ffffff;">
            <tr><td style="padding:0;">${imageBlock}</td></tr>
            <tr>
              <td style="padding:22px 26px 26px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                  <tr>
                    <td style="background:#c9a000;border-radius:4px;padding:3px 9px;">
                      <span style="font-size:10px;font-weight:700;color:#0f1c2e;letter-spacing:1.2px;text-transform:uppercase;">${post.category}</span>
                    </td>
                  </tr>
                </table>
                <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;color:#0f1c2e;margin:0 0 10px;line-height:1.35;letter-spacing:-0.2px;">
                  <a href="${post.url}" style="color:#0f1c2e;text-decoration:none;">${post.title}</a>
                </h2>
                <p style="font-size:14px;color:#4b5563;line-height:1.75;margin:0 0 14px;">${post.excerpt}</p>
                <p style="font-size:12px;color:#9ca3af;margin:0 0 18px;">
                  <span style="font-weight:600;color:#6b7280;">${post.author}</span>
                  ${meta ? `&nbsp;&middot;&nbsp;${meta}` : ''}
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#c9a000;border-radius:6px;">
                      <a href="${post.url}" style="display:inline-block;padding:9px 20px;color:#0f1c2e;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">Read Article &rarr;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }).join('');

  const overflowCta = totalPostCount > posts.length
    ? `<tr>
         <td style="padding-bottom:36px;text-align:center;">
           <a href="${siteUrl}" style="font-size:14px;color:#2563eb;font-weight:600;text-decoration:underline;">
             See all ${totalPostCount} articles &rarr;
           </a>
         </td>
       </tr>`
    : '';

  return htmlShell(
    `What You Missed at Mayobe Bros — ${dateRangeStr}`,
    `${posts.length} new article${posts.length !== 1 ? 's' : ''} from the last 5 days — catch up now.`,
    `
    ${sharedHeader(`<span style="font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:0.5px;">${dateRangeStr}, ${year}</span>`)}

    <tr>
      <td style="background:#ffffff;padding:48px 44px 32px;">
        ${GOLD_RULE}
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:bold;color:#0f1c2e;margin:0 0 12px;letter-spacing:-0.5px;line-height:1.25;">
          Here's what you missed
        </h1>
        <p style="font-size:16px;color:#4b5563;line-height:1.8;margin:0 0 8px;">
          ${posts.length} new article${posts.length !== 1 ? 's' : ''} published over the last 5 days &mdash; catch up below.
        </p>
        <div style="width:100%;height:1px;background:#e9edf2;margin:28px 0 0;"></div>
      </td>
    </tr>

    <tr>
      <td style="background:#f8fafc;padding:28px 44px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${postCards}
          ${overflowCta}
        </table>
      </td>
    </tr>

    ${sharedFooter(`
      You received this because you subscribed at
      <a href="${siteUrl}" style="color:rgba(255,255,255,0.6);text-decoration:none;">mayobebros.com</a>
      &nbsp;&middot;&nbsp;
      <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Unsubscribe</a>
      &nbsp;&middot;&nbsp;
      <a href="${siteUrl}/privacy-policy" style="color:rgba(255,255,255,0.55);text-decoration:none;">Privacy Policy</a>
    `)}
  `);
}

export async function sendFiveDayDigestEmail(
  to: string,
  unsubscribeUrl: string,
  siteUrl: string,
  posts: DigestPost[],
  dateRange: { start: Date; end: Date },
  totalPostCount: number
): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`[RESEND] RESEND_API_KEY not set — 5-day digest skipped for ${to}`);
    return;
  }
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const subject = `What You Missed at Mayobe Bros — ${fmt(dateRange.start)} – ${fmt(dateRange.end)}`;
  const html = buildFiveDayDigestEmail(unsubscribeUrl, siteUrl, posts, dateRange, totalPostCount);
  const { error } = await resend.emails.send({ from: getFromAddress(), to, subject, html });
  if (error) {
    console.error(`[RESEND] 5-day digest error for ${to}:`, error);
    throw new Error((error as { message?: string }).message || 'Resend error');
  }
  console.log(`[RESEND] 5-day digest sent to ${to}`);
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add server/utils/resend.ts
git commit -m "feat: add 5-day digest email template to resend.ts"
```

---

## Task 3: Create digestDispatch.ts

**Files:**
- Create: `server/utils/digestDispatch.ts`

- [ ] **Step 1: Create the file with this exact content**

```typescript
import { createClient } from '@supabase/supabase-js';
import { sendFiveDayDigestEmail, type DigestPost } from './resend.js';

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

function getSiteUrl(): string {
  return process.env.VITE_SITE_URL || 'https://mayobebros.com';
}

const DIGEST_INTERVAL_DAYS = 5;
const SEND_DELAY_MS = 220;
const MAX_POSTS_IN_EMAIL = 8;

export interface DigestResult {
  sent: boolean;
  skipped?: boolean;
  reason?: 'too_soon' | 'no_posts';
  postCount?: number;
  subscriberCount?: number;
}

export async function dispatchFiveDayDigest(): Promise<DigestResult> {
  const supabase = getSupabase();
  const siteUrl = getSiteUrl();
  const now = new Date();

  // Check when last digest was successfully sent
  const { data: lastSent } = await supabase
    .from('digest_send_log')
    .select('sent_at')
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastSent) {
    const daysSinceLast =
      (now.getTime() - new Date(lastSent.sent_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLast < DIGEST_INTERVAL_DAYS) {
      return { sent: false, skipped: true, reason: 'too_soon' };
    }
  }

  // Window: from the last sent timestamp (or 5 days ago) to now
  const windowStart = lastSent
    ? new Date(lastSent.sent_at)
    : new Date(now.getTime() - DIGEST_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

  // Fetch posts published in the window
  const { data: posts, error: postsErr } = await supabase
    .from('posts')
    .select('id, title, excerpt, featured_image, slug, author, reading_time, published_at, categories(name, slug)')
    .eq('status', 'published')
    .gte('published_at', windowStart.toISOString())
    .lte('published_at', now.toISOString())
    .order('published_at', { ascending: false });

  if (postsErr) throw postsErr;

  if (!posts || posts.length === 0) {
    return { sent: false, skipped: true, reason: 'no_posts' };
  }

  // Create a pending log row
  const { data: logEntry, error: logErr } = await supabase
    .from('digest_send_log')
    .insert({
      period_start: windowStart.toISOString(),
      period_end: now.toISOString(),
      status: 'pending',
    })
    .select('id')
    .single();

  if (logErr) {
    console.error('[DIGEST] Failed to create log entry:', logErr);
    throw logErr;
  }

  try {
    const { data: subscribers, error: subErr } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, unsubscribe_token')
      .eq('is_active', true);

    if (subErr) throw subErr;

    if (!subscribers || subscribers.length === 0) {
      await supabase
        .from('digest_send_log')
        .update({ status: 'sent', post_count: posts.length, subscriber_count: 0 })
        .eq('id', logEntry.id);
      console.log('[DIGEST] No active subscribers — logged as sent with 0 recipients');
      return { sent: true, postCount: posts.length, subscriberCount: 0 };
    }

    // Build post objects for the email (cap at MAX_POSTS_IN_EMAIL most recent)
    const displayPosts: DigestPost[] = posts.slice(0, MAX_POSTS_IN_EMAIL).map((p: any) => {
      const catSlug = p.categories?.slug || '';
      const postPath = catSlug ? `/post/${catSlug}/${p.slug}` : `/post/${p.slug}`;
      return {
        title: p.title,
        excerpt: p.excerpt || 'Read the latest from Mayobe Bros.',
        featuredImage: p.featured_image || undefined,
        url: `${siteUrl}${postPath}`,
        category: p.categories?.name || 'Article',
        author: p.author || 'Mayobe Bros',
        readingTime: p.reading_time || undefined,
        publishedAt: p.published_at,
      };
    });

    const dateRange = { start: windowStart, end: now };
    let sentCount = 0;

    for (let i = 0; i < subscribers.length; i++) {
      const sub = subscribers[i];
      try {
        const unsubUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${sub.unsubscribe_token}`;
        await sendFiveDayDigestEmail(
          sub.email, unsubUrl, siteUrl, displayPosts, dateRange, posts.length
        );
        sentCount++;
      } catch (e: any) {
        console.error(`[DIGEST] Failed to send to ${sub.email}:`, e?.message || e);
      }
      if (i < subscribers.length - 1) {
        await new Promise(r => setTimeout(r, SEND_DELAY_MS));
      }
    }

    await supabase
      .from('digest_send_log')
      .update({ status: 'sent', post_count: posts.length, subscriber_count: sentCount })
      .eq('id', logEntry.id);

    console.log(
      `[DIGEST] Sent to ${sentCount}/${subscribers.length} — ${posts.length} posts ` +
      `(${windowStart.toISOString().slice(0, 10)} → ${now.toISOString().slice(0, 10)})`
    );
    return { sent: true, postCount: posts.length, subscriberCount: sentCount };

  } catch (err: any) {
    console.error('[DIGEST] Dispatch failed:', err);
    await supabase
      .from('digest_send_log')
      .update({ status: 'failed', error: err.message || 'Unknown error' })
      .eq('id', logEntry.id);
    throw err;
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add server/utils/digestDispatch.ts
git commit -m "feat: add dispatchFiveDayDigest utility"
```

---

## Task 4: Add /digest-cron endpoint to newsletter.ts

**Files:**
- Modify: `server/routes/newsletter.ts`

- [ ] **Step 1: Add import at the top of the file**

Find the existing imports at the top of `server/routes/newsletter.ts`. Add this line after the last import:

```typescript
import { dispatchFiveDayDigest } from '../utils/digestDispatch.js';
```

- [ ] **Step 2: Add the cron endpoint**

Find the line `router.get('/', requireAuth,` in `server/routes/newsletter.ts`. Insert this block **above** it:

```typescript
// GET /digest-cron — called by Vercel Cron daily at 08:00 UTC
router.get('/digest-cron', async (req: Request, res: Response) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers['authorization'];
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await dispatchFiveDayDigest();
    return res.json(result);
  } catch (err: any) {
    console.error('[DIGEST CRON] Error:', err);
    return res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 4: Commit**

```bash
git add server/routes/newsletter.ts
git commit -m "feat: add GET /newsletter/digest-cron endpoint"
```

---

## Task 5: Add Vercel cron job to vercel.json

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Add crons array to vercel.json**

Open `vercel.json`. The current content is:

```json
{
  "functions": { ... },
  "rewrites": [ ... ]
}
```

Add a `"crons"` key so it becomes:

```json
{
  "functions": {
    "api/index.ts": {
      "maxDuration": 300,
      "includeFiles": "dist/**"
    }
  },
  "crons": [
    {
      "path": "/api/newsletter/digest-cron",
      "schedule": "0 8 * * *"
    }
  ],
  "rewrites": [
    { "source": "/api/:path*",                    "destination": "/api/index" },
    { "source": "/sitemap.xml",                   "destination": "/api/index" },
    { "source": "/sitemap-status",                "destination": "/api/index" },
    { "source": "/feed.xml",                      "destination": "/api/index" },
    { "source": "/authoritative-sitemap.xml",     "destination": "/api/index" },
    { "source": "/news-sitemap.xml",              "destination": "/api/index" },
    { "source": "/posts-sitemap:n.xml",           "destination": "/api/index" },
    { "source": "/category-sitemap:n.xml",        "destination": "/api/index" },
    { "source": "/image-sitemap:n.xml",           "destination": "/api/index" },
    { "source": "/video-sitemap:n.xml",           "destination": "/api/index" },
    { "source": "/post/:path*",                   "destination": "/api/index" },
    { "source": "/category/:path*",               "destination": "/api/index" },
    { "source": "/page/:path*",                   "destination": "/api/index" },
    { "source": "/(.*)",                          "destination": "/index.html" }
  ]
}
```

- [ ] **Step 2: Type-check and build verify**

```bash
npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit and push**

```bash
git add vercel.json
git commit -m "feat: add Vercel cron job for 5-day digest email (daily 08:00 UTC)"
git push origin main
```

After push, go to **Vercel dashboard → your project → Settings → Crons** to confirm the cron job appears as `0 8 * * *` pointing to `/api/newsletter/digest-cron`.

---

## Task 6: Manual test trigger

- [ ] **Step 1: Get your CRON_SECRET from Vercel**

In Vercel dashboard → Settings → Environment Variables, find `CRON_SECRET`. If it doesn't exist yet, Vercel sets it automatically after the first deploy that includes a `crons` entry. Re-deploy if needed.

- [ ] **Step 2: Trigger a test send**

```bash
curl -X GET \
  "https://www.mayobebros.com/api/newsletter/digest-cron" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
```

Expected response (if posts exist and 5 days have passed since last digest):
```json
{ "sent": true, "postCount": 3, "subscriberCount": 12 }
```

Expected response (if last digest was too recent):
```json
{ "sent": false, "skipped": true, "reason": "too_soon" }
```

Expected response (if no posts published in window):
```json
{ "sent": false, "skipped": true, "reason": "no_posts" }
```

- [ ] **Step 3: Verify in Supabase**

In Supabase → Table Editor → `digest_send_log`, confirm a row appears with `status = 'sent'`, correct `post_count`, and `subscriber_count`.

- [ ] **Step 4: Check inbox**

Confirm subscribers received the email with the correct date range in the subject and all post cards rendered correctly.
