import { useState, useRef } from 'react';
import {
  Upload, Play, Pause, FileVideo, FileAudio, Loader2,
  FileText, PlusCircle, X, Volume2, Clock,
} from 'lucide-react';

interface MediaPanelProps {
  title: string;
  onInsertContent: (html: string) => void;
}

interface MediaFile {
  name: string;
  type: 'video' | 'audio';
  url: string;
  size: number;
}

export default function MediaPanel({ title, onInsertContent }: MediaPanelProps) {
  const [mediaFile, setMediaFile]     = useState<MediaFile | null>(null);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading]         = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [error, setError]             = useState<string | null>(null);
  const [dragOver, setDragOver]       = useState(false);
  const fileRef                       = useRef<HTMLInputElement>(null);
  const playerRef                     = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  const loadFile = (file: File) => {
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    if (!isVideo && !isAudio) {
      setError('Please upload a video or audio file.');
      return;
    }
    const url = URL.createObjectURL(file);
    setMediaFile({
      name: file.name,
      type: isVideo ? 'video' : 'audio',
      url,
      size: file.size,
    });
    setTranscript('');
    setError(null);
    // Pre-fill description from title
    if (title) setDescription(`This ${isVideo ? 'video' : 'audio'} is about: ${title}`);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const togglePlay = () => {
    const el = playerRef.current;
    if (!el) return;
    if (isPlaying) { el.pause(); setIsPlaying(false); }
    else           { el.play();  setIsPlaying(true);  }
  };

  const generateTranscript = async () => {
    if (!mediaFile) return;
    setLoading(true);
    setError(null);
    setTranscript('');
    try {
      const res = await fetch('/api/editor-ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: mediaFile.name,
          description: description || `${mediaFile.type} file: ${mediaFile.name}`,
          mediaType: mediaFile.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transcription failed');
      setTranscript(data.transcript || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto text-xs">
      {/* Upload area */}
      {!mediaFile ? (
        <div className="p-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-600'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                <Upload size={24} className="text-violet-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Drop a video or audio file</p>
                <p className="text-gray-400 mt-1">MP4, WebM, MOV, MP3, WAV, OGG</p>
                <p className="text-gray-400">or click to browse</p>
              </div>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="video/*,audio/*"
            onChange={onFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <>
          {/* File info */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                {mediaFile.type === 'video' ? (
                  <FileVideo size={18} className="text-violet-500" />
                ) : (
                  <FileAudio size={18} className="text-violet-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-700 dark:text-gray-300 truncate">{mediaFile.name}</div>
                <div className="text-gray-400">{formatSize(mediaFile.size)} · {mediaFile.type}</div>
              </div>
              <button
                onClick={() => { setMediaFile(null); setTranscript(''); if (mediaFile.url) URL.revokeObjectURL(mediaFile.url); }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Player */}
            {mediaFile.type === 'video' ? (
              <video
                ref={el => { playerRef.current = el; }}
                src={mediaFile.url}
                controls
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full rounded-xl max-h-40 bg-black"
              />
            ) : (
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white transition-colors shrink-0"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Volume2 size={12} />
                    <span className="truncate">{mediaFile.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 mt-0.5">
                    <Clock size={11} />
                    <span>Audio file</span>
                  </div>
                </div>
                <audio
                  ref={el => { playerRef.current = el; }}
                  src={mediaFile.url}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Insert media into post */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h4 className="font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2.5">Insert into Post</h4>
            <div className="space-y-2">
              {mediaFile.type === 'video' && (
                <button
                  onClick={() => onInsertContent(`<div style="margin:1.5rem 0"><video class="js-plyr" controls playsinline style="width:100%;border-radius:12px;max-height:480px"><source src="${mediaFile.url}"></video></div><p></p>`)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <FileVideo size={13} /> Insert Video Player
                </button>
              )}
              {mediaFile.type === 'audio' && (
                <button
                  onClick={() => onInsertContent(`<div style="margin:1.5rem 0;padding:1rem;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0"><audio controls style="width:100%"><source src="${mediaFile.url}"></audio><p style="margin-top:0.5rem;font-size:0.875rem;color:#64748b">${mediaFile.name}</p></div><p></p>`)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl text-purple-700 dark:text-purple-300 font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                  <FileAudio size={13} /> Insert Audio Player
                </button>
              )}
            </div>
          </div>

          {/* AI Content Generator */}
          <div className="p-4 space-y-3">
            <h4 className="font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={12} /> AI Content from Media
            </h4>

            <div>
              <label className="block text-gray-500 dark:text-gray-400 mb-1.5">Describe the content (helps AI generate better text):</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder={`What is this ${mediaFile.type} about? Key topics, speakers, main points…`}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={generateTranscript}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><FileText size={14} /> Generate Article Content</>}
            </button>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {transcript && (
              <div className="rounded-xl border border-violet-200 dark:border-violet-800 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-violet-50 dark:bg-violet-900/20">
                  <span className="font-semibold text-violet-700 dark:text-violet-300">Generated Content</span>
                </div>
                <div
                  className="p-3 text-gray-700 dark:text-gray-300 leading-relaxed max-h-48 overflow-y-auto bg-white dark:bg-gray-900"
                  dangerouslySetInnerHTML={{ __html: transcript }}
                />
                <div className="flex gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => { onInsertContent(transcript); setTranscript(''); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-lg transition-colors"
                  >
                    <PlusCircle size={13} /> Insert into Post
                  </button>
                  <button
                    onClick={() => setTranscript('')}
                    className="px-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Upload another */}
      {mediaFile && (
        <div className="px-4 pb-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 border border-dashed border-gray-200 dark:border-gray-700 hover:border-violet-400 py-2 rounded-xl transition-all"
          >
            <Upload size={13} /> Upload Different File
          </button>
          <input ref={fileRef} type="file" accept="video/*,audio/*" onChange={onFileChange} className="hidden" />
        </div>
      )}
    </div>
  );
}
