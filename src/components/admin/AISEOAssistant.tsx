import { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Search, FileText, Tag, Link2, BarChart2, Loader2,
  ChevronDown, ChevronUp, CheckCircle2, AlertCircle, TrendingUp,
  Key, X, RefreshCw, ExternalLink,
} from 'lucide-react';

interface AISEOAssistantProps {
  title: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  onSetMetaTitle: (v: string) => void;
  onSetMetaDescription: (v: string) => void;
  onSetMetaKeywords: (v: string) => void;
  onSetExcerpt: (v: string) => void;
  onSetTitle: (v: string) => void;
  onInsertLinks: (html: string) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type ActiveTab = 'generate' | 'links' | 'analyze';

interface SeoScore {
  overall: number;
  titleScore: number;
  descScore: number;
  keywordScore: number;
  contentLength: number;
  headingScore: number;
  internalLinks: number;
  imageAlt: number;
  details: { label: string; pass: boolean; info: string }[];
  suggestions: string[];
}

interface LinkSuggestion {
  anchor: string;
  postTitle: string;
  slug: string;
  reason: string;
}

function computeSeoScore(
  title: string,
  content: string,
  metaTitle: string,
  metaDescription: string,
  metaKeywords: string,
): SeoScore {
  const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const h2Count = (content.match(/<h2/gi) || []).length;
  const h3Count = (content.match(/<h3/gi) || []).length;
  const imgCount = (content.match(/<img/gi) || []).length;
  const imgAltCount = (content.match(/alt="[^"]+"/gi) || []).length;
  const internalLinkCount = (content.match(/href="\//gi) || []).length;

  const effectiveTitle = metaTitle || title;
  const titleLen = effectiveTitle.length;
  const descLen = metaDescription.length;
  const keywords = metaKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);

  const titleScore =
    titleLen >= 50 && titleLen <= 60 ? 100 :
    titleLen >= 40 && titleLen <= 70 ? 75 :
    titleLen > 0 ? 40 : 0;

  const descScore =
    descLen >= 150 && descLen <= 160 ? 100 :
    descLen >= 120 && descLen <= 170 ? 75 :
    descLen > 0 ? 40 : 0;

  const keywordScore = keywords.length === 0 ? 0 :
    keywords.length >= 5 ? 100 :
    keywords.length >= 3 ? 70 : 40;

  const contentLengthScore =
    wordCount >= 4000 ? 100 :
    wordCount >= 2000 ? 80 :
    wordCount >= 1000 ? 55 :
    wordCount >= 500 ? 30 : 0;

  const headingScore = h2Count >= 3 ? 100 : h2Count >= 2 ? 75 : h2Count >= 1 ? 50 : 0;

  const altScore = imgCount === 0 ? 80 : imgAltCount === imgCount ? 100 : Math.round((imgAltCount / imgCount) * 100);

  const internalLinkScore = internalLinkCount >= 3 ? 100 : internalLinkCount >= 1 ? 60 : 0;

  const overall = Math.round(
    titleScore * 0.2 +
    descScore * 0.15 +
    keywordScore * 0.15 +
    contentLengthScore * 0.25 +
    headingScore * 0.1 +
    altScore * 0.05 +
    internalLinkScore * 0.1
  );

  const suggestions: string[] = [];
  if (titleLen < 50 || titleLen > 60) suggestions.push(`Meta title should be 50–60 characters (currently ${titleLen})`);
  if (descLen < 150 || descLen > 160) suggestions.push(`Meta description should be 150–160 characters (currently ${descLen})`);
  if (keywords.length < 5) suggestions.push('Add at least 5 keywords to improve keyword coverage');
  if (wordCount < 4000) suggestions.push(`Content is ${wordCount} words. Aim for 4,000–5,000 words for AdSense approval and top SEO ranking`);
  if (h2Count < 2) suggestions.push('Add at least 2 H2 headings to improve content structure');
  if (imgCount > 0 && imgAltCount < imgCount) suggestions.push(`${imgCount - imgAltCount} image(s) missing alt text`);
  if (internalLinkCount === 0) suggestions.push('Add internal links to improve SEO and navigation');

  const details = [
    { label: 'Meta title length (50–60 chars)', pass: titleLen >= 50 && titleLen <= 60, info: `${titleLen} chars` },
    { label: 'Meta description (150–160 chars)', pass: descLen >= 150 && descLen <= 160, info: `${descLen} chars` },
    { label: 'Keywords defined', pass: keywords.length >= 3, info: `${keywords.length} keywords` },
    { label: 'Content length (4,000+ words)', pass: wordCount >= 4000, info: `${wordCount} words` },
    { label: 'H2 headings used', pass: h2Count >= 2, info: `${h2Count} H2s` },
    { label: 'H3 subheadings used', pass: h3Count >= 1, info: `${h3Count} H3s` },
    { label: 'Images have alt text', pass: imgCount === 0 || imgAltCount === imgCount, info: imgCount === 0 ? 'No images' : `${imgAltCount}/${imgCount}` },
    { label: 'Internal links present', pass: internalLinkCount >= 1, info: `${internalLinkCount} links` },
  ];

  return {
    overall, titleScore, descScore, keywordScore,
    contentLength: wordCount, headingScore,
    internalLinks: internalLinkCount, imageAlt: altScore,
    details, suggestions,
  };
}

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} className="dark:stroke-gray-700" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize={size * 0.22} fontWeight="700" fill={color}>{score}</text>
    </svg>
  );
}

