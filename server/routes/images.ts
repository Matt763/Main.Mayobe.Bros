import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseClient, getSupabaseAdmin } from '../utils/supabase.js';
import { processAndStoreImage } from '../lib/media/image-variants.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

router.post('/upload', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const supabase = getSupabaseAdmin();
    const baseName = (req.file.originalname || `upload-${Date.now()}`).replace(/\.[^.]+$/, '');

    // Multi-variant pipeline (WebP+AVIF at 4 widths + original archive).
    // Returns { url: largest-WebP, variants: { webp:{...}, avif:{...}, original } }
    const result = await processAndStoreImage(req.file.buffer, baseName);

    const { data: mediaRecord, error: dbError } = await supabase
      .from('media_library')
      .insert({
        filename:          baseName,
        original_filename: req.file.originalname,
        file_path:         result.variants.original,   // archive URL
        file_url:          result.url,                  // legacy: largest WebP
        file_type:         'image/webp',
        file_size:         result.variants.size,
        source:            'upload',
        variants:          result.variants,
      })
      .select()
      .single();

    if (dbError) console.error('DB insert error:', dbError);

    res.json({
      ok:        true,
      url:       result.url,
      fileUrl:   result.url,
      variants:  result.variants,
      filename:  baseName,
      originalFilename: req.file.originalname,
      size:      result.variants.size,
      mimetype:  'image/webp',
      id:        mediaRecord?.id,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image', detail: (error as Error).message });
  }
});

// Upload a base64-encoded image (e.g. from AI generation) — runs the same
// multi-variant pipeline as the multer upload.
router.post('/upload-base64', requireAuth, async (req, res) => {
  try {
    const { base64, label = 'ai-generated' } = req.body;
    if (!base64) return res.status(400).json({ error: 'base64 field is required' });

    const inputBuffer = Buffer.from(base64, 'base64');
    const supabase = getSupabaseAdmin();
    const baseName = `${label}-${Date.now()}`;

    const result = await processAndStoreImage(inputBuffer, baseName);

    const { data: mediaRecord, error: dbError } = await supabase
      .from('media_library')
      .insert({
        filename:          baseName,
        original_filename: baseName,
        file_path:         result.variants.original,
        file_url:          result.url,
        file_type:         'image/webp',
        file_size:         result.variants.size,
        source:            'ai-generated',
        variants:          result.variants,
      })
      .select()
      .single();

    if (dbError) console.error('DB insert error:', dbError);

    res.json({
      ok:       true,
      url:      result.url,
      fileUrl:  result.url,
      variants: result.variants,
      filename: baseName,
      id:       mediaRecord?.id,
    });
  } catch (error) {
    console.error('Error uploading base64 image:', error);
    res.status(500).json({ error: 'Failed to upload image', detail: (error as Error).message });
  }
});

router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('media_library')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching media library:', error);
      return res.status(500).json({ error: 'Failed to fetch images' });
    }

    const images = (data || []).map((item) => ({
      id: item.id,
      filename: item.filename,
      originalFilename: item.original_filename,
      fileUrl: item.file_url,
      fileType: item.file_type,
      fileSize: item.file_size,
      width: item.width || item.variants?.width || 0,
      height: item.height || item.variants?.height || 0,
      source: item.source || 'upload',
      createdAt: item.created_at,
      url: item.file_url,
      variants: item.variants ?? null,
    }));

    res.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

router.delete('/:filename', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { filename } = req.params;

    const { error: storageError } = await supabase.storage
      .from('media')
      .remove([filename]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    await supabase
      .from('media_library')
      .delete()
      .eq('filename', filename);

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router;
