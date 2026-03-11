import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  const [countdown, setCountdown] = useState(6);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold text-blue-600 dark:text-blue-400 mb-3 sm:mb-4">404</h1>
          <div className="inline-block p-3 sm:p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 sm:mb-6">
            <Search size={36} className="sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 leading-tight">
          Page Not Found
        </h2>

        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed px-4">
          We couldn't find the page you're looking for. It might have been moved, deleted, or the URL might be incorrect.
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-600 rounded-full animate-pulse"></div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium">
              Redirecting to homepage in
            </p>
          </div>
          <div className="text-4xl sm:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-1 sm:mb-2">
            {countdown}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">seconds</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg text-sm sm:text-base min-h-[44px]"
          >
            <Home size={18} className="sm:w-5 sm:h-5" />
            <span>Go to Homepage</span>
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold text-sm sm:text-base min-h-[44px]"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            <span>Go Back</span>
          </button>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
            <Link
              to="/category/education"
              className="px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm min-h-[44px] flex items-center"
            >
              Education
            </Link>
            <Link
              to="/category/business"
              className="px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm min-h-[44px] flex items-center"
            >
              Business
            </Link>
            <Link
              to="/category/technology"
              className="px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm min-h-[44px] flex items-center"
            >
              Technology
            </Link>
            <Link
              to="/popular"
              className="px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm min-h-[44px] flex items-center"
            >
              Popular Posts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
