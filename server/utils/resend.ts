import { Resend } from 'resend';

const BRAND = {
  name: 'Mayobe Bros',
  tagline: 'Knowledge · Insights · Stories',
  primaryColor: '#0f1c2e',      // deep navy — matches site dark header
  primaryLight: '#1e3a5f',      // mid navy — section headers
  accentColor: '#2563eb',       // blue CTA
  goldColor: '#c9a000',         // gold — premium accent
  lightAccent: '#eff6ff',       // soft blue tint for light backgrounds
  textDark: '#0f172a',
  textBody: '#374151',
  textMuted: '#6b7280',
  borderColor: '#e2e8f0',
  successColor: '#059669',
  warningColor: '#d97706',
  dangerColor: '#dc2626',
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
  // Ensure a display name is always present for better deliverability
  if (addr && !addr.includes('<')) {
    return `Mayobe Bros <${addr}>`;
  }
  return addr;
}

export function buildWelcomeEmail(unsubscribeUrl: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Welcome to Mayobe Bros Newsletter</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; max-width: 100%; }
    a { text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f1f5f9;">Welcome to Mayobe Bros! You're now subscribed to our newsletter. &#847;&#847;&#847;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND.primaryColor};border-radius:16px 16px 0 0;padding:28px 40px 24px;">
              <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Mayobe Bros</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:4px;letter-spacing:1.6px;text-transform:uppercase;">${BRAND.tagline}</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:48px 40px 44px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <div style="width:72px;height:72px;background:${BRAND.lightAccent};border-radius:50%;text-align:center;line-height:72px;display:inline-block;">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${BRAND.accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-top:20px;">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="font-size:28px;font-weight:700;color:${BRAND.textDark};margin:0 0 14px;letter-spacing:-0.5px;line-height:1.2;">You're in!</h1>
                    <p style="font-size:16px;color:${BRAND.textMuted};line-height:1.65;margin:0 0 36px;max-width:400px;">Welcome to the Mayobe Bros newsletter. We'll send you our best articles, insights, and stories.</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BRAND.borderColor};padding-top:32px;">
                <tr>
                  <td>
                    <p style="font-size:11px;font-weight:700;color:${BRAND.primaryColor};text-transform:uppercase;letter-spacing:1.2px;margin:0 0 18px;">What to expect</p>
                    ${[
                      ['Latest Articles', 'Hand-picked content on education, business, tech, history and more'],
                      ['Expert Insights', 'Deep dives and analysis from our editorial team'],
                      ['Newsletter Updates', 'New posts delivered directly to your inbox'],
                    ].map(([title, desc]) => `
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:14px;width:100%;">
                      <tr>
                        <td style="width:32px;vertical-align:top;padding-top:1px;">
                          <div style="width:22px;height:22px;background:${BRAND.lightAccent};border-radius:50%;text-align:center;line-height:22px;">
                            <span style="font-size:12px;color:${BRAND.accentColor};font-weight:700;">✓</span>
                          </div>
                        </td>
                        <td>
                          <p style="font-size:14px;font-weight:600;color:${BRAND.textDark};margin:0 0 2px;">${title}</p>
                          <p style="font-size:13px;color:${BRAND.textMuted};margin:0;line-height:1.5;">${desc}</p>
                        </td>
                      </tr>
                    </table>`).join('')}
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}" style="display:inline-block;background:${BRAND.primaryColor};color:#ffffff;font-size:15px;font-weight:600;padding:14px 40px;border-radius:10px;text-decoration:none;letter-spacing:0.2px;">Browse Latest Articles</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid ${BRAND.borderColor};border-radius:0 0 16px 16px;padding:24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="font-size:13px;color:#9ca3af;margin:0 0 8px;line-height:1.6;">You received this email because you subscribed at <strong style="color:#6b7280;">mayobebros.com</strong></p>
                    <p style="font-size:12px;color:#9ca3af;margin:0;">
                      <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
                      &nbsp;·&nbsp;
                      <a href="${siteUrl}/privacy-policy" style="color:#9ca3af;text-decoration:underline;">Privacy Policy</a>
                      &nbsp;·&nbsp;
                      <a href="${siteUrl}" style="color:#9ca3af;text-decoration:underline;">mayobebros.com</a>
                    </p>
                    <p style="font-size:11px;color:#d1d5db;margin:10px 0 0;">© ${new Date().getFullYear()} Mayobe Bros. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

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
  const featuredImageBlock = post.featuredImage
    ? `<img src="${post.featuredImage}" alt="${post.title}" width="600" style="width:100%;max-height:280px;object-fit:cover;display:block;" />`
    : `<div style="width:100%;height:180px;background:linear-gradient(135deg,${BRAND.primaryColor} 0%,${BRAND.accentColor} 100%);text-align:center;padding-top:48px;">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.70)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        <div style="font-size:12px;color:rgba(255,255,255,0.65);font-weight:600;margin-top:12px;letter-spacing:1.5px;text-transform:uppercase;">Mayobe Bros</div>
       </div>`;

  const relatedBlock = relatedPosts.length > 0 ? `
  <tr>
    <td style="background:#f8fafc;border-top:1px solid ${BRAND.borderColor};padding:32px 40px 36px;">
      <p style="font-size:11px;font-weight:700;color:${BRAND.primaryColor};text-transform:uppercase;letter-spacing:1.2px;margin:0 0 20px;">You might also enjoy</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${relatedPosts.slice(0, 3).map((rp, i) => `
        <tr>
          <td style="padding-bottom:${i < Math.min(relatedPosts.length, 3) - 1 ? '14px' : '0'};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BRAND.borderColor};border-radius:12px;overflow:hidden;">
              <tr>
                ${rp.featuredImage
                  ? `<td style="width:88px;vertical-align:top;"><img src="${rp.featuredImage}" alt="${rp.title}" style="width:88px;height:72px;object-fit:cover;display:block;border-radius:12px 0 0 12px;" /></td>`
                  : `<td style="width:6px;background:${BRAND.accentColor};border-radius:12px 0 0 12px;"></td>`}
                <td style="padding:13px 15px;vertical-align:middle;">
                  <p style="font-size:10px;font-weight:700;color:${BRAND.accentColor};text-transform:uppercase;letter-spacing:0.8px;margin:0 0 4px;">${rp.category}</p>
                  <a href="${rp.url}" style="font-size:13px;font-weight:600;color:${BRAND.textDark};text-decoration:none;line-height:1.4;display:block;margin:0 0 4px;">${rp.title}</a>
                  <p style="font-size:12px;color:${BRAND.textMuted};margin:0;line-height:1.4;">${rp.excerpt.substring(0, 90)}${rp.excerpt.length > 90 ? '...' : ''}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`).join('')}
      </table>
    </td>
  </tr>` : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${post.title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; max-width: 100%; }
    a { text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f1f5f9;">${post.excerpt.substring(0, 120)} &#847;&#847;&#847;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Masthead -->
          <tr>
            <td style="background:${BRAND.primaryColor};border-radius:16px 16px 0 0;padding:20px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${siteUrl}" style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;text-decoration:none;">Mayobe Bros</a>
                    <span style="font-size:10px;color:rgba(255,255,255,0.45);margin-left:10px;letter-spacing:1.4px;text-transform:uppercase;vertical-align:middle;">Newsletter</span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:0.5px;">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Featured Image -->
          <tr>
            <td style="background:#ffffff;overflow:hidden;">${featuredImageBlock}</td>
          </tr>

          <!-- Article Content -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px 40px;">
              ${post.category ? `
              <div style="margin-bottom:16px;">
                <span style="display:inline-block;background:${BRAND.lightAccent};color:${BRAND.accentColor};font-size:10px;font-weight:700;padding:5px 14px;border-radius:100px;text-transform:uppercase;letter-spacing:1px;">${post.category}</span>
              </div>` : ''}
              <h1 style="font-family:'Merriweather',Georgia,serif;font-size:26px;font-weight:700;color:${BRAND.textDark};line-height:1.38;margin:0 0 18px;letter-spacing:-0.3px;">
                <a href="${post.url}" style="color:${BRAND.textDark};text-decoration:none;">${post.title}</a>
              </h1>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
                <tr>
                  <td>
                    <div style="width:30px;height:30px;background:${BRAND.primaryColor};border-radius:50%;text-align:center;line-height:30px;font-size:13px;font-weight:700;color:#fff;display:inline-block;">${(post.author || 'M')[0].toUpperCase()}</div>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:13px;font-weight:600;color:${BRAND.textDark};">${post.author}</span>
                    ${post.readingTime ? `<span style="font-size:12px;color:${BRAND.textMuted};margin-left:8px;">· ${post.readingTime} min read</span>` : ''}
                  </td>
                </tr>
              </table>
              <div style="width:44px;height:3px;background:${BRAND.accentColor};border-radius:2px;margin-bottom:20px;"></div>
              <p style="font-size:16px;color:#374151;line-height:1.8;margin:0 0 32px;">${post.excerpt}</p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${BRAND.primaryColor};border-radius:10px;">
                    <a href="${post.url}" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">Read Full Article &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Related Posts -->
          ${relatedBlock}

          <!-- CTA Band -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.primaryColor} 0%,#1d4ed8 100%);padding:32px 40px;text-align:center;">
              <p style="font-size:16px;font-weight:600;color:#ffffff;margin:0 0 6px;">Explore more on Mayobe Bros</p>
              <p style="font-size:13px;color:rgba(255,255,255,0.65);margin:0 0 20px;">Knowledge &middot; Insights &middot; Stories</p>
              <a href="${siteUrl}" style="display:inline-block;background:#ffffff;color:${BRAND.primaryColor};font-size:14px;font-weight:700;padding:12px 30px;border-radius:8px;text-decoration:none;">Visit Website</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid ${BRAND.borderColor};border-radius:0 0 16px 16px;padding:24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="font-size:12px;color:#9ca3af;margin:0 0 8px;line-height:1.6;">You're receiving this because you subscribed to the Mayobe Bros newsletter.</p>
                    <p style="font-size:12px;color:#9ca3af;margin:0;">
                      <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
                      &nbsp;&nbsp;·&nbsp;&nbsp;
                      <a href="${siteUrl}/privacy-policy" style="color:#9ca3af;text-decoration:underline;">Privacy Policy</a>
                      &nbsp;&nbsp;·&nbsp;&nbsp;
                      <a href="${siteUrl}" style="color:#9ca3af;text-decoration:underline;">mayobebros.com</a>
                    </p>
                    <p style="font-size:11px;color:#d1d5db;margin:12px 0 0;">© ${new Date().getFullYear()} Mayobe Bros. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildFarewellEmail(
  siteUrl: string,
  resubscribeUrl: string,
  reason?: string | null
): string {
  const REASON_LABELS: Record<string, string> = {
    'too-frequent': 'Emails arrived too frequently',
    'not-relevant': "Content wasn't relevant anymore",
    'prefer-website': 'Prefers browsing the website directly',
    'inbox-overload': 'Too many emails in inbox',
    'found-better': 'Found another source to follow',
    'never-signed-up': "Didn't remember signing up",
  };
  const reasonLabel = reason ? (REASON_LABELS[reason] || reason) : null;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been unsubscribed - Mayobe Bros</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    a { text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f1f5f9;">You've been successfully unsubscribed from Mayobe Bros. We'll miss you!</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="background:${BRAND.primaryColor};border-radius:16px 16px 0 0;padding:20px 40px;">
              <a href="${siteUrl}" style="font-size:20px;font-weight:700;color:#ffffff;text-decoration:none;">Mayobe Bros</a>
              <span style="font-size:10px;color:rgba(255,255,255,0.45);margin-left:10px;letter-spacing:1.4px;text-transform:uppercase;vertical-align:middle;">Newsletter</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:48px 40px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:22px;">
                    <div style="width:70px;height:70px;background:#fff7ed;border-radius:50%;text-align:center;line-height:70px;display:inline-block;">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-top:19px;"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="font-size:26px;font-weight:700;color:${BRAND.textDark};margin:0 0 12px;letter-spacing:-0.4px;">Until next time</h1>
                    <p style="font-size:15px;color:${BRAND.textMuted};line-height:1.65;margin:0 0 28px;max-width:380px;">You've been successfully unsubscribed from the Mayobe Bros newsletter. We're sorry to see you go.</p>
                  </td>
                </tr>
              </table>
              ${reasonLabel ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid ${BRAND.borderColor};border-radius:12px;padding:18px 20px;">
                    <p style="font-size:10px;font-weight:700;color:${BRAND.primaryColor};text-transform:uppercase;letter-spacing:1.2px;margin:0 0 6px;">Your reason</p>
                    <p style="font-size:14px;color:${BRAND.textDark};margin:0;font-weight:600;">${reasonLabel}</p>
                    <p style="font-size:13px;color:${BRAND.textMuted};margin:8px 0 0;line-height:1.5;">Thank you for letting us know. We take all feedback seriously.</p>
                  </td>
                </tr>
              </table>` : ''}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid ${BRAND.borderColor};border-radius:12px;padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="font-size:14px;font-weight:600;color:${BRAND.textDark};margin:0 0 3px;">Changed your mind?</p>
                          <p style="font-size:13px;color:${BRAND.textMuted};margin:0;">Re-subscribe at any time.</p>
                        </td>
                        <td align="right" style="white-space:nowrap;padding-left:16px;">
                          <a href="${resubscribeUrl}" style="display:inline-block;background:${BRAND.primaryColor};color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">Re-subscribe</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;border-top:1px solid ${BRAND.borderColor};border-radius:0 0 16px 16px;padding:22px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="font-size:12px;color:#9ca3af;margin:0 0 6px;">This is the last email you'll receive from Mayobe Bros Newsletter.</p>
                    <p style="font-size:12px;color:#9ca3af;margin:0;">
                      <a href="${siteUrl}" style="color:#9ca3af;text-decoration:underline;">mayobebros.com</a>
                      &nbsp;·&nbsp;
                      <a href="${siteUrl}/privacy-policy" style="color:#9ca3af;text-decoration:underline;">Privacy Policy</a>
                    </p>
                    <p style="font-size:11px;color:#d1d5db;margin:10px 0 0;">© ${new Date().getFullYear()} Mayobe Bros. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail(to: string, unsubscribeUrl: string, siteUrl: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`[RESEND] RESEND_API_KEY not set — welcome email skipped for ${to}`);
    return;
  }
  const html = buildWelcomeEmail(unsubscribeUrl, siteUrl);
  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: 'Welcome to Mayobe Bros Newsletter',
    html,
  });
  if (error) {
    console.error('[RESEND] Welcome email error:', error);
    throw new Error((error as { message?: string }).message || 'Resend error');
  }
  console.log(`[RESEND] Welcome email sent to ${to}`);
}

export async function sendFarewellEmail(
  to: string,
  siteUrl: string,
  resubscribeUrl: string,
  reason?: string | null
): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`[RESEND] RESEND_API_KEY not set — farewell email skipped for ${to}`);
    return;
  }
  const html = buildFarewellEmail(siteUrl, resubscribeUrl, reason);
  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: "You've been unsubscribed from Mayobe Bros",
    html,
  });
  if (error) {
    console.error('[RESEND] Farewell email error:', error);
  }
  console.log(`[RESEND] Farewell email sent to ${to}`);
}

// ─── Account Welcome Email ────────────────────────────────────────────────────

export function buildAccountWelcomeEmail(name: string, siteUrl: string): string {
  const firstName = name.split(' ')[0] || name;
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Welcome to Mayobe Bros</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; max-width: 100%; }
    a { text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f1f5f9;">
    Welcome, ${firstName}! Your Mayobe Bros account is ready. &#847;&#847;&#847;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- ── Hero Header ── -->
          <tr>
            <td style="border-radius:16px 16px 0 0;overflow:hidden;background:linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%);padding:48px 40px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Knowledge · Insights · Stories</div>
                    <div style="font-size:30px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.1;font-family:'Merriweather',Georgia,serif;">Mayobe Bros</div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <div style="width:48px;height:48px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.20);border-radius:12px;text-align:center;line-height:48px;">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.80)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-top:13px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Welcome Band ── -->
          <tr>
            <td style="background:#2563eb;padding:0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:18px 0;border-top:1px solid rgba(255,255,255,0.15);">
                    <span style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.85);letter-spacing:0.3px;">Account activated &nbsp;·&nbsp; You're all set</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="background:#ffffff;padding:48px 40px 44px;">

              <!-- Greeting -->
              <h1 style="font-size:26px;font-weight:700;color:#111827;margin:0 0 14px;letter-spacing:-0.4px;line-height:1.25;">
                Welcome aboard, ${firstName}!
              </h1>
              <p style="font-size:16px;color:#4b5563;line-height:1.75;margin:0 0 36px;">
                Your Mayobe Bros account is ready. You now have full access to all our articles, insights, and exclusive content. We're glad you joined us.
              </p>

              <!-- Divider -->
              <div style="width:48px;height:3px;background:linear-gradient(90deg,#1e3a5f,#2563eb);border-radius:2px;margin-bottom:36px;"></div>

              <!-- What you get -->
              <p style="font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 20px;">What's waiting for you</p>

              ${[
                { svgPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8', title: 'Full Article Access', desc: 'Read every post, deep-dive, and analysis on Mayobe Bros without limits.' },
                { svgPath: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', title: 'Join the Conversation', desc: 'Comment on articles and share your perspective with our community.' },
                { svgPath: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22,6 12,13 2,6', title: 'Newsletter Updates', desc: 'Get notified the moment we publish something new — directly in your inbox.' },
                { svgPath: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', title: 'Premium Content', desc: 'Exclusive insights and long-form pieces reserved for registered members.' },
              ].map(item => `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="width:48px;vertical-align:top;padding-top:2px;">
                    <div style="width:40px;height:40px;background:#eff6ff;border-radius:10px;text-align:center;line-height:40px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-top:11px;"><path d="${item.svgPath}"/></svg>
                    </div>
                  </td>
                  <td style="padding-left:14px;vertical-align:top;">
                    <p style="font-size:14px;font-weight:700;color:#111827;margin:0 0 3px;">${item.title}</p>
                    <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.55;">${item.desc}</p>
                  </td>
                </tr>
              </table>`).join('')}

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);border-radius:12px;">
                          <a href="${siteUrl}" style="display:inline-block;padding:15px 44px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                            Start Reading &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Info Strip ── -->
          <tr>
            <td style="background:#1e3a5f;padding:24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:33%;padding-right:12px;vertical-align:top;">
                    <p style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;margin:0 0 5px;">Support</p>
                    <p style="font-size:12px;color:rgba(255,255,255,0.75);margin:0;">support@mayobebros.com</p>
                  </td>
                  <td style="width:33%;padding-right:12px;vertical-align:top;border-left:1px solid rgba(255,255,255,0.1);padding-left:12px;">
                    <p style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;margin:0 0 5px;">Website</p>
                    <a href="${siteUrl}" style="font-size:12px;color:rgba(255,255,255,0.75);text-decoration:none;">mayobebros.com</a>
                  </td>
                  <td style="width:33%;vertical-align:top;border-left:1px solid rgba(255,255,255,0.1);padding-left:12px;">
                    <p style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;margin:0 0 5px;">Account</p>
                    <p style="font-size:12px;color:rgba(255,255,255,0.75);margin:0;">Member</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e5e7eb;border-radius:0 0 16px 16px;padding:22px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="font-size:12px;color:#9ca3af;margin:0 0 6px;line-height:1.6;">
                      You received this because you created an account at <strong style="color:#6b7280;">mayobebros.com</strong>
                    </p>
                    <p style="font-size:12px;color:#9ca3af;margin:0;">
                      <a href="${siteUrl}/privacy-policy" style="color:#9ca3af;text-decoration:underline;">Privacy Policy</a>
                      &nbsp;·&nbsp;
                      <a href="${siteUrl}" style="color:#9ca3af;text-decoration:underline;">mayobebros.com</a>
                    </p>
                    <p style="font-size:11px;color:#d1d5db;margin:10px 0 0;">© ${new Date().getFullYear()} Mayobe Bros. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendAccountWelcomeEmail(to: string, name: string, siteUrl: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`[RESEND] RESEND_API_KEY not set — account welcome email skipped for ${to}`);
    return;
  }
  const html = buildAccountWelcomeEmail(name, siteUrl);
  const firstName = name.split(' ')[0] || name;
  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: `Welcome to Mayobe Bros, ${firstName}!`,
    html,
  });
  if (error) {
    console.error('[RESEND] Account welcome email error:', error);
    throw new Error((error as { message?: string }).message || 'Resend error');
  }
  console.log(`[RESEND] Account welcome email sent to ${to}`);
}

// ─── Forgot Password / Secret Code Email ─────────────────────────────────────

export function buildForgotPasswordEmail(name: string, secretCode: string, siteUrl: string): string {
  const firstName = name.split(' ')[0] || name;
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Reset Your Password – Mayobe Bros</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@700&family=JetBrains+Mono:wght@600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; max-width: 100%; }
    a { text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f1f5f9;">
    Your Mayobe Bros password reset code is inside. &#847;&#847;&#847;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- ── Header ── -->
          <tr>
            <td style="background:#1e3a5f;border-radius:16px 16px 0 0;padding:28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Mayobe Bros</div>
                    <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:4px;letter-spacing:1.6px;text-transform:uppercase;">Knowledge · Insights · Stories</div>
                  </td>
                  <td align="right">
                    <div style="width:44px;height:44px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);border-radius:12px;text-align:center;line-height:44px;">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.80)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-top:12px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Alert Strip ── -->
          <tr>
            <td style="background:#dc2626;padding:10px 40px;">
              <p style="font-size:11px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1.4px;margin:0;">
                Security alert &nbsp;·&nbsp; Password reset requested
              </p>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="background:#ffffff;padding:44px 40px 40px;">

              <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 12px;letter-spacing:-0.4px;">
                Hi ${firstName}, reset your password
              </h1>
              <p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 32px;">
                We received a request to reset your Mayobe Bros password. Use the secret code below to verify your identity and choose a new password.
              </p>

              <!-- Code Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#f8fafc;border:2px dashed #2563eb;border-radius:14px;padding:28px 24px;text-align:center;">
                    <p style="font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 14px;">Your Secret Reset Code</p>
                    <div style="font-family:'JetBrains Mono','Courier New',monospace;font-size:28px;font-weight:700;color:#1e3a5f;letter-spacing:6px;background:#eff6ff;display:inline-block;padding:14px 28px;border-radius:10px;border:1px solid #bfdbfe;">
                      ${secretCode}
                    </div>
                    <p style="font-size:12px;color:#6b7280;margin:14px 0 0;line-height:1.5;">
                      Copy this code exactly as shown. It is case-sensitive.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <p style="font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 18px;">How to reset your password</p>
              ${[
                'Go to mayobebros.com and click <strong style="color:#111827;">Sign In</strong>',
                'Click <strong style="color:#111827;">Forgot Password?</strong> on the sign-in form',
                'Enter your email — a code field will appear',
                'Paste the code above and click <strong style="color:#111827;">Verify Code</strong>',
                'Enter and confirm your new password',
              ].map((step, i) => `
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:12px;width:100%;">
                <tr>
                  <td style="width:30px;vertical-align:top;">
                    <div style="width:24px;height:24px;background:#1e3a5f;border-radius:50%;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#ffffff;">${i + 1}</div>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <p style="font-size:14px;color:#374151;margin:0;line-height:1.55;">${step}</p>
                  </td>
                </tr>
              </table>`).join('')}

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:36px;width:100%;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#1e3a5f;border-radius:12px;">
                          <a href="${siteUrl}" style="display:inline-block;padding:14px 40px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                            Go to Mayobe Bros &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                <tr>
                  <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;vertical-align:top;padding-right:12px;padding-top:2px;">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        </td>
                        <td>
                          <p style="font-size:13px;font-weight:600;color:#92400e;margin:0 0 3px;">Didn't request this?</p>
                          <p style="font-size:13px;color:#a16207;margin:0;line-height:1.55;">If you didn't request a password reset, you can safely ignore this email. Your account remains secure — no changes have been made.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e5e7eb;border-radius:0 0 16px 16px;padding:22px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="font-size:12px;color:#9ca3af;margin:0 0 6px;line-height:1.6;">
                      This email was sent to you because a password reset was requested for your Mayobe Bros account.
                    </p>
                    <p style="font-size:12px;color:#9ca3af;margin:0;">
                      <a href="${siteUrl}/privacy-policy" style="color:#9ca3af;text-decoration:underline;">Privacy Policy</a>
                      &nbsp;·&nbsp;
                      <a href="${siteUrl}" style="color:#9ca3af;text-decoration:underline;">mayobebros.com</a>
                    </p>
                    <p style="font-size:11px;color:#d1d5db;margin:10px 0 0;">© ${new Date().getFullYear()} Mayobe Bros. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendForgotPasswordEmail(to: string, name: string, secretCode: string, siteUrl: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`[RESEND] RESEND_API_KEY not set — forgot password email skipped for ${to}`);
    return;
  }
  const html = buildForgotPasswordEmail(name, secretCode, siteUrl);
  const { error } = await resend.emails.send({
    from: FROM_SUPPORT,
    to,
    subject: 'Reset your Mayobe Bros password',
    html,
  });
  if (error) {
    console.error('[RESEND] Forgot password email error:', error);
    throw new Error((error as { message?: string }).message || 'Resend error');
  }
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
  if (!resend) {
    console.warn(`[RESEND] RESEND_API_KEY not set — digest email skipped for ${to}`);
    return;
  }
  const html = buildDigestEmail(unsubscribeUrl, siteUrl, post, relatedPosts);
  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: `New Article: ${post.title}`,
    html,
  });
  if (error) {
    console.error(`[RESEND] Digest email error for ${to}:`, error);
    throw new Error((error as { message?: string }).message || 'Resend error');
  }
  console.log(`[RESEND] Digest email sent to ${to}`);
}

// ─── Shared email shell ───────────────────────────────────────────────────────

function emailShell(preheader: string, accentColor: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; padding: 0; background-color: #eef2f7; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; max-width: 100%; }
    a { text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-wrapper { width: 100% !important; }
      .email-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#eef2f7;">${preheader} &#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;min-height:100vh;">
    <tr>
      <td align="center" style="padding:36px 16px 48px;">
        <table role="presentation" class="email-wrapper" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- ── Masthead ── -->
          <tr>
            <td style="background:${BRAND.primaryColor};border-radius:14px 14px 0 0;padding:24px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="https://mayobebros.com" style="text-decoration:none;">
                      <div style="font-family:'Merriweather',Georgia,serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Mayobe Bros</div>
                      <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:4px;letter-spacing:1.8px;text-transform:uppercase;">${BRAND.tagline}</div>
                    </a>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <div style="width:4px;height:28px;background:${accentColor};border-radius:2px;display:inline-block;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${body}

          <!-- ── Footer ── -->
          <tr>
            <td style="background:#f1f5f9;border-top:1px solid #e2e8f0;border-radius:0 0 14px 14px;padding:22px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="font-size:12px;color:#94a3b8;margin:0 0 8px;line-height:1.6;">
                      <a href="https://mayobebros.com" style="color:#94a3b8;text-decoration:underline;">mayobebros.com</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://mayobebros.com/privacy-policy" style="color:#94a3b8;text-decoration:underline;">Privacy Policy</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://mayobebros.com/contact-us" style="color:#94a3b8;text-decoration:underline;">Contact</a>
                    </p>
                    <p style="font-size:11px;color:#cbd5e1;margin:0;">
                      &copy; ${new Date().getFullYear()} Mayobe Bros. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Contact: Admin Notification Email ───────────────────────────────────────

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
  type?: string;
  id?: string;
}

const CONTACT_TYPE_LABELS: Record<string, string> = {
  general: 'General Enquiry',
  support: 'Technical Support',
  technical: 'Technical Issue',
  advertising: 'Advertising',
  editorial: 'Editorial Feedback',
  partnership: 'Partnership',
  press: 'Press & Media',
  other: 'Other',
};

const CONTACT_TYPE_COLORS: Record<string, string> = {
  general: '#2563eb',
  support: '#7c3aed',
  technical: '#dc2626',
  advertising: '#059669',
  editorial: '#d97706',
  partnership: '#0891b2',
  press: '#9333ea',
  other: '#475569',
};

export function buildContactAdminEmail(contact: ContactSubmission, siteUrl: string): string {
  const typeLabel = CONTACT_TYPE_LABELS[contact.type || 'general'] || contact.type || 'General';
  const typeColor = CONTACT_TYPE_COLORS[contact.type || 'general'] || BRAND.accentColor;
  const isUrgent = contact.type === 'technical' || contact.type === 'support';
  const receivedAt = new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

  const body = `
          <!-- ── Alert strip ── -->
          ${isUrgent ? `
          <tr>
            <td style="background:#dc2626;padding:9px 36px;">
              <p style="font-size:11px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1.4px;margin:0;">
                Urgent · ${typeLabel} requires prompt attention
              </p>
            </td>
          </tr>` : `
          <tr>
            <td style="background:${typeColor};padding:9px 36px;">
              <p style="font-size:11px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1.4px;margin:0;">
                New contact submission &nbsp;&middot;&nbsp; ${typeLabel}
              </p>
            </td>
          </tr>`}

          <!-- ── Body ── -->
          <tr>
            <td style="background:#ffffff;padding:40px 36px 36px;" class="email-padding">

              <h1 style="font-family:'Merriweather',Georgia,serif;font-size:22px;font-weight:700;color:${BRAND.textDark};margin:0 0 6px;letter-spacing:-0.3px;line-height:1.3;">
                New message from ${contact.name}
              </h1>
              <p style="font-size:13px;color:${BRAND.textMuted};margin:0 0 28px;">${receivedAt}</p>

              <!-- Sender info card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#f8fafc;border:1px solid ${BRAND.borderColor};border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid ${BRAND.borderColor};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:50%;">
                          <p style="font-size:10px;font-weight:700;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">From</p>
                          <p style="font-size:14px;font-weight:600;color:${BRAND.textDark};margin:0;">${contact.name}</p>
                          <a href="mailto:${contact.email}" style="font-size:13px;color:${BRAND.accentColor};">${contact.email}</a>
                        </td>
                        <td style="width:50%;vertical-align:top;padding-left:16px;border-left:1px solid ${BRAND.borderColor};">
                          <p style="font-size:10px;font-weight:700;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Type</p>
                          <span style="display:inline-block;background:${typeColor}18;color:${typeColor};font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;border:1px solid ${typeColor}30;text-transform:uppercase;letter-spacing:0.5px;">${typeLabel}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="font-size:10px;font-weight:700;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Subject</p>
                    <p style="font-size:15px;font-weight:600;color:${BRAND.textDark};margin:0;">${contact.subject || '(No subject)'}</p>
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <p style="font-size:10px;font-weight:700;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Message</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f8fafc;border-left:3px solid ${typeColor};border-radius:0 10px 10px 0;padding:18px 20px;">
                    <p style="font-size:15px;color:${BRAND.textBody};line-height:1.8;margin:0;white-space:pre-wrap;">${contact.message}</p>
                  </td>
                </tr>
              </table>

              <!-- Reply CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background:${BRAND.primaryColor};border-radius:10px;">
                    <a href="mailto:${contact.email}?subject=Re: ${encodeURIComponent(contact.subject || 'Your message to Mayobe Bros')}" style="display:inline-block;padding:13px 32px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                      Reply to ${contact.name} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:12px;color:${BRAND.textMuted};margin:0;">
                Or copy their address: <a href="mailto:${contact.email}" style="color:${BRAND.accentColor};font-weight:500;">${contact.email}</a>
              </p>

            </td>
          </tr>

          <!-- ── Info strip ── -->
          <tr>
            <td style="background:${BRAND.primaryLight};padding:16px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="font-size:11px;color:rgba(255,255,255,0.6);margin:0;">
                      Submitted via mayobebros.com/contact-us${contact.id ? ` &middot; ID: ${contact.id}` : ''}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

  return emailShell(
    `New ${typeLabel} from ${contact.name}: "${contact.subject}"`,
    typeColor,
    body
  );
}

// ─── Contact: User Confirmation Email ────────────────────────────────────────

export function buildContactUserEmail(contact: ContactSubmission, siteUrl: string): string {
  const firstName = contact.name.split(' ')[0] || contact.name;
  const typeLabel = CONTACT_TYPE_LABELS[contact.type || 'general'] || 'General';
  const responseTime = (contact.type === 'technical' || contact.type === 'support') ? '24 hours' : '2–3 business days';

  const body = `
          <!-- ── Green strip ── -->
          <tr>
            <td style="background:${BRAND.successColor};padding:9px 36px;">
              <p style="font-size:11px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1.4px;margin:0;">
                Message received &nbsp;&middot;&nbsp; We'll be in touch
              </p>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="background:#ffffff;padding:44px 36px 40px;" class="email-padding">

              <!-- Check icon -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td>
                    <div style="width:52px;height:52px;background:#dcfce7;border-radius:50%;text-align:center;line-height:52px;">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-top:14px;"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </td>
                </tr>
              </table>

              <h1 style="font-family:'Merriweather',Georgia,serif;font-size:24px;font-weight:700;color:${BRAND.textDark};margin:0 0 12px;letter-spacing:-0.3px;line-height:1.3;">
                Thank you, ${firstName}!
              </h1>
              <p style="font-size:15px;color:${BRAND.textBody};line-height:1.75;margin:0 0 32px;">
                We've received your message and our team will get back to you within <strong style="color:${BRAND.textDark};">${responseTime}</strong>. In the meantime, feel free to browse our latest content.
              </p>

              <!-- Summary card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;background:#f8fafc;border:1px solid ${BRAND.borderColor};border-radius:12px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <p style="font-size:10px;font-weight:700;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;">Your submission summary</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:90px;padding-bottom:10px;vertical-align:top;">
                          <p style="font-size:12px;color:${BRAND.textMuted};font-weight:600;margin:0;">Subject</p>
                        </td>
                        <td style="padding-bottom:10px;vertical-align:top;">
                          <p style="font-size:13px;color:${BRAND.textDark};font-weight:600;margin:0;">${contact.subject || '(No subject)'}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="width:90px;padding-bottom:10px;vertical-align:top;">
                          <p style="font-size:12px;color:${BRAND.textMuted};font-weight:600;margin:0;">Type</p>
                        </td>
                        <td style="padding-bottom:10px;vertical-align:top;">
                          <p style="font-size:13px;color:${BRAND.textDark};font-weight:600;margin:0;">${typeLabel}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="width:90px;vertical-align:top;">
                          <p style="font-size:12px;color:${BRAND.textMuted};font-weight:600;margin:0;">Message</p>
                        </td>
                        <td style="vertical-align:top;">
                          <p style="font-size:13px;color:${BRAND.textBody};margin:0;line-height:1.6;">${contact.message.substring(0, 200)}${contact.message.length > 200 ? '...' : ''}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- What happens next -->
              <p style="font-size:10px;font-weight:700;color:${BRAND.primaryLight};text-transform:uppercase;letter-spacing:1.2px;margin:0 0 16px;">What happens next</p>

              ${[
                { n: '1', t: 'We review your message', d: `Our team reads every submission and prioritises ${contact.type === 'technical' || contact.type === 'support' ? 'technical issues' : 'enquiries'} carefully.` },
                { n: '2', t: `Response within ${responseTime}`, d: `We'll reply directly to <strong style="color:${BRAND.textDark};">${contact.email}</strong> — check your inbox and spam folder.` },
                { n: '3', t: 'Resolution & follow-up', d: 'For complex issues we may follow up with more questions to provide the best help.' },
              ].map(s => `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                <tr>
                  <td style="width:34px;vertical-align:top;padding-top:1px;">
                    <div style="width:26px;height:26px;background:${BRAND.primaryColor};border-radius:50%;text-align:center;line-height:26px;font-size:11px;font-weight:700;color:#ffffff;">${s.n}</div>
                  </td>
                  <td style="padding-left:12px;vertical-align:top;">
                    <p style="font-size:14px;font-weight:600;color:${BRAND.textDark};margin:0 0 2px;">${s.t}</p>
                    <p style="font-size:13px;color:${BRAND.textMuted};margin:0;line-height:1.55;">${s.d}</p>
                  </td>
                </tr>
              </table>`).join('')}

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:${BRAND.primaryColor};border-radius:10px;">
                          <a href="${siteUrl}" style="display:inline-block;padding:13px 36px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                            Browse Latest Articles &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Info strip ── -->
          <tr>
            <td style="background:${BRAND.primaryLight};padding:18px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:50%;vertical-align:top;">
                    <p style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Email us</p>
                    <a href="mailto:info@mayobebros.com" style="font-size:12px;color:rgba(255,255,255,0.75);text-decoration:none;">info@mayobebros.com</a>
                  </td>
                  <td style="width:50%;vertical-align:top;border-left:1px solid rgba(255,255,255,0.12);padding-left:16px;">
                    <p style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Website</p>
                    <a href="${siteUrl}" style="font-size:12px;color:rgba(255,255,255,0.75);text-decoration:none;">mayobebros.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

  return emailShell(
    `Hi ${firstName}, we received your message and will get back to you within ${responseTime}.`,
    BRAND.successColor,
    body
  );
}

// ─── Contact: Send functions ──────────────────────────────────────────────────

function getAdminEmailForType(type?: string): string {
  if (type === 'technical' || type === 'support') return 'support@mayobebros.com';
  return process.env.ADMIN_CONTACT_EMAIL || 'info@mayobebros.com';
}

export async function sendContactAdminEmail(contact: ContactSubmission, siteUrl: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[RESEND] RESEND_API_KEY not set — contact admin email skipped');
    return;
  }
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
  if (error) {
    console.error('[RESEND] Contact admin email error:', error);
    throw new Error((error as { message?: string }).message || 'Resend error');
  }
  console.log(`[RESEND] Contact admin notification sent for ${contact.email}`);
}

export async function sendContactUserEmail(contact: ContactSubmission, siteUrl: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[RESEND] RESEND_API_KEY not set — contact confirmation email skipped');
    return;
  }
  const html = buildContactUserEmail(contact, siteUrl);
  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: contact.email,
    subject: `We received your message — Mayobe Bros`,
    html,
  });
  if (error) {
    console.error('[RESEND] Contact user email error:', error);
    throw new Error((error as { message?: string }).message || 'Resend error');
  }
  console.log(`[RESEND] Contact confirmation sent to ${contact.email}`);
}
