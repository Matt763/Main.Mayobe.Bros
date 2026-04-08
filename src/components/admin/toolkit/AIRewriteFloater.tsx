import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Minimize2, Maximize2, MessageSquare, Briefcase, Zap,
  Check, X, Loader2, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';

interface Rewrite {
  label: string;
  icon: string;
  text: string;
  description: string;
}

interface AIRewriteFloaterProps {
  editorContainerRef: React.RefObject<HTMLElement | null>;
  onReplace: (newText: string) => void;
}

const MODE_QUICK = [
  { mode: 'fix',     label: 'Fix Grammar', icon: Check,        color: 'text-green-600 dark:text-green-400' },
  { mode: 'shorter', label: 'Shorter',     icon: Minimize2,    color: 'text-blue-600 dark:text-blue-400' },
  { mode: 'longer',  label: 'Expand',      icon: Maximize2,    color: 'text-indigo-600 dark:text-indigo-400' },
  { mode: 'formal',  label: 'Formal',      icon: Briefcase,    color: 'text-purple-600 dark:text-purple-400' },
  { mode: 'casual',  label: 'Casual',      icon: MessageSquare,color: 'text-orange-600 dark:text-orange-400' },
  { mode: 'improve', label: 'Improve',     icon: Zap,          color: 'text-yellow-600 dark:text-yellow-400' },
];

const ICON_MAP: Record<string, typeof Minimize2> = {
  compress: Minimize2,
  expand:   Maximize2,
  briefcase:Briefcase,
  message:  MessageSquare,
  zap:      Zap,
};

