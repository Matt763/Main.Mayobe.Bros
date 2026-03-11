import { Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';

export default function CachePolicyPage() {
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
              <Zap size={24} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Cache Policy</h1>
          </div>
          <p className="text-blue-100 text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-12 sm:py-16">
        <div className="space-y-10">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What Is Browser Caching?</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Browser caching is a performance technique that stores copies of website resources (images, scripts, stylesheets) locally on your device. This allows Mayobe Bros to load faster on subsequent visits by serving resources from your device's cache instead of downloading them again.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What We Cache</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Static Assets', desc: 'JavaScript, CSS, fonts, and icons are cached for up to 1 year since they rarely change.', icon: '📦' },
                { title: 'Images & Media', desc: 'Article images and media files are cached for 30 days to reduce bandwidth usage.', icon: '🖼️' },
                { title: 'API Responses', desc: 'Category and navigation data is briefly cached to improve page load performance.', icon: '⚡' },
                { title: 'Reading History', desc: 'Recently viewed posts are stored in localStorage for a personalized experience.', icon: '📖' },
              ].map(({ title, desc, icon }) => (
                <div key={title} className="p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="text-2xl mb-2">{icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">{title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Service Worker &amp; Offline Support</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              Mayobe Bros uses a service worker to provide a faster, more reliable experience. The service worker:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              {[
                'Caches core application files for instant loading',
                'Enables basic offline functionality for previously viewed content',
                'Automatically updates when new content is published',
                'Never caches private or authenticated user data',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data Security in Cache</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              We take care to ensure cached data does not compromise your security:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              {[
                'Authentication tokens are stored in secure session storage where possible',
                'No passwords or sensitive credentials are ever cached',
                'User session data is cleared automatically on logout',
                'Cache entries use content hashing to prevent stale data issues',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cache Retention Periods</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">Resource Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">Cache Duration</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">Strategy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    ['HTML pages', 'No cache / revalidate', 'Network first'],
                    ['CSS & JS bundles', '1 year', 'Cache first (versioned)'],
                    ['Images', '30 days', 'Cache first'],
                    ['API responses', '5 minutes', 'Stale while revalidate'],
                    ['Auth sessions', 'Session / 7 days', 'Secure storage'],
                    ['User preferences', 'Indefinite', 'localStorage'],
                  ].map(([type, duration, strategy]) => (
                    <tr key={type} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{type}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{duration}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{strategy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Clearing Your Cache</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              If you experience issues with outdated content, you can clear the cache by:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              {[
                'Hard refreshing the page: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)',
                "Opening your browser's Developer Tools → Application → Storage → Clear site data",
                'Clearing your browser history and cached images/files in browser settings',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Questions?</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have concerns about how we cache data, please{' '}
              <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">reach out to us</Link>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
