import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseClient } from '../utils/supabase.js';
import {
  checkRateLimit,
  checkDuplicate,
  checkSpamKeywords,
  checkIdempotency,
  checkHoneypot,
  sanitizeText,
  getClientIp,
} from '../utils/spamProtection.js';
import { logActivity } from '../utils/activityLogger.js';

const router = Router();

function normalizeReview(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    author: row.user_name,
    role: row.role || '',
    content: row.comment,
    rating: row.rating,
    avatar: row.user_avatar,
    status: row.status || 'pending',
    isVerified: row.is_verified,
    createdAt: row.created_at,
  };
}

router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { status } = req.query;
    const isAdmin = !!req.session.userId;

    let query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status as string);
    } else if (!isAdmin) {
      query = query.eq('status', 'approved');
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json((data || []).map(normalizeReview));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const body = req.body;
    const ip = getClientIp(req);

    const honeypot = checkHoneypot(body);
    if (honeypot.isBot) {
      return res.status(400).json({ error: 'Submission rejected.' });
    }

    const rateCheck = checkRateLimit(ip, 'review');
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: rateCheck.message });
    }

    const content = sanitizeText(body.content || body.comment || '');
    if (!content || content.length < 5) {
      return res.status(400).json({ error: 'Review content is too short.' });
    }

    const dupCheck = checkDuplicate(ip, 'review', content);
    if (dupCheck.isDuplicate) {
      return res.status(409).json({ error: 'Duplicate submission detected.' });
    }

    const authorName = sanitizeText(body.author || body.user_name || '');
    const spamCheck = checkSpamKeywords(content + ' ' + authorName);

    const idempotencyToken = body.idempotencyToken || body.requestToken;
    if (idempotencyToken) {
      const idemCheck = checkIdempotency(idempotencyToken);
      if (idemCheck.isDuplicate) {
        return res.status(200).json({ message: 'Review already submitted.' });
      }
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_name: authorName.slice(0, 100),
        role: '',
        comment: content.slice(0, 2000),
        rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
        user_avatar: null,
        status: spamCheck.isSpam ? 'spam' : 'pending',
        is_verified: false,
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(normalizeReview(data));
    if (!spamCheck.isSpam) {
      logActivity({
        userName: authorName || 'Anonymous',
        userRole: 'user',
        activityType: 'review',
        action: 'submitted',
        contentId: data.id as string,
        description: `User "${authorName || 'Anonymous'}" submitted a ${data.rating}-star review.`,
        metadata: { rating: data.rating },
      });
    }
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const body = req.body;
    const update: Record<string, unknown> = {};
    if (body.status !== undefined) update.status = body.status;
    if (body.isVerified !== undefined || body.is_verified !== undefined)
      update.is_verified = body.isVerified ?? body.is_verified;
    if (body.author !== undefined || body.user_name !== undefined)
      update.user_name = body.author ?? body.user_name;
    if (body.role !== undefined) update.role = body.role;
    if (body.content !== undefined || body.comment !== undefined)
      update.comment = body.content ?? body.comment;
    if (body.rating !== undefined) update.rating = body.rating;
    const { data, error } = await supabase
      .from('reviews')
      .update(update)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(normalizeReview(data));
    if (body.status === 'approved' || body.status === 'rejected') {
      const adminEmail = (req as any).session?.email || 'Admin';
      const action = body.status === 'approved' ? 'approved' : 'rejected';
      logActivity({
        userId: (req as any).session?.userId,
        userName: adminEmail,
        userRole: 'admin',
        activityType: 'review',
        action,
        contentId: req.params.id,
        description: `${adminEmail} ${action} a review by "${data.user_name}".`,
      });
    }
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data: existing } = await supabase.from('reviews').select('user_name').eq('id', req.params.id).maybeSingle();
    const { error } = await supabase.from('reviews').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Review deleted successfully' });
    const adminEmail = (req as any).session?.email || 'Admin';
    logActivity({
      userId: (req as any).session?.userId,
      userName: adminEmail,
      userRole: 'admin',
      activityType: 'review',
      action: 'deleted',
      contentId: req.params.id,
      description: `${adminEmail} deleted a review${existing?.user_name ? ` by "${existing.user_name}"` : ''}.`,
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
