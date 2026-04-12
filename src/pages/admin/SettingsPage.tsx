import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../hooks/useRole';
import AdminLayout from '../../components/admin/AdminLayout';
import Toast from '../../components/admin/Toast';
import {
  Save,
  Settings as SettingsIcon,
  Palette,
  Globe,
  Share2,
  Code,
  DollarSign,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
  Image,
  Video,
  Play,
  Key,
} from 'lucide-react';

type TabType = 'general' | 'appearance' | 'hero' | 'seo' | 'social' | 'advanced' | 'monetization' | 'aikeys';

interface AdSlot {
  id: string;
  slot: string;
  label: string;
  code: string;
  is_enabled: boolean;
  platform: string;
}

const PLATFORMS = [
  { value: 'custom', label: 'Custom / Other' },
  { value: 'adsense', label: 'Google AdSense' },
  { value: 'adcash', label: 'Adcash' },
  { value: 'adsterra', label: 'Adsterra' },
  { value: 'media_net', label: 'Media.net' },
  { value: 'ezoic', label: 'Ezoic' },
];

const SLOT_DESCRIPTIONS: Record<string, string> = {
  head: 'Code injected inside the <head> tag — use for auto-ads initialization scripts, site verification tags, or global ad library scripts.',
  body_top: 'Code injected immediately after <body> opens — ideal for sticky top banners or above-the-fold placements.',
  body_bottom: 'Code injected just before </body> closes — suitable for footer overlays or lazy-loaded ad units.',
  in_article: 'Ad unit rendered inside article content — shown between paragraphs on post pages.',
  sidebar: 'Ad unit rendered in the sidebar area on desktop viewports.',
  footer: 'Ad unit rendered in the page footer section above the copyright bar.',
};

