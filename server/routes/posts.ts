import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseClient } from '../utils/supabase.js';
import { dispatchPostNewsletter } from '../utils/newsletterDispatch.js';
import { notifySearchEngines } from '../utils/searchPing.js';
import { logActivity } from '../utils/activityLogger.js';
import { invalidateSitemapCache } from '../utils/sitemapCache.js';

const router = Router();

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

router.get('/by-id/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*, categories(name, slug), labels(name, slug)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Post not found' });
    res.json(normalizePost(data));
  } catch (error) {
    console.error('Error fetching post by id:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { category, label, status, search } = req.query;

    let query = supabase
      .from('posts')
      .select('*, categories(name, slug), labels(name, slug)')
      .order('published_at', { ascending: false });

    if (status === 'all') {
      // no filter
    } else if (status) {
      query = query.eq('status', status as string);
    } else {
      query = query.eq('status', 'published');
    }

    if (category) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category as string)
        .maybeSingle();
      if (cat) query = query.eq('category_id', cat.id);
      else return res.json([]);
    }

    if (label) {
      const { data: lbl } = await supabase
        .from('labels')
        .select('id')
        .eq('slug', label as string)
        .maybeSingle();
      if (lbl) query = query.eq('label_id', lbl.id);
      else return res.json([]);
    }

    if (search) {
      const s = (search as string).replace(/[%_]/g, '\\$&');
      query = query.or(`title.ilike.%${s}%,content.ilike.%${s}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json((data || []).map(normalizePost));
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*, categories(name, slug), labels(name, slug)')
      .eq('slug', req.params.slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Post not found' });
    res.json(normalizePost(data));
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const body = req.body;

    const slug = body.slug || slugify(body.title || '');
    const categoryId = await resolveCategoryId(supabase, body.categoryId || body.category_id);
    const rawLabelId = body.labelId || body.label_id || (Array.isArray(body.labelIds) ? body.labelIds[0] : undefined);
    const labelId = await resolveLabelId(supabase, rawLabelId);

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

    if (error) throw error;
    const normalized = normalizePost(data);
    res.status(201).json(normalized);

    const authorName = (req as any).session?.email || 'Admin';
    const postAction = data.status === 'published' ? 'published' : 'created';
    logActivity({
      userId: (req as any).session?.userId,
      userName: authorName,
      userRole: 'admin',
      activityType: 'post',
      action: postAction,
      contentTitle: data.title as string,
      contentId: data.id as string,
      description: `${authorName} ${postAction} a new post titled "${data.title}".`,
    });

    if (data.status === 'published') {
      invalidateSitemapCache(['posts', 'image', 'video', 'index']);

      const cats = data.categories as Record<string, string> | null;
      dispatchPostNewsletter({
        id: data.id as string,
        slug: data.slug as string,
        title: data.title as string,
        excerpt: data.excerpt as string | undefined,
        featuredImage: data.featured_image as string | undefined,
        categoryName: cats?.name,
        author: data.author as string | undefined,
        readingTime: data.reading_time as number | undefined,
      }).catch(e => console.error('[NEWSLETTER] Create dispatch error:', e));

      const catSlug = cats?.slug || '';
      const postUrl = `https://mayobebros.com/post/${catSlug}/${data.slug}`;
      notifySearchEngines({ postUrl, postSlug: data.slug as string })
        .catch(e => console.error('[PING] Create ping error:', e));
    }
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.put('/:slug', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const body = req.body;

    const { data: existing, error: findErr } = await supabase
      .from('posts')
      .select('id, status')
      .eq('slug', req.params.slug)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!existing) return res.status(404).json({ error: 'Post not found' });

    const wasPublished = existing.status === 'published';

    const categoryId = await resolveCategoryId(supabase, body.categoryId || body.category_id);
    const rawLabelId2 = body.labelId || body.label_id || (Array.isArray(body.labelIds) ? body.labelIds[0] : undefined);
    const labelId = await resolveLabelId(supabase, rawLabelId2);

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

    if (error) throw error;
    const normalized = normalizePost(data);
    res.json(normalized);

    const editorName = (req as any).session?.email || 'Admin';
    const updateAction = body.status === 'published' ? 'published' : 'updated';
    logActivity({
      userId: (req as any).session?.userId,
      userName: editorName,
      userRole: 'admin',
      activityType: 'post',
      action: updateAction,
      contentTitle: data.title as string,
      contentId: data.id as string,
      description: `${editorName} ${updateAction} the post "${data.title}".`,
    });

    // Invalidate sitemap cache whenever a published post changes (create, edit, or status change).
    if (wasPublished || data.status === 'published') {
      invalidateSitemapCache(['posts', 'image', 'video', 'index']);
    }

    // Only dispatch newsletter when a post newly becomes published (draft → published).
    // Editing an already-published post should NOT re-trigger the newsletter.
    if (!wasPublished && data.status === 'published') {
      const cats = data.categories as Record<string, string> | null;
      dispatchPostNewsletter({
        id: data.id as string,
        slug: data.slug as string,
        title: data.title as string,
        excerpt: data.excerpt as string | undefined,
        featuredImage: data.featured_image as string | undefined,
        categoryName: cats?.name,
        author: data.author as string | undefined,
        readingTime: data.reading_time as number | undefined,
      }).catch(e => console.error('[NEWSLETTER] Update dispatch error:', e));

      const catSlug = cats?.slug || '';
      const postUrl = `${process.env.VITE_SITE_URL || 'https://mayobebros.com'}/post/${catSlug}/${data.slug}`;
      notifySearchEngines({ postUrl, postSlug: data.slug as string })
        .catch(e => console.error('[PING] Update ping error:', e));
    }
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

router.post('/:slug/view', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data: existing } = await supabase
      .from('posts')
      .select('id, views')
      .eq('slug', req.params.slug)
      .maybeSingle();

    if (!existing) return res.status(404).json({ error: 'Post not found' });

    await supabase
      .from('posts')
      .update({ views: (existing.views || 0) + 1 })
      .eq('id', existing.id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error incrementing views:', error);
    res.status(500).json({ error: 'Failed to update views' });
  }
});

router.delete('/:slug', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('slug', req.params.slug);

    if (error) throw error;
    invalidateSitemapCache(['posts', 'image', 'video', 'index']);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

async function resolveCategoryId(supabase: ReturnType<typeof getSupabaseClient>, value: string | undefined): Promise<string | null> {
  if (!value) return null;
  if (value.includes('-') && value.length > 20) return value;
  const { data } = await supabase.from('categories').select('id').eq('slug', value).maybeSingle();
  return data?.id ?? value;
}

async function resolveLabelId(supabase: ReturnType<typeof getSupabaseClient>, value: string | undefined): Promise<string | null> {
  if (!value) return null;
  if (value.includes('-') && value.length > 20) return value;
  const { data } = await supabase.from('labels').select('id').eq('slug', value).maybeSingle();
  return data?.id ?? null;
}

function normalizePost(row: Record<string, unknown>): Record<string, unknown> {
  const cats = row.categories as Record<string, string> | null;
  const lbls = row.labels as Record<string, string> | null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
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

export default router;
