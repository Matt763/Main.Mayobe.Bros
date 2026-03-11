import { Resend } from 'resend';

const BRAND = {
  name: 'Mayobe Bros',
  tagline: 'Knowledge · Insights · Stories',
  primaryColor: '#1e3a5f',
  accentColor: '#2563eb',
  lightAccent: '#dbeafe',
  textDark: '#111827',
  textMuted: '#6b7280',
  borderColor: '#e5e7eb',
};

const FROM_PRIMARY = 'Mayobe Bros <info@mayobebros.com>';
const FROM_FALLBACK = 'Mayobe Bros <onboarding@resend.dev>';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || FROM_PRIMARY;
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
    : `<div style="width:100%;height:180px;background:linear-gradient(135deg,${BRAND.primaryColor} 0%,${BRAND.accentColor} 100%);text-align:center;padding-top:52px;">
        <div style="font-size:40px;line-height:1;">📖</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.75);font-weight:600;margin-top:10px;letter-spacing:0.5px;">MAYOBE BROS</div>
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
                    <div style="width:70px;height:70px;background:#fff7ed;border-radius:50%;text-align:center;line-height:70px;display:inline-block;font-size:34px;">👋</div>
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
}
