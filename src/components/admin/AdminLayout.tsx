import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useRole } from '../../hooks/useRole';
import { useNotifications } from '../../contexts/NotificationContext';
import { LayoutDashboard, FileText, File as FileEdit, MessageSquare, Folder, Tag, Image as ImageIcon, Settings, BarChart3, Menu, X, LogOut, Moon, Sun, Monitor, ChevronDown, Home, Mail, Users, Shield, Crown, KeyRound, CircleUser as UserCircle, Star, Radar, Activity, Sparkles, Compass, ClipboardCheck, Share2, Cpu, Search, Globe, CreditCard, TrendingUp, BarChart2, ShieldCheck, Bot, GraduationCap, Briefcase, Film } from 'lucide-react';
import OnboardingTour from './OnboardingTour';

interface AdminLayoutProps { children: ReactNode; }
interface NavItem { name: string; path: string; icon: any; badge?: number; }
interface NavSection { title: string; items: NavItem[]; }

const ROLE_LABELS: Record<string, string> = {
  ceo: 'CEO',
  admin: 'Admin',
  publisher: 'Publisher',
  staff: 'Publisher',
};

type T = {
  sidebarBg: string; sidebarBorder: string; headerBorder: string;
  navSectionColor: string; navActive: string; navActiveBg: string;
  navHoverBg: string; navHoverColor: string; navColor: string;
  footerBorder: string; mainBg: string; mainContent: string;
  badge: string; badgeColor: string; logoBorderColor: string; logoColor: string;
  avatarBg: string; userNameColor: string; userEmailColor: string;
  chipBg: string; chipColor: string; chipBorderColor: string;
  signOutColor: string; signOutHoverColor: string; signOutHoverBg: string;
  visitColor: string; visitHoverBg: string; themeColor: string; themeHoverBg: string;
  dropdownBg: string; dropdownBorder: string;
  indicatorBg: string; indicatorDot: string; indicatorColor: string;
  mobileHeaderBg: string;
  meshClass: string; navAccentVar: string;
};

