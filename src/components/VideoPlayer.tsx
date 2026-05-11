/** Bunny Stream playback component.
 *
 *  Defaults to the Bunny iframe player (handles browser quirks, adaptive
 *  bitrate, AV1/H.265/H.264 codec selection automatically). For callers
 *  who explicitly want native <video>, pass `useNativeVideo`.
 */

import type { CSSProperties } from 'react';

export interface VideoLike {
  id?: string;
  title?: string | null;
  hls_url?: string | null;
  poster_url?: string | null;
  iframe_url?: string | null;
  status?: string;
}

export interface VideoPlayerProps {
  video: VideoLike;
  autoplay?: boolean;
  controls?: boolean;
  /** Use native <video> with HLS source instead of the Bunny iframe.
   *  Cross-browser playback requires HLS.js for non-Safari — not bundled here.
   *  Default false (iframe) handles all browsers transparently. */
  useNativeVideo?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function VideoPlayer({
  video,
  autoplay = false,
  controls = true,
  useNativeVideo = false,
  className,
  style,
}: VideoPlayerProps) {
  // Not ready yet — show poster + status placeholder
  if (video.status && video.status !== 'ready') {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm ${className ?? ''}`}
        style={{ aspectRatio: '16/9', ...style }}
      >
        Video {video.status === 'failed' ? 'failed to encode' : 'is still encoding…'}
      </div>
    );
  }

  // Native <video> path (caller opted in)
  if (useNativeVideo && video.hls_url) {
    return (
      <video
        controls={controls}
        preload="metadata"
        poster={video.poster_url ?? undefined}
        autoPlay={autoplay}
        playsInline
        className={className}
        style={{ width: '100%', aspectRatio: '16/9', ...style }}
      >
        <source src={video.hls_url} type="application/x-mpegURL" />
        Your browser doesn&apos;t support HLS video playback.
      </video>
    );
  }

  // Default: Bunny iframe (best cross-browser, no extra deps)
  if (!video.iframe_url) return null;
  return (
    <iframe
      src={video.iframe_url}
      title={video.title ?? 'Video'}
      loading="lazy"
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      className={className}
      style={{ border: 0, width: '100%', aspectRatio: '16/9', ...style }}
    />
  );
}

export default VideoPlayer;
