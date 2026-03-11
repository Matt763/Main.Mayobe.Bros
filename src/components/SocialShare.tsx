import { useState, useRef, useEffect } from 'react';
import { Share2, Check } from 'lucide-react';

interface SocialShareProps {
  url?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'ghost';
}

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);

const BloggerIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M21.976 24H2.026C.9 24 0 23.1 0 21.976V2.026C0 .9.9 0 2.026 0h19.95C23.1 0 24 .9 24 2.026v19.95C24 23.1 23.1 24 21.976 24zM10.95 5.431H8.812C6.737 5.431 5.05 7.118 5.05 9.193v5.614c0 2.075 1.687 3.762 3.762 3.762h6.376c2.075 0 3.762-1.687 3.762-3.762v-3.13c0-.562-.456-1.018-1.018-1.018h-.681c-.543 0-.993.428-1.016.97-.078 1.783-1.556 3.21-3.354 3.11-1.799-.1-3.17-1.674-3.17-3.474V9.193c0-.562.456-1.018 1.018-1.018h.22c.562 0 1.018-.456 1.018-1.018V6.45c0-.562-.456-1.019-1.017-1.019zm4.05 2.794c-.562 0-1.018-.456-1.018-1.018V6.45c0-.562.456-1.018 1.018-1.018h.012c.562 0 1.018.456 1.018 1.018v.757c0 .562-.456 1.018-1.018 1.018H15z"/>
  </svg>
);

export default function SocialShare({ url, title, description, variant = 'default' }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const panelW = 288;
    const panelH = 220;
    const spaceRight = window.innerWidth - rect.left;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    const left = spaceRight < panelW + 16 ? Math.max(8, rect.right - panelW) : rect.left;
    const top = spaceBelow < panelH + 16 && spaceAbove > panelH ? rect.top - panelH - 8 : rect.bottom + 8;

    setPanelStyle({ position: 'fixed', top, left, zIndex: 9999, width: panelW });
  }, [isOpen]);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || title);

  const platforms = [
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      icon: WhatsAppIcon,
      bg: 'bg-[#25D366] hover:bg-[#1eb854]',
      color: 'text-white',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: FacebookIcon,
      bg: 'bg-[#1877F2] hover:bg-[#0d6de0]',
      color: 'text-white',
    },
    {
      name: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: XIcon,
      bg: 'bg-black hover:bg-gray-800',
      color: 'text-white',
    },
    {
      name: 'Instagram',
      href: `https://www.instagram.com/`,
      icon: InstagramIcon,
      bg: 'bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] hover:opacity-90',
      color: 'text-white',
    },
    {
      name: 'Pinterest',
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedDesc}`,
      icon: PinterestIcon,
      bg: 'bg-[#E60023] hover:bg-[#cc001f]',
      color: 'text-white',
    },
    {
      name: 'Blogger',
      href: `https://www.blogger.com/blog-this.g?u=${encodedUrl}&n=${encodedTitle}&t=${encodedDesc}`,
      icon: BloggerIcon,
      bg: 'bg-[#FF5722] hover:bg-[#e64a19]',
      color: 'text-white',
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium text-sm ${
          variant === 'ghost'
            ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        <Share2 size={16} />
        Share
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={panelRef}
            style={panelStyle}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 animate-[fadeIn_0.15s_ease]"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Share this article</p>
              <button
                onClick={() => setIsOpen(false)}
                className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-gray-400 text-xs leading-none">✕</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {platforms.map(({ name, href, icon: Icon, bg, color }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  title={`Share on ${name}`}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all ${bg} ${color} text-center`}
                >
                  <Icon />
                  <span className="text-[10px] font-semibold leading-tight">{name}</span>
                </a>
              ))}
            </div>
            <button
              onClick={copyLink}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {copied ? <Check size={15} /> : <Share2 size={15} />}
              {copied ? 'Link Copied!' : 'Copy Link'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
