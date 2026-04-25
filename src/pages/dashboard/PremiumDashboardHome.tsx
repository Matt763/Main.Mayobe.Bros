import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown, Sparkles, BookOpen, Flame, ArrowRight, Bookmark, Wand2, Loader2, AlertCircle,
  Sun, Moon, Coffee, Check, Bell,
} from 'lucide-react';
import { useUserAuth } from '../../contexts/UserAuthContext';
import { useSavedPostsList } from '../../hooks/useSavedPosts';
import { useReadingHistory, useReadingStats } from '../../hooks/useReadingTracking';
import { useRecommendations } from '../../hooks/useInterests';
import { supabase } from '../../lib/supabase';

type ReadingTheme = 'default' | 'sepia' | 'midnight';

const READING_THEME_KEY = 'mayobe.premium.readingTheme';

async function authedFetch(path: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const headers = new Headers(init?.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(path, { ...init, headers, credentials: 'include' });
}

export default function PremiumDashboardHome() {
  const { publicUser } = useUserAuth();
  const { items: saved, loading: savedLoading } = useSavedPostsList();
  const { items: history } = useReadingHistory(4);
  const { items: recs, hasInterests } = useRecommendations(6);
  const stats = useReadingStats();
  const firstName = publicUser?.name?.split(' ')[0] || 'reader';

  return (
    <div className="space-y-8 pb-12">
      {/* Hero greeting */}
      <section className="premium-fade-in">
        <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/[0.05] mb-4">
          <Crown size={11} className="text-[#e8c468]" />
          <span className="text-[10px] tracking-[0.28em] uppercase font-medium text-[#e8c468]">Premium Reader</span>
        </p>
        <h1 className="premium-display text-4xl sm:text-5xl md:text-6xl italic font-medium text-[#f8f5ec] tracking-tight leading-[1.05] mb-3">
          Welcome back, <span className="text-[#e8c468]">{firstName}</span>.
        </h1>
        <p className="text-sm sm:text-base text-[#a8a8b8] max-w-2xl leading-relaxed">
          {stats.articlesRead === 0
            ? 'Your private library awaits. Read deep, save what matters, and let our AI summarize anything in three lines.'
            : `You've read ${stats.articlesRead} ${stats.articlesRead === 1 ? 'article' : 'articles'}${
                stats.streakDays > 1 ? ` on a ${stats.streakDays}-day streak` : ''
              }. Keep going.`}
        </p>
      </section>

      {/* Top row: streak ring + AI summary */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <StreakRing streakDays={stats.streakDays} articlesRead={stats.articlesRead} loading={stats.loading} />
        <div className="lg:col-span-2">
          <AISummaryWidget />
        </div>
      </section>

      {/* Reading themes */}
      <ReadingThemeSwitcher />

      {/* For you */}
      {hasInterests && recs.length > 0 && (
        <section className="premium-fade-in">
          <div className="flex items-end justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="atelier-rule" aria-hidden />
              <div>
                <p className="text-[10px] tracking-[0.32em] uppercase font-medium text-[#e8c468] mb-1">Curated for you</p>
                <h2 className="premium-display text-2xl sm:text-3xl italic text-[#f8f5ec]">From the topics you follow</h2>
              </div>
            </div>
            <Link to="/dashboard/interests" className="hidden sm:inline-flex items-center gap-1 text-sm text-[#e8c468] hover:text-[#f4d97a] transition-colors">
              Tune
              <ArrowRight size={12} />
            </Link>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recs.slice(0, 6).map(item => <PremiumPostCard key={item.id} item={item} />)}
          </ul>
        </section>
      )}

      {/* Recently saved */}
      <section className="premium-fade-in">
        <div className="flex items-end justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="atelier-rule" aria-hidden />
            <div>
              <p className="text-[10px] tracking-[0.32em] uppercase font-medium text-[#e8c468] mb-1">Your library</p>
              <h2 className="premium-display text-2xl sm:text-3xl italic text-[#f8f5ec]">Recently saved</h2>
            </div>
          </div>
          {saved.length > 0 && (
            <Link to="/dashboard/saved" className="hidden sm:inline-flex items-center gap-1 text-sm text-[#e8c468] hover:text-[#f4d97a] transition-colors">
              View all
              <ArrowRight size={12} />
            </Link>
          )}
        </div>
        {savedLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="atelier-card rounded-2xl h-44 bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : saved.length === 0 ? (
          <EmptyState icon={Bookmark} title="No saved articles yet" description="Bookmark anything from the front page — it shows up here." />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {saved.slice(0, 3).map((item: any) => <PremiumSavedCard key={item.post_id} item={item} />)}
          </ul>
        )}
      </section>

      {/* Continue reading */}
      {history.length > 0 && (
        <section className="premium-fade-in">
          <div className="flex items-end justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="atelier-rule" aria-hidden />
              <div>
                <p className="text-[10px] tracking-[0.32em] uppercase font-medium text-[#e8c468] mb-1">Where you left off</p>
                <h2 className="premium-display text-2xl sm:text-3xl italic text-[#f8f5ec]">Continue reading</h2>
              </div>
            </div>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.slice(0, 4).map((item: any) => (
              <li key={item.post_id} className="atelier-card rounded-2xl p-4 flex items-center gap-4">
                {item.posts?.cover_image && (
                  <img src={item.posts.cover_image} alt="" className="w-20 h-20 rounded-xl object-cover ring-1 ring-[#d4af37]/20" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] tracking-[0.22em] uppercase text-[#7a7a90] mb-1">Article</p>
                  <Link to={`/posts/${item.posts?.slug || ''}`} className="font-serif italic text-base text-[#f8f5ec] hover:text-[#e8c468] line-clamp-2 transition-colors">
                    {item.posts?.title || 'Untitled'}
                  </Link>
                </div>
                <ArrowRight size={14} className="text-[#a8a8b8] flex-shrink-0" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <PremiumStyles />
    </div>
  );
}

// ─── Streak ring (gold animated SVG) ─────────────────────────────────────────

function StreakRing({ streakDays, articlesRead, loading }: { streakDays: number; articlesRead: number; loading: boolean }) {
  const target = 30;
  const pct = Math.min(1, Math.max(0, streakDays / target));
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - pct);

  return (
    <div className="atelier-card rounded-2xl p-6 flex flex-col items-center justify-center min-h-[260px] premium-fade-in">
      <p className="text-[10px] tracking-[0.32em] uppercase font-medium text-[#e8c468] mb-3">Reading streak</p>
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id="streakGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"  stopColor="#d4af37" />
              <stop offset="50%" stopColor="#f4d97a" />
              <stop offset="100%" stopColor="#d4af37" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="54" stroke="rgba(212,175,55,0.12)" strokeWidth="6" fill="none" />
          <circle
            cx="60" cy="60" r="54"
            stroke="url(#streakGold)" strokeWidth="6" strokeLinecap="round" fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={loading ? circumference : offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Flame size={14} className="text-[#e8c468] mb-1" />
          <span className="premium-display text-3xl text-[#f8f5ec] leading-none">{streakDays}</span>
          <span className="text-[10px] tracking-[0.22em] uppercase text-[#a8a8b8] mt-1">{streakDays === 1 ? 'day' : 'days'}</span>
        </div>
      </div>
      <p className="text-xs text-[#a8a8b8] text-center mt-4 leading-snug">
        {articlesRead === 0
          ? 'Read an article today to start your streak'
          : streakDays === 0
            ? 'Read today to keep your streak alive'
            : `${Math.max(0, target - streakDays)} days to your next milestone`}
      </p>
    </div>
  );
}

// ─── AI Summary widget (Premium feature) ─────────────────────────────────────

function AISummaryWidget() {
  const [input, setInput] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summarize = async () => {
    setError(null); setBullets([]); setBusy(true);
    try {
      const trimmed = input.trim();
      const isSlug = /^[a-z0-9][a-z0-9-]{2,}$/i.test(trimmed) && trimmed.length < 200;
      const body = isSlug ? { postSlug: trimmed } : { content: trimmed };
      const res = await authedFetch('/api/ai-reader/summarize', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Summary failed');
      setBullets(Array.isArray(data.bullets) && data.bullets.length ? data.bullets : (data.summary ? [data.summary] : []));
    } catch (e: any) {
      setError(e?.message || 'Could not summarize');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="atelier-card rounded-2xl p-6 premium-fade-in h-full flex flex-col">
      <div className="flex items-start gap-3 mb-4">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#d4af37]/40 bg-gradient-to-b from-[#1a1438] to-[#0a0a1a]">
          <Wand2 size={16} className="text-[#e8c468]" />
        </span>
        <div className="flex-1">
          <p className="text-[10px] tracking-[0.32em] uppercase font-medium text-[#e8c468]">Premium · AI</p>
          <h2 className="premium-display text-xl italic text-[#f8f5ec]">Summarize an article</h2>
          <p className="text-xs text-[#a8a8b8] mt-1 leading-snug">Paste a Mayobe Bros article slug, URL, or text. Get three crisp bullets.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="article-slug-here  or paste text"
            className="flex-1 bg-white/[0.03] border border-[#d4af37]/20 focus:border-[#d4af37]/60 rounded-xl px-4 py-2.5 text-sm text-[#f8f5ec] placeholder:text-[#52526a] focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={summarize}
            disabled={busy || input.trim().length < 3}
            className="atelier-cta-gold inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {busy ? 'Reading…' : 'Summarize'}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {bullets.length > 0 && (
          <ul className="space-y-2.5 mt-1">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 premium-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[#e8c468] flex-shrink-0" />
                <p className="text-sm text-[#f8f5ec] leading-relaxed">{b}</p>
              </li>
            ))}
          </ul>
        )}

        {!busy && bullets.length === 0 && !error && (
          <div className="flex-1 grid place-items-center text-[11px] text-[#52526a] text-center px-4">
            Tip: try the slug of any article you've recently read.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reading theme switcher ──────────────────────────────────────────────────

function ReadingThemeSwitcher() {
  const [theme, setTheme] = useState<ReadingTheme>('default');

  useEffect(() => {
    const saved = (localStorage.getItem(READING_THEME_KEY) as ReadingTheme | null) || 'default';
    apply(saved);
    setTheme(saved);
  }, []);

  const apply = (t: ReadingTheme) => {
    document.body.classList.remove('premium-theme-sepia', 'premium-theme-midnight');
    if (t !== 'default') document.body.classList.add(`premium-theme-${t}`);
    localStorage.setItem(READING_THEME_KEY, t);
  };

  const choose = (t: ReadingTheme) => { setTheme(t); apply(t); };

  const themes: { key: ReadingTheme; icon: any; label: string; preview: string }[] = [
    { key: 'default',  icon: Sun,    label: 'Daylight',  preview: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)' },
    { key: 'sepia',    icon: Coffee, label: 'Sepia',     preview: 'linear-gradient(135deg, #f6efe1 0%, #e8d9b6 100%)' },
    { key: 'midnight', icon: Moon,   label: 'Midnight',  preview: 'linear-gradient(135deg, #0e1224 0%, #1a1a3a 100%)' },
  ];

  return (
    <section className="atelier-card rounded-2xl p-5 premium-fade-in">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1">
          <p className="text-[10px] tracking-[0.32em] uppercase font-medium text-[#e8c468] mb-1">Premium · Personalize</p>
          <h2 className="premium-display text-xl italic text-[#f8f5ec]">Reading theme</h2>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {themes.map(t => {
          const active = theme === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => choose(t.key)}
              className={
                'relative rounded-xl p-3 text-left border transition-all ' +
                (active
                  ? 'border-[#d4af37]/60 bg-[#d4af37]/[0.06]'
                  : 'border-[#d4af37]/15 hover:border-[#d4af37]/35 bg-white/[0.02]')
              }
            >
              <span className="block w-full h-10 rounded-md mb-2 ring-1 ring-[#d4af37]/20" style={{ background: t.preview }} />
              <div className="flex items-center gap-1.5">
                <t.icon size={11} className="text-[#a8a8b8]" />
                <span className="text-xs text-[#f8f5ec] font-medium">{t.label}</span>
                {active && <Check size={11} className="ml-auto text-[#e8c468]" />}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-[#7a7a90] mt-3">Applies to article reading. Saved to this device.</p>
    </section>
  );
}

// ─── Cards ───────────────────────────────────────────────────────────────────

function PremiumPostCard({ item }: { item: any }) {
  return (
    <li className="atelier-card rounded-2xl overflow-hidden group">
      <Link to={`/posts/${item.slug}`} className="block">
        {item.cover_image && (
          <div className="aspect-[16/9] overflow-hidden bg-[#0a0a1a]">
            <img src={item.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
          </div>
        )}
        <div className="p-4">
          {item.category_name && (
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#e8c468] font-medium mb-1.5">{item.category_name}</p>
          )}
          <h3 className="font-serif italic text-lg text-[#f8f5ec] leading-snug line-clamp-2 group-hover:text-[#e8c468] transition-colors">
            {item.title}
          </h3>
        </div>
      </Link>
    </li>
  );
}

function PremiumSavedCard({ item }: { item: any }) {
  const post = item.posts || item;
  const slug = post?.slug || item?.post_id;
  return (
    <li className="atelier-card rounded-2xl overflow-hidden group">
      <Link to={`/posts/${slug}`} className="block">
        {post?.cover_image && (
          <div className="aspect-[16/9] overflow-hidden bg-[#0a0a1a]">
            <img src={post.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
          </div>
        )}
        <div className="p-4">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#e8c468] font-medium mb-1.5">Saved</p>
          <h3 className="font-serif italic text-lg text-[#f8f5ec] leading-snug line-clamp-2 group-hover:text-[#e8c468] transition-colors">
            {post?.title || 'Untitled'}
          </h3>
        </div>
      </Link>
    </li>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="atelier-card rounded-2xl px-6 py-10 text-center">
      <Icon size={20} className="mx-auto text-[#e8c468] mb-2" />
      <p className="font-serif italic text-lg text-[#f8f5ec] mb-1">{title}</p>
      <p className="text-sm text-[#a8a8b8]">{description}</p>
    </div>
  );
}

// ─── Shared atelier styles for premium home ──────────────────────────────────

function PremiumStyles() {
  return (
    <style>{`
      .atelier-card {
        background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%);
        border: 1px solid rgba(212, 175, 55, 0.18);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        box-shadow: 0 30px 60px -30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
        transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1), border-color 320ms ease;
      }
      .atelier-card:hover {
        transform: translateY(-2px);
        border-color: rgba(212, 175, 55, 0.32);
      }
      .atelier-rule {
        display: inline-block; width: 2px; min-height: 38px; align-self: stretch;
        background: linear-gradient(180deg, #d4af37 0%, rgba(212, 175, 55, 0.10) 100%);
        border-radius: 1px;
      }
      .atelier-cta-gold {
        background: linear-gradient(180deg, #e8c468 0%, #c89c2c 100%);
        color: #0a0a1a;
        border: 1px solid rgba(255, 224, 130, 0.55);
        box-shadow: 0 12px 28px -14px rgba(212, 175, 55, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.45);
        transition: transform 200ms ease, filter 200ms ease;
      }
      .atelier-cta-gold:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
      .atelier-cta-gold:active:not(:disabled) { transform: translateY(0); }

      .premium-fade-in { animation: premium-fade 700ms cubic-bezier(0.22, 1, 0.36, 1) both; }
      @keyframes premium-fade {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .premium-fade-in, .atelier-card { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}
