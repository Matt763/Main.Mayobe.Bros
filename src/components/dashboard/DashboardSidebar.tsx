import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bookmark,
  BookOpen,
  Bell,
  Briefcase,
  Sparkles,
  Settings as SettingsIcon,
  KeyRound,
  GraduationCap,
  LogOut,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useUserAuth } from '../../contexts/UserAuthContext';
import { useUnreadCount } from '../../hooks/useNotifications';
import { usePlan } from '../../hooks/usePlan';
import { useDashboardSettings } from '../../hooks/useDashboardSettings';
import ThemeToggle from '../ThemeToggle';

interface Props {
  onClose?: () => void;
  isMobile?: boolean;
}

const NAV_ITEMS = [
  { to: '/dashboard',                end: true,  icon: LayoutDashboard, label: 'Overview',     featureKey: null },
  { to: '/dashboard/saved',          end: false, icon: Bookmark,        label: 'Saved',        featureKey: 'savedContent' },
  { to: '/dashboard/reading',        end: false, icon: BookOpen,        label: 'Reading',      featureKey: 'userStats' },
  { to: '/dashboard/learning',       end: false, icon: GraduationCap,   label: 'Learning',     featureKey: 'learningSystem' },
  { to: '/dashboard/jobs',           end: false, icon: Briefcase,       label: 'Jobs',         featureKey: 'jobsTracker' },
  { to: '/dashboard/interests',      end: false, icon: Sparkles,        label: 'Interests',    featureKey: 'personalizedFeed' },
  { to: '/dashboard/notifications',  end: false, icon: Bell,            label: 'Notifications', featureKey: 'notifications', badgeKey: 'unread' as const },
  { to: '/dashboard/account',        end: false, icon: KeyRound,        label: 'Account',      featureKey: null },
  { to: '/dashboard/settings',       end: false, icon: SettingsIcon,    label: 'Settings',     featureKey: null },
] as const;

export default function DashboardSidebar({ onClose, isMobile }: Props) {
  const { publicUser, publicSignOut } = useUserAuth();
  const { count: unreadCount } = useUnreadCount();
  const { isPremium } = usePlan();
  const { config: dashConfig } = useDashboardSettings();
  const initial = publicUser?.name?.[0]?.toUpperCase() || 'U';

  const navItems = NAV_ITEMS.filter(item => {
    if (!item.featureKey) return true;
    return Boolean((dashConfig.features as any)[item.featureKey]);
  });

  return (
    <aside
      className={`flex flex-col h-full w-full bg-white dark:bg-gray-900 ${
        isMobile ? '' : 'border-r border-gray-200 dark:border-gray-800'
      }`}
    >
      {/* Header / user chip */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        {publicUser?.avatar_url ? (
          <img
            src={publicUser.avatar_url}
            alt={publicUser.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-blue-500/30">
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {publicUser?.name || 'Reader'}
            </p>
            {isPremium && (
              <span
                title="Premium member"
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white flex-shrink-0"
              >
                <Crown size={9} />
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
            {publicUser?.email}
          </p>
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {'soon' in item && (item as any).soon && (
                    <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      Soon
                    </span>
                  )}
                  {'badgeKey' in item && (item as any).badgeKey === 'unread' && unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Upgrade CTA — free users only, hidden when premium feature is disabled */}
      {!isPremium && dashConfig.premium.enabled && (
        <div className="px-3 pb-2">
          <Link
            to="/upgrade"
            onClick={onClose}
            className="block rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white p-3 shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1">
              <Crown size={14} />
              <span className="text-[11px] uppercase tracking-widest font-bold">Premium</span>
            </div>
            <p className="text-xs leading-snug">
              Unlimited saves + premium articles.{' '}
              <span className="font-bold">{dashConfig.premium.priceUsd} {dashConfig.premium.currency} one-time.</span>
            </p>
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-3 space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Theme</span>
          <ThemeToggle />
        </div>
        <button
          type="button"
          onClick={() => {
            onClose?.();
            publicSignOut();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
