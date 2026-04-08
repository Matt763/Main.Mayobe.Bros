import { useState, useEffect, useRef, useCallback } from 'react';
import { List, ChevronDown, ChevronUp } from 'lucide-react';

// Active brand green — matches site design system
const ACTIVE_COLOR = '#347c25';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface Props {
  contentHtml: string;
}

function extractHeadings(html: string): TocItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = doc.querySelectorAll('h2, h3, h4');
  const items: TocItem[] = [];

  headings.forEach((h, i) => {
    const text = h.textContent?.trim() || '';
    if (!text) return;
    const level = parseInt(h.tagName[1]);
    const id = `heading-${i}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    items.push({ id, text, level });
  });

  return items;
}

export default function TableOfContents({ contentHtml }: Props) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState('');
  const [isOpen, setIsOpen]     = useState(false); // mobile: collapsed by default
  const [desktopOpen, setDesktopOpen] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const items = extractHeadings(contentHtml);
    setHeadings(items);
  }, [contentHtml]);

  // Inject IDs into rendered headings + observe for active section
  useEffect(() => {
    if (headings.length === 0) return;

    const contentEl = document.querySelector('.prose, .post-content, .article-content, article');
    if (!contentEl) return;

    const allHeadings = contentEl.querySelectorAll('h2, h3, h4');
    allHeadings.forEach((h, i) => {
      const text = h.textContent?.trim() || '';
      const id = `heading-${i}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      h.setAttribute('id', id);
    });

    if (observerRef.current) observerRef.current.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-70px 0px -55% 0px', threshold: 0 }
    );

    observerRef.current = observer;
    allHeadings.forEach(h => { if (h.id) observer.observe(h); });

    return () => observer.disconnect();
  }, [headings]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  const handleMobileClick = useCallback((id: string) => {
    scrollTo(id);
    setIsOpen(false);
  }, [scrollTo]);

  if (headings.length < 2) return null;

  const activeHeading = headings.find(h => h.id === activeId);

  return (
    <>
      {/* ── DESKTOP — sticky sidebar ────────────────────────────────────── */}
      <div className="hidden lg:block sticky top-24">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {/* Header */}
          <button
            onClick={() => setDesktopOpen(v => !v)}
            className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-4 rounded-full" style={{ background: ACTIVE_COLOR }} />
              <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                Table of Contents
              </span>
            </div>
            {desktopOpen
              ? <ChevronUp size={14} className="text-gray-400 transition-transform" />
              : <ChevronDown size={14} className="text-gray-400 transition-transform" />
            }
          </button>

          {/* Nav list */}
          {desktopOpen && (
            <nav
              className="px-2 pb-3 space-y-0.5 overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
              {headings.map((h) => {
                const isActive = activeId === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => scrollTo(h.id)}
                    className={[
                      'group block w-full text-left text-[13px] py-2 pr-3 rounded-xl transition-all duration-200',
                      h.level === 2 ? 'pl-3' : h.level === 3 ? 'pl-6' : 'pl-9',
                      isActive
                        ? 'font-semibold'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200',
                    ].join(' ')}
                    style={isActive ? { color: ACTIVE_COLOR } : {}}
                  >
                    <div className="flex items-start gap-2">
                      {/* Active indicator bar */}
                      <div
                        className="shrink-0 w-0.5 rounded-full mt-1 transition-all duration-300"
                        style={{
                          height: '12px',
                          background: isActive ? ACTIVE_COLOR : 'transparent',
                        }}
                      />
                      <div
                        className={[
                          'flex-1 leading-snug rounded-lg px-2 py-1 transition-all duration-200',
                          isActive
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : 'group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50',
                        ].join(' ')}
                      >
                        <span className="line-clamp-2">{h.text}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      {/* ── MOBILE — sticky smart bar ───────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-30">
        <div
          className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm"
        >
          {/* Collapsed header — always visible, shows current section */}
          <button
            onClick={() => setIsOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 min-h-[48px]"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <List size={15} style={{ color: ACTIVE_COLOR, flexShrink: 0 }} />
              <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                {activeHeading?.text || 'Table of Contents'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {/* Reading progress dots */}
              <div className="hidden sm:flex items-center gap-0.5">
                {headings.map((h, i) => (
                  <div
                    key={h.id}
                    className="w-1 h-1 rounded-full transition-colors duration-300"
                    style={{
                      background: h.id === activeId
                        ? ACTIVE_COLOR
                        : headings.indexOf(activeHeading!) > i
                          ? '#a3d99a'
                          : '#d1d5db',
                    }}
                  />
                ))}
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {/* Expanded list */}
          {isOpen && (
            <nav className="max-h-64 overflow-y-auto border-t border-gray-100 dark:border-gray-700 py-2">
              {headings.map((h) => {
                const isActive = activeId === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => handleMobileClick(h.id)}
                    className={[
                      'block w-full text-left text-[13px] py-2.5 px-4 transition-all duration-150',
                      h.level === 2 ? 'pl-5' : h.level === 3 ? 'pl-9' : 'pl-12',
                      isActive
                        ? 'font-semibold border-l-2'
                        : 'text-gray-600 dark:text-gray-400 border-l-2 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800',
                    ].join(' ')}
                    style={isActive ? {
                      color: ACTIVE_COLOR,
                      borderLeftColor: ACTIVE_COLOR,
                      background: 'rgba(52,124,37,0.06)',
                    } : {}}
                  >
                    {h.text}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