function ceoTheme(dark: boolean): T {
  if (dark) return {
    sidebarBg: 'linear-gradient(180deg,rgba(7,5,0,0.95) 0%,rgba(0,3,8,0.96) 60%,rgba(0,0,0,0.97) 100%)',
    sidebarBorder: 'rgba(212,175,55,0.14)', headerBorder: '#2a1e00',
    navSectionColor: '#7a6520', navActive: '#d4af37',
    navActiveBg: 'rgba(212,175,55,0.13)', navHoverBg: 'rgba(212,175,55,0.07)',
    navHoverColor: '#c9a227', navColor: '#6a5518',
    footerBorder: 'rgba(212,175,55,0.12)', mainBg: '#000000', mainContent: '#000205',
    badge: 'linear-gradient(90deg,#d4af37,#f5e070,#c9a000)', badgeColor: '#1a0e00',
    logoBorderColor: 'rgba(212,175,55,0.35)', logoColor: '#d4af37',
    avatarBg: 'linear-gradient(135deg,#d4af37,#8a6c00)',
    userNameColor: '#e8d080', userEmailColor: '#5a4818',
    chipBg: 'rgba(212,175,55,0.10)', chipColor: '#c9a227', chipBorderColor: 'rgba(212,175,55,0.22)',
    signOutColor: '#6a5518', signOutHoverColor: '#f87171', signOutHoverBg: 'rgba(220,38,38,0.14)',
    visitColor: '#6a5518', visitHoverBg: 'rgba(212,175,55,0.09)',
    themeColor: '#6a5518', themeHoverBg: 'rgba(212,175,55,0.09)',
    dropdownBg: 'rgba(7,5,0,0.96)', dropdownBorder: '#2a1e00',
    indicatorBg: 'rgba(212,175,55,0.09)', indicatorDot: '#d4af37', indicatorColor: '#9a7c20',
    mobileHeaderBg: 'rgba(7,5,0,0.88)',
    meshClass: 'admin-mesh-gold', navAccentVar: '#d4af37',
  };
  return {
    sidebarBg: 'linear-gradient(180deg,rgba(255,253,240,0.88) 0%,rgba(253,248,225,0.90) 60%,rgba(247,240,192,0.88) 100%)',
    sidebarBorder: 'rgba(212,175,55,0.22)', headerBorder: 'rgba(212,175,55,0.28)',
    navSectionColor: '#9a7c20', navActive: '#6a4e00',
    navActiveBg: 'rgba(212,175,55,0.16)', navHoverBg: 'rgba(212,175,55,0.09)',
    navHoverColor: '#5a3e00', navColor: '#8a6a20',
    footerBorder: 'rgba(212,175,55,0.20)', mainBg: '#f5f5f0', mainContent: '#fdfbef',
    badge: 'linear-gradient(90deg,#c9a000,#f5e070,#c9a000)', badgeColor: '#1a0e00',
    logoBorderColor: 'rgba(201,160,0,0.45)', logoColor: '#5a3e00',
    avatarBg: 'linear-gradient(135deg,#d4af37,#8a6c00)',
    userNameColor: '#3a2800', userEmailColor: '#8a6820',
    chipBg: 'rgba(212,175,55,0.14)', chipColor: '#6a4e00', chipBorderColor: 'rgba(212,175,55,0.28)',
    signOutColor: '#8a6820', signOutHoverColor: '#dc2626', signOutHoverBg: 'rgba(220,38,38,0.07)',
    visitColor: '#7a5c10', visitHoverBg: 'rgba(212,175,55,0.10)',
    themeColor: '#7a5c10', themeHoverBg: 'rgba(212,175,55,0.10)',
    dropdownBg: 'rgba(255,253,240,0.96)', dropdownBorder: 'rgba(212,175,55,0.35)',
    indicatorBg: 'rgba(212,175,55,0.14)', indicatorDot: '#c9a000', indicatorColor: '#8a6a20',
    mobileHeaderBg: 'rgba(255,253,240,0.88)',
    meshClass: 'admin-mesh-gold', navAccentVar: '#d4af37',
  };
}

function adminTheme(dark: boolean): T {
  if (dark) return {
    sidebarBg: 'linear-gradient(180deg,rgba(0,8,20,0.95) 0%,rgba(0,12,31,0.96) 60%,rgba(0,0,0,0.97) 100%)',
    sidebarBorder: 'rgba(59,130,246,0.12)', headerBorder: '#0a1e3a',
    navSectionColor: '#28426a', navActive: '#7eb8f7',
    navActiveBg: 'rgba(59,130,246,0.14)', navHoverBg: 'rgba(59,130,246,0.07)',
    navHoverColor: '#60a5fa', navColor: '#384e70',
    footerBorder: 'rgba(59,130,246,0.10)', mainBg: '#000000', mainContent: '#000308',
    badge: '', badgeColor: '', logoBorderColor: '', logoColor: '#7eb8f7',
    avatarBg: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
    userNameColor: '#c8dff8', userEmailColor: '#28426a',
    chipBg: 'rgba(59,130,246,0.12)', chipColor: '#60a5fa', chipBorderColor: 'rgba(59,130,246,0.20)',
    signOutColor: '#384e70', signOutHoverColor: '#f87171', signOutHoverBg: 'rgba(220,38,38,0.14)',
    visitColor: '#384e70', visitHoverBg: 'rgba(59,130,246,0.08)',
    themeColor: '#384e70', themeHoverBg: 'rgba(59,130,246,0.08)',
    dropdownBg: 'rgba(0,8,20,0.96)', dropdownBorder: '#0a1e3a',
    indicatorBg: '', indicatorDot: '', indicatorColor: '',
    mobileHeaderBg: 'rgba(0,8,20,0.88)',
    meshClass: 'admin-mesh', navAccentVar: '#3b82f6',
  };
  return {
    sidebarBg: 'linear-gradient(180deg,rgba(248,251,255,0.88) 0%,rgba(244,249,255,0.90) 60%,rgba(238,244,255,0.88) 100%)',
    sidebarBorder: 'rgba(59,130,246,0.14)', headerBorder: '#d8e8f8',
    navSectionColor: '#8aabcf', navActive: '#1a50a0',
    navActiveBg: 'rgba(37,99,235,0.09)', navHoverBg: 'rgba(37,99,235,0.05)',
    navHoverColor: '#1d4ed8', navColor: '#4a6a90',
    footerBorder: 'rgba(59,130,246,0.12)', mainBg: '#f5f5f5', mainContent: '#edf0f8',
    badge: '', badgeColor: '', logoBorderColor: '', logoColor: '#1a3050',
    avatarBg: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
    userNameColor: '#1a2a3a', userEmailColor: '#5a7a9a',
    chipBg: 'rgba(37,99,235,0.07)', chipColor: '#1a50a0', chipBorderColor: 'rgba(37,99,235,0.15)',
    signOutColor: '#5a7a9a', signOutHoverColor: '#dc2626', signOutHoverBg: 'rgba(220,38,38,0.06)',
    visitColor: '#4a6a90', visitHoverBg: 'rgba(37,99,235,0.05)',
    themeColor: '#5a7a9a', themeHoverBg: 'rgba(37,99,235,0.05)',
    dropdownBg: 'rgba(248,251,255,0.96)', dropdownBorder: '#d8e8f8',
    indicatorBg: '', indicatorDot: '', indicatorColor: '',
    mobileHeaderBg: 'rgba(248,251,255,0.88)',
    meshClass: 'admin-mesh', navAccentVar: '#3b82f6',
  };
}