export default function AISEOAssistant({
  title, content, excerpt,
  metaTitle, metaDescription, metaKeywords,
  onSetMetaTitle, onSetMetaDescription, onSetMetaKeywords,
  onSetExcerpt, onSetTitle, onInsertLinks,
}: AISEOAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const [loadingTitle, setLoadingTitle] = useState(false);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [loadingExcerpt, setLoadingExcerpt] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);

  const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[]>([]);
  const [selectedLinks, setSelectedLinks] = useState<Set<number>>(new Set());
  const [linkError, setLinkError] = useState<string | null>(null);

  const [seoScore, setSeoScore] = useState<SeoScore | null>(null);
  const analyzeDebounce = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen || activeTab !== 'analyze') return;
    if (analyzeDebounce.current) clearTimeout(analyzeDebounce.current);
    analyzeDebounce.current = setTimeout(() => {
      setSeoScore(computeSeoScore(title, content, metaTitle, metaDescription, metaKeywords));
    }, 800);
    return () => { if (analyzeDebounce.current) clearTimeout(analyzeDebounce.current); };
  }, [isOpen, activeTab, title, content, metaTitle, metaDescription, metaKeywords]);

  const callAI = async (action: string, extra: Record<string, string> = {}) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'X-OpenAI-Key': apiKey,
      },
      body: JSON.stringify({
        action,
        title,
        content,
        excerpt,
        metaDescription,
        metaKeywords,
        ...extra,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.result as string;
  };

  const generateSeoTitle = async () => {
    if (!apiKey) { setShowKeyInput(true); return; }
    setLoadingTitle(true);
    try {
      const result = await callAI('generate_seo_title');
      const clean = result.replace(/^["']|["']$/g, '').trim();
      onSetMetaTitle(clean.slice(0, 70));
    } catch (e: any) {
      alert(e.message);
    } finally { setLoadingTitle(false); }
  };

  const generateMetaDesc = async () => {
    if (!apiKey) { setShowKeyInput(true); return; }
    setLoadingDesc(true);
    try {
      const result = await callAI('generate_meta_description');
      const clean = result.replace(/^["']|["']$/g, '').trim();
      onSetMetaDescription(clean.slice(0, 160));
    } catch (e: any) {
      alert(e.message);
    } finally { setLoadingDesc(false); }
  };

  const generateKeywords = async () => {
    if (!apiKey) { setShowKeyInput(true); return; }
    setLoadingKeywords(true);
    try {
      const result = await callAI('generate_keywords');
      let keywords: string[] = [];
      try { keywords = JSON.parse(result); } catch { keywords = result.split(',').map((k: string) => k.trim()); }
      onSetMetaKeywords(keywords.slice(0, 15).join(', '));
    } catch (e: any) {
      alert(e.message);
    } finally { setLoadingKeywords(false); }
  };

  const generateExcerpt = async () => {
    if (!apiKey) { setShowKeyInput(true); return; }
    setLoadingExcerpt(true);
    try {
      const result = await callAI('generate_excerpt');
      onSetExcerpt(result.replace(/^["']|["']$/g, '').trim());
    } catch (e: any) {
      alert(e.message);
    } finally { setLoadingExcerpt(false); }
  };

  const checkInternalLinks = async () => {
    if (!apiKey) { setShowKeyInput(true); return; }
    if (!content.trim() && !title.trim()) {
      setLinkError('Please add some content or a title first.');
      return;
    }
    setLoadingLinks(true);
    setLinkError(null);
    setLinkSuggestions([]);
    setSelectedLinks(new Set());
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data: posts } = await supabase.from('posts').select('title, slug, excerpt').eq('status', 'published').limit(100);
      const postList = (posts || []).map((p: any) => p.title);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'X-OpenAI-Key': apiKey,
        },
        body: JSON.stringify({
          action: 'suggest_internal_links',
          title,
          content,
          outline: title,
          existingPosts: postList,
        }),
      });
      const linkData = await res.json();
      if (linkData.error) throw new Error(linkData.error);
      const result = linkData.result as string;

      let parsed: any;
      try { parsed = JSON.parse(result); } catch { throw new Error('Could not parse link suggestions'); }

      const recs = parsed.recommendations || [];
      const mapped: LinkSuggestion[] = recs.map((r: any) => {
        const matchedPost = (posts || []).find((p: any) =>
          p.title?.toLowerCase() === r.postTitle?.toLowerCase()
        );
        return {
          anchor: r.anchorText || r.postTitle,
          postTitle: r.postTitle,
          slug: matchedPost?.slug || slugify(r.postTitle),
          reason: r.reason,
        };
      });
      setLinkSuggestions(mapped);
    } catch (e: any) {
      setLinkError(e.message);
    } finally { setLoadingLinks(false); }
  };

  const insertSelectedLinks = () => {
    const toInsert = linkSuggestions.filter((_, i) => selectedLinks.has(i));
    if (toInsert.length === 0) return;

    let updatedContent = content;
    let insertedCount = 0;

    for (const link of toInsert) {
      const { result, inserted } = insertLinkInContent(updatedContent, link.anchor, link.slug, link.postTitle);
      if (inserted) {
        updatedContent = result;
        insertedCount++;
      }
    }

    onInsertLinks(updatedContent);
    setSelectedLinks(new Set());

    if (insertedCount < toInsert.length) {
      const missed = toInsert.length - insertedCount;
      setLinkError(
        `${insertedCount} link(s) inserted within the content. ${missed} anchor text(s) not found verbatim — add those phrases to your article then try again.`
      );
    } else {
      setLinkError(null);
    }
  };

  const toggleLink = (i: number) => {
    setSelectedLinks(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const refreshAnalysis = () => {
    setSeoScore(computeSeoScore(title, content, metaTitle, metaDescription, metaKeywords));
  };

  const scoreColor = (s: number) => s >= 75 ? 'text-green-600' : s >= 50 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-xl border border-emerald-100 dark:border-teal-900/50 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200 dark:shadow-emerald-900/30">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">AI SEO Assistant</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Generate titles, descriptions, keywords & links</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowKeyInput(!showKeyInput); }}
            className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-gray-700 transition-colors"
            title="Configure API key"
          >
            <Key size={14} className={apiKey ? 'text-green-500' : 'text-gray-400'} />
          </button>
          {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>

      {showKeyInput && (
        <div className="px-4 pb-3 border-t border-emerald-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 mb-2">OpenAI API key — stored in your browser only.</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => { localStorage.setItem('openai_api_key', apiKey); setShowKeyInput(false); }}
              className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
            >Save</button>
            <button type="button" onClick={() => setShowKeyInput(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="border-t border-emerald-100 dark:border-gray-700">
          <div className="flex border-b border-emerald-100 dark:border-gray-700">
            {([
              { id: 'generate', label: 'Generate', icon: Sparkles },
              { id: 'links', label: 'Links', icon: Link2 },
              { id: 'analyze', label: 'Analyze', icon: BarChart2 },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                  activeTab === id
                    ? 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'generate' && (
            <div className="p-4 space-y-3">
              <GenerateRow
                icon={<FileText size={14} />}
                label="SEO Title"
                preview={metaTitle}
                maxChars={60}
                loading={loadingTitle}
                onGenerate={generateSeoTitle}
                color="blue"
              />
              <GenerateRow
                icon={<Search size={14} />}
                label="Meta Description"
                preview={metaDescription}
                maxChars={160}
                loading={loadingDesc}
                onGenerate={generateMetaDesc}
                color="teal"
              />
              <GenerateRow
                icon={<Tag size={14} />}
                label="Keywords"
                preview={metaKeywords}
                loading={loadingKeywords}
                onGenerate={generateKeywords}
                color="amber"
              />
              <GenerateRow
                icon={<FileText size={14} />}
                label="Post Excerpt"
                preview={excerpt}
                loading={loadingExcerpt}
                onGenerate={generateExcerpt}
                color="emerald"
              />
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-100 dark:border-emerald-800/40 mt-1">
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mb-1">Requirements</p>
                <ul className="text-xs text-emerald-600 dark:text-emerald-400 space-y-0.5">
                  <li>• Title: 50–60 chars with primary keyword</li>
                  <li>• Description: 150–160 chars, click-optimized</li>
                  <li>• Keywords: 5–15 primary + long-tail</li>
                  <li>• All content AdSense-policy compliant</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Scan your article for internal linking opportunities using existing published posts.
              </p>

              <button
                type="button"
                onClick={checkInternalLinks}
                disabled={loadingLinks}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
              >
                {loadingLinks ? <><Loader2 size={15} className="animate-spin" /> Scanning...</> : <><Link2 size={15} /> Check Links</>}
              </button>

              {linkError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400">{linkError}</p>
                </div>
              )}

              {linkSuggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{linkSuggestions.length} suggestions found — select to insert:</p>
                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                    {linkSuggestions.map((s, i) => (
                      <label key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedLinks.has(i) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-200'}`}>
                        <input
                          type="checkbox"
                          checked={selectedLinks.has(i)}
                          onChange={() => toggleLink(i)}
                          className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">"{s.anchor}"</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-0.5">
                            <ExternalLink size={10} /> {s.postTitle}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{s.reason}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={insertSelectedLinks}
                    disabled={selectedLinks.size === 0}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Link2 size={15} />
                    Insert {selectedLinks.size > 0 ? `${selectedLinks.size} ` : ''}Links
                  </button>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Rules</p>
                <ul className="text-xs text-gray-400 dark:text-gray-500 space-y-0.5">
                  <li>• Minimum 40 internal links per article (SEO best practice)</li>
                  <li>• Links auto-inserted at the anchor word in your content</li>
                  <li>• Anchor text must exist verbatim in your article</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'analyze' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Live SEO Analysis</p>
                <button type="button" onClick={refreshAnalysis} className="p-1.5 hover:bg-emerald-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <RefreshCw size={13} className="text-gray-400" />
                </button>
              </div>

              {seoScore ? (
                <>
                  <div className="flex items-center gap-4">
                    <ScoreRing score={seoScore.overall} size={72} />
                    <div>
                      <p className={`text-2xl font-black ${scoreColor(seoScore.overall)}`}>{seoScore.overall}/100</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {seoScore.overall >= 75 ? 'Good SEO' : seoScore.overall >= 50 ? 'Needs work' : 'Poor SEO'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{seoScore.contentLength} words</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {seoScore.details.map((d, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {d.pass
                            ? <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                            : <AlertCircle size={13} className="text-red-400 flex-shrink-0" />}
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{d.label}</span>
                        </div>
                        <span className={`text-xs font-medium flex-shrink-0 ${d.pass ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{d.info}</span>
                      </div>
                    ))}
                  </div>

                  {seoScore.suggestions.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800/40">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Improvements</p>
                      <ul className="space-y-1">
                        {seoScore.suggestions.map((s, i) => (
                          <li key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                            <span className="flex-shrink-0 mt-0.5">•</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {seoScore.suggestions.length === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium">All SEO checks passed!</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GenerateRow({
  icon, label, preview, maxChars, loading, onGenerate, color,
}: {
  icon: React.ReactNode;
  label: string;
  preview: string;
  maxChars?: number;
  loading: boolean;
  onGenerate: () => void;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    teal: 'bg-teal-600 hover:bg-teal-700',
    amber: 'bg-amber-600 hover:bg-amber-700',
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
  };

  return (
    <div className="bg-white dark:bg-gray-800/70 rounded-xl border border-gray-100 dark:border-gray-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <span className="text-gray-400">{icon}</span>
          <span className="text-xs font-semibold">{label}</span>
          {preview && maxChars && (
            <span className={`text-xs ${preview.length > maxChars ? 'text-red-500' : 'text-gray-400'}`}>
              {preview.length}/{maxChars}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 ${colorMap[color] || colorMap.blue} text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </div>
      {preview && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-2.5 py-2 mt-1">
          {preview}
        </p>
      )}
    </div>
  );
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Replaces the first occurrence of anchor text in a non-tag text node with an <a> link. */
function insertLinkInContent(
  content: string,
  anchor: string,
  slug: string,
  postTitle: string,
): { result: string; inserted: boolean } {
  const linkHtml = `<a href="/${slug}" title="${postTitle}">${anchor}</a>`;
  // Split into [text, <tag>, text, <tag>, ...] segments
  const parts = content.split(/(<[^>]+>)/);
  let inserted = false;

  const result = parts.map(part => {
    if (inserted || part.startsWith('<')) return part;
    const lowerPart = part.toLowerCase();
    const lowerAnchor = anchor.toLowerCase();
    const idx = lowerPart.indexOf(lowerAnchor);
    if (idx !== -1) {
      inserted = true;
      return part.slice(0, idx) + linkHtml + part.slice(idx + anchor.length);
    }
    return part;
  });

  return { result: result.join(''), inserted };
}
