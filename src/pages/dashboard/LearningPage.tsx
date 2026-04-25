import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GraduationCap, ArrowRight, BookOpen, Loader2, Lock } from 'lucide-react';
import { useDashboardSettings } from '../../hooks/useDashboardSettings';

type Track = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

type Item = { post_id: string; position: number; notes: string | null; post: any };

export default function LearningPage() {
  const { slug } = useParams<{ slug?: string }>();
  if (slug) return <TrackDetail slug={slug} />;
  return <TrackList />;
}

function TrackList() {
  const { config } = useDashboardSettings();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Learning · Mayobe Bros';
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/learning-tracks')
      .then(r => r.json())
      .then(data => { if (!cancelled) setTracks(data.tracks || []); })
      .catch(() => { if (!cancelled) setTracks([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (!config.features.learningSystem) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
        <Lock size={20} className="mx-auto text-gray-400 mb-3" />
        <p className="font-bold text-gray-900 dark:text-white mb-1">Learning is not available</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">The learning system is currently disabled by the editorial team.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
          <GraduationCap size={18} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Tracks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Curated reading paths from the Mayobe Bros team.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={24} />
        </div>
      ) : tracks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No learning tracks have been published yet. Check back soon.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tracks.map(t => (
            <li key={t.id}>
              <Link to={`/dashboard/learning/${t.slug}`} className="group block rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all hover:shadow-md">
                {t.cover_image ? (
                  <div className="aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={t.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700 flex items-center justify-center">
                    <GraduationCap size={32} className="text-white/80" />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-[10px] tracking-[0.22em] uppercase text-emerald-600 dark:text-emerald-400 font-bold mb-1">Track</p>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">{t.title}</h3>
                  {t.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{t.description}</p>}
                  <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Start <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TrackDetail({ slug }: { slug: string }) {
  const [track, setTrack] = useState<Track | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/learning-tracks/slug/${encodeURIComponent(slug)}`)
      .then(r => r.json().then(d => ({ ok: r.ok, ...d })))
      .then((data) => {
        if (cancelled) return;
        if (!data.ok) { setError(data.error || 'Not found'); return; }
        setTrack(data.track);
        setItems(data.items || []);
        document.title = `${data.track?.title || 'Track'} · Learning · Mayobe Bros`;
      })
      .catch(e => { if (!cancelled) setError(e?.message || 'Failed to load track'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return <div className="py-16 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={24} /></div>;
  }
  if (error || !track) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
        <p className="font-bold text-gray-900 dark:text-white mb-1">Track not found</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{error || 'This track may have been unpublished.'}</p>
        <Link to="/dashboard/learning" className="inline-flex items-center gap-1 mt-4 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
          ← Back to all tracks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/dashboard/learning" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600">
        ← All tracks
      </Link>
      <header className="rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white">
        {track.cover_image && (
          <img src={track.cover_image} alt="" className="w-full aspect-[24/9] object-cover opacity-90" />
        )}
        <div className="p-6 sm:p-8">
          <p className="text-[10px] tracking-[0.32em] uppercase font-bold text-emerald-100 mb-2">Learning Track</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-3">{track.title}</h1>
          {track.description && <p className="text-sm sm:text-base text-emerald-50/90 max-w-2xl leading-relaxed">{track.description}</p>}
          <p className="text-xs text-emerald-100 mt-3">{items.length} {items.length === 1 ? 'lesson' : 'lessons'}</p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No posts have been added to this track yet.</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {items.map((it, idx) => {
            const post = it.post;
            if (!post) return null;
            return (
              <li key={it.post_id}>
                <Link to={`/posts/${post.slug}`} className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  {post.cover_image && (
                    <img src={post.cover_image} alt="" className="hidden sm:block w-24 h-16 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-800 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">{post.title}</p>
                    {post.excerpt && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{post.excerpt}</p>}
                    {it.notes && <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 italic">{it.notes}</p>}
                  </div>
                  <BookOpen size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors flex-shrink-0 mt-1" />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
