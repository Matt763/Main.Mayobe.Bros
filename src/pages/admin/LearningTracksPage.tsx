import { useEffect, useMemo, useState } from 'react';
import {
  GraduationCap, Plus, Pencil, Trash2, Loader2, Save, X, CheckCircle2, AlertCircle,
  Eye, EyeOff, ListOrdered, ArrowUp, ArrowDown,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

type Track = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

type Item = { post_id: string; position: number; notes: string | null };
type PostLite = { id: string; title: string; slug: string };

export default function LearningTracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Track | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Learning Tracks · Admin';
    return () => { document.title = prev; };
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/learning-tracks/admin', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setTracks(data.tracks || []);
    } catch { /* noop */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const create = async (form: { title: string; description: string; coverImage: string; isPublished: boolean }) => {
    try {
      const res = await fetch('/api/learning-tracks/admin', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setCreating(false);
      setEditing(data.track);
      load();
      setToast({ type: 'success', message: 'Track created' });
    } catch (e: any) {
      setToast({ type: 'error', message: e?.message || 'Failed' });
    }
  };

  const remove = async (track: Track) => {
    if (!confirm(`Delete track "${track.title}" and all post assignments?`)) return;
    try {
      const res = await fetch(`/api/learning-tracks/admin/${track.id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        setTracks(prev => prev.filter(t => t.id !== track.id));
        if (editing?.id === track.id) setEditing(null);
        setToast({ type: 'success', message: 'Track deleted' });
      }
    } catch { /* noop */ }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <GraduationCap size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Tracks</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Curate ordered reading paths from existing posts.</p>
            </div>
          </div>
          <button type="button" onClick={() => { setCreating(true); setEditing(null); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold">
            <Plus size={14} /> New track
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* List */}
          <aside className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400 mb-3 px-1">All tracks</p>
            {loading ? (
              <div className="py-10 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={20} /></div>
            ) : tracks.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No tracks yet. Create your first one.</div>
            ) : (
              <ul className="space-y-1">
                {tracks.map(t => {
                  const active = editing?.id === t.id;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => { setEditing(t); setCreating(false); }}
                        className={
                          'w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors ' +
                          (active ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200 dark:ring-emerald-800' : 'hover:bg-gray-100 dark:hover:bg-gray-900')
                        }
                      >
                        <span className={'mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded ' + (t.is_published ? 'text-emerald-600' : 'text-gray-400')}>
                          {t.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{t.title}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{t.slug}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); remove(t); }}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                          aria-label={`Delete ${t.title}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Editor */}
          <div className="lg:col-span-3">
            {creating && (
              <CreateForm onCancel={() => setCreating(false)} onSubmit={create} />
            )}
            {!creating && editing && (
              <Editor
                track={editing}
                onSaved={(t) => { setEditing(t); load(); setToast({ type: 'success', message: 'Saved' }); }}
                onError={(m) => setToast({ type: 'error', message: m })}
              />
            )}
            {!creating && !editing && (
              <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-10 text-center">
                <Pencil size={20} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Select a track from the left to edit, or create a new one.</p>
              </div>
            )}
          </div>
        </div>

        {toast && (
          <div className={
            'fixed top-20 right-4 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ' +
            (toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800')
          }>
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function CreateForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (f: { title: string; description: string; coverImage: string; isPublished: boolean }) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 sm:p-6">
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">New learning track</h2>
      <div className="space-y-3">
        <Field label="Title">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Tanzania Tech 101" className={inputCls} />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What will readers learn?" className={inputCls + ' resize-y'} />
        </Field>
        <Field label="Cover image URL (optional)">
          <input value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://..." className={inputCls} />
        </Field>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-emerald-600 focus:ring-emerald-500" />
          <span className="text-gray-700 dark:text-gray-200">Publish immediately</span>
        </label>
      </div>
      <div className="flex gap-2 mt-5">
        <button type="button" onClick={() => title.trim() && onSubmit({ title: title.trim(), description: description.trim(), coverImage: coverImage.trim(), isPublished })}
          disabled={!title.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold">
          <Plus size={14} /> Create
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Editor({ track, onSaved, onError }: { track: Track; onSaved: (t: Track) => void; onError: (m: string) => void }) {
  const [form, setForm] = useState<Track>(track);
  const [items, setItems] = useState<Item[]>([]);
  const [postsById, setPostsById] = useState<Record<string, PostLite>>({});
  const [postSlug, setPostSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  const [search, setSearch] = useState<PostLite[]>([]);

  useEffect(() => { setForm(track); }, [track.id]);

  useEffect(() => {
    fetch(`/api/learning-tracks/admin/${track.id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(async (data) => {
        const list: Item[] = data.items || [];
        setItems(list);
        if (list.length) {
          // Fetch post details
          const ids = list.map(i => i.post_id);
          const r2 = await fetch(`/api/posts?ids=${ids.join(',')}`, { credentials: 'include' });
          if (r2.ok) {
            const d2 = await r2.json();
            const map: Record<string, PostLite> = {};
            (d2.posts || d2 || []).forEach((p: any) => { if (p?.id) map[p.id] = { id: p.id, title: p.title, slug: p.slug }; });
            setPostsById(map);
          }
        } else {
          setPostsById({});
        }
      })
      .catch(() => { /* noop */ });
  }, [track.id]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(track), [form, track]);

  const saveTrack = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/learning-tracks/admin/${track.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, slug: form.slug, description: form.description,
          coverImage: form.cover_image, isPublished: form.is_published,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save failed');
      onSaved(data.track);
    } catch (e: any) {
      onError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveItems = async (next: Item[]) => {
    setItems(next);
    setSavingItems(true);
    try {
      const payload = next.map((i, idx) => ({ postId: i.post_id, position: idx, notes: i.notes }));
      const res = await fetch(`/api/learning-tracks/admin/${track.id}/posts`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || 'Failed');
      }
    } catch (e: any) {
      onError(e?.message || 'Could not save post order');
    } finally {
      setSavingItems(false);
    }
  };

  const addBySlug = async () => {
    const slug = postSlug.trim();
    if (!slug) return;
    try {
      const res = await fetch(`/api/posts/slug/${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (!res.ok || !data?.id) throw new Error('Post not found');
      if (items.some(i => i.post_id === data.id)) {
        onError('Post already in track'); return;
      }
      const next: Item[] = [...items, { post_id: data.id, position: items.length, notes: null }];
      setPostsById(prev => ({ ...prev, [data.id]: { id: data.id, title: data.title, slug: data.slug } }));
      await saveItems(next);
      setPostSlug('');
      setSearch([]);
    } catch (e: any) {
      onError(e?.message || 'Could not add post');
    }
  };

  const move = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    saveItems(next);
  };

  const removeItem = (postId: string) => {
    saveItems(items.filter(i => i.post_id !== postId));
  };

  const searchPosts = async (q: string) => {
    setPostSlug(q);
    if (q.length < 2) { setSearch([]); return; }
    try {
      const res = await fetch(`/api/posts?q=${encodeURIComponent(q)}&limit=8`, { credentials: 'include' });
      const data = await res.json();
      setSearch((data.posts || data || []).slice(0, 8).map((p: any) => ({ id: p.id, title: p.title, slug: p.slug })));
    } catch { /* noop */ }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 sm:p-6">
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Edit track</h2>
      <div className="space-y-3 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Field label="Title">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <Field label="Slug">
            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <Field label="Description">
          <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls + ' resize-y'} />
        </Field>
        <Field label="Cover image URL">
          <input value={form.cover_image || ''} onChange={e => setForm({ ...form, cover_image: e.target.value })} className={inputCls} />
        </Field>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-emerald-600 focus:ring-emerald-500" />
          <span className="text-gray-700 dark:text-gray-200">Published</span>
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={saveTrack} disabled={saving || !dirty}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 inline-flex items-center gap-2">
            <ListOrdered size={14} /> Posts in this track
            {savingItems && <Loader2 size={12} className="animate-spin text-emerald-600" />}
          </h3>
          <span className="text-xs text-gray-400">{items.length} step{items.length === 1 ? '' : 's'}</span>
        </div>
        <div className="relative mb-3">
          <input
            value={postSlug}
            onChange={e => searchPosts(e.target.value)}
            placeholder="Search post by title or paste a slug, then press Add"
            className={inputCls}
          />
          <button type="button" onClick={addBySlug} disabled={!postSlug.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold">
            <Plus size={12} /> Add
          </button>
          {search.length > 0 && (
            <ul className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
              {search.map(p => (
                <li key={p.id}>
                  <button type="button" onClick={() => { setPostSlug(p.slug); setSearch([]); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm">
                    <p className="text-gray-900 dark:text-white truncate">{p.title}</p>
                    <p className="text-[11px] text-gray-400 truncate">{p.slug}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No posts assigned yet.</p>
        ) : (
          <ol className="space-y-2">
            {items.map((it, idx) => {
              const post = postsById[it.post_id];
              return (
                <li key={it.post_id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{post?.title || it.post_id}</p>
                    <p className="text-[11px] text-gray-400 truncate">{post?.slug || ''}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
                      className="p-1.5 rounded text-gray-400 hover:text-emerald-600 disabled:opacity-30" aria-label="Move up">
                      <ArrowUp size={13} />
                    </button>
                    <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}
                      className="p-1.5 rounded text-gray-400 hover:text-emerald-600 disabled:opacity-30" aria-label="Move down">
                      <ArrowDown size={13} />
                    </button>
                    <button type="button" onClick={() => removeItem(it.post_id)}
                      className="p-1.5 rounded text-gray-400 hover:text-red-600" aria-label="Remove">
                      <X size={13} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

const inputCls = 'w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}
