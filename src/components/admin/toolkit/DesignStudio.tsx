import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Type, Download, Image as ImageIcon, Trash2,
  Bold, Italic, AlignCenter, AlignLeft, AlignRight,
  Plus, Minus, RotateCcw, ChevronDown, ChevronUp,
  Palette, Move,
} from 'lucide-react';

interface DesignStudioProps {
  onExportImage: (dataUrl: string) => void;
}

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  shadow: boolean;
  opacity: number;
}

const PRESETS = [
  { name: 'Blog Header',    width: 1200, height: 630 },
  { name: 'Featured Image', width: 1200, height: 628 },
  { name: 'Thumbnail',      width: 320,  height: 180 },
  { name: 'Square Post',    width: 1080, height: 1080 },
  { name: 'Portrait',       width: 1080, height: 1350 },
];

const FONTS = ['Arial', 'Georgia', 'Impact', 'Montserrat', 'Playfair Display', 'Roboto', 'Oswald'];

const GRADIENTS = [
  { name: 'Ocean',    stops: ['#1e3a8a', '#3b82f6'] },
  { name: 'Sunset',  stops: ['#7c3aed', '#f59e0b'] },
  { name: 'Forest',  stops: ['#064e3b', '#10b981'] },
  { name: 'Fire',    stops: ['#dc2626', '#f97316'] },
  { name: 'Night',   stops: ['#1e293b', '#334155'] },
  { name: 'Rose',    stops: ['#be185d', '#f43f5e'] },
  { name: 'Sky',     stops: ['#0284c7', '#38bdf8'] },
  { name: 'Lime',    stops: ['#365314', '#84cc16'] },
];

const SOLID_COLORS = [
  '#1e293b','#0f172a','#1e3a5f','#1d4ed8','#7c3aed','#be185d',
  '#b91c1c','#92400e','#065f46','#ffffff','#f8fafc','#e2e8f0',
];

