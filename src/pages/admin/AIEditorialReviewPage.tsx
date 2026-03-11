import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  ClipboardCheck, RefreshCw, Key, Eye, EyeOff, AlertCircle,
  Loader2, BookOpen, Search, Users, ListChecks, Lightbulb,
  ChevronDown, History, Trash2, ExternalLink, FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEditorialReview } from '../../components/admin/editorial/useEditorialReview';
import {
  EditorialReviewState, EditorialTab,
} from '../../components/admin/editorial/types';
import OverviewPanel from '../../components/admin/editorial/OverviewPanel';
import ReadabilityPanel from '../../components/admin/editorial/ReadabilityPanel';
import SeoPanel from '../../components/admin/editorial/SeoPanel';
import HeadlinePanel from '../../components/admin/editorial/HeadlinePanel';
import EngagementPanel from '../../components/admin/editorial/EngagementPanel';
import ChecklistPanel from '../../components/admin/editorial/ChecklistPanel';
import SuggestionsPanel from '../../components/admin/editorial/SuggestionsPanel';
import ScoreRing from '../../components/admin/editorial/ScoreRing';

type ActiveSection = 'editor' | 'history';

const TABS: { key: EditorialTab; label: string; icon: React.ElementType; actionKey: string }[] = [
  { key: 'overview', label: 'Overview', icon: ClipboardCheck, actionKey: 'editorial_review' },
  { key: 'readability', label: 'Readability', icon: BookOpen, actionKey: 'editorial_readability' },
  { key: 'seo', label: 'SEO', icon: Search, actionKey: 'editorial_seo' },
  { key: 'headline', label: 'Headline', icon: ClipboardCheck, actionKey: 'editorial_headline' },
  { key: 'engagement', label: 'Engagement', icon: Users, actionKey: 'editorial_engagement' },
  { key: 'checklist', label: 'Checklist', icon: ListChecks, actionKey: 'editorial_checklist' },
  { key: 'suggestions', label: 'Suggestions', icon: Lightbulb, actionKey: 'editorial_suggestions' },
];

interface SavedReview {
  id: string;
  post_title: string;
  overall_score: number;
  verdict: string;
  created_at: string;
  review_data: any;
  readability_data: any;
  seo_data: any;
  headline_data: any;
  engagement_data: any;
  checklist_data: any;
  suggestions_data: any;
}

