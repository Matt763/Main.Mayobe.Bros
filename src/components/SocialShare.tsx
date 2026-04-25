import { useState, useRef, useEffect } from 'react';
import { Link2, Check, Share2, X } from 'lucide-react';

interface Props {
  url?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'ghost';
}

/* ── SVG brand icons ─────────────────────────────────────────────────── */

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.985 3.163 1.893 1.383-.075 3.018-.712 3.289-3.55a10.1 10.1 0 0 0-2.797-.507Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

/* ── Platform list ───────────────────────────────────────────────────── */

const PLATFORMS = [
  {
    name: 'WhatsApp',
    color: '#25D366',
    Icon: WhatsAppIcon,
    getUrl: (t: string, u: string) => `https://wa.me/?text=${encodeURIComponent(t + ' ' + u)}`,
  },
  {
    name: 'X',
    color: '#000000',
    Icon: XIcon,
    getUrl: (t: string, u: string) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}`,
  },
  {
    name: 'Facebook',
    color: '#1877F2',
    Icon: FacebookIcon,
    getUrl: (_t: string, u: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
  },
  {
    name: 'Telegram',
    color: '#2AABEE',
    Icon: TelegramIcon,
    getUrl: (t: string, u: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
  },
  {
    name: 'Threads',
    color: '#101010',
    Icon: ThreadsIcon,
    getUrl: (t: string, u: string) =>
      `https://www.threads.net/intent/post?text=${encodeURIComponent(t + ' ' + u)}`,
  },
  {
    name: 'Instagram',
    color: '#E1306C',
    Icon: InstagramIcon,
    getUrl: null, // no web share URL — copy link instead
  },
] as const;

/* ── Component ───────────────────────────────────────────────────────── */

export default function SocialShare({ url, title, variant = 'default' }: Props) {
  const [copied, setCopied]   = useState(false);
  const [open, setOpen]       = useState(false);
  const containerRef          = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isGhost = variant === 'ghost';

  /* base classes shared by every button */
  const base =
    'group relative flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500';

  const ghostIdle =
    'bg-gray-900/10 dark:bg-white/20 backdrop-blur-sm border border-gray-900/30 dark:border-white/30 text-gray-900 dark:text-white hover:border-transparent hover:text-white';
  const defaultIdle =
    'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 shadow-sm hover:shadow-md hover:border-transparent hover:text-white';

  /* ── Collapsed: single Share button ── */
  if (!open) {
    return (
      <div ref={containerRef}>
        <button
          onClick={() => setOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            isGhost
              ? 'text-gray-700/80 dark:text-white/70 hover:text-gray-900 dark:hover:text-white border border-gray-900/30 dark:border-white/30 hover:border-gray-900/60 dark:hover:border-white/60 backdrop-blur-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
          }`}
        >
          <Share2 size={14} />
          <span>Share</span>
        </button>
      </div>
    );
  }

  /* ── Expanded: full icons panel ── */
  return (
    <div ref={containerRef} className="flex flex-col gap-2.5">
      {/* Header row: label + close */}
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-bold uppercase tracking-widest select-none ${
          isGhost ? 'text-gray-600 dark:text-white/60' : 'text-gray-400 dark:text-gray-500'
        }`}>
          Share this article
        </p>
        <button
          onClick={() => setOpen(false)}
          className={`p-1 rounded-full transition-colors ${
            isGhost ? 'text-gray-600 dark:text-white/50 hover:text-gray-900 dark:hover:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
          aria-label="Close share panel"
        >
          <X size={13} />
        </button>
      </div>

      {/* Button row */}
      <div className="flex flex-wrap items-center gap-2">

        {PLATFORMS.map(({ name, color, Icon, getUrl }, idx) => {
          const isInstagram = getUrl === null;
          const delay = `${idx * 50}ms`;

          const button = (
            <button
              key={name}
              onClick={isInstagram ? copyLink : undefined}
              title={isInstagram ? 'Copy link (for Instagram)' : `Share on ${name}`}
              className={`${base} ${isGhost ? ghostIdle : defaultIdle}`}
              style={{ animationDelay: delay }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = color;
                if (!isGhost) e.currentTarget.style.borderColor = color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '';
                if (!isGhost) e.currentTarget.style.borderColor = '';
              }}
            >
              <span className="w-4 h-4 flex-shrink-0">
                <Icon />
              </span>
              {/* Tooltip */}
              <span
                className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg"
              >
                {isInstagram ? 'Copy link' : name}
              </span>
            </button>
          );

          if (isInstagram) return button;

          return (
            <a
              key={name}
              href={getUrl(title, shareUrl)}
              target="_blank"
              rel="noopener noreferrer"
              title={`Share on ${name}`}
              className={`${base} ${isGhost ? ghostIdle : defaultIdle}`}
              style={{ animationDelay: delay }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = color;
                if (!isGhost) e.currentTarget.style.borderColor = color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '';
                if (!isGhost) e.currentTarget.style.borderColor = '';
              }}
            >
              <span className="w-4 h-4 flex-shrink-0">
                <Icon />
              </span>
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
                {name}
              </span>
            </a>
          );
        })}

        {/* Copy Link — always-visible dedicated button */}
        <button
          onClick={copyLink}
          title="Copy link"
          className={`${base} px-3 w-auto gap-1.5 rounded-full text-xs font-semibold ${
            copied
              ? 'bg-green-500 border-green-500 text-white scale-105 shadow-md'
              : isGhost
                ? `${ghostIdle}`
                : `bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 shadow-sm hover:shadow-md hover:!bg-indigo-600 hover:!border-indigo-600 hover:!text-white`
          }`}
          onMouseEnter={e => {
            if (!copied) {
              e.currentTarget.style.backgroundColor = '#6366f1';
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.color = 'white';
            }
          }}
          onMouseLeave={e => {
            if (!copied) {
              e.currentTarget.style.backgroundColor = '';
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.color = '';
            }
          }}
        >
          {copied ? <Check size={13} className="flex-shrink-0" /> : <Link2 size={13} className="flex-shrink-0" />}
          <span className="whitespace-nowrap">{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
      </div>
    </div>
  );
}
