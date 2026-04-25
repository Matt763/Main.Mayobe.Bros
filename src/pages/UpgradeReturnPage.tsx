import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Crown, AlertCircle, ArrowRight } from 'lucide-react';
import { fetchOrderStatus, usePlan } from '../hooks/usePlan';

/**
 * Loaded after Pesapal redirects back to your site (callback_url).
 * If shown inside the Pesapal iframe, postMessage to parent so the parent can
 * close/refresh; otherwise (full-page redirect), just confirm and route on.
 */
export default function UpgradeReturnPage() {
  const [params] = useSearchParams();
  const trackingId = params.get('OrderTrackingId') || params.get('orderTrackingId') || '';
  const { refresh } = usePlan();

  const [status, setStatus] = useState<'checking' | 'completed' | 'failed' | 'unknown'>(
    trackingId ? 'checking' : 'unknown'
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trackingId) return;
    let cancelled = false;
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      try {
        const r = await fetchOrderStatus(trackingId);
        if (cancelled) return;
        if (r.status === 'completed') {
          setStatus('completed');
          refresh();
          // If embedded inside the Pesapal iframe, notify the parent.
          try {
            window.parent?.postMessage(
              { type: 'pesapal:completed', orderTrackingId: trackingId },
              window.location.origin
            );
          } catch {}
          return;
        }
        if (['failed', 'invalid', 'reversed', 'cancelled'].includes(r.status)) {
          setStatus('failed');
          return;
        }
        if (attempts >= 30) {
          setStatus('unknown');
          return;
        }
        timer = window.setTimeout(tick, 3000);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Status check failed');
        timer = window.setTimeout(tick, 5000);
      }
    };

    let timer = window.setTimeout(tick, 1000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trackingId, refresh]);

  return (
    <div className="min-h-[60vh] bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        {status === 'checking' && (
          <>
            <Loader2 className="mx-auto animate-spin text-amber-600 mb-4" size={36} />
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
              Confirming your payment
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This usually takes a few seconds. Please don't close this page.
            </p>
          </>
        )}

        {status === 'completed' && (
          <>
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md mb-4">
              <Crown size={26} />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
              Welcome to Premium
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Your account is upgraded — unlimited saves, premium articles, and more.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors"
            >
              Go to my dashboard
              <ArrowRight size={14} />
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
              <AlertCircle size={26} />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
              Payment didn't go through
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              No charges were made. You can try again or use a different payment method.
            </p>
            <Link
              to="/upgrade"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors"
            >
              Try again
            </Link>
          </>
        )}

        {(status === 'unknown' || !trackingId) && (
          <>
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 mb-4">
              <Loader2 size={26} />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
              We're still confirming
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {trackingId
                ? "If you completed payment, your premium status will activate within a minute. Refresh your dashboard to check."
                : 'No payment was detected on this page. Head back to upgrade if you wanted to subscribe.'}
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
            >
              Go to dashboard
              <ArrowRight size={14} />
            </Link>
          </>
        )}

        {error && (
          <p className="mt-4 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
