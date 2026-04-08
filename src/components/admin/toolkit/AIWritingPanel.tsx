import { useState } from 'react';
import {
  Sparkles, Wand2, AlignLeft, Maximize2, RefreshCw,
  LayoutList, FileText, Zap, Loader2, ChevronRight,
  Copy, Check, PlusCircle, ArrowRight, Shield, HelpCircle,
  Target, BookOpen,
} from 'lucide-react';

interface AIWritingPanelProps {
  title: string;
  content: string;
  onInsertContent: (html: string, replace?: boolean) => void;
  onSetTitle?: (t: string) => void;
}

type ActionGroup = 'generate' | 'enhance' | 'structure' | 'snippets';

const TONES = ['Professional', 'Casual', 'Friendly', 'Authoritative', 'Conversational', 'Academic'];

export default function AIWritingPanel({ title, content, onInsertContent }: AIWritingPanelProps) {
  const [activeGroup, setActiveGroup] = useState<ActionGroup>('generate');
  const [loading, setLoading]         = useState<string | null>(null);
  const [result, setResult]           = useState<{ action: string; text: string } | null>(null);
  const [tone, setTone]               = useState('Professional');
  const [customPrompt, setCustomPrompt] = useState('');
  const [headings, setHeadings]       = useState<string[]>([]);
  const [error, setError]             = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);

  const wordCount = content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

  const callWrite = async (action: string, extra?: Record<string, string>) => {
    setLoading(action);
    setError(null);
    setResult(null);
    setHeadings([]);
    try {
      const res = await fetch('/api/editor-ai/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, title, content, tone, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI request failed');

      if (action === 'suggest_headings') {
        setHeadings(data.headings || []);
      } else {
        setResult({ action, text: data.result || '' });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text.replace(/<[^>]+>/g, ' ').trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertHeading = (heading: string) => {
    onInsertContent(`<h2>${heading}</h2><p></p>`);
  };

  const groups: { id: ActionGroup; label: string; icon: typeof Sparkles }[] = [
    { id: 'generate',  label: 'Generate',  icon: Sparkles },
    { id: 'enhance',   label: 'Enhance',   icon: Wand2 },
    { id: 'structure', label: 'Structure', icon: LayoutList },
    { id: 'snippets',  label: 'Snippets',  icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* AdSense + EEAT compliance banner */}
      <div className="px-4 pt-3 pb-2 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 border-b border-violet-100 dark:border-violet-800">
        <div className="flex items-center gap-2 flex-wrap">
          <Shield size={12} className="text-violet-600 dark:text-violet-400 shrink-0" />
          <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AdSense-Ready • EEAT Compliant • SEO Optimized</span>
          <span className="ml-auto text-xs text-violet-500">
            {wordCount >= 4000
              ? <span className="text-green-600 dark:text-green-400 font-bold">✓ {wordCount.toLocaleString()} words — AdSense target met</span>
              : <span className="text-amber-600 dark:text-amber-400">Target: 4,000–5,000 words ({wordCount.toLocaleString()} / 4,000)</span>
            }
          </span>
        </div>
      </div>

      {/* Tone Selector */}
      <div className="px-4 pt-3 pb-3">
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Writing Tone</label>
        <div className="flex flex-wrap gap-1.5">
          {TONES.map(t => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                tone === t
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Action Group Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 px-4 gap-1">
        {groups.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveGroup(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px ${
              activeGroup === id
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">

        {/* GENERATE */}
        {activeGroup === 'generate' && (
          <>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <strong>Full Article Mode:</strong> Generates a 4,000–5,000 word comprehensive article with EEAT signals, AdSense compliance, 10–14 sections, FAQ, statistics, and internal link placeholders.
            </div>

            <ActionButton
              icon={Sparkles}
              label="Generate Full Article (4,000–5,000 words)"
              desc="Complete AdSense-ready, EEAT-compliant article"
              color="violet"
              loading={loading === 'generate'}
              disabled={!title || !!loading}
              onClick={() => callWrite('generate')}
              warning={!title ? 'Add a title first' : undefined}
            />
            <ActionButton
              icon={AlignLeft}
              label="Write Introduction"
              desc="250–350 word hook-driven opening"
              color="blue"
              loading={loading === 'write_intro'}
              disabled={!title || !!loading}
              onClick={() => callWrite('write_intro')}
            />
            <ActionButton
              icon={ArrowRight}
              label="Write Conclusion + CTA"
              desc="Memorable closing with call-to-action"
              color="green"
              loading={loading === 'write_conclusion'}
              disabled={!title || !!loading}
              onClick={() => callWrite('write_conclusion')}
            />
            <ActionButton
              icon={HelpCircle}
              label="Write FAQ Section"
              desc="8–10 questions matching Google searches"
              color="blue"
              loading={loading === 'write_faq'}
              disabled={!title || !!loading}
              onClick={() => callWrite('write_faq')}
            />
            <ActionButton
              icon={Zap}
              label="Continue Writing"
              desc="Add 500–800 more words seamlessly"
              color="orange"
              loading={loading === 'continue'}
              disabled={!content || !!loading}
              onClick={() => callWrite('continue')}
            />
            <ActionButton
              icon={Target}
              label="SEO Optimize Content"
              desc="Add keywords, LSI terms, internal link hints"
              color="blue"
              loading={loading === 'seo_optimize'}
              disabled={!content || !!loading}
              onClick={() => callWrite('seo_optimize')}
            />

            {/* Custom Prompt */}
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-2">Custom Article Prompt</label>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Describe the article you want… e.g. 'Write a comprehensive guide on mobile banking in Kenya targeting first-time smartphone users'"
                rows={3}
                className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400"
              />
              <button
                onClick={() => callWrite('generate', { customPrompt })}
                disabled={!customPrompt.trim() || !!loading}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading === 'generate' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                Generate 4,000+ Word Article
              </button>
            </div>
          </>
        )}

        {/* ENHANCE */}
        {activeGroup === 'enhance' && (
          <>
            <ActionButton
              icon={Maximize2}
              label="Expand Content"
              desc="Add depth, examples, stats (3x longer)"
              color="blue"
              loading={loading === 'expand'}
              disabled={!content || !!loading}
              onClick={() => callWrite('expand')}
            />
            <ActionButton
              icon={Wand2}
              label="Improve Clarity"
              desc="Clearer, more engaging writing"
              color="green"
              loading={loading === 'improve_clarity'}
              disabled={!content || !!loading}
              onClick={() => callWrite('improve_clarity')}
            />
            <ActionButton
              icon={RefreshCw}
              label="Summarize Content"
              desc="Concise key-points summary box"
              color="orange"
              loading={loading === 'summarize'}
              disabled={!content || !!loading}
              onClick={() => callWrite('summarize')}
            />
            <ActionButton
              icon={BookOpen}
              label="Add EEAT Signals"
              desc="Expand → add expertise & authority signals"
              color="violet"
              loading={loading === 'expand'}
              disabled={!content || !!loading}
              onClick={() => callWrite('expand', { tone: 'Authoritative' })}
            />
          </>
        )}

        {/* STRUCTURE */}
        {activeGroup === 'structure' && (
          <>
            <ActionButton
              icon={LayoutList}
              label="Suggest 10 H2 Headings"
              desc="SEO-optimized section headings"
              color="violet"
              loading={loading === 'suggest_headings'}
              disabled={!title || !!loading}
              onClick={() => callWrite('suggest_headings')}
            />
            <ActionButton
              icon={RefreshCw}
              label="Fix Article Structure"
              desc="Reorganize for best logical flow"
              color="blue"
              loading={loading === 'fix_structure'}
              disabled={!content || !!loading}
              onClick={() => callWrite('fix_structure')}
            />

            {headings.length > 0 && (
              <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800">
                <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-2">Suggested H2 Headings ({headings.length}):</p>
                <div className="space-y-1">
                  {headings.map((h, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 group py-1">
                      <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{h}</span>
                      <button
                        onClick={() => insertHeading(h)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs bg-violet-600 text-white px-2 py-0.5 rounded-lg transition-all"
                      >
                        <PlusCircle size={10} /> Insert
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* SNIPPETS */}
        {activeGroup === 'snippets' && (
          <div className="space-y-1.5">
            {[
              { label: 'Key Takeaways',    html: '<h3>Key Takeaways</h3><ul><li><strong>Point 1:</strong> Description</li><li><strong>Point 2:</strong> Description</li><li><strong>Point 3:</strong> Description</li></ul>' },
              { label: 'FAQ Section',      html: '<h2>Frequently Asked Questions</h2><h3>Question 1?</h3><p>Answer here…</p><h3>Question 2?</h3><p>Answer here…</p><h3>Question 3?</h3><p>Answer here…</p>' },
              { label: 'Pro/Con Table',    html: '<div class="table-wrapper"><table class="editor-table"><thead><tr><th>Pros ✅</th><th>Cons ❌</th></tr></thead><tbody><tr><td>Advantage 1</td><td>Disadvantage 1</td></tr><tr><td>Advantage 2</td><td>Disadvantage 2</td></tr></tbody></table></div><p></p>' },
              { label: 'Comparison Table', html: '<div class="table-wrapper"><table class="editor-table"><thead><tr><th>Feature</th><th>Option A</th><th>Option B</th></tr></thead><tbody><tr><td>Feature 1</td><td>✅</td><td>❌</td></tr><tr><td>Feature 2</td><td>❌</td><td>✅</td></tr></tbody></table></div><p></p>' },
              { label: 'Step-by-Step Guide', html: '<h2>Step-by-Step Guide</h2><ol><li><strong>Step 1: </strong>Description of first action</li><li><strong>Step 2: </strong>Description of second action</li><li><strong>Step 3: </strong>Description of third action</li></ol>' },
              { label: 'Info Callout',     html: '<div class="callout callout-info"><p><strong>Note:</strong> Add your key information or context here.</p></div>' },
              { label: 'Warning Box',      html: '<div class="callout callout-warning"><p><strong>Warning:</strong> Important information readers should be aware of.</p></div>' },
              { label: 'Success Tip',      html: '<div class="callout callout-success"><p>✅ <strong>Pro Tip:</strong> Helpful tip or best practice here.</p></div>' },
              { label: 'Expert Quote',     html: '<blockquote><p>"Insert a powerful expert quote here that supports your argument."</p><footer>— Expert Name, Title, Organization (Year)</footer></blockquote>' },
              { label: 'Statistics Block', html: '<div class="callout callout-tip"><p>📊 <strong>Key Statistic:</strong> XX% of [population] [relevant fact]. (Source: Organization Name, Year)</p></div>' },
              { label: 'CTA Block',        html: '<div class="callout callout-success"><p>🚀 <strong>Ready to get started?</strong> [Specific call-to-action — tell readers exactly what to do next and why.]</p></div>' },
              { label: 'Author Insight',   html: '<div class="callout callout-tip"><p>💡 <strong>Expert Perspective:</strong> [Share a professional insight, lived experience, or expert viewpoint that adds EEAT value to the article.]</p></div>' },
            ].map(({ label, html }) => (
              <button
                key={label}
                onClick={() => onInsertContent(html)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 transition-all group"
              >
                <span>{label}</span>
                <ChevronRight size={13} className="text-gray-300 group-hover:text-violet-500 transition-colors" />
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* AI Result */}
        {result && (
          <div className="mt-2 rounded-xl border border-violet-200 dark:border-violet-800 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-violet-50 dark:bg-violet-900/20">
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI Result</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopy(result.text)}
                  className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 transition-colors"
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div
              className="p-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed max-h-48 overflow-y-auto bg-white dark:bg-gray-900"
              dangerouslySetInnerHTML={{ __html: result.text }}
            />
            <div className="flex gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => { onInsertContent(result.text, false); setResult(null); }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                <PlusCircle size={12} /> Insert at Cursor
              </button>
              <button
                onClick={() => { onInsertContent(result.text, true); setResult(null); }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                <RefreshCw size={12} /> Replace All
              </button>
              <button
                onClick={() => setResult(null)}
                className="px-3 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ActionButton helper ──────────────────────────────────────────────────────

interface ActionButtonProps {
  icon: typeof Sparkles;
  label: string;
  desc: string;
  color: 'violet' | 'blue' | 'green' | 'orange' | 'red';
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  warning?: string;
}

const COLOR_MAP = {
  violet: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800 text-violet-600 dark:text-violet-400',
  blue:   'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400',
  green:  'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 text-green-600 dark:text-green-400',
  orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800 text-orange-600 dark:text-orange-400',
  red:    'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-600 dark:text-red-400',
};

function ActionButton({ icon: Icon, label, desc, color, loading, disabled, onClick, warning }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={warning}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
        disabled
          ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'
          : `${COLOR_MAP[color]} hover:opacity-90 hover:shadow-sm cursor-pointer`
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${loading ? 'bg-white/50' : 'bg-white/70 dark:bg-black/20'}`}>
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Icon size={14} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{warning || desc}</div>
      </div>
    </button>
  );
}
