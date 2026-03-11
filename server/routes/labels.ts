import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseClient } from '../utils/supabase.js';

const router = Router();

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { categoryId, category_id } = req.query;
    let query = supabase
      .from('labels')
      .select('*, categories(name, slug)')
      .order('display_order', { ascending: true });
    const catId = categoryId || category_id;
    if (catId) query = query.eq('category_id', catId as string);
    const { data, error } = await query;
    if (error) throw error;
    res.json((data || []).map(l => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      description: l.description,
      categoryId: l.category_id,
      categorySlug: (l.categories as Record<string,string>)?.slug || '',
      categoryName: (l.categories as Record<string,string>)?.name || '',
      displayOrder: l.display_order,
      createdAt: l.created_at,
    })));
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const body = req.body;
    const slug = body.slug || slugify(body.name || '');
    const { data, error } = await supabase
      .from('labels')
      .insert({
        name: body.name,
        slug,
        description: body.description || null,
        category_id: body.categoryId || body.category_id,
        display_order: body.displayOrder || body.display_order || 0,
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ id: data.id, name: data.name, slug: data.slug, categoryId: data.category_id, createdAt: data.created_at });
  } catch (error) {
    console.error('Error creating label:', error);
    res.status(500).json({ error: 'Failed to create label' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const body = req.body;
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.slug !== undefined) update.slug = body.slug;
    if (body.description !== undefined) update.description = body.description;
    if (body.categoryId !== undefined || body.category_id !== undefined)
      update.category_id = body.categoryId ?? body.category_id;
    if (body.displayOrder !== undefined || body.display_order !== undefined)
      update.display_order = body.displayOrder ?? body.display_order;
    const { data, error } = await supabase
      .from('labels')
      .update(update)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ id: data.id, name: data.name, slug: data.slug, categoryId: data.category_id, createdAt: data.created_at });
  } catch (error) {
    console.error('Error updating label:', error);
    res.status(500).json({ error: 'Failed to update label' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('labels').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Label deleted successfully' });
  } catch (error) {
    console.error('Error deleting label:', error);
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

export default router;
