# 5-Day "What You Missed" Digest Email

**Date:** 2026-04-28  
**Status:** Approved

## Overview

Automatically send a "What You Missed" digest email to all active newsletter subscribers every 5 days, containing every post published in that window. If no posts were published, the send is skipped and the 5-day clock resets from the next successful send.

---

## Architecture

### New files
| File | Purpose |
|------|---------|
| `server/utils/digestDispatch.ts` | Core dispatch logic — checks timing, fetches posts, sends emails, logs result |
| (additions to) `server/utils/resend.ts` | `buildFiveDayDigestEmail()` + `sendFiveDayDigestEmail()` |
| (additions to) `server/routes/newsletter.ts` | `GET /api/newsletter/digest-cron` endpoint |

### Changed files
| File | Change |
|------|--------|
| `vercel.json` | Add `crons` array entry calling `/api/newsletter/digest-cron` daily at 08:00 UTC |

### New database table: `digest_send_log`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
sent_at          timestamptz DEFAULT now()
period_start     timestamptz NOT NULL   -- start of the 5-day window
period_end       timestamptz NOT NULL   -- end of the 5-day window
post_count       integer
subscriber_count integer
status           text DEFAULT 'pending' -- pending | sent | skipped | failed
error            text
created_at       timestamptz DEFAULT now()
```

---

## Data Flow

```
Vercel Cron (daily 08:00 UTC)
  → GET /api/newsletter/digest-cron
      → validate Authorization: Bearer CRON_SECRET (401 if wrong)
      → query digest_send_log for most recent sent row
          → if last sent < 5 days ago → respond 200 { skipped: true, reason: 'too_soon' }
      → query posts WHERE published_at >= now()-5d AND status='published'
          → if 0 posts → respond 200 { skipped: true, reason: 'no_posts' }
      → insert digest_send_log row (status='pending')
      → fetch active subscribers
      → for each subscriber (220ms gap):
            sendFiveDayDigestEmail(subscriber, posts, dateRange)
      → update digest_send_log row → status='sent', post_count, subscriber_count
      → respond 200 { sent: true, postCount, subscriberCount }
  → on any throw after log insert:
      → update digest_send_log → status='failed', error=message
      → next daily run retries (no unique constraint blocks retry)
```

---

## API Endpoint

```
GET /api/newsletter/digest-cron
Headers: Authorization: Bearer <CRON_SECRET>
```

- Vercel injects `CRON_SECRET` automatically in the `Authorization` header for cron-triggered requests.
- Manually triggerable from admin for testing by passing the same header.
- Returns JSON: `{ skipped, reason?, sent, postCount?, subscriberCount? }`

---

## Email Template

**Subject:** `What You Missed at Mayobe Bros — Apr 23 – Apr 28`

**Layout (top → bottom):**
1. Dark navy header bar (#0f1c2e) with gold bottom border (#c9a000) — "Mayobe Bros" + date range right-aligned
2. White body — gold rule, headline "Here's what you missed", subtext "X new articles over the last 5 days"
3. Post cards (one per post, stacked):
   - Featured image full-width rounded (gradient fallback with category name if no image)
   - Gold category badge
   - Article title — large serif font
   - 2-line excerpt
   - Author · reading time · publish date row
   - Gold "Read Article →" CTA button
4. If more than 8 posts: show 8 most recent + "See all X articles →" button → homepage
5. Dark footer — unsubscribe link, privacy policy, site link

**Reuses:** `htmlShell`, `sharedHeader`, `sharedFooter`, `GOLD_RULE` from `resend.ts`.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Vercel auto-injects this to authenticate cron requests |
| `RESEND_API_KEY` | Already in use |
| `VITE_SITE_URL` | Already in use |
| `VITE_SUPABASE_URL` | Already in use |
| `SUPABASE_SERVICE_ROLE_KEY` | Already in use |

---

## Error Handling

- Wrong/missing `CRON_SECRET` → 401, no work done
- 0 posts in window → 200 skipped, no email sent, no log row written
- Last send < 5 days ago → 200 skipped, no log row written
- Resend API failure on individual subscriber → log error, continue to next subscriber
- Uncaught throw → `digest_send_log` row updated to `failed`; next daily run retries (no unique-slug constraint to block it)

---

## Constraints

- Max 8 posts shown per digest (most recent first); overflow linked via homepage CTA
- Rate limit: 220ms between sends (same as `newsletterDispatch.ts`)
- Skipped sends do NOT reset the 5-day clock — only actual `status='sent'` rows count
- The 5-day window is measured from the `sent_at` of the last successful digest, not calendar dates
