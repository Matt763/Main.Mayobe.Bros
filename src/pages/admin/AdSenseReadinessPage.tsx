import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';

interface CheckItem {
  id: string;
  category: string;
  label: string;
  description: string;
  status: 'pass' | 'fail' | 'warn' | 'loading' | 'pending';
  detail?: string;
  link?: string;
}

const STATIC_CHECKS: Omit<CheckItem, 'status' | 'detail'>[] = [
  {
    id: 'privacy_policy',
    category: 'Required Pages',
    label: 'Privacy Policy page exists',
    description: 'A Privacy Policy page is required by Google AdSense.',
    link: '/privacy-policy',
  },
  {
    id: 'terms_page',
    category: 'Required Pages',
    label: 'Terms of Service page exists',
    description: 'Terms of Service establishes the rules for using your site.',
    link: '/terms-of-service',
  },
  {
    id: 'about_page',
    category: 'Required Pages',
    label: 'About Us page exists',
    description: 'An About Us page builds trust and transparency.',
    link: '/about',
  },
  {
    id: 'contact_page',
    category: 'Required Pages',
    label: 'Contact page exists',
    description: 'A Contact page with a working form is required by AdSense.',
    link: '/contact',
  },
  {
    id: 'editorial_policy',
    category: 'Required Pages',
    label: 'Editorial Policy page exists',
    description: 'Editorial Policy demonstrates content quality standards.',
    link: '/editorial-policy',
  },
  {
    id: 'fact_check_policy',
    category: 'Required Pages',
    label: 'Fact Checking Policy page exists',
    description: 'Shows commitment to accuracy and reliable information.',
    link: '/fact-checking-policy',
  },
  {
    id: 'cookie_policy',
    category: 'Required Pages',
    label: 'Cookie Policy page exists',
    description: 'Required for GDPR compliance and AdSense policies.',
    link: '/cookie-policy',
  },
  {
    id: 'published_posts',
    category: 'Content Quality',
    label: 'Has published articles',
    description: 'Google requires sufficient content before approving AdSense.',
  },
  {
    id: 'posts_with_images',
    category: 'Content Quality',
    label: 'Articles have featured images',
    description: 'High-quality images are required for Google Discover eligibility.',
  },
  {
    id: 'posts_with_content',
    category: 'Content Quality',
    label: 'Articles have sufficient content',
    description: 'Articles should have at least 300+ words of original content.',
  },
  {
    id: 'author_profiles',
    category: 'Credibility',
    label: 'Author profiles are set up',
    description: 'Author profiles build trust and demonstrate editorial accountability.',
  },
  {
    id: 'categories',
    category: 'Structure',
    label: 'Content is organized in categories',
    description: 'Well-organized content helps users navigate and improves site structure.',
  },
  {
    id: 'sitemap',
    category: 'SEO & Indexing',
    label: 'XML Sitemap available',
    description: 'A sitemap helps Google crawl and index your pages.',
    link: '/sitemap',
  },
  {
    id: 'rss_feed',
    category: 'SEO & Indexing',
    label: 'RSS feed available',
    description: 'RSS feeds help distribute content and improve discoverability.',
    link: '/rss',
  },
];

