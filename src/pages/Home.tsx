import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowRight, TrendingUp, Tag, Award, Sparkles, Star, Zap } from 'lucide-react';
import ShareButton from '../components/ShareButton';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import TrendingSection from '../components/TrendingSection';
import NewsletterSignup from '../components/NewsletterSignup';
import Reveal from '../components/Reveal';
import { applyMeta, buildHomeMeta } from '../lib/seo';

const CATEGORY_IMAGES: Record<string, string> = {
  technology: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=1200',
  tech: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=1200',
  business: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1200',
  finance: 'https://images.pexels.com/photos/3483098/pexels-photo-3483098.jpeg?auto=compress&cs=tinysrgb&w=1200',
  health: 'https://images.pexels.com/photos/3768914/pexels-photo-3768914.jpeg?auto=compress&cs=tinysrgb&w=1200',
  lifestyle: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200',
  travel: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=1200',
  food: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200',
  sports: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1200',
  entertainment: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1200',
  science: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1200',
  education: 'https://images.pexels.com/photos/159844/cellular-education-classroom-159844.jpeg?auto=compress&cs=tinysrgb&w=1200',
  politics: 'https://images.pexels.com/photos/1550337/pexels-photo-1550337.jpeg?auto=compress&cs=tinysrgb&w=1200',
  culture: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1200',
  nature: 'https://images.pexels.com/photos/4350050/pexels-photo-4350050.jpeg?auto=compress&cs=tinysrgb&w=1200',
  fashion: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=1200',
  automotive: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1200',
  real: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200',
  music: 'https://images.pexels.com/photos/164693/pexels-photo-164693.jpeg?auto=compress&cs=tinysrgb&w=1200',
  art: 'https://images.pexels.com/photos/1269968/pexels-photo-1269968.jpeg?auto=compress&cs=tinysrgb&w=1200',
};

const FALLBACK_IMAGES = [
  'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/3768914/pexels-photo-3768914.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1200',
];

