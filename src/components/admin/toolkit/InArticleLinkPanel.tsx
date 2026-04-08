import { useState, useCallback, useEffect } from 'react';
import {
  Link2, Loader2, Zap, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  ExternalLink, BarChart2, RefreshCw, Search, X, Filter,
} from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
}

interface LinkSuggestion {
  anchorText: string;
  postId: string;
  postTitle: string;
  postSlug: string;
  relevanceScore: number;
  context: string;
  reason: string;
}

interface LinkResult {
  suggestions: LinkSuggestion[];
  totalFound: number;
  analysisNotes: string;
}

interface InArticleLinkPanelProps {
  content: string;
  onInsertContent: (html: string, replace?: boolean) => void;
}

const SITE_URL = 'https://www.mayobebros.com';

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Replace the first occurrence of anchorText in HTML content with a hyperlink */
function insertLinkInContent(html: string, anchorText: string, href: string): string {
  const escaped = escapeRegex(anchorText);
  // Match the anchor text in text nodes only (not inside existing tags)
  // We use a regex that avoids matching inside HTML tags
  const pattern = new RegExp(`(?<!<[^>]*)\\b${escaped}\\b`, 'i');
  const linked = `<a href="${href}" target="_blank" rel="noopener">${anchorText}</a>`;
  return html.replace(pattern, linked);
}

/** Apply all selected link suggestions to the content */
function applyLinksToContent(
  html: string,
  suggestions: LinkSuggestion[],
  selected: Set<string>,
): string {
  let result = html;
  const applied = new Set<string>();

  for (const s of suggestions) {
    if (!selected.has(s.anchorText + '|' + s.postSlug)) continue;
    // Don't apply the same anchor text twice
    if (applied.has(s.anchorText.toLowerCase())) continue;
    const href = `${SITE_URL}/${s.postSlug}`;
    const next = insertLinkInContent(result, s.anchorText, href);
    if (next !== result) {
      result = next;
      applied.add(s.anchorText.toLowerCase());
    }
  }
  return result;
}

