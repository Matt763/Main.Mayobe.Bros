import { useState } from 'react';
import {
  Image as ImageIcon, Wand2, Layers, Upload, Link2, Loader2,
  AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Plus, X, Sparkles, Key,
} from 'lucide-react';

type Mode = 'generate' | 'transform' | 'bulk';

interface GeneratedImage {
  url: string;
  prompt: string;
  headingTitle?: string;
  uploadError?: string;
}

interface AIImageGeneratorProps {
  content: string;
  onInsertContent: (html: string, replace?: boolean) => void;
  onSetFeaturedImage: (url: string) => void;
}

export default function AIImageGenerator({
  content,
  onInsertContent,
  onSetFeaturedImage,
}: AIImageGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('generate');

  // ── Gemini API Key ─────────────────────────────────────────────────────────
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyDraft, setKeyDraft] = useState(() => localStorage.getItem('gemini_api_key') || '');

  const saveGeminiKey = () => {
    localStorage.setItem('gemini_api_key', keyDraft);
    setGeminiKey(keyDraft);
    setShowKeyInput(false);
  };

  // ── Text-to-Image ──────────────────────────────────────────────────────────
  const [genPrompt, setGenPrompt] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<{ base64: string; mimeType: string; url?: string } | null>(null);
  const [genUploading, setGenUploading] = useState(false);
  const [genUploadedUrl, setGenUploadedUrl] = useState<string | null>(null);

  // ── Transform ─────────────────────────────────────────────────────────────
  const [transformUrl, setTransformUrl] = useState('');
  const [transformRules, setTransformRules] = useState('');
  const [transformLoading, setTransformLoading] = useState(false);
  const [transformError, setTransformError] = useState<string | null>(null);
  const [transformResult, setTransformResult] = useState<{ base64: string; mimeType: string; url?: string } | null>(null);
  const [transformUploading, setTransformUploading] = useState(false);
  const [transformUploadedUrl, setTransformUploadedUrl] = useState<string | null>(null);

  // ── Bulk ──────────────────────────────────────────────────────────────────
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResults, setBulkResults] = useState<GeneratedImage[]>([]);
  const [bulkInserted, setBulkInserted] = useState(false);

  // ── Upload helper ──────────────────────────────────────────────────────────
  const uploadBase64 = async (base64: string, mimeType: string, label = 'ai-image'): Promise<string> => {
    const res = await fetch('/api/images/upload-base64', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ base64, mimeType, label }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url as string;
  };

  // ── Extract H2 headings from content ──────────────────────────────────────
  const extractH2Headings = (): string[] => {
    const matches = [...content.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
    return matches.map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  };

  // ── Generate image ─────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    if (!geminiKey) { setShowKeyInput(true); setGenError('Gemini API key required. Click the key icon to add it.'); return; }
    setGenLoading(true);
    setGenError(null);
    setGenResult(null);
    setGenUploadedUrl(null);
    try {
      const res = await fetch('/api/editor-ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: genPrompt, geminiApiKey: geminiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setGenResult({ base64: data.imageBase64, mimeType: data.mimeType });
    } catch (err: any) {
      setGenError(err.message);
    } finally {
      setGenLoading(false);
    }
  };

  const handleUploadGen = async (target: 'insert' | 'featured') => {
    if (!genResult) return;
    setGenUploading(true);
    try {
      const url = await uploadBase64(genResult.base64, genResult.mimeType, 'ai-gen');
      setGenUploadedUrl(url);
      setGenResult(prev => prev ? { ...prev, url } : prev);
      if (target === 'insert') {
        onInsertContent(`<img src="${url}" alt="${genPrompt.slice(0, 80)}" class="max-w-full h-auto rounded-xl my-4" />`);
      } else {
        onSetFeaturedImage(url);
      }
    } catch (err: any) {
      setGenError(err.message);
    } finally {
      setGenUploading(false);
    }
  };

  // ── Transform image ────────────────────────────────────────────────────────
  const handleTransform = async () => {
    if (!transformUrl.trim()) return;
    if (!geminiKey) { setShowKeyInput(true); setTransformError('Gemini API key required. Click the key icon to add it.'); return; }
    setTransformLoading(true);
    setTransformError(null);
    setTransformResult(null);
    setTransformUploadedUrl(null);
    try {
      const res = await fetch('/api/editor-ai/transform-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Server expects 'instructions' not 'rules'
        body: JSON.stringify({ imageUrl: transformUrl, instructions: transformRules, geminiApiKey: geminiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transform failed');
      setTransformResult({ base64: data.imageBase64, mimeType: data.mimeType });
    } catch (err: any) {
      setTransformError(err.message);
    } finally {
      setTransformLoading(false);
    }
  };

  const handleUploadTransform = async (target: 'insert' | 'featured') => {
    if (!transformResult) return;
    setTransformUploading(true);
    try {
      const url = await uploadBase64(transformResult.base64, transformResult.mimeType, 'ai-transform');
      setTransformUploadedUrl(url);
      setTransformResult(prev => prev ? { ...prev, url } : prev);
      if (target === 'insert') {
        onInsertContent(`<img src="${url}" alt="AI transformed image" class="max-w-full h-auto rounded-xl my-4" />`);
      } else {
        onSetFeaturedImage(url);
      }
    } catch (err: any) {
      setTransformError(err.message);
    } finally {
      setTransformUploading(false);
    }
  };

  // ── Bulk generation ────────────────────────────────────────────────────────
  const handleBulkGenerate = async () => {
    const headings = extractH2Headings();
    if (headings.length === 0) {
      setBulkError('No H2 headings found in your article. Add H2 sections first.');
      return;
    }
    setBulkLoading(true);
    setBulkError(null);
    setBulkResults([]);
    setBulkInserted(false);
    try {
      if (!geminiKey) { setBulkError('Gemini API key required. Click the key icon to add it.'); setBulkLoading(false); return; }
      const res = await fetch('/api/editor-ai/bulk-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headings, geminiApiKey: geminiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk generation failed');

      // Upload each image to media library
      const uploaded: GeneratedImage[] = [];
      for (const img of data.images || []) {
        if (!img.imageBase64) {
          uploaded.push({ url: '', prompt: img.prompt || '', headingTitle: img.heading, uploadError: 'No image data returned' });
          continue;
        }
        try {
          const url = await uploadBase64(img.imageBase64, img.mimeType || 'image/png', 'ai-bulk');
          uploaded.push({ url, prompt: img.prompt || '', headingTitle: img.heading });
        } catch (uploadErr: any) {
          uploaded.push({ url: '', prompt: img.prompt || '', headingTitle: img.heading, uploadError: uploadErr?.message || 'Upload failed' });
        }
      }
      setBulkResults(uploaded);
    } catch (err: any) {
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const insertBulkImages = () => {
    if (!bulkResults.length) return;
    // Use DOMParser to find each H2 by plain-text content, then prepend the image.
    // This handles H2s that contain nested tags like <strong>, <em>, <span>.
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div id="__root__">${content}</div>`, 'text/html');
      const root = doc.getElementById('__root__')!;
      const h2s = Array.from(root.querySelectorAll('h2'));
      const applied = new Set<string>();

      for (const img of bulkResults) {
        if (!img.url || !img.headingTitle) continue;
        const targetText = img.headingTitle.trim().toLowerCase();
        if (applied.has(targetText)) continue;

        const matchingH2 = h2s.find(h =>
          (h.textContent || '').trim().toLowerCase() === targetText
        );
        if (!matchingH2) continue;

        const imgEl = doc.createElement('img');
        imgEl.src = img.url;
        imgEl.alt = img.headingTitle.slice(0, 80);
        imgEl.className = 'max-w-full h-auto rounded-xl my-6 w-full object-cover';
        imgEl.style.aspectRatio = '16/9';

        matchingH2.parentNode?.insertBefore(imgEl, matchingH2);
        applied.add(targetText);
      }

      onInsertContent(root.innerHTML, true);
    } catch {
      // Fallback: attempt simple string-based insert if DOM approach fails
      let updatedContent = content;
      for (const img of bulkResults) {
        if (!img.url || !img.headingTitle) continue;
        const escaped = img.headingTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(<h2[^>]*>[\\s\\S]*?${escaped}[\\s\\S]*?<\\/h2>)`, 'i');
        const imgHtml = `<img src="${img.url}" alt="${img.headingTitle.slice(0, 80)}" class="max-w-full h-auto rounded-xl my-6 w-full object-cover" style="aspect-ratio:16/9" />\n`;
        updatedContent = updatedContent.replace(regex, imgHtml + '$1');
      }
      onInsertContent(updatedContent, true);
    }
    setBulkInserted(true);
  };

  const headingCount = extractH2Headings().length;

  return (
    <div className="bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-xl border border-purple-100 dark:border-purple-900/50 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md shadow-purple-200 dark:shadow-purple-900/30">
            <ImageIcon size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">AI Image Generator</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gemini Imagen 3 · 8K UHD · 16:9 · Canon EOS R5</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowKeyInput(!showKeyInput); }}
            className="p-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
            title="Configure Gemini API key"
          >
            <Key size={14} className={geminiKey ? 'text-green-500' : 'text-gray-400'} />
          </button>
          {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>

      {/* Gemini key panel */}
      {showKeyInput && (
        <div className="px-4 pb-4 border-t border-purple-100 dark:border-gray-700 pt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Gemini API key — stored in your browser only. Get one at <span className="text-purple-600">aistudio.google.com</span></p>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={saveGeminiKey}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
            >Save</button>
            <button type="button" onClick={() => setShowKeyInput(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X size={14} className="text-gray-500" />
            </button>
          </div>
          {geminiKey && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1.5">Key saved: AIzaSy...{geminiKey.slice(-4)}</p>
          )}
        </div>
      )}

      {isOpen && (
        <div className="border-t border-purple-100 dark:border-gray-700">
          {/* Mode tabs */}
          <div className="flex border-b border-purple-100 dark:border-gray-700">
            {([
              { id: 'generate', label: 'Text to Image', icon: Wand2 },
              { id: 'transform', label: 'Transform', icon: Sparkles },
              { id: 'bulk', label: `Bulk (${headingCount} H2s)`, icon: Layers },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                  mode === id
                    ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-400 border-b-2 border-purple-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={12} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* ── TEXT TO IMAGE MODE ── */}
          {mode === 'generate' && (
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Describe the image
                </label>
                <textarea
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  placeholder="e.g. A professional business meeting with laptops and a whiteboard showing charts…"
                  rows={3}
                  className="w-full px-3 py-2.5 text-xs border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">Image style auto-applied: 8K UHD, Canon EOS R5, 16:9, no AI smoothing.</p>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={genLoading || !genPrompt.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 shadow-md"
              >
                {genLoading ? <><Loader2 size={15} className="animate-spin" /> Generating image…</> : <><Wand2 size={15} /> Generate Image</>}
              </button>

              {genError && <ErrorBox message={genError} />}

              {genResult && (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border border-purple-100 dark:border-purple-900">
                    <img
                      src={genResult.url || `data:${genResult.mimeType};base64,${genResult.base64}`}
                      alt={genPrompt}
                      className="w-full h-48 object-cover"
                    />
                  </div>

                  {genUploadedUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                        <p className="text-xs text-green-700 dark:text-green-400 font-medium truncate">{genUploadedUrl}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { onInsertContent(`<img src="${genUploadedUrl}" alt="${genPrompt.slice(0, 80)}" class="max-w-full h-auto rounded-xl my-4" />`); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors"
                        >
                          <Plus size={12} /> Insert in Post
                        </button>
                        <button
                          type="button"
                          onClick={() => onSetFeaturedImage(genUploadedUrl)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 rounded-xl text-xs font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        >
                          <ImageIcon size={12} /> Set as Featured
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUploadGen('insert')}
                        disabled={genUploading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {genUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        Upload & Insert
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUploadGen('featured')}
                        disabled={genUploading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 rounded-xl text-xs font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
                      >
                        {genUploading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                        Set as Featured
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TRANSFORM MODE ── */}
          {mode === 'transform' && (
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5 block">
                  <Link2 size={12} /> Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={transformUrl}
                    onChange={(e) => setTransformUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {transformUrl && (
                    <button type="button" onClick={() => setTransformUrl('')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <X size={14} className="text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              {transformUrl && (
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <img src={transformUrl} alt="Source" className="w-full h-36 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Transformation instructions
                </label>
                <textarea
                  value={transformRules}
                  onChange={(e) => setTransformRules(e.target.value)}
                  placeholder="e.g. Add a dark overlay with white headline text 'Top 10 Ways to Save Money', make it look like a magazine cover…"
                  rows={3}
                  className="w-full px-3 py-2.5 text-xs border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <button
                type="button"
                onClick={handleTransform}
                disabled={transformLoading || !transformUrl.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 shadow-md"
              >
                {transformLoading ? <><Loader2 size={15} className="animate-spin" /> Transforming…</> : <><Sparkles size={15} /> Transform Image</>}
              </button>

              {transformError && <ErrorBox message={transformError} />}

              {transformResult && (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border border-fuchsia-100 dark:border-fuchsia-900">
                    <img
                      src={transformResult.url || `data:${transformResult.mimeType};base64,${transformResult.base64}`}
                      alt="Transformed"
                      className="w-full h-48 object-cover"
                    />
                  </div>

                  {transformUploadedUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                        <p className="text-xs text-green-700 dark:text-green-400 font-medium truncate">{transformUploadedUrl}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { onInsertContent(`<img src="${transformUploadedUrl}" alt="Transformed image" class="max-w-full h-auto rounded-xl my-4" />`); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-semibold transition-colors"
                        >
                          <Plus size={12} /> Insert in Post
                        </button>
                        <button
                          type="button"
                          onClick={() => onSetFeaturedImage(transformUploadedUrl)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-fuchsia-300 dark:border-fuchsia-700 text-fuchsia-700 dark:text-fuchsia-400 rounded-xl text-xs font-semibold hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 transition-colors"
                        >
                          <ImageIcon size={12} /> Set as Featured
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUploadTransform('insert')}
                        disabled={transformUploading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {transformUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        Upload & Insert
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUploadTransform('featured')}
                        disabled={transformUploading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-fuchsia-300 dark:border-fuchsia-700 text-fuchsia-700 dark:text-fuchsia-400 rounded-xl text-xs font-semibold hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 transition-colors disabled:opacity-50"
                      >
                        {transformUploading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                        Set as Featured
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── BULK MODE ── */}
          {mode === 'bulk' && (
            <div className="p-4 space-y-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl">
                <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                  Generates one image per H2 heading and inserts each image before its corresponding section. Found <strong>{headingCount}</strong> H2 heading{headingCount !== 1 ? 's' : ''} in your article.
                </p>
              </div>

              {headingCount > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 max-h-40 overflow-y-auto">
                  {extractH2Headings().map((h, i) => (
                    <div key={i} className="px-3 py-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{h}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleBulkGenerate}
                disabled={bulkLoading || headingCount === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 shadow-md"
              >
                {bulkLoading
                  ? <><Loader2 size={15} className="animate-spin" /> Generating {headingCount} images…</>
                  : <><Layers size={15} /> Generate {headingCount} Images</>
                }
              </button>

              {bulkError && <ErrorBox message={bulkError} />}

              {bulkResults.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {bulkResults.map((img, i) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-purple-100 dark:border-purple-900">
                        {img.url ? (
                          <img src={img.url} alt={img.headingTitle || img.prompt} className="w-full h-24 object-cover" />
                        ) : (
                          <div className="w-full h-24 bg-red-50 dark:bg-red-900/20 flex flex-col items-center justify-center gap-1 px-2">
                            <AlertCircle size={14} className="text-red-400 shrink-0" />
                            <span className="text-[10px] text-red-500 dark:text-red-400 text-center leading-tight">{img.uploadError || 'Upload failed'}</span>
                          </div>
                        )}
                        <p className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 truncate">{img.headingTitle}</p>
                      </div>
                    ))}
                  </div>

                  {bulkInserted ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium">All images inserted into the article.</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={insertBulkImages}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-colors"
                    >
                      <Plus size={15} /> Insert All Images into Article
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
      <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
      <p className="text-xs text-red-700 dark:text-red-400">{message}</p>
    </div>
  );
}
