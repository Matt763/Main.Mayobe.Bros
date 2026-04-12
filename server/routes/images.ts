import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseClient, getSupabaseAdmin } from '../utils/supabase.js';

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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = req.file.originalname.split('.').pop();
    const filename = `${uniqueSuffix}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload image to storage' });
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filename);
    const publicUrl = urlData.publicUrl;

    const { data: mediaRecord, error: dbError } = await supabase
      .from('media_library')
      .insert({
        filename,
        original_filename: req.file.originalname,
        file_path: filename,
        file_url: publicUrl,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        source: 'upload',
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
    }

    res.json({
      url: publicUrl,
      fileUrl: publicUrl,
      filename,
      originalFilename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      id: mediaRecord?.id,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload a base64-encoded image (e.g. from AI generation), compress to WebP via sharp
router.post('/upload-base64', requireAuth, async (req, res) => {
  try {
    const { base64, mimeType = 'image/png', label = 'ai-generated' } = req.body;
    if (!base64) return res.status(400).json({ error: 'base64 field is required' });

    const inputBuffer = Buffer.from(base64, 'base64');
    const webpBuffer = await sharp(inputBuffer)
      .webp({ quality: 90 })
      .toBuffer();

    const supabase = getSupabaseAdmin();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${label}-${uniqueSuffix}.webp`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filename, webpBuffer, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload image to storage' });
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filename);
    const publicUrl = urlData.publicUrl;

    const { data: mediaRecord, error: dbError } = await supabase
      .from('media_library')
      .insert({
        filename,
        original_filename: filename,
        file_path: filename,
        file_url: publicUrl,
        file_type: 'image/webp',
        file_size: webpBuffer.length,
        source: 'ai-generated',
      })
      .select()
      .single();

    if (dbError) console.error('DB insert error:', dbError);

    res.json({
      url: publicUrl,
      fileUrl: publicUrl,
      filename,
      id: mediaRecord?.id,
    });
  } catch (error) {
    console.error('Error uploading base64 image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
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
      width: item.width || 0,
      height: item.height || 0,
      source: item.source || 'upload',
      createdAt: item.created_at,
      url: item.file_url,
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
