import { useState, useEffect } from 'react';
import { X, Cookie, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'mayobebros-cookie-consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem(CONSENT_KEY);
    if (!existing) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
      style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <Cookie size={20} className="text-blue-600 dark:text-blue-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">We use cookies</h3>
              <button
                onClick={reject}
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              We use cookies and browser cache to improve your experience.{' '}
              <Link to="/cookie-policy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium" onClick={accept}>
                Cookie Policy
              </Link>
              {' '}&amp;{' '}
              <Link to="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium" onClick={accept}>
                Privacy Policy
              </Link>
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mr-auto">
                <Shield size={13} />
                <span>Your data is never sold</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={reject}
                  className="flex-1 sm:flex-none px-5 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-all"
                >
                  Reject
                </button>
                <button
                  onClick={accept}
                  className="flex-1 sm:flex-none px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
