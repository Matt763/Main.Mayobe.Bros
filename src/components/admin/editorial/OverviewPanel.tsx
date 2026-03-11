import { CheckCircle, AlertTriangle, XCircle, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { OverallReview, EditorialTab } from './types';
import ScoreRing from './ScoreRing';

interface Props {
  review: OverallReview;
  onNavigate: (tab: EditorialTab) => void;
}

const verdictConfig = {
  'Publish Ready': { bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle },
  'Needs Minor Edits': { bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', icon: AlertTriangle },
  'Needs Major Revision': { bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', icon: AlertTriangle },
  'Not Ready': { bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', icon: XCircle },
};

const dimTabMap: Record<string, EditorialTab> = {
  clarity: 'suggestions',
  structure: 'readability',
  readability: 'readability',
  engagement: 'engagement',
  seo: 'seo',
  originality: 'suggestions',
};

export default function OverviewPanel({ review, onNavigate }: Props) {
  const cfg = verdictConfig[review.verdict] || verdictConfig['Not Ready'];
  const VerdictIcon = cfg.icon;

  const dimensionList = Object.entries(review.dimensions);

  return (
    <div className="space-y-5">
      {/* Verdict banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${cfg.bg}`}>
        <VerdictIcon size={18} className={cfg.text} />
        <div className="flex-1">
          <p className={`text-sm font-bold ${cfg.text}`}>{review.verdict}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{review.summary}</p>
        </div>
      </div>

      {/* Overall score + dimension rings */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-5">
          <ScoreRing score={review.overallScore} size="lg" />
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Overall Quality</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{review.overallScore} / 100</p>
            <p className={`text-xs font-semibold mt-1 ${review.overallScore >= 80 ? 'text-emerald-600' : review.overallScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
              {review.overallScore >= 80 ? 'Excellent' : review.overallScore >= 60 ? 'Good' : review.overallScore >= 40 ? 'Fair' : 'Poor'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {dimensionList.map(([key, dim]) => (
            <button
              key={key}
              onClick={() => onNavigate(dimTabMap[key] || 'suggestions')}
              className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ScoreRing score={dim.score} size="sm" />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{dim.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dimension feedback list */}
      <div className="space-y-2">
        {dimensionList.map(([key, dim]) => (
          <div key={key} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dim.score >= 80 ? 'bg-emerald-500' : dim.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} />
                <p className="text-xs font-bold text-gray-900 dark:text-white">{dim.label}</p>
              </div>
              <span className={`text-xs font-bold ${dim.score >= 80 ? 'text-emerald-600' : dim.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{dim.score}</span>
            </div>
            <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${dim.score >= 80 ? 'bg-emerald-500' : dim.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${dim.score}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{dim.feedback}</p>
          </div>
        ))}
      </div>

      {/* Strengths */}
      {review.topStrengths.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} className="text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Top Strengths</p>
          </div>
          <ul className="space-y-1.5">
            {review.topStrengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle size={11} className="flex-shrink-0 mt-0.5" /> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Critical issues */}
      {review.criticalIssues.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={13} className="text-red-600 dark:text-red-400" />
            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">Critical Issues</p>
          </div>
          <ul className="space-y-1.5">
            {review.criticalIssues.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                <XCircle size={11} className="flex-shrink-0 mt-0.5" /> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick wins */}
      {review.quickWins.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={13} className="text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Quick Wins</p>
          </div>
          <ul className="space-y-1.5">
            {review.quickWins.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-400">
                <ChevronRight size={11} className="flex-shrink-0 mt-0.5" /> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
