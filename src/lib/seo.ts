const SITE_NAME = 'Mayobe Bros';
const SITE_URL = 'https://mayobebros.com';
const DEFAULT_IMAGE = 'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?auto=compress&cs=tinysrgb&w=1200';
const DEFAULT_DESCRIPTION = 'Your trusted source for quality content across education, business, technology, gaming, history, and career opportunities. Explore articles, guides, and insights that inspire and inform.';

export interface SEOMeta {
  title: string;
  description: string;
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string;
  articleSection?: string;
}

function setOrCreate(selector: string, attr: string, value: string) {
  let el = document.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
  if (!el) {
    if (selector.startsWith('link')) {
      el = document.createElement('link');
    } else {
      el = document.createElement('meta');
    }
    const parts = selector.match(/\[([^\]]+)="([^\]]+)"\]/);
    if (parts) {
      el.setAttribute(parts[1], parts[2]);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function removeIfExists(selector: string) {
  const el = document.querySelector(selector);
  if (el) el.remove();
}

export function applyMeta(meta: SEOMeta) {
  document.title = meta.title;

  setOrCreate('meta[name="description"]', 'content', meta.description);
  setOrCreate('link[rel="canonical"]', 'href', meta.canonical);

  if (meta.keywords) {
    setOrCreate('meta[name="keywords"]', 'content', meta.keywords);
  }

  if (meta.author) {
    setOrCreate('meta[name="author"]', 'content', meta.author);
  }

  setOrCreate('meta[property="og:title"]', 'content', meta.ogTitle || meta.title);
  setOrCreate('meta[property="og:description"]', 'content', meta.ogDescription || meta.description);
  setOrCreate('meta[property="og:url"]', 'content', meta.canonical);
  setOrCreate('meta[property="og:type"]', 'content', meta.ogType || 'website');
  setOrCreate('meta[property="og:site_name"]', 'content', SITE_NAME);
  setOrCreate('meta[property="og:locale"]', 'content', 'en_US');

  const image = meta.ogImage || DEFAULT_IMAGE;
  setOrCreate('meta[property="og:image"]', 'content', image);
  setOrCreate('meta[property="og:image:width"]', 'content', '1200');
  setOrCreate('meta[property="og:image:height"]', 'content', '630');
  setOrCreate('meta[property="og:image:alt"]', 'content', meta.ogTitle || meta.title);

  if (meta.ogType === 'article') {
    if (meta.publishedTime) {
      setOrCreate('meta[property="article:published_time"]', 'content', meta.publishedTime);
    }
    if (meta.modifiedTime) {
      setOrCreate('meta[property="article:modified_time"]', 'content', meta.modifiedTime);
    }
    if (meta.author) {
      setOrCreate('meta[property="article:author"]', 'content', meta.author);
    }
    if (meta.articleSection) {
      setOrCreate('meta[property="article:section"]', 'content', meta.articleSection);
    }
  } else {
    removeIfExists('meta[property="article:published_time"]');
    removeIfExists('meta[property="article:modified_time"]');
    removeIfExists('meta[property="article:author"]');
    removeIfExists('meta[property="article:section"]');
  }

  setOrCreate('meta[name="twitter:card"]', 'content', meta.twitterCard || 'summary_large_image');
  setOrCreate('meta[name="twitter:site"]', 'content', '@mayobebros');
  setOrCreate('meta[name="twitter:title"]', 'content', meta.twitterTitle || meta.title);
  setOrCreate('meta[name="twitter:description"]', 'content', meta.twitterDescription || meta.description);
  setOrCreate('meta[name="twitter:image"]', 'content', meta.twitterImage || image);
  setOrCreate('meta[name="twitter:image:alt"]', 'content', meta.ogTitle || meta.title);

  if (meta.noIndex) {
    setOrCreate('meta[name="robots"]', 'content', 'noindex, nofollow');
  } else {
    setOrCreate('meta[name="robots"]', 'content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  }

  setOrCreate('meta[name="googlebot"]', 'content', meta.noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
}

export function buildPostMeta(post: any, path: string): SEOMeta {
  const effectiveTitle = post.metaTitle || post.title;
  const title = effectiveTitle.length <= 60
    ? `${effectiveTitle} | ${SITE_NAME}`
    : effectiveTitle;
  const rawDescription = post.metaDescription || post.excerpt || '';
  const description = rawDescription
    ? rawDescription.slice(0, 160)
    : stripHtml(post.content || '').slice(0, 160);
  const canonical = `${SITE_URL}${path}`;
  const image = post.featuredImage || post.featured_image || DEFAULT_IMAGE;

  return {
    title,
    description,
    canonical,
    ogType: 'article',
    ogImage: image,
    twitterCard: 'summary_large_image',
    publishedTime: post.publishedAt || post.published_at,
    modifiedTime: post.updatedAt || post.updated_at || post.publishedAt || post.published_at,
    author: post.author || SITE_NAME,
    keywords: post.metaKeywords || undefined,
    articleSection: post.categoryName || post.category?.name || undefined,
  };
}

export function buildCategoryMeta(category: any, path: string): SEOMeta {
  const title = category.metaTitle || `${category.name} Articles | ${SITE_NAME}`;
  const description = category.metaDescription
    ? category.metaDescription.slice(0, 160)
    : category.description
      ? category.description.slice(0, 160)
      : `Browse the latest ${category.name} articles, guides and insights on ${SITE_NAME}. Expert knowledge and in-depth coverage.`;

  return {
    title,
    description,
    canonical: `${SITE_URL}${path}`,
    ogType: 'website',
    ogImage: category.featuredImage || DEFAULT_IMAGE,
    twitterImage: category.featuredImage || DEFAULT_IMAGE,
    twitterCard: 'summary_large_image',
  };
}

export function buildHomeMeta(): SEOMeta {
  return {
    title: `${SITE_NAME} — Knowledge, Insights & Ideas That Inspire`,
    description: DEFAULT_DESCRIPTION,
    canonical: SITE_URL,
    ogType: 'website',
    ogImage: DEFAULT_IMAGE,
    twitterCard: 'summary_large_image',
  };
}

export function buildStaticMeta(title: string, description: string, path: string): SEOMeta {
  return {
    title: `${title} | ${SITE_NAME}`,
    description: description.slice(0, 160),
    canonical: `${SITE_URL}${path}`,
    ogType: 'website',
    ogImage: DEFAULT_IMAGE,
    twitterCard: 'summary',
  };
}

export function buildArticleJsonLd(post: any, path: string): object {
  const image = post.featuredImage || post.featured_image || DEFAULT_IMAGE;
  const url = `${SITE_URL}${path}`;
  const publishedDate = post.publishedAt || post.published_at || new Date().toISOString();
  const modifiedDate = post.updatedAt || post.updated_at || publishedDate;
  const wordCount = stripHtml(post.content || '').split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: post.title.slice(0, 110),
    description: post.metaDescription || post.excerpt || stripHtml(post.content || '').slice(0, 160),
    image: {
      '@type': 'ImageObject',
      url: image,
      width: 1200,
      height: 630,
    },
    datePublished: publishedDate,
    dateModified: modifiedDate,
    wordCount,
    timeRequired: `PT${readingTime}M`,
    author: {
      '@type': 'Person',
      name: post.author || SITE_NAME,
      url: `${SITE_URL}/author/${(post.author || '').toLowerCase().replace(/\s+/g, '-')}`,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/mayobebroslogo.png`,
        width: 240,
        height: 60,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
    keywords: post.metaKeywords || undefined,
    articleSection: post.categoryName || post.category?.name || undefined,
    inLanguage: 'en-US',
    isAccessibleForFree: !post.isPremium,
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.filter(i => i.name).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildWebsiteJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildOrganizationJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE_URL}#logo`,
      url: `${SITE_URL}/mayobebroslogo.png`,
      contentUrl: `${SITE_URL}/mayobebroslogo.png`,
      width: 240,
      height: 60,
      caption: SITE_NAME,
    },
    image: {
      '@id': `${SITE_URL}#logo`,
    },
    sameAs: [],
    foundingDate: '2024',
    knowsAbout: [
      'Education',
      'Business',
      'Technology',
      'Gaming',
      'World History',
      'Career Opportunities',
    ],
  };
}

export function buildItemListJsonLd(posts: any[], listName: string, listUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    url: listUrl,
    numberOfItems: posts.length,
    itemListElement: posts.slice(0, 10).map((post: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/post/${post.categorySlug || ''}/${post.slug}`,
      name: post.title,
    })),
  };
}

export function injectJsonLd(id: string, data: object) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.setAttribute('type', 'application/ld+json');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data, null, 0);
}

export function removeJsonLd(id: string) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export { SITE_NAME, SITE_URL, DEFAULT_IMAGE, DEFAULT_DESCRIPTION };
