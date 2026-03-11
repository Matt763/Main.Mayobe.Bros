import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseClient } from '../utils/supabase.js';

const router = Router();

const SETTINGS_KEY = 'site_config';

router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.json(getDefaultSettings());
    }
    try {
      res.json(JSON.parse(data.value));
    } catch {
      res.json(getDefaultSettings());
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const settingsJson = JSON.stringify(req.body);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: SETTINGS_KEY, value: settingsJson, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
    res.json(req.body);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

function getDefaultSettings() {
  return {
    siteName: 'Mayobe Bros',
    siteTagline: 'Empowering minds with knowledge, insights, and stories that inspire',
    siteDescription: 'Your trusted source for quality content on education, business, and technology.',
    siteUrl: 'https://www.mayobebros.com',
    contactEmail: 'info@mayobebros.com',
    siteLogo: '/mayobebroslogo copy copy.png',
    siteFavicon: '',
    themeMode: 'auto',
    primaryColor: '#3B82F6',
    fontFamily: 'Inter',
    seo: { defaultMetaTitle: '', defaultMetaDescription: '', googleAnalyticsId: '', googleSearchConsole: '' },
    socialMedia: { facebook: '', twitter: '', instagram: '', linkedin: '' },
    customCss: '',
    customJs: '',
    footerCopyright: '© 2024 Mayobe Bros. All rights reserved.',
  };
}

export default router;
