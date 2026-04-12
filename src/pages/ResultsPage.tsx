import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { api, type Result } from '../lib/api';
import { GraduationCap, Search } from 'lucide-react';

export default function ResultsPage() {
  const { slug } = useParams();
  const [result, setResult]   = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.results.get(slug)
      .then(r => {
        if (!r) { setNotFound(true); return; }
        setResult(r);
        // Update document meta for SPA navigation (SSR handles initial load)
        document.title = r.meta_title || `${r.title} | Mayobe Bros`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && r.meta_description) metaDesc.setAttribute('content', r.meta_description);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading results...</div>
      </div>
    );
  }

  if (notFound || !result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Results not found</h1>
          <p className="text-gray-500">This results page does not exist or has not been published.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-green-700 to-emerald-800 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap size={32} className="text-green-200" />
            <span className="text-green-200 font-semibold text-sm uppercase tracking-widest">
              {result.exam_type?.toUpperCase()} {result.year}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            GET THE FULL RESULTS FROM OUR PLATFORM
          </h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            Empowering your future through knowledge and achievement
          </p>
        </div>
      </div>

      {/* Search bar (Phase 3 placeholder) */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              disabled
              placeholder="Search by Name, School or Index Number (e.g. S4740/0002) — coming soon"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Results content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div
          className="results-page-content"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(result.content || '', {
              ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'h2', 'h3', 'small', 'strong'],
              ADD_ATTR: ['id', 'class'],
            }),
          }}
        />
      </div>
    </div>
  );
}
