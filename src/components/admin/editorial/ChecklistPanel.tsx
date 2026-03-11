import { CheckCircle, XCircle, AlertTriangle, Shield } from 'lucide-react';
import { ChecklistResult } from './types';

interface Props { result: ChecklistResult; }

const categoryColors: Record<string, string> = {
  Content: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  SEO: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  Media: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  Technical: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

const priorityOrder = { Required: 0, Recommended: 1, Optional: 2 };

export default function ChecklistPanel({ result }: Props) {
  const passed = result.items.filter(i => i.status === 'pass').length;
  const failed = result.items.filter(i => i.status === 'fail').length;
  const warned = result.items.filter(i => i.status === 'warning').length;

  const sortedItems = [...result.items].sort((a, b) => {
    const statusOrder = { fail: 0, warning: 1, pass: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
  });

  const grouped = sortedItems.reduce<Record<string, typeof sortedItems>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className={`border rounded-2xl p-5 ${result.readyToPublish ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'}`}>
        <div className="flex items-center gap-3 mb-3">
          {result.readyToPublish
            ? <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />
            : <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
          }
          <div>
            <p className={`text-sm font-bold ${result.readyToPublish ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {result.readyToPublish ? 'Ready to Publish' : 'Not Ready to Publish'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{result.completionPercentage}% checklist complete</p>
          </div>
        </div>
        <div className="h-2 bg-white/60 dark:bg-gray-900/40 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${result.completionPercentage >= 80 ? 'bg-emerald-500' : result.completionPercentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${result.completionPercentage}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={11} className="text-emerald-500" />
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{passed} passed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={11} className="text-amber-500" />
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">{warned} warnings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle size={11} className="text-red-500" />
            <span className="text-[11px] font-bold text-red-700 dark:text-red-400">{failed} failed</span>
          </div>
        </div>
      </div>

      {/* Blockers */}
      {result.blockers.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Shield size={12} /> Must Fix Before Publishing
          </p>
          <ul className="space-y-1.5">
            {result.blockers.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400 leading-relaxed">
                <XCircle size={11} className="flex-shrink-0 mt-0.5" /> {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grouped checklist items */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryColors[category] || categoryColors.Technical}`}>{category}</span>
          </div>
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                item.status === 'pass'
                  ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  : item.status === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                  : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex-shrink-0 mt-0.5">
                  {item.status === 'pass'
                    ? <CheckCircle size={13} className="text-emerald-500" />
                    : item.status === 'warning'
                    ? <AlertTriangle size={13} className="text-amber-500" />
                    : <XCircle size={13} className="text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white leading-snug">{item.item}</p>
                    {item.priority !== 'Optional' && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${item.priority === 'Required' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                        {item.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
