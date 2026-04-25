import { Resend } from 'resend';

const BRAND = {
  name: 'Mayobe Bros',
  tagline: 'Knowledge · Insights · Stories',
  primaryColor: '#0f1c2e',
  primaryLight: '#1e3a5f',
  accentColor: '#2563eb',
  goldColor: '#c9a000',
  lightAccent: '#eff6ff',
  textDark: '#0f172a',
  textBody: '#374151',
  textMuted: '#6b7280',
  borderColor: '#e2e8f0',
  successColor: '#059669',
  warningColor: '#d97706',
  dangerColor: '#dc2626',
  logoUrl: 'https://mayobebros.com/mayobebroslogo.png',
};

const FROM_PRIMARY  = 'Mayobe Bros <info@mayobebros.com>';
const FROM_SUPPORT  = 'Mayobe Bros Support <support@mayobebros.com>';
const FROM_FALLBACK = 'Mayobe Bros <onboarding@resend.dev>';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromAddress(): string {
  const addr = process.env.RESEND_FROM_EMAIL || FROM_PRIMARY;
  if (addr && !addr.includes('<')) {
    return `Mayobe Bros <${addr}>`;
  }
  return addr;
}

// ─── Shared design tokens ─────────────────────────────────────────────────────

const GOLD_RULE = `<div style="width:52px;height:3px;background:#c9a000;border-radius:2px;margin:0 0 28px;"></div>`;

