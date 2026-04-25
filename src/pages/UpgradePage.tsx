import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Loader2, AlertCircle, Bookmark, BookOpen, Bell, Sparkles, Lock, ShieldCheck,
} from 'lucide-react';
import { useUserAuth } from '../contexts/UserAuthContext';
import { usePlan, startCheckout, type CheckoutResult } from '../hooks/usePlan';
import PesapalCheckout from '../components/PesapalCheckout';

const FEATURES = [
  { icon: Bookmark, label: 'Unlimited saved articles',     sub: 'Save anything. Forever.' },
  { icon: BookOpen, label: 'Unlimited reading history',    sub: 'Every story you read, kept.' },
  { icon: Lock,     label: 'Premium articles',             sub: 'Exclusive deep-dive coverage.' },
  { icon: Sparkles, label: 'Personalized recommendations', sub: 'Tuned to your interests.' },
  { icon: Bell,     label: 'Priority notifications',       sub: 'Hear it first.' },
];

export default function UpgradePage() {
  const { publicUser, publicLoading } = useUserAuth();
  const navigate = useNavigate();
  const { plan, isPremium, refresh } = usePlan();
  const [phone, setPhone] = useState('');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutResult | null>(null);

  // Page-scoped Google Fonts: only fetched when /upgrade is visited.
  useEffect(() => {
    const head = document.head;
    const links = [
      Object.assign(document.createElement('link'), {
        rel: 'preconnect', href: 'https://fonts.googleapis.com',
      }),
      Object.assign(document.createElement('link'), {
        rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous',
      }),
      Object.assign(document.createElement('link'), {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap',
      }),
    ];
    links.forEach(l => head.appendChild(l));
    return () => {
      links.forEach(l => { try { head.removeChild(l); } catch { /* noop */ } });
    };
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Upgrade to Premium · Mayobe Bros';
    return () => { document.title = prev; };
  }, []);

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
      <div className="min-h-[60vh] flex items-center justify-center bg-[#07091a]">
        <Loader2 className="animate-spin text-[#d4af37]" size={28} />
      </div>
    );
  }

  return (
    <div className="upgrade-atelier relative min-h-screen overflow-hidden bg-[#07091a] text-[#f8f5ec]">
      <style>{atelierCss}</style>

      {/* Background layers */}
      <div aria-hidden className="atelier-bg" />
      <div aria-hidden className="atelier-stars" />
      <div aria-hidden className="atelier-vignette" />

      <div className="relative">
        {/* HERO */}
        <section className="container mx-auto px-4 sm:px-6 max-w-5xl pt-14 sm:pt-24 pb-10 sm:pb-14 text-center">
          <div className="atelier-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/[0.05] mb-6 sm:mb-8">
            <Sparkles size={11} className="text-[#e8c468]" />
            <span className="text-[10px] tracking-[0.28em] uppercase font-medium text-[#e8c468]">
              An Invitation
            </span>
          </div>

          <div className="relative inline-block mb-7 sm:mb-9 atelier-fade-in">
            <span className="atelier-halo" aria-hidden />
            <span className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-[#d4af37]/40 bg-gradient-to-b from-[#1a1438] to-[#0a0a1a]">
              <Crown size={32} className="text-[#e8c468]" strokeWidth={1.4} />
            </span>
          </div>

          <h1 className="atelier-display atelier-fade-in text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight italic font-medium leading-[1.05] mb-5">
            {isPremium ? (
              <><span className="text-[#e8c468]">Welcome,</span> Premium reader</>
            ) : (
              <>A small price for <span className="atelier-shimmer">everything</span></>
            )}
          </h1>
          <p className="atelier-fade-in text-sm sm:text-base text-[#a8a8b8] max-w-xl mx-auto leading-relaxed px-4">
            {isPremium
              ? 'Thank you for supporting independent journalism. The full archive is yours.'
              : 'One-time payment. Lifetime access. No subscription, no auto-renew.'}
          </p>

          <div className="atelier-divider mt-9 sm:mt-12" aria-hidden />
        </section>

        {/* PRICING + PANEL */}
        <section className="container mx-auto px-4 sm:px-6 max-w-5xl pb-14 sm:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Pricing card */}
            <aside className="lg:col-span-2 atelier-fade-in">
              <div className="atelier-card relative rounded-2xl p-6 sm:p-8">
                <div className="atelier-card-frame" aria-hidden />
                <p className="text-[10px] tracking-[0.32em] uppercase font-medium text-[#e8c468] mb-5">
                  Premium · One-time
                </p>

                <div className="flex items-start gap-1.5 mb-1">
                  <span className="atelier-display text-2xl sm:text-3xl text-[#d4af37] leading-none mt-3 sm:mt-4">$</span>
                  <span className="atelier-display text-7xl sm:text-8xl font-medium leading-[0.85] text-[#f8f5ec]">
                    5
                  </span>
                  <div className="flex flex-col mt-3 ml-1.5">
                    <span className="text-[9px] sm:text-[10px] tracking-[0.28em] uppercase text-[#a8a8b8]">USD</span>
                    <span className="text-[9px] sm:text-[10px] tracking-[0.28em] uppercase text-[#d4af37] mt-0.5">forever</span>
                  </div>
                </div>
                <p className="text-xs text-[#7a7a90] mb-6 mt-1">
                  Pay once. Read for life. Cancel any time — there's nothing to cancel.
                </p>

                <div className="atelier-hairline mb-6" aria-hidden />

                <ul className="space-y-3.5 mb-7">
                  {FEATURES.map(f => {
                    const Icon = f.icon;
                    return (
                      <li key={f.label} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/[0.06] text-[#e8c468] flex-shrink-0">
                          <Icon size={11} strokeWidth={1.6} />
                        </span>
                        <span className="text-sm leading-snug text-[#f8f5ec]">{f.label}</span>
                      </li>
                    );
                  })}
                </ul>

                {isPremium ? (
                  <div className="rounded-xl border border-[#d4af37]/35 bg-[#d4af37]/[0.05] px-4 py-3.5 text-sm text-[#e8c468] flex items-start gap-2.5">
                    <Crown size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Premium active</p>
                      {plan?.upgradedAt && (
                        <p className="text-xs opacity-70 mt-0.5">
                          Since {new Date(plan.upgradedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ) : checkout ? (
                  <p className="text-xs text-[#a8a8b8] leading-relaxed">
                    Complete payment in the panel on the right. Your account upgrades the moment Pesapal confirms.
                  </p>
                ) : (
                  <>
                    <label className="block mb-4">
                      <span className="block text-[10px] tracking-[0.22em] uppercase font-medium text-[#a8a8b8] mb-2">
                        Phone <span className="opacity-60 normal-case tracking-normal">(optional, for M-Pesa)</span>
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+254 7XX XXX XXX"
                        autoComplete="tel"
                        className="w-full bg-white/[0.03] border border-white/10 focus:border-[#d4af37]/60 rounded-xl px-4 py-3 text-sm text-[#f8f5ec] placeholder:text-[#52526a] focus:outline-none focus:ring-1 focus:ring-[#d4af37]/30 transition-colors"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleStart}
                      disabled={starting}
                      className="atelier-cta w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full text-[12px] sm:text-[13px] tracking-[0.18em] uppercase font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {starting ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} strokeWidth={2} />}
                      <span>{starting ? 'Starting…' : 'Unlock Lifetime'}</span>
                    </button>
                    <p className="mt-4 text-[9px] sm:text-[10px] tracking-[0.22em] uppercase text-[#7a7a90] text-center">
                      M-Pesa · Tigo Pesa · Airtel · Visa · Mastercard
                    </p>
                  </>
                )}

                {error && (
                  <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-3 text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </aside>

            {/* Right panel — checkout iframe OR Why Premium */}
            <main className="lg:col-span-3 atelier-fade-in">
              {checkout && !isPremium ? (
                <div className="atelier-card rounded-2xl p-2 sm:p-3 overflow-hidden">
                  <PesapalCheckout
                    redirectUrl={checkout.redirectUrl}
                    orderTrackingId={checkout.orderTrackingId}
                    amount={checkout.amount}
                    currency={checkout.currency}
                    onCompleted={() => refresh()}
                    onFailed={() => refresh()}
                  />
                </div>
              ) : (
                <div className="atelier-card relative rounded-2xl p-7 sm:p-10 h-full">
                  <div className="atelier-card-frame" aria-hidden />

                  <div className="flex items-stretch gap-5 mb-6">
                    <div className="atelier-rule-vert" aria-hidden />
                    <div>
                      <p className="text-[10px] tracking-[0.32em] uppercase font-medium text-[#e8c468] mb-2">
                        Why Premium
                      </p>
                      <h2 className="atelier-display text-3xl sm:text-4xl italic text-[#f8f5ec] tracking-tight leading-[1.1] mb-3">
                        Reading, restored.
                      </h2>
                      <p className="text-sm text-[#a8a8b8] leading-relaxed max-w-md">
                        Mayobe Bros runs on reader support. Premium removes every limit on the free
                        tier and helps us keep journalism independent and ad-light. Pay once. Read forever.
                      </p>
                    </div>
                  </div>

                  <div className="atelier-hairline my-6 sm:my-7" aria-hidden />

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    {FEATURES.map(f => {
                      const Icon = f.icon;
                      return (
                        <li key={f.label} className="atelier-feature flex items-start gap-3.5">
                          <span className="mt-0.5 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/[0.05] text-[#e8c468] flex-shrink-0">
                            <Icon size={14} strokeWidth={1.6} />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-[#f8f5ec] leading-tight mb-1">
                              {f.label}
                            </p>
                            <p className="text-xs text-[#7a7a90] leading-snug">{f.sub}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="atelier-hairline my-6 sm:my-7" aria-hidden />

                  <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase text-[#7a7a90]">
                    <ShieldCheck size={12} className="text-[#d4af37]/70 flex-shrink-0" />
                    <span>Secured by PesaPal — we never see your card.</span>
                  </div>
                </div>
              )}
            </main>
          </div>

          {!checkout && !isPremium && (
            <div className="mt-12 sm:mt-16 text-center">
              <div className="atelier-divider mx-auto mb-5" aria-hidden />
              <p className="text-[10px] tracking-[0.32em] uppercase font-medium text-[#7a7a90]">
                Independent journalism · Reader-supported since day one
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const atelierCss = `
.upgrade-atelier { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
.upgrade-atelier .atelier-display {
  font-family: 'Cormorant Garamond', 'Times New Roman', serif;
  letter-spacing: -0.012em;
  font-feature-settings: 'lnum' 1, 'kern' 1;
}

.atelier-bg {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212, 175, 55, 0.10) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 100% 50%, rgba(74, 41, 122, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 0% 100%, rgba(38, 28, 78, 0.20) 0%, transparent 60%),
    linear-gradient(180deg, #07091a 0%, #0a0e25 50%, #07091a 100%);
}
.atelier-vignette {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%);
}
.atelier-stars {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    radial-gradient(1px 1px at 12% 18%, #f8f5ec 60%, transparent 60%),
    radial-gradient(1px 1px at 28% 72%, #d4af37 60%, transparent 60%),
    radial-gradient(1px 1px at 38% 24%, #f8f5ec 60%, transparent 60%),
    radial-gradient(2px 2px at 56% 88%, #f8f5ec 50%, transparent 60%),
    radial-gradient(1px 1px at 71% 14%, #f8f5ec 60%, transparent 60%),
    radial-gradient(1px 1px at 82% 56%, #d4af37 60%, transparent 60%),
    radial-gradient(1px 1px at 92% 32%, #f8f5ec 60%, transparent 60%),
    radial-gradient(2px 2px at 6% 50%, #f8f5ec 50%, transparent 60%),
    radial-gradient(1px 1px at 48% 8%, #f8f5ec 60%, transparent 60%),
    radial-gradient(1px 1px at 68% 78%, #f8f5ec 60%, transparent 60%),
    radial-gradient(1px 1px at 22% 42%, #d4af37 60%, transparent 60%),
    radial-gradient(1px 1px at 88% 92%, #f8f5ec 60%, transparent 60%);
  opacity: 0.5;
  animation: atelier-twinkle 6s ease-in-out infinite;
}
@keyframes atelier-twinkle {
  0%, 100% { opacity: 0.38; }
  50%      { opacity: 0.70; }
}

.atelier-fade-in { animation: atelier-fade 700ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.atelier-fade-in:nth-child(2) { animation-delay: 80ms; }
.atelier-fade-in:nth-child(3) { animation-delay: 160ms; }
@keyframes atelier-fade {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

.atelier-halo {
  position: absolute; inset: -16px; border-radius: 9999px;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.32) 0%, rgba(212, 175, 55, 0.06) 50%, transparent 70%);
  filter: blur(10px);
  animation: atelier-halo 4.5s ease-in-out infinite;
}
@keyframes atelier-halo {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%      { opacity: 1.0; transform: scale(1.08); }
}

.atelier-shimmer {
  background: linear-gradient(90deg, #d4af37 0%, #f4d97a 25%, #ffffff 50%, #f4d97a 75%, #d4af37 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: atelier-shimmer 5s linear infinite;
}
@keyframes atelier-shimmer { to { background-position: 200% center; } }

.atelier-divider {
  width: 72px; height: 1px;
  background: linear-gradient(90deg, transparent, #d4af37 50%, transparent);
}
.atelier-hairline {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.30) 50%, transparent);
}
.atelier-rule-vert {
  width: 2px;
  align-self: stretch;
  min-height: 96px;
  background: linear-gradient(180deg, #d4af37 0%, rgba(212, 175, 55, 0.10) 100%);
  border-radius: 1px;
  flex-shrink: 0;
}

.atelier-card {
  background:
    linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 100%);
  border: 1px solid rgba(212, 175, 55, 0.18);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow:
    0 30px 60px -30px rgba(0,0,0,0.7),
    inset 0 1px 0 rgba(255,255,255,0.05);
  transition: transform 360ms cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 360ms ease,
              border-color 360ms ease;
}
.atelier-card:hover {
  transform: translateY(-2px);
  border-color: rgba(212, 175, 55, 0.32);
  box-shadow:
    0 40px 80px -30px rgba(0,0,0,0.8),
    0 0 0 1px rgba(212, 175, 55, 0.18),
    inset 0 1px 0 rgba(255,255,255,0.07);
}
.atelier-card-frame {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(135deg,
    rgba(212, 175, 55, 0.55) 0%,
    rgba(212, 175, 55, 0.10) 25%,
    transparent 50%,
    rgba(212, 175, 55, 0.10) 75%,
    rgba(212, 175, 55, 0.55) 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  padding: 1px;
  opacity: 0.6;
}

.atelier-cta {
  background: linear-gradient(180deg, #e8c468 0%, #c89c2c 100%);
  color: #0a0a1a;
  border: 1px solid rgba(255, 224, 130, 0.55);
  box-shadow:
    0 14px 32px -14px rgba(212, 175, 55, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
  transition: transform 220ms ease, box-shadow 220ms ease, filter 220ms ease;
}
.atelier-cta:hover:not(:disabled) {
  filter: brightness(1.06);
  transform: translateY(-1px);
  box-shadow:
    0 18px 38px -14px rgba(212, 175, 55, 0.7),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
}
.atelier-cta:active:not(:disabled) { transform: translateY(0); filter: brightness(0.98); }

.atelier-feature { transition: transform 280ms ease; }
.atelier-feature:hover { transform: translateX(2px); }

@media (prefers-reduced-motion: reduce) {
  .atelier-stars,
  .atelier-fade-in,
  .atelier-halo,
  .atelier-shimmer,
  .atelier-feature,
  .atelier-card { animation: none !important; transition: none !important; }
  .atelier-stars { opacity: 0.45; }
}
`;