export default function InArticleLinkPanel({ content, onInsertContent }: InArticleLinkPanelProps) {
  const [posts, setPosts]             = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [result, setResult]           = useState<LinkResult | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [filter, setFilter]           = useState('');
  const [minScore, setMinScore]       = useState(70);
  const [showAll, setShowAll]         = useState(false);
  const [applied, setApplied]         = useState(false);
  const [applyCount, setApplyCount]   = useState(0);

  // Load all published posts for linking
  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const res = await fetch('/api/posts?status=published&limit=200');
      const data = await res.json();
      const items: Post[] = (data.posts || data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt || '',
        category: p.category?.name || p.category_name || '',
      }));
      setPosts(items);
    } catch {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const analyze = async () => {
    if (!content || posts.length === 0) {
      setError('Write some content and ensure posts are loaded first.');
      return;
    }
    const plainWords = content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
    if (plainWords < 100) {
      setError('Write at least 100 words before analyzing links.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSelected(new Set());
    setApplied(false);

    try {
      const res = await fetch('/api/editor-ai/internal-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, posts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Link analysis failed');
      setResult(data);
      // Auto-select high-relevance suggestions
      const autoSelect = new Set<string>();
      (data.suggestions || []).forEach((s: LinkSuggestion) => {
        if (s.relevanceScore >= 80) autoSelect.add(s.anchorText + '|' + s.postSlug);
      });
      setSelected(autoSelect);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (s: LinkSuggestion) => {
    const key = s.anchorText + '|' + s.postSlug;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  const selectAll = () => {
    if (!result) return;
    const filtered = result.suggestions.filter(s => s.relevanceScore >= minScore);
    setSelected(new Set(filtered.map(s => s.anchorText + '|' + s.postSlug)));
  };

  const deselectAll = () => setSelected(new Set());

  const applySelected = () => {
    if (!result || selected.size === 0) return;
    const updated = applyLinksToContent(content, result.suggestions, selected);
    onInsertContent(updated, true);
    setApplied(true);
    setApplyCount(selected.size);
  };

  const scoreColor = (score: number) =>
    score >= 90 ? 'text-green-600 dark:text-green-400' :
    score >= 75 ? 'text-blue-600 dark:text-blue-400' :
    score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500';

  const scoreBg = (score: number) =>
    score >= 90 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
    score >= 75 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
    score >= 60 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
    'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';

  const filteredSuggestions = result?.suggestions
    .filter(s => s.relevanceScore >= minScore)
    .filter(s => !filter || s.anchorText.toLowerCase().includes(filter.toLowerCase()) || s.postTitle.toLowerCase().includes(filter.toLowerCase()))
    ?? [];

  const displayedSuggestions = showAll ? filteredSuggestions : filteredSuggestions.slice(0, 20);

  return (
    <div className="flex flex-col h-full overflow-y-auto text-xs">
      {/* Header info */}
      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <Link2 size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-bold text-blue-800 dark:text-blue-300">AI In-Article Link Generator</span>
          {postsLoading && <Loader2 size={12} className="animate-spin text-blue-500 ml-auto" />}
          {!postsLoading && posts.length > 0 && (
            <span className="ml-auto text-blue-600 dark:text-blue-400 font-semibold">{posts.length} posts loaded</span>
          )}
        </div>
        <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
          AI scans your article and finds natural anchor text opportunities, then matches each phrase to the most relevant post in your database. Minimum 40 link suggestions.
        </p>
      </div>

      {/* Status bar */}
      {posts.length === 0 && !postsLoading && (
        <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2">
          <AlertCircle size={13} className="text-amber-600 shrink-0" />
          <span className="text-amber-700 dark:text-amber-400">No posts found. <button onClick={loadPosts} className="underline font-semibold">Retry loading</button></span>
        </div>
      )}

      {/* Analyze button */}
      {!result && (
        <div className="p-4">
          <button
            onClick={analyze}
            disabled={loading || posts.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Analyzing article for link opportunities…</>
            ) : (
              <><Zap size={14} /> Find Internal Link Opportunities</>
            )}
          </button>
          <p className="text-center text-gray-400 dark:text-gray-500 mt-2">
            Scans your article against {posts.length} published posts
          </p>
        </div>
      )}

      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
          <AlertCircle size={13} className="text-red-600 shrink-0 mt-0.5" />
          <span className="text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col flex-1">
          {/* Summary bar */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <BarChart2 size={13} className="text-blue-500" />
                <span className="font-bold text-gray-800 dark:text-gray-200">{result.totalFound} opportunities found</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">{selected.size} selected</span>
              </div>
              <button
                onClick={analyze}
                className="ml-auto flex items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Re-analyze"
              >
                <RefreshCw size={12} /> Re-scan
              </button>
            </div>
            {result.analysisNotes && (
              <p className="text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{result.analysisNotes}</p>
            )}
          </div>

          {/* Controls */}
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 space-y-2">
            {/* Search filter */}
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1.5">
              <Search size={12} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Filter by anchor text or post title…"
                className="flex-1 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none placeholder-gray-400"
              />
              {filter && <button onClick={() => setFilter('')}><X size={12} className="text-gray-400" /></button>}
            </div>

            {/* Min score filter + select actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter size={11} className="text-gray-400" />
                <label className="text-gray-500">Min score:</label>
                <select
                  value={minScore}
                  onChange={e => setMinScore(Number(e.target.value))}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md px-1.5 py-0.5 focus:outline-none"
                >
                  <option value={50}>50+</option>
                  <option value={60}>60+</option>
                  <option value={70}>70+</option>
                  <option value={80}>80+</option>
                  <option value={90}>90+</option>
                </select>
                <span className="text-gray-400">({filteredSuggestions.length})</span>
              </div>
              <button onClick={selectAll} className="text-blue-600 dark:text-blue-400 hover:underline font-semibold ml-auto">Select all</button>
              <button onClick={deselectAll} className="text-gray-400 hover:underline">Clear</button>
            </div>
          </div>

          {/* Apply button */}
          {selected.size > 0 && !applied && (
            <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
              <button
                onClick={applySelected}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                <Link2 size={13} /> Apply {selected.size} Links to Article
              </button>
            </div>
          )}

          {applied && (
            <div className="mx-4 mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2">
              <CheckCircle2 size={13} className="text-green-600 shrink-0" />
              <span className="text-green-700 dark:text-green-400 font-semibold">{applyCount} links applied to your article!</span>
              <button onClick={() => { setResult(null); setApplied(false); }} className="ml-auto text-gray-400 hover:text-gray-600">
                <RefreshCw size={12} />
              </button>
            </div>
          )}

          {/* Suggestions list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {displayedSuggestions.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                No suggestions match current filters.
              </div>
            )}

            {displayedSuggestions.map((s, i) => {
              const key = s.anchorText + '|' + s.postSlug;
              const isSelected = selected.has(key);
              return (
                <div
                  key={i}
                  onClick={() => toggleSuggestion(s)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-sm'
                      : scoreBg(s.relevanceScore)
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <CheckCircle2 size={10} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Anchor text + score */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800 dark:text-gray-200">"{s.anchorText}"</span>
                        <span className={`font-bold ${scoreColor(s.relevanceScore)}`}>{s.relevanceScore}%</span>
                      </div>
                      {/* Target post */}
                      <div className="flex items-center gap-1 mt-0.5 text-gray-500 dark:text-gray-400">
                        <ExternalLink size={10} className="shrink-0" />
                        <span className="truncate">{s.postTitle}</span>
                      </div>
                      {/* Context */}
                      <div className="mt-1.5 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1 leading-relaxed">
                        …{s.context}…
                      </div>
                      {/* Reason */}
                      <div className="mt-1 text-gray-400 dark:text-gray-500 italic leading-relaxed">{s.reason}</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredSuggestions.length > 20 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-semibold transition-colors"
              >
                {showAll ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Show all {filteredSuggestions.length} suggestions</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
