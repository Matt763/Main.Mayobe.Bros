import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseClient } from '../utils/supabase.js';
import { logActivity } from '../utils/activityLogger.js';

const router = Router();

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizePage(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    status: row.published ? 'published' : 'draft',
    showInMenu: row.show_in_menu,
    isIndexed: row.is_indexed,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/by-id/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('static_pages')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Page not found' });
    res.json(normalizePage(data));
  } catch (error) {
    console.error('Error fetching page by id:', error);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { status } = req.query;
    let query = supabase.from('static_pages').select('*').order('created_at', { ascending: false });
    if (status === 'all') {
      // no filter
    } else if (status === 'published') {
      query = query.eq('published', true);
    } else if (status === 'draft') {
      query = query.eq('published', false);
    } else {
      query = query.eq('published', true);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json((data || []).map(normalizePage));
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('static_pages')
      .select('*')
      .eq('slug', req.params.slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Page not found' });
    res.json(normalizePage(data));
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const body = req.body;
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
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(normalizePage(data));
    const adminEmail = (req as any).session?.email || 'Admin';
    logActivity({
      userId: (req as any).session?.userId,
      userName: adminEmail,
      userRole: 'admin',
      activityType: 'page',
      action: 'created',
      contentTitle: data.title as string,
      contentId: data.id as string,
      description: `${adminEmail} created a new page titled "${data.title}".`,
    });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ error: 'Failed to create page' });
  }
});

router.put('/:slug', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const body = req.body;
    const { data: existing, error: findErr } = await supabase
      .from('static_pages')
      .select('id')
      .eq('slug', req.params.slug)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!existing) return res.status(404).json({ error: 'Page not found' });
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
    const { data, error } = await supabase
      .from('static_pages')
      .update(update)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    res.json(normalizePage(data));
    const adminEmail2 = (req as any).session?.email || 'Admin';
    logActivity({
      userId: (req as any).session?.userId,
      userName: adminEmail2,
      userRole: 'admin',
      activityType: 'page',
      action: 'updated',
      contentTitle: data.title as string,
      contentId: data.id as string,
      description: `${adminEmail2} updated the page "${data.title}".`,
    });
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ error: 'Failed to update page' });
  }
});

router.delete('/:slug', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('static_pages').delete().eq('slug', req.params.slug);
    if (error) throw error;
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

export default router;
