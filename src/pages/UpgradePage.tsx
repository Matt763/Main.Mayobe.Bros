import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Check, Loader2, AlertCircle, Bookmark, BookOpen, Bell, Sparkles, Lock,
} from 'lucide-react';
import { useUserAuth } from '../contexts/UserAuthContext';
import { usePlan, startCheckout, type CheckoutResult } from '../hooks/usePlan';
import PesapalCheckout from '../components/PesapalCheckout';

const FEATURES = [
  { icon: Bookmark, label: 'Unlimited saved articles' },
  { icon: BookOpen, label: 'Unlimited reading history' },
  { icon: Lock,     label: 'Premium articles' },
  { icon: Sparkles, label: 'Personalized recommendations' },
  { icon: Bell,     label: 'Priority notifications' },
];

export default function UpgradePage() {
  const { publicUser, publicLoading } = useUserAuth();
  const navigate = useNavigate();
  const { plan, isPremium, refresh } = usePlan();
  const [phone, setPhone] = useState('');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutResult | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Upgrade to Premium · Mayobe Bros';
    return () => {
      document.title = prev;
    };
  }, []);

  // Auth gate
  useEffect(() => {
    if (!publicLoading && !publicUser) {
      navigate('/signin?next=/upgrade', { replace: true });
    }
  }, [publicLoading, publicUser, navigate]);

  const handleStart = async () => {
    setError(null);
    setStarting(true);
    try {
      const result = await startCheckout(phone);
      setCheckout(result);
    } catch (e: any) {
      setError(e?.message || 'Failed to start checkout');
    } finally {
      setStarting(false);
    }
  };

  if (publicLoading || !publicUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-[60vh]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 dark:from-amber-900 dark:via-orange-950 dark:to-rose-950 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="relative container mx-auto px-4 sm:px-6 max-w-5xl py-12 sm:py-16 text-center">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 mb-4">
            <Crown size={26} />
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
            {isPremium ? "You're already Premium" : 'Get Mayobe Bros Premium'}
          </h1>
          <p className="text-sm sm:text-base text-white/85 max-w-xl mx-auto">
            {isPremium
              ? 'Thanks for supporting independent journalism. Enjoy unlimited access.'
              : 'Unlock everything for one flat price. No subscriptions, no surprises.'}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl -mt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Pricing card */}
          <aside className="lg:col-span-2">
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md p-6 sm:p-7">
              <p className="text-[11px] uppercase tracking-widest font-bold text-amber-600 dark:text-amber-400 mb-2">
                Premium · One-time
              </p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
                  $5
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">forever</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                Single payment. Lifetime access. No auto-renew.
              </p>

              <ul id="features" className="space-y-2.5 mb-6">
                {FEATURES.map(f => {
                  const Icon = f.icon;
                  return (
                    <li key={f.label} className="flex items-center gap-2.5 text-sm">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
                        <Icon size={13} className="text-amber-500 flex-shrink-0" />
                        {f.label}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {isPremium ? (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                  <Crown size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Premium active</p>
                    {plan?.upgradedAt && (
                      <p className="text-xs opacity-80">
                        Since {new Date(plan.upgradedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ) : checkout ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Complete payment in the panel on the right. We'll upgrade your account
                  automatically once it clears.
                </p>
              ) : (
                <>
                  <label className="block mb-3">
                    <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Phone (for M-Pesa, optional)
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={starting}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
                  >
                    {starting ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} />}
                    {starting ? 'Starting checkout…' : 'Upgrade with Pesapal'}
                  </button>
                  <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400 text-center">
                    Pay with M-Pesa, Tigo Pesa, Airtel Money, or Visa/Mastercard.
                  </p>
                </>
              )}

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </aside>

          {/* Checkout / hero info */}
          <main className="lg:col-span-3">
            {checkout && !isPremium ? (
              <PesapalCheckout
                redirectUrl={checkout.redirectUrl}
                orderTrackingId={checkout.orderTrackingId}
                amount={checkout.amount}
                currency={checkout.currency}
                onCompleted={() => {
                  refresh();
                }}
                onFailed={() => {
                  refresh();
                }}
              />
            ) : (
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
                <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white mb-3">
                  Why go Premium?
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Mayobe Bros runs on reader support. Premium removes the limits on the free tier
                  and helps us keep journalism independent and ad-light.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FEATURES.map(f => {
                    const Icon = f.icon;
                    return (
                      <li
                        key={f.label}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                      >
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex-shrink-0">
                          <Icon size={14} />
                        </span>
                        <span className="text-sm text-gray-800 dark:text-gray-200">
                          {f.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-5">
                  Your payment is processed by Pesapal. We never see or store your card details.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
