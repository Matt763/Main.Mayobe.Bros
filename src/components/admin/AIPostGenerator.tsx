import { useState } from 'react';
import { Sparkles, Wand2, Key, X, AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface AIPostGeneratorProps {
  onInsertContent: (html: string) => void;
  onSetTitle?: (title: string) => void;
  title: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const PROMPT_SUGGESTIONS = [
  'Write a blog post about the benefits of solar energy in Africa',
  'Write a detailed guide about starting a small business in Kenya',
  'Write about the history and culture of the Maasai people',
  'Write a comprehensive article about digital marketing strategies',
  'Write about healthy eating habits and nutrition tips',
];

export default function AIPostGenerator({ onInsertContent, onSetTitle, title }: AIPostGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState('');

  const saveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey);
    setShowKeyInput(false);
  };

  const generatePost = async () => {
    const promptToUse = prompt.trim() || (title ? `Write a comprehensive blog post about: ${title}` : '');
    if (!promptToUse) {
      setError('Please enter a topic or prompt first.');
      return;
    }
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'X-OpenAI-Key': apiKey,
        },
        body: JSON.stringify({
          action: 'generate_full_post',
          title: promptToUse,
          content: '',
          excerpt: '',
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const raw: string = data.result || '';

      const titleMatch = raw.match(/^#\s+(.+)$/m);
      if (titleMatch && onSetTitle) {
        const extractedTitle = titleMatch[1].replace(/\*+/g, '').trim();
        setGeneratedTitle(extractedTitle);
        onSetTitle(extractedTitle);
      }

      const htmlContent = convertMarkdownToHtml(raw);
      onInsertContent(htmlContent);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-xl border border-blue-100 dark:border-blue-900/50 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-blue-900/30">
            <Wand2 size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">AI Post Generator</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Generate a full SEO-optimized article</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowKeyInput(!showKeyInput); }}
            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors"
            title="Configure API key"
          >
            <Key size={14} className={apiKey ? 'text-green-500' : 'text-gray-400'} />
          </button>
          {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>

      {showKeyInput && (
        <div className="px-4 pb-3 border-t border-blue-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 mb-2">OpenAI API key — stored in your browser only.</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button type="button" onClick={saveApiKey} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">Save</button>
            <button type="button" onClick={() => setShowKeyInput(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="border-t border-blue-100 dark:border-gray-700 p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Topic / Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); setError(null); }}
              placeholder={title ? `Generate post based on title: "${title}"` : 'Describe the article you want to generate...'}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
            />
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Quick suggestions:</p>
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {PROMPT_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(s)}
                  className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all truncate"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800/40">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mb-1">Generation rules:</p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-0.5">
              <li>• Minimum 700 words with structured headings</li>
              <li>• H2, H3, H4 sections + introduction & conclusion</li>
              <li>• SEO-optimized & AdSense policy compliant</li>
            </ul>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {generatedTitle && !loading && (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <Sparkles size={13} className="text-green-500 flex-shrink-0" />
              <p className="text-xs text-green-700 dark:text-green-400 font-medium truncate">Generated: {generatedTitle}</p>
            </div>
          )}

          <button
            type="button"
            onClick={generatePost}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-lg hover:shadow-blue-300 dark:hover:shadow-blue-900/50 hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating article...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Post
              </>
            )}
          </button>

          {loading && (
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Writing a 700+ word article with headings, sections and SEO optimization...</p>
              <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse" style={{ width: '70%' }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function convertMarkdownToHtml(markdown: string): string {
  let html = markdown
    .replace(/^#{1}\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^#{5,6}\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr />')
    .replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');

  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
    if (/^\d/.test(match)) return `<ol>${match}</ol>`;
    return `<ul>${match}</ul>`;
  });

  const lines = html.split('\n');
  const result: string[] = [];
  let para = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (para.trim()) {
        result.push(`<p>${para.trim()}</p>`);
        para = '';
      }
    } else if (/^<(h[2-4]|ul|ol|hr|blockquote|pre)/.test(trimmed)) {
      if (para.trim()) {
        result.push(`<p>${para.trim()}</p>`);
        para = '';
      }
      result.push(trimmed);
    } else {
      para += (para ? ' ' : '') + trimmed;
    }
  }
  if (para.trim()) result.push(`<p>${para.trim()}</p>`);

  return result.join('\n');
}
