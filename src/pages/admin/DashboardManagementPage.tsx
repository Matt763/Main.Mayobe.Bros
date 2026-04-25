import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Sparkles, Bookmark, GraduationCap, Briefcase, Bell, BarChart3, Bot,
  Save, Loader2, CheckCircle2, AlertCircle, Crown, Sliders,
  Layers, Compass, DollarSign, Info, GripVertical, Send, Trash2, Megaphone,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  type DashboardSettings,
  DEFAULT_DASHBOARD_SETTINGS,
  mergeWithDefaults,
  DASHBOARD_SECTION_LABELS,
} from '../../lib/dashboardSettings';

type TabKey = 'features' | 'limits' | 'layout' | 'personalization' | 'premium' | 'broadcasts';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'features',         label: 'Features',         icon: Sliders   },
  { key: 'limits',           label: 'Limits',           icon: Sparkles  },
  { key: 'layout',           label: 'Layout',           icon: Layers    },
  { key: 'personalization',  label: 'Personalization',  icon: Compass   },
  { key: 'premium',          label: 'Premium',          icon: Crown     },
  { key: 'broadcasts',       label: 'Broadcasts',       icon: Megaphone },
];

const FEATURE_ROWS: { key: keyof DashboardSettings['features']; icon: any; label: string; description: string; futureReady?: boolean }[] = [
  { key: 'personalizedFeed', icon: Sparkles,       label: 'Personalized Feed',          description: 'Show "For You" recommendations based on user interests.' },
  { key: 'savedContent',     icon: Bookmark,       label: 'Saved Content',              description: 'Allow users to bookmark and revisit articles.' },
  { key: 'jobsTracker',      icon: Briefcase,      label: 'Jobs Tracker',               description: 'Show jobs section and saved/applied tracking.' },
  { key: 'notifications',    icon: Bell,           label: 'Notifications',              description: 'Surface new posts in followed categories.' },
  { key: 'userStats',        icon: BarChart3,      label: 'User Stats',                 description: 'Display reading streak, post count, and activity.' },
  { key: 'learningSystem',   icon: GraduationCap,  label: 'Learning System',            description: 'Curated learning tracks and progress (coming soon).', futureReady: true },
  { key: 'aiAssistant',      icon: Bot,            label: 'AI Assistant',               description: 'In-dashboard reading assistant (coming soon).',           futureReady: true },
];

export default function DashboardManagementPage() {
  const [tab, setTab] = useState<TabKey>('features');
  const [config, setConfig] = useState<DashboardSettings>(DEFAULT_DASHBOARD_SETTINGS);
  const [original, setOriginal] = useState<DashboardSettings>(DEFAULT_DASHBOARD_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = 'User Dashboard Management · Admin';
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/dashboard-settings/admin', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const merged = mergeWithDefaults(data?.config);
        setConfig(merged);
        setOriginal(merged);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('[DashboardManagement] load error', err);
        setToast({ type: 'error', message: 'Failed to load settings' });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(original), [config, original]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/dashboard-settings/admin', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save failed');
      const merged = mergeWithDefaults(data.config);
      setConfig(merged);
      setOriginal(merged);
      setToast({ type: 'success', message: 'Settings saved' });
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setConfig(original);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <LayoutDashboard size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Dashboard Management</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Configure features, limits, layout, personalization, and premium controls for the reader dashboard.</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl mb-6 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ' +
                  (active
                    ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')
                }
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-amber-600" size={28} />
          </div>
        ) : (
          <>
            {tab === 'features'        && <FeaturesTab        config={config} onChange={setConfig} />}
            {tab === 'limits'          && <LimitsTab          config={config} onChange={setConfig} />}
            {tab === 'layout'          && <LayoutTab          config={config} onChange={setConfig} />}
            {tab === 'personalization' && <PersonalizationTab config={config} onChange={setConfig} />}
            {tab === 'premium'         && <PremiumTab         config={config} onChange={setConfig} />}
            {tab === 'broadcasts'      && <BroadcastsTab />}
          </>
        )}

        {/* Save bar */}
        {!loading && dirty && (
          <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-40 flex items-center gap-3 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-2xl shadow-2xl px-4 py-3">
            <Info size={16} className="text-amber-500 flex-shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 truncate">You have unsaved changes</span>
            <button
              type="button"
              onClick={reset}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            className={
              'fixed top-20 right-4 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ' +
              (toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800')
            }
            role="status"
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tab components
// ────────────────────────────────────────────────────────────────────────────

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 sm:p-6 mb-4">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ' +
        (disabled
          ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-60'
          : checked
            ? 'bg-amber-500 cursor-pointer'
            : 'bg-gray-300 dark:bg-gray-600 cursor-pointer')
      }
    >
      <span
        className={
          'inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ' +
          (checked ? 'translate-x-5' : 'translate-x-1')
        }
      />
    </button>
  );
}

