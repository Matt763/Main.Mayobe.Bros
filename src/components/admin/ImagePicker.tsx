import { useState, useRef, useCallback } from 'react';
import {
  X, Search, Upload, Link as LinkIcon, Image as ImageIcon,
  Loader, CheckCircle2, AlertCircle, UploadCloud,
} from 'lucide-react';
import { uploadMedia, saveExternalMedia, searchPexels } from '../../lib/mediaStorage';

interface ImagePickerProps {
  onSelect: (imageUrl: string, imageData?: any) => void;
  onClose: () => void;
}

type Tab = 'pexels' | 'upload' | 'url';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  photographer: string;
  src: { large: string; medium: string; original: string };
  alt: string;
}

export default function ImagePicker({ onSelect, onClose }: ImagePickerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [searchQuery, setSearchQuery] = useState('');
  const [pexelsPhotos, setPexelsPhotos] = useState<PexelsPhoto[]>([]);
  const [pexelsLoading, setPexelsLoading] = useState(false);
  const [pexelsError, setPexelsError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [urlPreview, setUrlPreview] = useState('');
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setPexelsLoading(true);
    setPexelsError('');
    try {
      const { photos } = await searchPexels(searchQuery);
      setPexelsPhotos(photos);
      if (photos.length === 0) setPexelsError('No photos found. Try a different search term.');
    } catch {
      setPexelsError('Search failed. The Pexels API key may not be configured yet.');
      setPexelsPhotos([]);
    } finally {
      setPexelsLoading(false);
    }
  };

  const handlePexelsSelect = async (photo: PexelsPhoto) => {
    try {
      const saved = await saveExternalMedia({
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
      onSelect(saved.fileUrl, saved);
    } catch {
      onSelect(photo.src.large, photo);
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadState('error');
      setUploadMsg('Invalid file type. Use JPG, PNG, GIF or WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadState('error');
      setUploadMsg('File is too large. Maximum size is 10 MB.');
      return;
    }

    setUploadState('uploading');
    setUploadMsg(`Uploading ${file.name}...`);
    try {
      const item = await uploadMedia(file);
      setUploadState('done');
      setUploadMsg(`"${file.name}" uploaded successfully`);
      setTimeout(() => onSelect(item.fileUrl, item), 800);
    } catch (err: any) {
      setUploadState('error');
      setUploadMsg(err.message || 'Upload failed. Please try again.');
    }
  }, [onSelect]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleUrlInsert = async () => {
    if (!imageUrl.trim()) return;
    try {
      const saved = await saveExternalMedia({
        url: imageUrl,
        filename: `url-${Date.now()}.jpg`,
        originalFilename: imageUrl.split('/').pop() || 'external-image.jpg',
        source: 'url',
      });
      onSelect(saved.fileUrl, saved);
    } catch {
      onSelect(imageUrl);
    }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'pexels', label: 'Pexels', icon: ImageIcon },
    { key: 'url', label: 'URL', icon: LinkIcon },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Insert Image</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => uploadState !== 'uploading' && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : uploadState === 'done'
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
                    : uploadState === 'error'
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />

                {uploadState === 'uploading' && (
                  <div className="flex flex-col items-center gap-3">
                    <Loader size={48} className="text-blue-600 animate-spin" />
                    <p className="text-blue-700 dark:text-blue-400 font-semibold">{uploadMsg}</p>
                  </div>
                )}
                {uploadState === 'done' && (
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle2 size={48} className="text-green-600" />
                    <p className="text-green-700 dark:text-green-400 font-semibold">{uploadMsg}</p>
                  </div>
                )}
                {uploadState === 'error' && (
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle size={48} className="text-red-500" />
                    <p className="text-red-600 dark:text-red-400 font-semibold">{uploadMsg}</p>
                    <p className="text-sm text-gray-500">Click to try again</p>
                  </div>
                )}
                {uploadState === 'idle' && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <UploadCloud size={32} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        Drop an image here or click to browse
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        JPG, PNG, GIF, WebP — up to 10 MB
                      </p>
                    </div>
                    <div className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                      Choose File
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pexels' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Search free photos on Pexels..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={pexelsLoading || !searchQuery.trim()}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {pexelsLoading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
                  Search
                </button>
              </div>

              {pexelsLoading && (
                <div className="flex items-center justify-center py-16">
                  <Loader size={40} className="animate-spin text-blue-600" />
                </div>
              )}

              {pexelsError && !pexelsLoading && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">{pexelsError}</p>
                </div>
              )}

              {!pexelsLoading && pexelsPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {pexelsPhotos.map(photo => (
                    <button
                      key={photo.id}
                      onClick={() => handlePexelsSelect(photo)}
                      className="relative aspect-square rounded-xl overflow-hidden group hover:ring-4 hover:ring-blue-500 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500"
                    >
                      <img
                        src={photo.src.medium}
                        alt={photo.alt || `Photo by ${photo.photographer}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                        <p className="w-full px-2 py-1.5 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity truncate">
                          by {photo.photographer}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!pexelsLoading && pexelsPhotos.length === 0 && !pexelsError && (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                  <ImageIcon size={48} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Search for free stock photos</p>
                  <p className="text-sm mt-1">Powered by Pexels</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4 max-w-2xl mx-auto py-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => { setImageUrl(e.target.value); setUrlPreview(e.target.value); }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {urlPreview && (
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 max-h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                  <img
                    src={urlPreview}
                    alt="Preview"
                    className="max-h-64 max-w-full object-contain"
                    onError={() => setUrlPreview('')}
                  />
                </div>
              )}

              <button
                onClick={handleUrlInsert}
                disabled={!imageUrl.trim()}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Insert Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