export default function AIEditorialReviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('editor');
  const [activeTab, setActiveTab] = useState<EditorialTab>('overview');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');

  const [publishedPosts, setPublishedPosts] = useState<{ id: string; title: string; content: string; excerpt: string; meta_description: string; meta_keywords: string }[]>([]);
  const [showPostSelector, setShowPostSelector] = useState(false);
  const [savedReviews, setSavedReviews] = useState<SavedReview[]>([]);
  const [savingReview, setSavingReview] = useState(false);

  const [state, setState] = useState<EditorialReviewState>({
    overall: null, readability: null, seo: null, headline: null,
    engagement: null, checklist: null, suggestions: null,
  });

  const ai = useEditorialReview(apiKey);

  useEffect(() => {
    if (apiKey) localStorage.setItem('openai_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (!user) return;
    loadPosts();
    loadSavedReviews();
  }, [user]);

  const loadPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('id, title, content, excerpt, meta_description, meta_keywords')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setPublishedPosts(data as any[]);
  };

  const loadSavedReviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('editorial_reviews')
      .select('*')
      .eq('reviewed_by', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setSavedReviews(data as SavedReview[]);
  };

  const articlePayload = () => ({ title, content, excerpt, metaDescription, metaKeywords, featuredImage });

  const handleRunAll = async () => {
    const payload = articlePayload();
    const overall = await ai.runOverallReview(payload);
    if (overall) {
      setState(s => ({ ...s, overall }));
      setActiveTab('overview');
    }
  };

  const handleRunTab = async (tab: EditorialTab) => {
    setActiveTab(tab);
    const payload = articlePayload();
    switch (tab) {
      case 'overview': { const r = await ai.runOverallReview(payload); if (r) setState(s => ({ ...s, overall: r })); break; }
      case 'readability': { const r = await ai.runReadability(payload); if (r) setState(s => ({ ...s, readability: r })); break; }
      case 'seo': { const r = await ai.runSeoAnalysis(payload); if (r) setState(s => ({ ...s, seo: r })); break; }
      case 'headline': { const r = await ai.runHeadlineAnalysis(payload); if (r) setState(s => ({ ...s, headline: r })); break; }
      case 'engagement': { const r = await ai.runEngagementAnalysis(payload); if (r) setState(s => ({ ...s, engagement: r })); break; }
      case 'checklist': { const r = await ai.runChecklist(payload); if (r) setState(s => ({ ...s, checklist: r })); break; }
      case 'suggestions': { const r = await ai.runSuggestions(payload); if (r) setState(s => ({ ...s, suggestions: r })); break; }
    }
  };

  const handleSaveReview = async () => {
    if (!user || !state.overall) return;
    setSavingReview(true);
    const { data } = await supabase.from('editorial_reviews').insert({
      post_title: title,
      overall_score: state.overall.overallScore,
      verdict: state.overall.verdict,
      review_data: state.overall,
      readability_data: state.readability,
      seo_data: state.seo,
      headline_data: state.headline,
      engagement_data: state.engagement,
      checklist_data: state.checklist,
      suggestions_data: state.suggestions,
      reviewed_by: user.id,
    }).select().single();
    if (data) {
      setSavedReviews(prev => [data as SavedReview, ...prev]);
    }
    setSavingReview(false);
  };

  const handleDeleteReview = async (id: string) => {
    await supabase.from('editorial_reviews').delete().eq('id', id);
    setSavedReviews(prev => prev.filter(r => r.id !== id));
  };

  const loadSavedReview = (review: SavedReview) => {
    setState({
      overall: review.review_data,
      readability: review.readability_data,
      seo: review.seo_data,
      headline: review.headline_data,
      engagement: review.engagement_data,
      checklist: review.checklist_data,
      suggestions: review.suggestions_data,
    });
    setTitle(review.post_title);
    setActiveSection('editor');
    setActiveTab('overview');
  };

  const selectPost = (post: typeof publishedPosts[0]) => {
    setTitle(post.title);
    setContent(post.content || '');
    setExcerpt(post.excerpt || '');
    setMetaDescription(post.meta_description || '');
    setMetaKeywords(post.meta_keywords || '');
    setState({ overall: null, readability: null, seo: null, headline: null, engagement: null, checklist: null, suggestions: null });
    setShowPostSelector(false);
  };

  const hasData = (tab: EditorialTab) => {
    const map: Record<EditorialTab, unknown> = {
      overview: state.overall, readability: state.readability, seo: state.seo,
      headline: state.headline, engagement: state.engagement, checklist: state.checklist, suggestions: state.suggestions,
    };
    return !!map[tab];
  };

  const isKeyConfigured = apiKey.length > 10;
  const anyLoading = !!ai.loadingAction;
  const canAnalyze = isKeyConfigured && !!title && !!content;
  const reviewComplete = !!(state.overall);

  const verdictColors: Record<string, string> = {
    'Publish Ready': 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    'Needs Minor Edits': 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    'Needs Major Revision': 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
    'Not Ready': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50 dark:bg-gray-950">
        {/* Top bar */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                <ClipboardCheck size={17} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">AI Editorial Review</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Evaluate article quality before publishing</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="OpenAI key (sk-...)"
                  className="w-44 sm:w-52 pl-7 pr-8 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
                <Key size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showKey ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
              </div>
            </div>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 mt-4">
            {([
              { key: 'editor', label: 'Review Editor', icon: ClipboardCheck },
              { key: 'history', label: 'Review History', icon: History, count: savedReviews.length },
            ] as const).map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeSection === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={12} />
                  {tab.label}
                  {'count' in tab && tab.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeSection === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {ai.error && (
          <div className="flex-shrink-0 mx-4 sm:mx-6 mt-3 px-4 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
            <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400">{ai.error}</p>
          </div>
        )}

        {/* EDITOR SECTION */}
        {activeSection === 'editor' && (
          <div className="flex-1 overflow-hidden flex">
            {/* Left: article input */}
            <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
              <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">Article Input</h2>
                  <button
                    onClick={() => setShowPostSelector(!showPostSelector)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    <FileText size={11} /> Load from Posts
                    <ChevronDown size={11} className={showPostSelector ? 'rotate-180' : ''} />
                  </button>
                </div>

                {showPostSelector && (
                  <div className="mb-3 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                    {publishedPosts.length === 0 ? (
                      <p className="text-xs text-gray-400 p-3 text-center">No published posts found</p>
                    ) : (
                      publishedPosts.map(post => (
                        <button
                          key={post.id}
                          onClick={() => selectPost(post)}
                          className="w-full text-left px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors line-clamp-1"
                        >
                          {post.title}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Article Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter article title..."
                    className="w-full px-3 py-2.5 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                  {title && <p className="text-[10px] text-gray-400 mt-1">{title.length} chars</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Article Content *</label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Paste article content here (HTML or plain text)..."
                    rows={12}
                    className="w-full px-3 py-2.5 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none font-mono leading-relaxed"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    ~{content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Excerpt</label>
                  <textarea
                    value={excerpt}
                    onChange={e => setExcerpt(e.target.value)}
                    placeholder="Article excerpt..."
                    rows={2}
                    className="w-full px-3 py-2.5 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Meta Description</label>
                    <input
                      type="text"
                      value={metaDescription}
                      onChange={e => setMetaDescription(e.target.value)}
                      placeholder="SEO meta description..."
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Meta Keywords</label>
                    <input
                      type="text"
                      value={metaKeywords}
                      onChange={e => setMetaKeywords(e.target.value)}
                      placeholder="keyword1, keyword2..."
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                  </div>
                </div>

                {/* Run button */}
                <button
                  onClick={handleRunAll}
                  disabled={!canAnalyze || anyLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  {anyLoading && ai.loadingAction === 'editorial_review' ? (
                    <><Loader2 size={15} className="animate-spin" /> Analyzing...</>
                  ) : (
                    <><RefreshCw size={15} /> {state.overall ? 'Re-run Full Review' : 'Run Full Editorial Review'}</>
                  )}
                </button>

                {reviewComplete && (
                  <button
                    onClick={handleSaveReview}
                    disabled={savingReview}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                  >
                    {savingReview ? <Loader2 size={12} className="animate-spin" /> : <History size={12} />}
                    Save Review to History
                  </button>
                )}
              </div>
            </div>

            {/* Right: review results */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Review score summary bar */}
              {state.overall && (
                <div className="flex-shrink-0 flex items-center gap-4 px-5 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <ScoreRing score={state.overall.overallScore} size="md" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${verdictColors[state.overall.verdict] || ''}`}>
                        {state.overall.verdict}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/admin/posts/new')}
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex-shrink-0"
                  >
                    <ExternalLink size={11} /> Open in Editor
                  </button>
                </div>
              )}

              {/* Tab navigation */}
              <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const done = hasData(tab.key);
                  const loading = ai.loadingAction === tab.actionKey;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => !anyLoading && handleRunTab(tab.key)}
                      disabled={!isKeyConfigured || (!done && anyLoading)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === tab.key
                          ? 'bg-blue-600 text-white shadow-sm'
                          : done
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {loading ? <Loader2 size={11} className="animate-spin" /> : <Icon size={11} />}
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab panel content */}
              <div className="flex-1 overflow-y-auto p-5">
                {!state.overall && activeTab === 'overview' ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <div className="w-20 h-20 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center mb-5">
                      <ClipboardCheck size={32} className="text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-base font-bold text-gray-600 dark:text-gray-400 mb-2">Ready to Evaluate</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm leading-relaxed">
                      Paste your article content on the left, then click "Run Full Editorial Review" to get a comprehensive quality assessment.
                    </p>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto">
                    {activeTab === 'overview' && state.overall && (
                      <OverviewPanel review={state.overall} onNavigate={tab => handleRunTab(tab)} />
                    )}
                    {activeTab === 'readability' && (
                      state.readability
                        ? <ReadabilityPanel result={state.readability} />
                        : <RunTabEmpty label="Run Readability Analysis" onRun={() => handleRunTab('readability')} loading={ai.loadingAction === 'editorial_readability'} disabled={!canAnalyze} />
                    )}
                    {activeTab === 'seo' && (
                      state.seo
                        ? <SeoPanel result={state.seo} />
                        : <RunTabEmpty label="Run SEO Analysis" onRun={() => handleRunTab('seo')} loading={ai.loadingAction === 'editorial_seo'} disabled={!canAnalyze} />
                    )}
                    {activeTab === 'headline' && (
                      state.headline
                        ? <HeadlinePanel result={state.headline} />
                        : <RunTabEmpty label="Analyze Headline" onRun={() => handleRunTab('headline')} loading={ai.loadingAction === 'editorial_headline'} disabled={!isKeyConfigured || !title} />
                    )}
                    {activeTab === 'engagement' && (
                      state.engagement
                        ? <EngagementPanel result={state.engagement} />
                        : <RunTabEmpty label="Predict Engagement" onRun={() => handleRunTab('engagement')} loading={ai.loadingAction === 'editorial_engagement'} disabled={!canAnalyze} />
                    )}
                    {activeTab === 'checklist' && (
                      state.checklist
                        ? <ChecklistPanel result={state.checklist} />
                        : <RunTabEmpty label="Generate Checklist" onRun={() => handleRunTab('checklist')} loading={ai.loadingAction === 'editorial_checklist'} disabled={!isKeyConfigured || !title} />
                    )}
                    {activeTab === 'suggestions' && (
                      state.suggestions
                        ? <SuggestionsPanel result={state.suggestions} />
                        : <RunTabEmpty label="Get Improvement Suggestions" onRun={() => handleRunTab('suggestions')} loading={ai.loadingAction === 'editorial_suggestions'} disabled={!canAnalyze} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* HISTORY SECTION */}
        {activeSection === 'history' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">Review History</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{savedReviews.length} saved review{savedReviews.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {savedReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center mb-4">
                    <History size={26} className="text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No reviews saved yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Run a review and click "Save to History" to track it here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedReviews.map(review => (
                    <div key={review.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <div className="flex items-start gap-4">
                        <ScoreRing score={review.overall_score} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{review.post_title}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${verdictColors[review.verdict] || ''}`}>{review.verdict}</span>
                            <span className="text-[11px] text-gray-400">{new Date(review.created_at).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => loadSavedReview(review)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
                          >
                            <ClipboardCheck size={11} /> View
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function RunTabEmpty({ label, onRun, loading, disabled }: { label: string; onRun: () => void; loading: boolean; disabled: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4">
        {loading ? <Loader2 size={22} className="text-blue-500 animate-spin" /> : <ClipboardCheck size={22} className="text-gray-300 dark:text-gray-600" />}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{label}</p>
      <button
        onClick={onRun}
        disabled={disabled || loading}
        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition-colors"
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
    </div>
  );
}
