import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Bookmark, Flame, Rss } from 'lucide-react';

interface Props {
  children: ReactNode;
  mode: 'signin' | 'signup';
}

export default function AuthLayout({ children, mode }: Props) {
  return (
    <div className="w-full bg-white dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col min-h-[calc(100vh-72px)]">
      <div className="grid grid-cols-1 md:grid-cols-5 flex-1">
        {/* Brand panel — compact banner on mobile, full side panel on md+ */}
        <aside className="relative md:col-span-2 overflow-hidden flex flex-col justify-between gap-6 md:gap-0 px-5 sm:px-8 md:px-10 lg:px-12 py-7 md:py-10 lg:py-12 text-white bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-950 dark:via-indigo-950 dark:to-slate-900">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
              backgroundSize: '22px 22px',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-24 w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-fuchsia-400/20 dark:bg-indigo-400/10 blur-3xl"
          />

          <div className="relative">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-base sm:text-lg font-black tracking-tight"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
                <Sparkles size={16} className="sm:hidden" />
                <Sparkles size={18} className="hidden sm:inline" />
              </span>
              Mayobe Bros
            </Link>
          </div>

          <div className="relative max-w-md">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight mb-2 md:mb-4">
              {mode === 'signin'
                ? 'Your reading hub is waiting.'
                : 'Build your personal reading hub.'}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-white/80 mb-4 md:mb-8">
              {mode === 'signin'
                ? 'Sign in to pick up your reading streak, access your saved articles, and continue right where you left off.'
                : 'Get your own dashboard — track your daily reading streak, bookmark articles, and get a feed tailored to your interests. Free.'}
            </p>

            {/* Feature list — compact on mobile, full on md+ */}
            <ul className="hidden sm:block space-y-2.5 md:space-y-3 text-xs sm:text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/15 border border-white/20 backdrop-blur-sm flex-shrink-0">
                  <Flame size={14} />
                </span>
                <span className="text-white/90">Track your daily reading streak and stats</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/15 border border-white/20 backdrop-blur-sm flex-shrink-0">
                  <Bookmark size={14} />
                </span>
                <span className="text-white/90">Save articles and pick up where you left off</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/15 border border-white/20 backdrop-blur-sm flex-shrink-0">
                  <Rss size={14} />
                </span>
                <span className="text-white/90">Personalized feed, learning tracks &amp; job listings</span>
              </li>
            </ul>
          </div>

          <div className="relative hidden md:block text-xs text-white/60">
            &copy; {new Date().getFullYear()} Mayobe Bros &middot; All rights reserved
          </div>
        </aside>

        {/* Form panel */}
        <main className="md:col-span-3 flex items-center justify-center px-5 sm:px-8 py-8 sm:py-10 md:py-14 lg:py-16 bg-white dark:bg-gray-950">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
