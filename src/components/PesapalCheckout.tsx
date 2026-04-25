import { useEffect, useRef, useState } from 'react';
import { Loader2, Lock, RefreshCcw, AlertCircle } from 'lucide-react';
import { fetchOrderStatus } from '../hooks/usePlan';

interface Props {
  redirectUrl: string;
  orderTrackingId: string;
  amount: number;
  currency: string;
  onCompleted: () => void;
  onFailed?: (status: string) => void;
}

const POLL_INTERVAL_MS = 4_000;
const MAX_POLLS = 90; // ~6 minutes

export default function PesapalCheckout({
  redirectUrl,
  orderTrackingId,
  amount,
  currency,
  onCompleted,
  onFailed,
}: Props) {
  const [status, setStatus] = useState<'pending' | 'completed' | 'failed' | 'reversed' | 'invalid' | 'cancelled'>('pending');
  const [error, setError] = useState<string | null>(null);
  const polls = useRef(0);

  useEffect(() => {
    if (!orderTrackingId) return;
    let cancelled = false;
    polls.current = 0;

    const tick = async () => {
      if (cancelled) return;
      polls.current += 1;
      try {
        const result = await fetchOrderStatus(orderTrackingId);
        if (cancelled) return;
        if (result.status === 'completed') {
          setStatus('completed');
          onCompleted();
          return;
        }
        if (['failed', 'reversed', 'invalid', 'cancelled'].includes(result.status)) {
          setStatus(result.status as any);
          onFailed?.(result.status);
          return;
        }
        if (polls.current >= MAX_POLLS) {
          setError('Still waiting for payment confirmation. You can refresh this page after completing payment.');
          return;
        }
        timer = window.setTimeout(tick, POLL_INTERVAL_MS);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Status check failed');
        timer = window.setTimeout(tick, POLL_INTERVAL_MS * 2);
      }
    };

    let timer = window.setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [orderTrackingId, onCompleted, onFailed]);

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Lock size={13} className="text-emerald-500" />
          <span>
            Secure checkout — <span className="font-bold">{currency} {amount}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
          {status === 'pending' && (
            <>
              <Loader2 size={12} className="animate-spin" />
              Waiting for payment
            </>
          )}
          {status === 'completed' && <span className="text-emerald-600 font-bold">Paid</span>}
          {(status === 'failed' || status === 'invalid' || status === 'reversed' || status === 'cancelled') && (
            <span className="text-red-600 font-bold">Payment {status}</span>
          )}
        </div>
      </div>

      <div className="relative bg-gray-50 dark:bg-gray-950" style={{ height: 'min(720px, 80vh)' }}>
        {status === 'completed' ? (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <div>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-7 h-7">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">Payment received</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome to Premium.</p>
            </div>
          </div>
        ) : (
          <iframe
            src={redirectUrl}
            title="Pesapal checkout"
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-top-navigation"
            allow="payment *"
          />
        )}
      </div>

      {error && (
        <div className="px-4 sm:px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              polls.current = 0;
              setError(null);
              fetchOrderStatus(orderTrackingId)
                .then(r => {
                  if (r.status === 'completed') {
                    setStatus('completed');
                    onCompleted();
                  }
                })
                .catch(() => {});
            }}
            className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-amber-200 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 cursor-pointer"
          >
            <RefreshCcw size={11} />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
