<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
  exclude-result-prefixes="atom media content sy">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="/rss/channel/title"/> — RSS Feed</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: #f1f5f9;
            color: #1e293b;
            min-height: 100vh;
            font-size: 14px;
          }

          /* ── Header ── */
          header {
            background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%);
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 12px rgba(29,78,216,0.25);
          }
          .header-inner {
            max-width: 900px;
            margin: 0 auto;
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .logo-icon {
            width: 38px; height: 38px;
            background: rgba(255,255,255,0.15);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.3rem;
            flex-shrink: 0;
          }
          .header-text { flex: 1; }
          .logo {
            font-size: 1.1rem;
            font-weight: 800;
            color: #fff;
            letter-spacing: -0.3px;
            line-height: 1.2;
          }
          .subtitle {
            color: rgba(255,255,255,0.7);
            font-size: 0.75rem;
            margin-top: 0.15rem;
          }
          .header-actions {
            display: flex;
            align-items: center;
            gap: 0.6rem;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            border-radius: 999px;
            font-size: 0.68rem;
            font-weight: 700;
            padding: 0.28rem 0.7rem;
            text-decoration: none;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }
          .btn-sitemap {
            background: rgba(255,255,255,0.15);
            color: #e0e7ff;
            border: 1px solid rgba(255,255,255,0.25);
          }
          .btn-sitemap:hover { background: rgba(255,255,255,0.25); }
          .badge-rss {
            background: rgba(251,146,60,0.22);
            color: #fed7aa;
            border: 1px solid rgba(251,146,60,0.4);
            border-radius: 999px;
            font-size: 0.65rem;
            font-weight: 700;
            padding: 0.25rem 0.65rem;
            letter-spacing: 0.07em;
            text-transform: uppercase;
          }

          /* ── Main ── */
          main {
            max-width: 900px;
            margin: 1.75rem auto;
            padding: 0 1.5rem 3rem;
          }

          /* ── Channel info card ── */
          .channel-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 1.25rem 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 1px 4px rgba(0,0,0,0.05);
            display: flex;
            align-items: flex-start;
            gap: 1rem;
          }
          .channel-logo {
            width: 56px; height: 56px;
            border-radius: 12px;
            object-fit: contain;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            flex-shrink: 0;
          }
          .channel-info { flex: 1; }
          .channel-title {
            font-size: 1rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 0.3rem;
          }
          .channel-desc {
            font-size: 0.82rem;
            color: #64748b;
            line-height: 1.5;
            margin-bottom: 0.6rem;
          }
          .channel-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            font-size: 0.72rem;
            color: #94a3b8;
          }
          .meta-tag {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 0.15rem 0.5rem;
          }
          .meta-tag span { color: #475569; font-weight: 600; }

          /* ── Section header ── */
          .section-header {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            margin-bottom: 0.75rem;
          }
          .dot {
            width: 10px; height: 10px;
            border-radius: 50%;
            background: #fb923c;
            flex-shrink: 0;
          }
          .section-title {
            font-size: 0.78rem;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.07em;
          }

          /* ── Articles ── */
          .articles { display: flex; flex-direction: column; gap: 0.75rem; }

          .article-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1rem 1.25rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
            display: flex;
            gap: 1rem;
            align-items: flex-start;
            transition: border-color 0.15s, box-shadow 0.15s;
          }
          .article-card:hover {
            border-color: #93c5fd;
            box-shadow: 0 2px 8px rgba(29,78,216,0.1);
          }
          .article-num {
            font-size: 0.7rem;
            font-weight: 700;
            color: #cbd5e1;
            min-width: 20px;
            padding-top: 0.1rem;
            text-align: right;
          }
          .article-body { flex: 1; min-width: 0; }
          .article-title {
            font-size: 0.95rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 0.35rem;
            line-height: 1.4;
            text-decoration: none;
            display: block;
          }
          .article-title:hover { color: #1d4ed8; }
          .article-desc {
            font-size: 0.8rem;
            color: #64748b;
            line-height: 1.55;
            margin-bottom: 0.5rem;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .article-meta {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.7rem;
            color: #94a3b8;
          }
          .article-author { font-weight: 600; color: #64748b; }
          .article-cat {
            background: #eff6ff;
            color: #1d4ed8;
            border-radius: 4px;
            padding: 0.1rem 0.4rem;
            font-weight: 600;
            font-size: 0.67rem;
          }
          .article-thumb {
            width: 72px; height: 50px;
            border-radius: 8px;
            object-fit: cover;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            flex-shrink: 0;
          }

          /* ── Footer ── */
          footer {
            text-align: center;
            padding: 1.5rem;
            font-size: 0.75rem;
            color: #94a3b8;
          }
          footer a { color: #64748b; text-decoration: none; }
          footer a:hover { color: #1d4ed8; }

          @media (max-width: 600px) {
            .header-inner { padding: 0.75rem 1rem; }
            main { padding: 0 1rem 2rem; }
            .channel-card { flex-direction: column; gap: 0.75rem; }
            .article-thumb { display: none; }
          }
        </style>
      </head>
      <body>
        <header>
          <div class="header-inner">
            <div class="logo-icon">📡</div>
            <div class="header-text">
              <div class="logo"><xsl:value-of select="/rss/channel/title"/> — RSS Feed</div>
              <div class="subtitle">mayobebros.com · Subscribe to stay updated</div>
            </div>
            <div class="header-actions">
              <a href="/sitemap.xml" class="btn btn-sitemap">🗺 Sitemap</a>
              <span class="badge-rss">RSS 2.0</span>
            </div>
          </div>
        </header>

        <main>
          <xsl:apply-templates select="/rss/channel"/>
        </main>

        <footer>
          <a href="https://www.mayobebros.com">mayobebros.com</a> ·
          <a href="/sitemap.xml">XML Sitemap</a> ·
          <a href="/feed.xml">RSS Feed</a>
        </footer>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="/rss/channel">
    <!-- Channel info -->
    <div class="channel-card">
      <img src="/mayobebroslogo.png" alt="Mayobe Bros" class="channel-logo"/>
      <div class="channel-info">
        <div class="channel-title"><xsl:value-of select="title"/></div>
        <div class="channel-desc"><xsl:value-of select="description"/></div>
        <div class="channel-meta">
          <span class="meta-tag">Language: <span><xsl:value-of select="language"/></span></span>
          <span class="meta-tag">Updated: <span><xsl:value-of select="lastBuildDate"/></span></span>
          <span class="meta-tag">Items: <span><xsl:value-of select="count(item)"/></span></span>
          <span class="meta-tag">Refresh: <span>every 60 min</span></span>
        </div>
      </div>
    </div>

    <!-- Articles -->
    <div class="section-header">
      <div class="dot"/>
      <div class="section-title">Latest Articles (<xsl:value-of select="count(item)"/>)</div>
    </div>

    <div class="articles">
      <xsl:for-each select="item">
        <div class="article-card">
          <div class="article-num"><xsl:value-of select="position()"/></div>
          <div class="article-body">
            <a href="{link}" class="article-title"><xsl:value-of select="title"/></a>
            <div class="article-desc"><xsl:value-of select="description"/></div>
            <div class="article-meta">
              <xsl:if test="author">
                <span class="article-author"><xsl:value-of select="author"/></span>
              </xsl:if>
              <xsl:if test="category">
                <span class="article-cat"><xsl:value-of select="category"/></span>
              </xsl:if>
              <span><xsl:value-of select="pubDate"/></span>
            </div>
          </div>
          <xsl:if test="media:content/@url">
            <img src="{media:content/@url}" alt="" class="article-thumb" loading="lazy"
                 onerror="this.style.display='none'"/>
          </xsl:if>
        </div>
      </xsl:for-each>
    </div>
  </xsl:template>

</xsl:stylesheet>
