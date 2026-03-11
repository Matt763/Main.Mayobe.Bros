import { TrendingUp, BarChart2, Target, Bookmark, ChevronRight, Zap, ArrowUp } from 'lucide-react';
import { DiscoveredTopic } from './types';

interface Props {
  topic: DiscoveredTopic;
  isSaved: boolean;
  onSave: () => void;
  onSelect: () => void;
}

const interestColors: Record<string, string> = {
  Trending: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  High: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  Medium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
};

const volumeColors: Record<string, string> = {
  'Very High': 'text-emerald-600 dark:text-emerald-400',
  'High': 'text-blue-600 dark:text-blue-400',
  'Medium': 'text-gray-600 dark:text-gray-400',
  'Low': 'text-gray-400 dark:text-gray-500',
};

const difficultyColors: Record<string, string> = {
  Easy: 'text-emerald-600 dark:text-emerald-400',
  Moderate: 'text-amber-600 dark:text-amber-400',
  Competitive: 'text-red-600 dark:text-red-400',
};

export default function TopicCard({ topic, isSaved, onSave, onSelect }: Props) {
  return (
    <div className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {topic.title}
          </h3>
        </div>
        <span className={`flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${interestColors[topic.interestLevel] || interestColors.Medium}`}>
          {topic.interestLevel === 'Trending' && <Zap size={9} />}
          {topic.interestLevel === 'High' && <ArrowUp size={9} />}
          {topic.interestLevel}
        </span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4 line-clamp-2">
        {topic.angle}
      </p>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <BarChart2 size={10} className="text-gray-400" />
            <span className="text-[10px] text-gray-400 font-medium">Volume</span>
          </div>
          <span className={`text-[11px] font-bold ${volumeColors[topic.estimatedSearchVolume] || 'text-gray-600'}`}>
            {topic.estimatedSearchVolume}
          </span>
        </div>
        <div className="text-center border-x border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Target size={10} className="text-gray-400" />
            <span className="text-[10px] text-gray-400 font-medium">Difficulty</span>
          </div>
          <span className={`text-[11px] font-bold ${difficultyColors[topic.difficulty] || 'text-gray-600'}`}>
            {topic.difficulty}
          </span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingUp size={10} className="text-gray-400" />
            <span className="text-[10px] text-gray-400 font-medium">Category</span>
          </div>
          <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate block">
            {topic.category}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Focus keyword</p>
        <span className="inline-block text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg px-2 py-0.5 font-medium">
          {topic.primaryKeyword}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Why it works</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">"{topic.whyItWorks}"</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSelect}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Start Planning
          <ChevronRight size={12} />
        </button>
        <button
          onClick={onSave}
          title={isSaved ? 'Already saved' : 'Save topic'}
          className={`p-2 rounded-xl border transition-all ${
            isSaved
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
              : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
          }`}
        >
          <Bookmark size={13} className={isSaved ? 'fill-current' : ''} />
        </button>
      </div>
    </div>
  );
}
