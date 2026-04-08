import { useEffect, useRef, useState } from 'react';
import { X, Minimize2, Maximize2, Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VideoAdConfig {
  videoUrl: string;
  title?: string;
  ctaUrl?: string;
  ctaText?: string;
  posterUrl?: string;
}

function getVisitorId(): string {
  let id = localStorage.getItem('__vid__');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('__vid__', id);
  }
  return id;
}

async function trackVideoAdEvent(event: 'impression' | 'click' | 'dismiss') {
  try {
    await supabase.from('ad_events').insert({
      slot: 'video_ad',
      event_type: event,
      visitor_id: getVisitorId(),
      page_path: window.location.pathname,
      revenue: 0,
      platform: 'video',
    });
  } catch {
    // silently ignore
  }
}

export default function VideoAdPlayer() {
  const [config, setConfig]           = useState<VideoAdConfig | null>(null);
  const [visible, setVisible]         = useState(false);
  const [minimized, setMinimized]     = useState(false);
  const [muted, setMuted]             = useState(true);
  const [dismissed, setDismissed]     = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const impressionTracked = useRef(false);

  // ── Load video ad config from Supabase ────────────────────────────────────
  useEffect(() => {
    // Skip if already dismissed this session
    if (sessionStorage.getItem('video_ad_dismissed')) return;

    supabase
      .from('ad_settings')
      .select('code, is_enabled')
      .eq('slot', 'video_ad')
      .eq('is_enabled', true)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.code) return;
        try {
          const parsed: VideoAdConfig = JSON.parse(data.code);
          if (parsed.videoUrl) setConfig(parsed);
        } catch {
          // code is a plain URL
          if (data.code.startsWith('http')) {
            setConfig({ videoUrl: data.code });
          }
        }
      });
  }, []);

  // ── Trigger: show after first scroll ≥ 200px ─────────────────────────────
  useEffect(() => {
    if (!config || hasTriggered) return;

    const onScroll = () => {
      if (window.scrollY > 200 && !hasTriggered) {
        setHasTriggered(true);
        // Small delay so the animation is visible
        setTimeout(() => setVisible(true), 300);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Also trigger on load if already scrolled
    if (window.scrollY > 200) onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, [config, hasTriggered]);

  // ── Auto-play when visible ────────────────────────────────────────────────
  useEffect(() => {
    if (visible && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});

      if (!impressionTracked.current) {
        impressionTracked.current = true;
        trackVideoAdEvent('impression');
      }
    }
  }, [visible]);

  // ── Sync muted state to video element ────────────────────────────────────
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const handleDismiss = () => {
    if (videoRef.current) videoRef.current.pause();
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem('video_ad_dismissed', '1');
    trackVideoAdEvent('dismiss');
  };

  const handleCTA = () => {
    trackVideoAdEvent('click');
    if (config?.ctaUrl) window.open(config.ctaUrl, '_blank', 'noopener,noreferrer');
  };

  if (!config || dismissed) return null;

  // ── Dimensions ────────────────────────────────────────────────────────────
  // Desktop: 304×171 (16:9), mobile: 220×124
  const playerW  = minimized ? 'w-56 sm:w-72' : 'w-[220px] sm:w-[304px]';
  const videoH   = minimized ? 'h-0 overflow-hidden' : 'h-[124px] sm:h-[171px]';

  return (
    <>
      {/* Invisible sentinel for observers — not used directly (scroll-based trigger above) */}
      <div ref={sentinelRef} className="sr-only" aria-hidden />

      {/* Player wrapper ─ fixed, transitions in from the right */}
      <div
        role="complementary"
        aria-label="Video advertisement"
        className={[
          'fixed z-50 transition-all duration-500 ease-out',
          // Position: bottom-right on mobile, top-right on desktop (below nav ~64px)
          'bottom-4 right-3 sm:bottom-auto sm:top-[72px] sm:right-4',
          playerW,
          visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none',
        ].join(' ')}
      >
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          style={{ background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(8px)' }}
        >
          {/* ── Title bar ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-3 py-2 bg-black/40">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold select-none">
              Sponsored
            </span>
            {config.title && (
              <span className="text-[11px] text-gray-300 font-medium truncate mx-2 flex-1 line-clamp-1">
                {config.title}
              </span>
            )}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setMuted(v => !v)}
                title={muted ? 'Unmute' : 'Mute'}
                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
              <button
                onClick={() => setMinimized(v => !v)}
                title={minimized ? 'Expand' : 'Minimize'}
                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>
              <button
                onClick={handleDismiss}
                title="Close ad"
                className="p-1 rounded-full text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* ── Video ─────────────────────────────────────────────────── */}
          <div className={`relative transition-all duration-300 ${videoH}`}>
            <video
              ref={videoRef}
              src={config.videoUrl}
              poster={config.posterUrl}
              muted
              autoPlay
              playsInline
              loop
              className="w-full h-full object-cover"
              aria-label={config.title || 'Advertisement video'}
            />

            {/* Unmute overlay hint — fades away after 3s */}
            {muted && visible && !minimized && (
              <div className="absolute inset-0 flex items-end justify-start p-2 pointer-events-none">
                <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full">
                  🔇 Tap 🔈 to unmute
                </span>
              </div>
            )}
          </div>

          {/* ── CTA bar ───────────────────────────────────────────────── */}
          {!minimized && config.ctaUrl && (
            <button
              onClick={handleCTA}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white transition-colors"
              style={{ background: 'linear-gradient(90deg,#347c25,#4caf38)' }}
            >
              <ExternalLink size={12} />
              {config.ctaText || 'Learn More'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
