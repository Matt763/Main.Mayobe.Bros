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
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) throw error;
    res.json((data || []).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      displayOrder: c.display_order,
      showInFooter: c.show_in_footer,
      createdAt: c.created_at,
    })));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const body = req.body;
    const slug = body.slug || slugify(body.name || '');
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: body.name,
        slug,
        description: body.description || null,
        display_order: body.displayOrder || body.display_order || 0,
        show_in_footer: body.showInFooter || body.show_in_footer || false,
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ id: data.id, name: data.name, slug: data.slug, description: data.description, displayOrder: data.display_order, showInFooter: data.show_in_footer, createdAt: data.created_at });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
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
    if (body.displayOrder !== undefined || body.display_order !== undefined)
      update.display_order = body.displayOrder ?? body.display_order;
    if (body.showInFooter !== undefined || body.show_in_footer !== undefined)
      update.show_in_footer = body.showInFooter ?? body.show_in_footer;
    const { data, error } = await supabase
      .from('categories')
      .update(update)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ id: data.id, name: data.name, slug: data.slug, description: data.description, displayOrder: data.display_order, showInFooter: data.show_in_footer, createdAt: data.created_at });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
