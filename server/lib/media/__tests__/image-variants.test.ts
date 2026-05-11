import { describe, it, expect, beforeEach } from 'vitest';
import sharp from 'sharp';
import { processAndStoreImage, _setStorageMock } from '../image-variants';

async function makePng(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 100, g: 150, b: 200 } },
  }).png().toBuffer();
}

describe('processAndStoreImage', () => {
  const uploads: { path: string; mime: string; size: number }[] = [];

  beforeEach(() => {
    uploads.length = 0;
    _setStorageMock(async (path, buf, mime) => {
      uploads.push({ path, mime, size: buf.length });
      return `https://test/${path}`;
    });
  });

  it('generates 4 widths × 2 formats + original for a 1600×900 source', async () => {
    const src = await makePng(1600, 900);
    const result = await processAndStoreImage(src, 'hero');
    expect(uploads).toHaveLength(9);   // 4 webp + 4 avif + 1 original

    expect(result.variants.webp['400']).toMatch(/\/400\.webp$/);
    expect(result.variants.webp['1600']).toMatch(/\/1600\.webp$/);
    expect(result.variants.avif['400']).toMatch(/\/400\.avif$/);
    expect(result.variants.width).toBe(1600);
    expect(result.variants.height).toBe(900);
    expect(result.url).toContain('/1600.webp');
  });

  it('does not upscale — caps variants at source width', async () => {
    const src = await makePng(500, 300);
    const result = await processAndStoreImage(src, 'small');
    // 400 fits (≤ 500), 800/1200/1600 do not → only 400-width variants
    expect(Object.keys(result.variants.webp).every((w) => Number(w) <= 500)).toBe(true);
    expect(Object.keys(result.variants.webp)).toEqual(['400']);
  });

  it('sets correct MIME types on each variant upload', async () => {
    const src = await makePng(1200, 800);
    await processAndStoreImage(src, 't');
    const webpMimes = uploads.filter((u) => u.path.endsWith('.webp')).map((u) => u.mime);
    const avifMimes = uploads.filter((u) => u.path.endsWith('.avif')).map((u) => u.mime);
    expect(webpMimes.every((m) => m === 'image/webp')).toBe(true);
    expect(avifMimes.every((m) => m === 'image/avif')).toBe(true);
  });

  it('returns the original archive URL in variants.original', async () => {
    const src = await makePng(1200, 800);
    const result = await processAndStoreImage(src, 't');
    expect(result.variants.original).toMatch(/\/original\./);
  });

  it('throws on a corrupt source buffer', async () => {
    await expect(processAndStoreImage(Buffer.from('not an image'), 'broken'))
      .rejects.toThrow();
  });
});
