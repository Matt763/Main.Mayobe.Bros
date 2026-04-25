import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useUserAuth } from '../../contexts/UserAuthContext';
import PremiumNavBar from '../../components/dashboard/PremiumNavBar';

const TITLES: Record<string, string> = {
  '/dashboard':               'Premium Home',
  '/dashboard/saved':         'Saved',
  '/dashboard/reading':       'Reading',
  '/dashboard/interests':     'Interests',
  '/dashboard/jobs':          'Jobs',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/account':       'Account',
  '/dashboard/settings':      'Settings',
};

export default function PremiumDashboardLayout() {
  const { publicUser, publicLoading } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!publicLoading && !publicUser) {
      const next = encodeURIComponent(location.pathname + location.search);
      navigate(`/signin?next=${next}`, { replace: true });
    }
  }, [publicLoading, publicUser, location.pathname, location.search, navigate]);

  useEffect(() => {
    const t = TITLES[location.pathname] || 'Dashboard';
    const prev = document.title;
    document.title = `${t} · Mayobe Bros Premium`;
    return () => { document.title = prev; };
  }, [location.pathname]);

  if (publicLoading || !publicUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#07091a]">
        <Loader2 className="animate-spin text-[#d4af37]" size={28} />
      </div>
    );
  }

  return (
    <div className="premium-shell relative min-h-screen bg-[#07091a] text-[#f8f5ec]">
      <style>{shellCss}</style>
      <div aria-hidden className="premium-shell-bg" />
      <div aria-hidden className="premium-shell-stars" />
      <div aria-hidden className="premium-shell-vignette" />

      <PremiumNavBar />

      <main className="relative pt-20 sm:pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const shellCss = `
.premium-shell { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
.premium-shell .font-serif,
.premium-shell .premium-display {
  font-family: 'Cormorant Garamond', 'Times New Roman', serif;
  letter-spacing: -0.012em;
}
.premium-shell-bg {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212, 175, 55, 0.10) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 100% 50%, rgba(74, 41, 122, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 0% 100%, rgba(38, 28, 78, 0.18) 0%, transparent 60%),
    linear-gradient(180deg, #07091a 0%, #0a0e25 50%, #07091a 100%);
}
.premium-shell-stars {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    radial-gradient(1px 1px at 12% 18%, #f8f5ec 60%, transparent 60%),
    radial-gradient(1px 1px at 28% 72%, #d4af37 60%, transparent 60%),
    radial-gradient(1px 1px at 38% 24%, #f8f5ec 60%, transparent 60%),
    radial-gradient(2px 2px at 56% 88%, #f8f5ec 50%, transparent 60%),
    radial-gradient(1px 1px at 71% 14%, #f8f5ec 60%, transparent 60%),
    radial-gradient(1px 1px at 82% 56%, #d4af37 60%, transparent 60%),
    radial-gradient(1px 1px at 92% 32%, #f8f5ec 60%, transparent 60%),
    radial-gradient(1px 1px at 6% 50%, #f8f5ec 60%, transparent 60%),
    radial-gradient(1px 1px at 48% 8%, #f8f5ec 60%, transparent 60%),
    radial-gradient(1px 1px at 88% 92%, #f8f5ec 60%, transparent 60%);
  opacity: 0.4;
  animation: shell-twinkle 8s ease-in-out infinite;
}
.premium-shell-vignette {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background: radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.55) 100%);
}
@keyframes shell-twinkle {
  0%, 100% { opacity: 0.30; }
  50%      { opacity: 0.55; }
}

/* Premium reading themes (toggled on body via .premium-theme-* class) */
body.premium-theme-sepia .article-content { color: #4a3825; background: #f6efe1; }
body.premium-theme-sepia .article-content p { color: #4a3825; }
body.premium-theme-midnight .article-content { color: #d8d0c2; background: #0e1224; }
body.premium-theme-midnight .article-content p { color: #d8d0c2; }

@media (prefers-reduced-motion: reduce) {
  .premium-shell-stars { animation: none !important; opacity: 0.4; }
}
`;
