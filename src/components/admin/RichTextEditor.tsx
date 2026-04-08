import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link, Image, Code, Quote,
  Undo, Redo, Type, Palette, Eye, EyeOff, Minus, Video, Smile,
  Table, Info, AlertTriangle, CheckCircle, XCircle,
  GitBranch, BarChart2, Maximize2, Minimize2,
  Printer, Search, Subscript, Superscript, ChevronRight, ChevronLeft, Sparkles,
} from 'lucide-react';

export interface RichTextEditorHandle {
  insertAtCursor(html: string): void;
  getContent(): string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageClick?: () => void;
  onRequestToolkit?: () => void;
  placeholder?: string;
}

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const EMOJI_LIST = ['😊','😂','🔥','❤️','👍','🎉','✨','💡','📌','⭐','🌟','🚀','💪','🎯','📝','📖','🌍','🎨','📸','🎵'];

const HEADING_OPTIONS = [
  { label: 'Paragraph', tag: 'p' },
  { label: 'H2', tag: 'h2' },
  { label: 'H3', tag: 'h3' },
  { label: 'H4', tag: 'h4' },
  { label: 'H5', tag: 'h5' },
  { label: 'H6', tag: 'h6' },
];

const CALLOUT_TYPES = [
  { id: 'info',    label: 'Info Note',    icon: Info,          cls: 'callout-info' },
  { id: 'warning', label: 'Warning',      icon: AlertTriangle, cls: 'callout-warning' },
  { id: 'success', label: 'Success / Tip',icon: CheckCircle,   cls: 'callout-success' },
  { id: 'danger',  label: 'Important!',   icon: XCircle,       cls: 'callout-danger' },
  { id: 'tip',     label: 'Pro Tip',      icon: Info,          cls: 'callout-tip' },
] as const;
type CalloutType = typeof CALLOUT_TYPES[number]['id'];