export default function DesignStudio({ onExportImage }: DesignStudioProps) {
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const previewRef       = useRef<HTMLCanvasElement>(null);
  const [preset, setPreset]           = useState(PRESETS[0]);
  const [bgType, setBgType]           = useState<'solid' | 'gradient'>('gradient');
  const [bgColor, setBgColor]         = useState('#1e3a8a');
  const [bgGradient, setBgGradient]   = useState(GRADIENTS[0]);
  const [gradientAngle, setGradientAngle] = useState(135);
  const [layers, setLayers]           = useState<TextLayer[]>([
    {
      id: '1', text: 'Your Headline Here', x: 50, y: 45,
      fontSize: 64, fontFamily: 'Georgia', color: '#ffffff',
      bold: true, italic: false, align: 'center', shadow: true, opacity: 100,
    },
  ]);
  const [selectedId, setSelectedId]   = useState<string | null>('1');
  const [dragging, setDragging]       = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [showLayerPanel, setShowLayerPanel] = useState(true);

  const selectedLayer = layers.find(l => l.id === selectedId) || null;

  // ── Draw canvas ────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = preset.width;
    canvas.height = preset.height;

    // Background
    if (bgType === 'gradient') {
      const rad = (gradientAngle * Math.PI) / 180;
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const len = Math.sqrt(cx * cx + cy * cy);
      const grd = ctx.createLinearGradient(
        cx - Math.cos(rad) * len, cy - Math.sin(rad) * len,
        cx + Math.cos(rad) * len, cy + Math.sin(rad) * len,
      );
      grd.addColorStop(0, bgGradient.stops[0]);
      grd.addColorStop(1, bgGradient.stops[1]);
      ctx.fillStyle = grd;
    } else {
      ctx.fillStyle = bgColor;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Layers
    layers.forEach(layer => {
      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;

      let fontStr = '';
      if (layer.italic) fontStr += 'italic ';
      if (layer.bold) fontStr += 'bold ';
      fontStr += `${layer.fontSize}px "${layer.fontFamily}", sans-serif`;
      ctx.font = fontStr;

      if (layer.shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur  = layer.fontSize * 0.2;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      ctx.fillStyle  = layer.color;
      ctx.textAlign  = layer.align;
      ctx.textBaseline = 'middle';

      const px = (layer.x / 100) * canvas.width;
      const py = (layer.y / 100) * canvas.height;

      // Word-wrap
      const maxWidth = canvas.width * 0.85;
      const words  = layer.text.split(' ');
      const lines: string[] = [];
      let cur = '';
      words.forEach(w => {
        const test = cur ? `${cur} ${w}` : w;
        if (ctx.measureText(test).width > maxWidth && cur) {
          lines.push(cur);
          cur = w;
        } else {
          cur = test;
        }
      });
      if (cur) lines.push(cur);

      const lineH = layer.fontSize * 1.25;
      const totalH = lines.length * lineH;
      lines.forEach((line, i) => {
        ctx.fillText(line, px, py - totalH / 2 + i * lineH + lineH / 2);
      });
      ctx.restore();
    });

    // Update preview
    const preview = previewRef.current;
    if (preview) {
      const pCtx = preview.getContext('2d');
      if (pCtx) {
        preview.width  = 320;
        preview.height = Math.round(320 * (preset.height / preset.width));
        pCtx.drawImage(canvas, 0, 0, preview.width, preview.height);
      }
    }
  }, [preset, bgType, bgColor, bgGradient, gradientAngle, layers]);

  useEffect(() => { draw(); }, [draw]);

  // ── Drag on preview ────────────────────────────────────────────────────────

  const getPreviewPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = previewRef.current!;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width)  * 100;
    const py = ((e.clientY - rect.top)  / rect.height) * 100;
    return { px, py };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { px, py } = getPreviewPos(e);
    // Find topmost layer at click
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      if (Math.abs(px - l.x) < 20 && Math.abs(py - l.y) < 15) {
        setSelectedId(l.id);
        setDragging({ id: l.id, ox: px - l.x, oy: py - l.y });
        return;
      }
    }
    setSelectedId(null);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const { px, py } = getPreviewPos(e);
    setLayers(prev => prev.map(l => l.id === dragging.id
      ? { ...l, x: Math.max(5, Math.min(95, px - dragging.ox)), y: Math.max(5, Math.min(95, py - dragging.oy)) }
      : l,
    ));
  };

  const onMouseUp = () => setDragging(null);

  // ── Layer helpers ──────────────────────────────────────────────────────────

  const addLayer = () => {
    const id = String(Date.now());
    setLayers(prev => [...prev, {
      id, text: 'New Text', x: 50, y: 60,
      fontSize: 32, fontFamily: 'Arial', color: '#ffffff',
      bold: false, italic: false, align: 'center', shadow: false, opacity: 100,
    }]);
    setSelectedId(id);
  };

  const deleteLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    setSelectedId(null);
  };

  const updateLayer = (patch: Partial<TextLayer>) => {
    setLayers(prev => prev.map(l => l.id === selectedId ? { ...l, ...patch } : l));
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onExportImage(dataUrl);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'design.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto text-xs">
      {/* Canvas Preview */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <canvas
          ref={previewRef}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 cursor-move shadow-md"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ maxHeight: 200, objectFit: 'contain' }}
        />
        <canvas ref={canvasRef} className="hidden" />
        <p className="text-center text-gray-400 mt-1.5">Drag text layers to reposition</p>
      </div>

      {/* Preset selector */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <label className="block font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Canvas Size</label>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button
              key={p.name}
              onClick={() => setPreset(p)}
              className={`px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                preset.name === p.name
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-400'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="text-gray-400 mt-1.5">{preset.width} × {preset.height}px</div>
      </div>

      {/* Background */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <label className="block font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Background</label>
        <div className="flex gap-2 mb-3">
          {(['solid', 'gradient'] as const).map(t => (
            <button
              key={t}
              onClick={() => setBgType(t)}
              className={`px-3 py-1.5 rounded-lg border font-medium capitalize transition-all ${
                bgType === t ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {bgType === 'solid' ? (
          <div className="flex flex-wrap gap-1.5">
            {SOLID_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setBgColor(c)}
                style={{ background: c }}
                className={`w-7 h-7 rounded-lg border-2 transition-all ${bgColor === c ? 'border-violet-400 scale-110' : 'border-gray-200 dark:border-gray-700'}`}
              />
            ))}
            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer p-0.5 bg-transparent" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {GRADIENTS.map(g => (
                <button
                  key={g.name}
                  onClick={() => setBgGradient(g)}
                  style={{ background: `linear-gradient(135deg, ${g.stops[0]}, ${g.stops[1]})` }}
                  className={`w-9 h-9 rounded-lg border-2 transition-all ${bgGradient.name === g.name ? 'border-violet-400 scale-110' : 'border-transparent'}`}
                  title={g.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 shrink-0">Angle:</span>
              <input type="range" min={0} max={360} value={gradientAngle} onChange={e => setGradientAngle(+e.target.value)}
                className="flex-1 accent-violet-600" />
              <span className="text-gray-500 dark:text-gray-400 w-8 text-right">{gradientAngle}°</span>
            </div>
          </>
        )}
      </div>

      {/* Text Layers */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowLayerPanel(v => !v)}
            className="flex items-center gap-1.5 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
          >
            <Type size={12} /> Text Layers
            {showLayerPanel ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          <button onClick={addLayer} className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-semibold">
            <Plus size={11} /> Add Text
          </button>
        </div>

        {showLayerPanel && (
          <div className="space-y-1.5">
            {layers.map(layer => (
              <div
                key={layer.id}
                onClick={() => setSelectedId(layer.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                  selectedId === layer.id
                    ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700'
                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <Move size={11} className="text-gray-400 shrink-0" />
                <span className="flex-1 min-w-0 truncate text-gray-700 dark:text-gray-300 font-medium">{layer.text}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteLayer(layer.id); }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Layer Editor */}
      {selectedLayer && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <h4 className="font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Palette size={12} /> Edit Text Layer
          </h4>

          <textarea
            value={selectedLayer.text}
            onChange={e => updateLayer({ text: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
          />

          {/* Font family */}
          <select
            value={selectedLayer.fontFamily}
            onChange={e => updateLayer({ fontFamily: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-violet-500"
          >
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {/* Font size */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400 shrink-0 w-12">Size:</span>
            <button onClick={() => updateLayer({ fontSize: Math.max(10, selectedLayer.fontSize - 4) })}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
              <Minus size={12} />
            </button>
            <span className="w-10 text-center font-bold text-gray-700 dark:text-gray-300">{selectedLayer.fontSize}</span>
            <button onClick={() => updateLayer({ fontSize: Math.min(200, selectedLayer.fontSize + 4) })}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
              <Plus size={12} />
            </button>
          </div>

          {/* Style row */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => updateLayer({ bold: !selectedLayer.bold })}
              className={`p-2 rounded-lg border transition-all ${selectedLayer.bold ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
              <Bold size={13} />
            </button>
            <button onClick={() => updateLayer({ italic: !selectedLayer.italic })}
              className={`p-2 rounded-lg border transition-all ${selectedLayer.italic ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
              <Italic size={13} />
            </button>
            <button onClick={() => updateLayer({ align: 'left' })}
              className={`p-2 rounded-lg border transition-all ${selectedLayer.align === 'left' ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
              <AlignLeft size={13} />
            </button>
            <button onClick={() => updateLayer({ align: 'center' })}
              className={`p-2 rounded-lg border transition-all ${selectedLayer.align === 'center' ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
              <AlignCenter size={13} />
            </button>
            <button onClick={() => updateLayer({ align: 'right' })}
              className={`p-2 rounded-lg border transition-all ${selectedLayer.align === 'right' ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
              <AlignRight size={13} />
            </button>
          </div>

          {/* Color + shadow */}
          <div className="flex items-center gap-3">
            <span className="text-gray-500 dark:text-gray-400 shrink-0">Color:</span>
            <input type="color" value={selectedLayer.color} onChange={e => updateLayer({ color: e.target.value })}
              className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer p-0.5 bg-transparent" />
            <label className="flex items-center gap-1.5 cursor-pointer ml-2">
              <input type="checkbox" checked={selectedLayer.shadow} onChange={e => updateLayer({ shadow: e.target.checked })}
                className="rounded accent-violet-600" />
              <span className="text-gray-500 dark:text-gray-400">Shadow</span>
            </label>
          </div>

          {/* Opacity */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400 shrink-0 w-14">Opacity:</span>
            <input type="range" min={10} max={100} value={selectedLayer.opacity} onChange={e => updateLayer({ opacity: +e.target.value })}
              className="flex-1 accent-violet-600" />
            <span className="text-gray-500 dark:text-gray-400 w-8 text-right">{selectedLayer.opacity}%</span>
          </div>
        </div>
      )}

      {/* Export buttons */}
      <div className="p-4 space-y-2.5">
        <button
          onClick={exportImage}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <ImageIcon size={14} /> Set as Featured Image
        </button>
        <button
          onClick={downloadImage}
          className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold py-2.5 rounded-xl transition-colors"
        >
          <Download size={14} /> Download PNG
        </button>
        <button
          onClick={() => setLayers([{ id: '1', text: 'Your Headline Here', x: 50, y: 45, fontSize: 64, fontFamily: 'Georgia', color: '#ffffff', bold: true, italic: false, align: 'center', shadow: true, opacity: 100 }])}
          className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs py-1.5 transition-colors"
        >
          <RotateCcw size={12} /> Reset Design
        </button>
      </div>
    </div>
  );
}