function FeaturesTab({ config, onChange }: { config: DashboardSettings; onChange: (c: DashboardSettings) => void }) {
  return (
    <Card title="Feature toggles" description="Enable or disable each dashboard feature for all users.">
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {FEATURE_ROWS.map(({ key, icon: Icon, label, description, futureReady }) => (
          <li key={key} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Icon size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                {futureReady && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    Future-ready
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <Toggle
              checked={config.features[key]}
              onChange={v => onChange({ ...config, features: { ...config.features, [key]: v } })}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function NumberField({ label, value, onChange, min, max, suffix, hint }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; suffix?: string; hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>}
    </label>
  );
}

function LimitsTab({ config, onChange }: { config: DashboardSettings; onChange: (c: DashboardSettings) => void }) {
  const set = (patch: Partial<DashboardSettings['limits']>) =>
    onChange({ ...config, limits: { ...config.limits, ...patch } });
  return (
    <>
      <Card title="Free tier limits" description="Caps applied to non-premium readers. Premium users have no caps.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberField label="Max saved articles"
            value={config.limits.freeSavedPostsMax}
            onChange={v => set({ freeSavedPostsMax: v })}
            min={0} max={10000} suffix="articles"
            hint="0 disables saving for free users." />
          <NumberField label="Max reading history"
            value={config.limits.freeReadingHistoryMax}
            onChange={v => set({ freeReadingHistoryMax: v })}
            min={0} max={100000} suffix="entries" />
          <NumberField label="Notifications per day"
            value={config.limits.freeNotificationsPerDay}
            onChange={v => set({ freeNotificationsPerDay: v })}
            min={0} max={1000} suffix="alerts" />
        </div>
      </Card>
      <Card title="Premium tier" description="Currently: unlimited everything for premium readers.">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Premium accounts bypass all caps automatically. To configure pricing, see the <strong>Premium</strong> tab.
        </p>
      </Card>
    </>
  );
}

function LayoutTab({ config, onChange }: { config: DashboardSettings; onChange: (c: DashboardSettings) => void }) {
  const order = config.layout.sectionOrder;
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange({ ...config, layout: { ...config.layout, sectionOrder: next } });
  };

  const toggleVisible = (key: string, v: boolean) =>
    onChange({
      ...config,
      layout: {
        ...config.layout,
        sectionVisibility: { ...config.layout.sectionVisibility, [key]: v },
      },
    });

  return (
    <Card title="Dashboard layout" description="Drag the handle to reorder sections. Toggle visibility globally.">
      <ul className="space-y-2 select-none">
        {order.map((key, idx) => {
          const label = DASHBOARD_SECTION_LABELS[key] || key;
          const visible = (config.layout.sectionVisibility as any)[key] ?? true;
          const isDragging = draggingIdx === idx;
          const isHover = hoverIdx === idx && draggingIdx !== null && draggingIdx !== idx;
          return (
            <li
              key={key}
              draggable
              onDragStart={(e) => {
                setDraggingIdx(idx);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(idx));
              }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setHoverIdx(idx); }}
              onDragLeave={() => setHoverIdx(prev => (prev === idx ? null : prev))}
              onDrop={(e) => {
                e.preventDefault();
                const from = Number(e.dataTransfer.getData('text/plain'));
                if (Number.isFinite(from)) reorder(from, idx);
                setDraggingIdx(null); setHoverIdx(null);
              }}
              onDragEnd={() => { setDraggingIdx(null); setHoverIdx(null); }}
              className={
                'flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-gray-50 dark:bg-gray-900 transition-all ' +
                (isDragging
                  ? 'opacity-40 border-dashed border-amber-400'
                  : isHover
                    ? 'border-amber-500 ring-2 ring-amber-200 dark:ring-amber-800/50 -translate-y-0.5'
                    : 'border-gray-200 dark:border-gray-700')
              }
            >
              <span
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-amber-600 px-1 -ml-1"
                aria-label="Drag to reorder"
                title="Drag to reorder"
              >
                <GripVertical size={16} />
              </span>
              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{label}</span>
              <span className="text-[11px] text-gray-400 mr-2">#{idx + 1}</span>
              <Toggle checked={visible} onChange={v => toggleVisible(key, v)} />
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1.5">
        <Info size={12} /> Tip: drag the handle to reorder. Reordering takes effect on every reader's dashboard immediately after save.
      </p>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Broadcasts tab
// ────────────────────────────────────────────────────────────────────────────

type Broadcast = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  audience: 'all' | 'free' | 'premium';
  created_at: string;
};

function BroadcastsTab() {
  const [list, setList] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [audience, setAudience] = useState<'all' | 'free' | 'premium'>('all');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/broadcasts/admin', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setList(data.broadcasts || []);
    } catch { /* noop */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const send = async () => {
    if (!title.trim()) { setFeedback({ type: 'error', message: 'Title is required' }); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/broadcasts/admin', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim() || null, link: link.trim() || null, audience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setTitle(''); setBody(''); setLink(''); setAudience('all');
      setFeedback({ type: 'success', message: 'Broadcast sent' });
      load();
    } catch (e: any) {
      setFeedback({ type: 'error', message: e?.message || 'Failed to send' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this broadcast?')) return;
    try {
      const res = await fetch(`/api/broadcasts/admin/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) setList(prev => prev.filter(b => b.id !== id));
    } catch { /* noop */ }
  };

  return (
    <>
      <Card title="Send a broadcast notification" description="Composes a notification visible to all readers (or a tier subset). Stays in their feed until you delete it.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <label className="block sm:col-span-2">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</span>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's the headline?"
              maxLength={200}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Audience</span>
            <select
              value={audience}
              onChange={e => setAudience(e.target.value as any)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All readers</option>
              <option value="free">Free tier</option>
              <option value="premium">Premium only</option>
            </select>
          </label>
        </div>
        <label className="block mb-4">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message <span className="text-gray-400 font-normal">(optional)</span></span>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="A short message — shown beneath the title."
            rows={3}
            maxLength={5000}
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
          />
        </label>
        <label className="block mb-4">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Link <span className="text-gray-400 font-normal">(optional)</span></span>
          <input
            type="url"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://www.mayobebros.com/posts/announcement"
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={send}
            disabled={busy || !title.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-60"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {busy ? 'Sending…' : 'Send broadcast'}
          </button>
          {feedback && (
            <span className={'text-sm ' + (feedback.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
              {feedback.message}
            </span>
          )}
        </div>
      </Card>

      <Card title="Recent broadcasts" description="Most recent first. Delete to revoke.">
        {loading ? (
          <div className="py-8 flex items-center justify-center"><Loader2 className="animate-spin text-amber-600" size={20} /></div>
        ) : list.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No broadcasts yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {list.map(b => (
              <li key={b.id} className="py-3 flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
                  <Megaphone size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{b.title}</p>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{b.audience}</span>
                  </div>
                  {b.body && <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5">{b.body}</p>}
                  <p className="text-[11px] text-gray-400 mt-1">{new Date(b.created_at).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(b.id)}
                  aria-label="Delete broadcast"
                  className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function PersonalizationTab({ config, onChange }: { config: DashboardSettings; onChange: (c: DashboardSettings) => void }) {
  const sources: { key: 'category' | 'activity' | 'trending'; label: string; description: string }[] = [
    { key: 'category',  label: 'By category interests',  description: 'Show posts from categories the user follows.' },
    { key: 'activity',  label: 'By reading activity',     description: 'Recommend based on what the user reads.' },
    { key: 'trending',  label: 'Trending override',       description: 'Always show site-wide trending content.' },
  ];
  return (
    <>
      <Card title="Recommendation logic" description="Choose how the personalized feed selects content.">
        <ul className="space-y-2">
          {sources.map(s => {
            const active = config.personalization.recommendationSource === s.key;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => onChange({ ...config, personalization: { ...config.personalization, recommendationSource: s.key } })}
                  className={
                    'w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ' +
                    (active
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 bg-white dark:bg-gray-900')
                  }
                >
                  <span className={'mt-0.5 inline-flex w-4 h-4 rounded-full border-2 flex-shrink-0 ' + (active ? 'border-amber-500 bg-amber-500' : 'border-gray-300 dark:border-gray-600')}>
                    {active && <span className="block w-1.5 h-1.5 m-auto mt-[3px] rounded-full bg-white" />}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{s.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{s.description}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
      <Card title="Default interests for new users" description="Comma-separated category IDs. New signups will auto-follow these.">
        <input
          type="text"
          value={config.personalization.defaultInterestIds.join(', ')}
          onChange={e => onChange({
            ...config,
            personalization: {
              ...config.personalization,
              defaultInterestIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
            },
          })}
          placeholder="cat-id-1, cat-id-2"
          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Leave blank to require users to pick their own on first visit.</p>
      </Card>
    </>
  );
}

function PremiumTab({ config, onChange }: { config: DashboardSettings; onChange: (c: DashboardSettings) => void }) {
  const set = (patch: Partial<DashboardSettings['premium']>) =>
    onChange({ ...config, premium: { ...config.premium, ...patch } });
  return (
    <>
      <Card title="Premium tier" description="Master switch and pricing for the lifetime upgrade.">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Premium enabled</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">When off, the upgrade page is hidden and premium-only features fall back.</p>
          </div>
          <Toggle checked={config.premium.enabled} onChange={v => set({ enabled: v })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberField label="Price"
            value={config.premium.priceUsd}
            onChange={v => set({ priceUsd: v })}
            min={0} max={1000} suffix={config.premium.currency}
            hint="One-time, lifetime." />
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Currency</span>
            <select
              value={config.premium.currency}
              onChange={e => set({ currency: e.target.value })}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="USD">USD — US Dollar</option>
              <option value="TZS">TZS — Tanzanian Shilling</option>
              <option value="KES">KES — Kenyan Shilling</option>
              <option value="UGX">UGX — Ugandan Shilling</option>
            </select>
          </label>
          <div className="flex items-end">
            <div className="text-sm text-gray-600 dark:text-gray-400 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 w-full">
              <DollarSign size={14} className="inline -mt-0.5" /> Lifetime: <strong>{config.premium.priceUsd} {config.premium.currency}</strong>
            </div>
          </div>
        </div>
      </Card>
      <Card title="Premium-only features" description="Comma-separated feature keys reserved for premium users.">
        <input
          type="text"
          value={config.premium.premiumOnlyFeatures.join(', ')}
          onChange={e => set({ premiumOnlyFeatures: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="aiSummary, audioMode, customThemes"
          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Free users will see these features locked behind a paywall.
        </p>
      </Card>
    </>
  );
}
