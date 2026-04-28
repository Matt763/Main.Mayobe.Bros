/**
 * usePlyrInit — Premium Plyr video player initialisation hook.
 *
 * Handles:
 *  - HTML5 <video> elements
 *  - YouTube iframes (bare or already wrapped in .plyr__video-embed)
 *  - Vimeo iframes
 *  - IntersectionObserver lazy loading (videos only load when near viewport)
 *  - Play / completion analytics (fire-and-forget POST to /api/video-analytics)
 *  - Full cleanup on unmount / content change
 *
 * Usage:
 *   const contentRef = useRef<HTMLDivElement>(null);
 *   usePlyrInit(contentRef, post.content);  // re-init when content changes
 */

import { useEffect, useRef } from 'react';

/* Global Plyr declaration — loaded via CDN in index.html */
declare global {
  interface Window {
    Plyr: new (target: Element, options?: PlyrOptions) => PlyrInstance;
  }
}

interface PlyrOptions {
  controls?: string[];
  settings?: string[];
  autoplay?: boolean;
  muted?: boolean;
  volume?: number;
  seekTime?: number;
  keyboard?: { focused: boolean; global: boolean };
  tooltips?: { controls: boolean; seek: boolean };
  ratio?: string;
  youtube?: Record<string, any>;
  vimeo?: Record<string, any>;
  captions?: { active: boolean; language: string; update: boolean };
  storage?: { enabled: boolean; key: string };
  speed?: { selected: number; options: number[] };
}

interface PlyrInstance {
  on(event: string, cb: () => void): void;
  off(event: string, cb: () => void): void;
  destroy(): void;
  currentTime: number;
  duration: number;
  paused: boolean;
  source: { src: string };
}

/* ── Plyr options ─────────────────────────────────────────────────────────── */
const PLYR_OPTIONS: PlyrOptions = {
  controls: [
    'play-large',
    'play',
    'progress',
    'current-time',
    'mute',
    'volume',
    'captions',
    'settings',
    'pip',
    'fullscreen',
  ],
  settings: ['captions', 'quality', 'speed'],
  autoplay: false,
  muted: false,
  volume: 1,
  seekTime: 10,
  keyboard: { focused: true, global: false },
  tooltips: { controls: true, seek: true },
  ratio: '16:9',
  captions: { active: false, language: 'auto', update: false },
  storage: { enabled: true, key: 'plyr-mayobe' },
  speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
  youtube: {
    noCookie: false,
    rel: 0,
    showinfo: 0,
    iv_load_policy: 3,
    modestbranding: 1,
    origin: 'https://mayobebros.com',
  },
  vimeo: {
    byline: false,
    portrait: false,
    title: false,
    speed: true,
    transparent: false,
  },
};

