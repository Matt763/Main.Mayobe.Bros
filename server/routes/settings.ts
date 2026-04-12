import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseClient } from '../utils/supabase.js';
import { invalidateApiKeyCache } from '../utils/api-keys.js';

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
    const incoming = req.body;

    // Preserve existing aiKeys when the incoming value is masked (••••) or empty
    if (incoming.aiKeys) {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .maybeSingle();

      const stored = existing?.value ? JSON.parse(existing.value) : {};
      const storedKeys: Record<string, string> = stored.aiKeys || {};

      const mask = (val: string | undefined, stored: string) =>
        !val || val.startsWith('•') ? stored : val;

      incoming.aiKeys = {
        claudeKey: mask(incoming.aiKeys.claudeKey, storedKeys.claudeKey || ''),
        openaiKey:  mask(incoming.aiKeys.openaiKey,  storedKeys.openaiKey  || ''),
        geminiKey:  mask(incoming.aiKeys.geminiKey,  storedKeys.geminiKey  || ''),
      };
    }

    const settingsJson = JSON.stringify(incoming);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: SETTINGS_KEY, value: settingsJson, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;

    invalidateApiKeyCache();
    res.json(incoming);
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
