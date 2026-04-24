import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Calendar, User, ArrowLeft, Heart, Laugh, Frown, ThumbsUp, AlertCircle, Angry, Clock, CheckCircle, ChevronRight, Reply, Trash2, MessageSquare, Crown, ChevronDown, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserAuth } from '../contexts/UserAuthContext';
import ReaderAuthModal from '../components/ReaderAuthModal';
import { useReactions } from '../hooks/useReactions';
import SocialShare from '../components/SocialShare';
import VoiceNarration from '../components/VoiceNarration';
import NewsletterSignup from '../components/NewsletterSignup';
import { applyMeta, buildPostMeta, buildArticleJsonLd, buildBreadcrumbJsonLd, buildItemListJsonLd, injectJsonLd, removeJsonLd, SITE_URL } from '../lib/seo';
import { useTheme } from '../contexts/ThemeContext';
import { AdSlotRenderer } from '../components/AdSlotRenderer';
import { usePlyrInit } from '../hooks/usePlyrInit';
import VideoSchemaMarkup from '../components/VideoSchemaMarkup';
import VideoAdPlayer from '../components/VideoAdPlayer';

const TOC_ACTIVE = '#347c25';

function generateToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const reactionIcons = {
  love: { icon: Heart, emoji: '❤️', label: 'Love' },
  laugh: { icon: Laugh, emoji: '😄', label: 'Laugh' },
  wow: { icon: AlertCircle, emoji: '😲', label: 'Wow' },
  think: { icon: ThumbsUp, emoji: '🤔', label: 'Think' },
  sad: { icon: Frown, emoji: '😢', label: 'Sad' },
  angry: { icon: Angry, emoji: '🤬', label: 'Angry' },
};

