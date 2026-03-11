import { useEffect, useState, useCallback, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Toast from '../../components/admin/Toast';
import { listMedia, deleteMedia, uploadMedia, saveExternalMedia, searchPexels, isVideo, MediaItem, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from '../../lib/mediaStorage';
import { useRole } from '../../hooks/useRole';
import {
  Image as ImageIcon, Upload, Trash2, Copy, X, Grid3x3, List,
  Search, RefreshCw, ExternalLink, HardDrive, Globe, Camera,
  Video, Film, Lock, CheckCircle2, AlertCircle, UploadCloud,
  Link as LinkIcon, ChevronDown,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'image' | 'video' | 'upload' | 'pexels' | 'url';
type UploadTab = 'upload' | 'pexels' | 'url';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  photographer: string;
  src: { large: string; medium: string };
  alt: string;
}

const SOURCE_BADGE: Record<string, { label: string; icon: any; cls: string }> = {
  upload: { label: 'Uploaded', icon: HardDrive, cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  pexels: { label: 'Pexels', icon: Camera, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  url: { label: 'External', icon: Globe, cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

function formatSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function MediaPreview({ item, className }: { item: MediaItem; className?: string }) {
  if (isVideo(item)) {
    return (
      <div className={`relative bg-black flex items-center justify-center ${className}`}>
        <Film size={24} className="text-gray-400" />
        <video
          src={item.fileUrl}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          muted
          preload="metadata"
        />
      </div>
    );
  }
  return (
    <img
      src={item.fileUrl}
      alt={item.altText || item.originalFilename}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
}

export default function MediaLibraryPage() {
  const { isCEO, isAdmin, isStaff } = useRole();
  const canUpload = isCEO || isAdmin;
  const canDelete = isCEO || isAdmin;

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addTab, setAddTab] = useState<UploadTab>('upload');
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pexelsQuery, setPexelsQuery] = useState('');
  const [pexelsPhotos, setPexelsPhotos] = useState<PexelsPhoto[]>([]);
  const [pexelsLoading, setPexelsLoading] = useState(false);
  const [pexelsError, setPexelsError] = useState('');

  const [urlInput, setUrlInput] = useState('');

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listMedia();
      setMedia(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  const filteredMedia = media.filter(item => {
    const vid = isVideo(item);
    const matchFilter =
      filter === 'all' ? true :
      filter === 'image' ? !vid :
      filter === 'video' ? vid :
      item.source === filter;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = !q ||
      item.originalFilename.toLowerCase().includes(q) ||
      (item.altText || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const handleDelete = async (item: MediaItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm(`Delete "${item.originalFilename}"? This cannot be undone.`)) return;
    setDeletingId(item.id);
    try {
      await deleteMedia(item);
      setMedia(prev => prev.filter(m => m.id !== item.id));
      if (selected?.id === item.id) setSelected(null);
      showToast('Deleted successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const copyUrl = async (url: string, id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      showToast('URL copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy URL', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    const allowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
    if (!allowed.includes(file.type)) {
      setUploadState('error');
      setUploadMsg('Unsupported file type. Use JPG, PNG, GIF, WebP, MP4, or WebM.');
      return;
    }
    const isVid = ALLOWED_VIDEO_TYPES.includes(file.type);
    const maxSize = isVid ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      setUploadState('error');
      setUploadMsg(`File too large. Max ${isVid ? '100 MB' : '10 MB'}.`);
      return;
    }
    setUploadState('uploading');
    setUploadProgress(0);
    setUploadMsg(`Uploading ${file.name}...`);
    const timer = setInterval(() => {
      setUploadProgress(p => p >= 85 ? 85 : p + 10);
    }, 300);
    try {
      const item = await uploadMedia(file);
      clearInterval(timer);
      setUploadProgress(100);
      setUploadState('done');
      setUploadMsg(`"${file.name}" uploaded successfully`);
      setMedia(prev => [item, ...prev]);
      setTimeout(() => { setShowAddPanel(false); setUploadState('idle'); setUploadProgress(0); }, 1200);
    } catch (err: any) {
      clearInterval(timer);
      setUploadState('error');
      setUploadMsg(err.message || 'Upload failed. Please try again.');
    }
  }, []);

  const handlePexelsSearch = async () => {
    if (!pexelsQuery.trim()) return;
    setPexelsLoading(true);
    setPexelsError('');
    try {
      const { photos } = await searchPexels(pexelsQuery);
      setPexelsPhotos(photos);
      if (!photos.length) setPexelsError('No photos found. Try a different search.');
    } catch {
      setPexelsError('Pexels search failed. The API key may not be configured.');
      setPexelsPhotos([]);
    } finally {
      setPexelsLoading(false);
    }
  };

  const handlePexelsSelect = async (photo: PexelsPhoto) => {
    try {
      const item = await saveExternalMedia({
        url: photo.src.large,
        filename: `pexels-${photo.id}.jpg`,
        originalFilename: photo.alt || `Photo by ${photo.photographer}`,
        fileType: 'image/jpeg',
        width: photo.width,
        height: photo.height,
        source: 'pexels',
        pexelsId: String(photo.id),
        altText: photo.alt || `Photo by ${photo.photographer}`,
      });
      setMedia(prev => [item, ...prev]);
      setShowAddPanel(false);
      showToast('Image added from Pexels', 'success');
    } catch {
      showToast('Failed to save Pexels image', 'error');
    }
  };

  const handleUrlAdd = async () => {
    if (!urlInput.trim()) return;
    try {
      const item = await saveExternalMedia({
        url: urlInput,
        filename: `url-${Date.now()}.jpg`,
        originalFilename: urlInput.split('/').pop() || 'external-image.jpg',
        source: 'url',
      });
      setMedia(prev => [item, ...prev]);
      setUrlInput('');
      setShowAddPanel(false);
      showToast('External media added', 'success');
    } catch {
      showToast('Failed to add external URL', 'error');
    }
  };

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: `All (${media.length})` },
    { key: 'image', label: `Images (${media.filter(m => !isVideo(m)).length})` },
    { key: 'video', label: `Videos (${media.filter(m => isVideo(m)).length})` },
  ];

  const addTabs: { key: UploadTab; label: string; icon: any }[] = [
    { key: 'upload', label: 'Upload', icon: UploadCloud },
    { key: 'pexels', label: 'Pexels', icon: Camera },
    { key: 'url', label: 'URL', icon: LinkIcon },
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Media Library</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {media.length} {media.length === 1 ? 'file' : 'files'}
              {isStaff && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Lock size={12} />
                  View & copy only
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadMedia}
              disabled={loading}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
            {canUpload && (
              <button
                onClick={() => setShowAddPanel(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Upload size={16} />
                Add Media
              </button>
            )}
          </div>
        </div>

        {/* Staff notice */}
        {isStaff && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
            <Lock size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-300">View-only access</p>
              <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                You can browse media, copy URLs, and embed them in your posts. Only Admins and the CEO can upload or delete media.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
            <X size={16} className="flex-shrink-0" />
            {error}
            <button onClick={loadMedia} className="ml-auto underline text-xs">Retry</button>
          </div>
        )}

        {/* Filters + controls */}
        <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by filename..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {filterOptions.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    filter === f.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <Grid3x3 size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Media grid / list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <RefreshCw size={36} className="animate-spin mb-3" />
            <p className="text-sm">Loading media...</p>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500">
            <ImageIcon size={48} className="mb-3 opacity-30" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">
              {searchQuery || filter !== 'all' ? 'No results' : 'No media yet'}
            </p>
            <p className="text-sm mt-1">
              {searchQuery || filter !== 'all' ? 'Try a different search or filter' : canUpload ? 'Upload your first file' : 'No files have been uploaded yet'}
            </p>
            {canUpload && !searchQuery && filter === 'all' && (
              <button
                onClick={() => setShowAddPanel(true)}
                className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <Upload size={15} />Add Media
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredMedia.map(item => {
              const src = SOURCE_BADGE[item.source] || SOURCE_BADGE.url;
              const SrcIcon = src.icon;
              const deleting = deletingId === item.id;
              const vid = isVideo(item);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  <MediaPreview item={item} className="w-full h-full" />
                  <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-colors flex flex-col justify-between p-2 ${deleting ? 'bg-black/60' : ''}`}>
                    {deleting && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <RefreshCw size={22} className="text-white animate-spin" />
                      </div>
                    )}
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => copyUrl(item.fileUrl, item.id, e)}
                        className="p-1.5 bg-white/90 text-gray-800 rounded-lg hover:bg-white transition-colors"
                        title="Copy URL"
                      >
                        <Copy size={13} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={e => handleDelete(item, e)}
                          className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <p className="text-white text-[11px] truncate font-medium opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                      {item.originalFilename}
                    </p>
                  </div>
                  <div className={`absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${src.cls}`}>
                    <SrcIcon size={9} />
                  </div>
                  {vid && (
                    <div className="absolute bottom-1.5 right-1.5 p-1 bg-black/60 rounded-md">
                      <Video size={10} className="text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 dark:border-gray-700">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Preview</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">File</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden md:table-cell">Size</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden lg:table-cell">Source</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden lg:table-cell">Added</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredMedia.map(item => {
                  const src = SOURCE_BADGE[item.source] || SOURCE_BADGE.url;
                  const SrcIcon = src.icon;
                  const vid = isVideo(item);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelected(item)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 flex-shrink-0">
                          <MediaPreview item={item} className="w-full h-full" />
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {vid && <Video size={13} className="text-gray-400 flex-shrink-0" />}
                          <p className="font-semibold text-gray-900 dark:text-white truncate text-xs">{item.originalFilename}</p>
                        </div>
                        {item.altText && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.altText}</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500 dark:text-gray-400">{formatSize(item.fileSize)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${src.cls}`}>
                          <SrcIcon size={10} />{src.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => copyUrl(item.fileUrl, item.id, e)}
                            className={`p-2 rounded-lg transition-colors ${copiedId === item.id ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                            title="Copy URL"
                          >
                            <Copy size={14} />
                          </button>
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Open"
                          >
                            <ExternalLink size={14} />
                          </a>
                          {canDelete && (
                            <button
                              onClick={e => handleDelete(item, e)}
                              disabled={deletingId === item.id}
                              className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === item.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">File Details</h2>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center max-h-56">
                {isVideo(selected) ? (
                  <video src={selected.fileUrl} controls className="max-h-56 max-w-full" />
                ) : (
                  <img src={selected.fileUrl} alt={selected.altText || selected.originalFilename} className="max-h-56 max-w-full object-contain" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Filename</p>
                  <p className="font-medium text-gray-900 dark:text-white text-xs truncate">{selected.originalFilename}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Type</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{isVideo(selected) ? 'Video' : 'Image'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Source</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${(SOURCE_BADGE[selected.source] || SOURCE_BADGE.url).cls}`}>
                    {(SOURCE_BADGE[selected.source] || SOURCE_BADGE.url).label}
                  </span>
                </div>
                {selected.fileSize > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Size</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">{formatSize(selected.fileSize)}</p>
                  </div>
                )}
                {(selected.width > 0 || selected.height > 0) && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Dimensions</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">{selected.width} × {selected.height}px</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Added</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{formatDate(selected.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">URL</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={selected.fileUrl}
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  />
                  <button
                    onClick={() => copyUrl(selected.fileUrl, selected.id)}
                    className={`px-3 py-2 rounded-xl transition-colors text-sm ${copiedId === selected.id ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    <Copy size={14} />
                  </button>
                  <a
                    href={selected.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {isStaff && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-400">
                  Copy this URL and paste it into the featured image field or embed it in your post content.
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              {canDelete ? (
                <button
                  onClick={() => handleDelete(selected)}
                  disabled={deletingId === selected.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />Delete
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <Lock size={12} />No delete access
                </div>
              )}
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Media Panel (CEO/Admin only) */}
      {showAddPanel && canUpload && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddPanel(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">Add Media</h2>
              <button onClick={() => setShowAddPanel(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
              {addTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setAddTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      addTab === tab.key
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon size={15} />{tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {addTab === 'upload' && (
                <div>
                  <div
                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => uploadState !== 'uploading' && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                      dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : uploadState === 'done' ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
                      : uploadState === 'error' ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    />
                    {uploadState === 'uploading' && (
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw size={44} className="text-blue-600 animate-spin" />
                        <p className="font-semibold text-blue-700 dark:text-blue-400">{uploadMsg}</p>
                        <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                    {uploadState === 'done' && (
                      <div className="flex flex-col items-center gap-3">
                        <CheckCircle2 size={44} className="text-green-600" />
                        <p className="font-semibold text-green-700 dark:text-green-400">{uploadMsg}</p>
                      </div>
                    )}
                    {uploadState === 'error' && (
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle size={44} className="text-red-500" />
                        <p className="font-semibold text-red-600 dark:text-red-400">{uploadMsg}</p>
                        <p className="text-xs text-gray-500">Click to try again</p>
                      </div>
                    )}
                    {uploadState === 'idle' && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <UploadCloud size={30} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Drop a file or click to browse</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Images: JPG, PNG, GIF, WebP up to 10 MB
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Videos: MP4, WebM, OGG up to 100 MB
                          </p>
                        </div>
                        <div className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                          Choose File
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-center text-gray-400 mt-3">
                    Uploaded files are hosted on your domain and generate a permanent public URL.
                  </p>
                </div>
              )}

              {addTab === 'pexels' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={pexelsQuery}
                        onChange={e => setPexelsQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handlePexelsSearch()}
                        placeholder="Search free photos..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handlePexelsSearch}
                      disabled={pexelsLoading || !pexelsQuery.trim()}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {pexelsLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                      Search
                    </button>
                  </div>
                  {pexelsError && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                      <AlertCircle size={14} className="flex-shrink-0" />{pexelsError}
                    </div>
                  )}
                  {pexelsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw size={32} className="animate-spin text-blue-600" />
                    </div>
                  )}
                  {!pexelsLoading && pexelsPhotos.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {pexelsPhotos.map(photo => (
                        <button
                          key={photo.id}
                          onClick={() => handlePexelsSelect(photo)}
                          className="relative aspect-square rounded-xl overflow-hidden group hover:ring-4 hover:ring-blue-500 transition-all"
                        >
                          <img src={photo.src.medium} alt={photo.alt} className="w-full h-full object-cover" loading="lazy" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                            <p className="w-full px-2 py-1 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity truncate">
                              by {photo.photographer}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {!pexelsLoading && !pexelsPhotos.length && !pexelsError && (
                    <div className="text-center py-12 text-gray-400">
                      <Camera size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">Search for free stock photos</p>
                      <p className="text-xs mt-1">Powered by Pexels</p>
                    </div>
                  )}
                </div>
              )}

              {addTab === 'url' && (
                <div className="space-y-4 max-w-xl mx-auto py-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Image or Video URL</label>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {urlInput && (
                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 max-h-52 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                      <img
                        src={urlInput}
                        alt="Preview"
                        className="max-h-52 max-w-full object-contain"
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                  <button
                    onClick={handleUrlAdd}
                    disabled={!urlInput.trim()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Add to Library
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
