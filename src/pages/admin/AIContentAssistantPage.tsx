import { useState, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  Sparkles, Wand2, FileText, List, BookOpen, Zap, RefreshCw,
  Copy, Check, AlertCircle, Key, X, Share2, Tag, BarChart2,
  Image, Globe, Type, ChevronDown, ChevronRight,
  Newspaper, Lightbulb, MessageSquare, PenTool, Languages,
  Crown, Settings, Eye, EyeOff,
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type Action =
  | 'generate_article'
  | 'generate_intro'
  | 'generate_headings'
  | 'generate_conclusion'
  | 'improve_readability'
  | 'rewrite_professional'
  | 'rewrite_simple'
  | 'rewrite_engaging'
  | 'generate_summary'
  | 'generate_excerpt'
  | 'suggest_tags'
  | 'seo_analysis'
  | 'generate_social'
  | 'generate_headlines'
  | 'image_prompt'
  | 'translate';

interface SeoResult {
  score: number;
  suggestions: string[];
  metaDescription: string;
  improvedTitle: string;
}

interface SocialResult {
  facebook: string;
  twitter: string;
  linkedin: string;
}

type ResultType = 'text' | 'seo' | 'social' | 'tags' | 'headlines' | 'image_prompts';

interface AIResult {
  type: ResultType;
  text?: string;
  seo?: SeoResult;
  social?: SocialResult;
  tags?: string[];
  headlines?: string[];
  imagePrompts?: string[];
}

const LANGUAGES = [
  'Spanish', 'French', 'German', 'Portuguese', 'Italian',
  'Dutch', 'Polish', 'Japanese', 'Chinese (Simplified)', 'Arabic',
  'Russian', 'Korean', 'Hindi', 'Turkish', 'Swedish',
];

const TOOL_SECTIONS = [
  {
    id: 'article',
    label: 'Article Generation',
    icon: Newspaper,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    tools: [
      { action: 'generate_article' as Action, label: 'Generate Full Article', icon: Wand2, desc: 'Complete structured article with headings and sections', needsTitle: true },
      { action: 'generate_intro' as Action, label: 'Write Introduction', icon: FileText, desc: 'Compelling hook and opening paragraph', needsTitle: true },
      { action: 'generate_headings' as Action, label: 'Generate Section Headings', icon: List, desc: 'Outline of 5-7 section headings', needsTitle: true },
      { action: 'generate_conclusion' as Action, label: 'Write Conclusion', icon: BookOpen, desc: 'Strong closing with call to action', needsTitle: true },
    ],
  },
  {
    id: 'headlines',
    label: 'Headline Generator',
    icon: Type,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    tools: [
      { action: 'generate_headlines' as Action, label: 'Generate 8 Headlines', icon: Lightbulb, desc: 'Click-worthy headline variations for any topic', needsTitle: true },
    ],
  },
  {
    id: 'rewrite',
    label: 'Content Rewriting',
    icon: PenTool,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    tools: [
      { action: 'improve_readability' as Action, label: 'Improve Readability', icon: RefreshCw, desc: 'Clearer sentences and better flow', needsContent: true },
      { action: 'rewrite_professional' as Action, label: 'Make Professional', icon: Zap, desc: 'Polished, business-appropriate tone', needsContent: true },
      { action: 'rewrite_simple' as Action, label: 'Simplify Language', icon: MessageSquare, desc: 'Plain language for general audiences', needsContent: true },
      { action: 'rewrite_engaging' as Action, label: 'Make More Engaging', icon: Sparkles, desc: 'Vivid, compelling and energetic writing', needsContent: true },
    ],
  },
  {
    id: 'seo',
    label: 'SEO Optimization',
    icon: BarChart2,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800',
    tools: [
      { action: 'seo_analysis' as Action, label: 'Analyze SEO Score', icon: BarChart2, desc: 'Score, suggestions and meta description', needsContent: true },
      { action: 'generate_summary' as Action, label: 'Generate Meta Description', icon: FileText, desc: 'SEO-optimized meta description under 160 chars', needsTitle: true },
      { action: 'generate_excerpt' as Action, label: 'Generate Excerpt', icon: BookOpen, desc: 'Enticing excerpt that drives clicks', needsTitle: true },
      { action: 'suggest_tags' as Action, label: 'Suggest Keywords & Tags', icon: Tag, desc: '8-12 relevant SEO tags', needsTitle: true },
    ],
  },
  {
    id: 'image',
    label: 'Featured Image Ideas',
    icon: Image,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800',
    tools: [
      { action: 'image_prompt' as Action, label: 'Generate Image Prompts', icon: Image, desc: '3 detailed prompts for AI image generation', needsTitle: true },
    ],
  },
  {
    id: 'social',
    label: 'Social Media',
    icon: Share2,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
    tools: [
      { action: 'generate_social' as Action, label: 'Generate Social Posts', icon: Share2, desc: 'Facebook, Twitter, and LinkedIn posts', needsTitle: true },
    ],
  },
  {
    id: 'translate',
    label: 'Translation',
    icon: Languages,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800',
    tools: [
      { action: 'translate' as Action, label: 'Translate Content', icon: Globe, desc: 'Translate article into any language', needsContent: true },
    ],
  },
];

export default function AIContentAssistantPage() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('Spanish');
  const [loading, setLoading] = useState<Action | null>(null);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['article', 'headlines']));
  const resultRef = useRef<HTMLDivElement>(null);

  const saveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey.trim());
    setShowKeyInput(false);
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const callAI = async (action: Action) => {
    if (!apiKey.trim()) {
      setShowKeyInput(true);
      setError('Please configure your OpenAI API key first.');
      return;
    }
    if (!topic.trim() && !content.trim()) {
      setError('Please enter a topic or paste content to work with.');
      return;
    }

    setLoading(action);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'X-OpenAI-Key': apiKey.trim(),
        },
        body: JSON.stringify({
          action,
          title: topic,
          content,
          topic,
          language: selectedLanguage,
          selectedText: content,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const raw: string = data.result || '';

      if (action === 'seo_analysis') {
        try {
          const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
          setResult({ type: 'seo', seo: JSON.parse(cleaned) });
        } catch {
          setResult({ type: 'text', text: raw });
        }
      } else if (action === 'generate_social') {
        try {
          const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
          setResult({ type: 'social', social: JSON.parse(cleaned) });
        } catch {
          setResult({ type: 'text', text: raw });
        }
      } else if (action === 'suggest_tags') {
        try {
          const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
          setResult({ type: 'tags', tags: JSON.parse(cleaned) });
        } catch {
          setResult({ type: 'text', text: raw });
        }
      } else if (action === 'generate_headlines') {
        try {
          const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
          setResult({ type: 'headlines', headlines: JSON.parse(cleaned) });
        } catch {
          setResult({ type: 'text', text: raw });
        }
      } else if (action === 'image_prompt') {
        try {
          const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
          setResult({ type: 'image_prompts', imagePrompts: JSON.parse(cleaned) });
        } catch {
          setResult({ type: 'text', text: raw });
        }
      } else {
        setResult({ type: 'text', text: raw });
      }

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI request failed. Please check your API key and try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleUseInEditor = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
      setCopied('editor');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const isLoading = loading !== null;
  const hasContent = topic.trim() || content.trim();

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
                <Sparkles size={18} className="text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                AI Content Assistant
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                <Crown size={10} /> CEO Only
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">
              Generate articles, optimize SEO, create headlines, translate content, and more
            </p>
          </div>
          <button
            onClick={() => setShowKeyInput(v => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all flex-shrink-0 ${
              apiKey
                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
            }`}
          >
            <Key size={14} />
            {apiKey ? 'API Key Configured' : 'Configure API Key'}
          </button>
        </div>

        {/* API Key Panel */}
        {showKeyInput && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings size={14} className="text-gray-500" />
                  OpenAI API Key
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Your key is stored only in your browser and never sent to our servers.
                  Get your key at <span className="text-blue-600 dark:text-blue-400">platform.openai.com/api-keys</span>
                </p>
              </div>
              <button onClick={() => setShowKeyInput(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X size={14} className="text-gray-400" />
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full pr-10 pl-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                onClick={saveApiKey}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
              >
                Save Key
              </button>
              {apiKey && (
                <button
                  onClick={() => { setApiKey(''); localStorage.removeItem('openai_api_key'); }}
                  className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left: Input Panel */}
          <div className="xl:col-span-2 space-y-5">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Wand2 size={14} className="text-amber-500" />
                Topic / Content Input
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Topic or Headline</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. The Future of Online Learning"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Article Content
                  <span className="ml-1 text-gray-400 font-normal">(paste existing content to rewrite, analyze, or translate)</span>
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste your article content here for rewriting, SEO analysis, translation..."
                  rows={10}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 resize-none leading-relaxed"
                />
                {content && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">{content.length.toLocaleString()} characters</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Languages size={11} />
                  Translation Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={e => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                >
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
                <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {!apiKey && (
              <div className="flex items-start gap-2.5 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                <Key size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">API Key Required</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Configure your OpenAI API key using the button above to start generating content.</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Tools + Result */}
          <div className="xl:col-span-3 space-y-4">
            {/* Tool Sections */}
            {TOOL_SECTIONS.map(section => {
              const SectionIcon = section.icon;
              const isExpanded = expandedSections.has(section.id);
              return (
                <div key={section.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${section.bg} border ${section.border}`}>
                        <SectionIcon size={13} className={section.color} />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{section.label}</span>
                      {section.id === 'translate' && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">— {selectedLanguage}</span>
                      )}
                    </div>
                    {isExpanded ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                      {section.tools.map(tool => {
                        const ToolIcon = tool.icon;
                        const isDisabled = isLoading || !apiKey || !hasContent;
                        const isActive = loading === tool.action;
                        return (
                          <button
                            key={tool.action}
                            onClick={() => callAI(tool.action)}
                            disabled={isDisabled}
                            className={`group flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                              isActive
                                ? `${section.bg} ${section.border} ${section.color}`
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/40 text-gray-700 dark:text-gray-300'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${section.bg} border ${section.border}`}>
                              {isActive
                                ? <RefreshCw size={11} className={`${section.color} animate-spin`} />
                                : <ToolIcon size={11} className={section.color} />
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold leading-snug">{isActive ? 'Generating...' : tool.label}</p>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">{tool.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Result Panel */}
            {result && (
              <div ref={resultRef} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">AI Result</span>
                  </div>
                  <button
                    onClick={() => setResult(null)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X size={13} className="text-gray-400" />
                  </button>
                </div>

                <div className="p-5">
                  {/* Text result */}
                  {result.type === 'text' && result.text && (
                    <div className="space-y-3">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 max-h-96 overflow-y-auto">
                        <div
                          className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: result.text }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUseInEditor}
                          className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          {copied === 'editor' ? <Check size={14} /> : <Copy size={14} />}
                          {copied === 'editor' ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SEO result */}
                  {result.type === 'seo' && result.seo && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-100 dark:text-gray-700" />
                            <circle
                              cx="18" cy="18" r="15.9" fill="none" strokeWidth="2.5"
                              strokeDasharray={`${result.seo.score} ${100 - result.seo.score}`}
                              strokeLinecap="round"
                              className={result.seo.score >= 80 ? 'text-emerald-500' : result.seo.score >= 60 ? 'text-amber-500' : 'text-red-500'}
                              stroke="currentColor"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-xl font-black ${result.seo.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : result.seo.score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                              {result.seo.score}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-900 dark:text-white">SEO Score: {result.seo.score} / 100</p>
                          <p className={`text-sm font-medium ${result.seo.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : result.seo.score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                            {result.seo.score >= 80 ? 'Excellent' : result.seo.score >= 60 ? 'Good — Room to Improve' : 'Needs Attention'}
                          </p>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                            <div
                              className={`h-2 rounded-full transition-all ${result.seo.score >= 80 ? 'bg-emerald-500' : result.seo.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${result.seo.score}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {result.seo.suggestions?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Recommendations</p>
                          {result.seo.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                              <span className="text-amber-500 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {result.seo.metaDescription && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Suggested Meta Description</p>
                          <div className="flex items-start gap-2">
                            <p className="flex-1 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 leading-relaxed">
                              {result.seo.metaDescription}
                            </p>
                            <button
                              onClick={() => handleCopy(result.seo!.metaDescription, 'meta')}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                            >
                              {copied === 'meta' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-gray-400" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {result.seo.improvedTitle && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Suggested Title</p>
                          <div className="flex items-start gap-2">
                            <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                              {result.seo.improvedTitle}
                            </p>
                            <button
                              onClick={() => handleCopy(result.seo!.improvedTitle, 'title')}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                            >
                              {copied === 'title' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-gray-400" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Headlines result */}
                  {result.type === 'headlines' && result.headlines && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{result.headlines.length} Headline Suggestions</p>
                      <div className="space-y-2">
                        {result.headlines.map((h, i) => (
                          <div key={i} className="flex items-start gap-2.5 group">
                            <span className="text-xs font-bold text-amber-500 w-5 flex-shrink-0 mt-1">{i + 1}</span>
                            <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2.5 leading-snug group-hover:bg-amber-50 dark:group-hover:bg-amber-950/20 transition-colors">
                              {h}
                            </p>
                            <button
                              onClick={() => handleCopy(h, `h-${i}`)}
                              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all flex-shrink-0 mt-1"
                            >
                              {copied === `h-${i}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-gray-400" />}
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleCopy(result.headlines!.join('\n'), 'all-headlines')}
                        className="w-full py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                      >
                        {copied === 'all-headlines' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        Copy All Headlines
                      </button>
                    </div>
                  )}

                  {/* Image prompts result */}
                  {result.type === 'image_prompts' && result.imagePrompts && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Featured Image Prompts</p>
                      {result.imagePrompts.map((prompt, i) => (
                        <div key={i} className="flex items-start gap-2.5 group">
                          <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Image size={12} className="text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{prompt}</p>
                          </div>
                          <button
                            onClick={() => handleCopy(prompt, `img-${i}`)}
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all flex-shrink-0 mt-1"
                          >
                            {copied === `img-${i}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-gray-400" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tags result */}
                  {result.type === 'tags' && result.tags && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{result.tags.length} Keywords & Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {result.tags.map((tag, i) => (
                          <button
                            key={i}
                            onClick={() => handleCopy(tag, `tag-${i}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-full text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                          >
                            {copied === `tag-${i}` ? <Check size={10} className="text-emerald-500" /> : <Tag size={10} />}
                            {tag}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handleCopy(result.tags!.join(', '), 'all-tags')}
                        className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl text-sm font-medium hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center justify-center gap-2"
                      >
                        {copied === 'all-tags' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        Copy All as Comma-Separated
                      </button>
                    </div>
                  )}

                  {/* Social result */}
                  {result.type === 'social' && result.social && (
                    <div className="space-y-3">
                      {(['facebook', 'twitter', 'linkedin'] as const).map(platform => (
                        <div key={platform} className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 capitalize">{platform}</span>
                            <button
                              onClick={() => handleCopy(result.social![platform], platform)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              {copied === platform ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-gray-400" />}
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{result.social[platform]}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
