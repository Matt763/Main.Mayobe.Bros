import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface SiteSettings {
  site_title?: string;
  site_tagline?: string;
  site_description?: string;
  logo_url?: string;
  favicon_url?: string;
  default_theme?: string;
  primary_color?: string;
  font_family?: string;
  default_meta_title?: string;
  default_meta_description?: string;
  google_analytics_id?: string;
  google_search_console?: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  custom_css?: string;
  custom_js?: string;
  footer_copyright?: string;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({
    logo_url: '/mayobebroslogo.png',
    favicon_url: '/mayobebrosfavicon.png',
    site_title: 'Mayobe Bros',
    site_tagline: 'Empowering Minds with Knowledge and Insights',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.settings.get();

      if (data) {
        const mapped: SiteSettings = {
          site_title: data.siteName || data.site_title,
          site_tagline: data.siteTagline || data.site_tagline,
          site_description: data.siteDescription || data.site_description,
          logo_url: data.siteLogo || data.logo_url,
          favicon_url: data.siteFavicon || data.favicon_url,
          footer_copyright: data.footerCopyright || data.footer_copyright,
          facebook_url: data.socialMedia?.facebook || data.facebook_url,
          twitter_url: data.socialMedia?.twitter || data.twitter_url,
          instagram_url: data.socialMedia?.instagram || data.instagram_url,
          linkedin_url: data.socialMedia?.linkedin || data.linkedin_url,
          custom_css: data.customCss || data.custom_css,
          custom_js: data.customJs || data.custom_js,
        };
        setSettings(prev => ({ ...prev, ...mapped }));
      }
    } catch (error) {
      console.error('Error loading site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (settings.favicon_url) {
      updateFavicon(settings.favicon_url);
    }
  }, [settings.favicon_url]);

  const updateFavicon = (faviconUrl: string) => {
    const links = document.querySelectorAll("link[rel*='icon']");
    links.forEach((link) => {
      (link as HTMLLinkElement).href = faviconUrl;
    });

    const appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (appleTouchIcon) {
      (appleTouchIcon as HTMLLinkElement).href = faviconUrl;
    }
  };

  return { settings, loading, refresh: loadSettings };
}
