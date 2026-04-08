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

const PRIVILEGED_ROLES = ['ceo', 'admin', 'publisher', 'staff'];

function normalizeComment(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    postId: row.post_id,
    author: row.user_name,
    email: row.user_email,
    content: row.content,
    status: row.status || 'pending',
    parentId: row.parent_id,
    authorRole: row.author_role || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { postId, post_id, status } = req.query;
    const isAdmin = !!req.session.userId;

    let query = supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });

    const pid = postId || post_id;
    if (pid) query = query.eq('post_id', pid as string);

    if (status) {
      query = query.eq('status', status as string);
    } else if (!isAdmin) {
      query = query.eq('status', 'approved');
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json((data || []).map(normalizeComment));
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
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

    const authorRole = body.authorRole || null;
    const isPrivileged = authorRole && PRIVILEGED_ROLES.includes(authorRole);

    if (!isPrivileged) {
      const rateCheck = checkRateLimit(ip, 'comment');
      if (!rateCheck.allowed) {
        return res.status(429).json({ error: rateCheck.message });
      }

      const content = sanitizeText(body.content || '');
      if (!content || content.length < 2) {
        return res.status(400).json({ error: 'Comment content is too short.' });
      }

      const dupCheck = checkDuplicate(ip, 'comment', content);
      if (dupCheck.isDuplicate) {
        return res.status(409).json({ error: 'Duplicate submission detected.' });
      }

      const spamCheck = checkSpamKeywords(content + ' ' + (body.author || ''));
      if (spamCheck.isSpam) {
        await supabase.from('comments').insert({
          post_id: body.postId || body.post_id,
          user_name: sanitizeText(body.author || body.user_name || '').slice(0, 100),
          user_email: (body.email || body.user_email || '').slice(0, 200),
          content: content.slice(0, 5000),
          status: 'spam',
          author_role: null,
          parent_id: body.parentId || body.parent_id || null,
        });
        return res.status(201).json({ message: 'Comment submitted for review.' });
      }

      const idempotencyToken = body.idempotencyToken || body.requestToken;
      if (idempotencyToken) {
        const idemCheck = checkIdempotency(idempotencyToken);
        if (idemCheck.isDuplicate) {
          return res.status(200).json({ message: 'Comment already submitted.' });
        }
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: body.postId || body.post_id,
          user_name: sanitizeText(body.author || body.user_name || '').slice(0, 100),
          user_email: (body.email || body.user_email || '').slice(0, 200),
          content: content.slice(0, 5000),
          status: 'pending',
          author_role: null,
          parent_id: body.parentId || body.parent_id || null,
        })
        .select()
        .single();
      if (error) throw error;
      const commenterName = sanitizeText(body.author || body.user_name || 'Anonymous');
      logActivity({
        userName: commenterName,
        userRole: 'user',
        activityType: 'comment',
        action: 'submitted',
        contentId: String(body.postId || body.post_id || ''),
        description: `User "${commenterName}" submitted a new comment for review.`,
      });
      return res.status(201).json(normalizeComment(data));
    }

    const content = sanitizeText(body.content || '');
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: body.postId || body.post_id,
        user_name: sanitizeText(body.author || body.user_name || '').slice(0, 100),
        user_email: (body.email || body.user_email || '').slice(0, 200),
        content: content.slice(0, 5000),
        status: 'approved',
        author_role: authorRole,
        parent_id: body.parentId || body.parent_id || null,
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(normalizeComment(data));
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const body = req.body;
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status !== undefined) update.status = body.status;
    if (body.content !== undefined) update.content = sanitizeText(body.content);
    const { data, error } = await supabase
      .from('comments')
      .update(update)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(normalizeComment(data));
    if (body.status === 'approved' || body.status === 'rejected') {
      const adminEmail = (req as any).session?.email || 'Admin';
      const action = body.status === 'approved' ? 'approved' : 'rejected';
      logActivity({
        userId: (req as any).session?.userId,
        userName: adminEmail,
        userRole: 'admin',
        activityType: 'comment',
        action,
        contentId: req.params.id,
        description: `${adminEmail} ${action} a comment by "${data.user_name}".`,
      });
    }
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data: existing } = await supabase.from('comments').select('user_name').eq('id', req.params.id).maybeSingle();
    const { error } = await supabase.from('comments').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Comment deleted successfully' });
    const adminEmail = (req as any).session?.email || 'Admin';
    logActivity({
      userId: (req as any).session?.userId,
      userName: adminEmail,
      userRole: 'admin',
      activityType: 'comment',
      action: 'deleted',
      contentId: req.params.id,
      description: `${adminEmail} deleted a comment${existing?.user_name ? ` by "${existing.user_name}"` : ''}.`,
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
