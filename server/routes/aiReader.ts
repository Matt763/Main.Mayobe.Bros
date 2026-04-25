/**
 * Premium-only AI features for readers.
 *   POST /api/ai-reader/summarize  body: { content?: string, postSlug?: string }
 *   Returns: { summary: string, bullets: string[] }
 *
 * Gated to authenticated readers with `user_plans.plan = 'premium'`.
 */

import { Router } from 'express';
import { requireReaderAuth } from '../middleware/readerAuth.js';
import { getSupabaseAdmin } from '../utils/supabase.js';

const router = Router();

async function isPremiumReader(userId: string): Promise<boolean> {
  const supa = getSupabaseAdmin();
  const { data } = await supa
    .from('user_plans')
    .select('plan, premium_until')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return false;
  if (data.plan !== 'premium') return false;
  if (data.premium_until && new Date(data.premium_until).getTime() < Date.now()) return false;
  return true;
}

async function callClaude(prompt: string, system: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('AI is not configured.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err?.error?.message || `Anthropic ${res.status}`);
  }
  const data = await res.json();
  return data?.content?.[0]?.text || '';
}

function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadPostContent(slug: string): Promise<{ title: string; text: string } | null> {
  const supa = getSupabaseAdmin();
  const { data } = await supa
    .from('posts')
    .select('title, content, excerpt')
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return null;
  return {
    title: String(data.title || ''),
    text: stripHtml(String(data.content || data.excerpt || '')),
  };
}

router.post('/summarize', requireReaderAuth, async (req, res) => {
  try {
    const u = req.readerUser!;
    if (!(await isPremiumReader(u.id))) {
      return res.status(402).json({ error: 'AI summary is a Premium feature. Upgrade to access.' });
    }

    let title = '';
    let text = '';
    if (req.body?.postSlug) {
      const loaded = await loadPostContent(String(req.body.postSlug));
      if (!loaded) return res.status(404).json({ error: 'Post not found.' });
      title = loaded.title;
      text = loaded.text;
    } else if (req.body?.content) {
      text = stripHtml(String(req.body.content));
    } else {
      return res.status(400).json({ error: 'Provide content or postSlug.' });
    }

    if (text.length < 200) {
      return res.status(400).json({ error: 'Article too short to summarize.' });
    }
    const truncated = text.slice(0, 12000);

    const system = `You write concise, neutral summaries for premium readers of an East African news/lifestyle site. Output exactly 3 bullets. Each bullet: a single sentence, ≤22 words, leading with the most newsworthy fact. No editorial tone.`;
    const prompt = `Title: ${title || '(untitled)'}\n\nArticle:\n${truncated}\n\nReturn just three bullets, each starting with "• ".`;

    const raw = (await callClaude(prompt, system)).trim();
    const bullets = raw
      .split(/\n+/)
      .map(l => l.replace(/^[•\-*]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 3);
    res.json({ summary: bullets.join(' '), bullets });
  } catch (err: any) {
    console.error('[ai-reader] summarize error:', err);
    res.status(500).json({ error: err?.message || 'Summary failed' });
  }
});

export default router;
