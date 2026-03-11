import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

function getVisitorId(): string {
  let id = localStorage.getItem('__vid__');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('__vid__', id);
  }
  return id;
}

async function trackAdEvent(slot: string, eventType: 'impression' | 'click', platform: string) {
  try {
    await supabase.from('ad_events').insert({
      slot,
      event_type: eventType,
      visitor_id: getVisitorId(),
      page_path: window.location.pathname,
      revenue: 0,
      platform,
    });
  } catch {
    // silently ignore tracking failures
  }
}

interface AdSlot {
  id: string;
  slot: string;
  code: string;
  is_enabled: boolean;
  platform: string;
}

let cachedSlots: AdSlot[] | null = null;
let fetchPromise: Promise<AdSlot[]> | null = null;

async function fetchAdSlots(): Promise<AdSlot[]> {
  if (cachedSlots !== null) return cachedSlots;
  if (fetchPromise) return fetchPromise;

  fetchPromise = supabase
    .from('ad_settings')
    .select('id, slot, code, is_enabled, platform')
    .eq('is_enabled', true)
    .then(({ data }) => {
      cachedSlots = (data || []).filter((s) => s.code && s.code.trim().length > 0);
      fetchPromise = null;
      return cachedSlots;
    });

  return fetchPromise;
}

interface AdSlotProps {
  slot: string;
  className?: string;
}

export function AdSlotRenderer({ slot, className }: AdSlotProps) {
  const [adSlot, setAdSlot] = useState<AdSlot | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionTracked = useRef(false);

  useEffect(() => {
    fetchAdSlots().then((slots) => {
      const match = slots.find((s) => s.slot === slot);
      if (match) setAdSlot(match);
    });
  }, [slot]);

  useEffect(() => {
    if (!adSlot?.code || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const range = document.createRange();
    range.selectNode(container);
    const fragment = range.createContextualFragment(adSlot.code);

    const scripts = Array.from(fragment.querySelectorAll('script'));
    const nonScripts = Array.from(fragment.childNodes).filter(
      (n) => !(n instanceof HTMLElement && n.tagName === 'SCRIPT')
    );

    nonScripts.forEach((n) => container.appendChild(n));

    scripts.forEach((script) => {
      const newScript = document.createElement('script');
      Array.from(script.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (!script.src) newScript.textContent = script.textContent;
      container.appendChild(newScript);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !impressionTracked.current) {
          impressionTracked.current = true;
          trackAdEvent(slot, 'impression', adSlot.platform);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(container);

    const handleClick = () => { trackAdEvent(slot, 'click', adSlot.platform); };
    container.addEventListener('click', handleClick);

    return () => {
      observer.disconnect();
      container.removeEventListener('click', handleClick);
    };
  }, [adSlot, slot]);

  if (!adSlot?.code) return null;

  return <div ref={containerRef} className={className} data-ad-slot={slot} />;
}

export function HeadAdInjector() {
  useEffect(() => {
    fetchAdSlots().then((slots) => {
      const headSlot = slots.find((s) => s.slot === 'head');
      if (!headSlot || !headSlot.code) return;

      const existingMarker = document.getElementById('__ad_head_injected__');
      if (existingMarker) return;

      const marker = document.createElement('meta');
      marker.id = '__ad_head_injected__';
      document.head.appendChild(marker);

      const range = document.createRange();
      range.selectNode(document.head);
      const fragment = range.createContextualFragment(headSlot.code);

      const scripts = Array.from(fragment.querySelectorAll('script'));
      const nonScripts = Array.from(fragment.childNodes).filter(
        (n) => !(n instanceof HTMLElement && n.tagName === 'SCRIPT')
      );

      nonScripts.forEach((n) => document.head.appendChild(n));

      scripts.forEach((script) => {
        const newScript = document.createElement('script');
        Array.from(script.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (!script.src) newScript.textContent = script.textContent;
        document.head.appendChild(newScript);
      });
    });
  }, []);

  return null;
}
