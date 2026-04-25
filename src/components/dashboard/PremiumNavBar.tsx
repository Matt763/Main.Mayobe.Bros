import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Crown, Search, Bell, ChevronDown, Sparkles, Bookmark, BookOpen, Briefcase,
  KeyRound, Settings, LogOut, Command, Home, Newspaper, Tag, Mail, ArrowRight, Compass, GraduationCap,
} from 'lucide-react';
import { useUserAuth } from '../../contexts/UserAuthContext';
import { useUnreadCount } from '../../hooks/useNotifications';

type CommandItem = {
  id: string;
  title: string;
  hint?: string;
  icon: any;
  href?: string;
  action?: () => void;
  group: 'Dashboard' | 'Site' | 'Account';
  keywords?: string;
};

export default function PremiumNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { publicUser, publicSignOut } = useUserAuth();
  const { count: unreadCount } = useUnreadCount();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Cmd/Ctrl+K opens palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // close profile on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [profileOpen]);

  // close palette on route change
  useEffect(() => {
    setPaletteOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const initial = publicUser?.name?.[0]?.toUpperCase() || 'U';

  const items: CommandItem[] = [
    { id: 'home',          title: 'Premium home',     hint: 'Overview',           icon: Home,       href: '/dashboard',                group: 'Dashboard' },
    { id: 'saved',         title: 'Saved articles',   hint: 'Your library',        icon: Bookmark,   href: '/dashboard/saved',          group: 'Dashboard' },
    { id: 'reading',       title: 'Reading history',  hint: 'Continue reading',   icon: BookOpen,   href: '/dashboard/reading',        group: 'Dashboard' },
    { id: 'jobs',          title: 'Jobs tracker',     hint: 'Saved & applied',    icon: Briefcase,  href: '/dashboard/jobs',           group: 'Dashboard' },
    { id: 'learning',      title: 'Learning tracks',  hint: 'Curated reading',    icon: GraduationCap, href: '/dashboard/learning',    group: 'Dashboard' },
    { id: 'interests',     title: 'Interests',        hint: 'Followed topics',     icon: Sparkles,   href: '/dashboard/interests',      group: 'Dashboard' },
    { id: 'notifications', title: 'Notifications',    hint: 'Unread updates',      icon: Bell,       href: '/dashboard/notifications',  group: 'Dashboard' },

    { id: 'site-home',     title: 'Mayobe Bros home', hint: 'Latest stories',      icon: Newspaper,  href: '/',                         group: 'Site' },
    { id: 'site-cats',     title: 'Categories',       hint: 'Browse by topic',     icon: Compass,    href: '/categories',               group: 'Site' },
    { id: 'site-labels',   title: 'Labels',           hint: 'Tagged stories',      icon: Tag,        href: '/labels',                   group: 'Site' },
    { id: 'site-jobs',     title: 'Jobs board',       hint: 'Public job listings', icon: Briefcase,  href: '/jobs',                     group: 'Site' },
    { id: 'site-contact',  title: 'Contact',          hint: 'Reach the team',      icon: Mail,       href: '/contact',                  group: 'Site' },

    { id: 'account',       title: 'Account & security', hint: 'Password, profile', icon: KeyRound, href: '/dashboard/account',          group: 'Account' },
    { id: 'settings',      title: 'Dashboard settings', hint: 'Preferences',       icon: Settings, href: '/dashboard/settings',         group: 'Account' },
    { id: 'signout',       title: 'Sign out',           hint: 'End your session',  icon: LogOut,   action: () => publicSignOut(),       group: 'Account' },
  ];

  return (
    <>
      <header className="premium-nav fixed top-0 inset-x-0 z-40">
        <style>{premiumNavCss}</style>
        <div className="premium-nav-inner mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 h-14 sm:h-16">
            {/* Logo + crown */}
            <Link to="/dashboard" className="flex items-center gap-2.5 group" aria-label="Premium dashboard home">
              <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#d4af37]/40 bg-gradient-to-br from-[#1a1438] to-[#0a0a1a]">
                <Crown size={16} className="text-[#e8c468]" strokeWidth={1.6} />
                <span className="absolute inset-0 rounded-xl premium-nav-halo" aria-hidden />
              </span>
              <div className="hidden sm:block leading-none">
                <p className="text-[10px] tracking-[0.28em] uppercase font-medium text-[#e8c468]">Premium</p>
                <p className="font-serif italic text-[15px] text-[#f8f5ec] -mt-0.5">Mayobe Bros</p>
              </div>
            </Link>

            {/* Search button → command palette */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="ml-1 sm:ml-3 flex-1 max-w-md inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#d4af37]/20 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#d4af37]/35 transition-colors"
            >
              <Search size={14} className="text-[#a8a8b8]" />
              <span className="text-[13px] text-[#a8a8b8] flex-1 text-left">Search dashboard, articles, menus…</span>
              <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-[#a8a8b8] border border-white/10 bg-white/[0.04]">
                <Command size={10} /> K
              </kbd>
            </button>

            {/* Notifications */}
            <button
              type="button"
              onClick={() => navigate('/dashboard/notifications')}
              aria-label="Notifications"
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/[0.06] transition-colors"
            >
              <Bell size={16} className="text-[#f8f5ec]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 inline-flex items-center justify-center text-[9px] font-bold rounded-full bg-[#d4af37] text-[#0a0a1a]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile menu */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                className="inline-flex items-center gap-1.5 px-1.5 py-1 rounded-full hover:bg-white/[0.06] transition-colors"
              >
                {publicUser?.avatar_url ? (
                  <img src={publicUser.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-[#d4af37]/40" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a6c00] text-[#0a0a1a] font-bold text-sm flex items-center justify-center ring-2 ring-[#d4af37]/40">
                    {initial}
                  </span>
                )}
                <ChevronDown size={12} className={`text-[#a8a8b8] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              <div
                role="menu"
                className={`premium-menu absolute right-0 mt-2 w-72 rounded-2xl ${profileOpen ? 'opened' : 'closed'}`}
              >
                <div className="px-4 py-3.5 border-b border-[#d4af37]/15">
                  <p className="text-[10px] tracking-[0.28em] uppercase text-[#e8c468] font-medium mb-1">Premium reader</p>
                  <p className="font-serif italic text-[16px] text-[#f8f5ec]">{publicUser?.name || 'Reader'}</p>
                  <p className="text-[11px] text-[#a8a8b8] truncate">{publicUser?.email}</p>
                </div>
                <ul className="py-1.5">
                  {[
                    { icon: KeyRound, label: 'Account & security', href: '/dashboard/account' },
                    { icon: Settings, label: 'Dashboard settings', href: '/dashboard/settings' },
                    { icon: Sparkles, label: 'Manage interests',   href: '/dashboard/interests' },
                  ].map(it => (
                    <li key={it.href}>
                      <Link
                        to={it.href}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#f8f5ec] hover:bg-white/[0.05] transition-colors"
                      >
                        <it.icon size={14} className="text-[#a8a8b8]" />
                        <span className="flex-1">{it.label}</span>
                        <ArrowRight size={12} className="text-[#a8a8b8]" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-[#d4af37]/15 py-1.5">
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); publicSignOut(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} items={items} navigate={navigate} />
    </>
  );
}

function CommandPalette({ open, onClose, items, navigate }: {
  open: boolean; onClose: () => void; items: CommandItem[]; navigate: (path: string) => void;
}) {
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);

  const filtered = items.filter(i => {
    if (!q.trim()) return true;
    const haystack = `${i.title} ${i.hint || ''} ${i.keywords || ''}`.toLowerCase();
    return haystack.includes(q.trim().toLowerCase());
  });

  useEffect(() => {
    if (open) { setQ(''); setCursor(0); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
      if (e.key === 'Enter')     { e.preventDefault(); run(filtered[cursor]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const run = (item: CommandItem | undefined) => {
    if (!item) return;
    if (item.action) item.action();
    else if (item.href) navigate(item.href);
    onClose();
  };

  if (!open) return null;

  // Group by section
  const groups: Record<string, CommandItem[]> = { Dashboard: [], Site: [], Account: [] };
  filtered.forEach(i => groups[i.group].push(i));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-[#0a0a1a]/80 backdrop-blur-md premium-fade-in" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-xl rounded-2xl premium-palette overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#d4af37]/15">
          <Search size={16} className="text-[#e8c468]" />
          <input
            autoFocus
            value={q}
            onChange={e => { setQ(e.target.value); setCursor(0); }}
            placeholder="Search dashboard or jump to a page…"
            className="flex-1 bg-transparent text-[#f8f5ec] placeholder:text-[#7a7a90] text-sm focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-[#a8a8b8] px-1.5 py-0.5 border border-white/10 rounded">Esc</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-[#7a7a90] py-10">No matches for "{q}"</p>
          ) : (
            Object.entries(groups).map(([groupName, gItems]) => {
              if (gItems.length === 0) return null;
              return (
                <div key={groupName} className="px-1.5 mb-1">
                  <p className="px-3 pt-2 pb-1 text-[10px] tracking-[0.28em] uppercase text-[#e8c468] font-medium">{groupName}</p>
                  {gItems.map((item) => {
                    const Icon = item.icon;
                    const flatIndex = filtered.findIndex(f => f.id === item.id);
                    const active = flatIndex === cursor;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => run(item)}
                        onMouseEnter={() => setCursor(flatIndex)}
                        className={
                          'w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ' +
                          (active ? 'bg-[#d4af37]/10' : 'hover:bg-white/[0.04]')
                        }
                      >
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${active ? 'bg-[#d4af37]/20 text-[#e8c468]' : 'bg-white/[0.05] text-[#a8a8b8]'}`}>
                          <Icon size={13} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#f8f5ec]">{item.title}</p>
                          {item.hint && <p className="text-[11px] text-[#7a7a90] truncate">{item.hint}</p>}
                        </div>
                        {active && <ArrowRight size={12} className="text-[#e8c468]" />}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-[#d4af37]/15 flex items-center justify-between text-[10px] text-[#7a7a90] tracking-wider">
          <span><kbd className="px-1.5 py-0.5 border border-white/10 rounded font-mono">↑↓</kbd> navigate · <kbd className="px-1.5 py-0.5 border border-white/10 rounded font-mono">↵</kbd> open</span>
          <span>{filtered.length} item{filtered.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
}

const premiumNavCss = `
.premium-nav {
  background: rgba(7, 9, 26, 0.78);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border-bottom: 1px solid rgba(212, 175, 55, 0.18);
  box-shadow: 0 12px 30px -16px rgba(0, 0, 0, 0.5);
}
.premium-nav-inner {
  position: relative;
}
.premium-nav-inner::after {
  content: '';
  position: absolute; inset: auto 0 -1px 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.55) 50%, transparent);
}
.premium-nav-halo {
  background: radial-gradient(circle, rgba(212, 175, 55, 0.30) 0%, transparent 65%);
  filter: blur(6px);
  animation: premium-halo 4s ease-in-out infinite;
}
@keyframes premium-halo {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50%      { opacity: 0.95; transform: scale(1.12); }
}

.premium-menu {
  background: linear-gradient(180deg, rgba(15, 12, 35, 0.98) 0%, rgba(7, 9, 26, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.22);
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.7);
  transform-origin: top right;
  transition: opacity 200ms ease, transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
}
.premium-menu.opened { opacity: 1; transform: scale(1) translateY(0); pointer-events: auto; }
.premium-menu.closed { opacity: 0; transform: scale(0.96) translateY(-4px); pointer-events: none; }

.premium-palette {
  background: linear-gradient(180deg, rgba(15, 12, 35, 0.96) 0%, rgba(7, 9, 26, 0.96) 100%);
  border: 1px solid rgba(212, 175, 55, 0.22);
  box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.8);
  animation: premium-palette-in 280ms cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes premium-palette-in {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.premium-fade-in { animation: premium-fade 240ms ease-out; }
@keyframes premium-fade { from { opacity: 0; } to { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .premium-nav-halo,
  .premium-menu,
  .premium-palette,
  .premium-fade-in { animation: none !important; transition: none !important; }
}
`;
