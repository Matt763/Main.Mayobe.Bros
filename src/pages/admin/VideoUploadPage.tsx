import { useState, useRef } from 'react';
import { Film, Upload, Trash2, Copy, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useVideosList, initVideoUpload, directUploadToBunny, deleteVideo,
  type Video,
} from '../../hooks/useVideos';

function StatusPill({ status }: { status: Video['status'] }) {
  const map: Record<Video['status'], { cls: string; label: string; Icon: typeof Clock }> = {
    uploading: { cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',     label: 'Uploading',  Icon: Upload },
    encoding:  { cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300', label: 'Encoding',   Icon: Loader2 },
    ready:     { cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300', label: 'Ready', Icon: CheckCircle2 },
    failed:    { cls: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',         label: 'Failed',     Icon: AlertCircle },
  };
  const { cls, label, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      <Icon size={12} className={status === 'encoding' ? 'animate-spin' : ''} /> {label}
    </span>
  );
}

function fmtBytes(n: number | null): string {
  if (!n) return '—';
  const mb = n / (1024 * 1024);
  return mb >= 100 ? `${mb.toFixed(0)}MB` : `${mb.toFixed(1)}MB`;
}
function fmtDuration(s: number | null): string {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function VideoUploadPage() {
  const { videos, loading, error, refetch } = useVideosList({ limit: 50, pollMs: 5000 });
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile]               = useState<File | null>(null);
  const [progress, setProgress]       = useState(0);
  const [uploading, setUploading]     = useState(false);
  const [msg, setMsg]                 = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId]       = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleUpload() {
    if (!title.trim()) { setMsg({ kind: 'error', text: 'Title is required' }); return; }
    if (!file)         { setMsg({ kind: 'error', text: 'Pick a video file first' }); return; }
    setUploading(true);
    setProgress(0);
    setMsg(null);
    try {
      const { uploadUrl, accessKey } = await initVideoUpload(title, description || undefined);
      await directUploadToBunny(uploadUrl, accessKey, file, setProgress);
      setMsg({ kind: 'success', text: 'Upload complete — encoding in progress. The list will refresh automatically.' });
      setTitle('');
      setDescription('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refetch();
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleDelete(v: Video) {
    if (!confirm(`Delete "${v.title}"? This removes it from Bunny Stream too.`)) return;
    try {
      await deleteVideo(v.id);
      await refetch();
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message });
    }
  }

  function copyEmbed(v: Video) {
    const token = `[video:${v.id}]`;
    void navigator.clipboard.writeText(token).then(() => {
      setCopiedId(v.id);
      setTimeout(() => setCopiedId((id) => (id === v.id ? null : id)), 1500);
    });
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Film size={28} className="text-blue-500" /> Videos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload videos to Bunny Stream. They encode to adaptive bitrate (AV1/H.265/H.264) and serve from a global CDN. Use the <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">[video:&lt;id&gt;]</code> token in post bodies to embed.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload a new video</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
                placeholder="e.g. Best Study Techniques (Tutorial)"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
                placeholder="Short caption"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={uploading}
              className="block text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-600"
            />
            {file && <span className="text-xs text-gray-500 dark:text-gray-400">{fmtBytes(file.size)}</span>}
          </div>

          {uploading && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Uploading to Bunny Stream…</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !title.trim() || !file}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={18} /> {uploading ? 'Uploading…' : 'Upload'}
          </button>

          {msg && (
            <div className={`mt-4 rounded-lg p-3 text-sm ${
              msg.kind === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              {msg.text}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <header className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Library {videos.length > 0 && <span className="text-gray-500 dark:text-gray-500">({videos.length})</span>}
            </h2>
          </header>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
            </div>
          )}
          {error && (
            <div className="px-6 py-4 text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}
          {!loading && !error && videos.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              No videos yet. Upload your first above.
            </div>
          )}
          <ul>
            {videos.map((v) => (
              <li key={v.id} className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-0 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="w-32 aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
                  {v.poster_url
                    ? <img src={v.poster_url} alt={v.title ?? ''} className="w-full h-full object-cover" loading="lazy" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-400"><Film size={24} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{v.title ?? '(untitled)'}</h3>
                    <StatusPill status={v.status} />
                  </div>
                  {v.description && <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{v.description}</p>}
                  <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>{fmtDuration(v.duration_seconds)}</span>
                    <span>•</span>
                    <span className="font-mono">{v.id.slice(0, 8)}</span>
                  </div>
                  {v.error_message && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{v.error_message}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => copyEmbed(v)}
                    disabled={v.status !== 'ready'}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Copy [video:id] token"
                  >
                    <Copy size={12} /> {copiedId === v.id ? 'Copied' : 'Embed'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(v)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
