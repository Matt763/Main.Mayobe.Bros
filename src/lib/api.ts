import { supabase } from './supabase';

const API_BASE_URL = '/api';

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 120_000;
const pendingRequests = new Map<string, Promise<any>>();

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCached(key: string, data: any) {
  cache.set(key, { data, ts: Date.now() });
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

async function fetchAPI(endpoint: string, options: RequestInit = {}, retries = 1): Promise<any> {
  const isGet = !options.method || options.method === 'GET';

  if (isGet) {
    const cached = getCached(endpoint);
    if (cached !== null) return cached;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    const data = await response.json();

    if (isGet) setCached(endpoint, data);

    return data;
  } catch (err: any) {
    if (retries > 0 && err.name !== 'AbortError' && !err.message?.startsWith('Request failed:')) {
      await new Promise(r => setTimeout(r, 500));
      return fetchAPI(endpoint, options, retries - 1);
    }
    throw err;
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function resolveCategoryId(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  if (value.includes('-') && value.length > 20) return value;
  const { data } = await supabase.from('categories').select('id').eq('slug', value).maybeSingle();
  return data?.id ?? value;
}

async function resolveLabelId(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  if (value.includes('-') && value.length > 20) return value;
  const { data } = await supabase.from('labels').select('id').eq('slug', value).maybeSingle();
  return data?.id ?? null;
}

function normalizePost(row: any): any {
  const cats = row.categories as Record<string, string> | null;
  const lbls = row.labels as Record<string, string> | null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content || '',
    excerpt: row.excerpt,
    categoryId: row.category_id,
    categorySlug: cats?.slug || '',
    categoryName: cats?.name || '',
    labelId: row.label_id,
    labelSlug: lbls?.slug || '',
    labelName: lbls?.name || '',
    featuredImage: row.featured_image,
    author: row.author,
    status: row.status || (row.published ? 'published' : 'draft'),
    isPopular: row.is_popular,
    featured: row.featured,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    metaKeywords: row.meta_keywords,
    readingTime: row.reading_time,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    views: row.views,
  };
}

function normalizeCategory(c: any): any {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    displayOrder: c.display_order,
    showInFooter: c.show_in_footer,
    createdAt: c.created_at,
    featuredImage: c.featured_image || null,
    metaTitle: c.meta_title || null,
    metaDescription: c.meta_description || null,
    metaKeywords: c.meta_keywords || null,
  };
}

function normalizeLabel(l: any): any {
  return {
    id: l.id,
    categoryId: l.category_id,
    categorySlug: (l.categories as Record<string, string>)?.slug || '',
    categoryName: (l.categories as Record<string, string>)?.name || '',
    name: l.name,
    slug: l.slug,
    description: l.description,
    displayOrder: l.display_order,
    heroImage: l.hero_image || null,
    createdAt: l.created_at,
  };
}

function normalizePage(p: any): any {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    status: p.status !== undefined ? p.status : (p.published ? 'published' : 'draft'),
    published: p.published !== undefined ? p.published : (p.status === 'published'),
    showInMenu: p.show_in_menu !== undefined ? p.show_in_menu : p.showInMenu,
    isIndexed: p.is_indexed !== undefined ? p.is_indexed : p.isIndexed,
    metaTitle: p.meta_title !== undefined ? p.meta_title : p.metaTitle,
    metaDescription: p.meta_description !== undefined ? p.meta_description : p.metaDescription,
    featuredImage: p.featured_image !== undefined ? p.featured_image : (p.featuredImage || null),
    createdAt: p.created_at || p.createdAt,
    updatedAt: p.updated_at || p.updatedAt,
  };
}

export interface Result {
  id: string;
  title: string;
  slug: string;
  year: number;
  exam_type: string;
  source_url: string | null;
  content: string | null;
  structured_data: any | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  status: string;
  bridge_post_id: string | null;
  created_at: string;
  updated_at: string;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    logout: () =>
      fetchAPI('/auth/logout', { method: 'POST' }),

