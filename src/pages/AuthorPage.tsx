import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { User, ExternalLink, Twitter, Globe, Linkedin, Facebook, Eye, Calendar, ArrowLeft } from 'lucide-react';
import { applyMeta, buildStaticMeta, SITE_NAME } from '../lib/seo';

interface AuthorProfile {
  id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  role: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  articles_count: number;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  categorySlug: string;
  categoryName: string;
  publishedAt: string;
  views: number;
}

const ROLE_LABELS: Record<string, string> = {
  ceo: 'Founder & CEO',
  admin: 'Managing Editor',
  editor: 'Editor',
  author: 'Staff Writer',
  contributor: 'Contributor',
  publisher: 'Publisher',
  staff: 'Publisher',
};

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (profile) {
      applyMeta(buildStaticMeta(
        profile.display_name,
        profile.bio
          ? profile.bio.slice(0, 160)
          : `Read articles by ${profile.display_name} on ${SITE_NAME}.`,
        `/author/${slug}`,
      ));
    }
  }, [profile, slug]);

  useEffect(() => {
    if (slug) loadAuthor(slug);
  }, [slug]);

  const loadAuthor = async (authorSlug: string) => {
    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('author_profiles')
        .select('*')
        .eq('slug', authorSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (!profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData as AuthorProfile);

      const [postsData, categoriesData] = await Promise.all([
        api.posts.list(),
        api.categories.list(),
      ]);

      const catMap = new Map(
        (categoriesData || []).map((c: any) => [c.id, c])
      );

      const displayName = profileData.display_name.toLowerCase();
      const authorPosts: Post[] = (postsData || [])
        .filter((p: any) => p.author && p.author.toLowerCase() === displayName)
        .map((p: any) => {
          const cat: any = catMap.get(p.categoryId);
          return {
            id: p.id,
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt || null,
            featuredImage: p.featuredImage || null,
            categorySlug: cat?.slug || '',
            categoryName: cat?.name || '',
            publishedAt: p.publishedAt || p.createdAt || '',
            views: p.views || 0,
          };
        });

      setPosts(authorPosts);
    } catch (err) {
      console.error('Error loading author:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-5xl mx-auto px-4 py-16 space-y-6">
          <div className="flex gap-6 animate-pulse">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-full bg-gray-100 dark:bg-gray-900 rounded" />
              <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-900 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={28} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Author not found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">This author profile doesn't exist or isn't active.</p>
          <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[profile.role || ''] || 'Writer';

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white dark:ring-gray-800 shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl sm:text-4xl font-black ring-4 ring-white dark:ring-gray-800 shadow-xl">
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full">
                  {roleLabel}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {posts.length} article{posts.length !== 1 ? 's' : ''} published
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3">
                {profile.display_name}
              </h1>

              {profile.bio && (
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base sm:text-lg max-w-2xl mb-5">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                {profile.twitter_url && (
                  <a
                    href={profile.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    <Twitter size={16} /> Twitter
                  </a>
                )}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Linkedin size={16} /> LinkedIn
                  </a>
                )}
                {profile.facebook_url && (
                  <a
                    href={profile.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Facebook size={16} /> Facebook
                  </a>
                )}
                {profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <Globe size={16} /> Website <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Articles by {profile.display_name}
        </h2>

        {posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <User size={40} className="mx-auto mb-3 opacity-40" />
            <p>No published articles yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/post/${post.categorySlug}/${post.slug}`}
                className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg dark:hover:shadow-2xl transition-all hover:-translate-y-0.5"
              >
                {post.featuredImage && (
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {post.categoryName && (
                      <div className="absolute top-3 left-3 bg-blue-600 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                        {post.categoryName}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={11} />
                      {(post.views || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
