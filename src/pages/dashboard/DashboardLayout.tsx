import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Loader2 } from 'lucide-react';
import { useUserAuth } from '../../contexts/UserAuthContext';
import { usePlan } from '../../hooks/usePlan';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import PremiumDashboardLayout from './PremiumDashboardLayout';

const TITLES: Record<string, string> = {
  '/dashboard':               'My Dashboard',
  '/dashboard/saved':         'Saved',
  '/dashboard/reading':       'Reading',
  '/dashboard/interests':     'Interests',
  '/dashboard/jobs':          'Jobs',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/account':       'Account & Security',
  '/dashboard/learning':      'Learning',
  '/dashboard/settings':      'Settings',
};

export default function DashboardLayout() {
  const { publicUser, publicLoading } = useUserAuth();
  const { isPremium, loading: planLoading } = usePlan();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auth gate
  useEffect(() => {
    if (!publicLoading && !publicUser) {
      const next = encodeURIComponent(location.pathname + location.search);
      navigate(`/signin?next=${next}`, { replace: true });
    }
  }, [publicLoading, publicUser, location.pathname, location.search, navigate]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Body scroll lock for drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  // Page title
  useEffect(() => {
    const t = TITLES[location.pathname] || 'Dashboard';
    const prev = document.title;
    document.title = `${t} · Mayobe Bros`;
    return () => {
      document.title = prev;
    };
  }, [location.pathname]);

  // Wait for BOTH auth and plan before deciding which layout to render. This
  // avoids briefly showing the free layout to a premium reader on /dashboard.
  if (publicLoading || planLoading || !publicUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  // Premium reader → custom nav + Outlet inside PremiumDashboardLayout.
  if (isPremium) {
    return <PremiumDashboardLayout />;
  }

  // Free reader → existing sidebar layout.
  const pageTitle = TITLES[location.pathname] || 'Dashboard';

  return (
    <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="container mx-auto px-0 lg:px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-0 lg:gap-8">
          {/* Sidebar — desktop */}
          <div className="hidden lg:block lg:py-8">
            <div className="sticky top-24 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden h-[calc(100dvh-7rem)]">
              <DashboardSidebar />
            </div>
          </div>

          {/* Main content */}
          <main className="min-w-0 px-4 sm:px-6 lg:px-0 py-6 lg:py-8">
            {/* Mobile header strip */}
            <div className="lg:hidden flex items-center justify-between mb-5">
              <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                {pageTitle}
              </h1>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open dashboard menu"
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm cursor-pointer"
              >
                <Menu size={18} />
              </button>
            </div>

            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="relative ml-auto w-[80%] max-w-[320px] h-full shadow-2xl animate-[slide-in_200ms_ease-out]">
            <DashboardSidebar isMobile onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