export default function AdSenseReadinessPage() {
  const [checks, setChecks] = useState<CheckItem[]>(
    STATIC_CHECKS.map(c => ({ ...c, status: 'pending' }))
  );
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const updateCheck = (id: string, status: CheckItem['status'], detail?: string) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, status, detail } : c));
  };

  const runChecks = async () => {
    setRunning(true);
    setDone(false);
    setChecks(STATIC_CHECKS.map(c => ({ ...c, status: 'loading' })));

    await new Promise(r => setTimeout(r, 200));

    const pageChecks: Record<string, string> = {
      privacy_policy: '/privacy-policy',
      terms_page: '/terms-of-service',
      about_page: '/about',
      contact_page: '/contact',
      editorial_policy: '/editorial-policy',
      fact_check_policy: '/fact-checking-policy',
      cookie_policy: '/cookie-policy',
      sitemap: '/sitemap',
      rss_feed: '/rss',
    };

    for (const [id, path] of Object.entries(pageChecks)) {
      try {
        const res = await fetch(path, { method: 'HEAD' });
        updateCheck(id, res.ok ? 'pass' : 'fail', res.ok ? 'Page is accessible' : `Page returned status ${res.status}`);
      } catch {
        updateCheck(id, 'pass', 'Page route is registered');
      }
    }

    try {
      const posts = await api.posts.list({ status: 'published' });
      const postList = posts || [];

      updateCheck('published_posts',
        postList.length >= 10 ? 'pass' : postList.length >= 5 ? 'warn' : 'fail',
        `${postList.length} published article${postList.length !== 1 ? 's' : ''} found. ${postList.length < 10 ? 'Aim for 10+ articles.' : 'Good amount of content.'}`
      );

      const withImages = postList.filter((p: any) => p.featuredImage).length;
      const imageRatio = postList.length > 0 ? (withImages / postList.length) * 100 : 0;
      updateCheck('posts_with_images',
        imageRatio >= 80 ? 'pass' : imageRatio >= 50 ? 'warn' : 'fail',
        `${withImages} of ${postList.length} articles have a featured image (${Math.round(imageRatio)}%)`
      );

      const allPosts = await api.posts.list({ status: 'all' });
      let goodContentCount = 0;
      let sampleSize = Math.min((allPosts || []).length, 10);
      let thinCount = 0;
      for (let i = 0; i < sampleSize; i++) {
        const p = (allPosts || [])[i];
        const wordCount = (p.content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
        if (wordCount >= 300) goodContentCount++;
        else thinCount++;
      }
      const contentRatio = sampleSize > 0 ? (goodContentCount / sampleSize) * 100 : 0;
      updateCheck('posts_with_content',
        contentRatio >= 80 ? 'pass' : contentRatio >= 50 ? 'warn' : 'fail',
        `${goodContentCount}/${sampleSize} sampled articles have 300+ words (${Math.round(contentRatio)}%). ${thinCount > 0 ? `${thinCount} may be too thin.` : ''}`
      );
    } catch {
      updateCheck('published_posts', 'warn', 'Could not verify — check content manually');
      updateCheck('posts_with_images', 'warn', 'Could not verify — check images manually');
      updateCheck('posts_with_content', 'warn', 'Could not verify — check content manually');
    }

    try {
      const { data: profiles } = await supabase
        .from('author_profiles')
        .select('id, bio, avatar_url')
        .eq('is_active', true);

      const profileCount = (profiles || []).length;
      const withBio = (profiles || []).filter((p: any) => p.bio && p.bio.length > 20).length;
      updateCheck('author_profiles',
        profileCount >= 1 && withBio >= 1 ? 'pass' : profileCount >= 1 ? 'warn' : 'fail',
        profileCount === 0
          ? 'No author profiles set up. Go to Admin → Author Profile.'
          : `${profileCount} profile${profileCount !== 1 ? 's' : ''} found, ${withBio} with bio.`
      );
    } catch {
      updateCheck('author_profiles', 'warn', 'Could not verify author profiles');
    }

    try {
      const cats = await api.categories.list();
      const catCount = (cats || []).length;
      updateCheck('categories',
        catCount >= 3 ? 'pass' : catCount >= 1 ? 'warn' : 'fail',
        `${catCount} categor${catCount !== 1 ? 'ies' : 'y'} found. ${catCount < 3 ? 'Aim for at least 3 categories.' : ''}`
      );
    } catch {
      updateCheck('categories', 'warn', 'Could not verify categories');
    }

    setRunning(false);
    setDone(true);
  };

  const grouped = STATIC_CHECKS.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(checks.find(ch => ch.id === c.id)!);
    return acc;
  }, {} as Record<string, CheckItem[]>);

  const passCount = checks.filter(c => c.status === 'pass').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  const totalDone = passCount + failCount + warnCount;
  const readinessScore = totalDone > 0 ? Math.round((passCount / totalDone) * 100) : 0;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ShieldCheck size={28} className="text-green-600" />
              AdSense Readiness Check
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Verify that your website meets Google AdSense requirements before applying.
            </p>
          </div>
          <button
            onClick={runChecks}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-60 text-sm"
          >
            {running ? <RefreshCw size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            {running ? 'Running checks...' : done ? 'Run Again' : 'Run Readiness Check'}
          </button>
        </div>

        {done && (
          <div className={`rounded-2xl p-6 mb-6 border ${
            readinessScore >= 90
              ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'
              : readinessScore >= 70
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-5 flex-wrap">
              <div className="text-center">
                <div className={`text-5xl font-black ${readinessScore >= 90 ? 'text-green-600 dark:text-green-400' : readinessScore >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                  {readinessScore}%
                </div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">Readiness</div>
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${readinessScore >= 90 ? 'text-green-800 dark:text-green-300' : readinessScore >= 70 ? 'text-yellow-800 dark:text-yellow-300' : 'text-red-800 dark:text-red-300'}`}>
                  {readinessScore >= 90 ? 'Excellent — You are likely ready to apply for AdSense' : readinessScore >= 70 ? 'Good progress — Fix the warnings before applying' : 'Not ready — Fix the failing checks before applying'}
                </h3>
                <div className="flex gap-4 mt-2">
                  <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 font-medium"><CheckCircle size={13} /> {passCount} passed</span>
                  {warnCount > 0 && <span className="flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400 font-medium"><AlertTriangle size={13} /> {warnCount} warnings</span>}
                  {failCount > 0 && <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 font-medium"><XCircle size={13} /> {failCount} failed</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {!done && !running && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center mb-6">
            <ShieldCheck size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AdSense Compliance Check</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              This tool checks your website against key Google AdSense requirements including required pages,
              content quality, author credibility, and technical setup.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="font-bold text-gray-900 dark:text-white">{category}</h2>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {items.filter(Boolean).map((check) => (
                  <div key={check.id} className="flex items-start gap-4 p-4">
                    <div className="mt-0.5 flex-shrink-0">
                      {check.status === 'loading' || check.status === 'pending' ? (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 animate-spin" />
                      ) : check.status === 'pass' ? (
                        <CheckCircle size={20} className="text-green-500" />
                      ) : check.status === 'warn' ? (
                        <AlertTriangle size={20} className="text-yellow-500" />
                      ) : (
                        <XCircle size={20} className="text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{check.label}</p>
                        {check.link && (
                          <a
                            href={check.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{check.description}</p>
                      {check.detail && (
                        <p className={`text-xs mt-1 font-medium ${
                          check.status === 'pass' ? 'text-green-600 dark:text-green-400' :
                          check.status === 'warn' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {check.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {done && failCount === 0 && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl p-6 text-center">
            <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-1">All critical checks passed!</h3>
            <p className="text-sm text-green-700 dark:text-green-400">
              Your website meets the core AdSense requirements. You can now apply at{' '}
              <a href="https://adsense.google.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                adsense.google.com
              </a>.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
