import { Router } from 'express';
import { getSupabaseClient } from '../utils/supabase.js';

const router = Router();

router.get('/check/:postId/:userId', async (req, res) => {
  try {
    const { postId, userId } = req.params;
    const supabase = getSupabaseClient();

    const { data } = await supabase
      .from('premium_purchases')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('payment_status', 'completed')
      .maybeSingle();

    res.json({ hasAccess: !!data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check access' });
  }
});

router.post('/purchase', async (req, res) => {
  try {
    const { userId, postId, paymentMethod, transactionId } = req.body;

    if (!userId || !postId) {
      return res.status(400).json({ error: 'userId and postId required' });
    }

    const supabase = getSupabaseClient();

    const { data: existing } = await supabase
      .from('premium_purchases')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('payment_status', 'completed')
      .maybeSingle();

    if (existing) {
      return res.json({ success: true, message: 'Already purchased' });
    }

    const { data, error } = await supabase
      .from('premium_purchases')
      .insert({
        user_id: userId,
        post_id: postId,
        amount: 0.99,
        payment_method: paymentMethod || 'stripe',
        payment_status: 'completed',
        transaction_id: transactionId || `txn_${Date.now()}`,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, purchase: data });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Purchase failed' });
  }
});

router.get('/purchases/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('premium_purchases')
      .select('*, posts(title, slug, featured_image)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

router.post('/ad-payment', async (req, res) => {
  try {
    const { userEmail, userName, amount, currency, paymentMethod, adPackage, transactionId } = req.body;

    if (!userEmail || !amount || !paymentMethod || !adPackage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('ad_payments')
      .insert({
        user_email: userEmail,
        user_name: userName || '',
        amount: parseFloat(amount),
        currency: currency || 'USD',
        payment_method: paymentMethod,
        payment_status: 'completed',
        transaction_id: transactionId || `ad_txn_${Date.now()}`,
        ad_package: adPackage,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, payment: data });
  } catch (error) {
    console.error('Ad payment error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

export default router;