function logoHeaderBlock(rightHtml = ''): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:middle;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;padding-right:16px;">
                <img src="${BRAND.logoUrl}" alt="Mayobe Bros" width="44" height="44"
                     style="display:block;width:44px;height:44px;border:0;border-radius:8px;" />
              </td>
              <td style="vertical-align:middle;border-left:1px solid rgba(201,160,0,0.45);padding-left:16px;">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;color:#ffffff;line-height:1;letter-spacing:-0.2px;">Mayobe Bros</div>
                <div style="font-size:9px;color:#c9a000;letter-spacing:2.8px;text-transform:uppercase;margin-top:5px;">${BRAND.tagline}</div>
              </td>
            </tr>
          </table>
        </td>
        ${rightHtml ? `<td align="right" style="vertical-align:middle;">${rightHtml}</td>` : '<td></td>'}
      </tr>
    </table>`;
}

function sharedHeader(rightHtml = ''): string {
  return `
  <tr>
    <td style="background:#0f1c2e;border-radius:16px 16px 0 0;border-bottom:3px solid #c9a000;padding:30px 44px;">
      ${logoHeaderBlock(rightHtml)}
    </td>
  </tr>`;
}

function sharedFooter(bodyHtml: string): string {
  return `
  <tr>
    <td style="background:#0b1520;border-radius:0 0 16px 16px;padding:28px 44px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0 0 10px;line-height:1.8;">${bodyHtml}</p>
            <p style="font-size:10px;color:rgba(255,255,255,0.25);margin:0;letter-spacing:0.5px;">
              &copy; ${new Date().getFullYear()} Mayobe Bros &middot; All rights reserved
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function htmlShell(title: string, preheader: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { margin:0; padding:0; background:#edf0f4; font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    td { border-collapse:collapse; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; }
    a { text-decoration:none; }
  </style>
</head>
<body style="margin:0;padding:0;background:#edf0f4;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#edf0f4;">${preheader} &#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf0f4;min-height:100vh;">
    <tr>
      <td align="center" style="padding:44px 16px 52px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          ${body}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── 1. Newsletter Welcome ────────────────────────────────────────────────────

export function buildWelcomeEmail(unsubscribeUrl: string, siteUrl: string): string {
  const features = [
    { label: 'Curated Articles', desc: 'Hand-picked stories on education, business, technology, history, and culture.' },
    { label: 'Expert Insights', desc: 'Deep dives and editorial analysis from our team of writers and contributors.' },
    { label: 'First in Your Inbox', desc: 'New posts arrive the moment they are published — no algorithms, no delays.' },
  ];

  return htmlShell(
    'Welcome to Mayobe Bros Newsletter',
    "Welcome! You're now part of the Mayobe Bros newsletter — Knowledge, Insights, and Stories.",
    `
    ${sharedHeader()}

    <!-- BODY -->
    <tr>
      <td style="background:#ffffff;padding:52px 44px 48px;">

        <!-- Envelope icon -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td style="width:72px;height:72px;border:2px solid #c9a000;border-radius:50%;text-align:center;line-height:72px;">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#c9a000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-top:21px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </td>
          </tr>
        </table>

        ${GOLD_RULE}

        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:bold;color:#0f1c2e;margin:0 0 16px;letter-spacing:-0.6px;line-height:1.25;">You're in the circle.</h1>
        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 44px;max-width:440px;">Welcome to the Mayobe Bros newsletter — where knowledge meets insight. You will receive our most thoughtful articles, analysis, and stories, delivered straight to your inbox.</p>

        <!-- Features -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e9edf2;padding-top:36px;margin-bottom:44px;">
          ${features.map((f, i) => `
          <tr>
            <td style="padding-bottom:${i < features.length - 1 ? '24px' : '0'};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;vertical-align:top;padding-top:1px;">
                    <div style="width:28px;height:28px;background:#c9a000;border-radius:50%;text-align:center;line-height:28px;">
                      <span style="font-size:12px;font-weight:700;color:#0f1c2e;">${i + 1}</span>
                    </div>
                  </td>
                  <td style="padding-left:14px;vertical-align:top;">
                    <p style="font-size:14px;font-weight:700;color:#0f1c2e;margin:0 0 3px;letter-spacing:0.1px;">${f.label}</p>
                    <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.65;">${f.desc}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`).join('')}
        </table>

        <!-- CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#c9a000;border-radius:8px;">
              <a href="${siteUrl}" style="display:inline-block;padding:16px 44px;color:#0f1c2e;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.4px;">Browse Latest Articles &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${sharedFooter(`
      You subscribed at <a href="${siteUrl}" style="color:rgba(255,255,255,0.6);text-decoration:none;">mayobebros.com</a>
      &nbsp;&middot;&nbsp;
      <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Unsubscribe</a>
      &nbsp;&middot;&nbsp;
      <a href="${siteUrl}/privacy-policy" style="color:rgba(255,255,255,0.55);text-decoration:none;">Privacy Policy</a>
    `)}
  `);
}

// ─── 2. Post Digest (new article newsletter) ──────────────────────────────────

export interface DigestPostData {
  title: string;
  excerpt: string;
  featuredImage?: string;
  url: string;
  category: string;
  author: string;
  readingTime?: number;
}

export interface RelatedPostData {
  title: string;
  excerpt: string;
  featuredImage?: string;
  url: string;
  category: string;
}

export function buildDigestEmail(
  unsubscribeUrl: string,
  siteUrl: string,
  post: DigestPostData,
  relatedPosts: RelatedPostData[] = []
): string {
  const authorInitial = (post.author || 'M')[0].toUpperCase();

  const featuredImageBlock = post.featuredImage
    ? `<img src="${post.featuredImage}" alt="${post.title}" width="600" style="width:100%;max-height:300px;object-fit:cover;display:block;" />`
    : `<div style="height:200px;background:linear-gradient(135deg,#0f1c2e 0%,#1e3a5f 60%,#0f1c2e 100%);text-align:center;padding-top:64px;">
        <div style="width:64px;height:64px;border:2px solid rgba(201,160,0,0.5);border-radius:50%;margin:0 auto;text-align:center;line-height:60px;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(201,160,0,0.75)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-top:17px;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        </div>
        <div style="font-family:Georgia,serif;font-size:10px;color:rgba(201,160,0,0.6);letter-spacing:3px;text-transform:uppercase;margin-top:14px;">Mayobe Bros</div>
       </div>`;

  const relatedBlock = relatedPosts.length > 0 ? `
  <tr>
    <td style="background:#f7f8fb;border-top:1px solid #e9edf2;padding:36px 44px;">
      <p style="font-size:10px;font-weight:700;color:#0f1c2e;text-transform:uppercase;letter-spacing:2.5px;margin:0 0 22px;">You Might Also Enjoy</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${relatedPosts.slice(0, 3).map((rp, i) => `
        <tr>
          <td style="padding-bottom:${i < Math.min(relatedPosts.length, 3) - 1 ? '14px' : '0'};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-left:3px solid #c9a000;border-radius:8px;overflow:hidden;">
              <tr>
                ${rp.featuredImage
                  ? `<td style="width:80px;vertical-align:top;"><img src="${rp.featuredImage}" alt="${rp.title}" width="80" height="64" style="display:block;width:80px;height:64px;object-fit:cover;" /></td>`
                  : ''}
                <td style="padding:13px 16px;vertical-align:middle;">
                  <p style="font-size:10px;font-weight:700;color:#c9a000;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">${rp.category}</p>
                  <a href="${rp.url}" style="font-size:13px;font-weight:600;color:#0f1c2e;text-decoration:none;line-height:1.4;display:block;margin:0 0 4px;">${rp.title}</a>
                  <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.45;">${rp.excerpt.substring(0, 80)}${rp.excerpt.length > 80 ? '…' : ''}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`).join('')}
      </table>
    </td>
  </tr>` : '';

  return htmlShell(
    post.title,
    `${post.excerpt.substring(0, 110)}…`,
    `
    ${sharedHeader(`<span style="font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:0.5px;">${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</span>`)}

    <!-- FEATURED IMAGE -->
    <tr><td style="background:#ffffff;overflow:hidden;">${featuredImageBlock}</td></tr>

    <!-- ARTICLE CONTENT -->
    <tr>
      <td style="background:#ffffff;padding:40px 44px 48px;">

        ${post.category ? `
        <div style="margin-bottom:18px;">
          <span style="display:inline-block;background:#f8f6e8;border:1px solid #c9a000;color:#7a5f00;font-size:10px;font-weight:700;padding:5px 14px;border-radius:100px;text-transform:uppercase;letter-spacing:1.8px;">${post.category}</span>
        </div>` : ''}

        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:bold;color:#0f1c2e;line-height:1.35;margin:0 0 22px;letter-spacing:-0.4px;">
          <a href="${post.url}" style="color:#0f1c2e;text-decoration:none;">${post.title}</a>
        </h1>

        <!-- Author -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
          <tr>
            <td style="vertical-align:middle;padding-right:12px;">
              <div style="width:38px;height:38px;background:#0f1c2e;border-radius:50%;text-align:center;line-height:38px;font-size:15px;font-weight:700;color:#c9a000;font-family:Georgia,serif;">${authorInitial}</div>
            </td>
            <td style="vertical-align:middle;">
              <div style="font-size:14px;font-weight:600;color:#0f1c2e;">${post.author}</div>
              ${post.readingTime ? `<div style="font-size:12px;color:#9ca3af;margin-top:2px;">${post.readingTime} min read</div>` : ''}
            </td>
          </tr>
        </table>

        ${GOLD_RULE}

        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 36px;">${post.excerpt}</p>

        <!-- CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#0f1c2e;border-radius:8px;">
              <a href="${post.url}" style="display:inline-block;padding:16px 44px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">Read Full Article &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${relatedBlock}

    <!-- CTA BAND -->
    <tr>
      <td style="background:#0f1c2e;padding:32px 44px;text-align:center;">
        <p style="font-family:Georgia,serif;font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 5px;font-weight:bold;">Explore more on Mayobe Bros</p>
        <p style="font-size:9px;color:#c9a000;margin:0 0 22px;letter-spacing:3px;text-transform:uppercase;">${BRAND.tagline}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td style="background:#c9a000;border-radius:8px;">
              <a href="${siteUrl}" style="display:inline-block;padding:13px 32px;color:#0f1c2e;font-size:14px;font-weight:700;text-decoration:none;">Visit Website</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${sharedFooter(`
      You're receiving this because you subscribed to the Mayobe Bros newsletter.
      <br />
      <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Unsubscribe</a>
      &nbsp;&middot;&nbsp;
      <a href="${siteUrl}/privacy-policy" style="color:rgba(255,255,255,0.55);text-decoration:none;">Privacy Policy</a>
      &nbsp;&middot;&nbsp;
      <a href="${siteUrl}" style="color:rgba(255,255,255,0.55);text-decoration:none;">mayobebros.com</a>
    `)}
  `);
}

// ─── 3. Farewell (Unsubscribe Confirmation) ───────────────────────────────────

export function buildFarewellEmail(
  siteUrl: string,
  resubscribeUrl: string,
  reason?: string | null
): string {
  const REASON_LABELS: Record<string, string> = {
    'too-frequent':  'Emails arrived too frequently',
    'not-relevant':  "Content wasn't relevant anymore",
    'prefer-website':'Prefers browsing the website directly',
    'inbox-overload':'Too many emails in inbox',
    'found-better':  'Found another source to follow',
    'never-signed-up':"Didn't remember signing up",
  };
  const reasonLabel = reason ? (REASON_LABELS[reason] || reason) : null;

  return htmlShell(
    "You've been unsubscribed — Mayobe Bros",
    "You've been successfully unsubscribed from Mayobe Bros. We'll miss you.",
    `
    ${sharedHeader()}

    <!-- BODY -->
    <tr>
      <td style="background:#ffffff;padding:52px 44px 48px;">

        <!-- Icon -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td style="width:72px;height:72px;border:2px solid #e2e8f0;border-radius:50%;text-align:center;line-height:72px;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-top:22px;"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
            </td>
          </tr>
        </table>

        ${GOLD_RULE}

        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:bold;color:#0f1c2e;margin:0 0 16px;letter-spacing:-0.5px;line-height:1.25;">Until next time.</h1>
        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 36px;max-width:420px;">You've been successfully unsubscribed from the Mayobe Bros newsletter. We're sorry to see you go, and we respect your decision entirely.</p>

        ${reasonLabel ? `
        <!-- Reason -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td style="background:#f7f8fb;border:1px solid #e2e8f0;border-left:3px solid #c9a000;border-radius:8px;padding:18px 22px;">
              <p style="font-size:10px;font-weight:700;color:#0f1c2e;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 7px;">Your reason</p>
              <p style="font-size:14px;color:#374151;font-weight:600;margin:0 0 5px;">${reasonLabel}</p>
              <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.55;">Thank you for letting us know — your feedback helps us improve.</p>
            </td>
          </tr>
        </table>` : ''}

        <!-- Re-subscribe offer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:${reasonLabel ? '0' : '8px'};">
          <tr>
            <td style="background:#f7f8fb;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="font-size:14px;font-weight:600;color:#0f1c2e;margin:0 0 3px;">Changed your mind?</p>
                    <p style="font-size:13px;color:#6b7280;margin:0;">You can re-subscribe at any time — no questions asked.</p>
                  </td>
                  <td align="right" style="vertical-align:middle;padding-left:20px;white-space:nowrap;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#0f1c2e;border-radius:7px;">
                          <a href="${resubscribeUrl}" style="display:inline-block;padding:11px 22px;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">Re-subscribe</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- INFO STRIP -->
    <tr>
      <td style="background:#1e3a5f;padding:20px 44px;">
        <p style="font-size:12px;color:rgba(255,255,255,0.5);margin:0;text-align:center;">
          This is the last email you will receive from Mayobe Bros Newsletter.
          &nbsp;&middot;&nbsp;
          <a href="${siteUrl}" style="color:rgba(255,255,255,0.65);text-decoration:none;">mayobebros.com</a>
        </p>
      </td>
    </tr>

    ${sharedFooter(`<a href="${siteUrl}/privacy-policy" style="color:rgba(255,255,255,0.55);text-decoration:none;">Privacy Policy</a> &nbsp;&middot;&nbsp; <a href="${siteUrl}" style="color:rgba(255,255,255,0.55);text-decoration:none;">mayobebros.com</a>`)}
  `);
}

export async function sendWelcomeEmail(to: string, unsubscribeUrl: string, siteUrl: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) { console.warn(`[RESEND] RESEND_API_KEY not set — welcome email skipped for ${to}`); return; }
  const html = buildWelcomeEmail(unsubscribeUrl, siteUrl);
  const { error } = await resend.emails.send({ from: getFromAddress(), to, subject: 'Welcome to Mayobe Bros Newsletter', html });
  if (error) { console.error('[RESEND] Welcome email error:', error); throw new Error((error as { message?: string }).message || 'Resend error'); }
  console.log(`[RESEND] Welcome email sent to ${to}`);
}

export async function sendFarewellEmail(to: string, siteUrl: string, resubscribeUrl: string, reason?: string | null): Promise<void> {
  const resend = getResendClient();
  if (!resend) { console.warn(`[RESEND] RESEND_API_KEY not set — farewell email skipped for ${to}`); return; }
  const html = buildFarewellEmail(siteUrl, resubscribeUrl, reason);
  const { error } = await resend.emails.send({ from: getFromAddress(), to, subject: "You've been unsubscribed from Mayobe Bros", html });
  if (error) console.error('[RESEND] Farewell email error:', error);
  console.log(`[RESEND] Farewell email sent to ${to}`);
}

// ─── 4. Account Welcome ───────────────────────────────────────────────────────

export function buildAccountWelcomeEmail(name: string, siteUrl: string): string {
  const firstName = name.split(' ')[0] || name;

  const perks = [
    { n: '1', title: 'Unlimited Article Access',  desc: 'Read every post, deep dive, and analysis on Mayobe Bros without any restrictions.' },
    { n: '2', title: 'Join the Conversation',      desc: 'Comment on articles and share your perspective with our growing community.' },
    { n: '3', title: 'Newsletter Delivered',       desc: 'Get notified the moment we publish something new — directly to your inbox.' },
    { n: '4', title: 'Exclusive Member Content',   desc: 'Premium insights and long-form pieces reserved for registered members only.' },
  ];

  return htmlShell(
    `Welcome to Mayobe Bros, ${firstName}!`,
    `Welcome aboard, ${firstName}! Your Mayobe Bros account is ready — full access starts now.`,
    `
    ${sharedHeader()}

    <!-- GOLD WELCOME BAND -->
    <tr>
      <td style="background:#c9a000;padding:13px 44px;">
        <p style="font-size:11px;font-weight:700;color:#0f1c2e;text-transform:uppercase;letter-spacing:2px;margin:0;">
          Account Activated &nbsp;&middot;&nbsp; Full Access Granted
        </p>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="background:#ffffff;padding:52px 44px 48px;">

        <!-- Checkmark icon -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td style="width:72px;height:72px;background:#f8f6e8;border:2px solid #c9a000;border-radius:50%;text-align:center;line-height:72px;">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#c9a000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-top:21px;"><polyline points="20 6 9 17 4 12"/></svg>
            </td>
          </tr>
        </table>

        ${GOLD_RULE}

        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:bold;color:#0f1c2e;margin:0 0 16px;letter-spacing:-0.6px;line-height:1.25;">Welcome aboard, ${firstName}.</h1>
        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 44px;max-width:440px;">Your Mayobe Bros account is ready. You now have full access to every article, insight, and community feature on our platform. We're genuinely glad you're here.</p>

        <!-- Perks list -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e9edf2;padding-top:36px;margin-bottom:44px;">
          ${perks.map((p, i) => `
          <tr>
            <td style="padding-bottom:${i < perks.length - 1 ? '22px' : '0'};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;vertical-align:top;padding-top:2px;">
                    <div style="width:28px;height:28px;background:#0f1c2e;border-radius:50%;text-align:center;line-height:28px;">
                      <span style="font-size:12px;font-weight:700;color:#c9a000;">${p.n}</span>
                    </div>
                  </td>
                  <td style="padding-left:14px;vertical-align:top;">
                    <p style="font-size:14px;font-weight:700;color:#0f1c2e;margin:0 0 3px;">${p.title}</p>
                    <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.65;">${p.desc}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`).join('')}
        </table>

        <!-- CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#c9a000;border-radius:8px;">
              <a href="${siteUrl}" style="display:inline-block;padding:16px 44px;color:#0f1c2e;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.4px;">Start Reading &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- INFO STRIP -->
    <tr>
      <td style="background:#1e3a5f;padding:22px 44px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:50%;vertical-align:top;padding-right:20px;">
              <p style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.2px;margin:0 0 5px;">Support</p>
              <a href="mailto:support@mayobebros.com" style="font-size:12px;color:rgba(255,255,255,0.7);text-decoration:none;">support@mayobebros.com</a>
            </td>
            <td style="width:50%;vertical-align:top;border-left:1px solid rgba(255,255,255,0.1);padding-left:20px;">
              <p style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.2px;margin:0 0 5px;">Website</p>
              <a href="${siteUrl}" style="font-size:12px;color:rgba(255,255,255,0.7);text-decoration:none;">mayobebros.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${sharedFooter(`You received this because you created an account at <a href="${siteUrl}" style="color:rgba(255,255,255,0.6);text-decoration:none;">mayobebros.com</a> &nbsp;&middot;&nbsp; <a href="${siteUrl}/privacy-policy" style="color:rgba(255,255,255,0.55);text-decoration:none;">Privacy Policy</a>`)}
  `);
}

export async function sendAccountWelcomeEmail(to: string, name: string, siteUrl: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) { console.warn(`[RESEND] RESEND_API_KEY not set — account welcome email skipped for ${to}`); return; }
  const html = buildAccountWelcomeEmail(name, siteUrl);
  const firstName = name.split(' ')[0] || name;
  const { error } = await resend.emails.send({ from: getFromAddress(), to, subject: `Welcome to Mayobe Bros, ${firstName}!`, html });
  if (error) { console.error('[RESEND] Account welcome email error:', error); throw new Error((error as { message?: string }).message || 'Resend error'); }
  console.log(`[RESEND] Account welcome email sent to ${to}`);
}

// ─── 5. Forgot Password ───────────────────────────────────────────────────────

export function buildForgotPasswordEmail(name: string, secretCode: string, siteUrl: string): string {
  const firstName = name.split(' ')[0] || name;

  const steps = [
    `Go to <a href="${siteUrl}" style="color:#0f1c2e;font-weight:600;">mayobebros.com</a> and click <strong style="color:#0f1c2e;">Sign In</strong>`,
    'Click <strong style="color:#0f1c2e;">Forgot Password?</strong> on the sign-in form',
    'Enter your email address — a code field will appear',
    'Paste the code above and click <strong style="color:#0f1c2e;">Verify Code</strong>',
    'Enter and confirm your new password to complete the reset',
  ];

  return htmlShell(
    'Reset Your Password — Mayobe Bros',
    `Hi ${firstName}, your Mayobe Bros password reset code is inside. This is a security alert.`,
    `
    ${sharedHeader()}

    <!-- RED SECURITY ALERT STRIP -->
    <tr>
      <td style="background:#dc2626;padding:12px 44px;">
        <p style="font-size:11px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1.8px;margin:0;">
          Security Alert &nbsp;&middot;&nbsp; Password Reset Requested
        </p>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="background:#ffffff;padding:48px 44px 44px;">

        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:bold;color:#0f1c2e;margin:0 0 14px;letter-spacing:-0.4px;line-height:1.3;">Hi ${firstName}, reset your password.</h1>
        <p style="font-size:15px;color:#374151;line-height:1.8;margin:0 0 36px;max-width:440px;">We received a request to reset your Mayobe Bros password. Use the secret code below to verify your identity and set a new password.</p>

        <!-- SECRET CODE BOX -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
          <tr>
            <td style="background:#0f1c2e;border-radius:12px;padding:36px 24px;text-align:center;">
              <p style="font-size:10px;font-weight:700;color:#c9a000;text-transform:uppercase;letter-spacing:3px;margin:0 0 18px;">Your Secret Reset Code</p>
              <div style="display:inline-block;background:rgba(255,255,255,0.07);border:1px solid rgba(201,160,0,0.5);border-radius:10px;padding:18px 36px;">
                <span style="font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:bold;color:#ffffff;letter-spacing:10px;">${secretCode}</span>
              </div>
              <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:18px 0 0;letter-spacing:0.3px;">Copy this code exactly as shown. It is case-sensitive.</p>
            </td>
          </tr>
        </table>

        <!-- STEPS -->
        <p style="font-size:10px;font-weight:700;color:#0f1c2e;text-transform:uppercase;letter-spacing:2px;margin:0 0 20px;">How to reset your password</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          ${steps.map((step, i) => `
          <tr>
            <td style="padding-bottom:${i < steps.length - 1 ? '14px' : '0'};">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="width:32px;vertical-align:top;padding-top:1px;">
                    <div style="width:26px;height:26px;background:#c9a000;border-radius:50%;text-align:center;line-height:26px;">
                      <span style="font-size:11px;font-weight:700;color:#0f1c2e;">${i + 1}</span>
                    </div>
                  </td>
                  <td style="padding-left:13px;vertical-align:middle;">
                    <p style="font-size:14px;color:#374151;margin:0;line-height:1.6;">${step}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`).join('')}
        </table>

        <!-- CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td style="background:#0f1c2e;border-radius:8px;">
              <a href="${siteUrl}" style="display:inline-block;padding:16px 44px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">Go to Mayobe Bros &rarr;</a>
            </td>
          </tr>
        </table>

        <!-- WARNING BOX -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#fff8f0;border:1px solid #fed7aa;border-radius:10px;padding:18px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="width:30px;vertical-align:top;padding-right:12px;padding-top:2px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </td>
                  <td style="vertical-align:top;">
                    <p style="font-size:13px;font-weight:700;color:#92400e;margin:0 0 3px;">Didn't request this?</p>
                    <p style="font-size:13px;color:#a16207;margin:0;line-height:1.6;">If you did not request a password reset, you can safely ignore this email. Your account remains fully secure — no changes have been made.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${sharedFooter(`This email was sent because a password reset was requested for your Mayobe Bros account. &nbsp;&middot;&nbsp; <a href="${siteUrl}/privacy-policy" style="color:rgba(255,255,255,0.55);text-decoration:none;">Privacy Policy</a>`)}
  `);
}

export async function sendForgotPasswordEmail(to: string, name: string, secretCode: string, siteUrl: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) { console.warn(`[RESEND] RESEND_API_KEY not set — forgot password email skipped for ${to}`); return; }
  const html = buildForgotPasswordEmail(name, secretCode, siteUrl);
  const { error } = await resend.emails.send({ from: FROM_SUPPORT, to, subject: 'Reset your Mayobe Bros password', html });
  if (error) { console.error('[RESEND] Forgot password email error:', error); throw new Error((error as { message?: string }).message || 'Resend error'); }
  console.log(`[RESEND] Forgot password email sent to ${to}`);
}

export async function sendPostDigestEmail(
  to: string,
  unsubscribeUrl: string,
  siteUrl: string,
  post: DigestPostData,
  relatedPosts: RelatedPostData[] = []
): Promise<void> {
  const resend = getResendClient();
  if (!resend) { console.warn(`[RESEND] RESEND_API_KEY not set — digest email skipped for ${to}`); return; }
  const html = buildDigestEmail(unsubscribeUrl, siteUrl, post, relatedPosts);
  const { error } = await resend.emails.send({ from: getFromAddress(), to, subject: `New Article: ${post.title}`, html });
  if (error) { console.error(`[RESEND] Digest email error for ${to}:`, error); throw new Error((error as { message?: string }).message || 'Resend error'); }
  console.log(`[RESEND] Digest email sent to ${to}`);
}

// ─── 6. Contact Emails (shared shell + two templates) ─────────────────────────

function emailShell(preheader: string, accentColor: string, body: string): string {
  return htmlShell('Mayobe Bros', preheader, `
    ${sharedHeader()}
    ${body}
    ${sharedFooter(`
      <a href="https://mayobebros.com" style="color:rgba(255,255,255,0.55);text-decoration:none;">mayobebros.com</a>
      &nbsp;&middot;&nbsp;
      <a href="https://mayobebros.com/privacy-policy" style="color:rgba(255,255,255,0.55);text-decoration:none;">Privacy Policy</a>
      &nbsp;&middot;&nbsp;
      <a href="https://mayobebros.com/contact-us" style="color:rgba(255,255,255,0.55);text-decoration:none;">Contact</a>
    `)}
  `);
}

// ─── 7. Contact: Admin Notification ──────────────────────────────────────────

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
  type?: string;
  id?: string;
}

const CONTACT_TYPE_LABELS: Record<string, string> = {
  general:     'General Enquiry',
  support:     'Technical Support',
  technical:   'Technical Issue',
  advertising: 'Advertising',
  editorial:   'Editorial Feedback',
  partnership: 'Partnership',
  press:       'Press & Media',
  other:       'Other',
};

const CONTACT_TYPE_COLORS: Record<string, string> = {
  general:     '#2563eb',
  support:     '#7c3aed',
  technical:   '#dc2626',
  advertising: '#059669',
  editorial:   '#d97706',
  partnership: '#0891b2',
  press:       '#9333ea',
  other:       '#475569',
};

export function buildContactAdminEmail(contact: ContactSubmission, siteUrl: string): string {
  const typeLabel   = CONTACT_TYPE_LABELS[contact.type || 'general'] || contact.type || 'General';
  const typeColor   = CONTACT_TYPE_COLORS[contact.type || 'general'] || BRAND.accentColor;
  const isUrgent    = contact.type === 'technical' || contact.type === 'support';
  const receivedAt  = new Date().toLocaleString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit', timeZoneName:'short' });

  const body = `
  <!-- ALERT STRIP -->
  <tr>
    <td style="background:${isUrgent ? '#dc2626' : typeColor};padding:12px 44px;">
      <p style="font-size:11px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1.8px;margin:0;">
        ${isUrgent ? `Urgent &nbsp;&middot;&nbsp; ${typeLabel} Requires Prompt Attention` : `New Contact Submission &nbsp;&middot;&nbsp; ${typeLabel}`}
      </p>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="background:#ffffff;padding:44px 44px 40px;">

      <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:bold;color:#0f1c2e;margin:0 0 6px;letter-spacing:-0.3px;line-height:1.3;">New message from ${contact.name}</h1>
      <p style="font-size:13px;color:#9ca3af;margin:0 0 28px;">${receivedAt}</p>

      <!-- SENDER CARD -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8fb;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;overflow:hidden;">
        <tr>
          <td style="padding:16px 22px;border-bottom:1px solid #e2e8f0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:50%;vertical-align:top;">
                  <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 5px;">From</p>
                  <p style="font-size:14px;font-weight:700;color:#0f1c2e;margin:0 0 3px;">${contact.name}</p>
                  <a href="mailto:${contact.email}" style="font-size:13px;color:${typeColor};text-decoration:none;">${contact.email}</a>
                </td>
                <td style="width:50%;vertical-align:top;border-left:1px solid #e2e8f0;padding-left:20px;">
                  <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 7px;">Type</p>
                  <span style="display:inline-block;background:${typeColor}18;color:${typeColor};font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;border:1px solid ${typeColor}35;text-transform:uppercase;letter-spacing:0.8px;">${typeLabel}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 22px;">
            <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 5px;">Subject</p>
            <p style="font-size:15px;font-weight:600;color:#0f1c2e;margin:0;">${contact.subject || '(No subject)'}</p>
          </td>
        </tr>
      </table>

      <!-- MESSAGE -->
      <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 12px;">Message</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr>
          <td style="background:#f7f8fb;border-left:3px solid ${typeColor};border-radius:0 8px 8px 0;padding:20px 22px;">
            <p style="font-size:15px;color:#374151;line-height:1.85;margin:0;white-space:pre-wrap;">${contact.message}</p>
          </td>
        </tr>
      </table>

      <!-- REPLY CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
        <tr>
          <td style="background:#0f1c2e;border-radius:8px;">
            <a href="mailto:${contact.email}?subject=Re: ${encodeURIComponent(contact.subject || 'Your message to Mayobe Bros')}" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">Reply to ${contact.name} &rarr;</a>
          </td>
        </tr>
      </table>
      <p style="font-size:12px;color:#6b7280;margin:0;">Or copy directly: <a href="mailto:${contact.email}" style="color:${typeColor};font-weight:600;">${contact.email}</a></p>
    </td>
  </tr>

  <!-- INFO STRIP -->
  <tr>
    <td style="background:#1e3a5f;padding:16px 44px;">
      <p style="font-size:11px;color:rgba(255,255,255,0.5);margin:0;">
        Submitted via mayobebros.com/contact-us${contact.id ? ` &middot; Ref: ${contact.id}` : ''}
      </p>
    </td>
  </tr>`;

  return emailShell(`New ${typeLabel} from ${contact.name}: "${contact.subject}"`, typeColor, body);
}

// ─── 8. Contact: User Confirmation ───────────────────────────────────────────

export function buildContactUserEmail(contact: ContactSubmission, siteUrl: string): string {
  const firstName    = contact.name.split(' ')[0] || contact.name;
  const typeLabel    = CONTACT_TYPE_LABELS[contact.type || 'general'] || 'General';
  const responseTime = (contact.type === 'technical' || contact.type === 'support') ? '24 hours' : '2–3 business days';

  const nextSteps = [
    { t: 'We review your message',          d: `Our team reads every submission and prioritises ${contact.type === 'technical' || contact.type === 'support' ? 'technical issues' : 'enquiries'} carefully.` },
    { t: `Response within ${responseTime}`, d: `We'll reply directly to <strong style="color:#0f1c2e;">${contact.email}</strong> — check your inbox and spam folder.` },
    { t: 'Resolution & follow-up',          d: 'For complex issues we may follow up with additional questions to give you the best possible help.' },
  ];

  const body = `
  <!-- GREEN SUCCESS STRIP -->
  <tr>
    <td style="background:#059669;padding:12px 44px;">
      <p style="font-size:11px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1.8px;margin:0;">
        Message Received &nbsp;&middot;&nbsp; We'll Be in Touch
      </p>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="background:#ffffff;padding:52px 44px 48px;">

      <!-- Checkmark icon -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr>
          <td style="width:72px;height:72px;background:#f0fdf4;border:2px solid #059669;border-radius:50%;text-align:center;line-height:72px;">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-top:21px;"><polyline points="20 6 9 17 4 12"/></svg>
          </td>
        </tr>
      </table>

      ${GOLD_RULE}

      <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:bold;color:#0f1c2e;margin:0 0 16px;letter-spacing:-0.5px;line-height:1.25;">Thank you, ${firstName}.</h1>
      <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 36px;max-width:430px;">We've received your message and our team will get back to you within <strong style="color:#0f1c2e;">${responseTime}</strong>. In the meantime, feel free to explore our latest content.</p>

      <!-- SUMMARY CARD -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8fb;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:36px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px;">Your Submission Summary</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:90px;padding-bottom:12px;vertical-align:top;">
                  <p style="font-size:12px;color:#6b7280;font-weight:600;margin:0;">Subject</p>
                </td>
                <td style="padding-bottom:12px;vertical-align:top;">
                  <p style="font-size:13px;color:#0f1c2e;font-weight:600;margin:0;">${contact.subject || '(No subject)'}</p>
                </td>
              </tr>
              <tr>
                <td style="width:90px;padding-bottom:12px;vertical-align:top;">
                  <p style="font-size:12px;color:#6b7280;font-weight:600;margin:0;">Type</p>
                </td>
                <td style="padding-bottom:12px;vertical-align:top;">
                  <p style="font-size:13px;color:#0f1c2e;font-weight:600;margin:0;">${typeLabel}</p>
                </td>
              </tr>
              <tr>
                <td style="width:90px;vertical-align:top;">
                  <p style="font-size:12px;color:#6b7280;font-weight:600;margin:0;">Message</p>
                </td>
                <td style="vertical-align:top;">
                  <p style="font-size:13px;color:#374151;margin:0;line-height:1.65;">${contact.message.substring(0, 180)}${contact.message.length > 180 ? '…' : ''}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- NEXT STEPS -->
      <p style="font-size:10px;font-weight:700;color:#0f1c2e;text-transform:uppercase;letter-spacing:2px;margin:0 0 20px;">What Happens Next</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:40px;">
        ${nextSteps.map((s, i) => `
        <tr>
          <td style="padding-bottom:${i < nextSteps.length - 1 ? '18px' : '0'};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:34px;vertical-align:top;padding-top:2px;">
                  <div style="width:26px;height:26px;background:#c9a000;border-radius:50%;text-align:center;line-height:26px;">
                    <span style="font-size:11px;font-weight:700;color:#0f1c2e;">${i + 1}</span>
                  </div>
                </td>
                <td style="padding-left:13px;vertical-align:top;">
                  <p style="font-size:14px;font-weight:700;color:#0f1c2e;margin:0 0 2px;">${s.t}</p>
                  <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;">${s.d}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`).join('')}
      </table>

      <!-- CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#0f1c2e;border-radius:8px;">
            <a href="${siteUrl}" style="display:inline-block;padding:16px 44px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">Browse Latest Articles &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- INFO STRIP -->
  <tr>
    <td style="background:#1e3a5f;padding:20px 44px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;vertical-align:top;">
            <p style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.2px;margin:0 0 5px;">Email Us</p>
            <a href="mailto:info@mayobebros.com" style="font-size:12px;color:rgba(255,255,255,0.7);text-decoration:none;">info@mayobebros.com</a>
          </td>
          <td style="width:50%;vertical-align:top;border-left:1px solid rgba(255,255,255,0.1);padding-left:20px;">
            <p style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.2px;margin:0 0 5px;">Website</p>
            <a href="${siteUrl}" style="font-size:12px;color:rgba(255,255,255,0.7);text-decoration:none;">mayobebros.com</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  return emailShell(
    `Hi ${firstName}, we received your message and will respond within ${responseTime}.`,
    BRAND.successColor,
    body
  );
}

// ─── Send helpers ─────────────────────────────────────────────────────────────

function getAdminEmailForType(type?: string): string {
  if (type === 'technical' || type === 'support') return 'support@mayobebros.com';
  return process.env.ADMIN_CONTACT_EMAIL || 'info@mayobebros.com';
}

export async function sendContactAdminEmail(contact: ContactSubmission, siteUrl: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) { console.warn('[RESEND] RESEND_API_KEY not set — contact admin email skipped'); return; }
  const typeLabel = CONTACT_TYPE_LABELS[contact.type || 'general'] || contact.type || 'General';
  const html = buildContactAdminEmail(contact, siteUrl);
  const adminTo = getAdminEmailForType(contact.type);
  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: adminTo,
    replyTo: `${contact.name} <${contact.email}>`,
    subject: `[Contact] ${typeLabel}: ${contact.subject || '(no subject)'} — from ${contact.name}`,
    html,
  });
  if (error) { console.error('[RESEND] Contact admin email error:', error); throw new Error((error as { message?: string }).message || 'Resend error'); }
  console.log(`[RESEND] Contact admin notification sent for ${contact.email}`);
}

