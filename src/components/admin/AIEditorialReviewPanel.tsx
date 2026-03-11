import { useState, useCallback } from 'react';
import {
  ClipboardCheck, Loader2, AlertCircle, RefreshCw, Key,
  Eye, EyeOff, BookOpen, Search, Heading as HeadingIcon,
  Users, ListChecks, Lightbulb, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useEditorialReview } from './editorial/useEditorialReview';
import {
  EditorialReviewState, EditorialTab,
  OverallReview, ReadabilityResult, SeoResult,
  HeadlineResult, EngagementResult, ChecklistResult, SuggestionsResult,
} from './editorial/types';
import OverviewPanel from './editorial/OverviewPanel';
import ReadabilityPanel from './editorial/ReadabilityPanel';
import SeoPanel from './editorial/SeoPanel';
import HeadlinePanel from './editorial/HeadlinePanel';
import EngagementPanel from './editorial/EngagementPanel';
import ChecklistPanel from './editorial/ChecklistPanel';
import SuggestionsPanel from './editorial/SuggestionsPanel';
import ScoreRing from './editorial/ScoreRing';

interface Props {
  title: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  metaKeywords: string;
  featuredImage: string;
  onUseHeadline?: (headline: string) => void;
}

const TABS: { key: EditorialTab; label: string; icon: React.ElementType; actionKey: string }[] = [
  { key: 'overview', label: 'Overview', icon: ClipboardCheck, actionKey: 'editorial_review' },
  { key: 'readability', label: 'Readability', icon: BookOpen, actionKey: 'editorial_readability' },
  { key: 'seo', label: 'SEO', icon: Search, actionKey: 'editorial_seo' },
  { key: 'headline', label: 'Headline', icon: HeadingIcon, actionKey: 'editorial_headline' },
  { key: 'engagement', label: 'Engagement', icon: Users, actionKey: 'editorial_engagement' },
  { key: 'checklist', label: 'Checklist', icon: ListChecks, actionKey: 'editorial_checklist' },
  { key: 'suggestions', label: 'Suggestions', icon: Lightbulb, actionKey: 'editorial_suggestions' },
];

