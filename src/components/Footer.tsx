import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Lock, CheckCircle, ArrowRight, Rss } from 'lucide-react';
import { api } from '../lib/api';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface Category { id: string; name: string; slug: string; }

export default function Footer() {
  const [footerCategories, setFooterCategories] = useState<Category[]>([]);
  const { settings } = useSiteSettings();
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeState, setSubscribeState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subscribeError, setSubscribeError] = useState('');
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (!isAdmin) loadFooterCategories();
  }, [isAdmin]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const loadFooterCategories = async () => {
    const data = await api.categories.list();
    if (data) setFooterCategories(data);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail.trim()) return;
    setSubscribeState('loading');
    setSubscribeError('');
    try {
      await api.newsletter.subscribe(subscribeEmail.trim(), 'footer');
      setSubscribeState('success');
      setSubscribeEmail('');
      successTimerRef.current = setTimeout(() => setSubscribeState('idle'), 8000);
    } catch (err: any) {
      if (err.message?.includes('already')) {
        setSubscribeState('success');
        successTimerRef.current = setTimeout(() => setSubscribeState('idle'), 8000);
      } else {
        setSubscribeState('error');
        setSubscribeError(err.message || 'Failed to subscribe. Please try again.');
      }
    }
  };

  if (isAdmin) return null;

  const quickLinks = [
    { label: 'Home', to: '/' },
    { label: 'Popular Posts', to: '/popular' },
    { label: 'About Us', to: '/about' },
    { label: 'Contact', to: '/contact' },
    { label: 'Advertise With Us', to: '/advertise' },
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms of Service', to: '/terms-of-service' },
    { label: 'Cookie Policy', to: '/cookie-policy' },
    { label: 'Editorial Policy', to: '/editorial-policy' },
    { label: 'Fact Checking Policy', to: '/fact-checking-policy' },
    { label: 'Cache Policy', to: '/cache-policy' },
    { label: 'Sitemap', to: '/sitemap' },
    { label: 'RSS Feed', to: '/rss' },
  ];

  const socials = [
    { url: settings.facebook_url, Icon: Facebook, label: 'Facebook' },
    { url: settings.twitter_url, Icon: Twitter, label: 'Twitter' },
    { url: settings.instagram_url, Icon: Instagram, label: 'Instagram' },
    { url: settings.linkedin_url, Icon: Linkedin, label: 'LinkedIn' },
  ].filter(s => !!s.url);

  return (
    <footer className="bg-gray-950 text-white mt-16">
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10 lg:gap-12 py-14 lg:py-16">

          {/* Brand column */}
          <div className="md:col-span-2 xl:col-span-1 flex flex-col gap-5">
            <Link to="/" className="inline-block">
              <img
                src={settings.logo_url || '/mayobebroslogo copy copy.png'}
                alt={settings.site_title || 'Mayobe Bros'}
                className="h-12 w-auto max-w-[220px] object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {settings.site_description || 'Your trusted source for knowledge, insights, and stories that matter. Exploring education, business, technology, history, and more.'}
            </p>

            {socials.length > 0 && (
              <div className="flex items-center gap-3 pt-1">
                {socials.map(({ url, Icon, label }) => (
                  <a
                    key={label}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-blue-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                  >
                    <Icon size={17} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-5 pb-3 border-b border-gray-800">
              Quick Links
            </h4>
            <ul className="grid grid-cols-1 gap-2.5">
              {quickLinks.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowRight size={13} className="text-blue-500 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 flex-shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-5 pb-3 border-b border-gray-800">
              Categories
            </h4>
            <ul className="flex flex-col gap-2.5">
              {footerCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/category/${category.slug}`}
                    className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowRight size={13} className="text-blue-500 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 flex-shrink-0" />
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-5 pb-3 border-b border-gray-800">
              Newsletter
            </h4>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Get the latest articles and insights delivered straight to your inbox.
            </p>

            {subscribeState === 'success' ? (
              <div className="bg-green-900/30 border border-green-700/40 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-green-400" />
                </div>
                <div>
                  <p className="text-green-300 font-semibold text-sm">You're subscribed!</p>
                  <p className="text-green-400/70 text-xs mt-0.5">Check your inbox for a confirmation.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={subscribeEmail}
                    onChange={e => { setSubscribeEmail(e.target.value); setSubscribeError(''); }}
                    placeholder="your@email.com"
                    disabled={subscribeState === 'loading'}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 text-sm placeholder-gray-500 transition-all disabled:opacity-60"
                  />
                </div>
                {subscribeError && (
                  <p className="text-red-400 text-xs">{subscribeError}</p>
                )}
                <button
                  type="submit"
                  disabled={subscribeState === 'loading'}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-lg font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 group"
                >
                  {subscribeState === 'loading' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
                <p className="text-gray-600 text-xs text-center">No spam, ever. Unsubscribe anytime.</p>
              </form>
            )}

            <div className="mt-5 flex items-center gap-2">
              <Link
                to="/rss"
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-orange-400 transition-colors"
              >
                <Rss size={13} />
                RSS Feed
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800/80 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm text-center sm:text-left">
              {settings.footer_copyright || `© ${new Date().getFullYear()} Mayobe Bros. All rights reserved.`}
            </p>
            <Link
              to="/admin/login"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-all border border-gray-700/60 hover:border-gray-600 text-xs font-medium"
            >
              <Lock size={13} />
              Staff Login
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
