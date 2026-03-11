import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';
import { applyMeta, buildStaticMeta } from '../lib/seo';

export default function CookiePolicyPage() {
  useEffect(() => {
    applyMeta(buildStaticMeta(
      'Cookie Policy',
      'Learn how Mayobe Bros uses cookies and similar technologies to improve your browsing experience.',
      '/cookie-policy',
    ));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-6 text-sm">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Cookie size={24} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Cookie Policy</h1>
          </div>
          <p className="text-blue-100 text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-12 sm:py-16">
        <div className="space-y-10">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What Are Cookies?</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. They help us remember your preferences, keep you logged in, and understand how you use our site so we can improve your experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">How We Use Cookies</h2>
            <div className="space-y-4">
              {[
                {
                  title: 'Essential Cookies',
                  desc: 'These cookies are required for the website to function. They enable core features like authentication, session management, and security. You cannot opt out of these cookies.',
                  badge: 'Required',
                  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                },
                {
                  title: 'Preference Cookies',
                  desc: 'These remember your settings such as theme (light/dark mode), language, and display preferences so you do not have to re-enter them on each visit.',
                  badge: 'Functional',
                  color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                },
                {
                  title: 'Analytics Cookies',
                  desc: 'We use anonymous analytics data to understand which articles are popular, how readers navigate the site, and where we can improve content and performance.',
                  badge: 'Optional',
                  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                },
                {
                  title: 'Authentication Cookies',
                  desc: 'When you sign in to Mayobe Bros, we store a secure session cookie so you remain logged in across page visits. These expire when you log out or after a set period.',
                  badge: 'Required',
                  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                },
              ].map(({ title, desc, badge, color }) => (
                <div key={title} className="p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${color}`}>{badge}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">localStorage &amp; sessionStorage</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              In addition to cookies, we use browser localStorage and sessionStorage to store:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              {[
                'Your authentication session (encrypted token)',
                'Your reading history and recently viewed posts',
                'Theme preferences (light/dark mode)',
                'Cookie consent choice',
                'Draft comment text (temporary)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Third-Party Cookies</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We use Supabase for authentication and database services. When you sign in with Google, Google may set their own cookies subject to Google's Privacy Policy. We do not sell, trade, or otherwise transfer your data to third parties for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Managing Your Cookie Preferences</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              You can manage or delete cookies at any time through your browser settings. Note that disabling certain cookies may affect the functionality of the site, particularly authentication features.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              To clear your consent preference on this site, clear your browser's localStorage data or use your browser's developer tools to remove the <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">mayobebros-cookie-consent</code> entry.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have questions about our cookie practices, please{' '}
              <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">contact us</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