export default function EnhancedPostPage() {
  const { categorySlug, labelSlug, postSlug } = useParams();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const { user: adminUser } = useAuth();
  const { publicUser } = useUserAuth();
  const [post, setPost] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [commentForm, setCommentForm] = useState({ name: '', email: '', content: '' });
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [commentHoneypot, setCommentHoneypot] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const commentTokenRef = useRef(generateToken());
  const lastCommentRef = useRef<number>(0);

  usePlyrInit(contentRef, post?.content || '');
  const [activeSection, setActiveSection] = useState('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyForm, setReplyForm] = useState({ name: '', email: '', content: '' });
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [authorProfile, setAuthorProfile] = useState<any | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingReaction, setPendingReaction] = useState<string | null>(null);

  const {
    reactions,
    userReaction,
    handleReaction,
    animating,
    clearAnimating,
  } = useReactions(post?.id ?? '', publicUser?.id ?? null);

  const userIdentifier = useMemo(() => {
    let id = localStorage.getItem('user_id');
    if (!id) {
      id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user_id', id);
    }
    return id;
  }, []);

  const userToken = useMemo(() => {
    let token = localStorage.getItem('comment_user_token');
    if (!token) {
      token = generateToken();
      localStorage.setItem('comment_user_token', token);
    }
    return token;
  }, []);

  const tableOfContents = useMemo(() => {
    if (!post) return [];

    const headings: { id: string; text: string; level: number }[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content, 'text/html');
    const headingEls = doc.querySelectorAll('h2, h3, h4');

    headingEls.forEach((el, index) => {
      const text = el.textContent?.trim() || '';
      if (!text) return;
      const level = parseInt(el.tagName[1]);
      const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      headings.push({ id, text, level });
    });

    return headings;
  }, [post]);

  useEffect(() => {
    if (!post || tableOfContents.length === 0) return;
    const contentEl = document.querySelector('.article-content, .post-content, article');
    if (!contentEl) return;

    const allHeadings = contentEl.querySelectorAll('h2, h3, h4');
    allHeadings.forEach((h, i) => {
      const text = h.textContent?.trim() || '';
      const id = `heading-${i}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      h.setAttribute('id', id);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    allHeadings.forEach(h => { if (h.id) observer.observe(h); });
    return () => observer.disconnect();
  }, [post, tableOfContents]);

  useEffect(() => {
    loadPost();
  }, [categorySlug, labelSlug, postSlug]);

  useEffect(() => {
    if (post) {
      loadComments();
    }
  }, [post]);

  useEffect(() => {
    if (!post) return;

    const path = location.pathname;
    applyMeta(buildPostMeta(post, path));

    injectJsonLd('ld-article', buildArticleJsonLd(post, path));

    const breadcrumbItems = [
      { name: 'Home', url: SITE_URL },
      { name: post.category?.name || '', url: `${SITE_URL}/category/${categorySlug}` },
    ];
    if (labelSlug && post.label) {
      breadcrumbItems.push({ name: post.label.name, url: `${SITE_URL}/category/${categorySlug}/${labelSlug}` });
    }
    breadcrumbItems.push({ name: post.title, url: `${SITE_URL}${path}` });
    injectJsonLd('ld-breadcrumb', buildBreadcrumbJsonLd(breadcrumbItems));

    setTimeout(() => {
      const articleEl = document.querySelector('.article-content');
      if (!articleEl) return;
      articleEl.querySelectorAll('img').forEach((img: HTMLImageElement) => {
        if (!img.getAttribute('alt') || img.getAttribute('alt') === '') {
          img.setAttribute('alt', post.title);
        }
        if (!img.getAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
        if (!img.getAttribute('decoding')) {
          img.setAttribute('decoding', 'async');
        }
      });
      articleEl.querySelectorAll('a[href]').forEach((a: Element) => {
        const href = (a as HTMLAnchorElement).href;
        const isExternal = href && !href.includes('mayobebros.com') && (href.startsWith('http://') || href.startsWith('https://'));
        if (isExternal) {
          a.setAttribute('rel', 'noopener noreferrer nofollow');
          a.setAttribute('target', '_blank');
        }
      });
    }, 200);

    if (relatedPosts.length > 0) {
      injectJsonLd('ld-related', buildItemListJsonLd(relatedPosts, 'Related Articles', `${SITE_URL}${path}`));
    }

    return () => {
      removeJsonLd('ld-article');
      removeJsonLd('ld-breadcrumb');
      removeJsonLd('ld-related');
    };
  }, [post, relatedPosts, location.pathname]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(false);
      const [categoriesData, labelsData, postItem, postsData] = await Promise.all([
        api.categories.list(),
        api.labels.list(),
        api.posts.get(postSlug!),
        api.posts.list({ category: categorySlug }),
      ]);

      if (!postItem) { setError(true); return; }

      const cat = (categoriesData || []).find((c: any) => c.slug === categorySlug);
      if (!cat) { setError(true); return; }

      const label = labelSlug
        ? (labelsData || []).find((l: any) => l.slug === labelSlug && l.categoryId === cat.id)
        : null;

      const postWithMeta = {
        ...postItem,
        featured_image: postItem.featuredImage,
        published_at: postItem.publishedAt,
        category: cat,
        label: label || null,
      };
      setPost(postWithMeta as any);

      api.posts.trackView(postItem.slug).catch(() => {});

      const sessionId = localStorage.getItem('user_id') || '';
      fetch('/api/trending/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: postItem.id, postSlug: postItem.slug, sessionId }),
      }).catch(() => {});

      const sameLabelPosts = (postsData || [])
        .filter((p: any) => p.id !== postItem.id && p.labelId === postItem.labelId && postItem.labelId)
        .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
        .slice(0, 3)
        .map((p: any) => ({
          ...p,
          featured_image: p.featuredImage,
          published_at: p.publishedAt,
          category: cat,
        }));

      const sameCatPosts = (postsData || [])
        .filter((p: any) => p.id !== postItem.id && !sameLabelPosts.find((s: any) => s.id === p.id))
        .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
        .slice(0, 6 - sameLabelPosts.length)
        .map((p: any) => ({
          ...p,
          featured_image: p.featuredImage,
          published_at: p.publishedAt,
          category: cat,
        }));

      setRelatedPosts([...sameLabelPosts, ...sameCatPosts].slice(0, 6) as any);

      if (postItem.author) {
        supabase
          .from('author_profiles')
          .select('*')
          .ilike('display_name', postItem.author)
          .eq('is_active', true)
          .maybeSingle()
          .then(({ data }) => { if (data) setAuthorProfile(data); });
      }
    } catch (err) {
      console.error('Error loading post:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!post) return;

    const data = await api.comments.list({ postId: post.id, status: 'approved' });
    if (data) {
      const normalized = (data || [])
        .filter((c: any) => !c.is_deleted)
        .map((c: any) => ({
          ...c,
          user_name: c.author || c.user_name || '',
          created_at: c.createdAt || c.created_at || '',
        }));
      setComments(normalized);

      if (normalized.length > 0) {
        const commentIds = normalized.map((c: any) => c.id);
        const { data: repliesData } = await supabase
          .from('comment_replies')
          .select('*')
          .in('comment_id', commentIds)
          .eq('status', 'approved')
          .order('created_at', { ascending: true });

        if (repliesData) {
          const grouped: Record<string, any[]> = {};
          for (const r of repliesData) {
            if (!grouped[r.comment_id]) grouped[r.comment_id] = [];
            grouped[r.comment_id].push(r);
          }
          setReplies(grouped);
        }
      }
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!post) return;
    setReplyError('');

    if (!replyForm.name.trim() || !replyForm.email.trim() || !replyForm.content.trim()) {
      setReplyError('All fields are required.');
      return;
    }
    if (replyForm.content.trim().length < 3) {
      setReplyError('Reply is too short.');
      return;
    }

    setReplySubmitting(true);
    try {
      const { error } = await supabase
        .from('comment_replies')
        .insert({
          comment_id: commentId,
          post_id: post.id,
          author: replyForm.name.trim(),
          email: replyForm.email.trim(),
          content: replyForm.content.trim(),
          author_role: adminUser?.role || null,
          status: 'approved',
        });

      if (error) throw error;

      setReplyForm({ name: '', email: '', content: '' });
      setActiveReplyId(null);
      await loadComments();
    } catch {
      setReplyError('Failed to submit reply. Please try again.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      await supabase
        .from('comments')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', commentId);

      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {
      // silent fail
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    setCommentError('');

    if (commentHoneypot) return;

    const authorRole = adminUser?.role || null;
    const isPrivileged = !!authorRole;

    if (!isPrivileged) {
      const now = Date.now();
      const cooldown = 30_000;
      if (now - lastCommentRef.current < cooldown) {
        const wait = Math.ceil((cooldown - (now - lastCommentRef.current)) / 1000);
        setCommentError(`Please wait ${wait} seconds before submitting again.`);
        return;
      }

      if (!commentForm.content.trim() || commentForm.content.trim().length < 3) {
        setCommentError('Comment is too short.');
        return;
      }
    }

    setCommentSubmitting(true);
    try {
      await api.comments.create({
        postId: post.id,
        author: commentForm.name,
        email: commentForm.email,
        content: commentForm.content,
        authorRole,
        idempotencyToken: commentTokenRef.current,
        userToken,
      });

      lastCommentRef.current = Date.now();
      commentTokenRef.current = generateToken();
      setCommentForm({ name: '', email: '', content: '' });

      if (isPrivileged) {
        await loadComments();
      } else {
        setCommentSubmitted(true);
        setTimeout(() => {
          setCommentSubmitted(false);
        }, 30000);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('wait') || msg.includes('429')) {
        setCommentError('Please wait a moment before submitting again.');
      } else if (msg.includes('Duplicate') || msg.includes('409')) {
        setCommentError('Duplicate submission detected.');
      } else {
        setCommentError('Failed to submit comment. Please try again.');
      }
      console.error('Error submitting comment:', err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const headerH = (document.querySelector('header') as HTMLElement)?.offsetHeight ?? 64;
    const tocEl   = document.getElementById('mobile-toc-bar');
    const tocH    = window.innerWidth < 1024 && tocEl ? tocEl.offsetHeight : 0;
    const offset  = headerH + tocH + 4; // 4px breathing room below sticky bars
    window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    setActiveSection(id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
        <div className="h-64 sm:h-80 md:h-96 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center transition-colors">
        <div className="text-center px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Post not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <VideoSchemaMarkup post={post} />
      {/* Smart sticky video ad — fixed overlay, auto-plays muted on scroll */}
      <VideoAdPlayer />
      <nav aria-label="Breadcrumb" className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl py-2.5">
          <ol className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-wrap">
            <li><Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link></li>
            <li><ChevronRight size={12} /></li>
            <li>
              <Link
                to={`/category/${categorySlug}`}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {post.category?.name}
              </Link>
            </li>
            {post.label && (
              <>
                <li><ChevronRight size={12} /></li>
                <li>
                  <Link
                    to={`/category/${categorySlug}/${post.label.slug}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {post.label.name}
                  </Link>
                </li>
              </>
            )}
            <li><ChevronRight size={12} /></li>
            <li className="text-gray-700 dark:text-gray-300 font-medium line-clamp-1 max-w-xs sm:max-w-sm">{post.title}</li>
          </ol>
        </div>
      </nav>
      <section className="relative flex items-end overflow-hidden" style={{ height: 'clamp(420px, 60vw, 720px)' }}>
        {post.featured_image ? (
          <div
            className="absolute inset-0 bg-cover bg-center scale-[1.02] transition-transform duration-700"
            style={{ backgroundImage: `url(${post.featured_image})`, backgroundPosition: 'center 40%' }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-800 dark:to-gray-900" />
        )}

        {resolvedTheme === 'dark' ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white to-transparent" />
          </>
        )}

        <div className="relative z-10 w-full container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl pb-8 sm:pb-12 md:pb-16">
          <Link
            to={`/category/${post.category.slug}${post.label ? `/${post.label.slug}` : ''}`}
            className={`inline-flex items-center gap-2 mb-4 transition-colors text-sm font-medium min-h-[44px] ${
              resolvedTheme === 'dark'
                ? 'text-white/80 hover:text-white'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <ArrowLeft size={18} />
            Back to {post.label?.name || post.category.name}
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-wider uppercase ${
              resolvedTheme === 'dark'
                ? 'bg-blue-600/80 text-white'
                : 'bg-blue-600 text-white'
            }`}>
              {post.category.name}{post.label && ` / ${post.label.name}`}
            </span>
            {post.isPremium && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/90 text-white shadow-lg">
                <Crown size={12} />
                PREMIUM
              </span>
            )}
          </div>

          <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-4 max-w-4xl ${
            resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {post.title}
          </h1>

          <div className={`flex flex-wrap gap-3 sm:gap-5 text-sm mb-4 ${
            resolvedTheme === 'dark' ? 'text-white/80' : 'text-gray-600'
          }`}>
            <div className="flex items-center gap-1.5">
              <User size={15} />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={15} />
              <span>{Math.max(1, Math.round(post.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200))} min read</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={15} />
              <span className="hidden sm:inline">{new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="sm:hidden">{new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          <SocialShare title={post.title} description={post.excerpt} variant="ghost" />
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12 max-w-7xl">
        {/* ── Mobile TOC ── must be OUTSIDE the grid; sticky inside a grid row is
            constrained to that row's own height and barely works at all.        */}
        {tableOfContents.length > 1 && (
          <div id="mobile-toc-bar" className="lg:hidden sticky top-16 sm:top-20 z-30 -mx-4 sm:-mx-6 md:-mx-8">
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
              {/* Collapsed header — scroll-aware 3-item preview */}
              <button
                onClick={() => setMobileTocOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2 min-h-[44px]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                  <List size={15} style={{ color: TOC_ACTIVE, flexShrink: 0 }} />
                  {(() => {
                    const idx = tableOfContents.findIndex(h => h.id === activeSection);
                    if (idx === -1) {
                      return (
                        <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                          Table of Contents
                        </span>
                      );
                    }
                    const prev = idx > 0 ? tableOfContents[idx - 1] : null;
                    const curr = tableOfContents[idx];
                    const next = idx < tableOfContents.length - 1 ? tableOfContents[idx + 1] : null;
                    return (
                      <div className="flex flex-col min-w-0 flex-1 leading-tight gap-px">
                        {prev && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                            {prev.text}
                          </span>
                        )}
                        <span className="text-[13px] font-semibold truncate" style={{ color: TOC_ACTIVE }}>
                          {curr.text}
                        </span>
                        {next && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                            {next.text}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {/* Reading progress dots */}
                  {(() => {
                    const activeIdx = tableOfContents.findIndex(h => h.id === activeSection);
                    return (
                      <div className="hidden sm:flex items-center gap-[3px]">
                        {tableOfContents.map((h, i) => (
                          <div
                            key={h.id}
                            className="rounded-full transition-all duration-300"
                            style={{
                              width: h.id === activeSection ? '6px' : '4px',
                              height: h.id === activeSection ? '6px' : '4px',
                              background: h.id === activeSection
                                ? TOC_ACTIVE
                                : i < activeIdx ? '#a3d99a' : '#d1d5db',
                            }}
                          />
                        ))}
                      </div>
                    );
                  })()}
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${mobileTocOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Expandable full list */}
              {mobileTocOpen && (
                <nav className="max-h-64 overflow-y-auto border-t border-gray-100 dark:border-gray-700 py-1.5">
                  {tableOfContents.map((heading) => {
                    const isActive = activeSection === heading.id;
                    return (
                      <button
                        key={heading.id}
                        onClick={() => { scrollToSection(heading.id); setMobileTocOpen(false); }}
                        className={`block w-full text-left text-[13px] py-2.5 border-l-2 transition-all duration-150 ${
                          heading.level === 2 ? 'pl-5' : heading.level === 3 ? 'pl-9' : 'pl-12'
                        } ${
                          isActive
                            ? 'font-semibold'
                            : 'text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        style={isActive ? {
                          color: TOC_ACTIVE,
                          borderLeftColor: TOC_ACTIVE,
                          background: 'rgba(52,124,37,0.06)',
                        } : {}}
                      >
                        {heading.text}
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {tableOfContents.length > 1 && (
            <aside className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-colors max-h-[calc(100vh-120px)] overflow-y-auto">
                {/* TOC header */}
                <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-1.5 h-4 rounded-full" style={{ background: TOC_ACTIVE }} />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                    Table of Contents
                  </h3>
                </div>
                <nav className="p-2 space-y-0.5">
                  {tableOfContents.map((heading) => {
                    const isActive = activeSection === heading.id;
                    return (
                      <button
                        key={heading.id}
                        onClick={() => scrollToSection(heading.id)}
                        className={`group block w-full text-left text-[13px] py-2 pr-3 rounded-xl transition-all duration-200 ${
                          heading.level === 2 ? 'pl-3' : heading.level === 3 ? 'pl-6' : 'pl-9'
                        } ${
                          isActive
                            ? 'font-semibold'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                        style={isActive ? { color: TOC_ACTIVE } : {}}
                      >
                        <div className="flex items-start gap-1.5">
                          <div
                            className="shrink-0 w-0.5 rounded-full mt-[5px] transition-all duration-300"
                            style={{ height: '12px', background: isActive ? TOC_ACTIVE : 'transparent' }}
                          />
                          <span
                            className={`leading-snug rounded-lg px-1.5 py-0.5 transition-all duration-200 line-clamp-2 ${
                              isActive ? 'bg-green-50 dark:bg-green-900/20' : ''
                            }`}
                          >
                            {heading.text}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>
          )}

          <article className={tableOfContents.length > 1 ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <VoiceNarration text={post.content} title={post.title} />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 md:p-8 mb-6 md:mb-8 transition-colors">
              <div
                ref={contentRef}
                className="article-content max-w-none text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(post.content, {
                    ADD_TAGS: ['figure', 'figcaption', 'sub', 'sup', 'iframe'],
                    ADD_ATTR: [
                      'class', 'target', 'rel', 'title',
                      'style',                                    // preserve video embed margins
                      'src', 'width', 'height',                   // iframe / img
                      'frameborder', 'allowfullscreen', 'allow',  // YouTube/Vimeo embeds
                      'controls', 'autoplay', 'loop', 'playsinline', 'poster', // <video>
                    ],
                    ALLOW_DATA_ATTR: true,
                    FORCE_BODY: true,
                    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
                  }),
                }}
              />
              <AdSlotRenderer slot="in_article" className="my-6 overflow-hidden rounded-xl" />


              <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                  How did you feel about this article?
                </h3>
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {Object.entries(reactionIcons).map(([type, { emoji, label }]) => {
                    const isSelected = userReaction === type;
                    const count = reactions[type] || 0;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          if (!publicUser) {
                            setPendingReaction(type);
                            setAuthModalOpen(true);
                          } else {
                            handleReaction(type);
                          }
                        }}
                        onAnimationEnd={() => { if (animating === type) clearAnimating(); }}
                        className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border-2 transition-all duration-150 min-w-[60px] ${
                          animating === type ? 'reaction-pop' : ''
                        } ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 scale-110 shadow-sm'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <span className="text-2xl leading-none">{emoji}</span>
                        <span className={`text-[11px] font-medium leading-none mt-0.5 ${
                          isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>{label}</span>
                        {count > 0 && (
                          <span className={`text-[10px] font-bold leading-none ${
                            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                          }`}>{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!publicUser && (
                  <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                    <button
                      onClick={() => setAuthModalOpen(true)}
                      className="text-blue-500 dark:text-blue-400 hover:underline font-medium"
                    >Sign in</button>{' '}to react to this article
                  </p>
                )}
              </div>
            </div>

            {authorProfile && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 sm:p-6 mb-6 md:mb-8 transition-colors">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">About the Author</p>
                <div className="flex items-start gap-4">
                  {authorProfile.avatar_url ? (
                    <img
                      src={authorProfile.avatar_url}
                      alt={authorProfile.display_name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-black flex-shrink-0 ring-2 ring-gray-100 dark:ring-gray-700">
                      {authorProfile.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link
                        to={`/author/${authorProfile.slug}`}
                        className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {authorProfile.display_name}
                      </Link>
                      {authorProfile.role && (
                        <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                          {{ceo:'Founder & CEO',admin:'Managing Editor',editor:'Editor',publisher:'Publisher',staff:'Publisher',author:'Publisher',contributor:'Contributor'}[authorProfile.role] || authorProfile.role}
                        </span>
                      )}
                    </div>
                    {authorProfile.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                        {authorProfile.bio}
                      </p>
                    )}
                    <Link
                      to={`/author/${authorProfile.slug}`}
                      className="inline-block mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View all articles
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 md:p-8 transition-colors">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 transition-colors">Comments ({comments.length})</h3>

              {commentSubmitted ? (
                <div className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                      <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-300 text-sm sm:text-base">
                        Thank you for your comment.
                      </p>
                      <p className="text-green-700 dark:text-green-400 text-sm mt-1 leading-relaxed">
                        Your comment has been submitted for review. Once it is approved, it will appear here on this post.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCommentSubmit} className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 transition-colors">Leave a Comment</h4>

                  <input type="text" name="phone_number" value={commentHoneypot} onChange={e => setCommentHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} />

                  {commentError && (
                    <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                      <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-400">{commentError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <input
                      type="text"
                      placeholder="Your Name"
                      required
                      maxLength={100}
                      value={commentForm.name || (adminUser?.displayName ?? '')}
                      onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm sm:text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors min-h-[44px]"
                    />
                    <input
                      type="email"
                      placeholder="Your Email"
                      required
                      maxLength={200}
                      value={commentForm.email || (adminUser?.email ?? '')}
                      onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm sm:text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors min-h-[44px]"
                    />
                  </div>
                  <textarea
                    placeholder="Write your comment..."
                    required
                    rows={4}
                    maxLength={5000}
                    value={commentForm.content}
                    onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm sm:text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none mb-3 sm:mb-4 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={commentSubmitting}
                    className="bg-blue-600 dark:bg-blue-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors font-medium text-sm sm:text-base min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {commentSubmitting ? 'Submitting...' : 'Post Comment'}
                  </button>
                </form>
              )}

              <div className="space-y-4 sm:space-y-6">
                {comments.map((comment) => {
                  const role = comment.authorRole || comment.author_role;
                  const isCEOComment = role === 'ceo';
                  const isAdminComment = role === 'admin';
                  const isPublisherComment = role === 'publisher' || role === 'staff';
                  const isPrivileged = isCEOComment || isAdminComment || isPublisherComment;
                  const avatarBg = isCEOComment
                    ? 'bg-amber-500 dark:bg-amber-400'
                    : isAdminComment
                    ? 'bg-blue-700 dark:bg-blue-600'
                    : isPublisherComment
                    ? 'bg-teal-600 dark:bg-teal-500'
                    : 'bg-blue-600 dark:bg-blue-500';

                  const canDelete = comment.user_token === userToken || (adminUser?.role === 'ceo');
                  const commentReplies = replies[comment.id] || [];
                  const isReplyOpen = activeReplyId === comment.id;

                  return (
                    <div key={comment.id}>
                      <div
                        className={`rounded-xl p-4 sm:p-5 transition-colors ${
                          isPrivileged
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                            : 'bg-gray-50 dark:bg-gray-700/60'
                        }`}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 ${avatarBg} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base`}>
                            {comment.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white transition-colors">{comment.user_name}</span>
                              {isCEOComment && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                                  <CheckCircle size={11} /> CEO
                                </span>
                              )}
                              {isAdminComment && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                                  <CheckCircle size={11} /> Admin
                                </span>
                              )}
                              {isStaffComment && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                                  <CheckCircle size={11} /> Staff
                                </span>
                              )}
                              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-colors">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 transition-colors leading-relaxed break-words">{comment.content}</p>
                            <div className="flex items-center gap-3 mt-3">
                              <button
                                onClick={() => {
                                  setActiveReplyId(isReplyOpen ? null : comment.id);
                                  setReplyError('');
                                  if (!isReplyOpen) setReplyForm({ name: adminUser?.displayName || '', email: adminUser?.email || '', content: '' });
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                <Reply size={13} />
                                Reply {commentReplies.length > 0 && `(${commentReplies.length})`}
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  disabled={deletingCommentId === comment.id}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                >
                                  <Trash2 size={13} />
                                  {deletingCommentId === comment.id ? 'Deleting...' : 'Delete'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {commentReplies.length > 0 && (
                        <div className="ml-8 sm:ml-12 mt-2 space-y-2">
                          {commentReplies.map((reply) => {
                            const replyRole = reply.author_role;
                            const replyIsCEO = replyRole === 'ceo';
                            const replyIsAdmin = replyRole === 'admin';
                            const replyIsPublisher = replyRole === 'publisher' || replyRole === 'staff';
                            const replyAvatarBg = replyIsCEO
                              ? 'bg-amber-500'
                              : replyIsAdmin
                              ? 'bg-blue-700'
                              : replyIsPublisher
                              ? 'bg-teal-600'
                              : 'bg-gray-500';
                            return (
                              <div key={reply.id} className="flex gap-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 sm:p-4">
                                <div className={`w-7 h-7 ${replyAvatarBg} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-xs`}>
                                  {reply.author.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="font-semibold text-xs text-gray-900 dark:text-white">{reply.author}</span>
                                    {replyIsCEO && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"><CheckCircle size={9} /> CEO</span>}
                                    {replyIsAdmin && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"><CheckCircle size={9} /> Admin</span>}
                                    {replyIsStaff && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300"><CheckCircle size={9} /> Staff</span>}
                                    <span className="text-[10px] text-gray-400">{new Date(reply.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">{reply.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {isReplyOpen && (
                        <div className="ml-8 sm:ml-12 mt-2 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <MessageSquare size={14} className="text-blue-500" />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reply to {comment.user_name}</span>
                          </div>
                          {replyError && (
                            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5 mb-3 text-xs text-red-700 dark:text-red-400">
                              <AlertCircle size={13} />
                              {replyError}
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
                            <input
                              type="text"
                              placeholder="Your Name"
                              required
                              value={replyForm.name}
                              onChange={(e) => setReplyForm({ ...replyForm, name: e.target.value })}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            />
                            <input
                              type="email"
                              placeholder="Your Email"
                              required
                              value={replyForm.email}
                              onChange={(e) => setReplyForm({ ...replyForm, email: e.target.value })}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            />
                          </div>
                          <textarea
                            placeholder="Write your reply..."
                            required
                            rows={3}
                            maxLength={2000}
                            value={replyForm.content}
                            onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-2.5 transition-colors"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleReplySubmit(comment.id)}
                              disabled={replySubmitting}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
                            >
                              {replySubmitting ? 'Posting...' : 'Post Reply'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setActiveReplyId(null); setReplyError(''); }}
                              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          <ReaderAuthModal
            open={authModalOpen}
            onClose={() => { setAuthModalOpen(false); setPendingReaction(null); }}
            onSuccess={() => {
              if (pendingReaction) {
                handleReaction(pendingReaction);
                setPendingReaction(null);
              }
            }}
          />
          </article>
        </div>
      </div>

      {post.author && (
        <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row gap-5">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-blue-100 dark:ring-blue-900">
                  {post.author.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Written by</span>
                <div className="mt-0.5">
                  <Link
                    to={`/author/${post.author.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {post.author}
                  </Link>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Staff writer at Mayobe Bros. Covering stories that inspire, inform and ignite curiosity.
                </p>
                <Link
                  to={`/author/${post.author.toLowerCase().replace(/\s+/g, '-')}`}
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <User size={14} />
                  View all articles by {post.author}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl pb-8">
        <div className="max-w-4xl mx-auto">
          <NewsletterSignup
            variant="inline"
            title="Enjoyed this article?"
            subtitle="Subscribe to get the latest stories delivered to your inbox."
          />
        </div>
      </div>

      {relatedPosts.length > 0 && (
        <>
          <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-6">
            <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Continue Reading</span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedPosts.slice(0, 3).map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    to={`/post/${relatedPost.category.slug}/${relatedPost.slug}`}
                    className="group flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors"
                  >
                    <div className="relative w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={relatedPost.featured_image || 'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={relatedPost.title}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 block mb-0.5">{relatedPost.category.name}</span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                        {relatedPost.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <section className="bg-gray-50 dark:bg-gray-800 py-8 sm:py-12 md:py-16 transition-colors">
            <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
              <div className="text-center mb-8 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Recommended For You</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">More articles you might enjoy based on this topic</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    to={`/post/${relatedPost.category.slug}/${relatedPost.slug}`}
                    className="group bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl dark:hover:shadow-2xl transition-all transform hover:-translate-y-1"
                  >
                    <div className="relative h-44 sm:h-48 overflow-hidden">
                      <img
                        src={relatedPost.featured_image || 'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?auto=compress&cs=tinysrgb&w=800'}
                        alt={relatedPost.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-blue-600 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                        {relatedPost.category.name}
                      </div>
                    </div>
                    <div className="p-4 sm:p-5">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-2">
                        {relatedPost.title}
                      </h3>
                      <div className="flex items-center justify-end text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <span>{new Date(relatedPost.published_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
