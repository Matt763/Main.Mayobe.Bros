import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserAuthProvider } from './contexts/UserAuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ReviewsSection from './components/ReviewsSection';
import ProtectedRoute from './components/ProtectedRoute';
import CookieConsent from './components/CookieConsent';
import { AdSlotRenderer, HeadAdInjector } from './components/AdSlotRenderer';
import { trackPageView, updateCurrentPath } from './lib/analytics';
import PushNotifications from './components/PushNotifications';
import { injectJsonLd, buildWebsiteJsonLd, buildOrganizationJsonLd } from './lib/seo';

const Home = lazy(() => import('./pages/Home'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const EnhancedPostPage = lazy(() => import('./pages/EnhancedPostPage'));
const AuthorPage = lazy(() => import('./pages/AuthorPage'));
const AdvertisePage = lazy(() => import('./pages/AdvertisePage'));
const PopularPosts = lazy(() => import('./pages/PopularPosts'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage'));
const CachePolicyPage = lazy(() => import('./pages/CachePolicyPage'));
const SitemapPage = lazy(() => import('./pages/SitemapPage'));
const RSSPage = lazy(() => import('./pages/RSSPage'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const ContactUsPage = lazy(() => import('./pages/ContactUsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const DynamicPage = lazy(() => import('./pages/DynamicPage'));
const PostsDirectoryPage = lazy(() => import('./pages/PostsDirectoryPage'));
const CategoriesIndexPage = lazy(() => import('./pages/CategoriesIndexPage'));
const LabelsIndexPage = lazy(() => import('./pages/LabelsIndexPage'));

const LoginPage = lazy(() => import('./pages/admin/LoginPage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const PostsListPage = lazy(() => import('./pages/admin/PostsListPage'));
const PostEditorPage = lazy(() => import('./pages/admin/PostEditorPage'));
const PagesListPage = lazy(() => import('./pages/admin/PagesListPage'));
const PageEditorPage = lazy(() => import('./pages/admin/PageEditorPage'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const LabelsPage = lazy(() => import('./pages/admin/LabelsPage'));
const CommentsPage = lazy(() => import('./pages/admin/CommentsPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const MediaLibraryPage = lazy(() => import('./pages/admin/MediaLibraryPage'));
const SubscribersPage = lazy(() => import('./pages/admin/SubscribersPage'));
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage'));
const PublishersPage = lazy(() => import('./pages/admin/PublishersPage'));
const AccountSettingsPage = lazy(() => import('./pages/admin/AccountSettingsPage'));
const AdManagementPage = lazy(() => import('./pages/admin/AdManagementPage'));
const AuthorProfilePage = lazy(() => import('./pages/admin/AuthorProfilePage'));
const ReviewsPage = lazy(() => import('./pages/admin/ReviewsPage'));
const IndexingMonitorPage = lazy(() => import('./pages/admin/IndexingMonitorPage'));
const LiveActivityPage = lazy(() => import('./pages/admin/LiveActivityPage'));
const AIContentAssistantPage = lazy(() => import('./pages/admin/AIContentAssistantPage'));
const AdvertisingMessagesPage = lazy(() => import('./pages/admin/AdvertisingMessagesPage'));
const AITopicDiscoveryPage = lazy(() => import('./pages/admin/AITopicDiscoveryPage'));
const AIEditorialReviewPage = lazy(() => import('./pages/admin/AIEditorialReviewPage'));
const SocialAutomationPage = lazy(() => import('./pages/admin/SocialAutomationPage'));
const AIControlCenterPage = lazy(() => import('./pages/admin/AIControlCenterPage'));
const KeywordResearchPage = lazy(() => import('./pages/admin/KeywordResearchPage'));
const CompetitorAnalysisPage = lazy(() => import('./pages/admin/CompetitorAnalysisPage'));
const PaymentSettingsPage = lazy(() => import('./pages/admin/PaymentSettingsPage'));
const TrafficGrowthPage = lazy(() => import('./pages/admin/TrafficGrowthPage'));
const ContentQualityPage = lazy(() => import('./pages/admin/ContentQualityPage'));
const AdSenseReadinessPage = lazy(() => import('./pages/admin/AdSenseReadinessPage'));
const AIHumanizerPage = lazy(() => import('./pages/admin/AIHumanizerPage'));
const ITangoEditorPage = lazy(() => import('./pages/admin/ITangoEditorPage'));
const EditorialPolicyPage = lazy(() => import('./pages/EditorialPolicyPage'));
const FactCheckingPolicyPage = lazy(() => import('./pages/FactCheckingPolicyPage'));

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);
  return null;
}

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  useEffect(() => {
    updateCurrentPath(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
}

function GlobalSeoInit() {
  useEffect(() => {
    injectJsonLd('ld-website', buildWebsiteJsonLd());
    injectJsonLd('ld-organization', buildOrganizationJsonLd());
  }, []);
  return null;
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <UserAuthProvider>
            <NotificationProvider>
            <ScrollToTop />
            <AnalyticsTracker />
            <GlobalSeoInit />
            <HeadAdInjector />
            <Routes>
              <Route
                path="/admin/login"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <LoginPage />
                  </Suspense>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="posts" element={<PostsListPage />} />
                        <Route path="posts/new" element={<PostEditorPage />} />
                        <Route path="posts/edit/:id" element={<PostEditorPage />} />
                        <Route path="pages" element={<PagesListPage />} />
                        <Route path="pages/new" element={<PageEditorPage />} />
                        <Route path="pages/edit/:id" element={<PageEditorPage />} />
                        <Route path="categories" element={<CategoriesPage />} />
                        <Route path="labels" element={<LabelsPage />} />
                        <Route path="comments" element={<CommentsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="media" element={<MediaLibraryPage />} />
                        <Route path="subscribers" element={<SubscribersPage />} />
                        <Route path="analytics" element={
                          <ProtectedRoute allowedRoles={['ceo', 'admin']}>
                            <AnalyticsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="publishers" element={
                          <ProtectedRoute allowedRoles={['ceo', 'admin']}>
                            <PublishersPage />
                          </ProtectedRoute>
                        } />
                        <Route path="account" element={<AccountSettingsPage />} />
                        <Route path="ads" element={
                          <ProtectedRoute allowedRoles={['ceo', 'admin']}>
                            <AdManagementPage />
                          </ProtectedRoute>
                        } />
                        <Route path="author-profile" element={<AuthorProfilePage />} />
                        <Route path="reviews" element={<ReviewsPage />} />
                        <Route path="indexing" element={
                          <ProtectedRoute allowedRoles={['ceo', 'admin']}>
                            <IndexingMonitorPage />
                          </ProtectedRoute>
                        } />
                        <Route path="live-activity" element={
                          <ProtectedRoute allowedRoles={['ceo']}>
                            <LiveActivityPage />
                          </ProtectedRoute>
                        } />
                        <Route path="ai-assistant" element={
                          <ProtectedRoute allowedRoles={['ceo']}>
                            <AIContentAssistantPage />
                          </ProtectedRoute>
                        } />
                        <Route path="messages" element={
                          <ProtectedRoute allowedRoles={['ceo']}>
                            <AdvertisingMessagesPage />
                          </ProtectedRoute>
                        } />
                        <Route path="topic-discovery" element={
                          <ProtectedRoute allowedRoles={['ceo']}>
                            <AITopicDiscoveryPage />
                          </ProtectedRoute>
                        } />
                        <Route path="editorial-review" element={
                          <ProtectedRoute allowedRoles={['ceo']}>
                            <AIEditorialReviewPage />
                          </ProtectedRoute>
                        } />
                        <Route path="social-automation" element={
                          <ProtectedRoute allowedRoles={['ceo']}>
                            <SocialAutomationPage />
                          </ProtectedRoute>
                        } />
                        <Route path="ai-control-center" element={
                          <ProtectedRoute allowedRoles={['ceo']}>
                            <AIControlCenterPage />
                          </ProtectedRoute>
                        } />
                        <Route path="keyword-research" element={
                          <ProtectedRoute allowedRoles={['ceo']}>
                            <KeywordResearchPage />
                          </ProtectedRoute>
                        } />
                        <Route path="competitor-analysis" element={
                          <ProtectedRoute allowedRoles={['ceo']}>
                            <CompetitorAnalysisPage />
                          </ProtectedRoute>
                        } />
                        <Route path="payment-settings" element={
                          <ProtectedRoute allowedRoles={['ceo', 'admin']}>
                            <PaymentSettingsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="traffic-growth" element={
                          <ProtectedRoute allowedRoles={['ceo', 'admin']}>
                            <TrafficGrowthPage />
                          </ProtectedRoute>
                        } />
                        <Route path="content-quality" element={
                          <ProtectedRoute allowedRoles={['ceo', 'admin']}>
                            <ContentQualityPage />
                          </ProtectedRoute>
                        } />
                        <Route path="adsense-readiness" element={
                          <ProtectedRoute allowedRoles={['ceo', 'admin']}>
                            <AdSenseReadinessPage />
                          </ProtectedRoute>
                        } />
                        <Route path="ai-humanizer" element={
                          <ProtectedRoute allowedRoles={['ceo', 'admin']}>
                            <AIHumanizerPage />
                          </ProtectedRoute>
                        } />
                        <Route path="itango" element={
                          <ProtectedRoute allowedRoles={['ceo']}>
                            <ITangoEditorPage />
                          </ProtectedRoute>
                        } />
                      </Routes>
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/*"
                element={
                  <div className="min-h-screen bg-white dark:bg-black flex flex-col transition-colors">
                    <AdSlotRenderer slot="body_top" />
                    <Header />
                    <main className="flex-1">
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/category" element={<CategoriesIndexPage />} />
                          <Route path="/category/:categorySlug" element={<CategoryPage />} />
                          <Route path="/category/:categorySlug/:labelSlug" element={<CategoryPage />} />
                          <Route path="/label" element={<LabelsIndexPage />} />
                          <Route path="/post" element={<PostsDirectoryPage />} />
                          <Route path="/post/:categorySlug/:postSlug" element={<EnhancedPostPage />} />
                          <Route path="/post/:categorySlug/:labelSlug/:postSlug" element={<EnhancedPostPage />} />
                          <Route path="/author/:slug" element={<AuthorPage />} />
                          <Route path="/advertise" element={<AdvertisePage />} />
                          <Route path="/popular" element={<PopularPosts />} />
                          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
                          <Route path="/cache-policy" element={<CachePolicyPage />} />
                          <Route path="/editorial-policy" element={<EditorialPolicyPage />} />
                          <Route path="/fact-checking-policy" element={<FactCheckingPolicyPage />} />
                          <Route path="/sitemap" element={<SitemapPage />} />
                          <Route path="/rss" element={<RSSPage />} />
                          <Route path="/about" element={<AboutUsPage />} />
                          <Route path="/contact" element={<ContactUsPage />} />
                          <Route path="/page/:slug" element={<DynamicPage />} />
                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                      </Suspense>
                      <ReviewsSection />
                    </main>
                    <AdSlotRenderer slot="footer" />
                    <AdSlotRenderer slot="body_bottom" />
                    <PushNotifications />
                    <Footer />
                    <CookieConsent />
                  </div>
                }
              />
            </Routes>
            </NotificationProvider>
          </UserAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
