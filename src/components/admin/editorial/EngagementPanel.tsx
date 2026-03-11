import { Users, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { EngagementResult } from './types';
import ScoreRing from './ScoreRing';

interface Props { result: EngagementResult; }

const bounceColors: Record<string, string> = {
  Low: 'text-emerald-600 dark:text-emerald-400',
  Medium: 'text-amber-600 dark:text-amber-400',
  High: 'text-red-600 dark:text-red-400',
};

const ctaStrengthColors: Record<string, string> = {
  Strong: 'text-emerald-600 dark:text-emerald-400',
  Moderate: 'text-blue-600 dark:text-blue-400',
  Weak: 'text-amber-600 dark:text-amber-400',
  Missing: 'text-red-600 dark:text-red-400',
};

export default function EngagementPanel({ result }: Props) {
  const factors = [
    { key: 'hookStrength', label: 'Hook Strength', data: result.hookStrength },
    { key: 'storyFlow', label: 'Story Flow', data: result.storyFlow },
    { key: 'contentClarity', label: 'Content Clarity', data: result.contentClarity },
    { key: 'valueProposition', label: 'Value Proposition', data: result.valueProposition },
  ];

  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <ScoreRing score={result.engagementScore} size="lg" />
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Engagement Score</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{result.engagementScore} / 100</p>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <Clock size={10} className="text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{result.predictedTimeOnPage}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Bounce Risk</p>
            <p className={`text-xs font-bold ${bounceColors[result.estimatedBounceRisk] || 'text-gray-600'}`}>{result.estimatedBounceRisk}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">CTA Strength</p>
            <p className={`text-xs font-bold ${ctaStrengthColors[result.callToAction.strength] || 'text-gray-600'}`}>{result.callToAction.strength}</p>
          </div>
        </div>
      </div>

      {/* Audience match */}
      {result.audienceMatch && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <Users size={11} /> Audience Match
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">{result.audienceMatch}</p>
        </div>
      )}

      {/* Factor breakdown */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Factor Breakdown</p>
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

      {/* CTA feedback */}
      <div className={`border rounded-xl p-4 ${result.callToAction.present ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}`}>
        <div className="flex items-center gap-2 mb-1.5">
          {result.callToAction.present ? <CheckCircle size={12} className="text-emerald-600 dark:text-emerald-400" /> : <AlertCircle size={12} className="text-red-600 dark:text-red-400" />}
          <p className={`text-xs font-bold uppercase tracking-wide ${result.callToAction.present ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
            Call to Action {result.callToAction.present ? 'Found' : 'Missing'}
          </p>
        </div>
        <p className={`text-xs leading-relaxed ${result.callToAction.present ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{result.callToAction.feedback}</p>
      </div>

      {/* Engagement tips */}
      {result.engagementTips.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Engagement Tips</p>
          {result.engagementTips.map((tip, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{tip.section}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">{tip.issue}</p>
              <div className="flex items-start gap-1.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg px-3 py-2">
                <span className="text-blue-500 flex-shrink-0">›</span>
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">{tip.fix}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
