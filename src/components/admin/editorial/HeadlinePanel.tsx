import { Heading as HeadingIcon, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { HeadlineResult } from './types';
import ScoreRing from './ScoreRing';

interface Props {
  result: HeadlineResult;
  onUseHeadline?: (headline: string) => void;
}

const ratingColors: Record<string, string> = {
  Excellent: 'text-emerald-600 dark:text-emerald-400',
  Good: 'text-blue-600 dark:text-blue-400',
  Average: 'text-amber-600 dark:text-amber-400',
  Weak: 'text-orange-600 dark:text-orange-400',
  Poor: 'text-red-600 dark:text-red-400',
};

const typeColors = [
  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
];

function CopiedButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-600 transition-colors">
      {copied ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  );
}

export default function HeadlinePanel({ result, onUseHeadline }: Props) {
  return (
    <div className="space-y-4">
      {/* Score card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <ScoreRing score={result.headlineScore} size="lg" />
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Headline Score</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{result.headlineScore} / 100</p>
            <p className={`text-sm font-bold ${ratingColors[result.rating] || 'text-gray-600'}`}>{result.rating}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Emotion', value: result.emotionalImpact },
            { label: 'Clarity', value: result.clarity },
            { label: 'Click Power', value: result.clickworthiness },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-xs font-bold ${value === 'High' || value === 'Clear' ? 'text-emerald-600 dark:text-emerald-400' : value === 'Medium' || value === 'Somewhat Clear' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${result.seoFriendly ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
            {result.seoFriendly ? 'SEO Friendly' : 'Not SEO Friendly'}
          </span>
        </div>
      </div>

      {/* Analysis */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Analysis</p>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{result.analysis}</p>
      </div>

      {/* Weaknesses */}
      {result.weaknesses.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">Weaknesses</p>
          <ul className="space-y-1.5">
            {result.weaknesses.map((w, i) => (
              <li key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2 leading-relaxed">
                <span className="flex-shrink-0 mt-0.5">›</span> {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternative headlines */}
      {result.alternatives.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <HeadingIcon size={11} /> Alternative Headlines
          </p>
          {result.alternatives.map((alt, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug mb-1.5">"{alt.headline}"</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeColors[i % typeColors.length]}`}>{alt.type}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{alt.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <CopiedButton text={alt.headline} />
                  {onUseHeadline && (
                    <button
                      onClick={() => onUseHeadline(alt.headline)}
                      className="text-[10px] font-semibold px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Use
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