// ── HELPERS ──────────────────────────────────────────────────────────────────
function wordCount(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

function getParentBlock(node: Node | null): HTMLElement | null {
  let n = node instanceof HTMLElement ? node : node?.parentElement ?? null;
  const blockTags = new Set(['P','H1','H2','H3','H4','H5','H6','LI','BLOCKQUOTE','PRE','DIV']);
  while (n && !blockTags.has(n.nodeName)) n = n.parentElement;
  return n;
}

/** Sanitize pasted HTML — keep tables/figures, strip Word/Sheets garbage */
function sanitizePastedHtml(html: string): string {
  let clean = html
    .replace(/<!\[if[^\]]*\]>[\s\S]*?<!\[endif\]>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?o:[^>]*>/gi, '')
    .replace(/<\/?w:[^>]*>/gi, '')
    .replace(/<\/?m:[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\s*style="[^"]*"/gi, '')
    .replace(/\s*(width|height|bgcolor|valign|border|cellpadding|cellspacing)="[^"]*"/gi, '')
    .replace(/<font[^>]*>/gi, '').replace(/<\/font>/gi, '')
    .replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  // Apply editor table class
  clean = clean.replace(/<table/gi, '<table class="editor-table"');
  return clean;
}

// ── COMPONENT ────────────────────────────────────────────────────────────────
const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(({
  value, onChange, onImageClick, onRequestToolkit,
  placeholder = 'Start writing your content…  (Ctrl+V pastes images, tables & charts)',
}, ref) => {
  const editorRef  = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);

  const [showHtml,        setShowHtml]        = useState(false);
  const [htmlContent,     setHtmlContent]     = useState(value);
  const [isFocused,       setIsFocused]       = useState(false);
  const [isFullscreen,    setIsFullscreen]    = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showCalloutMenu, setShowCalloutMenu] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [tableHover,      setTableHover]      = useState({ r: 0, c: 0 });
  const [selectedColor,   setSelectedColor]   = useState('#000000');
  const [findText,        setFindText]        = useState('');
  const [replaceText,     setReplaceText]     = useState('');
  const [replaceMsg,      setReplaceMsg]      = useState('');
  const [wc,              setWc]              = useState(0);

  const closeAllMenus = () => {
    setShowEmojiPicker(false);
    setShowColorPicker(false);
    setShowTablePicker(false);
    setShowCalloutMenu(false);
  };

  // Keep word count live
  useEffect(() => { setWc(wordCount(htmlContent)); }, [htmlContent]);

  // Sync external value when editor is not focused and not in HTML mode
  useEffect(() => {
    if (editorRef.current && !showHtml && !isFocused) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    setHtmlContent(value);
  }, [value, showHtml, isFocused]);

  // Fullscreen escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    if (isFullscreen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  const updateContent = useCallback(() => {
    if (editorRef.current) {
      const c = editorRef.current.innerHTML;
      setHtmlContent(c);
      onChange(c);
    }
  }, [onChange]);

  // Save selection — only capture if range is inside this editor
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedRange.current = range.cloneRange();
      }
    }
  }, []);

  // Track selection changes continuously so insertAtCursor always lands correctly
  useEffect(() => {
    document.addEventListener('selectionchange', saveSelection);
    return () => document.removeEventListener('selectionchange', saveSelection);
  }, [saveSelection]);

  // ── IMPERATIVE HANDLE — exposes insertAtCursor to parent components ──────────
  useImperativeHandle(ref, () => ({
    insertAtCursor(html: string) {
      if (!editorRef.current) return;
      // Snapshot range BEFORE focus() — focus fires selectionchange which would overwrite savedRange
      const rangeSnapshot = savedRange.current ? savedRange.current.cloneRange() : null;
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel && rangeSnapshot) {
        try {
          if (editorRef.current.contains(rangeSnapshot.commonAncestorContainer)) {
            sel.removeAllRanges();
            sel.addRange(rangeSnapshot);
          }
        } catch {}
      }
      document.execCommand('insertHTML', false, html);
      setTimeout(updateContent, 10);
    },
    getContent() {
      return editorRef.current?.innerHTML || htmlContent;
    },
  }), [htmlContent, updateContent]);

  // Restore saved selection then run a callback
  const withRestoredSelection = (fn: () => void) => {
    const rangeSnapshot = savedRange.current ? savedRange.current.cloneRange() : null;
    if (editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel && rangeSnapshot) {
        try {
          if (editorRef.current.contains(rangeSnapshot.commonAncestorContainer)) {
            sel.removeAllRanges();
            sel.addRange(rangeSnapshot);
          }
        } catch {}
      }
    }
    fn();
  };

  // ── LOW-LEVEL COMMANDS ──────────────────────────────────────────────────
  const execCmd = (command: string, val?: string) => {
    editorRef.current?.focus();
    try { document.execCommand(command, false, val); setTimeout(updateContent, 10); } catch {}
  };

  const insertHtml = (html: string) => {
    withRestoredSelection(() => {
      document.execCommand('insertHTML', false, html);
      setTimeout(updateContent, 10);
    });
  };

  const formatBlock = (tag: string) => {
    editorRef.current?.focus();
    try { document.execCommand('formatBlock', false, `<${tag}>`); setTimeout(updateContent, 10); } catch {}
  };

  // ── TOOLBAR ACTIONS ─────────────────────────────────────────────────────
  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const href = url.startsWith('http') ? url : 'https://' + url;
      execCmd('createLink', href);
    }
  };

  const insertVideo = () => {
    const url = prompt('Enter YouTube, Vimeo, or direct video URL:');
    if (!url) return;

    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const vimeo = url.match(/vimeo\.com\/(\d+)/);

    let html: string;
    if (yt) {
      const videoId = yt[1];
      html = `<div class="plyr__video-embed js-plyr" style="margin:1.5rem 0;border-radius:12px;overflow:hidden"><iframe src="https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=https://mayobebros.com&modestbranding=1&rel=0&iv_load_policy=3" allowfullscreen allow="autoplay; fullscreen; picture-in-picture; web-share" frameborder="0"></iframe></div><p></p>`;
    } else if (vimeo) {
      const videoId = vimeo[1];
      html = `<div class="plyr__video-embed js-plyr" style="margin:1.5rem 0;border-radius:12px;overflow:hidden"><iframe src="https://player.vimeo.com/video/${videoId}?byline=0&portrait=0&title=0" allowfullscreen allow="autoplay; fullscreen; picture-in-picture" frameborder="0"></iframe></div><p></p>`;
    } else {
      html = `<div style="margin:1.5rem 0"><video class="js-plyr" controls playsinline style="width:100%;border-radius:12px;max-height:480px"><source src="${url}"></video></div><p></p>`;
    }
    insertHtml(html);
  };

  const insertEmoji = (em: string) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, em);
    setTimeout(updateContent, 10);
    setShowEmojiPicker(false);
  };

  const insertHr = () => insertHtml('<hr /><p></p>');

  const applyTextColor = (color: string) => {
    setSelectedColor(color);
    execCmd('foreColor', color);
    setShowColorPicker(false);
  };

  // ── TABLE ──────────────────────────────────────────────────────────────
  const insertTable = (rows: number, cols: number) => {
    const th = Array.from({ length: cols }, (_, i) => `<th>Column ${i + 1}</th>`).join('');
    const td = Array.from({ length: cols }, () => '<td><br></td>').join('');
    const trs = Array.from({ length: Math.max(0, rows - 1) }, () => `<tr>${td}</tr>`).join('');
    insertHtml(`<div class="table-wrapper"><table class="editor-table"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div><p></p>`);
    setShowTablePicker(false);
  };

  // ── CALLOUT ────────────────────────────────────────────────────────────
  const insertCallout = (type: CalloutType) => {
    const labels: Record<CalloutType, string> = {
      info: 'Note', warning: 'Important', success: 'Tip', danger: 'Warning', tip: 'Pro Tip',
    };
    insertHtml(`<div class="callout callout-${type}"><p><strong>${labels[type]}:</strong> Type your content here…</p></div><p></p>`);
    setShowCalloutMenu(false);
  };

  // ── TREE DIAGRAM ───────────────────────────────────────────────────────
  const insertTree = () => {
    insertHtml(`<pre class="tree-diagram">Root Topic
├── Main Branch 1
│   ├── Sub-topic 1.1
│   ├── Sub-topic 1.2
│   └── Sub-topic 1.3
├── Main Branch 2
│   ├── Sub-topic 2.1
│   └── Sub-topic 2.2
└── Main Branch 3
    └── Sub-topic 3.1</pre><p></p>`);
  };

  // ── CHART PLACEHOLDER ──────────────────────────────────────────────────
  const insertChartSlot = () => {
    insertHtml(`<figure class="chart-figure" contenteditable="false"><div class="chart-placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 17V13M12 17V9M17 17V11"/></svg><p>Paste or drop a chart / graph image here</p><span>Ctrl+V after copying from Excel, Google Sheets, or any chart tool</span></div></figure><p></p>`);
  };

  // ── PRINT ─────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const content = editorRef.current?.innerHTML || htmlContent;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Print</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,'Times New Roman',serif;font-size:1rem;line-height:1.8;color:#111;max-width:780px;margin:0 auto;padding:2.5cm 2cm}
