/** Responsive <picture> emitter with AVIF + WebP srcset, fallback <img>,
 *  width/height (to prevent CLS), and per-instance priority handling for
 *  hero vs below-the-fold images.
 *
 *  Consumes the `variants` jsonb stored on media_library / posts.featured_image_variants.
 *  When variants are absent (older posts), falls back to a plain <img> on the
 *  legacy single-URL field.
 */

import type { CSSProperties } from 'react';

export interface ImageVariants {
  webp?: Record<string, string>;
  avif?: Record<string, string>;
  width?: number;
  height?: number;
  original?: string;
  size?: number;
}

export interface ResponsiveImageProps {
  variants?: ImageVariants | null;
  fallbackSrc?: string | null;
  alt: string;
  /** Hero / above-the-fold: emits loading="eager" + fetchpriority="high" */
  priority?: boolean;
  /** CSS sizes attribute. Default '100vw' — caller should pass a layout-aware
   *  hint for better browser variant selection (e.g.,
   *  '(min-width: 1024px) 800px, 100vw'). */
  sizes?: string;
  className?: string;
  style?: CSSProperties;
}

function buildSrcset(urls: Record<string, string>): string {
  return Object.entries(urls)
    .map(([w, url]) => `${url} ${w}w`)
    .join(', ');
}

function largestVariant(urls: Record<string, string>): string | null {
  const widths = Object.keys(urls).map(Number).filter((n) => Number.isFinite(n));
  if (widths.length === 0) return null;
  const max = Math.max(...widths);
  return urls[String(max)] ?? null;
}

export function ResponsiveImage({
  variants,
  fallbackSrc,
  alt,
  priority = false,
  sizes = '100vw',
  className,
  style,
}: ResponsiveImageProps) {
  const hasVariants =
    !!variants && (!!variants.webp || !!variants.avif);

  // No variants → plain <img> with the legacy URL
  if (!hasVariants) {
    if (!fallbackSrc) return null;
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        // @ts-expect-error — fetchpriority is a valid HTML attr; React types lag
        fetchpriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={className}
        style={style}
      />
    );
  }

  const v = variants!;
  const imgSrc =
    fallbackSrc ??
    (v.webp ? largestVariant(v.webp) : null) ??
    (v.avif ? largestVariant(v.avif) : null) ??
    '';

  return (
    <picture>
      {v.avif && Object.keys(v.avif).length > 0 && (
        <source type="image/avif" srcSet={buildSrcset(v.avif)} sizes={sizes} />
      )}
      {v.webp && Object.keys(v.webp).length > 0 && (
        <source type="image/webp" srcSet={buildSrcset(v.webp)} sizes={sizes} />
      )}
      <img
        src={imgSrc}
        alt={alt}
        width={v.width}
        height={v.height}
        loading={priority ? 'eager' : 'lazy'}
        // @ts-expect-error — fetchpriority is a valid HTML attr; React types lag
        fetchpriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={className}
        style={style}
      />
    </picture>
  );
}

export default ResponsiveImage;
