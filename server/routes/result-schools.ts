import { Router } from 'express';
import { getSupabaseClient } from '../utils/supabase.js';

const router = Router();

// ── LIST schools for a year + exam_type ──────────────────────────────────────
router.get('/:year/:examType', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const year = parseInt(req.params.year);
    const examType = req.params.examType.toLowerCase();

    if (!year || !examType) return res.status(400).json({ error: 'year and examType are required' });

    const { data, error } = await supabase
      .from('result_schools')
      .select('id, center_number, center_slug, school_name, summary, total_students, year, exam_type')
      .eq('year', year)
      .eq('exam_type', examType)
      .order('school_name', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── SINGLE school by center_slug ──────────────────────────────────────────────
router.get('/:year/:examType/:centerSlug', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const year = parseInt(req.params.year);
    const examType = req.params.examType.toLowerCase();
    const centerSlug = req.params.centerSlug.toLowerCase();

    const { data, error } = await supabase
      .from('result_schools')
      .select('*')
      .eq('year', year)
      .eq('exam_type', examType)
      .eq('center_slug', centerSlug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'School not found' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