    getSession: () =>
      fetchAPI('/auth/session'),
  },

  posts: {
    list: async (params?: { category?: string; label?: string; status?: string; search?: string; limit?: number }) => {
      const cacheKey = `posts:${JSON.stringify(params || {})}`;
      const cached = getCached(cacheKey);
      if (cached !== null) return cached;

      const requestedStatus = params?.status;

      let query = supabase
        .from('posts')
        .select('id, title, slug, excerpt, category_id, label_id, featured_image, author, status, is_popular, featured, meta_title, meta_description, meta_keywords, reading_time, published_at, created_at, updated_at, views, categories(name, slug), labels(name, slug)')
        .order('published_at', { ascending: false });

      if (requestedStatus === 'all') {
        // no filter
      } else if (requestedStatus) {
        query = query.eq('status', requestedStatus);
      } else {
        query = query.eq('status', 'published');
      }

      if (params?.category) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', params.category)
          .maybeSingle();
        if (cat) query = query.eq('category_id', cat.id);
        else { setCached(cacheKey, []); return []; }
      }

      if (params?.label) {
        const { data: lbl } = await supabase
          .from('labels')
          .select('id')
          .eq('slug', params.label)
          .maybeSingle();
        if (lbl) query = query.eq('label_id', lbl.id);
        else { setCached(cacheKey, []); return []; }
      }

      if (params?.search) {
        const s = params.search.replace(/[%_]/g, '\\$&');
        query = query.or(`title.ilike.%${s}%,excerpt.ilike.%${s}%`);
      }

      if (params?.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      const result = (data || []).map(normalizePost);
      setCached(cacheKey, result);
      return result;
    },

    listWithContent: async (params?: { status?: string }) => {
      const cacheKey = `posts-with-content:${JSON.stringify(params || {})}`;
      const cached = getCached(cacheKey);
      if (cached !== null) return cached;

      const requestedStatus = params?.status;

      let query = supabase
        .from('posts')
        .select('id, title, slug, content, excerpt, category_id, label_id, featured_image, author, status, is_popular, featured, meta_title, meta_description, meta_keywords, reading_time, published_at, created_at, updated_at, views, categories(name, slug), labels(name, slug)')
        .order('published_at', { ascending: false });

      if (requestedStatus === 'all') {
        // no filter
      } else if (requestedStatus) {
        query = query.eq('status', requestedStatus);
      } else {
        query = query.eq('status', 'published');
      }

      const { data, error } = await query;
      if (error) throw error;
      const result = (data || []).map(normalizePost);
      setCached(cacheKey, result);
      return result;
    },

    get: async (slug: string) => {
      const cacheKey = `post:${slug}`;
      const cached = getCached(cacheKey);
      if (cached !== null) return cached;

      const { data, error } = await supabase
        .from('posts')
        .select('*, categories(name, slug), labels(name, slug)')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Post not found');
      const result = normalizePost(data);
      setCached(cacheKey, result);
      return result;
    },

    getById: async (id: string) => {
      const cacheKey = `post-id:${id}`;
      const cached = getCached(cacheKey);
      if (cached !== null) return cached;

      const { data, error } = await supabase
        .from('posts')
        .select('*, categories(name, slug), labels(name, slug)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Post not found');
      const result = normalizePost(data);
      setCached(cacheKey, result);
      return result;
    },

    create: async (body: any) => {
      invalidateCache('posts:');
      const slug = body.slug || slugify(body.title || '');
      const categoryId = await resolveCategoryId(body.categoryId || body.category_id);
      const rawLabelId = body.labelId || body.label_id || (Array.isArray(body.labelIds) ? body.labelIds[0] : undefined);
      const labelId = await resolveLabelId(rawLabelId);

      const insert: Record<string, unknown> = {
        title: body.title,
        slug,
        content: body.content || '',
        excerpt: body.excerpt || null,
        category_id: categoryId,
        label_id: labelId || null,
        featured_image: body.featuredImage || body.featured_image || null,
        author: body.author || 'Mayobe Bros',
        status: body.status || 'draft',
        published: body.status === 'published',
        is_popular: body.isPopular || body.is_popular || false,
        featured: body.featured || body.isFeatured || false,
        is_featured: body.isFeatured || body.is_featured || false,
        meta_title: body.metaTitle || body.meta_title || null,
        meta_description: body.metaDescription || body.meta_description || null,
        meta_keywords: body.metaKeywords || body.meta_keywords || null,
        reading_time: body.readingTime || body.reading_time || 5,
        published_at: body.status === 'published' ? (body.publishedAt || body.published_at || new Date().toISOString()) : null,
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(insert)
        .select('*, categories(name, slug), labels(name, slug)')
        .single();

      if (error) throw new Error(error.message);
      return normalizePost(data);
    },

    update: async (slug: string, body: any) => {
      invalidateCache('posts:');
      invalidateCache(`post:${slug}`);
      invalidateCache(`post-id:`);

      const { data: existing, error: findErr } = await supabase
        .from('posts')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (findErr) throw new Error(findErr.message);
      if (!existing) throw new Error('Post not found');

      const categoryId = await resolveCategoryId(body.categoryId || body.category_id);
      const rawLabelId = body.labelId || body.label_id || (Array.isArray(body.labelIds) ? body.labelIds[0] : undefined);
      const labelId = await resolveLabelId(rawLabelId);

      const update: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (body.title !== undefined) update.title = body.title;
      if (body.slug !== undefined) update.slug = body.slug;
      if (body.content !== undefined) update.content = body.content;
      if (body.excerpt !== undefined) update.excerpt = body.excerpt;
      if (categoryId) update.category_id = categoryId;
      if (labelId !== undefined) update.label_id = labelId || null;
      if (body.featuredImage !== undefined || body.featured_image !== undefined)
        update.featured_image = body.featuredImage || body.featured_image || null;
      if (body.author !== undefined) update.author = body.author;
      if (body.status !== undefined) {
        update.status = body.status;
        update.published = body.status === 'published';
        if (body.status === 'published') {
          update.published_at = body.publishedAt || body.published_at || new Date().toISOString();
        }
      }
      if (body.isPopular !== undefined || body.is_popular !== undefined)
        update.is_popular = body.isPopular ?? body.is_popular;
      if (body.featured !== undefined) update.featured = body.featured;
      if (body.isFeatured !== undefined) update.is_featured = body.isFeatured;
      if (body.metaTitle !== undefined || body.meta_title !== undefined)
        update.meta_title = body.metaTitle ?? body.meta_title ?? null;
      if (body.metaDescription !== undefined || body.meta_description !== undefined)
        update.meta_description = body.metaDescription ?? body.meta_description ?? null;
      if (body.metaKeywords !== undefined || body.meta_keywords !== undefined)
        update.meta_keywords = body.metaKeywords ?? body.meta_keywords ?? null;
      if (body.readingTime !== undefined || body.reading_time !== undefined)
        update.reading_time = body.readingTime ?? body.reading_time;

      const { data, error } = await supabase
        .from('posts')
        .update(update)
        .eq('id', existing.id)
        .select('*, categories(name, slug), labels(name, slug)')
        .single();

      if (error) throw new Error(error.message);
      return normalizePost(data);
    },

    delete: async (slug: string) => {
      invalidateCache('posts:');
      invalidateCache(`post:${slug}`);
      const { error } = await supabase.from('posts').delete().eq('slug', slug);
      if (error) throw new Error(error.message);
      return { message: 'Post deleted successfully' };
    },

    trackView: async (slug: string) => {
      const { data: existing } = await supabase
        .from('posts')
        .select('id, views')
        .eq('slug', slug)
        .maybeSingle();

      if (!existing) return;

      await supabase
        .from('posts')
        .update({ views: (existing.views || 0) + 1 })
        .eq('id', existing.id);
    },
  },

  pages: {
    list: async (params?: { status?: string }) => {
      const cacheKey = `pages:${JSON.stringify(params || {})}`;
      const cached = getCached(cacheKey);
      if (cached !== null) return cached;

      let query = supabase
        .from('static_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (params?.status && params.status !== 'all') {
        query = query.eq('published', params.status === 'published');
      }

      const { data, error } = await query;
      if (error) throw error;
      const result = (data || []).map(normalizePage);
      setCached(cacheKey, result);
      return result;
    },

    get: async (slug: string) => {
      const cacheKey = `page:${slug}`;
      const cached = getCached(cacheKey);
      if (cached !== null) return cached;

      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Page not found');
      const result = normalizePage(data);
      setCached(cacheKey, result);
      return result;
    },

    getById: async (id: string) => {
      const cacheKey = `page-id:${id}`;
      const cached = getCached(cacheKey);
      if (cached !== null) return cached;

      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Page not found');
      const result = normalizePage(data);
      setCached(cacheKey, result);
      return result;
    },

    create: async (body: any) => {
      invalidateCache('pages:');
      const slug = body.slug || slugify(body.title || '');

      const { data, error } = await supabase
        .from('static_pages')
        .insert({
          title: body.title,
          slug,
          content: body.content || '',
          published: body.status === 'published',
          show_in_menu: body.showInMenu || body.show_in_menu || false,
          is_indexed: body.isIndexed !== undefined ? body.isIndexed : (body.is_indexed !== undefined ? body.is_indexed : true),
          meta_title: body.metaTitle || body.meta_title || null,
          meta_description: body.metaDescription || body.meta_description || null,
          featured_image: body.featuredImage || body.featured_image || null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return normalizePage(data);
    },

    update: async (id: string, body: any) => {
      invalidateCache('pages:');
      invalidateCache(`page:${body.slug || ''}`);
      invalidateCache(`page-id:${id}`);

      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.title !== undefined) update.title = body.title;
      if (body.slug !== undefined) update.slug = body.slug;
      if (body.content !== undefined) update.content = body.content;
      if (body.status !== undefined) update.published = body.status === 'published';
      if (body.showInMenu !== undefined || body.show_in_menu !== undefined)
        update.show_in_menu = body.showInMenu ?? body.show_in_menu;
      if (body.isIndexed !== undefined || body.is_indexed !== undefined)
        update.is_indexed = body.isIndexed ?? body.is_indexed;
      if (body.metaTitle !== undefined || body.meta_title !== undefined)
        update.meta_title = body.metaTitle ?? body.meta_title ?? null;
      if (body.metaDescription !== undefined || body.meta_description !== undefined)
        update.meta_description = body.metaDescription ?? body.meta_description ?? null;
      if (body.featuredImage !== undefined || body.featured_image !== undefined)
        update.featured_image = body.featuredImage ?? body.featured_image ?? null;

      const { data, error } = await supabase
        .from('static_pages')
        .update(update)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return normalizePage(data);
    },

    delete: async (id: string) => {
      invalidateCache('pages:');
      invalidateCache(`page-id:${id}`);
      const { error } = await supabase.from('static_pages').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { message: 'Page deleted successfully' };
    },
  },

  categories: {
    list: async () => {
      const cacheKey = 'categories:all';
      const cached = getCached(cacheKey);
      if (cached !== null) return cached;

      const pending = pendingRequests.get(cacheKey);
      if (pending) return pending;

      const promise = supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })
        .then(({ data, error }) => {
          pendingRequests.delete(cacheKey);
          if (error) throw error;
          const result = (data || []).map(normalizeCategory);
          setCached(cacheKey, result);
          return result;
        });

      pendingRequests.set(cacheKey, promise);
      return promise;
    },

    create: async (body: any) => {
      invalidateCache('categories:');
      const slug = body.slug || slugify(body.name || '');

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: body.name,
          slug,
          description: body.description || null,
          display_order: body.displayOrder || body.display_order || 0,
          show_in_footer: body.showInFooter || body.show_in_footer || false,
          featured_image: body.featured_image || body.featuredImage || null,
          meta_title: body.meta_title || body.metaTitle || null,
          meta_description: body.meta_description || body.metaDescription || null,
          meta_keywords: body.meta_keywords || body.metaKeywords || null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return normalizeCategory(data);
    },

    update: async (id: string, body: any) => {
      invalidateCache('categories:');
      const update: Record<string, unknown> = {};
      if (body.name !== undefined) update.name = body.name;
      if (body.slug !== undefined) update.slug = body.slug;
      if (body.description !== undefined) update.description = body.description;
      if (body.displayOrder !== undefined || body.display_order !== undefined)
        update.display_order = body.displayOrder ?? body.display_order;
      if (body.showInFooter !== undefined || body.show_in_footer !== undefined)
        update.show_in_footer = body.showInFooter ?? body.show_in_footer;
      if ('featured_image' in body || 'featuredImage' in body)
        update.featured_image = body.featured_image ?? body.featuredImage ?? null;
      if ('meta_title' in body || 'metaTitle' in body)
        update.meta_title = body.meta_title ?? body.metaTitle ?? null;
      if ('meta_description' in body || 'metaDescription' in body)
        update.meta_description = body.meta_description ?? body.metaDescription ?? null;
      if ('meta_keywords' in body || 'metaKeywords' in body)
        update.meta_keywords = body.meta_keywords ?? body.metaKeywords ?? null;

      const { data, error } = await supabase
        .from('categories')
        .update(update)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return normalizeCategory(data);
    },

    delete: async (id: string) => {
      invalidateCache('categories:');
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { message: 'Category deleted successfully' };
    },
  },

  labels: {
    list: async () => {
      const cacheKey = 'labels:all';
      const cached = getCached(cacheKey);
      if (cached !== null) return cached;

      const pending = pendingRequests.get(cacheKey);
      if (pending) return pending;

      const promise = supabase
        .from('labels')
        .select('*, categories(name, slug)')
        .order('display_order', { ascending: true })
        .then(({ data, error }) => {
          pendingRequests.delete(cacheKey);
          if (error) throw error;
          const result = (data || []).map(normalizeLabel);
          setCached(cacheKey, result);
          return result;
        });

      pendingRequests.set(cacheKey, promise);
      return promise;
    },

    create: async (body: any) => {
      invalidateCache('labels:');
      const slug = body.slug || slugify(body.name || '');

      const { data, error } = await supabase
        .from('labels')
        .insert({
          name: body.name,
          slug,
          description: body.description || null,
          category_id: body.categoryId || body.category_id,
          display_order: body.displayOrder || body.display_order || 0,
          hero_image: body.hero_image || body.heroImage || null,
        })
        .select('*, categories(name, slug)')
        .single();

      if (error) throw new Error(error.message);
      return normalizeLabel(data);
    },

    update: async (id: string, body: any) => {
      invalidateCache('labels:');
      const update: Record<string, unknown> = {};
      if (body.name !== undefined) update.name = body.name;
      if (body.slug !== undefined) update.slug = body.slug;
      if (body.description !== undefined) update.description = body.description;
      if (body.categoryId !== undefined || body.category_id !== undefined)
        update.category_id = body.categoryId ?? body.category_id;
      if (body.displayOrder !== undefined || body.display_order !== undefined)
        update.display_order = body.displayOrder ?? body.display_order;
      if ('hero_image' in body || 'heroImage' in body)
        update.hero_image = body.hero_image ?? body.heroImage ?? null;

      const { data, error } = await supabase
        .from('labels')
        .update(update)
        .eq('id', id)
        .select('*, categories(name, slug)')
        .single();

      if (error) throw new Error(error.message);
      return normalizeLabel(data);
    },

    delete: async (id: string) => {
      invalidateCache('labels:');
      const { error } = await supabase.from('labels').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { message: 'Label deleted successfully' };
    },
  },

  images: {
    list: () => fetchAPI('/images'),

    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/images/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },

    delete: (filename: string) =>
      fetchAPI(`/images/${filename}`, { method: 'DELETE' }),
  },

  settings: {
    get: async () => {
      const cacheKey = 'settings:all';
      const cached = getCached(cacheKey);
      if (cached !== null) return cached;

      const pending = pendingRequests.get(cacheKey);
      if (pending) return pending;

      const promise = (async () => {
        const { data } = await supabase
          .from('site_settings')
          .select('*')
          .eq('key', 'site_config')
          .maybeSingle();

        if (data?.value) {
          try {
            const parsed = JSON.parse(data.value);
            const mapped: Record<string, any> = { ...parsed };

            mapped['site_title'] = parsed.siteName || parsed.site_title || '';
            mapped['site_description'] = parsed.siteDescription || parsed.site_description || '';
            mapped['logo_url'] = parsed.siteLogo || parsed.logo_url || '';
            mapped['favicon_url'] = parsed.siteFavicon || parsed.favicon_url || '';
            mapped['footer_copyright'] = parsed.footerCopyright || parsed.footer_copyright || '';

            if (parsed.socialMedia) {
              mapped['facebook_url'] = parsed.socialMedia.facebook || '';
              mapped['twitter_url'] = parsed.socialMedia.twitter || '';
              mapped['instagram_url'] = parsed.socialMedia.instagram || '';
              mapped['linkedin_url'] = parsed.socialMedia.linkedin || '';
            }
            if (parsed.seo) {
              mapped['google_analytics_id'] = parsed.seo.googleAnalyticsId || '';
            }

            setCached(cacheKey, mapped);
            return mapped;
          } catch {
            // fall through
          }
        }

        const { data: allRows } = await supabase.from('site_settings').select('*');
        const settings: Record<string, string> = {};
        for (const row of allRows || []) {
          settings[row.key] = row.value;
        }
        setCached(cacheKey, settings);
        return settings;
      })();

      pendingRequests.set(cacheKey, promise);
      promise.finally(() => pendingRequests.delete(cacheKey));
      return promise;
    },

    update: async (body: any) => {
      invalidateCache('settings:');

      const { error } = await supabase
        .from('site_settings')
        .upsert(
          { key: 'site_config', value: JSON.stringify(body), updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (error) throw new Error(error.message);
      return body;
    },
  },

  comments: {
    list: async (params?: { postId?: string; status?: string }) => {
      const cacheKey = `comments:${JSON.stringify(params || {})}`;
      const cached = getCached(cacheKey);
      if (cached !== null) return cached;

      let query = supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (params?.postId) query = query.eq('post_id', params.postId);
      if (params?.status) query = query.eq('status', params.status);

      const { data, error } = await query;
      if (error) throw error;
      const result = data || [];
      setCached(cacheKey, result);
      return result;
    },

    create: async (body: any) => {
      invalidateCache('comments:');
      const authorRole = body.authorRole || null;
      const isPrivileged = authorRole && ['ceo', 'admin', 'publisher', 'staff'].includes(authorRole);
      const content = (body.content || '').trim().slice(0, 5000);
      if (!content || content.length < 2) throw new Error('Comment content is too short.');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: body.postId || body.post_id,
          user_name: (body.author || body.user_name || '').trim().slice(0, 100),
          user_email: (body.email || body.user_email || '').slice(0, 200),
          content,
          status: isPrivileged ? 'approved' : 'pending',
          author_role: authorRole,
          parent_id: body.parentId || body.parent_id || null,
          user_token: body.userToken || body.user_token || null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    update: async (id: string, body: any) => {
      invalidateCache('comments:');
      const update: Record<string, unknown> = {};
      if (body.status !== undefined) update.status = body.status;
      if (body.content !== undefined) update.content = body.content;
      if (body.user_name !== undefined) update.user_name = body.user_name;

      const { data, error } = await supabase
        .from('comments')
        .update(update)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    delete: async (id: string) => {
      invalidateCache('comments:');
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { message: 'Comment deleted successfully' };
    },
  },

  contact: {
    submit: (data: any) =>
      fetchAPI('/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  reviews: {
    list: async (params?: { status?: string; limit?: number }) => {
      const cacheKey = `reviews:${JSON.stringify(params || {})}`;
      const cached = getCached(cacheKey);
      if (cached !== null) return cached;

      let query = supabase
        .from('reviews')
        .select('id, user_name, role, comment, rating, user_avatar, status, is_verified, created_at')
        .order('created_at', { ascending: false });

      if (params?.status) query = query.eq('status', params.status);
      if (params?.limit) query = query.limit(params.limit);

      const { data, error } = await query;
      if (error) throw error;
      const result = data || [];
      setCached(cacheKey, result);
      return result;
    },

    create: async (body: any) => {
      invalidateCache('reviews:');
      const content = (body.content || body.comment || '').trim().slice(0, 2000);
      if (!content || content.length < 5) throw new Error('Review content is too short.');

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_name: (body.author || body.user_name || '').trim().slice(0, 100),
          role: '',
          comment: content,
          rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
          user_avatar: null,
          status: 'pending',
          is_verified: false,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    update: async (id: string, body: any) => {
      invalidateCache('reviews:');
      const update: Record<string, unknown> = {};
      if (body.status !== undefined) update.status = body.status;
      if (body.comment !== undefined) update.comment = body.comment;
      if (body.rating !== undefined) update.rating = body.rating;
      if (body.user_name !== undefined) update.user_name = body.user_name;

      const { data, error } = await supabase
        .from('reviews')
        .update(update)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    delete: async (id: string) => {
      invalidateCache('reviews:');
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { message: 'Review deleted successfully' };
    },
  },

  newsletter: {
    subscribe: async (email: string, source?: string) => {
      // Route through server endpoint so unsubscribe_token is generated and welcome email is sent
      const res = await fetchAPI('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), source: source || 'website' }),
      });
      return res;
    },

    list: () => fetchAPI('/newsletter'),

    add: (data: { email: string }) =>
      fetchAPI('/newsletter', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      fetchAPI(`/newsletter/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchAPI(`/newsletter/${id}`, { method: 'DELETE' }),

    exportUrl: () => `${API_BASE_URL}/newsletter/export`,
  },

  results: {
    list: async (params?: { status?: string; year?: number; exam_type?: string }): Promise<Result[]> => {
      const cacheKey = `results:${JSON.stringify(params || {})}`;
      const cached = getCached(cacheKey);
      if (cached !== null) return cached as Result[];

      let query = supabase
        .from('results')
        .select('id, title, slug, year, exam_type, status, source_url, meta_title, meta_description, created_at, updated_at')
        .order('year', { ascending: false })
        .order('created_at', { ascending: false });

      const s = params?.status;
      if (s === 'all') { /* no filter */ }
      else if (s) query = query.eq('status', s);
      else query = query.eq('status', 'published');

      if (params?.year)       query = query.eq('year', params.year);
      if (params?.exam_type)  query = query.eq('exam_type', params.exam_type.toLowerCase());

      const { data, error } = await query;
      if (error) throw error;
      const result = (data || []) as Result[];
      setCached(cacheKey, result);
      return result;
    },

    get: async (slug: string): Promise<Result | null> => {
      const cacheKey = `result:${slug}`;
      const cached = getCached(cacheKey);
      if (cached !== null) return cached as Result;

      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      setCached(cacheKey, data);
      return data as Result | null;
    },

    getById: async (id: string): Promise<Result | null> => {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Result | null;
    },

    create: async (body: Partial<Result>): Promise<Result> => {
      invalidateCache('results:');
      const { data, error } = await supabase
        .from('results')
        .insert({
          title:            body.title,
          slug:             body.slug,
          year:             body.year,
          exam_type:        body.exam_type?.toLowerCase(),
          source_url:       body.source_url || null,
          content:          body.content || '',
          structured_data:  body.structured_data || null,
          meta_title:       body.meta_title || null,
          meta_description: body.meta_description || null,
          meta_keywords:    body.meta_keywords || null,
          status:           body.status || 'draft',
          updated_at:       new Date().toISOString(),
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as Result;
    },

    update: async (id: string, body: Partial<Result>): Promise<Result> => {
      invalidateCache('results:');
      invalidateCache(`result:`);
      // Bridge post + status logic handled server-side via PUT /api/results/:id
      const response = await fetch(`/api/results/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as any;
        throw new Error(err.error || 'Update failed');
      }
      return response.json() as Promise<Result>;
    },

    delete: async (id: string): Promise<void> => {
      invalidateCache('results:');
      invalidateCache(`result:`);
      const response = await fetch(`/api/results/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Delete failed');
    },
  },
};
