import { useState, useEffect, useRef, useCallback } from 'react';
import { List, ChevronUp } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const items = extractHeadings(contentHtml);
    setHeadings(items);
  }, [contentHtml]);

  useEffect(() => {
    if (headings.length === 0) return;

    const contentEl = document.querySelector('.prose, .post-content, article');
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
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    observerRef.current = observer;

    allHeadings.forEach(h => {
      if (h.id) observer.observe(h);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  if (headings.length < 2) return null;

  return (
    <>
      <div className="hidden lg:block sticky top-24">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 max-h-[calc(100vh-120px)] overflow-y-auto">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full mb-3"
          >
            <div className="flex items-center gap-2">
              <List size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-bold text-gray-900 dark:text-white">Table of Contents</span>
            </div>
            <ChevronUp
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`}
            />
          </button>

          {isOpen && (
            <nav className="space-y-0.5">
              {headings.map((h) => (
                <button
                  key={h.id}
                  onClick={() => scrollTo(h.id)}
                  className={`block w-full text-left text-sm py-1.5 pr-2 rounded-lg transition-all duration-200 ${
                    h.level === 2 ? 'pl-3' : h.level === 3 ? 'pl-6' : 'pl-9'
                  } ${
                    activeId === h.id
                      ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-2 border-transparent'
                  }`}
                >
                  <span className="line-clamp-2">{h.text}</span>
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>

      <div className="lg:hidden">
        <details className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <summary className="flex items-center gap-2 cursor-pointer list-none">
            <List size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">Table of Contents</span>
          </summary>
          <nav className="mt-3 space-y-0.5">
            {headings.map((h) => (
              <button
                key={h.id}
                onClick={() => scrollTo(h.id)}
                className={`block w-full text-left text-sm py-1.5 rounded-lg transition-colors ${
                  h.level === 2 ? 'pl-3' : h.level === 3 ? 'pl-6' : 'pl-9'
                } ${
                  activeId === h.id
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {h.text}
              </button>
            ))}
          </nav>
        </details>
      </div>
    </>
  );
}
