import { Router } from 'express';
import { randomUUID } from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { requireReaderAuth } from '../middleware/readerAuth.js';
import { getSupabaseAdmin } from '../utils/supabase.js';
import { submitOrder, getOrderStatus, registerIPN } from '../utils/pesapal.js';

const router = Router();

const PREMIUM_PRICE = Number(process.env.PREMIUM_PRICE || 5);
const PREMIUM_CURRENCY = (process.env.PREMIUM_CURRENCY || 'USD') as
  | 'USD' | 'KES' | 'TZS' | 'UGX';

function siteOrigin(): string {
  return (
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    'https://www.mayobebros.com'
  ).replace(/\/$/, '');
}

function callbackUrl(): string {
  return process.env.PESAPAL_CALLBACK_URL || `${siteOrigin()}/upgrade/return`;
}

// ── Plan: GET /api/payments/plan ─────────────────────────────────────────────
router.get('/plan', requireReaderAuth, async (req, res) => {
  try {
    const supa = getSupabaseAdmin();
    const userId = req.readerUser!.id;

    const { data, error } = await supa
      .from('user_plans')
      .select('plan, premium_until, upgraded_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;

    if (!data) {
      // Return a virtual "free" record without writing to the DB.
      return res.json({
        plan: 'free',
        premiumUntil: null,
        upgradedAt: null,
      });
    }

    // Auto-expire premium if past premium_until.
    let plan = data.plan as string;
    if (plan === 'premium' && data.premium_until) {
      const until = new Date(data.premium_until as string).getTime();
      if (Number.isFinite(until) && until < Date.now()) {
        plan = 'free';
      }
    }

    res.json({
      plan,
      premiumUntil: data.premium_until ?? null,
      upgradedAt: data.upgraded_at ?? null,
    });
  } catch (err: any) {
    console.error('[payments] plan error:', err);
    res.status(500).json({ error: 'Failed to load plan' });
  }
});

// ── Create checkout: POST /api/payments/create-checkout ──────────────────────
router.post('/create-checkout', requireReaderAuth, async (req, res) => {
  try {
    const supa = getSupabaseAdmin();
    const user = req.readerUser!;
    const phone = String(req.body?.phone || '').trim();

    const merchantReference = randomUUID();
    const amount = PREMIUM_PRICE;

    // Persist a pending order BEFORE calling Pesapal so we can match the IPN
    // on the way back even if the response from SubmitOrderRequest is lost.
    const { error: insertErr } = await supa.from('payment_orders').insert({
      id: randomUUID(),
      user_id: user.id,
      merchant_reference: merchantReference,
      amount,
      currency: PREMIUM_CURRENCY,
      description: 'Mayobe Bros Premium (lifetime)',
      status: 'pending',
    });
    if (insertErr) throw insertErr;

    // Submit to Pesapal
    const order = await submitOrder({
      merchantReference,
      amount,
      currency: PREMIUM_CURRENCY,
      description: 'Mayobe Bros Premium (lifetime)',
      callbackUrl: callbackUrl(),
      email: user.email || 'reader@mayobebros.com',
      firstName: (user.name || '').split(' ')[0] || '',
      lastName: (user.name || '').split(' ').slice(1).join(' ') || '',
      phone,
    });

    // Backfill order_tracking_id
    await supa
      .from('payment_orders')
      .update({
        order_tracking_id: order.orderTrackingId,
        raw_response: order.raw,
        updated_at: new Date().toISOString(),
      })
      .eq('merchant_reference', merchantReference);

    res.json({
      redirectUrl: order.redirectUrl,
      orderTrackingId: order.orderTrackingId,
      merchantReference,
      amount,
      currency: PREMIUM_CURRENCY,
    });
  } catch (err: any) {
    console.error('[payments] create-checkout error:', err);
    res.status(500).json({
      error: err?.message || 'Failed to start checkout',
    });
  }
});

// Internal helper: fetch + persist + upgrade plan if completed
async function syncOrderStatus(orderTrackingId: string): Promise<{
  status: string;
  upgraded: boolean;
}> {
  const supa = getSupabaseAdmin();

  const { data: order, error: orderErr } = await supa
    .from('payment_orders')
    .select('id, user_id, status, currency, amount')
    .eq('order_tracking_id', orderTrackingId)
    .maybeSingle();
  if (orderErr) throw orderErr;
  if (!order) throw new Error('Order not found');

  const result = await getOrderStatus(orderTrackingId);

  await supa
    .from('payment_orders')
    .update({
      status: result.status,
      payment_method: result.paymentMethod,
      confirmation_code: result.confirmationCode,
      raw_response: result.raw,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  let upgraded = false;
  if (result.status === 'completed' && order.status !== 'completed') {
    const now = new Date().toISOString();
    await supa.from('user_plans').upsert({
      user_id: order.user_id,
      plan: 'premium',
      premium_until: null, // lifetime
      upgraded_at: now,
      updated_at: now,
    });
    upgraded = true;
  }

  return { status: result.status, upgraded };
}

// ── Status check (used by client polling): GET /api/payments/status/:trackingId
router.get('/status/:trackingId', requireReaderAuth, async (req, res) => {
  try {
    const supa = getSupabaseAdmin();
    const trackingId = req.params.trackingId;
    const userId = req.readerUser!.id;

    // Owner check before exposing anything
    const { data: order } = await supa
      .from('payment_orders')
      .select('user_id, status')
      .eq('order_tracking_id', trackingId)
      .maybeSingle();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    // If already terminal, skip remote call.
    if (['completed', 'failed', 'reversed', 'invalid', 'cancelled'].includes(order.status)) {
      return res.json({ status: order.status, upgraded: order.status === 'completed' });
    }

    const result = await syncOrderStatus(trackingId);
    res.json(result);
  } catch (err: any) {
    console.error('[payments] status error:', err);
    res.status(500).json({ error: err?.message || 'Status check failed' });
  }
});

// ── Pesapal IPN: GET /api/payments/ipn ───────────────────────────────────────
// Pesapal calls this with OrderTrackingId, OrderMerchantReference,
// OrderNotificationType. We respond with a JSON envelope so they stop retrying.
router.get('/ipn', async (req, res) => {
  const orderTrackingId = (req.query.OrderTrackingId || req.query.orderTrackingId) as string;
  const merchantReference = (req.query.OrderMerchantReference ||
    req.query.orderMerchantReference) as string;
  const notificationType = (req.query.OrderNotificationType ||
    req.query.orderNotificationType) as string;

  try {
    if (orderTrackingId) {
      await syncOrderStatus(orderTrackingId);
    }
    res.json({
      orderNotificationType: notificationType || 'IPNCHANGE',
      orderTrackingId: orderTrackingId || '',
      orderMerchantReference: merchantReference || '',
      status: 200,
    });
  } catch (err: any) {
    console.error('[payments] IPN error:', err);
    // Still respond 200 so Pesapal stops retrying; we have the row in DB.
    res.json({
      orderNotificationType: notificationType || 'IPNCHANGE',
      orderTrackingId: orderTrackingId || '',
      orderMerchantReference: merchantReference || '',
      status: 500,
      error: err?.message || 'sync failed',
    });
  }
});

// ── Admin: register IPN URL with Pesapal (one-time) ──────────────────────────
router.post('/register-ipn', requireAuth, async (req, res) => {
  try {
    const ipnUrl =
      req.body?.url ||
      process.env.PESAPAL_IPN_URL ||
      `${siteOrigin()}/api/payments/ipn`;
    const result = await registerIPN(ipnUrl);
    res.json({
      ipnId: result.ipnId,
      message:
        'Set PESAPAL_IPN_ID to this value in your environment. Restart server to apply.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to register IPN' });
  }
});

export default router;