export default function AIEditorialReviewPanel({
  title, content, excerpt, metaDescription, metaKeywords, featuredImage, onUseHeadline,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorialTab>('overview');
  const [state, setState] = useState<EditorialReviewState>({
    overall: null, readability: null, seo: null, headline: null,
    engagement: null, checklist: null, suggestions: null,
  });

  const ai = useEditorialReview(apiKey);

  const articlePayload = useCallback(() => ({
    title, content, excerpt, metaDescription, metaKeywords, featuredImage,
  }), [title, content, excerpt, metaDescription, metaKeywords, featuredImage]);

  const handleRunAll = async () => {
    const payload = articlePayload();
    const overall = await ai.runOverallReview(payload);
    if (overall) setState(s => ({ ...s, overall }));
    setActiveTab('overview');
  };

  const handleRunTab = async (tab: EditorialTab) => {
    const payload = articlePayload();
    setActiveTab(tab);
    switch (tab) {
      case 'overview': {
        const r = await ai.runOverallReview(payload);
        if (r) setState(s => ({ ...s, overall: r }));
        break;
      }
      case 'readability': {
        const r = await ai.runReadability(payload);
        if (r) setState(s => ({ ...s, readability: r }));
        break;
      }
      case 'seo': {
        const r = await ai.runSeoAnalysis(payload);
        if (r) setState(s => ({ ...s, seo: r }));
        break;
      }
      case 'headline': {
        const r = await ai.runHeadlineAnalysis(payload);
        if (r) setState(s => ({ ...s, headline: r }));
        break;
      }
      case 'engagement': {
        const r = await ai.runEngagementAnalysis(payload);
        if (r) setState(s => ({ ...s, engagement: r }));
        break;
      }
      case 'checklist': {
        const r = await ai.runChecklist(payload);
        if (r) setState(s => ({ ...s, checklist: r }));
        break;
      }
      case 'suggestions': {
        const r = await ai.runSuggestions(payload);
        if (r) setState(s => ({ ...s, suggestions: r }));
        break;
      }
    }
  };

  const hasData = (tab: EditorialTab) => {
    const map: Record<EditorialTab, unknown> = {
      overview: state.overall, readability: state.readability, seo: state.seo,
      headline: state.headline, engagement: state.engagement, checklist: state.checklist,
      suggestions: state.suggestions,
    };
    return !!map[tab];
  };

  const isLoading = (actionKey: string) => ai.loadingAction === actionKey;
  const anyLoading = !!ai.loadingAction;
  const isKeyConfigured = apiKey.length > 10;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck size={14} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">AI Editorial Review</p>
            {state.overall && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Score: {state.overall.overallScore} · {state.overall.verdict}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {state.overall && <ScoreRing score={state.overall.overallScore} size="sm" />}
          {isOpen ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {/* API key config */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700 space-y-3">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); localStorage.setItem('openai_api_key', e.target.value); }}
                placeholder="Enter OpenAI API key (sk-...)"
                className="w-full pl-7 pr-8 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
              <Key size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showKey ? <EyeOff size={10} /> : <Eye size={10} />}
              </button>
            </div>

            <button
              onClick={handleRunAll}
              disabled={!isKeyConfigured || anyLoading || !title || !content}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors"
            >
              {isLoading('editorial_review') ? (
                <><Loader2 size={13} className="animate-spin" /> Analyzing Article...</>
              ) : (
                <><RefreshCw size={13} /> {state.overall ? 'Re-analyze Article' : 'Run Full Editorial Review'}</>
              )}
            </button>

            {ai.error && (
              <div className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
                <AlertCircle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-400">{ai.error}</p>
              </div>
            )}

            {(!title || !content) && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle size={10} /> Add title and content before running a review
              </p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-700 scrollbar-hide">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const done = hasData(tab.key);
              const loading = isLoading(tab.actionKey);
              return (
                <button
                  key={tab.key}
                  onClick={() => !anyLoading && handleRunTab(tab.key)}
                  disabled={!isKeyConfigured || (!done && anyLoading)}
                  className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 text-[10px] font-semibold border-b-2 transition-all ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20'
                      : done
                      ? 'border-emerald-400 text-emerald-600 dark:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {loading ? <Loader2 size={11} className="animate-spin" /> : <Icon size={11} />}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {activeTab === 'overview' && (
              state.overall
                ? <OverviewPanel review={state.overall} onNavigate={tab => handleRunTab(tab)} />
                : <EmptyTabState label="Run a Full Editorial Review to see your quality report" icon={ClipboardCheck} onRun={() => handleRunTab('overview')} loading={isLoading('editorial_review')} disabled={!isKeyConfigured || !title || !content} />
            )}
            {activeTab === 'readability' && (
              state.readability
                ? <ReadabilityPanel result={state.readability} />
                : <EmptyTabState label="Analyze readability" icon={BookOpen} onRun={() => handleRunTab('readability')} loading={isLoading('editorial_readability')} disabled={!isKeyConfigured || !title || !content} />
            )}
            {activeTab === 'seo' && (
              state.seo
                ? <SeoPanel result={state.seo} />
                : <EmptyTabState label="Run SEO analysis" icon={Search} onRun={() => handleRunTab('seo')} loading={isLoading('editorial_seo')} disabled={!isKeyConfigured || !title || !content} />
            )}
            {activeTab === 'headline' && (
              state.headline
                ? <HeadlinePanel result={state.headline} onUseHeadline={onUseHeadline} />
                : <EmptyTabState label="Analyze headline effectiveness" icon={HeadingIcon} onRun={() => handleRunTab('headline')} loading={isLoading('editorial_headline')} disabled={!isKeyConfigured || !title} />
            )}
            {activeTab === 'engagement' && (
              state.engagement
                ? <EngagementPanel result={state.engagement} />
                : <EmptyTabState label="Predict engagement" icon={Users} onRun={() => handleRunTab('engagement')} loading={isLoading('editorial_engagement')} disabled={!isKeyConfigured || !title || !content} />
            )}
            {activeTab === 'checklist' && (
              state.checklist
                ? <ChecklistPanel result={state.checklist} />
                : <EmptyTabState label="Generate pre-publish checklist" icon={ListChecks} onRun={() => handleRunTab('checklist')} loading={isLoading('editorial_checklist')} disabled={!isKeyConfigured || !title} />
            )}
            {activeTab === 'suggestions' && (
              state.suggestions
                ? <SuggestionsPanel result={state.suggestions} />
                : <EmptyTabState label="Get improvement suggestions" icon={Lightbulb} onRun={() => handleRunTab('suggestions')} loading={isLoading('editorial_suggestions')} disabled={!isKeyConfigured || !title || !content} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyTabState({
  label, icon: Icon, onRun, loading, disabled,
}: { label: string; icon: React.ElementType; onRun: () => void; loading: boolean; disabled: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
        {loading ? <Loader2 size={20} className="text-blue-500 animate-spin" /> : <Icon size={20} className="text-gray-400" />}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 max-w-[180px] leading-relaxed">{label}</p>
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
