<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>XML Sitemap — Mayobe Bros</title>
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
            padding: 0;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 12px rgba(29,78,216,0.25);
          }
          .header-inner {
            max-width: 1140px;
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
            font-size: 1.2rem;
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
            margin-top: 0.1rem;
          }
          .header-meta {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .badge {
            background: rgba(255,255,255,0.18);
            color: #fff;
            font-size: 0.65rem;
            font-weight: 700;
            padding: 0.25rem 0.65rem;
            border-radius: 999px;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            border: 1px solid rgba(255,255,255,0.25);
          }
          .entry-count {
            color: rgba(255,255,255,0.85);
            font-size: 0.8rem;
            font-weight: 600;
          }

          /* ── Main ── */
          main {
            max-width: 1140px;
            margin: 1.75rem auto;
            padding: 0 1.5rem 3rem;
          }

          /* ── Stats row ── */
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1.5rem;
          }
          .stat-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1rem 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
          }
          .stat-card .num {
            font-size: 1.85rem;
            font-weight: 800;
            color: #1d4ed8;
            line-height: 1;
          }
          .stat-card .lbl {
            font-size: 0.7rem;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-weight: 600;
          }

          /* ── Section title ── */
          .section-header {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            margin-bottom: 0.75rem;
          }
          .section-header .dot {
            width: 10px; height: 10px;
            border-radius: 50%;
            background: #1d4ed8;
            flex-shrink: 0;
          }
          .section-title {
            font-size: 0.78rem;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.07em;
          }

          /* ── Table ── */
          .table-wrap {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            overflow: hidden;
            margin-bottom: 2rem;
            box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          thead {
            background: linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 100%);
          }
          th {
            padding: 0.7rem 1rem;
            text-align: left;
            font-size: 0.68rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: rgba(255,255,255,0.85);
            font-weight: 700;
            white-space: nowrap;
          }
          th:first-child { padding-left: 1.25rem; }
          th:last-child  { padding-right: 1.25rem; }
          td {
            padding: 0.65rem 1rem;
            font-size: 0.85rem;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
          }
          td:first-child { padding-left: 1.25rem; }
          td:last-child  { padding-right: 1.25rem; }
          tr:last-child td { border-bottom: none; }
          tbody tr:hover td { background: #f8fafc; }

          /* ── Links ── */
          a { color: #1d4ed8; text-decoration: none; }
          a:hover { text-decoration: underline; color: #1e3a8a; }

          /* ── Misc cell styles ── */
          .num-cell {
            color: #cbd5e1;
            font-size: 0.75rem;
            font-weight: 600;
            width: 42px;
          }
          .lastmod {
            color: #94a3b8;
            font-size: 0.78rem;
            white-space: nowrap;
            width: 160px;
          }
          .priority-high { color: #16a34a; font-weight: 700; }
          .priority-med  { color: #d97706; font-weight: 600; }
          .priority-low  { color: #94a3b8; }
          .freq { color: #64748b; font-size: 0.78rem; }

          /* ── Sitemap index: type badge ── */
          .sitemap-type {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 0.65rem;
            font-weight: 700;
            padding: 0.15rem 0.5rem;
            border-radius: 999px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-left: 0.5rem;
            vertical-align: middle;
            border: 1px solid #bfdbfe;
          }
          .sitemap-url {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            flex-wrap: wrap;
          }

          /* ── Thumbnail ── */
          .thumb-cell { width: 72px; }
          .thumb {
            width: 62px;
            height: 42px;
            object-fit: cover;
            border-radius: 6px;
            background: #e2e8f0;
            display: block;
            border: 1px solid #e2e8f0;
          }
          .thumb-placeholder {
            width: 62px;
            height: 42px;
            border-radius: 6px;
            background: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #cbd5e1;
            font-size: 1.25rem;
            border: 1px dashed #e2e8f0;
          }

          /* ── URL cell ── */
          .url-cell { max-width: 480px; }
          .url-title {
            font-weight: 600;
            color: #1e293b;
            font-size: 0.82rem;
            margin-bottom: 0.2rem;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .url-loc {
            font-size: 0.75rem;
            color: #64748b;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 440px;
          }

          /* ── News tag ── */
          .news-tag {
            display: inline-block;
            background: #fef3c7;
            color: #92400e;
            font-size: 0.63rem;
            font-weight: 700;
            padding: 0.1rem 0.45rem;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-left: 0.4rem;
            vertical-align: middle;
          }

          /* ── Footer ── */
          footer {
            text-align: center;
            padding: 1.5rem;
            color: #94a3b8;
            font-size: 0.72rem;
          }
          footer a { color: #94a3b8; }
          footer a:hover { color: #1d4ed8; }

          /* ── Responsive ── */
          @media (max-width: 640px) {
            .header-inner { padding: 0.75rem 1rem; }
            main { padding: 0 1rem 2rem; margin-top: 1rem; }
            .logo { font-size: 0.95rem; }
            td, th { padding: 0.55rem 0.75rem; }
            td:first-child, th:first-child { padding-left: 0.75rem; }
            .url-cell { max-width: 220px; }
            .url-loc { max-width: 200px; }
            .thumb-cell, .thumb, .thumb-placeholder { width: 50px; }
            .thumb, .thumb-placeholder { width: 44px; height: 30px; }
            .lastmod { width: auto; }
          }
        </style>
      </head>
      <body>
        <header>
          <div class="header-inner">
            <div class="logo-icon">🗺️</div>
            <div class="header-text">
              <div class="logo">Mayobe Bros — XML Sitemap</div>
              <div class="subtitle">mayobebros.com · Search Engine Index</div>
            </div>
            <div class="header-meta">
              <span class="entry-count">
                <xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap) + count(sitemap:urlset/sitemap:url)"/> entries
              </span>
              <span class="badge">XML</span>
            </div>
          </div>
        </header>

        <main>
          <xsl:apply-templates select="sitemap:sitemapindex"/>
          <xsl:apply-templates select="sitemap:urlset"/>
        </main>

        <footer>
          Generated by Mayobe Bros SEO Engine ·
          <a href="https://www.mayobebros.com">mayobebros.com</a>
        </footer>
      </body>
    </html>
  </xsl:template>

  <!-- ════════════════════════════════════════════════════════════════
       SITEMAP INDEX
       ════════════════════════════════════════════════════════════════ -->
  <xsl:template match="sitemap:sitemapindex">
    <!-- Stats -->
    <div class="stats">
      <div class="stat-card">
        <div class="num"><xsl:value-of select="count(sitemap:sitemap)"/></div>
        <div class="lbl">Sitemap Files</div>
      </div>
    </div>

    <!-- Table -->
    <div class="section-header">
      <div class="dot"/>
      <div class="section-title">Sitemap Index</div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Sitemap</th>
            <th>Last Modified</th>
          </tr>
        </thead>
        <tbody>
          <xsl:for-each select="sitemap:sitemap">
            <tr>
              <td class="num-cell"><xsl:value-of select="position()"/></td>
              <td>
                <div class="sitemap-url">
                  <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                  <xsl:choose>
                    <xsl:when test="contains(sitemap:loc, 'posts-sitemap')">
                      <span class="sitemap-type">Posts</span>
                    </xsl:when>
                    <xsl:when test="contains(sitemap:loc, 'category-sitemap')">
                      <span class="sitemap-type">Categories</span>
                    </xsl:when>
                    <xsl:when test="contains(sitemap:loc, 'image-sitemap')">
                      <span class="sitemap-type">Images</span>
                    </xsl:when>
                    <xsl:when test="contains(sitemap:loc, 'video-sitemap')">
                      <span class="sitemap-type">Videos</span>
                    </xsl:when>
                    <xsl:when test="contains(sitemap:loc, 'news-sitemap')">
                      <span class="sitemap-type">News</span>
                    </xsl:when>
                    <xsl:when test="contains(sitemap:loc, 'authoritative')">
                      <span class="sitemap-type">Pages</span>
                    </xsl:when>
                  </xsl:choose>
                </div>
              </td>
              <td class="lastmod"><xsl:value-of select="sitemap:lastmod"/></td>
            </tr>
          </xsl:for-each>
        </tbody>
      </table>
    </div>
  </xsl:template>

  <!-- ════════════════════════════════════════════════════════════════
       URL SET  (posts, categories, authoritative, images, videos)
       ════════════════════════════════════════════════════════════════ -->
  <xsl:template match="sitemap:urlset">
    <!-- Detect sitemap type by checking first entry for images/videos/news -->
    <xsl:variable name="hasImages" select="count(sitemap:url/image:image) > 0"/>
    <xsl:variable name="hasVideos" select="count(sitemap:url/video:video) > 0"/>
    <xsl:variable name="hasNews"   select="count(sitemap:url/news:news) > 0"/>

    <!-- Stats -->
    <div class="stats">
      <div class="stat-card">
        <div class="num"><xsl:value-of select="count(sitemap:url)"/></div>
        <div class="lbl">URLs</div>
      </div>
      <xsl:if test="$hasImages">
        <div class="stat-card">
          <div class="num"><xsl:value-of select="count(sitemap:url/image:image)"/></div>
          <div class="lbl">Images</div>
        </div>
      </xsl:if>
      <xsl:if test="$hasVideos">
        <div class="stat-card">
          <div class="num"><xsl:value-of select="count(sitemap:url/video:video)"/></div>
          <div class="lbl">Videos</div>
        </div>
      </xsl:if>
    </div>

    <!-- Table -->
    <div class="section-header">
      <div class="dot"/>
      <div class="section-title">
        <xsl:choose>
          <xsl:when test="$hasImages">Image Sitemap</xsl:when>
          <xsl:when test="$hasVideos">Video Sitemap</xsl:when>
          <xsl:when test="$hasNews">News Sitemap</xsl:when>
          <xsl:otherwise>URL List</xsl:otherwise>
        </xsl:choose>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <xsl:if test="$hasImages or $hasVideos">
              <th>Thumbnail</th>
            </xsl:if>
            <th>URL</th>
            <th>Last Modified</th>
            <xsl:if test="not($hasImages) and not($hasVideos) and not($hasNews)">
              <th>Change Freq</th>
              <th>Priority</th>
            </xsl:if>
          </tr>
        </thead>
        <tbody>
          <xsl:for-each select="sitemap:url">
            <tr>
              <td class="num-cell"><xsl:value-of select="position()"/></td>

              <!-- Thumbnail column (images/videos) -->
              <xsl:if test="$hasImages or $hasVideos">
                <td class="thumb-cell">
                  <xsl:choose>
                    <xsl:when test="image:image/image:loc">
                      <img class="thumb" src="{image:image/image:loc}" alt="" loading="lazy"
                           onerror="this.style.display='none';this.nextSibling.style.display='flex'"/>
                      <div class="thumb-placeholder" style="display:none">🖼</div>
                    </xsl:when>
                    <xsl:when test="video:video/video:thumbnail_loc">
                      <img class="thumb" src="{video:video/video:thumbnail_loc}" alt="" loading="lazy"
                           onerror="this.style.display='none';this.nextSibling.style.display='flex'"/>
                      <div class="thumb-placeholder" style="display:none">▶</div>
                    </xsl:when>
                    <xsl:otherwise>
                      <div class="thumb-placeholder">📄</div>
                    </xsl:otherwise>
                  </xsl:choose>
                </td>
              </xsl:if>

              <!-- URL + title -->
              <td class="url-cell">
                <xsl:choose>
                  <!-- Posts with image: show image title + URL -->
                  <xsl:when test="image:image/image:title">
                    <div class="url-title"><xsl:value-of select="image:image/image:title"/></div>
                    <div class="url-loc">
                      <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                    </div>
                  </xsl:when>
                  <!-- Videos: show video title -->
                  <xsl:when test="video:video/video:title">
                    <div class="url-title">
                      <xsl:value-of select="video:video/video:title"/>
                      <span class="news-tag">Video</span>
                    </div>
                    <div class="url-loc">
                      <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                    </div>
                  </xsl:when>
                  <!-- News: show news title -->
                  <xsl:when test="news:news/news:title">
                    <div class="url-title">
                      <xsl:value-of select="news:news/news:title"/>
                      <span class="news-tag">News</span>
                    </div>
                    <div class="url-loc">
                      <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                    </div>
                  </xsl:when>
                  <!-- Plain URL -->
                  <xsl:otherwise>
                    <a href="{sitemap:loc}">
                      <div class="url-loc" style="color:#1d4ed8"><xsl:value-of select="sitemap:loc"/></div>
                    </a>
                  </xsl:otherwise>
                </xsl:choose>
              </td>

              <!-- Last Modified -->
              <td class="lastmod"><xsl:value-of select="sitemap:lastmod"/></td>

              <!-- Change freq + priority (plain sitemaps only) -->
              <xsl:if test="not($hasImages) and not($hasVideos) and not($hasNews)">
                <td class="freq"><xsl:value-of select="sitemap:changefreq"/></td>
                <td>
                  <xsl:choose>
                    <xsl:when test="sitemap:priority >= 0.8">
                      <span class="priority-high"><xsl:value-of select="sitemap:priority"/></span>
                    </xsl:when>
                    <xsl:when test="sitemap:priority >= 0.5">
                      <span class="priority-med"><xsl:value-of select="sitemap:priority"/></span>
                    </xsl:when>
                    <xsl:otherwise>
                      <span class="priority-low"><xsl:value-of select="sitemap:priority"/></span>
                    </xsl:otherwise>
                  </xsl:choose>
                </td>
              </xsl:if>
            </tr>
          </xsl:for-each>
        </tbody>
      </table>
    </div>
  </xsl:template>

</xsl:stylesheet>