export default function SettingsPage() {
  const { isCEO, isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [siteName, setSiteName] = useState('');
  const [siteTagline, setSiteTagline] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [siteLogo, setSiteLogo] = useState('');
  const [siteFavicon, setSiteFavicon] = useState('');

  const [themeMode, setThemeMode] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [fontFamily, setFontFamily] = useState('Inter');

  const [defaultMetaTitle, setDefaultMetaTitle] = useState('');
  const [defaultMetaDescription, setDefaultMetaDescription] = useState('');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [googleSearchConsole, setGoogleSearchConsole] = useState('');

  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  const [customCss, setCustomCss] = useState('');
  const [customJs, setCustomJs] = useState('');
  const [footerCopyright, setFooterCopyright] = useState('');

  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [heroMediaType, setHeroMediaType] = useState<'image' | 'video'>('image');
  const [heroImagePreview, setHeroImagePreview] = useState(false);

  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [adSaving, setAdSaving] = useState(false);
  const [previewSlot, setPreviewSlot] = useState<string | null>(null);

  // AI Keys
  const [claudeKey, setClaudeKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [aiKeysSaving, setAiKeysSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadAdSlots();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await api.settings.get();
      setSiteName(settings.siteName || '');
      setSiteTagline(settings.siteTagline || '');
      setSiteDescription(settings.siteDescription || '');
      setSiteUrl(settings.siteUrl || '');
      setContactEmail(settings.contactEmail || '');
      setSiteLogo(settings.siteLogo || '');
      setSiteFavicon(settings.siteFavicon || '');
      setThemeMode(settings.themeMode || 'light');
      setPrimaryColor(settings.primaryColor || '#3B82F6');
      setFontFamily(settings.fontFamily || 'Inter');
      setDefaultMetaTitle(settings.seo?.defaultMetaTitle || '');
      setDefaultMetaDescription(settings.seo?.defaultMetaDescription || '');
      setGoogleAnalyticsId(settings.seo?.googleAnalyticsId || '');
      setGoogleSearchConsole(settings.seo?.googleSearchConsole || '');
      setFacebookUrl(settings.socialMedia?.facebook || '');
      setTwitterUrl(settings.socialMedia?.twitter || '');
      setInstagramUrl(settings.socialMedia?.instagram || '');
      setLinkedinUrl(settings.socialMedia?.linkedin || '');
      setCustomCss(settings.customCss || '');
      setCustomJs(settings.customJs || '');
      setFooterCopyright(settings.footerCopyright || '');
      setHeroImageUrl(settings.hero?.imageUrl || '');
      setHeroVideoUrl(settings.hero?.videoUrl || '');
      setHeroMediaType(settings.hero?.mediaType || 'image');
      // AI keys — show masked placeholder if a key is stored
      setClaudeKey(settings.aiKeys?.claudeKey ? '••••••••••••••••' : '');
      setOpenaiKey(settings.aiKeys?.openaiKey  ? '••••••••••••••••' : '');
      setGeminiKey(settings.aiKeys?.geminiKey  ? '••••••••••••••••' : '');
    } catch {
      setToast({ message: 'Failed to load settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadAdSlots = async () => {
    const { data } = await supabase.from('ad_settings').select('*').order('slot');
    setAdSlots(data || []);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.settings.update({
        siteName, siteTagline, siteDescription, siteUrl, contactEmail, siteLogo, siteFavicon,
        themeMode, primaryColor, fontFamily,
        seo: { defaultMetaTitle, defaultMetaDescription, googleAnalyticsId, googleSearchConsole },
        socialMedia: { facebook: facebookUrl, twitter: twitterUrl, instagram: instagramUrl, linkedin: linkedinUrl },
        customCss, customJs, footerCopyright,
        hero: { imageUrl: heroImageUrl, videoUrl: heroVideoUrl, mediaType: heroMediaType },
      });
      setToast({ message: 'Settings saved successfully', type: 'success' });
    } catch {
      setToast({ message: 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const saveAdSlots = async () => {
    setAdSaving(true);
    try {
      for (const slot of adSlots) {
        await supabase
          .from('ad_settings')
          .update({
            code: slot.code,
            is_enabled: slot.is_enabled,
            platform: slot.platform,
            label: slot.label,
            updated_at: new Date().toISOString(),
          })
          .eq('id', slot.id);
      }
      setToast({ message: 'Ad settings saved', type: 'success' });
    } catch {
      setToast({ message: 'Failed to save ad settings', type: 'error' });
    } finally {
      setAdSaving(false);
    }
  };

  const updateAdSlot = (id: string, field: keyof AdSlot, value: any) => {
    setAdSlots((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const saveAiKeys = async () => {
    setAiKeysSaving(true);
    try {
      // Load current settings first so we don't overwrite other fields
      const current = await api.settings.get();
      await api.settings.update({
        ...current,
        aiKeys: { claudeKey, openaiKey, geminiKey },
      });
      // Reload to get fresh masked values from server
      await loadSettings();
      setToast({ message: 'AI keys saved', type: 'success' });
    } catch {
      setToast({ message: 'Failed to save AI keys', type: 'error' });
    } finally {
      setAiKeysSaving(false);
    }
  };

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'general', label: 'General', icon: SettingsIcon },
    { key: 'appearance', label: 'Appearance', icon: Palette },
    { key: 'hero', label: 'Hero Media', icon: Image },
    { key: 'seo', label: 'SEO', icon: Globe },
    { key: 'social', label: 'Social', icon: Share2 },
    ...(isCEO || isAdmin ? [{ key: 'monetization' as TabType, label: 'Monetization', icon: DollarSign }] : []),
    { key: 'advanced', label: 'Advanced', icon: Code },
    { key: 'aikeys', label: 'AI Keys', icon: Key },
  ];

  const inputClass = 'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelClass = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2';

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Configure your site settings and preferences</p>
          </div>
          {activeTab !== 'monetization' && activeTab !== 'aikeys' && (
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          )}
          {activeTab === 'monetization' && (
            <button
              onClick={saveAdSlots}
              disabled={adSaving}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              <span>{adSaving ? 'Saving...' : 'Save Ad Settings'}</span>
            </button>
          )}
          {activeTab === 'aikeys' && (
            <button
              onClick={saveAiKeys}
              disabled={aiKeysSaving}
              className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              <span>{aiKeysSaving ? 'Saving...' : 'Save AI Keys'}</span>
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-4 font-medium whitespace-nowrap transition-colors text-sm ${
                    activeTab === tab.key
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div><label className={labelClass}>Site Name</label><input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Your Site Name" className={inputClass} /></div>
                <div><label className={labelClass}>Tagline</label><input type="text" value={siteTagline} onChange={(e) => setSiteTagline(e.target.value)} placeholder="A short site description" className={inputClass} /></div>
                <div><label className={labelClass}>Site Description</label><textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} placeholder="Detailed site description" rows={4} className={inputClass} /></div>
                <div><label className={labelClass}>Site URL</label><input type="url" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://www.example.com" className={inputClass} /></div>
                <div><label className={labelClass}>Contact Email</label><input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="contact@example.com" className={inputClass} /></div>
                <div><label className={labelClass}>Logo URL</label><input type="text" value={siteLogo} onChange={(e) => setSiteLogo(e.target.value)} placeholder="/logo.png" className={inputClass} /></div>
                <div><label className={labelClass}>Favicon URL</label><input type="text" value={siteFavicon} onChange={(e) => setSiteFavicon(e.target.value)} placeholder="/favicon.ico" className={inputClass} /></div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <label className={labelClass}>Default Theme</label>
                  <select value={themeMode} onChange={(e) => setThemeMode(e.target.value)} className={inputClass}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Primary Color</label>
                  <div className="flex gap-4">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer" />
                    <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#3B82F6" className={`flex-1 ${inputClass}`} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Font Family</label>
                  <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className={inputClass}>
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Montserrat">Montserrat</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'hero' && (
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <Info size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Hero Media Configuration</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                      Configure the full-screen background on the homepage hero section. Choose between a static image or a looping background video. Changes take effect immediately after saving.
                    </p>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Media Type</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setHeroMediaType('image')}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                        heroMediaType === 'image'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <Image size={16} />
                      Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroMediaType('video')}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                        heroMediaType === 'video'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <Video size={16} />
                      Video
                    </button>
                  </div>
                </div>

                {heroMediaType === 'image' && (
                  <div>
                    <label className={labelClass}>Hero Image URL</label>
                    <input
                      type="text"
                      value={heroImageUrl}
                      onChange={(e) => { setHeroImageUrl(e.target.value); setHeroImagePreview(false); }}
                      placeholder="https://images.pexels.com/photos/..."
                      className={inputClass}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Recommended: 1920×1080 or wider. Pexels, Unsplash, or your own CDN URL.</p>
                    {heroImageUrl && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setHeroImagePreview(!heroImagePreview)}
                          className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Eye size={13} />
                          {heroImagePreview ? 'Hide preview' : 'Show preview'}
                        </button>
                        {heroImagePreview && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-48">
                            <img
                              src={heroImageUrl}
                              alt="Hero preview"
                              className="w-full h-full object-cover"
                              onError={() => setHeroImagePreview(false)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {heroMediaType === 'video' && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Hero Video URL</label>
                      <input
                        type="text"
                        value={heroVideoUrl}
                        onChange={(e) => setHeroVideoUrl(e.target.value)}
                        placeholder="https://example.com/hero-video.mp4"
                        className={inputClass}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">MP4 format recommended. The video will autoplay, loop, and be muted. Keep file size under 20MB for fast load times.</p>
                    </div>
                    <div>
                      <label className={labelClass}>Fallback Image URL (shown while video loads)</label>
                      <input
                        type="text"
                        value={heroImageUrl}
                        onChange={(e) => setHeroImageUrl(e.target.value)}
                        placeholder="https://images.pexels.com/photos/..."
                        className={inputClass}
                      />
                    </div>
                    {heroVideoUrl && (
                      <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <Play size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                          Video will autoplay muted and loop continuously. Ensure the URL is publicly accessible and CORS-enabled. Direct links to MP4 files work best.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold text-sm"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Hero Settings'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div><label className={labelClass}>Default Meta Title</label><input type="text" value={defaultMetaTitle} onChange={(e) => setDefaultMetaTitle(e.target.value)} placeholder="Site Name - Tagline" className={inputClass} /></div>
                <div><label className={labelClass}>Default Meta Description</label><textarea value={defaultMetaDescription} onChange={(e) => setDefaultMetaDescription(e.target.value)} placeholder="Default description for search engines" rows={3} className={inputClass} /></div>
                <div><label className={labelClass}>Google Analytics ID</label><input type="text" value={googleAnalyticsId} onChange={(e) => setGoogleAnalyticsId(e.target.value)} placeholder="G-XXXXXXXXXX" className={inputClass} /></div>
                <div><label className={labelClass}>Google Search Console Verification</label><input type="text" value={googleSearchConsole} onChange={(e) => setGoogleSearchConsole(e.target.value)} placeholder="verification code" className={inputClass} /></div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-6">
                <div><label className={labelClass}>Facebook URL</label><input type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/yourpage" className={inputClass} /></div>
                <div><label className={labelClass}>Twitter/X URL</label><input type="url" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/youraccount" className={inputClass} /></div>
                <div><label className={labelClass}>Instagram URL</label><input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/youraccount" className={inputClass} /></div>
                <div><label className={labelClass}>LinkedIn URL</label><input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/company/yourcompany" className={inputClass} /></div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div><label className={labelClass}>Custom CSS</label><textarea value={customCss} onChange={(e) => setCustomCss(e.target.value)} placeholder="/* Add your custom CSS here */" rows={8} className={`${inputClass} font-mono text-sm`} /></div>
                <div><label className={labelClass}>Custom JavaScript</label><textarea value={customJs} onChange={(e) => setCustomJs(e.target.value)} placeholder="// Add your custom JavaScript here" rows={8} className={`${inputClass} font-mono text-sm`} /></div>
                <div><label className={labelClass}>Footer Copyright Text</label><input type="text" value={footerCopyright} onChange={(e) => setFooterCopyright(e.target.value)} placeholder="© 2024 Your Company. All rights reserved." className={inputClass} /></div>
              </div>
            )}

            {activeTab === 'monetization' && (
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <Info size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">How Ad Injection Works</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                      Paste the full ad code from your advertising platform (Google AdSense, Adcash, Adsterra, etc.) into the correct slot below.
                      Head tag code is injected globally into the HTML head. Body/footer/in-article slots are rendered as live HTML components in the matching page sections.
                      Enabling a slot activates it immediately across the entire site.
                    </p>
                  </div>
                </div>

                {adSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`border-2 rounded-xl overflow-hidden transition-all ${slot.is_enabled ? 'border-emerald-400 dark:border-emerald-600' : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    <div className={`flex items-center justify-between px-5 py-3 ${slot.is_enabled ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-50 dark:bg-gray-900/40'}`}>
                      <div className="flex items-center gap-3">
                        {slot.is_enabled
                          ? <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                          : <EyeOff size={16} className="text-gray-400" />
                        }
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{slot.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{SLOT_DESCRIPTIONS[slot.slot] || ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPreviewSlot(previewSlot === slot.id ? null : slot.id)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <Eye size={13} />
                          {previewSlot === slot.id ? 'Hide preview' : 'Preview'}
                        </button>
                        <button
                          onClick={() => updateAdSlot(slot.id, 'is_enabled', !slot.is_enabled)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${slot.is_enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${slot.is_enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Ad Platform</label>
                          <select
                            value={slot.platform}
                            onChange={(e) => updateAdSlot(slot.id, 'platform', e.target.value)}
                            className={inputClass}
                          >
                            {PLATFORMS.map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Custom Label (optional)</label>
                          <input
                            type="text"
                            value={slot.label}
                            onChange={(e) => updateAdSlot(slot.id, 'label', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>
                          Ad Code
                          <span className="ml-2 font-normal text-gray-400 text-xs">(paste the full script/HTML from your ad platform)</span>
                        </label>
                        <textarea
                          value={slot.code}
                          onChange={(e) => updateAdSlot(slot.id, 'code', e.target.value)}
                          placeholder={`<!-- Paste your ${slot.label} ad code here -->`}
                          rows={6}
                          className={`${inputClass} font-mono text-xs`}
                          spellCheck={false}
                        />
                      </div>

                      {previewSlot === slot.id && slot.code && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Live Preview</p>
                          <div
                            className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-900 min-h-[80px] overflow-auto"
                            dangerouslySetInnerHTML={{ __html: slot.code }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {adSlots.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <DollarSign size={40} className="mx-auto mb-3 opacity-40" />
                    <p>No ad slots configured yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'aikeys' && (
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl">
                  <Key size={18} className="text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-violet-800 dark:text-violet-300 mb-1">Server-side AI Keys</p>
                    <p className="text-xs text-violet-700 dark:text-violet-400 leading-relaxed">
                      Keys stored here are used server-side for all AI features (content generation, NECTA crawl, image generation, text-to-speech).
                      Environment variables take priority if set. Keys are never exposed to the browser.
                      Existing keys are shown as ••••••••—paste a new value to update, or leave as-is to keep the current key.
                    </p>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Claude API Key (Anthropic)</label>
                  <input
                    type="password"
                    value={claudeKey}
                    onChange={e => setClaudeKey(e.target.value)}
                    onFocus={e => { if (e.target.value.startsWith('•')) setClaudeKey(''); }}
                    placeholder="sk-ant-..."
                    autoComplete="new-password"
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used for article writing, NECTA result titles, and all Claude-powered features.</p>
                </div>

                <div>
                  <label className={labelClass}>OpenAI API Key</label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={e => setOpenaiKey(e.target.value)}
                    onFocus={e => { if (e.target.value.startsWith('•')) setOpenaiKey(''); }}
                    placeholder="sk-..."
                    autoComplete="new-password"
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used as Claude fallback, image generation (DALL-E), and text-to-speech audio narration.</p>
                </div>

                <div>
                  <label className={labelClass}>Gemini API Key (Google)</label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={e => setGeminiKey(e.target.value)}
                    onFocus={e => { if (e.target.value.startsWith('•')) setGeminiKey(''); }}
                    placeholder="AIza..."
                    autoComplete="new-password"
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reserved for Gemini-powered features (future use).</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AdminLayout>
  );
}
