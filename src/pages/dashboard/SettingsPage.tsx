import { Mail, User as UserIcon, Shield, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserAuth } from '../../contexts/UserAuthContext';

export default function SettingsPage() {
  const { publicUser } = useUserAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <header className="hidden lg:block">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your reader profile and preferences.
        </p>
      </header>

      <section className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">
          Profile
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <UserIcon size={16} className="mt-0.5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <dt className="text-xs text-gray-500 dark:text-gray-400">Display name</dt>
              <dd className="text-gray-900 dark:text-white font-medium truncate">
                {publicUser?.name || '—'}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail size={16} className="mt-0.5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <dt className="text-xs text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="text-gray-900 dark:text-white font-medium truncate">
                {publicUser?.email || '—'}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield size={16} className="mt-0.5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <dt className="text-xs text-gray-500 dark:text-gray-400">Sign-in method</dt>
              <dd className="text-gray-900 dark:text-white font-medium capitalize">
                {publicUser?.provider || '—'}
              </dd>
            </div>
          </div>
        </dl>
        <p className="mt-5 text-xs text-gray-500 dark:text-gray-400">
          Profile editing is coming soon. For now, your name and avatar come from your sign-in
          provider.
        </p>
      </section>

      <section className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
          Privacy
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Read about how we handle your data.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/privacy-policy"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Privacy policy
            <ExternalLink size={12} />
          </Link>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <Link
            to="/cookie-policy"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Cookie policy
            <ExternalLink size={12} />
          </Link>
        </div>
      </section>
    </div>
  );
}
