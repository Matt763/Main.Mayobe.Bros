import { Link } from 'react-router-dom';
import { Bookmark, BookOpen, Flame, ArrowRight, Sparkles } from 'lucide-react';
import { useUserAuth } from '../../contexts/UserAuthContext';
import { useSavedPostsList } from '../../hooks/useSavedPosts';
import { useReadingHistory, useReadingStats } from '../../hooks/useReadingTracking';
import { useRecommendations } from '../../hooks/useInterests';
import { useDashboardSettings } from '../../hooks/useDashboardSettings';
import { usePlan } from '../../hooks/usePlan';
import { lazy, Suspense } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import SavedPostCard from '../../components/dashboard/SavedPostCard';
import ReadingHistoryCard from '../../components/dashboard/ReadingHistoryCard';
import RecommendationCard from '../../components/dashboard/RecommendationCard';
import EmptyState from '../../components/dashboard/EmptyState';

const PremiumDashboardHome = lazy(() => import('./PremiumDashboardHome'));

export default function DashboardHome() {
  const { publicUser } = useUserAuth();
  const { items: saved, loading: savedLoading, remove } = useSavedPostsList();
  const { items: history, loading: historyLoading } = useReadingHistory(4);
  const { items: recs, loading: recsLoading, hasInterests } = useRecommendations(6);
  const stats = useReadingStats();
  const { config: dashConfig } = useDashboardSettings();
  const { isPremium, loading: planLoading } = usePlan();
  if (!planLoading && isPremium) {
    return (
      <Suspense fallback={<div className="py-20 text-center text-sm text-gray-400">Loading premium…</div>}>
        <PremiumDashboardHome />
      </Suspense>
    );
  }
  const showStats        = dashConfig.features.userStats;
  const showRecommended  = dashConfig.features.personalizedFeed && dashConfig.layout.sectionVisibility.recommended;
  const showSaved        = dashConfig.features.savedContent     && dashConfig.layout.sectionVisibility.saved;
  const showReading      = dashConfig.features.userStats;

  const recentSaved = saved.slice(0, 3);
  const continueReading = history.slice(0, 4);
  const firstName = publicUser?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-8">
      {/* Greeting card */}
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
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/80 mb-3">
            <Sparkles size={14} />
            My Dashboard
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2">
            Welcome back, {firstName}.
          </h1>
          <p className="text-sm sm:text-base text-white/85 max-w-xl">
            {stats.articlesRead === 0
              ? "Pick up where you left off, or save something new for later. Your activity will start showing up here as you read."
              : `You've read ${stats.articlesRead} ${stats.articlesRead === 1 ? 'article' : 'articles'}${
                  stats.streakDays > 0 ? ` and you're on a ${stats.streakDays}-day streak.` : '.'
                }`}
          </p>
        </div>
      </section>

      {/* Stats */}
      {showStats && (
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon={Bookmark}
          label="Saved articles"
          value={savedLoading ? '—' : saved.length}
          accent="blue"
          loading={savedLoading}
        />
        <StatCard
          icon={BookOpen}
          label="Articles read"
          value={stats.articlesRead}
          hint={
            stats.articlesRead === 0
              ? 'Spend 15+ seconds on a post to count it'
              : undefined
          }
          accent="indigo"
          loading={stats.loading}
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={`${stats.streakDays}d`}
          hint={
            stats.streakDays === 0
              ? 'Read today to start a streak'
              : stats.streakDays === 1
              ? 'Come back tomorrow to keep it alive'
              : `Keep going!`
          }
          accent="amber"
          loading={stats.loading}
        />
      </section>
      )}

      {/* For you */}
      {showRecommended && (
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">For you</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fresh articles from the topics you follow.
            </p>
          </div>
          <Link
            to="/dashboard/interests"
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Edit interests
            <ArrowRight size={14} />
          </Link>
        </div>

        {recsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
              >
                <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasInterests ? (
          <EmptyState
            icon={Sparkles}
            title="Pick what you're into"
            description="Select a few topics and we'll surface the latest stories you'll actually want to read."
            action={
              <Link
                to="/dashboard/interests"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                Choose interests
                <ArrowRight size={14} />
              </Link>
            }
          />
        ) : recs.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No new articles yet"
            description="We didn't find fresh posts in your interest categories. Try adding more topics or check back later."
            action={
              <Link
                to="/dashboard/interests"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Manage interests
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recs.map(item => (
              <RecommendationCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
      )}

      {/* Continue reading */}
      {showReading && (
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Continue reading</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pick up where you left off.
            </p>
          </div>
          {history.length > 0 && (
            <Link
              to="/dashboard/reading"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View history
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {historyLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1].map(i => (
              <div
                key={i}
                className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
              />
            ))}
          </div>
        ) : continueReading.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No reading history yet"
            description="As you read articles, they'll appear here so you can come back to them anytime."
            action={
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                Find something to read
                <ArrowRight size={14} />
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {continueReading.map(item => (
              <ReadingHistoryCard key={item.post_id} item={item} variant="compact" />
            ))}
          </div>
        )}
      </section>
      )}

      {/* Recently saved */}
      {showSaved && (
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recently saved</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              The latest stories you've bookmarked.
            </p>
          </div>
          {saved.length > 0 && (
            <Link
              to="/dashboard/saved"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {savedLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
              >
                <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : recentSaved.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="Nothing saved yet"
            description="Tap the bookmark icon on any article to save it here for later."
            action={
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                Browse articles
                <ArrowRight size={14} />
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSaved.map(item => (
              <SavedPostCard key={item.post_id} item={item} onRemove={remove} />
            ))}
          </div>
        )}
      </section>
      )}
    </div>
  );
}
