import { Lightbulb, TrendingUp, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { SuggestionsResult, SuggestionItem } from './types';

interface Props { result: SuggestionsResult; }

const priorityConfig = {
  High: {
    border: 'border-red-200 dark:border-red-800',
    bg: 'bg-red-50 dark:bg-red-950/20',
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
  Medium: {
    border: 'border-amber-200 dark:border-amber-800',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  Low: {
    border: 'border-gray-200 dark:border-gray-700',
    bg: 'bg-white dark:bg-gray-900',
    badge: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    dot: 'bg-gray-400',
  },
};

const catColors: Record<string, string> = {
  Writing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  Structure: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  SEO: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  Engagement: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  Formatting: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

function SuggestionCard({ item }: { item: SuggestionItem }) {
  const cfg = priorityConfig[item.priority];
  return (
    <div className={`border rounded-xl p-4 ${cfg.border} ${cfg.bg}`}>
      <div className="flex items-start gap-2 mb-2">
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.badge}`}>{item.priority}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${catColors[item.category] || catColors.Writing}`}>{item.category}</span>
          </div>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-snug mb-1">{item.issue}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.suggestion}</p>
          {item.example && (
            <blockquote className="border-l-2 border-blue-300 dark:border-blue-700 pl-3 mt-2">
              <p className="text-xs text-blue-700 dark:text-blue-400 italic leading-relaxed">{item.example}</p>
            </blockquote>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuggestionsPanel({ result }: Props) {
  const [copied, setCopied] = useState(false);

  const allSuggestions = [
    ...result.prioritySuggestions,
    ...result.moderateSuggestions,
    ...result.polishSuggestions,
  ];

  return (
    <div className="space-y-4">
      {/* Impact banner */}
      {result.estimatedImprovementScore > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-center gap-3">
          <TrendingUp size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Potential Score Improvement</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              Implementing these suggestions could improve your score by up to <strong>+{result.estimatedImprovementScore} points</strong>.
            </p>
          </div>
        </div>
      )}

      {/* High priority */}
      {result.prioritySuggestions.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> High Priority ({result.prioritySuggestions.length})
          </p>
          <div className="space-y-2">
            {result.prioritySuggestions.map((s, i) => <SuggestionCard key={i} item={s} />)}
          </div>
        </div>
      )}

      {/* Medium priority */}
      {result.moderateSuggestions.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Medium Priority ({result.moderateSuggestions.length})
          </p>
          <div className="space-y-2">
            {result.moderateSuggestions.map((s, i) => <SuggestionCard key={i} item={s} />)}
          </div>
        </div>
      )}

      {/* Low priority / polish */}
      {result.polishSuggestions.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Polish ({result.polishSuggestions.length})
          </p>
          <div className="space-y-2">
            {result.polishSuggestions.map((s, i) => <SuggestionCard key={i} item={s} />)}
          </div>
        </div>
      )}

      {/* Rewrite suggestion */}
      {result.rewriteSuggestion && (
        <div className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Lightbulb size={13} className="text-blue-500" /> Suggested Rewrite
            </p>
            <button
              onClick={() => { navigator.clipboard.writeText(result.rewriteSuggestion); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              {copied ? <CheckCircle size={11} className="text-emerald-500" /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{result.rewriteSuggestion}</p>
        </div>
      )}

      {allSuggestions.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle size={28} className="mx-auto text-emerald-500 mb-2" />
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No major issues found</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This article is in great shape!</p>
        </div>
      )}
    </div>
  );
}
