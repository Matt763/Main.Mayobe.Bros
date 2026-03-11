import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../lib/api';
import {
  Bot, Sparkles, ShieldCheck, BarChart2, Search, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp,
  Copy, Check, Key, Eye, EyeOff, Zap, FileText, Star,
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type TabId = 'quality' | 'detect' | 'humanize' | 'eeat' | 'spam';

interface PostOption { id: string; title: string; slug: string; content: string; excerpt: string; featuredImage: string; }

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100 dark:text-gray-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="rotate-90" style={{ transform: `rotate(90deg) translate(0, 0)`, fontSize: size * 0.22, fontWeight: 800, fill: color }}>
      </text>
    </svg>
  );
}

function ScoreDisplay({ score, label, size = 80 }: { score: number; label?: string; size?: number }) {
  const color = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <ScoreRing score={score} size={size} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-black ${color}`} style={{ fontSize: size * 0.22 }}>{score}</span>
        </div>
      </div>
      {label && <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">{label}</span>}
    </div>
  );
}

function DimBar({ label, score, feedback }: { label: string; score: number; feedback: string }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{score}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{feedback}</p>
    </div>
  );
}

export default function AIHumanizerPage() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostOption | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('quality');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Record<TabId, any>>({ quality: null, detect: null, humanize: null, eeat: null, spam: null });
  const [humanizedContent, setHumanizedContent] = useState('');
  const [eeatEnhanced, setEeatEnhanced] = useState('');
  const [copied, setCopied] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const saveKey = (k: string) => {
    setApiKey(k);
    localStorage.setItem('openai_api_key', k);
  };

  const loadPosts = async () => {
    setLoadingPosts(true);
    try {
      const data = await api.posts.list({ status: 'all' });
      setPosts((data || []).map((p: any) => ({
        id: p.id, title: p.title, slug: p.slug,
        content: p.content || '', excerpt: p.excerpt || '',
        featuredImage: p.featuredImage || '',
      })));
    } finally {
      setLoadingPosts(false);
    }
  };

  const callAI = async (action: string, extraBody: Record<string, any> = {}) => {
    if (!apiKey) { setError('Please enter your OpenAI API key.'); return null; }
    if (!selectedPost) { setError('Please select an article.'); return null; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'X-OpenAI-Key': apiKey,
        },
        body: JSON.stringify({
          action,
          title: selectedPost.title,
          content: selectedPost.content,
          excerpt: selectedPost.excerpt,
          featuredImage: selectedPost.featuredImage,
          ...extraBody,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.result;
    } catch (e: any) {
      setError(e.message || 'AI request failed.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const runQualityScore = async () => {
    const raw = await callAI('quality_score');
    if (!raw) return;
    try { setResults(r => ({ ...r, quality: JSON.parse(raw) })); }
    catch { setError('Could not parse quality score response.'); }
  };

  const runDetect = async () => {
    const raw = await callAI('detect_ai_content');
    if (!raw) return;
    try { setResults(r => ({ ...r, detect: JSON.parse(raw) })); }
    catch { setError('Could not parse AI detection response.'); }
  };

  const runHumanize = async () => {
    const raw = await callAI('humanize_content');
    if (!raw) return;
    setHumanizedContent(raw);
    setResults(r => ({ ...r, humanize: { done: true } }));
  };

  const runEEAT = async () => {
    const raw = await callAI('eeat_analysis');
    if (!raw) return;
    try { setResults(r => ({ ...r, eeat: JSON.parse(raw) })); }
    catch { setError('Could not parse EEAT response.'); }
  };

  const runEEATEnhance = async () => {
    const raw = await callAI('eeat_enhance');
    if (!raw) return;
    setEeatEnhanced(raw);
  };

  const runSpam = async () => {
    const raw = await callAI('spam_check');
    if (!raw) return;
    try { setResults(r => ({ ...r, spam: JSON.parse(raw) })); }
    catch { setError('Could not parse spam check response.'); }
  };

  const runAll = async () => {
    if (!apiKey || !selectedPost) { setError('Select an article and enter your API key.'); return; }
    setError('');
    const actions: [string, TabId][] = [
      ['quality_score', 'quality'],
      ['detect_ai_content', 'detect'],
      ['eeat_analysis', 'eeat'],
      ['spam_check', 'spam'],
    ];
    for (const [action, tab] of actions) {
      const raw = await callAI(action);
      if (raw) {
        try { setResults(r => ({ ...r, [tab]: JSON.parse(raw) })); } catch {}
      }
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const toggleSection = (key: string) => setExpandedSections(e => ({ ...e, [key]: !e[key] }));

  const tabs: { id: TabId; label: string; icon: any; desc: string }[] = [
    { id: 'quality', label: 'Quality Score', icon: Star, desc: 'Overall content quality rating' },
    { id: 'detect', label: 'AI Detection', icon: Bot, desc: 'Detect AI-generated content' },
    { id: 'humanize', label: 'Humanize', icon: Sparkles, desc: 'Rewrite to sound human' },
    { id: 'eeat', label: 'EEAT', icon: ShieldCheck, desc: 'Google EEAT signal analysis' },
    { id: 'spam', label: 'Spam Check', icon: Search, desc: 'AdSense policy compliance' },
  ];

  const verdictColor = (v: string) => {
    if (!v) return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    const lv = v.toLowerCase();
    if (lv.includes('ready') || lv.includes('compliant') || lv.includes('human') || lv.includes('strong')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    if (lv.includes('polish') || lv.includes('minor') || lv.includes('possibly') || lv.includes('moderate eeat')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Sparkles size={28} className="text-blue-600" />
            AI Content Quality & Humanizer
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Detect AI content, measure quality, check EEAT signals, and humanize articles for AdSense approval.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-5">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
              <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Setup</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">OpenAI API Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => saveKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full pl-9 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <button onClick={() => setShowKey(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Stored locally in your browser only.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Article</label>
                  <button
                    onClick={loadPosts}
                    disabled={loadingPosts}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {loadingPosts ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                    Load posts
                  </button>
                </div>
                <select
                  value={selectedPost?.id || ''}
                  onChange={e => setSelectedPost(posts.find(p => p.id === e.target.value) || null)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">— choose article —</option>
                  {posts.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                {selectedPost && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {selectedPost.content ? `~${selectedPost.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length} words` : 'No content'}
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3">
                  <XCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={runAll}
                disabled={loading || !selectedPost || !apiKey}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
                {loading ? 'Running analysis...' : 'Run Full Analysis'}
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const hasResult = !!results[tab.id] || (tab.id === 'humanize' && humanizedContent);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                      {hasResult && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                    </button>
                  );
                })}
              </div>

              <div className="p-5">
                {activeTab === 'quality' && (
                  <QualityPanel
                    result={results.quality}
                    loading={loading}
                    onRun={runQualityScore}
                    verdictColor={verdictColor}
                    DimBar={DimBar}
                    ScoreDisplay={ScoreDisplay}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                  />
                )}
                {activeTab === 'detect' && (
                  <DetectPanel
                    result={results.detect}
                    loading={loading}
                    onRun={runDetect}
                    verdictColor={verdictColor}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                  />
                )}
                {activeTab === 'humanize' && (
                  <HumanizePanel
                    result={results.humanize}
                    humanizedContent={humanizedContent}
                    loading={loading}
                    onRun={runHumanize}
                    onRunEEAT={runEEATEnhance}
                    eeatEnhanced={eeatEnhanced}
                    copied={copied}
                    onCopy={copyText}
                  />
                )}
                {activeTab === 'eeat' && (
                  <EEATPanel
                    result={results.eeat}
                    loading={loading}
                    onRun={runEEAT}
                    verdictColor={verdictColor}
                    DimBar={DimBar}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                  />
                )}
                {activeTab === 'spam' && (
                  <SpamPanel
                    result={results.spam}
                    loading={loading}
                    onRun={runSpam}
                    verdictColor={verdictColor}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Score Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <ScoreDisplay score={results.quality?.overallScore ?? 0} label="Quality" size={72} />
                <ScoreDisplay score={results.detect?.humanScore ?? 0} label="Human Score" size={72} />
                <ScoreDisplay score={results.eeat?.eeatScore ?? 0} label="EEAT" size={72} />
                <ScoreDisplay score={results.spam?.complianceScore ?? 0} label="AdSense Safe" size={72} />
              </div>
              {(results.quality || results.detect || results.eeat || results.spam) && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {(() => {
                    const avg = [
                      results.quality?.overallScore,
                      results.detect?.humanScore,
                      results.eeat?.eeatScore,
                      results.spam?.complianceScore,
                    ].filter(Boolean);
                    const mean = avg.length ? Math.round(avg.reduce((a, b) => a + b, 0) / avg.length) : 0;
                    const color = mean >= 80 ? 'text-green-600 dark:text-green-400' : mean >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
                    const label = mean >= 80 ? 'Ready to publish' : mean >= 60 ? 'Needs improvement' : 'Major issues found';
                    return (
                      <div className="text-center">
                        <div className={`text-3xl font-black ${color}`}>{mean}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Individual Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Quality Score', tab: 'quality' as TabId, action: runQualityScore, icon: Star, color: 'text-yellow-500' },
                  { label: 'Detect AI Content', tab: 'detect' as TabId, action: runDetect, icon: Bot, color: 'text-blue-500' },
                  { label: 'Humanize Content', tab: 'humanize' as TabId, action: runHumanize, icon: Sparkles, color: 'text-green-500' },
                  { label: 'EEAT Analysis', tab: 'eeat' as TabId, action: runEEAT, icon: ShieldCheck, color: 'text-teal-500' },
                  { label: 'Spam Check', tab: 'spam' as TabId, action: runSpam, icon: Search, color: 'text-red-500' },
                  { label: 'EEAT Enhance', tab: 'humanize' as TabId, action: runEEATEnhance, icon: Zap, color: 'text-orange-500' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => { setActiveTab(item.tab); item.action(); }}
                      disabled={loading || !selectedPost || !apiKey}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 text-left"
                    >
                      <Icon size={15} className={item.color} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                      {loading && activeTab === item.tab && <RefreshCw size={12} className="ml-auto animate-spin text-gray-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4">
              <h3 className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-2 flex items-center gap-1.5">
                <FileText size={14} /> How it works
              </h3>
              <ul className="space-y-1.5">
                {[
                  'Select any article from your posts',
                  'Run Full Analysis for all checks at once',
                  'Or run individual checks from the tabs',
                  'Humanize rewrites robotic AI text',
                  'EEAT Enhance adds authority signals',
                  'Copy rewritten content back to editor',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-blue-800 dark:text-blue-300">
                    <CheckCircle size={11} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function QualityPanel({ result, loading, onRun, verdictColor, DimBar, ScoreDisplay, expandedSections, toggleSection }: any) {
  if (loading) return <LoadingState label="Scoring content quality..." />;
  if (!result) return (
    <EmptyState
      icon={Star}
      title="Content Quality Score"
      desc="Evaluates depth, readability, originality, structure, EEAT signals, and AdSense compliance."
      onRun={onRun}
      label="Run Quality Score"
    />
  );
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-5 flex-wrap">
        <ScoreDisplay score={result.overallScore} label="Overall" size={88} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${verdictColor(result.verdict)}`}>{result.verdict}</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Grade: {result.grade}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.estimatedRankingPotential === 'High' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : result.estimatedRankingPotential === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              {result.estimatedRankingPotential} ranking potential
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{result.summary}</p>
        </div>
      </div>

      <div className="space-y-3">
        {result.dimensions && Object.values(result.dimensions).map((dim: any) => (
          <DimBar key={dim.label} label={dim.label} score={dim.score} feedback={dim.feedback} />
        ))}
      </div>

      {result.mustFix?.length > 0 && (
        <IssueList title="Must Fix" items={result.mustFix} severity="error" />
      )}
      {result.shouldFix?.length > 0 && (
        <IssueList title="Should Fix" items={result.shouldFix} severity="warning" />
      )}
      {result.strengths?.length > 0 && (
        <IssueList title="Strengths" items={result.strengths} severity="success" />
      )}

      <button onClick={onRun} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
        <RefreshCw size={11} /> Re-run
      </button>
    </div>
  );
}

