import { Search, ArrowUp, Minus, ArrowDown, Tag } from 'lucide-react';
import { SeoResult } from './types';
import ScoreRing from './ScoreRing';

interface Props { result: SeoResult; }

const priorityConfig = {
  High: { bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  Medium: { bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  Low: { bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-400' },
};

const densityColors: Record<string, string> = {
  Low: 'text-amber-600 dark:text-amber-400',
  Optimal: 'text-emerald-600 dark:text-emerald-400',
  High: 'text-amber-600 dark:text-amber-400',
  Overstuffed: 'text-red-600 dark:text-red-400',
};

export default function SeoPanel({ result }: Props) {
  const factors = [
    { key: 'titleOptimization', label: 'Title SEO', data: result.titleOptimization },
    { key: 'metaOptimization', label: 'Meta Description', data: result.metaOptimization },
    { key: 'headingStructure', label: 'Heading Structure', data: result.headingStructure },
    { key: 'contentDepth', label: 'Content Depth', data: result.contentDepth },
    { key: 'internalLinking', label: 'Internal Links', data: result.internalLinking },
  ];

  const highImprovements = result.improvements.filter(i => i.priority === 'High');
  const medImprovements = result.improvements.filter(i => i.priority === 'Medium');
  const lowImprovements = result.improvements.filter(i => i.priority === 'Low');

  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <ScoreRing score={result.seoScore} size="lg" />
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">SEO Score</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{result.seoScore} / 100</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] text-gray-400">Keyword density:</p>
              <span className={`text-[11px] font-bold ${densityColors[result.keywordDensity] || 'text-gray-600'}`}>{result.keywordDensity}</span>
            </div>
          </div>
        </div>

        {/* Target keywords */}
        {result.targetKeywords.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"><Tag size={10} /> Suggested Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {result.targetKeywords.map((kw, i) => (
                <span key={i} className={`text-[11px] font-medium px-2 py-0.5 rounded-lg border ${i === 0 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>{kw}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Factor breakdown */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
          <Search size={11} /> Factor Breakdown
        </p>
        {factors.map(({ label, data }) => (
          <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-gray-900 dark:text-white">{label}</p>
              <span className={`text-xs font-bold ${data.score >= 80 ? 'text-emerald-600' : data.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{data.score}</span>
            </div>
            <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${data.score >= 80 ? 'bg-emerald-500' : data.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${data.score}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{data.feedback}</p>
          </div>
        ))}
      </div>

      {/* Improvements */}
      {result.improvements.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Improvement Actions</p>
          {[...highImprovements, ...medImprovements, ...lowImprovements].map((imp, i) => {
            const cfg = priorityConfig[imp.priority];
            return (
              <div key={i} className={`border rounded-xl p-4 ${cfg.bg}`}>
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-bold ${cfg.text}`}>{imp.action}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${imp.priority === 'High' ? 'bg-red-200 dark:bg-red-800/50 text-red-700 dark:text-red-400' : imp.priority === 'Medium' ? 'bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-400' : 'bg-blue-200 dark:bg-blue-800/50 text-blue-700 dark:text-blue-400'}`}>
                        {imp.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{imp.impact}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
