import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { crawlNectaResults } from '../utils/necta-crawler.js';
import { getSupabaseClient } from '../utils/supabase.js';
import type { CrawlEvent } from '../types/results.js';

const router = Router();

// ── LIST ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { status, year, exam_type } = req.query as Record<string, string>;

    let query = supabase
      .from('results')
      .select('id, title, slug, year, exam_type, status, source_url, meta_title, meta_description, created_at, updated_at')
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);
    else if (!status) query = query.eq('status', 'published');
    if (year)      query = query.eq('year', parseInt(year));
    if (exam_type) query = query.eq('exam_type', exam_type.toLowerCase());

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── SINGLE BY ID (admin) ──────────────────────────────────────────────────────
router.get('/by-id/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── SEARCH STUB (Phase 3) ─────────────────────────────────────────────────────
router.get('/search', (_req, res) => {
  res.json({ results: [], message: 'Live search coming in Phase 3' });
});

// ── SINGLE BY SLUG ────────────────────────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── CREATE ────────────────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const b = req.body;
    const { data, error } = await supabase
      .from('results')
      .insert({
        title: b.title,
        slug: b.slug,
        year: b.year,
        exam_type: b.exam_type?.toLowerCase(),
        source_url: b.source_url || null,
        content: b.content || '',
        structured_data: b.structured_data || null,
        meta_title: b.meta_title || null,
        meta_description: b.meta_description || null,
        meta_keywords: b.meta_keywords || null,
        status: b.status || 'draft',
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE ────────────────────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const b = req.body;
    const isPublishing = b.status === 'published';

    const update: Record<string, any> = {
      title: b.title,
      slug: b.slug,
      year: b.year,
      exam_type: b.exam_type?.toLowerCase(),
      source_url: b.source_url || null,
      content: b.content || '',
      meta_title: b.meta_title || null,
      meta_description: b.meta_description || null,
      meta_keywords: b.meta_keywords || null,
      status: b.status || 'draft',
      updated_at: new Date().toISOString(),
    };
    // Only update structured_data when explicitly provided — avoids wiping crawled data
    if (Object.prototype.hasOwnProperty.call(b, 'structured_data')) {
      update.structured_data = b.structured_data;
    }

    const { data: result, error: updateErr } = await supabase
      .from('results')
      .update(update)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (updateErr) throw updateErr;

    // Auto-create bridge post when publishing for the first time
    if (isPublishing && !result.bridge_post_id) {
      try {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', 'educational')
          .maybeSingle();

        const { data: lbl } = cat ? await supabase
          .from('labels')
          .select('id')
          .eq('slug', 'results')
          .eq('category_id', cat.id)
          .maybeSingle() : { data: null };

        if (cat && lbl) {
          const bridgeSlug = `result-link-${result.slug}`;
          const bridgeContent = `<p>Haya ni matokeo rasmi ya ${result.exam_type?.toUpperCase()} mwaka ${result.year} kutoka NECTA Tanzania. Unaweza kutafuta matokeo kwa index number au shule.</p><p><a href="/results/${result.year}/${result.exam_type}/${result.slug}">Angalia Matokeo Kamili →</a></p>`;

          const { data: post } = await supabase
            .from('posts')
            .insert({
              title: result.title,
              slug: bridgeSlug,
              content: bridgeContent,
              excerpt: `Matokeo ya ${result.exam_type?.toUpperCase()} ${result.year} — tafuta kwa index number, shule, au jina.`,
              category_id: cat.id,
              label_id: lbl.id,
              status: 'published',
              published: true,
              author: 'Mayobe Bros',
              published_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (post) {
            await supabase
              .from('results')
              .update({ bridge_post_id: post.id })
              .eq('id', result.id);
          }
        }
      } catch {
        // Bridge post failure is non-fatal
      }
    }

    // Unpublish bridge post when result is unpublished
    if (!isPublishing && result.bridge_post_id) {
      await supabase
        .from('posts')
        .update({ status: 'draft', published: false })
        .eq('id', result.bridge_post_id)
        .catch(() => {});
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE ────────────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    // Fetch to get bridge_post_id before deleting
    const { data: existing } = await supabase
      .from('results')
      .select('bridge_post_id')
      .eq('id', req.params.id)
      .maybeSingle();

    const { error } = await supabase
      .from('results')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;

    // Delete bridge post
    if (existing?.bridge_post_id) {
      await supabase
        .from('posts')
        .delete()
        .eq('id', existing.bridge_post_id)
        .catch(() => {});
    }

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── CRAWL (SSE stream) ────────────────────────────────────────────────────────
router.post('/crawl', requireAuth, async (req, res) => {
  const { url, overwrite = false } = req.body as { url: string; overwrite?: boolean };

  if (!url || !url.startsWith('https://onlinesys.necta.go.tz')) {
    return res.status(400).json({ error: 'Invalid URL. Must start with https://onlinesys.necta.go.tz' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event: CrawlEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    const supabase = getSupabaseClient();
    let existingId: string | null = null;

    // Duplicate check
    const { data: existing } = await supabase
      .from('results')
      .select('id, title')
      .eq('source_url', url)
      .maybeSingle();

    if (existing && !overwrite) {
      send({
        stage: 'duplicate',
        message: `"${existing.title}" already exists.`,
        existingTitle: existing.title,
        existingId: existing.id,
      });
      return res.end();
    }

    if (existing) existingId = existing.id;

    const crawled = await crawlNectaResults(url, send);

    // Save server-side to avoid sending huge payload over SSE
    const record = {
      title:            crawled.title,
      slug:             crawled.slug,
      year:             crawled.year,
      exam_type:        crawled.exam_type,
      source_url:       crawled.source_url,
      content:          crawled.content,
      structured_data:  crawled.structured_data,
      meta_title:       crawled.meta_title,
      meta_description: crawled.meta_description,
      status:           'draft',
      updated_at:       new Date().toISOString(),
    };

    let savedId: string;
    if (existingId) {
      const { data: saved, error } = await supabase
        .from('results').update(record).eq('id', existingId).select('id').single();
      if (error) throw error;
      savedId = saved.id;
    } else {
      const { data: saved, error } = await supabase
        .from('results').insert(record).select('id').single();
      if (error) throw error;
      savedId = saved.id;
    }

    // Lightweight done event — no content, no schools array
    send({
      stage: 'done',
      message: 'Saved as draft!',
      result: {
        id:               savedId,
        title:            crawled.title,
        slug:             crawled.slug,
        year:             crawled.year,
        exam_type:        crawled.exam_type,
        source_url:       crawled.source_url,
        meta_title:       crawled.meta_title,
        meta_description: crawled.meta_description,
      },
    });
  } catch (err: any) {
    send({ stage: 'error', message: err.message || 'Crawl failed' });
  }

  res.end();
});

export default router;
