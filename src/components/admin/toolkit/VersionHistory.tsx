import { useState, useEffect, useCallback } from 'react';
import {
  Clock, RotateCcw, Eye, Trash2, Save,
  CheckCircle2, FileText,
} from 'lucide-react';

interface Version {
  id: string;
  timestamp: number;
  title: string;
  contentLength: number;
  wordCount: number;
  label: string;
  content: string;
  excerpt: string;
}

interface VersionHistoryProps {
  postId?: string;
  title: string;
  content: string;
  excerpt: string;
  onRestore: (version: { title: string; content: string; excerpt: string }) => void;
}

const MAX_VERSIONS = 20;

function getStorageKey(postId?: string) {
  return `mayobe_versions_${postId || 'new'}`;
}

function countWords(html: string): number {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = Date.now() - ts;

  if (diff < 60 * 1000)   return 'Just now';
  if (diff < 3600 * 1000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400 * 1000) return `${Math.round(diff / 3600000)}h ago`;

  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function VersionHistory({ postId, title, content, excerpt, onRestore }: VersionHistoryProps) {
  const [versions, setVersions]         = useState<Version[]>([]);
  const [preview, setPreview]           = useState<Version | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<Version | null>(null);
  const [justSaved, setJustSaved]       = useState(false);

  // Load versions from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(getStorageKey(postId));
    if (raw) {
      try { setVersions(JSON.parse(raw)); } catch {}
    }
  }, [postId]);

  const saveVersions = useCallback((vs: Version[]) => {
    setVersions(vs);
    localStorage.setItem(getStorageKey(postId), JSON.stringify(vs));
  }, [postId]);

  const saveVersion = (label = 'Manual Save') => {
    if (!title && !content) return;

    const newVersion: Version = {
      id: `v_${Date.now()}`,
      timestamp: Date.now(),
      title,
      content,
      excerpt,
      contentLength: content.length,
      wordCount: countWords(content),
      label,
    };

    const updated = [newVersion, ...versions].slice(0, MAX_VERSIONS);
    saveVersions(updated);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const deleteVersion = (id: string) => {
    saveVersions(versions.filter(v => v.id !== id));
    if (preview?.id === id) setPreview(null);
  };

  const clearAll = () => {
    saveVersions([]);
    setPreview(null);
  };

  const restore = (version: Version) => {
    onRestore({ title: version.title, content: version.content, excerpt: version.excerpt });
    setConfirmRestore(null);
    setPreview(null);
  };

  const wordCount = countWords(content);

  return (
    <div className="flex flex-col h-full overflow-y-auto text-xs">
      {/* Current State */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-700 dark:text-gray-300 truncate">{title || 'Untitled Post'}</div>
            <div className="text-gray-400 mt-0.5">{wordCount.toLocaleString()} words · {content.length} chars</div>
          </div>
          <button
            onClick={() => saveVersion()}
            className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all shrink-0"
          >
            {justSaved ? (
              <><CheckCircle2 size={13} /> Saved!</>
            ) : (
              <><Save size={13} /> Save Version</>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
          <Clock size={13} className="text-blue-500 shrink-0" />
          <span className="text-blue-700 dark:text-blue-300">
            Versions are saved locally. Click <strong>Save Version</strong> to create a restore point.
          </span>
        </div>
      </div>

      {/* Version List */}
      <div className="flex-1 overflow-y-auto">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <Clock size={22} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="font-medium text-gray-500 dark:text-gray-400">No versions yet</p>
            <p className="text-gray-400 mt-1">Click "Save Version" to create restore points as you write</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
              <span className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {versions.length} Version{versions.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={clearAll}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {versions.map((version, i) => (
                <div
                  key={version.id}
                  className={`group px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${preview?.id === version.id ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Version number */}
                    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0 mt-0.5">
                      {versions.length - i}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">{version.title || 'Untitled'}</span>
                        {i === 0 && <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full font-medium">Latest</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-gray-400">
                        <Clock size={11} />
                        <span>{formatDate(version.timestamp)}</span>
                        <span>·</span>
                        <FileText size={11} />
                        <span>{version.wordCount} words</span>
                        <span>·</span>
                        <span>{version.label}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => setPreview(preview?.id === version.id ? null : version)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-blue-500 transition-colors"
                        title="Preview"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmRestore(version)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-violet-500 transition-colors"
                        title="Restore"
                      >
                        <RotateCcw size={13} />
                      </button>
                      <button
                        onClick={() => deleteVersion(version.id)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  {preview?.id === version.id && (
                    <div className="mt-3 ml-10">
                      <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-violet-200 dark:border-violet-800 max-h-40 overflow-y-auto">
                        <div
                          className="text-gray-700 dark:text-gray-300 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: version.content.substring(0, 2000) || '<p><em>No content</em></p>' }}
                        />
                      </div>
                      <button
                        onClick={() => setConfirmRestore(version)}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-xl transition-colors"
                      >
                        <RotateCcw size={12} /> Restore This Version
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-gray-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <RotateCcw size={22} className="text-amber-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white text-center mb-2">Restore this version?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-1">
              <strong>"{confirmRestore.title || 'Untitled'}"</strong>
            </p>
            <p className="text-gray-400 text-center text-xs mb-5">
              {formatDate(confirmRestore.timestamp)} · {confirmRestore.wordCount} words
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-3 mb-5">
              Your current content will be replaced. Save a version first if you want to preserve it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRestore(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => restore(confirmRestore)}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} /> Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
