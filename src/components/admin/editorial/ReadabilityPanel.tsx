import { BookOpen, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { ReadabilityResult } from './types';
import ScoreRing from './ScoreRing';

interface Props { result: ReadabilityResult; }

const complexityColor: Record<string, string> = {
  Simple: 'text-emerald-600 dark:text-emerald-400',
  Moderate: 'text-blue-600 dark:text-blue-400',
  Complex: 'text-amber-600 dark:text-amber-400',
  'Very Complex': 'text-red-600 dark:text-red-400',
};

const levelColor: Record<string, string> = {
  Low: 'text-emerald-600 dark:text-emerald-400',
  None: 'text-emerald-600 dark:text-emerald-400',
  Minimal: 'text-blue-600 dark:text-blue-400',
  Moderate: 'text-amber-600 dark:text-amber-400',
  High: 'text-red-600 dark:text-red-400',
  Heavy: 'text-red-600 dark:text-red-400',
};

export default function ReadabilityPanel({ result }: Props) {
  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <ScoreRing score={result.readabilityScore} size="lg" />
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Readability Score</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{result.readabilityScore} / 100</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{result.gradeLevel}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Complexity', value: result.complexityRating, color: complexityColor[result.complexityRating] || 'text-gray-600' },
            { label: 'Avg Sentence', value: `~${result.averageSentenceLength} words`, color: result.averageSentenceLength > 20 ? 'text-amber-600' : 'text-emerald-600' },
            { label: 'Passive Voice', value: result.passiveVoiceEstimate, color: levelColor[result.passiveVoiceEstimate] || 'text-gray-600' },
            { label: 'Jargon Level', value: result.jargonLevel, color: levelColor[result.jargonLevel] || 'text-gray-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-xs font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={13} className="text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Strengths</p>
          </div>
          <ul className="space-y-1.5">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle size={10} className="flex-shrink-0 mt-0.5" /> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Issues */}
      {result.issues.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <AlertTriangle size={11} className="text-amber-500" /> Readability Issues
          </p>
          {result.issues.map((issue, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{issue.type}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{issue.description}</p>
                </div>
              </div>
              {issue.example && (
                <blockquote className="border-l-2 border-amber-300 pl-3 mt-2 mb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">"{issue.example}"</p>
                </blockquote>
              )}
              <div className="flex items-start gap-1.5 mt-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg px-3 py-2">
                <ChevronRight size={11} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400">{issue.fix}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <BookOpen size={12} /> Suggestions
          </p>
          <ul className="space-y-2">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                <span className="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