function getCategoryImage(slug: string, index: number): string {
  const lower = slug.toLowerCase();
  for (const key of Object.keys(CATEGORY_IMAGES)) {
    if (lower.includes(key)) return CATEGORY_IMAGES[key];
  }
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryId: string;
  categorySlug?: string;
  categoryName?: string;
  labelId?: string;
  labelSlug?: string;
  labelName?: string;
  publishedAt: string;
  views: number;
  score?: number;
  views_1h?: number;
  views_24h?: number;
  isPremium?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface Label {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
}

interface LabelSection {
  label: Label;
  category: Category;
  posts: Post[];
}

const LABEL_HEADINGS: Record<string, { heading: string; subheading: string }> = {};

function getLabelHeading(labelName: string, categoryName: string, index: number): { heading: string; subheading: string } {
  const key = `${labelName}-${categoryName}`;
  if (LABEL_HEADINGS[key]) return LABEL_HEADINGS[key];
  const headings = [
    { heading: `Inside ${labelName}`, subheading: `The stories shaping ${categoryName} — hand-picked for curious minds` },
    { heading: `${labelName} Spotlight`, subheading: `Deep dives and fresh perspectives from ${categoryName}` },
    { heading: `Fresh from ${labelName}`, subheading: `What's new, what matters, and what's next in ${categoryName}` },
    { heading: `${labelName} in Focus`, subheading: `Essential reads for everyone following ${categoryName}` },
    { heading: `Exploring ${labelName}`, subheading: `Bold ideas and compelling stories from ${categoryName}` },
    { heading: `${labelName} Essentials`, subheading: `The must-reads shaping the conversation in ${categoryName}` },
  ];
  const result = headings[index % headings.length];
  LABEL_HEADINGS[key] = result;
  return result;
}

const DEFAULT_HERO_IMAGE = 'https://images.pexels.com/photos/3177662/pexels-photo-3177662.jpeg?auto=compress&cs=tinysrgb&w=1920';

function PostCard({ post, index, size = 'normal' }: { post: Post; index: number; size?: 'normal' | 'small' | 'horizontal' }) {
  const postUrl = post.labelSlug
    ? `/post/${post.categorySlug}/${post.labelSlug}/${post.slug}`
    : `/post/${post.categorySlug}/${post.slug}`;

  if (size === 'horizontal') {
    return (
      <Link
        key={post.id}
        to={postUrl}
        className="group flex gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
      >
        <div className="relative w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden">
          <img
            src={post.featuredImage || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]}
            alt={post.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {post.isPremium && (
            <div className="absolute top-1 right-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">PREMIUM</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {post.categoryName && (
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 block mb-1">{post.categoryName}</span>
          )}
          <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-1.5">
            {post.title}
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(post.publishedAt).toLocaleDateString()}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      key={post.id}
      to={postUrl}
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl dark:hover:shadow-2xl transition-all transform hover:-translate-y-1"
    >
      <div className={`relative ${size === 'small' ? 'h-36' : 'h-44 sm:h-48'} overflow-hidden`}>
        <img
          src={post.featuredImage || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]}
          alt={post.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {post.categoryName && (
            <span className="bg-blue-600 dark:bg-blue-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
              {post.categoryName}
            </span>
          )}
          {post.isPremium && (
            <span className="bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-bold">PREMIUM</span>
          )}
        </div>
      </div>
      <div className={size === 'small' ? 'p-3 sm:p-4' : 'p-4 sm:p-6'}>
        <h3 className={`${size === 'small' ? 'text-sm' : 'text-lg sm:text-xl'} font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2`}>
          {post.title}
        </h3>
        {size !== 'small' && (
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 line-clamp-3 mb-3 sm:mb-4 transition-colors">
            {post.excerpt || post.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...'}
          </p>
        )}
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-colors">
          <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
          <ShareButton
            title={post.title}
            url={window.location.origin + postUrl}
          />
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [editorsPicks, setEditorsPicks] = useState<Post[]>([]);
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [labelSections, setLabelSections] = useState<LabelSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [labelLoading, setLabelLoading] = useState(true);
  const [error, setError] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState(DEFAULT_HERO_IMAGE);
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [heroMediaType, setHeroMediaType] = useState<'image' | 'video'>('image');
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    applyMeta(buildHomeMeta());
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [postsData, categoriesData, trendingData, settingsData, labelsRaw] = await Promise.all([
        api.posts.list({ limit: 50 }),
        api.categories.list(),
        supabase
          .from('posts')
          .select('id, title, slug, excerpt, featured_image, category_id, views, published_at, is_premium, categories(name, slug)')
          .eq('status', 'published')
          .order('views', { ascending: false })
          .limit(12)
          .then(({ data }) => data || []),
        api.settings.get().catch(() => null),
        api.labels.list().catch(() => []),
      ]);

      if (settingsData?.hero) {
        const { imageUrl, videoUrl, mediaType } = settingsData.hero;
        if (imageUrl) setHeroImageUrl(imageUrl);
        if (videoUrl) setHeroVideoUrl(videoUrl);
        if (mediaType) setHeroMediaType(mediaType);
      }

      const cats: Category[] = (categoriesData || []).map((c: any) => ({
        id: c.id, name: c.name, slug: c.slug, description: c.description || null,
      }));
      setCategories(cats);

      const catMap = new Map(cats.map(c => [c.id, c]));

      const toPost = (p: any): Post => {
        const cat = catMap.get(p.categoryId || p.category_id);
        const catFromJoin = p.categories as any;
        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          content: p.content || '',
          excerpt: p.excerpt || null,
          featuredImage: p.featuredImage || p.featured_image || null,
          categoryId: p.categoryId || p.category_id,
          categorySlug: cat?.slug || catFromJoin?.slug || p.categorySlug || '',
          categoryName: cat?.name || catFromJoin?.name || p.categoryName || '',
          publishedAt: p.publishedAt || p.published_at || p.createdAt || '',
          views: p.views || 0,
          isPremium: p.isPremium || p.is_premium || false,
        };
      };

      const usedIds = new Set<string>();
      const allNormalized = (postsData || []).map(toPost);

      const take = (source: Post[], count: number) => {
        const result: Post[] = [];
        for (const p of source) {
          if (result.length >= count) break;
          if (!usedIds.has(p.id)) {
            result.push(p);
            usedIds.add(p.id);
          }
        }
        return result;
      };

      setRecentPosts(take(allNormalized, 6));

      const trendingSource: Post[] = trendingData.length > 0
        ? trendingData.map((p: any) => ({
            id: p.id, title: p.title, slug: p.slug, content: '',
            excerpt: p.excerpt || null,
            featuredImage: p.featured_image || null,
            categoryId: p.category_id || '', categorySlug: p.categories?.slug || '',
            categoryName: p.categories?.name || '', publishedAt: p.published_at || '',
            views: p.views || 0, isPremium: p.is_premium || false,
          }))
        : [...allNormalized].sort((a, b) => b.views - a.views);
      setTrendingPosts(take(trendingSource, 6));

      const featuredSource = allNormalized.filter(p => p.views > 10);
      setEditorsPicks(take(featuredSource.length > 0 ? featuredSource : allNormalized, 4));

      setPopularPosts(take([...allNormalized].sort((a, b) => b.views - a.views), 4));

      const olderPosts = [...allNormalized].sort((a, b) =>
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      );
      const mixedRecommended: Post[] = [];
      for (let i = 0; i < olderPosts.length && mixedRecommended.length < 6; i++) {
        if (!usedIds.has(olderPosts[i].id)) {
          mixedRecommended.push(olderPosts[i]);
          usedIds.add(olderPosts[i].id);
        }
      }
      if (mixedRecommended.length < 3) {
        for (const p of allNormalized) {
          if (mixedRecommended.length >= 6) break;
          if (!usedIds.has(p.id)) {
            mixedRecommended.push(p);
            usedIds.add(p.id);
          }
        }
      }
      setRecommendedPosts(mixedRecommended);

      setLoading(false);
      buildLabelSections(cats, postsData || [], labelsRaw || []);
    } catch (err) {
      console.error('Error loading home data:', err);
      setError(true);
      setLoading(false);
      setLabelLoading(false);
    }
  };

  const buildLabelSections = (cats: Category[], allPosts: any[], labelsRaw: any[]) => {
    try {
      const labels: Label[] = labelsRaw.map((l: any) => ({
        id: l.id, categoryId: l.categoryId || l.category_id, name: l.name, slug: l.slug,
      }));

      const labelsByCat = new Map<string, Label[]>();
      for (const lbl of labels) {
        const arr = labelsByCat.get(lbl.categoryId) || [];
        arr.push(lbl);
        labelsByCat.set(lbl.categoryId, arr);
      }

      const topCats = cats.slice(0, 6);
      const sections: LabelSection[] = [];

      for (const cat of topCats) {
        const catLabels = labelsByCat.get(cat.id) || [];
        if (catLabels.length === 0) continue;

        const labelCounts = new Map<string, number>();
        for (const post of allPosts) {
          const lid = post.labelId || post.label_id;
          const cid = post.categoryId || post.category_id;
          if (lid && cid === cat.id) {
            labelCounts.set(lid, (labelCounts.get(lid) || 0) + 1);
          }
        }

        let topLabel = catLabels[0];
        let maxCount = labelCounts.get(topLabel.id) || 0;
        for (const lbl of catLabels) {
          const count = labelCounts.get(lbl.id) || 0;
          if (count > maxCount) { maxCount = count; topLabel = lbl; }
        }

        const labelPosts = allPosts
          .filter((p: any) => (p.labelId || p.label_id) === topLabel.id)
          .slice(0, 3)
          .map((p: any) => ({
            id: p.id, title: p.title, slug: p.slug, content: '',
            excerpt: p.excerpt || null, featuredImage: p.featuredImage || p.featured_image || null,
            categoryId: p.categoryId || p.category_id, categorySlug: cat.slug, categoryName: cat.name,
            labelId: p.labelId || p.label_id, labelSlug: topLabel.slug, labelName: topLabel.name,
            publishedAt: p.publishedAt || p.published_at || p.createdAt || '', views: p.views || 0,
          }));

        if (labelPosts.length > 0) {
          sections.push({ label: topLabel, category: cat, posts: labelPosts });
        }
      }

      setLabelSections(sections);
    } catch (err) {
      console.error('Error building label sections:', err);
    } finally {
      setLabelLoading(false);
    }
  };

  const SkeletonGrid = ({ count = 6 }: { count?: number }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-700" />
          <div className="p-6 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      {/* Hero */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ height: '900px' }}>
        {heroMediaType === 'video' && heroVideoUrl ? (
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover scale-[1.02]" poster={heroImageUrl || undefined}>
            <source src={heroVideoUrl} type="video/mp4" />
          </video>
        ) : (
          <div className="absolute inset-0 bg-cover bg-center scale-[1.02] transition-transform duration-700"
            style={{ backgroundImage: `url(${heroImageUrl || DEFAULT_HERO_IMAGE})`, backgroundPosition: 'center 40%' }} />
        )}
        {resolvedTheme === 'dark' ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white to-transparent" />
          </>
        )}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col items-center text-center gap-5">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border backdrop-blur-sm ${
              resolvedTheme === 'dark' ? 'bg-white/10 border-white/20 text-white' : 'bg-black/10 border-black/20 text-gray-800'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Knowledge &amp; Insights
            </div>
            <h1 className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Mayobe <span className="text-blue-600">Bros</span>
            </h1>
            <p className={`text-lg sm:text-xl max-w-lg leading-relaxed font-light ${
              resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Empowering minds with knowledge, insights, and stories that inspire.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/popular" className="bg-blue-600 text-white px-7 py-3.5 rounded-full hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 font-semibold flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-600/30">
                <TrendingUp size={17} /> Explore Popular Posts
              </Link>
              <Link to="/advertise" className={`px-7 py-3.5 rounded-full transition-all hover:scale-105 active:scale-95 font-semibold flex items-center justify-center gap-2 text-sm border ${
                resolvedTheme === 'dark' ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 shadow-sm'
              }`}>
                Advertise With Us <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Posts — rises up into view */}
      <Reveal as="section" type="up" className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-colors">Recent Posts</h2>
          <Link to="/popular" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors text-sm sm:text-base">
            View All <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
          </Link>
        </div>
        {loading ? <SkeletonGrid /> : error ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-3">Unable to load posts right now.</p>
            <button onClick={() => { setError(false); setLoading(true); loadData(); }} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Try again</button>
          </div>
        ) : (
          <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {recentPosts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400"><p className="text-lg">No posts published yet.</p></div>
            ) : recentPosts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </Reveal>
        )}
      </Reveal>

      {/* Trending Now — fades in with depth */}
      <Reveal type="fade">
        <TrendingSection posts={trendingPosts} />
      </Reveal>

      {/* Editor's Picks — slides in from the right */}
      {editorsPicks.length > 0 && (
        <Reveal as="section" type="right" className="py-12 sm:py-16 bg-white dark:bg-black transition-colors">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 mb-1">
              <Star size={18} className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Hand-Picked</span>
            </div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Editor's Picks</h2>
              <Link to="/popular" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold flex items-center gap-1 text-sm transition-colors">
                See All <ArrowRight size={15} />
              </Link>
            </div>
            <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {editorsPicks.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} size="small" />
              ))}
            </Reveal>
          </div>
        </Reveal>
      )}

      {/* Categories — zooms in from slight scale */}
      <Reveal as="section" type="zoom" className="bg-gray-50 dark:bg-gray-900 py-12 sm:py-16 transition-colors">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white transition-colors">Explore Our Categories</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">Dive into topics that matter to you</p>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(3)].map((_, i) => <div key={i} className="rounded-2xl h-64 animate-pulse bg-gray-200 dark:bg-gray-800" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {categories.map((category, index) => {
                const imgUrl = getCategoryImage(category.slug, index);
                return (
                  <Link key={category.id} to={`/category/${category.slug}`}
                    className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1.5 duration-300"
                    style={{ height: '260px' }}>
                    <img src={imgUrl} alt={category.name} loading="lazy" decoding="async"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                      <h3 className="text-xl sm:text-2xl font-black text-white mb-1 leading-tight drop-shadow-md">{category.name}</h3>
                      <p className="text-white/80 text-sm line-clamp-2 mb-3 leading-relaxed">{category.description || 'Discover amazing content and insights'}</p>
                      <span className="inline-flex items-center gap-1.5 text-white text-xs font-semibold tracking-wide uppercase bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded-full group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-300">
                        Explore <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>

      {/* Label Sections */}
      {labelLoading ? (
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 space-y-16">
            {[...Array(3)].map((_, si) => (
              <div key={si}>
                <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                <div className="h-4 w-80 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-8" />
                <SkeletonGrid count={3} />
              </div>
            ))}
          </div>
        </section>
      ) : labelSections.length > 0 ? (
        <div>
          {labelSections.map((section, sectionIndex) => {
            const { heading, subheading } = getLabelHeading(section.label.name, section.category.name, sectionIndex);
            const isAlternate = sectionIndex % 2 === 1;
            return (
              /* Odd sections slide from left, even from right — variety as you scroll */
              <Reveal key={section.label.id} as="section" type={isAlternate ? 'right' : 'left'} className={`py-14 sm:py-20 transition-colors ${isAlternate ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-black'}`}>
                <div className="container mx-auto px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-blue-600 dark:text-blue-400">
                          <Tag size={12} /> {section.label.name}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">/</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{section.category.name}</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight">{heading}</h2>
                      <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm sm:text-base max-w-xl">{subheading}</p>
                    </div>
                    <Link to={`/category/${section.category.slug}/${section.label.slug}`}
                      className="shrink-0 inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm transition-colors group">
                      See all in {section.label.name} <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                  <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {section.posts.map((post, postIndex) => (
                      <PostCard key={post.id} post={post} index={postIndex} />
                    ))}
                  </Reveal>
                </div>
              </Reveal>
            );
          })}
        </div>
      ) : null}

      {/* Popular Articles — slides in from left */}
      {popularPosts.length > 0 && (
        <Reveal as="section" type="left" className="py-12 sm:py-16 bg-white dark:bg-black transition-colors">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Award size={18} className="text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">All-Time Favourites</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Most Popular Articles</h2>
              </div>
              <Link to="/popular" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1 text-sm transition-colors">
                See All <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {popularPosts.map((post, index) => (
                <Link key={post.id} to={`/post/${post.categorySlug}/${post.slug}`}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl dark:hover:shadow-2xl transition-all transform hover:-translate-y-1">
                  <div className="relative h-40 overflow-hidden">
                    <img src={post.featuredImage || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]} alt={post.title} loading="lazy" decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow">{index + 1}</div>
                    {post.categoryName && (
                      <div className="absolute top-2 right-2 bg-blue-600/90 text-white px-2 py-0.5 rounded-full text-xs font-semibold">{post.categoryName}</div>
                    )}
                    {post.isPremium && (
                      <div className="absolute bottom-2 right-2 bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">PREMIUM</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2 leading-snug">{post.title}</h3>
                    <div className="flex justify-end">
                      <ShareButton
                        title={post.title}
                        url={`${window.location.origin}/post/${post.categorySlug}/${post.slug}`}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Recommended For You — slides in from right */}
      {recommendedPosts.length > 0 && (
        <Reveal as="section" type="right" className="py-10 sm:py-14 bg-gray-50 dark:bg-gray-900 transition-colors">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 mb-6">
              <Zap size={18} className="text-green-600 dark:text-green-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400">Discover More</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Recommended For You</h2>
              <Link to="/popular" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1 text-sm transition-colors">
                View All <ArrowRight size={15} />
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">Stories you might have missed -- revisit the archives</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {recommendedPosts.slice(0, 3).map((post, index) => (
                <PostCard key={post.id} post={post} index={index} size="horizontal" />
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Latest Articles — drops down into view */}
      {recentPosts.length > 0 && (
        <Reveal as="section" type="down" className="py-10 sm:py-14 bg-white dark:bg-black transition-colors">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Fresh Off the Press</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Latest Articles</h2>
              <Link to="/popular" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1 text-sm transition-colors">
                View All <ArrowRight size={15} />
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">The newest stories published on Mayobe Bros</p>
            <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {recentPosts.slice(0, 3).map((post, index) => (
                <PostCard key={post.id} post={post} index={index} size="horizontal" />
              ))}
            </Reveal>
          </div>
        </Reveal>
      )}

      <Reveal type="up">
        <NewsletterSignup variant="banner" title="Never miss a story" subtitle="Join thousands of readers getting the best articles delivered to their inbox." />
      </Reveal>
    </div>
  );
}
