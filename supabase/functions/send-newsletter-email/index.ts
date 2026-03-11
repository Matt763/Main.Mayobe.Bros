import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailPayload {
  type: "confirmation" | "digest" | "farewell";
  to: string;
  unsubscribeUrl: string;
  siteUrl?: string;
  resubscribeUrl?: string;
  reason?: string | null;
  post?: {
    title: string;
    excerpt: string;
    featuredImage?: string;
    url: string;
    category: string;
    author: string;
    readingTime?: number;
  };
  relatedPosts?: Array<{
    title: string;
    excerpt: string;
    featuredImage?: string;
    url: string;
    category: string;
  }>;
}

const BRAND = {
  name: "Mayobe Bros",
  tagline: "Knowledge · Insights · Stories",
  primaryColor: "#1e3a5f",
  accentColor: "#2563eb",
  lightAccent: "#dbeafe",
  textDark: "#111827",
  textMuted: "#6b7280",
  bgLight: "#f8fafc",
  borderColor: "#e5e7eb",
};

function buildConfirmationEmail(to: string, unsubscribeUrl: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Welcome to Mayobe Bros Newsletter</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
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
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f1f5f9;">
    Welcome to Mayobe Bros! You're now subscribed to our newsletter.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;min-height:100vh;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header Bar -->
          <tr>
            <td style="background:${BRAND.primaryColor};border-radius:16px 16px 0 0;padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 40px 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                            Mayobe Bros
                          </div>
                          <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:3px;letter-spacing:1.5px;text-transform:uppercase;">
                            ${BRAND.tagline}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Section -->
          <tr>
            <td style="background:#ffffff;padding:48px 40px 40px;">
              <!-- Welcome Icon -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <div style="width:72px;height:72px;background:${BRAND.lightAccent};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="${BRAND.accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="font-size:28px;font-weight:700;color:${BRAND.textDark};margin:0 0 12px;letter-spacing:-0.5px;line-height:1.2;">
                      You're subscribed!
                    </h1>
                    <p style="font-size:16px;color:${BRAND.textMuted};line-height:1.6;margin:0 0 32px;max-width:420px;">
                      Welcome to the Mayobe Bros newsletter. You'll receive our best articles, insights, and stories directly in your inbox.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid ${BRAND.borderColor};padding-top:32px;">
                    <!-- What to expect -->
                    <p style="font-size:13px;font-weight:600;color:${BRAND.primaryColor};text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">
                      What you'll receive
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${[
                        ["Latest Articles", "Hand-picked content on education, business, tech, history and more"],
                        ["Expert Insights", "Deep dives and analysis from our editorial team"],
                        ["Weekly Digest", "A curated roundup every week, straight to your inbox"],
                      ].map(([title, desc]) => `
                      <tr>
                        <td style="padding:10px 0;vertical-align:top;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:32px;vertical-align:top;padding-top:3px;">
                                <div style="width:20px;height:20px;background:${BRAND.lightAccent};border-radius:50%;text-align:center;line-height:20px;">
                                  <span style="font-size:11px;color:${BRAND.accentColor};font-weight:700;">✓</span>
                                </div>
                              </td>
                              <td style="vertical-align:top;">
                                <p style="font-size:14px;font-weight:600;color:${BRAND.textDark};margin:0 0 3px;">${title}</p>
                                <p style="font-size:13px;color:${BRAND.textMuted};margin:0;line-height:1.5;">${desc}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>`).join('')}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}" style="display:inline-block;background:${BRAND.primaryColor};color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.2px;">
                      Browse Latest Articles
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid ${BRAND.borderColor};border-radius:0 0 16px 16px;padding:28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="font-size:13px;color:#9ca3af;margin:0 0 8px;line-height:1.5;">
                      You received this email because you subscribed at <strong style="color:#6b7280;">mayobebros.com</strong>
                    </p>
                    <p style="font-size:12px;color:#9ca3af;margin:0;">
                      <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
                      &nbsp;·&nbsp;
                      <a href="${siteUrl}/privacy-policy" style="color:#9ca3af;text-decoration:underline;">Privacy Policy</a>
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

function buildDigestEmail(payload: EmailPayload): string {
  const { to, unsubscribeUrl, siteUrl = "https://mayobebros.com", post, relatedPosts = [] } = payload;

  const featuredImageHtml = post?.featuredImage
    ? `<img src="${post.featuredImage}" alt="${post.title}" style="width:100%;height:260px;object-fit:cover;display:block;" />`
    : `<div style="width:100%;height:160px;background:linear-gradient(135deg,${BRAND.primaryColor} 0%,${BRAND.accentColor} 100%);display:flex;align-items:center;justify-content:center;">
        <div style="text-align:center;padding:20px;">
          <div style="font-size:32px;margin-bottom:8px;">📖</div>
          <div style="font-size:14px;color:rgba(255,255,255,0.8);font-weight:500;">Mayobe Bros</div>
        </div>
       </div>`;

  const relatedPostsHtml = relatedPosts.length > 0 ? `
    <tr>
      <td style="padding:36px 40px 0;">
        <p style="font-size:13px;font-weight:600;color:${BRAND.primaryColor};text-transform:uppercase;letter-spacing:1px;margin:0 0 20px;">
          More articles you may enjoy
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${relatedPosts.slice(0, 3).map((rp, i) => `
          <tr>
            <td style="padding-bottom:${i < relatedPosts.length - 1 ? '16px' : '0'};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.borderColor};border-radius:12px;overflow:hidden;">
                <tr>
                  ${rp.featuredImage ? `
                  <td style="width:100px;vertical-align:top;">
                    <img src="${rp.featuredImage}" alt="${rp.title}" style="width:100px;height:80px;object-fit:cover;display:block;border-radius:12px 0 0 12px;" />
                  </td>` : `
                  <td style="width:8px;background:${BRAND.accentColor};border-radius:12px 0 0 12px;"></td>`}
                  <td style="padding:14px 16px;vertical-align:middle;">
                    <p style="font-size:10px;font-weight:600;color:${BRAND.accentColor};text-transform:uppercase;letter-spacing:0.8px;margin:0 0 5px;">${rp.category}</p>
                    <a href="${rp.url}" style="font-size:14px;font-weight:600;color:${BRAND.textDark};text-decoration:none;line-height:1.4;display:block;margin:0 0 6px;">
                      ${rp.title}
                    </a>
                    <p style="font-size:12px;color:${BRAND.textMuted};margin:0;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                      ${rp.excerpt}
                    </p>
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
  <title>${post?.title || 'New from Mayobe Bros'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; max-width: 100%; }
    a { text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f1f5f9;">
    ${post?.excerpt || 'New content from Mayobe Bros — read the latest article now.'}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;min-height:100vh;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Top brand strip -->
          <tr>
            <td style="background:${BRAND.primaryColor};border-radius:16px 16px 0 0;padding:20px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${siteUrl}" style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;text-decoration:none;">
                      Mayobe Bros
                    </a>
                    <span style="font-size:11px;color:rgba(255,255,255,0.5);margin-left:10px;letter-spacing:1.2px;text-transform:uppercase;vertical-align:middle;">
                      Newsletter
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.8px;">
                      ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Featured Article Card -->
          <tr>
            <td style="background:#ffffff;">
              <!-- Featured Image -->
              <div style="overflow:hidden;">
                ${featuredImageHtml}
              </div>

              <!-- Article Content -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 40px 32px;">
                    <!-- Category tag -->
                    ${post?.category ? `
                    <div style="margin-bottom:16px;">
                      <span style="display:inline-block;background:${BRAND.lightAccent};color:${BRAND.accentColor};font-size:11px;font-weight:600;padding:5px 12px;border-radius:100px;text-transform:uppercase;letter-spacing:0.8px;">
                        ${post.category}
                      </span>
                    </div>` : ''}

                    <!-- Headline -->
                    <h1 style="font-family:'Merriweather',Georgia,serif;font-size:26px;font-weight:700;color:${BRAND.textDark};line-height:1.35;margin:0 0 16px;letter-spacing:-0.3px;">
                      <a href="${post?.url || siteUrl}" style="color:${BRAND.textDark};text-decoration:none;">
                        ${post?.title || 'New Article from Mayobe Bros'}
                      </a>
                    </h1>

                    <!-- Meta row -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      <tr>
                        <td>
                          <div style="width:28px;height:28px;background:${BRAND.primaryColor};border-radius:50%;text-align:center;line-height:28px;font-size:12px;font-weight:700;color:#fff;display:inline-block;">
                            ${(post?.author || 'M')[0]}
                          </div>
                        </td>
                        <td style="padding-left:10px;vertical-align:middle;">
                          <span style="font-size:13px;font-weight:600;color:${BRAND.textDark};">${post?.author || 'Mayobe Bros'}</span>
                          ${post?.readingTime ? `<span style="font-size:12px;color:${BRAND.textMuted};margin-left:10px;">· ${post.readingTime} min read</span>` : ''}
                        </td>
                      </tr>
                    </table>

                    <!-- Decorative divider -->
                    <div style="width:48px;height:3px;background:${BRAND.accentColor};border-radius:2px;margin-bottom:20px;"></div>

                    <!-- Excerpt -->
                    <p style="font-size:16px;color:#374151;line-height:1.75;margin:0 0 32px;">
                      ${post?.excerpt || 'We have new content for you on Mayobe Bros. Click below to read the full article.'}
                    </p>

                    <!-- CTA -->
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:10px;background:${BRAND.primaryColor};">
                          <a href="${post?.url || siteUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                            Read Full Article
                            <span style="margin-left:6px;">→</span>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Related Posts -->
          ${relatedPosts.length > 0 ? `
          <tr>
            <td style="background:#ffffff;border-top:1px solid ${BRAND.borderColor};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${relatedPostsHtml}
                <tr><td style="padding:28px 40px 0;"></td></tr>
              </table>
            </td>
          </tr>` : ''}

          <!-- CTA band -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.primaryColor} 0%,${BRAND.accentColor} 100%);padding:32px 40px;text-align:center;">
              <p style="font-size:16px;font-weight:600;color:#ffffff;margin:0 0 6px;">
                Explore more on Mayobe Bros
              </p>
              <p style="font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 20px;">
                Knowledge · Insights · Stories
              </p>
              <a href="${siteUrl}" style="display:inline-block;background:#ffffff;color:${BRAND.primaryColor};font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">
                Visit Website
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid ${BRAND.borderColor};border-radius:0 0 16px 16px;padding:24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="font-size:12px;color:#9ca3af;margin:0 0 8px;line-height:1.6;">
                      You're receiving this because you subscribed to the Mayobe Bros newsletter.
                    </p>
                    <p style="font-size:12px;color:#9ca3af;margin:0;">
                      <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
                      &nbsp;&nbsp;·&nbsp;&nbsp;
                      <a href="${siteUrl}/privacy-policy" style="color:#9ca3af;text-decoration:underline;">Privacy Policy</a>
                      &nbsp;&nbsp;·&nbsp;&nbsp;
                      <a href="${siteUrl}" style="color:#9ca3af;text-decoration:underline;">View Online</a>
                    </p>
                    <p style="font-size:11px;color:#d1d5db;margin:12px 0 0;">
                      © ${new Date().getFullYear()} Mayobe Bros. All rights reserved.
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

const REASON_LABELS: Record<string, string> = {
  "too-frequent": "Emails arrived too frequently",
  "not-relevant": "Content wasn't relevant anymore",
  "prefer-website": "Prefers browsing the website directly",
  "inbox-overload": "Too many emails in inbox",
  "found-better": "Found another source to follow",
  "never-signed-up": "Didn't remember signing up",
};

function buildFarewellEmail(payload: EmailPayload): string {
  const { to, siteUrl = "https://mayobebros.com", resubscribeUrl, reason } = payload;
  const reasonLabel = reason ? (REASON_LABELS[reason] || reason) : null;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>You've been unsubscribed - Mayobe Bros</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; max-width: 100%; }
    a { text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f1f5f9;">
    You've been successfully unsubscribed from Mayobe Bros. We'll miss you!
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;min-height:100vh;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND.primaryColor};border-radius:16px 16px 0 0;padding:20px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${siteUrl}" style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;text-decoration:none;">
                      Mayobe Bros
                    </a>
                    <span style="font-size:11px;color:rgba(255,255,255,0.5);margin-left:10px;letter-spacing:1.2px;text-transform:uppercase;vertical-align:middle;">
                      Newsletter
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:48px 40px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="width:72px;height:72px;background:#fff7ed;border-radius:50%;display:inline-table;text-align:center;vertical-align:middle;">
                      <div style="font-size:36px;line-height:72px;">👋</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="font-size:26px;font-weight:700;color:${BRAND.textDark};margin:0 0 12px;letter-spacing:-0.4px;line-height:1.2;">
                      Until next time
                    </h1>
                    <p style="font-size:15px;color:${BRAND.textMuted};line-height:1.65;margin:0 0 28px;max-width:420px;">
                      You've been successfully unsubscribed from the Mayobe Bros newsletter. We're sorry to see you go.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Reason acknowledged -->
              ${reasonLabel ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid ${BRAND.borderColor};border-radius:12px;padding:18px 20px;">
                    <p style="font-size:11px;font-weight:600;color:${BRAND.primaryColor};text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">
                      Your reason
                    </p>
                    <p style="font-size:14px;color:${BRAND.textDark};margin:0;font-weight:500;">
                      ${reasonLabel}
                    </p>
                    <p style="font-size:13px;color:${BRAND.textMuted};margin:8px 0 0;line-height:1.5;">
                      Thank you for letting us know. We take all feedback seriously and will use it to improve our newsletter.
                    </p>
                  </td>
                </tr>
              </table>` : ""}

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid ${BRAND.borderColor};padding-top:28px;margin-bottom:24px;">
                    <p style="font-size:13px;font-weight:600;color:${BRAND.primaryColor};text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">
                      You can still find us
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${[
                        ["Browse Articles", "Our full library of content is always available at mayobebros.com", siteUrl],
                        ["Explore Categories", "Dive into Education, Business, History, Tech and more", `${siteUrl}/categories`],
                      ].map(([title, desc, url]) => `
                      <tr>
                        <td style="padding:8px 0;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:32px;vertical-align:top;padding-top:2px;">
                                <div style="width:18px;height:18px;background:${BRAND.lightAccent};border-radius:50%;text-align:center;line-height:18px;">
                                  <span style="font-size:10px;color:${BRAND.accentColor};font-weight:700;">→</span>
                                </div>
                              </td>
                              <td>
                                <a href="${url}" style="font-size:14px;font-weight:600;color:${BRAND.textDark};display:block;margin-bottom:2px;">${title}</a>
                                <p style="font-size:12px;color:${BRAND.textMuted};margin:0;line-height:1.4;">${desc}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>`).join("")}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Re-subscribe CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid ${BRAND.borderColor};border-radius:12px;padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <p style="font-size:14px;font-weight:600;color:${BRAND.textDark};margin:0 0 3px;">Changed your mind?</p>
                          <p style="font-size:13px;color:${BRAND.textMuted};margin:0;">You can re-subscribe at any time.</p>
                        </td>
                        <td align="right" style="vertical-align:middle;white-space:nowrap;padding-left:16px;">
                          <a href="${resubscribeUrl || siteUrl}" style="display:inline-block;background:${BRAND.primaryColor};color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">
                            Re-subscribe
                          </a>
                        </td>
                      </tr>
                    </table>
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
                    <p style="font-size:12px;color:#9ca3af;margin:0 0 6px;line-height:1.6;">
                      This is the last email you'll receive from Mayobe Bros Newsletter.
                    </p>
                    <p style="font-size:12px;color:#9ca3af;margin:0;">
                      <a href="${siteUrl}" style="color:#9ca3af;text-decoration:underline;">mayobebros.com</a>
                      &nbsp;·&nbsp;
                      <a href="${siteUrl}/privacy-policy" style="color:#9ca3af;text-decoration:underline;">Privacy Policy</a>
                    </p>
                    <p style="font-size:11px;color:#d1d5db;margin:10px 0 0;">
                      © ${new Date().getFullYear()} Mayobe Bros. All rights reserved.
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

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPass = Deno.env.get("SMTP_PASS");
  const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
  const fromEmail = Deno.env.get("FROM_EMAIL") || smtpUser || "newsletter@mayobebros.com";
  const fromName = Deno.env.get("FROM_NAME") || "Mayobe Bros";

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(`[EMAIL PREVIEW] To: ${to} | Subject: ${subject}`);
    console.log("SMTP not configured — email was not sent. Set SMTP_HOST, SMTP_USER, SMTP_PASS secrets.");
    return;
  }

  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  const rawEmail = [
    `From: ${fromName} <${fromEmail}>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    `${subject} - View this email in your browser.`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    btoa(unescape(encodeURIComponent(html))),
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  const encoder = new TextEncoder();
  const conn = await Deno.connectTls({ hostname: smtpHost, port: smtpPort === 465 ? 465 : 587 });
  const reader = conn.readable.getReader();
  const writer = conn.writable.getWriter();

  const readLine = async (): Promise<string> => {
    let line = "";
    while (true) {
      const { value } = await reader.read();
      if (!value) break;
      line += new TextDecoder().decode(value);
      if (line.endsWith("\r\n")) break;
    }
    return line.trim();
  };

  const write = async (s: string) => writer.write(encoder.encode(s + "\r\n"));

  await readLine();
  await write(`EHLO mayobebros.com`);
  for (let i = 0; i < 6; i++) await readLine();
  await write(`AUTH LOGIN`);
  await readLine();
  await write(btoa(smtpUser));
  await readLine();
  await write(btoa(smtpPass));
  await readLine();
  await write(`MAIL FROM:<${fromEmail}>`);
  await readLine();
  await write(`RCPT TO:<${to}>`);
  await readLine();
  await write(`DATA`);
  await readLine();
  await write(rawEmail + "\r\n.");
  await readLine();
  await write(`QUIT`);
  conn.close();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();
    const { type, to, unsubscribeUrl, siteUrl = "https://mayobebros.com" } = payload;

    if (!to || !unsubscribeUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, unsubscribeUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let subject: string;
    let html: string;

    if (type === "confirmation") {
      subject = `Welcome to Mayobe Bros Newsletter`;
      html = buildConfirmationEmail(to, unsubscribeUrl, siteUrl);
    } else if (type === "farewell") {
      subject = `You've been unsubscribed from Mayobe Bros`;
      html = buildFarewellEmail(payload);
    } else {
      subject = payload.post?.title
        ? `New Article: ${payload.post.title}`
        : `New from Mayobe Bros`;
      html = buildDigestEmail(payload);
    }

    await sendEmail(to, subject, html);

    return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Email function error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
