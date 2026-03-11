import { useState } from 'react';
import {
  Sparkles, Wand2, FileText, List, BookOpen, Zap, RefreshCw,
  ChevronDown, ChevronUp, Copy, Check, AlertCircle, Key, X,
  Share2, Tag, BarChart2,
} from 'lucide-react';

interface AIAssistantProps {
  title: string;
  content: string;
  excerpt: string;
  onInsertContent: (html: string) => void;
  onSetExcerpt: (text: string) => void;
  onSetMetaDescription: (text: string) => void;
  onSetMetaKeywords: (text: string) => void;
}

type Action =
  | 'generate_article'
  | 'generate_intro'
  | 'generate_headings'
  | 'generate_conclusion'
  | 'improve_readability'
  | 'rewrite_professional'
  | 'generate_summary'
  | 'suggest_tags'
  | 'seo_analysis'
  | 'generate_social';

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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function AIAssistant({
  title,
  content,
  excerpt,
  onInsertContent,
  onSetMetaDescription,
  onSetMetaKeywords,
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState<Action | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [seoResult, setSeoResult] = useState<SeoResult | null>(null);
  const [socialResult, setSocialResult] = useState<SocialResult | null>(null);
  const [tagsResult, setTagsResult] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'seo' | 'social'>('write');

  const saveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey);
    setShowKeyInput(false);
  };

  const callAI = async (action: Action) => {
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }
    setLoading(action);
    setResult(null);
    setSeoResult(null);
    setSocialResult(null);
    setTagsResult(null);
    setError(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'X-OpenAI-Key': apiKey,
        },
        body: JSON.stringify({ action, title, content, excerpt }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const raw = data.result || '';

      if (action === 'seo_analysis') {
        try {
          const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
          setSeoResult(JSON.parse(cleaned));
        } catch {
          setError('Could not parse SEO analysis. Please try again.');
        }
      } else if (action === 'generate_social') {
        try {
          const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
          setSocialResult(JSON.parse(cleaned));
        } catch {
          setError('Could not parse social media content. Please try again.');
        }
      } else if (action === 'suggest_tags') {
        try {
          const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
          setTagsResult(JSON.parse(cleaned));
        } catch {
          setError('Could not parse tags. Please try again.');
        }
      } else {
        setResult(raw);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI request failed. Check your API key.');
    } finally {
      setLoading(null);
    }
  };

  const handleInsert = () => {
    if (result) onInsertContent(result);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = loading !== null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-blue-100 dark:border-blue-900/40 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">AI Writing Assistant</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Generate, improve and optimize content</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setShowKeyInput(!showKeyInput); }}
            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors"
            title="Configure API key"
          >
            <Key size={14} className={apiKey ? 'text-green-500' : 'text-gray-400'} />
          </button>
          {isOpen ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
        </div>
      </button>

      {showKeyInput && (
        <div className="px-4 pb-3 border-t border-blue-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 mb-2">Enter your OpenAI API key. Stored locally in your browser only.</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button onClick={saveApiKey} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">Save</button>
            <button onClick={() => setShowKeyInput(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="border-t border-blue-100 dark:border-gray-700">
          <div className="flex border-b border-blue-100 dark:border-gray-700">
            {(['write', 'seo', 'social'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab === 'write' ? 'Writing' : tab === 'seo' ? 'SEO' : 'Social'}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-2">
            {activeTab === 'write' && (
              <>
                <ActionButton icon={<Wand2 size={14} />} label="Generate Full Article" onClick={() => callAI('generate_article')} loading={loading === 'generate_article'} disabled={isLoading || !title} />
                <ActionButton icon={<FileText size={14} />} label="Write Introduction" onClick={() => callAI('generate_intro')} loading={loading === 'generate_intro'} disabled={isLoading || !title} />
                <ActionButton icon={<List size={14} />} label="Generate Headings" onClick={() => callAI('generate_headings')} loading={loading === 'generate_headings'} disabled={isLoading || !title} />
                <ActionButton icon={<BookOpen size={14} />} label="Write Conclusion" onClick={() => callAI('generate_conclusion')} loading={loading === 'generate_conclusion'} disabled={isLoading || !title} />
                <ActionButton icon={<RefreshCw size={14} />} label="Improve Readability" onClick={() => callAI('improve_readability')} loading={loading === 'improve_readability'} disabled={isLoading || !content} />
                <ActionButton icon={<Zap size={14} />} label="Rewrite Professionally" onClick={() => callAI('rewrite_professional')} loading={loading === 'rewrite_professional'} disabled={isLoading || !content} />
              </>
            )}
            {activeTab === 'seo' && (
              <>
                <ActionButton icon={<BarChart2 size={14} />} label="Analyze SEO Score" onClick={() => callAI('seo_analysis')} loading={loading === 'seo_analysis'} disabled={isLoading || !content} />
                <ActionButton icon={<FileText size={14} />} label="Generate Meta Summary" onClick={() => callAI('generate_summary')} loading={loading === 'generate_summary'} disabled={isLoading || !title} />
                <ActionButton icon={<Tag size={14} />} label="Suggest Tags / Keywords" onClick={() => callAI('suggest_tags')} loading={loading === 'suggest_tags'} disabled={isLoading || !title} />
              </>
            )}
            {activeTab === 'social' && (
              <ActionButton icon={<Share2 size={14} />} label="Generate Social Posts" onClick={() => callAI('generate_social')} loading={loading === 'generate_social'} disabled={isLoading || !title} />
            )}
          </div>

          {error && (
            <div className="mx-4 mb-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {result && (
            <div className="mx-4 mb-4 space-y-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-3 max-h-48 overflow-y-auto">
                <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: result }} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleInsert} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                  <Sparkles size={12} /> Insert into Editor
                </button>
                <button onClick={() => handleCopy(result)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                </button>
                <button onClick={() => setResult(null)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-400 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <X size={13} />
                </button>
              </div>
            </div>
          )}

          {seoResult && (
            <div className="mx-4 mb-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-black ${seoResult.score >= 80 ? 'text-green-500' : seoResult.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                  {seoResult.score}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-700 dark:text-gray-300">SEO Score</div>
                  <div className={`text-xs ${seoResult.score >= 80 ? 'text-green-500' : seoResult.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                    {seoResult.score >= 80 ? 'Excellent' : seoResult.score >= 60 ? 'Good' : 'Needs Work'}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${seoResult.score >= 80 ? 'bg-green-500' : seoResult.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${seoResult.score}%` }}
                    />
                  </div>
                </div>
              </div>
              {seoResult.suggestions?.length > 0 && (
                <div className="space-y-1">
                  {seoResult.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-amber-500 flex-shrink-0">•</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {seoResult.metaDescription && (
                <button
                  onClick={() => { onSetMetaDescription(seoResult.metaDescription); setSeoResult(null); }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Apply Suggested Meta Description
                </button>
              )}
            </div>
          )}

          {tagsResult && (
            <div className="mx-4 mb-4 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {tagsResult.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">{tag}</span>
                ))}
              </div>
              <button
                onClick={() => { onSetMetaKeywords(tagsResult.join(', ')); setTagsResult(null); }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Apply as Keywords
              </button>
            </div>
          )}

          {socialResult && (
            <div className="mx-4 mb-4 space-y-3">
              {(['facebook', 'twitter', 'linkedin'] as const).map((platform) => (
                <div key={platform} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 capitalize">{platform}</span>
                    <button onClick={() => handleCopy(socialResult[platform])} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                      <Copy size={11} className="text-gray-400" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{socialResult[platform]}</p>
                </div>
              ))}
              <button onClick={() => setSocialResult(null)} className="w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-500 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Dismiss</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  icon, label, onClick, loading, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-xs font-medium bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
    >
      <span className="flex-shrink-0 text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {loading ? <RefreshCw size={14} className="animate-spin" /> : icon}
      </span>
      {loading ? 'Generating...' : label}
    </button>
  );
}
