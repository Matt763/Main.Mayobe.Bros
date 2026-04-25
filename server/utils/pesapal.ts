/**
 * Pesapal v3 client — token cache, order submission, status polling, IPN registration.
 *
 * Required env vars:
 *   PESAPAL_CONSUMER_KEY      Pesapal merchant consumer key
 *   PESAPAL_CONSUMER_SECRET   Pesapal merchant consumer secret
 *   PESAPAL_BASE_URL          Optional. Defaults to sandbox.
 *                             Sandbox:    https://cybqa.pesapal.com/pesapalv3
 *                             Production: https://pay.pesapal.com/v3
 *   PESAPAL_IPN_ID            Notification ID after running registerIPN once
 *   PESAPAL_CALLBACK_URL      Where Pesapal redirects after payment. Should
 *                             point at /upgrade/return on your domain.
 *   PESAPAL_IPN_URL           Public URL Pesapal calls server-to-server. Should
 *                             point at /api/payments/ipn on your domain.
 */

const DEFAULT_BASE = 'https://cybqa.pesapal.com/pesapalv3';

function baseUrl(): string {
  return (process.env.PESAPAL_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function fetchToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - 30_000 > now) return tokenCache.token;

  const key = process.env.PESAPAL_CONSUMER_KEY;
  const secret = process.env.PESAPAL_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new Error(
      'Pesapal not configured: set PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET in your env.'
    );
  }

  const res = await fetch(`${baseUrl()}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ consumer_key: key, consumer_secret: secret }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data?.token) {
    throw new Error(`Pesapal auth failed: ${data?.error?.message || data?.message || res.status}`);
  }

  // Tokens are typically valid for ~5 minutes. Cache conservatively.
  tokenCache = { token: data.token, expiresAt: now + 4 * 60 * 1000 };
  return data.token;
}

export interface PesapalOrderInput {
  merchantReference: string;
  amount: number;
  currency: 'USD' | 'KES' | 'TZS' | 'UGX';
  description: string;
  callbackUrl: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  countryCode?: string;
}

export interface PesapalOrderResult {
  redirectUrl: string;
  orderTrackingId: string;
  merchantReference: string;
  raw: any;
}

export async function submitOrder(input: PesapalOrderInput): Promise<PesapalOrderResult> {
  const ipnId = process.env.PESAPAL_IPN_ID;
  if (!ipnId) {
    throw new Error(
      'Pesapal IPN not configured: set PESAPAL_IPN_ID after running register-ipn once.'
    );
  }

  const token = await fetchToken();
  const body = {
    id: input.merchantReference,
    currency: input.currency,
    amount: input.amount,
    description: input.description,
    callback_url: input.callbackUrl,
    notification_id: ipnId,
    billing_address: {
      email_address: input.email,
      phone_number: input.phone || '',
      country_code: input.countryCode || 'KE',
      first_name: input.firstName || '',
      last_name: input.lastName || '',
    },
  };

  const res = await fetch(`${baseUrl()}/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data?.redirect_url) {
    throw new Error(
      `Pesapal SubmitOrderRequest failed: ${data?.error?.message || data?.message || res.status}`
    );
  }

  return {
    redirectUrl: data.redirect_url,
    orderTrackingId: data.order_tracking_id,
    merchantReference: data.merchant_reference || input.merchantReference,
    raw: data,
  };
}

export interface PesapalStatusResult {
  status: 'pending' | 'completed' | 'failed' | 'reversed' | 'invalid';
  paymentMethod: string | null;
  confirmationCode: string | null;
  amount: number | null;
  raw: any;
}

/**
 * Pesapal returns payment_status_description = "INVALID" for orders that
 * simply haven't been paid yet (status_code = 0), so we cannot trust the
 * description alone. Prefer the integer status_code:
 *   0 = pending / not yet paid
 *   1 = completed
 *   2 = failed
 *   3 = reversed
 * Fall back to the description string only when status_code is missing.
 */
function normalizeStatus(raw: any): PesapalStatusResult['status'] {
  const code = typeof raw?.status_code === 'number' ? raw.status_code : null;
  if (code === 1) return 'completed';
  if (code === 2) return 'failed';
  if (code === 3) return 'reversed';
  if (code === 0) return 'pending';

  switch ((raw?.payment_status_description || '').trim().toLowerCase()) {
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'reversed':
      return 'reversed';
    default:
      // 'invalid' from Pesapal often means "still pending" — treat as such.
      return 'pending';
  }
}

export async function getOrderStatus(orderTrackingId: string): Promise<PesapalStatusResult> {
  const token = await fetchToken();
  const url = `${baseUrl()}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Pesapal status check failed: ${data?.message || res.status}`);
  }
  return {
    status: normalizeStatus(data),
    paymentMethod: data?.payment_method ?? null,
    confirmationCode: data?.confirmation_code ?? null,
    amount: typeof data?.amount === 'number' ? data.amount : null,
    raw: data,
  };
}

/** Register an IPN URL one time. Returns the notification_id to put in PESAPAL_IPN_ID. */
export async function registerIPN(ipnUrl: string): Promise<{ ipnId: string; raw: any }> {
  const token = await fetchToken();
  const res = await fetch(`${baseUrl()}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url: ipnUrl, ipn_notification_type: 'GET' }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ipn_id) {
    throw new Error(`Pesapal IPN registration failed: ${data?.message || res.status}`);
  }
  return { ipnId: data.ipn_id, raw: data };
}