export async function sendContactUserEmail(contact: ContactSubmission, siteUrl: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) { console.warn('[RESEND] RESEND_API_KEY not set — contact confirmation email skipped'); return; }
  const html = buildContactUserEmail(contact, siteUrl);
  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: contact.email,
    subject: `We received your message — Mayobe Bros`,
    html,
  });
  if (error) { console.error('[RESEND] Contact user email error:', error); throw new Error((error as { message?: string }).message || 'Resend error'); }
  console.log(`[RESEND] Contact confirmation sent to ${contact.email}`);
}

// ─── Password verification code (pre-change/reset) ───────────────────────────

const PURPOSE_LABELS: Record<string, { title: string; intro: string; cta: string }> = {
  change: {
    title: 'Confirm your password change',
    intro: 'You requested to change your Mayobe Bros password. Use the verification code below to complete the change.',
    cta:   'Complete password change',
  },
  set: {
    title: 'Set your Mayobe Bros password',
    intro: 'You signed in with Google or another provider and want to set a password too. Use the verification code below to complete it.',
    cta:   'Set password',
  },
  reset: {
    title: 'Reset your Mayobe Bros password',
    intro: 'We received a request to reset your password. Use the verification code below to set a new one.',
    cta:   'Reset password',
  },
};

export function buildPasswordVerificationEmail(name: string, code: string, purpose: 'change' | 'set' | 'reset', siteUrl: string): string {
  const firstName = (name || '').split(' ')[0] || 'there';
  const labels = PURPOSE_LABELS[purpose];
  const expiryMinutes = 15;

  return htmlShell(
    `${labels.title} — Mayobe Bros`,
    `Hi ${firstName}, here is your one-time verification code for Mayobe Bros.`,
    `
    ${sharedHeader()}

    <tr>
      <td style="background:#0f1c2e;padding:12px 44px;">
        <p style="font-size:11px;font-weight:700;color:#c9a000;text-transform:uppercase;letter-spacing:1.8px;margin:0;">
          Security &nbsp;&middot;&nbsp; ${purpose === 'reset' ? 'Password Reset' : 'Password Verification'}
        </p>
      </td>
    </tr>

    <tr>
      <td style="background:#ffffff;padding:48px 44px 44px;">
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#0f1c2e;margin:0 0 14px;letter-spacing:-0.4px;line-height:1.3;">
          Hi ${firstName}.
        </h1>
        <p style="font-size:15px;color:#374151;line-height:1.8;margin:0 0 30px;max-width:440px;">
          ${labels.intro}
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
          <tr>
            <td style="background:#0f1c2e;border-radius:12px;padding:36px 24px;text-align:center;">
              <p style="font-size:10px;font-weight:700;color:#c9a000;text-transform:uppercase;letter-spacing:3px;margin:0 0 18px;">Your Verification Code</p>
              <div style="display:inline-block;background:rgba(255,255,255,0.06);border:1px solid rgba(201,160,0,0.5);border-radius:10px;padding:18px 36px;">
                <span style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:bold;color:#ffffff;letter-spacing:14px;">${code}</span>
              </div>
              <p style="font-size:12px;color:rgba(255,255,255,0.45);margin:18px 0 0;letter-spacing:0.3px;">Expires in ${expiryMinutes} minutes. Case-sensitive.</p>
            </td>
          </tr>
        </table>

        <p style="font-size:12px;color:#9ca3af;line-height:1.7;margin:0;border-top:1px solid #f1f3f6;padding-top:18px;">
          If you didn't request this, you can safely ignore this email — your password will not change unless this code is used.
          <br />
          <a href="${siteUrl}" style="color:#0f1c2e;font-weight:600;">Open Mayobe Bros</a>
        </p>
      </td>
    </tr>

    ${sharedFooter('You received this because someone requested a password change for your account. Need help? Reply to this email.')}
    `,
  );
}

