/** Renders post HTML with embedded [video:<uuid>] tokens.
 *
 *  Splits the HTML at each token. Text chunks pass through DOMPurify (same
 *  config as the legacy single-block render). Token chunks render <VideoPlayer>
 *  using a videos map keyed by id.
 *
 *  If a token references an unknown id, renders a small "Video unavailable"
 *  placeholder so editors notice broken embeds without breaking the layout.
 */

import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { VideoPlayer, type VideoLike } from './VideoPlayer';

const TOKEN_RE = /\[video:([0-9a-f-]{36})\]/gi;

const SANITIZE_CONFIG = {
  ADD_TAGS: ['figure', 'figcaption', 'sub', 'sup', 'iframe'],
  ADD_ATTR: [
    'class', 'target', 'rel', 'title',
    'style',
    'src', 'width', 'height',
    'frameborder', 'allowfullscreen', 'allow',
    'controls', 'autoplay', 'loop', 'playsinline', 'poster',
  ],
  ALLOW_DATA_ATTR: true,
  FORCE_BODY: true,
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

type Part =
  | { kind: 'html'; value: string }
  | { kind: 'video'; id: string };

export interface PostContentProps {
  html: string;
  videos?: Record<string, VideoLike>;
  className?: string;
  contentRef?: React.RefObject<HTMLDivElement | null>;
}

export function extractVideoIds(html: string): string[] {
  const ids = new Set<string>();
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(html)) !== null) {
    ids.add(m[1].toLowerCase());
  }
  return [...ids];
}

export function PostContent({ html, videos = {}, className, contentRef }: PostContentProps) {
  const parts = useMemo<Part[]>(() => {
    const out: Part[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(html)) !== null) {
      if (m.index > last) out.push({ kind: 'html', value: html.slice(last, m.index) });
      out.push({ kind: 'video', id: m[1].toLowerCase() });
      last = m.index + m[0].length;
    }
    if (last < html.length) out.push({ kind: 'html', value: html.slice(last) });
    if (out.length === 0) out.push({ kind: 'html', value: html });
    return out;
  }, [html]);

  return (
    <div ref={contentRef} className={className}>
      {parts.map((p, i) =>
        p.kind === 'html' ? (
          <div
            key={`html-${i}`}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.value, SANITIZE_CONFIG) }}
          />
        ) : videos[p.id] ? (
          <div key={`video-${i}`} className="my-6 rounded-xl overflow-hidden">
            <VideoPlayer video={videos[p.id]} />
          </div>
        ) : (
          <div
            key={`missing-${i}`}
            className="my-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300"
          >
            Video unavailable (id: {p.id.slice(0, 8)})
          </div>
        ),
      )}
    </div>
  );
}

export default PostContent;
