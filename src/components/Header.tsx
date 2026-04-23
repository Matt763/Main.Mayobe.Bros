import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, LogOut, CircleUser as UserCircle2, ChevronDown, Home } from 'lucide-react';
import { api } from '../lib/api';
import SearchModal from './SearchModal';
import ThemeToggle from './ThemeToggle';
import AuthModal from './AuthModal';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useUserAuth } from '../contexts/UserAuthContext';

interface Category { id: string; name: string; slug: string; }
interface Label { id: string; name: string; slug: string; categoryId?: string; }
interface MenuPage { id: string; title: string; slug: string; }

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [labels, setLabels] = useState<Record<string, Label[]>>({});
  const [menuPages, setMenuPages] = useState<MenuPage[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { settings } = useSiteSettings();
  const { publicUser, publicSignOut } = useUserAuth();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdmin) loadCategories();
  }, [isAdmin]);

  // Close drawer on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadCategories = async () => {
    try {
      const [categoriesData, labelsData, pagesData] = await Promise.all([
        api.categories.list(),
        api.labels.list(),
        api.pages.list({ status: 'published' }).catch(() => []),
      ]);

      if (categoriesData) setCategories(categoriesData);

      if (labelsData) {
        const labelsByCategory = labelsData.reduce((acc: Record<string, Label[]>, label: any) => {
          if (!acc[label.categoryId]) acc[label.categoryId] = [];
          acc[label.categoryId].push(label);
          return acc;
        }, {} as Record<string, Label[]>);
        setLabels(labelsByCategory);
      }

      if (pagesData) {
        const inMenu = (pagesData as any[]).filter((p: any) => p.showInMenu && p.published);
        setMenuPages(inMenu.map((p: any) => ({ id: p.id, title: p.title, slug: p.slug })));
      }
    } catch (err) {
      console.error('Error loading navigation:', err);
    }
  };

  const openSignIn = () => { setAuthModalMode('signin'); setAuthModalOpen(true); };
  const openSignUp = () => { setAuthModalMode('signup'); setAuthModalOpen(true); };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  if (isAdmin) return null;

  const avatarInitial = publicUser?.name?.[0]?.toUpperCase() || 'U';
  const logoSrc = settings.logo_url || '/mayobebroslogo copy copy.png';
  const siteName = settings.site_title || 'Mayobe Bros';

  return (
    <>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* ── Sticky header bar ── */}
      <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-40 transition-colors">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">

          {/* Top row: logo + controls */}
          <div className="flex items-center justify-between py-3 sm:py-4">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
              <img
                src={logoSrc}
                alt={siteName}
                className="h-10 sm:h-12 w-auto max-w-[180px] sm:max-w-[240px] object-contain"
              />
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Search"
              >
                <Search size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <ThemeToggle />

              {publicUser ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileMenuOpen(o => !o)}
                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity focus:outline-none"
                    aria-label="Profile menu"
                  >
                    {publicUser.avatar_url ? (
                      <img
                        src={publicUser.avatar_url}
                        alt={publicUser.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900">
                        {avatarInitial}
                      </div>
                    )}
                    <ChevronDown size={14} className={`text-gray-500 dark:text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{publicUser.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{publicUser.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => setProfileMenuOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <UserCircle2 size={16} className="text-gray-400" />
                          My Profile
                        </button>
                        <button
                          onClick={() => { setProfileMenuOpen(false); publicSignOut(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut size={16} />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={openSignIn}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={openSignUp}
                    className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all transform hover:scale-105"
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Hamburger — mobile only */}
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-800 dark:text-gray-200"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>

          {/* Bottom row: desktop category navigation */}
          <div className="hidden lg:flex items-center border-t border-gray-100 dark:border-gray-800 py-2.5 gap-1">
            <Link
              to="/"
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap"
            >
              Home
            </Link>
            {categories.map((category) => (
              <div
                key={category.id}
                className="relative"
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  to={`/category/${category.slug}`}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap"
                >
                  {category.name}
                  {labels[category.id]?.length > 0 && (
                    <ChevronDown size={13} className={`transition-transform ${hoveredCategory === category.id ? 'rotate-180' : ''}`} />
                  )}
                </Link>
                {labels[category.id]?.length > 0 && hoveredCategory === category.id && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 min-w-[200px] border border-gray-100 dark:border-gray-700 z-50">
                    {labels[category.id].map((label) => (
                      <Link
                        key={label.id}
                        to={`/category/${category.slug}/${label.slug}`}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {label.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {menuPages.map((page) => (
              <Link
                key={page.id}
                to={`/page/${page.slug}`}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap"
              >
                {page.title}
              </Link>
            ))}
            <div className="ml-auto">
              <Link
                to="/advertise"
                className="bg-blue-600 text-white px-5 py-1.5 text-sm rounded-full hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
              >
                Advertise
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────
          Mobile drawer — rendered outside header so z-index is unrestricted
      ───────────────────────────────────────────────────────────────────── */}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed top-0 left-0 h-full w-[82vw] max-w-xs bg-white dark:bg-gray-900 z-50 shadow-2xl flex flex-col lg:hidden transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <Link to="/" onClick={() => setIsMenuOpen(false)}>
            <img
              src={logoSrc}
              alt={siteName}
              className="h-9 w-auto max-w-[150px] object-contain"
            />
          </Link>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* ── Scrollable nav area ── */}
        <nav className="flex-1 overflow-y-auto overscroll-contain">

          {/* Home */}
          <div className="px-3 pt-3 pb-1">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                location.pathname === '/'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Home size={17} className="flex-shrink-0" />
              Home
            </Link>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="px-3 pb-1">
              <p className="px-3 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 select-none">
                Categories
              </p>
              {categories.map((category) => {
                const hasLabels = (labels[category.id]?.length ?? 0) > 0;
                const isExpanded = expandedCategories.has(category.id);
                const isActive = location.pathname.startsWith(`/category/${category.slug}`);

                return (
                  <div key={category.id}>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/category/${category.slug}`}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex-1 flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {category.name}
                      </Link>
                      {hasLabels && (
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                          aria-label={isExpanded ? `Collapse ${category.name}` : `Expand ${category.name}`}
                        >
                          <ChevronDown
                            size={15}
                            className={`text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Sub-labels with smooth accordion */}
                    <div
                      className="overflow-hidden transition-all duration-250 ease-in-out"
                      style={{ maxHeight: isExpanded ? `${(labels[category.id]?.length ?? 0) * 44 + 8}px` : '0' }}
                    >
                      <div className="ml-3 mb-1 pl-3 border-l-2 border-blue-100 dark:border-gray-700">
                        {labels[category.id]?.map((label) => (
                          <Link
                            key={label.id}
                            to={`/category/${category.slug}/${label.slug}`}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center gap-2.5 py-2.5 px-2 text-sm rounded-lg transition-colors ${
                              location.pathname === `/category/${category.slug}/${label.slug}`
                                ? 'text-blue-600 dark:text-blue-400 font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 flex-shrink-0" />
                            {label.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Menu pages */}
          {menuPages.length > 0 && (
            <div className="px-3 pb-1">
              <p className="px-3 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 select-none">
                Pages
              </p>
              {menuPages.map((page) => (
                <Link
                  key={page.id}
                  to={`/page/${page.slug}`}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
                    location.pathname === `/page/${page.slug}`
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {page.title}
                </Link>
              ))}
            </div>
          )}

          {/* Advertise CTA */}
          <div className="px-6 pt-3 pb-6">
            <Link
              to="/advertise"
              onClick={() => setIsMenuOpen(false)}
              className="block text-center bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
              Advertise With Us
            </Link>
          </div>
        </nav>

        {/* Auth footer — pinned at bottom */}
        {!publicUser && (
          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
            <button
              onClick={() => { setIsMenuOpen(false); openSignIn(); }}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-full hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsMenuOpen(false); openSignUp(); }}
              className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-full hover:bg-blue-700 active:scale-95 transition-all"
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Logged-in user strip */}
        {publicUser && (
          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {publicUser.avatar_url ? (
                <img src={publicUser.avatar_url} alt={publicUser.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500 flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {avatarInitial}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{publicUser.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{publicUser.email}</p>
              </div>
            </div>
            <button
              onClick={() => { setIsMenuOpen(false); publicSignOut(); }}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
              aria-label="Log out"
            >
              <LogOut size={17} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