function DetectPanel({ result, loading, onRun, verdictColor, expandedSections, toggleSection }: any) {
  if (loading) return <LoadingState label="Scanning for AI content patterns..." />;
  if (!result) return (
    <EmptyState
      icon={Bot}
      title="AI Content Detection"
      desc="Detects AI-generated text, spam patterns, keyword stuffing, robotic phrases, and content quality issues."
      onRun={onRun}
      label="Run AI Detection"
    />
  );
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-5 flex-wrap">
        <div className="text-center">
          <div className={`text-4xl font-black ${result.aiProbability >= 70 ? 'text-red-500' : result.aiProbability >= 40 ? 'text-yellow-500' : 'text-green-500'}`}>
            {result.aiProbability}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">AI Probability</div>
        </div>
        <div className="text-center">
          <div className={`text-4xl font-black ${result.humanScore >= 70 ? 'text-green-500' : result.humanScore >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
            {result.humanScore}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Human Score</div>
        </div>
        <div className="flex-1 min-w-0">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${verdictColor(result.verdict)}`}>{result.verdict}</span>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{result.overallAssessment}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Spam Score', value: result.spamScore, reverse: true },
          { label: 'Readability', value: result.readabilityScore },
        ].map(item => (
          <div key={item.label} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-center">
            <div className={`text-2xl font-black ${(item.reverse ? item.value <= 30 : item.value >= 70) ? 'text-green-500' : (item.reverse ? item.value <= 60 : item.value >= 40) ? 'text-yellow-500' : 'text-red-500'}`}>
              {item.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Flag active={result.keywordStuffing} label="Keyword Stuffing" />
        <Flag active={result.repetitivePatterns} label="Repetitive Patterns" />
        <Flag active={result.recommendHumanization} label="Needs Humanization" />
      </div>

      {result.roboticPhrases?.filter(Boolean).length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Robotic Phrases Found</p>
          <div className="flex flex-wrap gap-2">
            {result.roboticPhrases.filter(Boolean).map((p: string, i: number) => (
              <span key={i} className="px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-100 dark:border-red-800">
                "{p}"
              </span>
            ))}
          </div>
        </div>
      )}

      {result.qualityFlags?.length > 0 && (
        <CollapsibleSection
          title={`Quality Flags (${result.qualityFlags.length})`}
          id="flags"
          expanded={expandedSections['flags']}
          onToggle={() => toggleSection('flags')}
        >
          <div className="space-y-2">
            {result.qualityFlags.map((flag: any, i: number) => (
              <div key={i} className={`rounded-lg p-3 text-sm ${flag.severity === 'High' ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800' : flag.severity === 'Medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700'}`}>
                <div className="font-semibold text-gray-900 dark:text-white">{flag.type} <span className="text-xs font-normal opacity-60">({flag.severity})</span></div>
                <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{flag.description}</div>
                {flag.location && <div className="text-gray-400 text-xs mt-0.5 italic">{flag.location}</div>}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {result.priorityFixes?.length > 0 && (
        <IssueList title="Priority Fixes" items={result.priorityFixes} severity="warning" />
      )}

      <button onClick={onRun} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
        <RefreshCw size={11} /> Re-run
      </button>
    </div>
  );
}

function HumanizePanel({ result, humanizedContent, loading, onRun, onRunEEAT, eeatEnhanced, copied, onCopy }: any) {
  const [view, setView] = useState<'humanize' | 'eeat'>('humanize');

  if (loading) return <LoadingState label="Rewriting content to sound human..." />;

  if (!result && !humanizedContent) return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Sparkles size={24} className="text-green-500" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Content Humanizer</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-5">
          Rewrites AI-sounding content to be natural, engaging, and human-written. Preserves all information while improving tone and flow.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto">
          <button onClick={onRun} className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm">
            <Sparkles size={14} /> Humanize Content
          </button>
          <button onClick={onRunEEAT} className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-teal-700 transition-colors text-sm">
            <Zap size={14} /> EEAT Enhance
          </button>
        </div>
      </div>
    </div>
  );

  const content = view === 'humanize' ? humanizedContent : eeatEnhanced;
  const key = view === 'humanize' ? 'humanized' : 'eeat';

  return (
    <div className="space-y-4">
      {humanizedContent && eeatEnhanced && (
        <div className="flex gap-2">
          <button onClick={() => setView('humanize')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${view === 'humanize' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>Humanized</button>
          <button onClick={() => setView('eeat')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${view === 'eeat' ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>EEAT Enhanced</button>
        </div>
      )}

      {content && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {view === 'humanize' ? 'Humanized Content' : 'EEAT-Enhanced Content'}
            </p>
            <button
              onClick={() => onCopy(content, key)}
              className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {copied === key ? <Check size={12} /> : <Copy size={12} />}
              {copied === key ? 'Copied!' : 'Copy HTML'}
            </button>
          </div>
          <div
            className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-h-80 overflow-y-auto border border-gray-100 dark:border-gray-700 prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
          <p className="text-xs text-gray-400 dark:text-gray-500">Copy the HTML above and paste it into the article editor to replace the original content.</p>
        </>
      )}

      <div className="flex gap-2 flex-wrap">
        {!humanizedContent && (
          <button onClick={onRun} className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm">
            <Sparkles size={13} /> Humanize Content
          </button>
        )}
        {!eeatEnhanced && (
          <button onClick={onRunEEAT} className="flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-teal-700 transition-colors text-sm">
            <Zap size={13} /> EEAT Enhance
          </button>
        )}
        {humanizedContent && (
          <button onClick={onRun} className="text-xs text-gray-500 dark:text-gray-400 hover:underline flex items-center gap-1">
            <RefreshCw size={11} /> Re-humanize
          </button>
        )}
      </div>
    </div>
  );
}

function EEATPanel({ result, loading, onRun, verdictColor, DimBar, expandedSections, toggleSection }: any) {
  if (loading) return <LoadingState label="Analyzing EEAT signals..." />;
  if (!result) return (
    <EmptyState
      icon={ShieldCheck}
      title="EEAT Signal Analysis"
      desc="Measures Experience, Expertise, Authoritativeness, and Trustworthiness — Google's core quality criteria."
      onRun={onRun}
      label="Run EEAT Analysis"
    />
  );
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-5 flex-wrap">
        <div className="text-center">
          <div className={`text-4xl font-black ${result.eeatScore >= 70 ? 'text-green-500' : result.eeatScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
            {result.eeatScore}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">EEAT Score</div>
        </div>
        <div className="flex-1 min-w-0">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${verdictColor(result.verdict)}`}>{result.verdict}</span>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{result.summary}</p>
        </div>
      </div>

      <div className="space-y-3">
        {result.dimensions && Object.values(result.dimensions).map((dim: any) => (
          <DimBar key={dim.label} label={dim.label} score={dim.score} feedback={dim.feedback} />
        ))}
      </div>

      {result.missingSignals?.length > 0 && (
        <IssueList title="Missing EEAT Signals" items={result.missingSignals} severity="warning" />
      )}

      {result.improvements?.length > 0 && (
        <CollapsibleSection
          title={`Improvements (${result.improvements.length})`}
          id="eeat-improvements"
          expanded={expandedSections['eeat-improvements']}
          onToggle={() => toggleSection('eeat-improvements')}
        >
          <div className="space-y-3">
            {result.improvements.map((imp: any, i: number) => (
              <div key={i} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">{imp.dimension}</div>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{imp.action}</p>
                {imp.example && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{imp.example}</p>}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      <button onClick={onRun} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
        <RefreshCw size={11} /> Re-run
      </button>
    </div>
  );
}

function SpamPanel({ result, loading, onRun, verdictColor, expandedSections, toggleSection }: any) {
  if (loading) return <LoadingState label="Checking AdSense policy compliance..." />;
  if (!result) return (
    <EmptyState
      icon={Search}
      title="AdSense Spam & Policy Check"
      desc="Scans for keyword stuffing, thin content, misleading claims, and other Google AdSense policy violations."
      onRun={onRun}
      label="Run Spam Check"
    />
  );
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-5 flex-wrap">
        <div className="text-center">
          <div className={`text-4xl font-black ${result.complianceScore >= 80 ? 'text-green-500' : result.complianceScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
            {result.complianceScore}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Compliance</div>
        </div>
        <div className="text-center">
          <div className={`text-4xl font-black ${result.spamScore <= 20 ? 'text-green-500' : result.spamScore <= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
            {result.spamScore}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Spam Risk</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${verdictColor(result.verdict)}`}>{result.verdict}</span>
            <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${result.adsenseSafe ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
              {result.adsenseSafe ? <CheckCircle size={11} /> : <XCircle size={11} />}
              AdSense {result.adsenseSafe ? 'Safe' : 'Unsafe'}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{result.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { label: 'Keyword Issues', value: result.keywordDensityIssues },
          { label: 'Content Uniqueness', value: result.contentUniqueness, text: true },
          { label: 'Human Readability', value: result.readabilityForHumans, text: true },
        ].map(item => (
          <div key={item.label} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-center">
            <div className="text-sm font-bold text-gray-900 dark:text-white">{item.text ? item.value : item.value ? '⚠ Yes' : '✓ No'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {result.violations?.length > 0 && (
        <CollapsibleSection
          title={`Policy Violations (${result.violations.length})`}
          id="violations"
          expanded={expandedSections['violations']}
          onToggle={() => toggleSection('violations')}
        >
          <div className="space-y-2">
            {result.violations.map((v: any, i: number) => (
              <div key={i} className={`rounded-lg p-3 ${v.severity === 'Critical' || v.severity === 'High' ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.severity === 'Critical' || v.severity === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'}`}>{v.severity}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{v.type}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{v.description}</p>
                {v.fix && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">Fix: {v.fix}</p>}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {result.recommendations?.length > 0 && (
        <IssueList title="Recommendations" items={result.recommendations} severity="info" />
      )}

      <button onClick={onRun} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
        <RefreshCw size={11} /> Re-run
      </button>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, onRun, label }: any) {
  return (
    <div className="text-center py-8">
      <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
        <Icon size={24} className="text-blue-400" />
      </div>
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-5">{desc}</p>
      <button onClick={onRun} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm mx-auto">
        <Sparkles size={14} /> {label}
      </button>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="text-center py-12">
      <RefreshCw size={28} className="animate-spin text-blue-400 mx-auto mb-3" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function IssueList({ title, items, severity }: { title: string; items: string[]; severity: 'error' | 'warning' | 'success' | 'info' }) {
  const colors = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    success: 'text-green-500',
    info: 'text-blue-500',
  };
  const icon = severity === 'error' ? XCircle : severity === 'success' ? CheckCircle : AlertTriangle;
  const Icon = icon;
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item: string, i: number) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Icon size={13} className={`${colors[severity]} flex-shrink-0 mt-0.5`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CollapsibleSection({ title, id, expanded, onToggle, children }: any) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
      >
        {title}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && children}
    </div>
  );
}

function Flag({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${active ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
      {active ? <XCircle size={11} /> : <CheckCircle size={11} />}
      {label}: {active ? 'Yes' : 'No'}
    </span>
  );
}
