import { useState } from 'react';
import {
  Sparkles, Wand2, AlignLeft, Maximize2, RefreshCw,
  LayoutList, FileText, Zap, Loader2, ChevronRight,
  Copy, Check, PlusCircle, ArrowRight,
} from 'lucide-react';

interface AIWritingPanelProps {
  title: string;
  content: string;
  onInsertContent: (html: string, replace?: boolean) => void;
  onSetTitle?: (t: string) => void; // reserved for future headline generation
}

type ActionGroup = 'generate' | 'enhance' | 'structure' | 'snippets';

const TONES = ['Professional', 'Casual', 'Friendly', 'Authoritative', 'Conversational', 'Academic'];

export default function AIWritingPanel({ title, content, onInsertContent, onSetTitle: _onSetTitle }: AIWritingPanelProps) {
  const [activeGroup, setActiveGroup] = useState<ActionGroup>('generate');
  const [loading, setLoading]         = useState<string | null>(null);
  const [result, setResult]           = useState<{ action: string; text: string } | null>(null);
  const [tone, setTone]               = useState('Professional');
  const [customPrompt, setCustomPrompt] = useState('');
  const [headings, setHeadings]       = useState<string[]>([]);
  const [error, setError]             = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);

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
      {/* Tone Selector */}
      <div className="px-4 pt-4 pb-3">
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
            <ActionButton
              icon={Sparkles}
              label="Generate Full Article"
              desc="Write complete article from your title"
              color="violet"
              loading={loading === 'generate'}
              disabled={!title || !!loading}
              onClick={() => callWrite('generate')}
              warning={!title ? 'Add a title first' : undefined}
            />
            <ActionButton
              icon={AlignLeft}
              label="Write Introduction"
              desc="Compelling opening paragraph"
              color="blue"
              loading={loading === 'write_intro'}
              disabled={!title || !!loading}
              onClick={() => callWrite('write_intro')}
            />
            <ActionButton
              icon={ArrowRight}
              label="Write Conclusion"
              desc="Strong closing with call-to-action"
              color="green"
              loading={loading === 'write_conclusion'}
              disabled={!title || !!loading}
              onClick={() => callWrite('write_conclusion')}
            />
            <ActionButton
              icon={Zap}
              label="Continue Writing"
              desc="Pick up where you left off"
              color="orange"
              loading={loading === 'continue'}
              disabled={!content || !!loading}
              onClick={() => callWrite('continue')}
            />

            {/* Custom Prompt */}
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-2">Custom Prompt</label>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Tell AI what to write… e.g. 'Write a section about social media marketing strategies'"
                rows={3}
                className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400"
              />
              <button
                onClick={() => callWrite('generate', { title: customPrompt })}
                disabled={!customPrompt.trim() || !!loading}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading === 'generate' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                Generate
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
              desc="Add more detail and examples"
              color="blue"
              loading={loading === 'expand'}
              disabled={!content || !!loading}
              onClick={() => callWrite('expand')}
            />
            <ActionButton
              icon={Wand2}
              label="Improve Clarity"
              desc="Clearer, more readable writing"
              color="green"
              loading={loading === 'improve_clarity'}
              disabled={!content || !!loading}
              onClick={() => callWrite('improve_clarity')}
            />
            <ActionButton
              icon={RefreshCw}
              label="Summarize"
              desc="Concise summary of your content"
              color="orange"
              loading={loading === 'summarize'}
              disabled={!content || !!loading}
              onClick={() => callWrite('summarize')}
            />
          </>
        )}

        {/* STRUCTURE */}
        {activeGroup === 'structure' && (
          <>
            <ActionButton
              icon={LayoutList}
              label="Suggest H2 Headings"
              desc="Get 6-8 section headings"
              color="violet"
              loading={loading === 'suggest_headings'}
              disabled={!title || !!loading}
              onClick={() => callWrite('suggest_headings')}
            />
            <ActionButton
              icon={RefreshCw}
              label="Fix Article Structure"
              desc="Reorganize content for better flow"
              color="blue"
              loading={loading === 'fix_structure'}
              disabled={!content || !!loading}
              onClick={() => callWrite('fix_structure')}
            />

            {/* Suggested Headings */}
            {headings.length > 0 && (
              <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800">
                <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-2">Suggested Headings:</p>
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
              { label: 'Key Takeaways',   html: '<h3>Key Takeaways</h3><ul><li>Point 1</li><li>Point 2</li><li>Point 3</li></ul>' },
              { label: 'FAQ Section',     html: '<h2>Frequently Asked Questions</h2><h3>Question 1?</h3><p>Answer here…</p><h3>Question 2?</h3><p>Answer here…</p>' },
              { label: 'Pro/Con Table',   html: '<table class="editor-table"><thead><tr><th>Pros ✅</th><th>Cons ❌</th></tr></thead><tbody><tr><td>Advantage 1</td><td>Disadvantage 1</td></tr><tr><td>Advantage 2</td><td>Disadvantage 2</td></tr></tbody></table><p></p>' },
              { label: 'Step-by-Step',    html: '<h2>Step-by-Step Guide</h2><ol><li><strong>Step 1:</strong> Description</li><li><strong>Step 2:</strong> Description</li><li><strong>Step 3:</strong> Description</li></ol>' },
              { label: 'Summary Box',     html: '<div class="callout callout-info"><p><strong>Summary:</strong> Key points to remember from this section.</p></div>' },
              { label: 'Expert Quote',    html: '<blockquote><p>"Insert a powerful quote here that supports your argument."</p><footer>— Expert Name, Source</footer></blockquote>' },
              { label: 'Statistics Block',html: '<div class="callout callout-tip"><p>📊 <strong>Key Statistic:</strong> XX% of people/organizations [fact]. (Source: Name, Year)</p></div>' },
              { label: 'CTA Block',       html: '<div class="callout callout-success"><p>🚀 <strong>Ready to get started?</strong> [Call-to-action text here. Tell readers what to do next.]</p></div>' },
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
                <PlusCircle size={12} /> Insert Below
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
