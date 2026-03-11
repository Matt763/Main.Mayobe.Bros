import { Router } from 'express';
import { getSupabaseClient } from '../utils/supabase.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const body = req.body;
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: body.name || '',
        email: body.email || '',
        subject: body.subject || '',
        message: body.message || '',
        type: body.type || 'general',
      })
      .select('id')
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, id: data.id });
  } catch (error) {
    console.error('Error saving contact submission:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

export default router;