h2{font-size:1.5rem;font-weight:700;margin:1.75em 0 .5em;border-bottom:1px solid #ccc;padding-bottom:.2em}
h3{font-size:1.2rem;font-weight:700;margin:1.4em 0 .4em}
h4{font-size:1.05rem;font-weight:600;margin:1.2em 0 .35em}
p{margin-bottom:1em}
ul{list-style:disc;padding-left:1.75em;margin-bottom:1em}
ol{list-style:decimal;padding-left:1.75em;margin-bottom:1em}
ul ul{list-style:circle}li{margin-bottom:.3em}
a{color:#1d4ed8;text-decoration:underline}
blockquote{border-left:3px solid #3b82f6;padding-left:1em;margin:1.25em 0;color:#555;font-style:italic}
pre{background:#f4f4f4;padding:1em;border-radius:4px;font-size:.85em;overflow-x:auto;white-space:pre;margin:1em 0}
table{width:100%;border-collapse:collapse;margin:1.5em 0;font-size:.9rem}
th{background:#f1f5f9;font-weight:700;padding:.5em .75em;text-align:left;border-bottom:2px solid #ccc;border-right:1px solid #ddd}
td{padding:.5em .75em;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb}
td:last-child,th:last-child{border-right:none}tr:last-child td{border-bottom:none}
img{max-width:100%;border-radius:6px;display:block;margin:1em auto}
figure{text-align:center;margin:1.5em 0}figcaption{font-size:.8rem;color:#666;font-style:italic;margin-top:.35em}
.callout{padding:.85em 1.1em;margin:1.25em 0;border-radius:6px;border-left:4px solid}
.callout-info{background:#eff6ff;border-color:#3b82f6}
.callout-warning{background:#fffbeb;border-color:#f59e0b}
.callout-success{background:#f0fdf4;border-color:#22c55e}
.callout-danger{background:#fef2f2;border-color:#ef4444}
.callout-tip{background:#faf5ff;border-color:#a855f7}
.chart-placeholder{display:none}
@media print{@page{margin:1.5cm}body{padding:0}}
</style></head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 600);
  };

  // ── FIND & REPLACE ─────────────────────────────────────────────────────
  const handleFindReplace = (replaceAll: boolean) => {
    if (!findText || !editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, replaceAll ? 'gi' : 'i');
    const count = (html.match(new RegExp(escaped, 'gi')) || []).length;
    if (!count) { setReplaceMsg('No matches found.'); return; }
    editorRef.current.innerHTML = html.replace(regex, replaceText);
    updateContent();
    setReplaceMsg(replaceAll ? `Replaced all ${count} occurrence(s).` : 'Replaced 1 occurrence.');
  };

  // ── SMART PASTE ────────────────────────────────────────────────────────
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    saveSelection();

    // 1. Image blob (screenshots, copied chart images)
    const items = Array.from(e.clipboardData.items);
    const imgItem = items.find(it => it.type.startsWith('image/'));
    if (imgItem) {
      const file = imgItem.getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target?.result as string;
          withRestoredSelection(() => {
            document.execCommand('insertHTML', false,
              `<figure class="chart-figure"><img src="${src}" alt="Pasted image" /><figcaption contenteditable="true">Caption</figcaption></figure><p></p>`
            );
            setTimeout(updateContent, 10);
          });
        };
        reader.readAsDataURL(file);
        return;
      }
    }

    // 2. HTML — always use HTML when available (preserves bold, lists, headings,
    //    tables, links from ANY source: web, Word, Google Docs, etc.)
    //    Inserts at cursor position, never jumps to end.
    const htmlData = e.clipboardData.getData('text/html');
    if (htmlData && htmlData.trim()) {
      const clean = sanitizePastedHtml(htmlData);
      if (clean.trim()) {
        document.execCommand('insertHTML', false, clean);
        setTimeout(updateContent, 10);
        return;
      }
    }

    // 3. Plain text fallback — convert double-newlines to <p> tags (Word-like)
    const text = e.clipboardData.getData('text/plain');
    if (text) {
      const paras = text.split(/\n{2,}/).filter(p => p.trim());
      if (paras.length > 1) {
        const html = paras
          .map(p => `<p>${p.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')}</p>`)
          .join('');
        document.execCommand('insertHTML', false, html);
      } else {
        document.execCommand('insertText', false, text);
      }
      setTimeout(updateContent, 10);
    }
  };

  // ── DROP ────────────────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    const file = e.dataTransfer.files[0];

    if (!file?.type.startsWith('image/')) {
      // Non-image drop (internal text/HTML DnD) — let the browser handle it
      // natively so text can be dragged to any position within the editor.
      // onInput will fire and sync state after the native insertion.
      return;
    }

    e.preventDefault();

    // Capture the exact drop insertion point via caret-from-point BEFORE
    // calling focus(), because focus() fires selectionchange which would
    // overwrite savedRange with the wrong position.
    let dropRange: Range | null = null;
    if (document.caretRangeFromPoint) {
      dropRange = document.caretRangeFromPoint(e.clientX, e.clientY);
    } else {
      const pos = (document as any).caretPositionFromPoint?.(e.clientX, e.clientY);
      if (pos) {
        dropRange = document.createRange();
        dropRange.setStart(pos.offsetNode, pos.offset);
        dropRange.collapse(true);
      }
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (!editorRef.current) return;
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel && dropRange && editorRef.current.contains(dropRange.commonAncestorContainer)) {
        sel.removeAllRanges();
        sel.addRange(dropRange);
      }
      document.execCommand('insertHTML', false,
        `<figure class="chart-figure"><img src="${src}" alt="Dropped image" /><figcaption contenteditable="true">Caption</figcaption></figure><p></p>`
      );
      setTimeout(updateContent, 10);
    };
    reader.readAsDataURL(file);
  };

  // ── KEYBOARD — Word-like behaviour ─────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const ctrl = e.ctrlKey || e.metaKey;

    // Ctrl+K → insert link
    if (ctrl && e.key === 'k') { e.preventDefault(); insertLink(); return; }
    // Ctrl+P → print
    if (ctrl && e.key === 'p') { e.preventDefault(); handlePrint(); return; }
    // Ctrl+H → find & replace
    if (ctrl && e.key === 'h') { e.preventDefault(); setShowFindReplace(v => !v); return; }
    // Ctrl+Shift+T → open Writing Toolkit
    if (ctrl && e.shiftKey && (e.key === 't' || e.key === 'T')) { e.preventDefault(); onRequestToolkit?.(); return; }
    // F11 → fullscreen
    if (e.key === 'F11') { e.preventDefault(); setIsFullscreen(v => !v); return; }

    // Tab → indent/outdent (like Word)
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) { execCmd('outdent'); } else { execCmd('indent'); }
      return;
    }

    // Shift+Enter → <br> line break (Word-style soft return)
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      insertHtml('<br>');
      return;
    }

    // Enter at end of heading → start a plain paragraph (Word behaviour)
    if (e.key === 'Enter' && !e.shiftKey) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const block = getParentBlock(sel.focusNode);
        if (block && /^H[1-6]$/.test(block.nodeName)) {
          const range = sel.getRangeAt(0);
          const atEnd = range.endOffset === (block.textContent?.length ?? 0);
          if (atEnd) {
            e.preventDefault();
            // Insert paragraph after heading
            document.execCommand('insertHTML', false, '<p><br></p>');
            return;
          }
          // Cursor in middle: let browser split, then convert new block to <p>
          setTimeout(() => {
            document.execCommand('formatBlock', false, '<p>');
            updateContent();
          }, 0);
        }
      }
    }
  };

  // ── COLORS ─────────────────────────────────────────────────────────────
  const COLORS = ['#000000','#374151','#dc2626','#ea580c','#ca8a04','#16a34a','#0284c7','#7c3aed','#db2777','#ffffff'];

  // ── RENDER ─────────────────────────────────────────────────────────────
  const wrapperClass = isFullscreen
    ? 'fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-900 shadow-2xl'
    : 'relative border border-gray-200 dark:border-gray-600 rounded-xl overflow-visible bg-white dark:bg-gray-900 shadow-sm';

  return (
    <div className={wrapperClass}>

      {/* ── TOOLBAR ── */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 flex flex-wrap gap-0.5 items-center sticky top-0 z-10 rounded-t-xl">

        {/* Undo / Redo */}
        <Btn icon={<Undo size={15}/>} onClick={() => execCmd('undo')} title="Undo (Ctrl+Z)" />
        <Btn icon={<Redo size={15}/>} onClick={() => execCmd('redo')} title="Redo (Ctrl+Y)" />
        <Sep />

        {/* Block format */}
        <select
          onChange={e => { formatBlock(e.target.value); (e.target as HTMLSelectElement).value = ''; }}
          defaultValue=""
          className="text-xs px-2 py-1.5 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none cursor-pointer"
        >
          <option value="" disabled>Format</option>
          {HEADING_OPTIONS.map(h => <option key={h.tag} value={h.tag}>{h.label}</option>)}
        </select>
        <Sep />

        {/* Text style */}
        <Btn icon={<Bold size={15}/>}          onClick={() => execCmd('bold')}         title="Bold (Ctrl+B)" />
        <Btn icon={<Italic size={15}/>}        onClick={() => execCmd('italic')}       title="Italic (Ctrl+I)" />
        <Btn icon={<Underline size={15}/>}     onClick={() => execCmd('underline')}    title="Underline (Ctrl+U)" />
        <Btn icon={<Strikethrough size={15}/>} onClick={() => execCmd('strikeThrough')} title="Strikethrough" />
        <Btn icon={<Subscript size={15}/>}     onClick={() => execCmd('subscript')}    title="Subscript" />
        <Btn icon={<Superscript size={15}/>}   onClick={() => execCmd('superscript')}  title="Superscript" />
        <Sep />

        {/* Alignment */}
        <Btn icon={<AlignLeft size={15}/>}    onClick={() => execCmd('justifyLeft')}   title="Align Left" />
        <Btn icon={<AlignCenter size={15}/>}  onClick={() => execCmd('justifyCenter')} title="Center" />
        <Btn icon={<AlignRight size={15}/>}   onClick={() => execCmd('justifyRight')}  title="Align Right" />
        <Btn icon={<AlignJustify size={15}/>} onClick={() => execCmd('justifyFull')}   title="Justify" />
        <Sep />

        {/* Lists + indent */}
        <Btn icon={<List size={15}/>}        onClick={() => execCmd('insertUnorderedList')} title="Bullet List" />
        <Btn icon={<ListOrdered size={15}/>} onClick={() => execCmd('insertOrderedList')}   title="Numbered List" />
        <Btn icon={<ChevronRight size={15}/>} onClick={() => execCmd('indent')}   title="Indent (Tab)" />
        <Btn icon={<ChevronLeft size={15}/>}  onClick={() => execCmd('outdent')}  title="Outdent (Shift+Tab)" />
        <Sep />

        {/* Media & blocks */}
        <Btn icon={<Link size={15}/>}  onClick={insertLink}                title="Insert Link (Ctrl+K)" />
        <Btn icon={<Image size={15}/>} onClick={onImageClick}              title="Insert Image" />
        <Btn icon={<Video size={15}/>} onClick={insertVideo}               title="Insert Video" />
        <Btn icon={<Quote size={15}/>} onClick={() => formatBlock('blockquote')} title="Block Quote" />
        <Btn icon={<Code size={15}/>}  onClick={() => formatBlock('pre')}  title="Code Block" />
        <Btn icon={<Minus size={15}/>} onClick={insertHr}                  title="Horizontal Rule" />
        <Sep />

        {/* TABLE picker */}
        <div className="relative">
          <Btn
            icon={<Table size={15}/>}
            onClick={() => { setShowTablePicker(v => !v); setShowCalloutMenu(false); closeAllMenus(); }}
            title="Insert Table"
            active={showTablePicker}
          />
          {showTablePicker && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl p-3 z-50 min-w-[200px]">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2 font-semibold uppercase tracking-wider text-center">
                {tableHover.r > 0 ? `${tableHover.r} × ${tableHover.c} Table` : 'Select table size (max 8×8)'}
              </p>
              <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(8,1fr)' }}>
                {Array.from({ length: 64 }, (_, i) => {
                  const r = Math.floor(i / 8) + 1, c = (i % 8) + 1;
                  return (
                    <button
                      key={i} type="button"
                      onMouseEnter={() => setTableHover({ r, c })}
                      onMouseLeave={() => setTableHover({ r: 0, c: 0 })}
                      onClick={() => insertTable(r, c)}
                      className={`w-5 h-5 rounded-sm border transition-colors ${
                        r <= tableHover.r && c <= tableHover.c
                          ? 'bg-blue-400 border-blue-500'
                          : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-blue-200'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CALLOUT picker */}
        <div className="relative">
          <Btn
            icon={<Info size={15}/>}
            onClick={() => { setShowCalloutMenu(v => !v); setShowTablePicker(false); closeAllMenus(); }}
            title="Insert Callout Box"
            active={showCalloutMenu}
          />
          {showCalloutMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl p-1.5 z-50 w-44">
              <p className="text-[10px] text-gray-400 px-2 py-1 font-semibold uppercase tracking-wider">Callout Type</p>
              {CALLOUT_TYPES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id} type="button"
                  onClick={() => insertCallout(id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-left callout-btn-${id}`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Btn icon={<GitBranch size={15}/>} onClick={insertTree}      title="Insert Tree / Hierarchy Diagram" />
        <Btn icon={<BarChart2 size={15}/>} onClick={insertChartSlot}  title="Insert Chart / Graph placeholder" />
        <Sep />

        {/* Text color */}
        <div className="relative">
          <Btn
            icon={<Type size={15} style={{ color: selectedColor }}/>}
            onClick={() => { setShowColorPicker(v => !v); setShowEmojiPicker(false); setShowTablePicker(false); setShowCalloutMenu(false); }}
            title="Text Color"
          />
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-2 z-50 flex gap-1.5 flex-wrap w-[148px]">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => applyTextColor(c)}
                  className="w-6 h-6 rounded-md border-2 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c, borderColor: c === '#ffffff' ? '#e5e7eb' : c }} />
              ))}
              <input type="color" className="w-6 h-6 rounded cursor-pointer border-0" onChange={e => applyTextColor(e.target.value)} title="Custom color" />
            </div>
          )}
        </div>
        <Btn icon={<Palette size={15}/>} onClick={() => { const c = prompt('Highlight color (hex):', '#ffff00'); if (c) execCmd('hiliteColor', c); }} title="Highlight" />
        <Sep />

        {/* Emoji */}
        <div className="relative">
          <Btn
            icon={<Smile size={15}/>}
            onClick={() => { setShowEmojiPicker(v => !v); setShowColorPicker(false); setShowTablePicker(false); setShowCalloutMenu(false); }}
            title="Emoji"
          />
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-2 z-50 grid grid-cols-5 gap-1 w-[140px]">
              {EMOJI_LIST.map(em => (
                <button key={em} type="button" onClick={() => insertEmoji(em)}
                  className="w-7 h-7 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center transition-colors">
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>
        <Sep />

        {/* Find & Replace */}
        <Btn icon={<Search size={15}/>} onClick={() => setShowFindReplace(v => !v)} title="Find & Replace (Ctrl+H)" active={showFindReplace} />

        {/* Print */}
        <Btn icon={<Printer size={15}/>} onClick={handlePrint} title="Print Post (Ctrl+P)" />

        {/* Writing Toolkit */}
        {onRequestToolkit && (
          <>
            <Sep />
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); onRequestToolkit(); }}
              title="Open Writing Toolkit (Ctrl+Shift+T)"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors"
            >
              <Sparkles size={12}/> Toolkit
            </button>
          </>
        )}

        {/* Fullscreen */}
        <Btn
          icon={isFullscreen ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}
          onClick={() => setIsFullscreen(v => !v)}
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (F11)'}
          active={isFullscreen}
        />

        {/* HTML source */}
        <Btn icon={showHtml ? <Eye size={15}/> : <EyeOff size={15}/>} onClick={() => setShowHtml(v => !v)} title={showHtml ? 'Visual Editor' : 'HTML Source'} active={showHtml} />

        {/* Hint label */}
        <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500 hidden xl:block pr-1 select-none">
          Ctrl+Shift+T: toolkit • Ctrl+P: print • Shift+Enter: line break
        </span>
      </div>

      {/* ── FIND & REPLACE PANEL ── */}
      {showFindReplace && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/10 px-4 py-2.5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Find & Replace</span>
          <input
            type="text" value={findText}
            onChange={e => { setFindText(e.target.value); setReplaceMsg(''); }}
            placeholder="Find text…"
            className="text-xs px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:outline-none w-40"
          />
          <input
            type="text" value={replaceText}
            onChange={e => setReplaceText(e.target.value)}
            placeholder="Replace with…"
            className="text-xs px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:outline-none w-40"
          />
          <button type="button" onClick={() => handleFindReplace(false)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors">Replace</button>
          <button type="button" onClick={() => handleFindReplace(true)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors">Replace All</button>
          {replaceMsg && <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">{replaceMsg}</span>}
          <button type="button" onClick={() => { setShowFindReplace(false); setFindText(''); setReplaceText(''); setReplaceMsg(''); }}
            className="ml-auto text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            Close (Esc)
          </button>
        </div>
      )}

      {/* ── EDITOR AREA ── */}
      <div className={isFullscreen ? 'flex-1 overflow-y-auto' : ''}>
        {showHtml ? (
          <textarea
            value={htmlContent}
            onChange={e => { setHtmlContent(e.target.value); onChange(e.target.value); }}
            className="w-full p-6 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none resize-y"
            style={{ minHeight: isFullscreen ? '100%' : '520px' }}
            placeholder="HTML content…"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck
            onInput={updateContent}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onFocus={() => { setIsFocused(true); closeAllMenus(); }}
            onBlur={() => setIsFocused(false)}
            className="w-full px-8 py-6 focus:outline-none text-gray-900 dark:text-gray-100 leading-relaxed"
            style={{
              minHeight: isFullscreen ? 'calc(100vh - 180px)' : '520px',
              wordWrap: 'break-word', overflowWrap: 'break-word',
            }}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* ── WORD COUNT STATUS BAR ── */}
      <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 px-4 py-1.5 flex items-center gap-4 text-[11px] text-gray-400 dark:text-gray-500 select-none rounded-b-xl">
        <span><strong className={wc >= 4000 ? 'text-green-600 dark:text-green-400' : wc >= 2000 ? 'text-amber-500' : 'text-red-400'}>{wc.toLocaleString()}</strong> words</span>
        <span>{htmlContent.replace(/<[^>]+>/g,'').length.toLocaleString()} chars</span>
        <span>~{Math.max(1, Math.round(wc / 200))} min read</span>
        {wc < 4000 && <span className="text-amber-500">{(4000 - wc).toLocaleString()} more words for full AdSense score</span>}
        {wc >= 4000 && <span className="text-green-600 dark:text-green-400">Word count target reached</span>}
        <span className="ml-auto">
          {isFullscreen ? 'Esc · exit fullscreen' : 'F11 · fullscreen'} · Ctrl+H · find &amp; replace · Ctrl+P · print
        </span>
      </div>

      {/* ── STYLES ── */}
      <style>{`
        /* Placeholder */
        [contenteditable]:empty:before { content:attr(data-placeholder); color:#9ca3af; pointer-events:none; }
        .dark [contenteditable]:empty:before { color:#6b7280; }

        /* Headings */
        [contenteditable] h2 { font-size:1.5rem;font-weight:700;margin:1.5rem 0 .75rem;border-bottom:2px solid #e5e7eb;padding-bottom:.4rem; }
        [contenteditable] h3 { font-size:1.25rem;font-weight:700;margin:1.25rem 0 .5rem; }
        [contenteditable] h4 { font-size:1.1rem;font-weight:600;margin:1rem 0 .4rem; }
        [contenteditable] h5 { font-size:1rem;font-weight:600;margin:.9rem 0 .35rem; }
        [contenteditable] h6 { font-size:.95rem;font-weight:600;margin:.8rem 0 .3rem; }
        [contenteditable] p  { margin:.75rem 0;line-height:1.85; }

        /* Lists — symbols MUST show */
        [contenteditable] ul { list-style:disc;padding-left:1.75rem;margin:.75rem 0; }
        [contenteditable] ol { list-style:decimal;padding-left:1.75rem;margin:.75rem 0; }
        [contenteditable] ul ul   { list-style:circle; }
        [contenteditable] ul ul ul { list-style:square; }
        [contenteditable] li { margin-bottom:.3rem;line-height:1.75; }

        /* Blockquote */
        [contenteditable] blockquote { border-left:4px solid #3b82f6;padding:.5rem 1rem;margin:1rem 0;background:#eff6ff;border-radius:0 8px 8px 0;color:#1e40af;font-style:italic; }
        .dark [contenteditable] blockquote { background:rgba(59,130,246,.1);color:#93c5fd; }

        /* Code */
        [contenteditable] pre { background:#1e293b;color:#e2e8f0;padding:1rem;border-radius:8px;margin:1rem 0;overflow-x:auto;font-family:monospace;font-size:.875rem;line-height:1.6;white-space:pre; }

        /* Tree */
        [contenteditable] pre.tree-diagram { background:#f8fafc;color:#1e293b;border:2px solid #e2e8f0;font-family:'Courier New',monospace;font-size:.9rem;line-height:1.9;padding:1.25rem 1.5rem; }
        .dark [contenteditable] pre.tree-diagram { background:#0f172a;color:#cbd5e1;border-color:#334155; }

        /* Links, images, HR */
        [contenteditable] a { color:#2563eb;text-decoration:underline; }
        [contenteditable] img { max-width:100%;height:auto;border-radius:8px;margin:1rem 0;display:block; }
        [contenteditable] hr { border:none;border-top:2px solid #e5e7eb;margin:1.5rem 0; }

        /* Figure / chart */
        [contenteditable] figure.chart-figure { margin:1.5rem 0;text-align:center;border:2px dashed #cbd5e1;border-radius:12px;padding:.75rem;background:#f8fafc; }
        .dark [contenteditable] figure.chart-figure { border-color:#475569;background:#0f172a; }
        [contenteditable] figure.chart-figure img { margin:0 auto;border-radius:8px; }
        [contenteditable] figure.chart-figure figcaption { margin-top:.4rem;font-size:.8rem;color:#64748b;font-style:italic; }
        .dark [contenteditable] figure.chart-figure figcaption { color:#94a3b8; }
        [contenteditable] .chart-placeholder { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem 1rem;color:#94a3b8;gap:.5rem; }
        [contenteditable] .chart-placeholder p { margin:0;font-size:.9rem;font-weight:500;color:#64748b; }
        [contenteditable] .chart-placeholder span { font-size:.75rem; }

        /* Tables */
        [contenteditable] .table-wrapper { overflow-x:auto;margin:1.5rem 0;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.07); }
        .dark [contenteditable] .table-wrapper { border-color:#334155; }
        [contenteditable] table.editor-table { width:100%;border-collapse:collapse;font-size:.875rem;min-width:360px; }
        [contenteditable] table.editor-table th { background:#f1f5f9;color:#0f172a;font-weight:700;text-align:left;padding:.6rem 1rem;border-bottom:2px solid #e2e8f0;border-right:1px solid #e2e8f0; }
        .dark [contenteditable] table.editor-table th { background:#1e293b;color:#f1f5f9;border-color:#334155; }
        [contenteditable] table.editor-table td { padding:.55rem 1rem;border-bottom:1px solid #f1f5f9;border-right:1px solid #f1f5f9;vertical-align:top;min-width:80px; }
        .dark [contenteditable] table.editor-table td { border-color:#1e293b; }
        [contenteditable] table.editor-table tr:last-child td { border-bottom:none; }
        [contenteditable] table.editor-table th:last-child,[contenteditable] table.editor-table td:last-child { border-right:none; }
        [contenteditable] table.editor-table tbody tr:nth-child(even) td { background:#f8fafc; }
        .dark [contenteditable] table.editor-table tbody tr:nth-child(even) td { background:#0f172a; }
        [contenteditable] table.editor-table tbody tr:hover td { background:#eff6ff; }
        .dark [contenteditable] table.editor-table tbody tr:hover td { background:rgba(59,130,246,.08); }

        /* Callouts */
        [contenteditable] .callout { margin:1.25rem 0;padding:1rem 1.25rem;border-radius:8px;border-left:4px solid;line-height:1.7; }
        [contenteditable] .callout p { margin:.2rem 0; }
        [contenteditable] .callout-info    { background:#eff6ff;border-color:#3b82f6;color:#1e40af; }
        [contenteditable] .callout-warning { background:#fffbeb;border-color:#f59e0b;color:#92400e; }
        [contenteditable] .callout-success { background:#f0fdf4;border-color:#22c55e;color:#14532d; }
        [contenteditable] .callout-danger  { background:#fef2f2;border-color:#ef4444;color:#7f1d1d; }
        [contenteditable] .callout-tip     { background:#faf5ff;border-color:#a855f7;color:#581c87; }
        .dark [contenteditable] .callout-info    { background:rgba(59,130,246,.1);color:#93c5fd; }
        .dark [contenteditable] .callout-warning { background:rgba(245,158,11,.1);color:#fcd34d; }
        .dark [contenteditable] .callout-success { background:rgba(34,197,94,.1);color:#86efac; }
        .dark [contenteditable] .callout-danger  { background:rgba(239,68,68,.1);color:#fca5a5; }
        .dark [contenteditable] .callout-tip     { background:rgba(168,85,247,.1);color:#d8b4fe; }

        /* Callout menu icon colours */
        .callout-btn-info    { color:#3b82f6; }
        .callout-btn-warning { color:#f59e0b; }
        .callout-btn-success { color:#22c55e; }
        .callout-btn-danger  { color:#ef4444; }
        .callout-btn-tip     { color:#a855f7; }
      `}</style>
    </div>
  );
});

export default RichTextEditor;

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
function Btn({ icon, onClick, title, active }: {
  icon: React.ReactNode; onClick?: () => void; title: string; active?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick?.(); }}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
      }`}
    >
      {icon}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5 flex-shrink-0" />;
}