export async function sendPasswordVerificationEmail(
  to: string,
  name: string,
  code: string,
  purpose: 'change' | 'set' | 'reset',
  siteUrl: string,
): Promise<void> {
  if (!resend) { console.warn(`[RESEND] RESEND_API_KEY not set — verification email skipped for ${to}`); return; }
  const html = buildPasswordVerificationEmail(name, code, purpose, siteUrl);
  const subject = purpose === 'reset' ? 'Reset your Mayobe Bros password' :
                  purpose === 'set'   ? 'Set your Mayobe Bros password' :
                                        'Confirm your password change — Mayobe Bros';
  const { error } = await resend.emails.send({ from: getFromAddress(), to, subject, html });
  if (error) { console.error('[RESEND] Verification email error:', error); throw new Error((error as { message?: string }).message || 'Resend error'); }
  console.log(`[RESEND] Verification code sent to ${to} (purpose=${purpose})`);
}

// ─── Password changed confirmation (with "wasn't me" button) ─────────────────

export function buildPasswordChangedEmail(name: string, revokeUrl: string, when: Date, siteUrl: string): string {
  const firstName = (name || '').split(' ')[0] || 'there';
  const formatted = when.toUTCString();

  return htmlShell(
    'Your password was changed — Mayobe Bros',
    `Hi ${firstName}, this is a confirmation that your Mayobe Bros password was changed.`,
    `
    ${sharedHeader()}

    <tr>
      <td style="background:#059669;padding:12px 44px;">
        <p style="font-size:11px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1.8px;margin:0;">
          Account Activity &nbsp;&middot;&nbsp; Password Changed
        </p>
      </td>
    </tr>

    <tr>
      <td style="background:#ffffff;padding:48px 44px 44px;">
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#0f1c2e;margin:0 0 14px;letter-spacing:-0.4px;line-height:1.3;">
          Hi ${firstName}, your password was changed.
        </h1>
        <p style="font-size:15px;color:#374151;line-height:1.8;margin:0 0 28px;max-width:440px;">
          We're letting you know that your Mayobe Bros password was just updated.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:18px 22px;margin-bottom:30px;">
          <tr><td>
            <p style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;">When</p>
            <p style="font-size:14px;color:#0f1c2e;margin:0 0 14px;font-weight:500;">${formatted}</p>
          </td></tr>
        </table>

        <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 14px;font-weight:600;">
          Wasn't you?
        </p>
        <p style="font-size:14px;color:#4b5563;line-height:1.8;margin:0 0 22px;">
          If you didn't make this change, click the button below to immediately secure your account. We'll lock it and email you a fresh reset code.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 30px;">
          <tr>
            <td style="background:#dc2626;border-radius:10px;">
              <a href="${revokeUrl}" target="_blank" style="display:inline-block;padding:14px 26px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.4px;">
                This wasn't me — secure my account
              </a>
            </td>
          </tr>
        </table>

        <p style="font-size:12px;color:#9ca3af;line-height:1.7;margin:0;border-top:1px solid #f1f3f6;padding-top:18px;">
          You can also visit <a href="${siteUrl}/dashboard/account" style="color:#0f1c2e;font-weight:600;">Account &amp; Security</a> to review recent activity.
        </p>
      </td>
    </tr>

    ${sharedFooter('You received this because your account password was changed. If you initiated this, no action is needed.')}
    `,
  );
}

export async function sendPasswordChangedEmail(
  to: string,
  name: string,
  revokeUrl: string,
  siteUrl: string,
): Promise<void> {
  if (!resend) { console.warn(`[RESEND] RESEND_API_KEY not set — password-changed email skipped for ${to}`); return; }
  const html = buildPasswordChangedEmail(name, revokeUrl, new Date(), siteUrl);
  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: 'Your Mayobe Bros password was changed',
    html,
  });
  if (error) { console.error('[RESEND] Password-changed email error:', error); throw new Error((error as { message?: string }).message || 'Resend error'); }
  console.log(`[RESEND] Password-changed confirmation sent to ${to}`);
}