function staffTheme(dark: boolean): T {
  if (dark) return {
    sidebarBg: 'linear-gradient(180deg,rgba(10,10,15,0.95) 0%,rgba(5,5,8,0.96) 60%,rgba(0,0,0,0.97) 100%)',
    sidebarBorder: 'rgba(180,180,200,0.08)', headerBorder: '#1e1e28',
    navSectionColor: '#383848', navActive: '#c0c0d0',
    navActiveBg: 'rgba(180,180,200,0.09)', navHoverBg: 'rgba(180,180,200,0.05)',
    navHoverColor: '#a8a8c0', navColor: '#505060',
    footerBorder: 'rgba(180,180,200,0.08)', mainBg: '#000000', mainContent: '#030308',
    badge: '', badgeColor: '', logoBorderColor: '', logoColor: '#9898b0',
    avatarBg: 'linear-gradient(135deg,#686878,#383848)',
    userNameColor: '#c0c0d0', userEmailColor: '#484858',
    chipBg: 'rgba(180,180,200,0.08)', chipColor: '#8888a0', chipBorderColor: 'rgba(180,180,200,0.12)',
    signOutColor: '#585868', signOutHoverColor: '#f87171', signOutHoverBg: 'rgba(220,38,38,0.12)',
    visitColor: '#484858', visitHoverBg: 'rgba(180,180,200,0.06)',
    themeColor: '#484858', themeHoverBg: 'rgba(180,180,200,0.06)',
    dropdownBg: 'rgba(10,10,15,0.96)', dropdownBorder: '#1e1e28',
    indicatorBg: '', indicatorDot: '', indicatorColor: '',
    mobileHeaderBg: 'rgba(10,10,15,0.88)',
    meshClass: 'admin-mesh', navAccentVar: '#94a3b8',
  };
  return {
    sidebarBg: 'linear-gradient(180deg,rgba(250,250,252,0.88) 0%,rgba(246,246,250,0.90) 60%,rgba(242,242,248,0.88) 100%)',
    sidebarBorder: 'rgba(90,90,110,0.12)', headerBorder: '#d5d5da',
    navSectionColor: '#8888a0', navActive: '#282838',
    navActiveBg: 'rgba(90,90,110,0.09)', navHoverBg: 'rgba(90,90,110,0.05)',
    navHoverColor: '#181828', navColor: '#585868',
    footerBorder: 'rgba(90,90,110,0.10)', mainBg: '#f5f5f5', mainContent: '#eeeef4',
    badge: '', badgeColor: '', logoBorderColor: '', logoColor: '#282838',
    avatarBg: 'linear-gradient(135deg,#878790,#585860)',
    userNameColor: '#18182a', userEmailColor: '#686878',
    chipBg: 'rgba(90,90,110,0.07)', chipColor: '#484858', chipBorderColor: 'rgba(90,90,110,0.12)',
    signOutColor: '#686878', signOutHoverColor: '#dc2626', signOutHoverBg: 'rgba(220,38,38,0.06)',
    visitColor: '#585868', visitHoverBg: 'rgba(90,90,110,0.05)',
    themeColor: '#686878', themeHoverBg: 'rgba(90,90,110,0.05)',
    dropdownBg: 'rgba(250,250,252,0.96)', dropdownBorder: '#d5d5da',
    indicatorBg: '', indicatorDot: '', indicatorColor: '',
    mobileHeaderBg: 'rgba(250,250,252,0.88)',
    meshClass: 'admin-mesh', navAccentVar: '#94a3b8',
  };
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isCEO, isAdmin, isStaff } = useRole();
  const { counts, total, markSeen } = useNotifications();

  const resolvedDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const t: T = isCEO
    ? ceoTheme(resolvedDark)
    : isAdmin
    ? adminTheme(resolvedDark)
    : staffTheme(resolvedDark);

  const navSections: NavSection[] = [
    {
      title: 'Main',
      items: [{ name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, badge: total > 0 ? total : undefined }],
    },
    {
      title: 'Content',
      items: [
        { name: 'Posts', path: '/admin/posts', icon: FileText, badge: counts.posts > 0 ? counts.posts : undefined },
        { name: 'Results', path: '/admin/results', icon: GraduationCap },
        ...(isCEO || isAdmin ? [{ name: 'Learning Tracks', path: '/admin/learning-tracks', icon: GraduationCap }] : []),
        { name: 'Jobs', path: '/admin/jobs', icon: Briefcase },
        ...(!isStaff ? [{ name: 'Pages', path: '/admin/pages', icon: FileEdit, badge: counts.pages > 0 ? counts.pages : undefined }] : []),
        ...(!isStaff ? [{ name: 'Comments', path: '/admin/comments', icon: MessageSquare, badge: counts.comments > 0 ? counts.comments : undefined }] : []),
        ...(!isStaff ? [{ name: 'Reviews', path: '/admin/reviews', icon: Star, badge: counts.reviews > 0 ? counts.reviews : undefined }] : []),
      ],
    },
    {
      title: 'Organization',
      items: [
        ...(!isStaff ? [{ name: 'Categories', path: '/admin/categories', icon: Folder }] : []),
        { name: 'Labels', path: '/admin/labels', icon: Tag },
        { name: 'Media', path: '/admin/media', icon: ImageIcon },
        ...(isCEO || isAdmin ? [{ name: 'Videos', path: '/admin/videos', icon: Film }] : []),
      ],
    },
    ...(!isStaff
      ? [{
          title: 'Configuration',
          items: [
            ...(isCEO || isAdmin ? [{ name: 'User Dashboard Management', path: '/admin/dashboard-management', icon: LayoutDashboard }] : []),
            { name: 'Settings', path: '/admin/settings', icon: Settings },
            { name: 'Subscribers', path: '/admin/subscribers', icon: Mail, badge: counts.subscribers > 0 ? counts.subscribers : undefined },
            ...(isCEO || isAdmin ? [{ name: 'Publishers', path: '/admin/publishers', icon: Users, badge: counts.publishers > 0 ? counts.publishers : undefined }] : []),
            ...(isCEO || isAdmin ? [{ name: 'Analytics', path: '/admin/analytics', icon: BarChart3 }] : []),
            ...(isCEO || isAdmin ? [{ name: 'Ad Management', path: '/admin/ads', icon: Monitor }] : []),
            ...(isCEO || isAdmin ? [{ name: 'Indexing Monitor', path: '/admin/indexing', icon: Radar }] : []),
            ...(isCEO ? [{ name: 'Live Activity', path: '/admin/live-activity', icon: Activity }] : []),
            ...(isCEO ? [{ name: 'AI Content Assistant', path: '/admin/ai-assistant', icon: Sparkles }] : []),
            ...(isCEO ? [{ name: 'AI Topic Discovery', path: '/admin/topic-discovery', icon: Compass }] : []),
            ...(isCEO ? [{ name: 'AI Editorial Review', path: '/admin/editorial-review', icon: ClipboardCheck }] : []),
            ...(isCEO ? [{ name: 'Social Automation', path: '/admin/social-automation', icon: Share2 }] : []),
            ...(isCEO ? [{ name: 'AI Control Center', path: '/admin/ai-control-center', icon: Cpu }] : []),
            ...(isCEO ? [{ name: 'Keyword Research', path: '/admin/keyword-research', icon: Search }] : []),
            ...(isCEO ? [{ name: 'Competitor Analysis', path: '/admin/competitor-analysis', icon: Globe }] : []),
            ...(isCEO || isAdmin ? [{ name: 'Traffic Growth', path: '/admin/traffic-growth', icon: TrendingUp }] : []),
            ...(isCEO || isAdmin ? [{ name: 'Payment Settings', path: '/admin/payment-settings', icon: CreditCard }] : []),
            ...(isCEO || isAdmin ? [{ name: 'AI Humanizer', path: '/admin/ai-humanizer', icon: Sparkles }] : []),
            ...(isCEO || isAdmin ? [{ name: 'Content Quality', path: '/admin/content-quality', icon: BarChart2 }] : []),
            ...(isCEO || isAdmin ? [{ name: 'AdSense Readiness', path: '/admin/adsense-readiness', icon: ShieldCheck }] : []),
            ...(isCEO ? [{ name: 'Messages', path: '/admin/messages', icon: Mail, badge: counts.messages > 0 ? counts.messages : undefined }] : []),
            ...(isCEO ? [{ name: 'iTango AI Editor', path: '/itango-login', icon: Bot }] : []),
          ],
        }]
      : []),
    {
      title: 'Account',
      items: [
        { name: 'Account & Security', path: '/admin/account', icon: KeyRound },
        { name: 'Author Profile', path: '/admin/author-profile', icon: UserCircle },
      ],
    },
  ];

  const handleSignOut = async () => { await signOut(); navigate('/admin/login'); };
  const isActivePath = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];
  const currentOpt = themeOptions.find(o => o.value === theme) || themeOptions[2];
  const RoleIcon = isCEO ? Crown : isAdmin ? Shield : Users;

  return (
    <div className="min-h-screen" style={{ background: t.mainBg }}>
      {/* Top header — all screen sizes */}
      <div
        className="fixed top-0 left-0 right-0 h-14 z-40 flex items-center px-4 gap-3"
        style={{
          background: t.mobileHeaderBg,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: `1px solid ${t.headerBorder}`,
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg flex-shrink-0"
          style={{ color: t.themeColor }}
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/mayobebroslogo copy copy.png" alt="Mayobe Bros" className="h-7 rounded" />
          <span className="font-bold text-sm" style={{ color: t.logoColor }}>CMS</span>
          {isCEO && t.badge && (
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest"
              style={{ background: t.badge, color: t.badgeColor }}
            >
              CEO
            </span>
          )}
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.72)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — floats above content on all screen sizes */}
      <aside
        className="fixed top-0 left-0 h-full w-64 z-50 transition-transform duration-300 ease-in-out admin-sidebar-glass"
        style={{
          background: t.sidebarBg,
          borderRight: `1px solid ${t.sidebarBorder}`,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className="h-16 flex items-center justify-between px-4"
            style={{ borderBottom: `1px solid ${t.headerBorder}` }}
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/mayobebroslogo copy copy.png"
                alt="Mayobe Bros"
                className="h-8 rounded-lg"
                style={t.logoBorderColor ? { boxShadow: `0 0 0 1px ${t.logoBorderColor}` } : undefined}
              />
              <span className="font-bold text-sm" style={{ color: t.logoColor }}>CMS</span>
              {isCEO && t.badge && (
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase shadow"
                  style={{ background: t.badge, color: t.badgeColor }}
                >
                  CEO
                </span>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg"
              style={{ color: t.themeColor }}
            >
              <X size={18} />
            </button>
          </div>

          {/* CEO access bar */}
          {isCEO && t.indicatorBg && (
            <div style={{ borderBottom: '1px solid rgba(212,175,55,0.12)', padding: '8px 16px' }}>
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                style={{ background: t.indicatorBg }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: t.indicatorDot }}
                />
                <span
                  className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: t.indicatorColor }}
                >
                  Full Access
                </span>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 admin-scroll">
            {navSections.map((section, i) => (
              <div key={i}>
                <div className="flex items-center gap-2 px-3 mb-1.5">
                  <h3
                    className="text-[9px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: t.navSectionColor }}
                  >
                    {section.title}
                  </h3>
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${t.sidebarBorder}, transparent)` }} />
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActivePath(item.path);
                    const tourMap: Record<string, string> = {
                      '/admin/dashboard': 'dashboard',
                      '/admin/posts': 'posts',
                      '/admin/media': 'media',
                      '/admin/settings': 'settings',
                      '/admin/analytics': 'analytics',
                      '/admin/ai-assistant': 'ai',
                      '/admin/ai-control-center': 'ai',
                    };
                    // iTango opens as a standalone page in a new tab
                    const isITango = item.path === '/itango-login';
                    const sharedStyle: React.CSSProperties = {
                      background: active ? t.navActiveBg : 'transparent',
                      color: active ? t.navActive : t.navColor,
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '7px 10px 7px 12px',
                      borderRadius: '10px',
                      transition: 'all 0.18s ease',
                      textDecoration: 'none',
                      position: 'relative',
                      borderLeft: active ? `2px solid ${t.navActive}` : '2px solid transparent',
                      boxShadow: active ? `0 0 16px ${t.navActiveBg}` : 'none',
                    };
                    const hoverHandlers = {
                      onMouseEnter: (e: React.MouseEvent) => {
                        if (!active) {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = t.navHoverBg;
                          el.style.color = t.navHoverColor;
                          el.style.borderLeft = `2px solid ${t.navHoverColor}40`;
                        }
                      },
                      onMouseLeave: (e: React.MouseEvent) => {
                        if (!active) {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = 'transparent';
                          el.style.color = t.navColor;
                          el.style.borderLeft = '2px solid transparent';
                        }
                      },
                    };

                    const navContent = (
                      <>
                        <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                        <span className="font-medium text-[13px]">{item.name}</span>
                        {isITango && (
                          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}>
                            NEW TAB
                          </span>
                        )}
                      </>
                    );

                    return isITango ? (
                      <a
                        key={item.path}
                        href={item.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setSidebarOpen(false)}
                        style={sharedStyle}
                        {...hoverHandlers}
                      >
                        {navContent}
                      </a>
                    ) : (
                      <Link
                        key={item.path}
                        to={item.path}
                        data-tour={tourMap[item.path]}
                        onClick={() => {
                          setSidebarOpen(false);
                          const typeMap: Record<string, keyof typeof counts> = {
                            '/admin/comments': 'comments',
                            '/admin/subscribers': 'subscribers',
                            '/admin/publishers': 'publishers',
                            '/admin/reviews': 'reviews',
                            '/admin/posts': 'posts',
                            '/admin/pages': 'pages',
                            '/admin/dashboard': 'comments',
                            '/admin/messages': 'messages',
                          };
                          const mapped = typeMap[item.path];
                          if (mapped && counts[mapped] > 0) markSeen(mapped);
                        }}
                        style={sharedStyle}
                        {...hoverHandlers}
                      >
                        {navContent}
                        {item.badge && (
                          <span
                            className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                            style={{
                              background: active ? `${t.navActive}25` : 'rgba(239,68,68,0.15)',
                              color: active ? t.navActive : '#f87171',
                              border: `1px solid ${active ? `${t.navActive}35` : 'rgba(239,68,68,0.25)'}`,
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 space-y-2" style={{ borderTop: `1px solid ${t.footerBorder}` }}>
            {/* User profile card */}
            <div
              className="rounded-xl p-3"
              style={{
                background: t.navActiveBg,
                border: `1px solid ${t.chipBorderColor}`,
              }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                {(user as any)?.profileImageUrl ? (
                  <img
                    src={(user as any).profileImageUrl}
                    alt={user?.displayName || ''}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2"
                    style={{ outline: `2px solid ${t.chipBorderColor}`, outlineOffset: '1px' }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm ring-2"
                    style={{ background: t.avatarBg, outline: `2px solid ${t.chipBorderColor}`, outlineOffset: '1px' }}
                  >
                    {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: t.userNameColor }}>
                    {user?.displayName || user?.email?.split('@')[0]}
                  </p>
                  {user?.role && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <RoleIcon size={9} style={{ color: t.chipColor }} />
                      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: t.chipColor }}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action row */}
              <div className="flex gap-1.5">
                {/* Theme picker inline */}
                <div className="relative flex-1">
                  <button
                    onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                    style={{ color: t.themeColor, background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = t.themeHoverBg}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    title="Change theme"
                  >
                    <currentOpt.icon size={13} />
                    <span className="text-[11px] font-medium">{currentOpt.label}</span>
                    <ChevronDown size={10} />
                  </button>

                  {themeMenuOpen && (
                    <div
                      className="absolute bottom-full left-0 right-0 mb-1.5 rounded-xl shadow-2xl overflow-hidden z-20"
                      style={{
                        background: t.dropdownBg,
                        border: `1px solid ${t.dropdownBorder}`,
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                      }}
                    >
                      {themeOptions.map((opt) => {
                        const Icon = opt.icon;
                        const sel = theme === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => { setTheme(opt.value as any); setThemeMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 transition-colors cursor-pointer"
                            style={{ background: sel ? t.navActiveBg : 'transparent', color: sel ? t.navActive : t.navColor }}
                            onMouseEnter={e => {
                              if (!sel) {
                                const el = e.currentTarget as HTMLElement;
                                el.style.background = t.navHoverBg;
                                el.style.color = t.navHoverColor;
                              }
                            }}
                            onMouseLeave={e => {
                              if (!sel) {
                                const el = e.currentTarget as HTMLElement;
                                el.style.background = 'transparent';
                                el.style.color = t.navColor;
                              }
                            }}
                          >
                            <Icon size={13} />
                            <span className="text-xs font-medium">{opt.label}</span>
                            {sel && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: t.navActive }} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Link
                  to="/"
                  target="_blank"
                  className="flex items-center justify-center px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                  style={{ color: t.visitColor }}
                  title="Visit site"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = t.visitHoverBg}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <Home size={13} />
                </Link>

                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                  style={{ color: t.signOutColor }}
                  title="Sign out"
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = t.signOutHoverBg;
                    el.style.color = t.signOutHoverColor;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'transparent';
                    el.style.color = t.signOutColor;
                  }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Page — always full width, offset for top header */}
      <div className="min-h-screen">
        <div className="h-14" />
        <main
          className={`p-4 lg:p-6 ${t.meshClass}`}
          style={{ minHeight: 'calc(100vh - 56px)' }}
        >
          {children}
        </main>
      </div>
      <OnboardingTour />
    </div>
  );
}
