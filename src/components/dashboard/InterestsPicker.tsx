import { Check, Loader2 } from 'lucide-react';
import { useInterests } from '../../hooks/useInterests';

interface Props {
  compact?: boolean;
}

export default function InterestsPicker({ compact }: Props) {
  const { categories, selected, loading, saving, error, toggle } = useInterests();

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <div
            key={i}
            className={`${compact ? 'h-8 w-20' : 'h-10 w-28'} rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse`}
          />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No categories available yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => toggle(cat.id)}
            disabled={saving}
            aria-pressed={cat.selected}
            className={`inline-flex items-center gap-1.5 ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-full font-semibold transition-all cursor-pointer disabled:opacity-70 ${
              cat.selected
                ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat.selected && <Check size={compact ? 11 : 13} />}
            {cat.name}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-1.5">
        {saving && <Loader2 size={12} className="animate-spin" />}
        {selected.length === 0
          ? 'Pick at least one category to personalize your feed.'
          : `${selected.length} ${selected.length === 1 ? 'interest' : 'interests'} selected`}
      </p>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
