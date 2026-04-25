import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import InterestsPicker from '../../components/dashboard/InterestsPicker';
import { useInterests } from '../../hooks/useInterests';

export default function InterestsPage() {
  const { selected, loading } = useInterests();

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="hidden lg:block">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
          Interests
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pick the topics you care about. We'll use these to surface stories you'll actually want to read.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-950 dark:via-indigo-950 dark:to-slate-900 text-white p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="relative flex items-start gap-4">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex-shrink-0">
            <Sparkles size={20} />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-black tracking-tight mb-1">
              Personalize your feed
            </h2>
            <p className="text-sm text-white/80">
              Tap any topic to follow or unfollow it. Your "For you" row on the dashboard updates instantly.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">
          Your interests
        </h3>
        <InterestsPicker />
      </section>

      {!loading && selected.length > 0 && (
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          See your feed
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