/* ── Hook ─────────────────────────────────────────────────────────────────── */
export function usePlyrInit(
  containerRef: React.RefObject<HTMLElement | null>,
  contentDep: string,
): void {
  const playersRef  = useRef<PlyrInstance[]>([]);
  const observersRef = useRef<IntersectionObserver[]>([]);

  useEffect(() => {
    /* Tear down previous instance */
    playersRef.current.forEach(p => { try { p.destroy(); } catch {} });
    observersRef.current.forEach(o => o.disconnect());
    playersRef.current  = [];
    observersRef.current = [];

    const container = containerRef.current;
    if (!container) return;

    /* Plyr is loaded via a deferred CDN script — use its load event instead of polling */
    let extraCleanup: (() => void) | undefined;

    if (window.Plyr) {
      /* Already available (cached load or hot-reload) */
      initAll(container);
    } else {
      const plyrScript = document.querySelector<HTMLScriptElement>('script[src*="plyr"]');
      if (plyrScript) {
        const onLoad = () => initAll(container);
        plyrScript.addEventListener('load', onLoad, { once: true });
        extraCleanup = () => plyrScript.removeEventListener('load', onLoad);
      } else {
        /* Fallback: infrequent poll when no matching script tag is found */
        let attempts = 0;
        const poll = setInterval(() => {
          if (window.Plyr) {
            clearInterval(poll);
            initAll(container);
          } else if (++attempts > 20) {
            clearInterval(poll);
            console.warn('[usePlyrInit] Plyr CDN script did not load in time.');
          }
        }, 500);
        extraCleanup = () => clearInterval(poll);
      }
    }

    return () => {
      extraCleanup?.();
      playersRef.current.forEach(p => { try { p.destroy(); } catch {} });
      observersRef.current.forEach(o => o.disconnect());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentDep]);

  /* ── Main init: scan container for all video targets ──────────────────── */
  function initAll(container: HTMLElement) {
    /* 1. Bare YouTube iframes — wrap them in .plyr__video-embed */
    container
      .querySelectorAll<HTMLIFrameElement>(
        'iframe[src*="youtube.com/embed"]:not(.plyr-done), iframe[src*="youtube-nocookie.com"]:not(.plyr-done)',
      )
      .forEach(iframe => {
        if (iframe.closest('.plyr__video-embed')) return; // already wrapped

        /* Upgrade iframe src: add required params */
        try {
          const url = new URL(iframe.src);
          url.searchParams.set('enablejsapi', '1');
          url.searchParams.set('origin', 'https://mayobebros.com');
          url.searchParams.set('modestbranding', '1');
          url.searchParams.set('rel', '0');
          url.searchParams.set('iv_load_policy', '3');
          iframe.src = url.toString();
        } catch {}

        /* Set necessary iframe attributes */
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; web-share');

        /* Wrap */
        const wrapper = document.createElement('div');
        wrapper.className = 'plyr__video-embed js-plyr';
        wrapper.style.borderRadius = '12px';
        wrapper.style.overflow = 'hidden';
        iframe.parentNode?.insertBefore(wrapper, iframe);
        wrapper.appendChild(iframe);

        schedulePlyr(wrapper, 'youtube-embed');
      });

    /* 2. Already-wrapped .plyr__video-embed (editor-generated) */
    container
      .querySelectorAll<HTMLElement>('.plyr__video-embed:not(.plyr-done)')
      .forEach(el => schedulePlyr(el, 'youtube-embed'));

    /* 3. Bare Vimeo iframes */
    container
      .querySelectorAll<HTMLIFrameElement>(
        'iframe[src*="player.vimeo.com"]:not(.plyr-done)',
      )
      .forEach(iframe => {
        if (iframe.closest('.plyr__video-embed')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'plyr__video-embed js-plyr';
        iframe.parentNode?.insertBefore(wrapper, iframe);
        wrapper.appendChild(iframe);

        schedulePlyr(wrapper, 'vimeo-embed');
      });

    /* 4. HTML5 <video> elements */
    container
      .querySelectorAll<HTMLVideoElement>('video:not(.plyr-done)')
      .forEach(video => {
        /* Ensure playsinline for mobile */
        video.setAttribute('playsinline', '');
        schedulePlyr(video, 'video');
      });
  }

  /* ── Lazy-load via IntersectionObserver ───────────────────────────────── */
  function schedulePlyr(el: HTMLElement, type: string) {
    /* Show styled placeholder while off-screen */
    if (!el.classList.contains('plyr__video-embed')) {
      el.classList.add('plyr-pending');
    }

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          observer.disconnect();
          el.classList.remove('plyr-pending');
          el.classList.add('plyr-done');

          try {
            const player = new window.Plyr(el, PLYR_OPTIONS);
            playersRef.current.push(player);
            attachAnalytics(player, el, type);
          } catch (err) {
            console.warn('[usePlyrInit] Plyr init error:', err);
          }
        }
      },
      { rootMargin: '150px 0px', threshold: 0.01 },
    );

    observersRef.current.push(observer);
    observer.observe(el);
  }

  /* ── Analytics tracking ───────────────────────────────────────────────── */
  function attachAnalytics(player: PlyrInstance, el: HTMLElement, type: string) {
    let watchStart  = 0;
    let totalWatch  = 0;
    let hasPlayed   = false;

    const src = resolveVideoSrc(el);
    const page = window.location.pathname;

    player.on('play', () => {
      watchStart = Date.now();
      if (!hasPlayed) {
        hasPlayed = true;
        sendAnalytic('play', src, page, type, 0);
      }
    });

    player.on('pause', () => {
      if (watchStart) {
        totalWatch += Date.now() - watchStart;
        watchStart = 0;
      }
    });

    player.on('ended', () => {
      if (watchStart) { totalWatch += Date.now() - watchStart; watchStart = 0; }
      sendAnalytic('complete', src, page, type, Math.round(totalWatch / 1000));
    });
  }

  function resolveVideoSrc(el: HTMLElement): string {
    if (el instanceof HTMLVideoElement) {
      return el.querySelector('source')?.getAttribute('src') || el.src || 'unknown';
    }
    const iframe = el.querySelector('iframe');
    if (iframe) {
      try {
        const url = new URL(iframe.src);
        // Return just the path+id for YouTube/Vimeo — skip auth params
        return url.hostname + url.pathname;
      } catch {}
    }
    return 'unknown';
  }

  function sendAnalytic(
    event: string,
    videoSrc: string,
    page: string,
    type: string,
    watchTimeSec: number,
  ) {
    try {
      fetch('/api/video-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, videoSrc, page, type, watchTimeSec }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }
}
