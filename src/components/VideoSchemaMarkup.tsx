/**
 * VideoSchemaMarkup — JSON-LD VideoObject structured data for SEO.
 *
 * Scans the raw HTML content for YouTube/Vimeo iframes and <video> elements,
 * then injects one VideoObject JSON-LD block for each video found.
 *
 * Usage:
 *   <VideoSchemaMarkup content={post.content} post={post} />
 */

import { useMemo } from 'react';

interface Post {
  title: string;
  content: string;
  excerpt?: string;
  publishedAt?: string;
  updatedAt?: string;
  featuredImage?: string;
  slug?: string;
}

interface Props {
  post: Post;
}

interface VideoData {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  contentUrl?: string;
  embedUrl?: string;
  duration?: string;
}

function extractVideos(post: Post): VideoData[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(post.content || '', 'text/html');
  const videos: VideoData[] = [];

  const uploadDate = post.publishedAt
    ? new Date(post.publishedAt).toISOString()
    : new Date().toISOString();

  const description = post.excerpt
    ? post.excerpt.replace(/<[^>]+>/g, '').slice(0, 300)
    : post.title;

  let index = 0;

  /* ── YouTube iframes ─────────────────────────────────────────── */
  doc.querySelectorAll<HTMLIFrameElement>('iframe[src*="youtube"], iframe[src*="youtu.be"]').forEach(iframe => {
    try {
      const url = new URL(iframe.src);
      const videoId =
        url.searchParams.get('v') ||
        url.pathname.split('/embed/').pop()?.split('?')[0] ||
        '';

      if (!videoId) return;

      videos.push({
        name: index === 0 ? post.title : `${post.title} — Video ${index + 1}`,
        description,
        thumbnailUrl:
          post.featuredImage ||
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        uploadDate,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
      });
      index++;
    } catch {}
  });

  /* ── Vimeo iframes ───────────────────────────────────────────── */
  doc.querySelectorAll<HTMLIFrameElement>('iframe[src*="vimeo.com"]').forEach(iframe => {
    try {
      const url = new URL(iframe.src);
      const videoId = url.pathname.split('/').filter(Boolean).pop() || '';
      if (!videoId) return;

      videos.push({
        name: index === 0 ? post.title : `${post.title} — Video ${index + 1}`,
        description,
        thumbnailUrl: post.featuredImage || 'https://vumbnail.com/${videoId}.jpg',
        uploadDate,
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
        contentUrl: `https://vimeo.com/${videoId}`,
      });
      index++;
    } catch {}
  });

  /* ── HTML5 <video> elements ─────────────────────────────────── */
  doc.querySelectorAll<HTMLVideoElement>('video').forEach(video => {
    const src =
      video.querySelector('source')?.getAttribute('src') || video.getAttribute('src');
    if (!src) return;

    videos.push({
      name: index === 0 ? post.title : `${post.title} — Video ${index + 1}`,
      description,
      thumbnailUrl:
        video.getAttribute('poster') || post.featuredImage || '',
      uploadDate,
      contentUrl: src.startsWith('http') ? src : undefined,
    });
    index++;
  });

  return videos;
}

export default function VideoSchemaMarkup({ post }: Props) {
  const videos = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return extractVideos(post);
  }, [post.content]);

  if (videos.length === 0) return null;

  const jsonLd = videos.map(v => ({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.name,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl,
    uploadDate: v.uploadDate,
    ...(v.contentUrl ? { contentUrl: v.contentUrl } : {}),
    ...(v.embedUrl ? { embedUrl: v.embedUrl } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'Mayobe Bros',
      logo: {
        '@type': 'ImageObject',
        url: 'https://mayobebros.com/mayobebroslogo.png',
      },
    },
  }));

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
