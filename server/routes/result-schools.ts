import { Router } from 'express';
import { getSupabaseClient } from '../utils/supabase.js';
import { fetchAndParseSchool } from '../utils/necta-crawler.js';

const router = Router();

// ── LIST schools for a year + exam_type ──────────────────────────────────────
router.get('/:year/:examType', async (req, res) => {
  try {
    const supabase  = getSupabaseClient();
    const year      = parseInt(req.params.year);
    const examType  = req.params.examType.toLowerCase();

    if (!year || !examType) return res.status(400).json({ error: 'year and examType are required' });

    // Paginate to fetch all schools — PostgREST default caps at 1000 rows
    const PAGE = 1000;
    let allData: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('result_schools')
        .select('id, center_number, center_slug, school_name')
        .eq('year', year)
        .eq('exam_type', examType)
        .order('school_name', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      allData = allData.concat(data || []);
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }
    res.json(allData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── SINGLE school by center_slug — fetches student data on demand ─────────────
router.get('/:year/:examType/:centerSlug', async (req, res) => {
  try {
    const supabase   = getSupabaseClient();
    const year       = parseInt(req.params.year);
    const examType   = req.params.examType.toLowerCase();
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

    // On-demand student fetch: if students array is empty, go get it from NECTA now
    const students: any[] = Array.isArray(data.students) ? data.students : [];
    if (students.length === 0) {
      try {
        const live = await fetchAndParseSchool(year, examType, data.center_number);

        // Update DB so next request is served from cache
        await supabase
          .from('result_schools')
          .update({
            summary:        live.summary,
            students:       live.students,
            total_students: live.students.length,
            school_name:    live.school_name || data.school_name,
            updated_at:     new Date().toISOString(),
          })
          .eq('id', data.id);

        return res.json({
          ...data,
          school_name:    live.school_name || data.school_name,
          summary:        live.summary,
          students:       live.students,
          total_students: live.students.length,
        });
      } catch (fetchErr: any) {
        // NECTA fetch failed — return what we have (empty students)
        console.error(`On-demand fetch failed for ${data.center_number}:`, fetchErr.message);
      }
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