export default function AIRewriteFloater({ editorContainerRef, onReplace }: AIRewriteFloaterProps) {
  const [visible, setVisible]             = useState(false);
  const [position, setPosition]           = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText]   = useState('');
  const [savedRange, setSavedRange]       = useState<Range | null>(null);
  const [loading, setLoading]             = useState<string | null>(null);
  const [quickResult, setQuickResult]     = useState<{ mode: string; text: string } | null>(null);
  const [rewrites, setRewrites]           = useState<Rewrite[]>([]);
  const [showRewrites, setShowRewrites]   = useState(false);
  const [loadingRewrites, setLoadingRewrites] = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const floaterRef                        = useRef<HTMLDivElement>(null);
  const hideTimeout                       = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHide = () => { if (hideTimeout.current) clearTimeout(hideTimeout.current); };

  const hide = useCallback(() => {
    clearHide();
    setVisible(false);
    setQuickResult(null);
    setRewrites([]);
    setShowRewrites(false);
    setError(null);
  }, []);

  useEffect(() => {
    const onSelectionChange = () => {
      clearHide();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        hideTimeout.current = setTimeout(hide, 400);
        return;
      }

      const text = sel.toString().trim();
      if (text.length < 5 || text.length > 2000) {
        hideTimeout.current = setTimeout(hide, 400);
        return;
      }

      const container = editorContainerRef.current;
      if (!container) return;

      const range = sel.getRangeAt(0);
      // Check the selection is inside the editor
      if (!container.contains(range.commonAncestorContainer)) {
        hideTimeout.current = setTimeout(hide, 400);
        return;
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0) {
        hideTimeout.current = setTimeout(hide, 400);
        return;
      }

      setSelectedText(text);
      setSavedRange(range.cloneRange());
      setQuickResult(null);
      setRewrites([]);
      setShowRewrites(false);
      setError(null);

      // Position floater above selection
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const floaterW = 420;
      let left = rect.left + scrollX + rect.width / 2 - floaterW / 2;
      left = Math.max(8, Math.min(left, window.innerWidth + scrollX - floaterW - 8));
      const top = rect.top + scrollY - 12;

      setPosition({ top, left });
      setVisible(true);
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [editorContainerRef, hide]);

  // Hide when clicking outside the floater
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (floaterRef.current && !floaterRef.current.contains(e.target as Node)) {
        hide();
      }
    };
    if (visible) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [visible, hide]);

  const restoreSelection = () => {
    if (!savedRange) return false;
    try {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
        return true;
      }
    } catch {}
    return false;
  };

  const quickRewrite = async (mode: string) => {
    if (!selectedText) return;
    setLoading(mode);
    setError(null);
    try {
      const res = await fetch('/api/editor-ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rewrite failed');
      setQuickResult({ mode, text: data.rewritten });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const loadMultiRewrites = async () => {
    if (!selectedText || rewrites.length > 0) { setShowRewrites(v => !v); return; }
    setLoadingRewrites(true);
    setShowRewrites(true);
    setError(null);
    try {
      const res = await fetch('/api/editor-ai/multi-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setRewrites(data.rewrites || []);
    } catch (err: any) {
      setError(err.message);
      setShowRewrites(false);
    } finally {
      setLoadingRewrites(false);
    }
  };

  const applyReplacement = (newText: string) => {
    // Try to restore selection and replace
    const restored = restoreSelection();
    if (restored) {
      try {
        document.execCommand('insertText', false, newText);
        onReplace(newText);
        hide();
        return;
      } catch {}
    }
    // Fallback: call onReplace and let parent handle it
    onReplace(newText);
    hide();
  };

  if (!visible) return null;

  return (
    <div
      ref={floaterRef}
      style={{ top: position.top, left: position.left, transform: 'translateY(-100%)' }}
      className="fixed z-[9000] w-[420px] max-w-[calc(100vw-16px)]"
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Arrow */}
      <div className="flex justify-center">
        <div className="w-3 h-3 rotate-45 bg-white dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-700 translate-y-1.5 relative z-10" />
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-violet-500 flex items-center justify-center">
              <Zap size={11} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">AI Rewrite</span>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              {selectedText.split(/\s+/).length} words
            </span>
          </div>
          <button onClick={hide} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X size={13} className="text-gray-400" />
          </button>
        </div>

        {/* Quick actions */}
        {!quickResult && (
          <div className="p-2.5">
            <div className="grid grid-cols-3 gap-1.5">
              {MODE_QUICK.map(({ mode, label, icon: Icon, color }) => (
                <button
                  key={mode}
                  onClick={() => quickRewrite(mode)}
                  disabled={!!loading}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 group"
                >
                  {loading === mode ? (
                    <Loader2 size={12} className="animate-spin text-violet-500 shrink-0" />
                  ) : (
                    <Icon size={12} className={`${color} shrink-0`} />
                  )}
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>

            {/* Multi-rewrite button */}
            <button
              onClick={loadMultiRewrites}
              disabled={loadingRewrites}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-xs font-semibold text-violet-700 dark:text-violet-300 transition-all"
            >
              {loadingRewrites ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              All Rewrites
              {!loadingRewrites && (showRewrites ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
            </button>
          </div>
        )}

        {/* Quick rewrite result */}
        {quickResult && (
          <div className="p-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-3 max-h-40 overflow-y-auto">
              {quickResult.text}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => applyReplacement(quickResult.text)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
              >
                <Check size={12} /> Replace
              </button>
              <button
                onClick={() => setQuickResult(null)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={hide}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Multi-rewrite results */}
        {showRewrites && rewrites.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800 max-h-64 overflow-y-auto">
            {rewrites.map((rw, i) => {
              const IconComp = ICON_MAP[rw.icon] || Zap;
              return (
                <div key={i} className="p-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <IconComp size={12} className="text-violet-500 shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{rw.label}</span>
                      <span className="text-xs text-gray-400">{rw.description}</span>
                    </div>
                    <button
                      onClick={() => applyReplacement(rw.text)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-violet-600 text-white text-xs px-2 py-1 rounded-lg transition-all"
                    >
                      <Check size={10} /> Use
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">{rw.text}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-3.5 pb-3 text-xs text-red-500 flex items-center gap-1.5">
            <X size={11} /> {error}
          </div>
        )}
      </div>
    </div>
  );
}
