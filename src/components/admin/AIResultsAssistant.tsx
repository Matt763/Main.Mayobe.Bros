import { useState, useRef, useCallback } from 'react';
import { Bot, Play, AlertTriangle, CheckCircle2, X } from 'lucide-react';

type Stage = 'idle' | 'checking' | 'crawling' | 'processing' | 'building' | 'done' | 'error' | 'duplicate';

interface CrawlEvent {
  stage: Stage;
  progress?: number;
  total?: number;
  message: string;
  result?: any;
  existingTitle?: string;
  existingId?: string;
}

interface Props {
  onComplete: (result: {
    title: string;
    slug: string;
    year: number;
    exam_type: string;
    source_url: string;
    content: string;
    structured_data: any;
    meta_title: string;
    meta_description: string;
  }) => void;
}

const STAGE_LABELS: Record<Stage, string> = {
  idle:       '',
  checking:   'Checking for duplicates...',
  crawling:   'Crawling schools...',
  processing: 'Processing with AI...',
  building:   'Building HTML content...',
  done:       'Complete!',
  error:      'Error',
  duplicate:  'Already exists',
};

export default function AIResultsAssistant({ onComplete }: Props) {
  const [url, setUrl]             = useState('');
  const [stage, setStage]         = useState<Stage>('idle');
  const [progress, setProgress]   = useState(0);
  const [total, setTotal]         = useState(0);
  const [message, setMessage]     = useState('');
  const [duplicate, setDuplicate] = useState<{ title: string; id: string } | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const startCrawl = useCallback(async (overwrite = false) => {
    if (!url.trim()) return;
    setDuplicate(null);
    setStage('checking');
    setProgress(0);
    setTotal(0);
    setMessage('');

    let aborted = false;
    abortRef.current = () => { aborted = true; };

    try {
      const response = await fetch('/api/results/crawl', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), overwrite }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!aborted) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event: CrawlEvent;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          setStage(event.stage);
          setMessage(event.message);
          if (event.progress !== undefined) setProgress(event.progress);
          if (event.total     !== undefined) setTotal(event.total);

          if (event.stage === 'duplicate' && event.existingTitle && event.existingId) {
            setDuplicate({ title: event.existingTitle, id: event.existingId });
            return;
          }

          if (event.stage === 'done' && event.result) {
            onComplete(event.result);
            return;
          }

          if (event.stage === 'error') return;
        }
      }
    } catch (err: any) {
      setStage('error');
      setMessage(err.message || 'Crawl failed');
    }
  }, [url, onComplete]);

  const reset = () => {
    abortRef.current?.();
    setStage('idle');
    setProgress(0);
    setTotal(0);
    setMessage('');
    setDuplicate(null);
  };

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;
  const isRunning = ['checking', 'crawling', 'processing', 'building'].includes(stage);

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Bot size={18} className="text-green-600 dark:text-green-400" />
        <span className="font-semibold text-green-900 dark:text-green-100 text-sm">AI Results Assistant</span>
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://onlinesys.necta.go.tz/results/2025/ftna/ftna.htm"
          disabled={isRunning}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-green-200 dark:border-green-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60"
        />
        {isRunning ? (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <X size={14} /> Stop
          </button>
        ) : (
          <button
            onClick={() => startCrawl(false)}
            disabled={!url.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Play size={14} /> Generate
          </button>
        )}
      </div>

      {/* Progress */}
      {isRunning && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-green-700 dark:text-green-400 mb-1">
            <span>{message}</span>
            {stage === 'crawling' && total > 0 && <span>{pct}%</span>}
          </div>
          <div className="h-2 bg-green-100 dark:bg-green-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: stage === 'crawling' ? `${pct}%` : stage === 'processing' ? '90%' : stage === 'building' ? '97%' : '0%' }}
            />
          </div>
          {stage === 'crawling' && total > 0 && (
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">{progress} / {total} schools</div>
          )}
        </div>
      )}

      {/* Done */}
      {stage === 'done' && (
        <div className="mt-3 flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
          <CheckCircle2 size={15} />
          <span>Content loaded into editor. Review and publish.</span>
          <button onClick={reset} className="ml-auto text-xs underline">Reset</button>
        </div>
      )}

      {/* Error */}
      {stage === 'error' && (
        <div className="mt-3 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertTriangle size={15} />
          <span>{message}</span>
          <button onClick={reset} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* Duplicate warning */}
      {stage === 'duplicate' && duplicate && (
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
          <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300 text-sm">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Already exists: "{duplicate.title}"</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => startCrawl(true)}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700"
                >
                  Overwrite
                </button>
                <button
                  onClick={reset}
                  className="px-3 py-1.5 border border-amber-300 dark:border-amber-600 rounded-lg text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
