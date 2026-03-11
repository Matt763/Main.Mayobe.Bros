import { useState } from 'react';
import { CalendarEntry } from './types';
import { Calendar, Plus, Trash2, ExternalLink, CreditCard as Edit3, Check, Clock, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  entries: CalendarEntry[];
  onAdd: (entry: Omit<CalendarEntry, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: CalendarEntry['status']) => Promise<void>;
}

const statusConfig: Record<CalendarEntry['status'], { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700', icon: FileText },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', icon: Edit3 },
  ready: { label: 'Ready', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: Clock },
  published: { label: 'Published', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: CheckCircle },
};

export default function CalendarView({ entries, onAdd, onDelete, onUpdateStatus }: Props) {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    category: '',
    scheduled_date: '',
    status: 'draft' as CalendarEntry['status'],
    notes: '',
    keywords: [] as string[],
    outline: null as null,
    meta: null as null,
    post_id: null as null,
  });

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    setSaving(true);
    await onAdd(formData);
    setSaving(false);
    setShowForm(false);
    setFormData({ title: '', topic: '', category: '', scheduled_date: '', status: 'draft', notes: '', keywords: [], outline: null, meta: null, post_id: null });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const grouped = entries.reduce<Record<string, CalendarEntry[]>>((acc, e) => {
    const month = e.scheduled_date
      ? new Date(e.scheduled_date).toLocaleString('default', { month: 'long', year: 'numeric' })
      : 'Unscheduled';
    if (!acc[month]) acc[month] = [];
    acc[month].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Publishing Calendar</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entries.length} article{entries.length !== 1 ? 's' : ''} planned</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          <Plus size={12} /> Add Entry
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-4">New Calendar Entry</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="Article title"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                  placeholder="e.g. Technology"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Publish Date</label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={e => setFormData(p => ({ ...p, scheduled_date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Planning notes, ideas..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.title.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
          <Calendar size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No articles scheduled</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Use topic discovery to plan your publishing schedule</p>
        </div>
      ) : (
        Object.entries(grouped).map(([month, items]) => (
          <div key={month}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={13} className="text-blue-600 dark:text-blue-400" />
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{month}</h4>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              <span className="text-[10px] text-gray-400">{items.length} article{items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-2">
              {items.map(entry => {
                const cfg = statusConfig[entry.status];
                const StatusIcon = cfg.icon;
                return (
                  <div key={entry.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{entry.title}</p>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                            <StatusIcon size={9} /> {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {entry.category && <span className="text-[11px] text-gray-400">{entry.category}</span>}
                          {entry.scheduled_date && (
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Clock size={9} />
                              {new Date(entry.scheduled_date).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {entry.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{entry.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <select
                          value={entry.status}
                          onChange={e => onUpdateStatus(entry.id, e.target.value as CalendarEntry['status'])}
                          className="text-[11px] border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 focus:outline-none"
                        >
                          <option value="draft">Draft</option>
                          <option value="in_progress">In Progress</option>
                          <option value="ready">Ready</option>
                          <option value="published">Published</option>
                        </select>
                        <button
                          onClick={() => navigate('/admin/posts/new')}
                          title="Open in editor"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                        >
                          <ExternalLink size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingId === entry.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        >
                          {deletingId === entry.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
