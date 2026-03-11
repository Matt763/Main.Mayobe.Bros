import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link, Image, Code, Quote,
  Heading2, Heading3, Undo, Redo, Type, Palette,
  Eye, EyeOff, Minus, Video, Smile,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageClick?: () => void;
  placeholder?: string;
}

const EMOJI_LIST = ['😊','😂','🔥','❤️','👍','🎉','✨','💡','📌','⭐','🌟','🚀','💪','🎯','📝','📖','🌍','🎨','📸','🎵'];

const HEADING_OPTIONS = [
  { label: 'Normal', tag: 'p' },
  { label: 'H2', tag: 'h2' },
  { label: 'H3', tag: 'h3' },
  { label: 'H4', tag: 'h4' },
];

export default function RichTextEditor({
  value,
  onChange,
  onImageClick,
  placeholder = 'Start writing your content...',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showHtml, setShowHtml] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');

  useEffect(() => {
    if (editorRef.current && !showHtml && !isFocused) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    setHtmlContent(value);
  }, [value, showHtml, isFocused]);

  const updateContent = useCallback(() => {
    if (editorRef.current) {
      const c = editorRef.current.innerHTML;
      setHtmlContent(c);
      onChange(c);
    }
  }, [onChange]);

  const execCommand = (command: string, val?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      try {
        document.execCommand(command, false, val);
        setTimeout(updateContent, 10);
      } catch {}
    }
  };

  const formatBlock = (tag: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      try {
        document.execCommand('formatBlock', false, `<${tag}>`);
        setTimeout(updateContent, 10);
      } catch {}
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const href = url.startsWith('http://') || url.startsWith('https://') ? url : 'https://' + url;
      execCommand('createLink', href);
    }
  };

  const insertVideo = () => {
    const url = prompt('Enter YouTube or video URL:');
    if (!url) return;
    let embedHtml = '';
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      embedHtml = `<div class="video-embed my-6"><iframe width="100%" height="400" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen style="border-radius:8px;"></iframe></div><p></p>`;
    } else {
      embedHtml = `<div class="video-embed my-6"><video controls style="width:100%;border-radius:8px;"><source src="${url}"></video></div><p></p>`;
    }
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, embedHtml);
      setTimeout(updateContent, 10);
    }
  };

  const insertEmoji = (emoji: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, emoji);
      setTimeout(updateContent, 10);
    }
    setShowEmojiPicker(false);
  };

  const insertHorizontalRule = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, '<hr class="my-6 border-gray-200 dark:border-gray-700" /><p></p>');
      setTimeout(updateContent, 10);
    }
  };

  const applyTextColor = (color: string) => {
    setSelectedColor(color);
    execCommand('foreColor', color);
    setShowColorPicker(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    setTimeout(updateContent, 10);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        if (editorRef.current) {
          editorRef.current.focus();
          document.execCommand('insertHTML', false, `<img src="${src}" alt="Uploaded image" class="max-w-full h-auto rounded-lg my-4" /><p></p>`);
          setTimeout(updateContent, 10);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const colors = ['#000000','#374151','#dc2626','#ea580c','#ca8a04','#16a34a','#0284c7','#7c3aed','#db2777','#ffffff'];

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-visible bg-white dark:bg-gray-900 shadow-sm">
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 flex flex-wrap gap-0.5 items-center sticky top-0 z-10">
        <ToolbarBtn icon={<Undo size={16} />} onClick={() => execCommand('undo')} title="Undo" />
        <ToolbarBtn icon={<Redo size={16} />} onClick={() => execCommand('redo')} title="Redo" />
        <Divider />

        <select
          onChange={(e) => formatBlock(e.target.value)}
          defaultValue=""
          className="text-xs px-2 py-1.5 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none cursor-pointer"
          title="Text format"
        >
          <option value="" disabled>Format</option>
          {HEADING_OPTIONS.map(h => (
            <option key={h.tag} value={h.tag}>{h.label}</option>
          ))}
        </select>
        <Divider />

        <ToolbarBtn icon={<Bold size={16} />} onClick={() => execCommand('bold')} title="Bold" />
        <ToolbarBtn icon={<Italic size={16} />} onClick={() => execCommand('italic')} title="Italic" />
        <ToolbarBtn icon={<Underline size={16} />} onClick={() => execCommand('underline')} title="Underline" />
        <ToolbarBtn icon={<Strikethrough size={16} />} onClick={() => execCommand('strikeThrough')} title="Strikethrough" />
        <Divider />

        <ToolbarBtn icon={<AlignLeft size={16} />} onClick={() => execCommand('justifyLeft')} title="Align Left" />
        <ToolbarBtn icon={<AlignCenter size={16} />} onClick={() => execCommand('justifyCenter')} title="Align Center" />
        <ToolbarBtn icon={<AlignRight size={16} />} onClick={() => execCommand('justifyRight')} title="Align Right" />
        <ToolbarBtn icon={<AlignJustify size={16} />} onClick={() => execCommand('justifyFull')} title="Justify" />
        <Divider />

        <ToolbarBtn icon={<List size={16} />} onClick={() => execCommand('insertUnorderedList')} title="Bullet List" />
        <ToolbarBtn icon={<ListOrdered size={16} />} onClick={() => execCommand('insertOrderedList')} title="Numbered List" />
        <Divider />

        <ToolbarBtn icon={<Link size={16} />} onClick={insertLink} title="Insert Link" />
        <ToolbarBtn icon={<Image size={16} />} onClick={onImageClick} title="Insert Image" />
        <ToolbarBtn icon={<Video size={16} />} onClick={insertVideo} title="Insert Video" />
        <ToolbarBtn icon={<Quote size={16} />} onClick={() => formatBlock('blockquote')} title="Block Quote" />
        <ToolbarBtn icon={<Code size={16} />} onClick={() => formatBlock('pre')} title="Code Block" />
        <ToolbarBtn icon={<Minus size={16} />} onClick={insertHorizontalRule} title="Horizontal Rule" />
        <Divider />

        <div className="relative">
          <ToolbarBtn
            icon={<Type size={16} style={{ color: selectedColor }} />}
            onClick={() => { setShowColorPicker(!showColorPicker); setShowEmojiPicker(false); }}
            title="Text Color"
          />
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-2 z-50 flex gap-1.5 flex-wrap w-[148px]">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => applyTextColor(c)}
                  className="w-6 h-6 rounded-md border-2 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c, borderColor: c === '#ffffff' ? '#e5e7eb' : c }}
                  title={c}
                />
              ))}
              <input type="color" className="w-6 h-6 rounded cursor-pointer border-0" onChange={e => applyTextColor(e.target.value)} title="Custom color" />
            </div>
          )}
        </div>
        <ToolbarBtn icon={<Palette size={16} />} onClick={() => { const c = prompt('Background color (hex):', '#ffff00'); if (c) execCommand('hiliteColor', c); }} title="Highlight" />
        <Divider />

        <div className="relative">
          <ToolbarBtn
            icon={<Smile size={16} />}
            onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowColorPicker(false); }}
            title="Insert Emoji"
          />
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-2 z-50 grid grid-cols-5 gap-1 w-[140px]">
              {EMOJI_LIST.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => insertEmoji(em)}
                  className="w-7 h-7 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center transition-colors"
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>
        <Divider />

        <ToolbarBtn
          icon={showHtml ? <Eye size={16} /> : <EyeOff size={16} />}
          onClick={() => setShowHtml(!showHtml)}
          title={showHtml ? 'Visual Editor' : 'HTML Source'}
          active={showHtml}
        />
      </div>

      {showHtml ? (
        <textarea
          value={htmlContent}
          onChange={(e) => { setHtmlContent(e.target.value); onChange(e.target.value); }}
          className="w-full p-6 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-[500px] focus:outline-none resize-y"
          placeholder="HTML content..."
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={updateContent}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onFocus={() => { setIsFocused(true); setShowEmojiPicker(false); setShowColorPicker(false); }}
          onBlur={() => setIsFocused(false)}
          className="w-full px-8 py-6 min-h-[500px] focus:outline-none text-gray-900 dark:text-gray-100 leading-relaxed"
          style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
          data-placeholder={placeholder}
        />
      )}

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .dark [contenteditable]:empty:before {
          color: #6b7280;
        }
        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 1.5rem 0 0.75rem;
          color: inherit;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }
        [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 1.25rem 0 0.5rem;
          color: inherit;
        }
        [contenteditable] h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem;
          color: inherit;
        }
        [contenteditable] p {
          margin: 0.75rem 0;
          line-height: 1.8;
        }
        [contenteditable] ul {
          list-style: disc;
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }
        [contenteditable] ol {
          list-style: decimal;
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #3b82f6;
          padding: 0.5rem 1rem;
          margin: 1rem 0;
          background: #eff6ff;
          border-radius: 0 8px 8px 0;
          color: #1e40af;
          font-style: italic;
        }
        .dark [contenteditable] blockquote {
          background: rgba(59,130,246,0.1);
          color: #93c5fd;
        }
        [contenteditable] pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          overflow-x: auto;
          font-family: monospace;
          font-size: 0.875rem;
        }
        [contenteditable] a {
          color: #2563eb;
          text-decoration: underline;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
        [contenteditable] hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 1.5rem 0;
        }
      `}</style>
    </div>
  );
}

function ToolbarBtn({ icon, onClick, title, active }: { icon: React.ReactNode; onClick?: () => void; title: string; active?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
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

function Divider() {
  return <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />;
}
