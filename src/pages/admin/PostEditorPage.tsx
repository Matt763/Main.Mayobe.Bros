import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../hooks/useRole';
import AdminLayout from '../../components/admin/AdminLayout';
import RichTextEditor, { type RichTextEditorHandle } from '../../components/admin/RichTextEditor';
import ImagePicker from '../../components/admin/ImagePicker';
import Toast from '../../components/admin/Toast';
import WritingToolkit from '../../components/admin/toolkit/WritingToolkit';
import WritingStatsBar from '../../components/admin/toolkit/WritingStatsBar';
import AIRewriteFloater from '../../components/admin/toolkit/AIRewriteFloater';
import AISEOAssistant from '../../components/admin/AISEOAssistant';
import AIImageGenerator from '../../components/admin/AIImageGenerator';
import {
  Save, ArrowLeft, Image as ImageIcon, Calendar, User, Tag, Folder,
  Star, Globe, Send, AlertTriangle, X, CheckCircle2, FileText, Clock,
  Eye, ChevronDown, ChevronUp, Settings2, Sparkles, Printer,
} from 'lucide-react';

interface Category { id: string; name: string; }
interface Label { id: string; name: string; categoryId?: string; }

function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(/\s+/).filter(Boolean).length;
}

export default function PostEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { user } = useAuth();
  const { isCEO, isAdmin } = useRole();
  const autoSaveRef      = useRef<NodeJS.Timeout | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorApiRef     = useRef<RichTextEditorHandle | null>(null);
  const toolkitRef       = useRef<HTMLDivElement | null>(null);

  const [currentSlug, setCurrentSlug] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [labelId, setLabelId] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [published, setPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [publishDate, setPublishDate] = useState(new Date().toISOString().slice(0, 16));
  const [author, setAuthor] = useState('Admin');

  const [categories, setCategories] = useState<Category[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [filteredLabels, setFilteredLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<'featured' | 'content'>('featured');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [publishedTitle, setPublishedTitle] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const wordCount = countWords(content);
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  // ── Toolkit callbacks ─────────────────────────────────────────────────────

  // Insert at cursor — ref method handles DOM + fires onChange → setContent
  const handleInsertContent = useCallback((html: string, replace?: boolean) => {
    if (replace) { setContent(html); return; }
    if (editorApiRef.current) {
      editorApiRef.current.insertAtCursor(html);
    } else {
      setContent(prev => prev + html);
    }
  }, []);

  // Scroll to writing toolkit panel
  const handleRequestToolkit = useCallback(() => {
    setSidebarOpen(true);
    setTimeout(() => {
      toolkitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleExportDesignImage = useCallback((dataUrl: string) => {
    setFeaturedImage(dataUrl);
    setToast({ message: 'Design exported as featured image!', type: 'success' });
  }, []);

  const handleRestoreVersion = useCallback((version: { title: string; content: string; excerpt: string }) => {
    setTitle(version.title);
    setContent(version.content);
    setExcerpt(version.excerpt);
    setToast({ message: 'Version restored successfully', type: 'success' });
  }, []);

  useEffect(() => {
    loadCategories();
    loadLabels();
    if (isEditing) loadPost();
  }, [id]);

  useEffect(() => {
    if (categoryId) {
      const filtered = labels.filter(l => !l.categoryId || l.categoryId === categoryId);
      setFilteredLabels(filtered.length > 0 ? filtered : labels);
    } else {
      setFilteredLabels(labels);
    }
  }, [categoryId, labels]);

  useEffect(() => {
    if (!isEditing || !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  }, [title]);

  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    if (isEditing && title && categoryId) {
      autoSaveRef.current = setTimeout(async () => {
        setAutoSaveStatus('saving');
        try {
          await api.posts.update(currentSlug || slug, buildPostData());
          setCurrentSlug(slug);
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 2500);
        } catch {
          setAutoSaveStatus('idle');
        }
      }, 3000);
    }
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [title, content, excerpt, published, featuredImage, metaTitle, metaDescription]);

  const loadCategories = async () => {
    const data = await api.categories.list();
    setCategories(data || []);
  };

  const loadLabels = async () => {
    const data = await api.labels.list();
    setLabels(data || []);
  };

  const loadPost = async () => {
    setLoading(true);
    try {
      const data = await api.posts.getById(id!);
      if (data) {
        setCurrentSlug(data.slug || '');
        setTitle(data.title || '');
        setSlug(data.slug || '');
        setContent(data.content || '');
        setExcerpt(data.excerpt || '');
        setCategoryId(data.categoryId || '');
        setLabelId(data.labelIds?.[0] || data.labelId || '');
        setFeaturedImage(data.featuredImage || '');
        setMetaTitle(data.metaTitle || '');
        setMetaDescription(data.metaDescription || '');
        setMetaKeywords(data.metaKeywords || '');
        setPublished(data.status === 'published');
        setIsFeatured(data.isFeatured || false);
        setPublishDate(data.publishedAt ? new Date(data.publishedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
        setAuthor(data.author || 'Admin');
      }
    } catch {
      setToast({ message: 'Failed to load post', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getApprovalStatus = (intendedStatus: string) => {
    if (isCEO) return 'approved';
    if (intendedStatus === 'draft') return 'pending';
    return 'pending';
  };

  const getFinalPublishStatus = (intendedStatus: string) => {
    if (isCEO) return intendedStatus;
    if (intendedStatus === 'published' && !isCEO) return 'draft';
    return intendedStatus;
  };

  const getAuthorRole = () => {
    if (isCEO) return 'ceo';
    if (isAdmin) return 'admin';
    return 'publisher';
  };

  const buildPostData = (overrideStatus?: string) => {
    const intendedStatus = overrideStatus ?? (published ? 'published' : 'draft');
    return {
      title, slug, content, excerpt, categoryId,
      labelIds: labelId ? [labelId] : [],
      featuredImage: featuredImage || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      metaKeywords: metaKeywords || null,
      status: getFinalPublishStatus(intendedStatus),
      approval_status: getApprovalStatus(intendedStatus),
      author_role: getAuthorRole(),
      author_name: user?.displayName || user?.email?.split('@')[0] || author,
      isFeatured,
      publishedAt: overrideStatus === 'published' ? new Date().toISOString() : (published && !publishDate ? new Date().toISOString() : publishDate),
      author: user?.displayName || user?.email?.split('@')[0] || author,
    };
  };

  const handleSave = async (isAutoSave = false) => {
    if (!title.trim()) { if (!isAutoSave) setToast({ message: 'Please enter a title', type: 'error' }); return; }
    if (!categoryId) { if (!isAutoSave) setToast({ message: 'Please select a category', type: 'error' }); return; }
    setSaving(true);
    try {
      if (isEditing) {
        await api.posts.update(currentSlug || slug, buildPostData());
        setCurrentSlug(slug);
        if (!isAutoSave) setToast({ message: 'Draft saved successfully', type: 'success' });
      } else {
        const data = await api.posts.create({ ...buildPostData(), views: 0 });
        setCurrentSlug(data.slug);
        setTimeout(() => navigate(`/admin/posts/edit/${data.id}`), 300);
      }
    } catch {
      if (!isAutoSave) setToast({ message: 'Failed to save post. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmPublish = () => {
    if (!title.trim()) { setToast({ message: 'Please enter a title', type: 'error' }); return; }
    if (!categoryId) { setToast({ message: 'Please select a category', type: 'error' }); return; }
    if (!content.trim()) { setToast({ message: 'Please add some content', type: 'error' }); return; }
    setShowPublishConfirm(true);
  };

  const handlePublish = async () => {
    setShowPublishConfirm(false);
    if (isCEO) setPublished(true);
    setPublishDate(new Date().toISOString().slice(0, 16));
    setSaving(true);
    try {
      if (isEditing) {
        await api.posts.update(currentSlug || slug, buildPostData('published'));
        setCurrentSlug(slug);
      } else {
        const data = await api.posts.create({ ...buildPostData('published'), views: 0 });
        setCurrentSlug(data.slug);
      }
      setPublishedTitle(title);
      setShowPublishSuccess(true);
    } catch {
      setToast({ message: 'Failed to publish post. Please try again.', type: 'error' });
      setPublished(false);
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    if (imagePickerTarget === 'featured') {
      setFeaturedImage(imageUrl);
    } else {
      setContent(content + `<img src="${imageUrl}" alt="" class="max-w-full h-auto rounded-lg my-4" />`);
    }
    setShowImagePicker(false);
  };

  const openImagePicker = (target: 'featured' | 'content') => {
    setImagePickerTarget(target);
    setShowImagePicker(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/posts')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={22} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Post' : 'New Post'}
              </h1>
              <div className="flex items-center gap-3 text-gray-400 text-xs mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <FileText size={12} /> {wordCount.toLocaleString()} words
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {readingTime} min read
                </span>
                {autoSaveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Saving…
                  </span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 size={12} /> Saved
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings2 size={15} />
              {sidebarOpen ? 'Hide Panel' : 'Show Panel'}
            </button>

            {/* Draft preview — shows post appearance before publishing */}
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Eye size={15} /> Preview
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={() => {
                const win = window.open('', '_blank', 'width=900,height=700');
                if (!win) return;
                win.document.write(`<!DOCTYPE html><html><head><title>${title || 'Post'}</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,'Times New Roman',serif;font-size:1rem;line-height:1.8;color:#111;max-width:780px;margin:0 auto;padding:2.5cm 2cm}
h1{font-size:2rem;font-weight:800;margin-bottom:1rem}
h2{font-size:1.5rem;font-weight:700;margin:1.75em 0 .5em;border-bottom:1px solid #ccc;padding-bottom:.2em}
h3{font-size:1.2rem;font-weight:700;margin:1.4em 0 .4em}
h4{font-size:1.05rem;font-weight:600;margin:1.2em 0 .35em}
p{margin-bottom:1em}
ul{list-style:disc;padding-left:1.75em;margin-bottom:1em}
ol{list-style:decimal;padding-left:1.75em;margin-bottom:1em}
ul ul{list-style:circle}li{margin-bottom:.3em}
a{color:#1d4ed8;text-decoration:underline}
blockquote{border-left:3px solid #3b82f6;padding-left:1em;margin:1.25em 0;color:#555;font-style:italic}
pre{background:#f4f4f4;padding:1em;border-radius:4px;font-size:.85em;overflow-x:auto;white-space:pre;margin:1em 0}
table{width:100%;border-collapse:collapse;margin:1.5em 0;font-size:.9rem}
th{background:#f1f5f9;font-weight:700;padding:.5em .75em;text-align:left;border-bottom:2px solid #ccc}
td{padding:.5em .75em;border-bottom:1px solid #e5e7eb}
img{max-width:100%;border-radius:6px;display:block;margin:1em auto}
.callout{padding:.85em 1.1em;margin:1.25em 0;border-radius:6px;border-left:4px solid}
.callout-info{background:#eff6ff;border-color:#3b82f6}
.callout-warning{background:#fffbeb;border-color:#f59e0b}
.callout-success{background:#f0fdf4;border-color:#22c55e}
.callout-danger{background:#fef2f2;border-color:#ef4444}
.callout-tip{background:#faf5ff;border-color:#a855f7}
@media print{@page{margin:1.5cm}body{padding:0}}
</style></head><body>${title ? `<h1>${title}</h1>` : ''}${content}</body></html>`);
                win.document.close();
                win.focus();
                setTimeout(() => win.print(), 600);
              }}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title="Print post (Ctrl+P in editor)"
            >
              <Printer size={15} />
            </button>

            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="flex items-center gap-2 bg-gray-700 dark:bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <Save size={16} />
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              onClick={confirmPublish}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-semibold shadow-md shadow-blue-200 dark:shadow-blue-900/30"
            >
              <Send size={16} />
              {isCEO ? (published ? 'Update & Publish' : 'Publish Now') : 'Submit for Approval'}
            </button>
          </div>
        </div>

        <div className={`grid gap-6 transition-all ${sidebarOpen ? 'grid-cols-1 xl:grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>
          <div className="min-w-0 space-y-0">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <WritingStatsBar content={content} title={title} />

              <div className="px-8 pt-8 pb-4 border-b border-gray-100 dark:border-gray-800">
                {featuredImage && (
                  <div className="relative mb-6 group rounded-xl overflow-hidden cursor-pointer" onClick={() => openImagePicker('featured')}>
                    <img src={featuredImage} alt="Featured" className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all">
                      <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-lg transition-opacity">Change Image</span>
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Post title…"
                  className="w-full text-3xl md:text-4xl font-black border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none leading-tight mb-3"
                />

                {title && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={title.length > 70 ? 'text-red-500' : ''}>{title.length}/70 chars</span>
                    {title.length > 70 && <span className="text-red-500">— too long for SEO</span>}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500">URL:</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="text-xs text-blue-500 dark:text-blue-400 bg-transparent border-0 focus:outline-none focus:ring-0 flex-1 min-w-0"
                  />
                </div>
              </div>

              <div className="px-0" ref={editorContainerRef}>
                <RichTextEditor
                  ref={editorApiRef}
                  value={content}
                  onChange={setContent}
                  onImageClick={() => openImagePicker('content')}
                  onRequestToolkit={handleRequestToolkit}
                  placeholder="Start writing your post… (drag & drop images to upload)"
                />
              </div>

              <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Excerpt</label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Write a short summary of your post…"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed resize-none transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1">{excerpt.length} characters</p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setSeoExpanded(!seoExpanded)}
                    className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300 py-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <Globe size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                      SEO Settings
                    </span>
                    {seoExpanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                  </button>

                  {seoExpanded && (
                    <div className="space-y-4 mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Meta Title</label>
                        <input
                          type="text"
                          value={metaTitle}
                          onChange={(e) => setMetaTitle(e.target.value)}
                          placeholder="SEO title (defaults to post title)"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                          Meta Description
                          {metaDescription.length > 0 && (
                            <span className={`ml-2 font-normal ${metaDescription.length >= 120 && metaDescription.length <= 160 ? 'text-green-500' : 'text-amber-500'}`}>
                              {metaDescription.length}/160 · {metaDescription.length >= 120 && metaDescription.length <= 160 ? 'Perfect' : 'Aim 120–160'}
                            </span>
                          )}
                        </label>
                        <textarea
                          value={metaDescription}
                          onChange={(e) => setMetaDescription(e.target.value)}
                          placeholder="SEO description (120–160 characters)"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Meta Keywords</label>
                        <input
                          type="text"
                          value={metaKeywords}
                          onChange={(e) => setMetaKeywords(e.target.value)}
                          placeholder="keyword1, keyword2, keyword3"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {sidebarOpen && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Publishing</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Published</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors flex items-center gap-1.5">
                      <Star size={13} className="text-amber-400" /> Featured Post
                    </span>
                  </label>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                      <Calendar size={12} /> Publish Date
                    </label>
                    <input
                      type="datetime-local"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                      <User size={12} /> Author
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Organization</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                      <Folder size={12} /> Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => { setCategoryId(e.target.value); setLabelId(''); }}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                      <Tag size={12} /> Label
                    </label>
                    <select
                      value={labelId}
                      onChange={(e) => setLabelId(e.target.value)}
                      disabled={!categoryId}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                    >
                      <option value="">No label</option>
                      {filteredLabels.map((label) => (
                        <option key={label.id} value={label.id}>{label.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ImageIcon size={15} className="text-gray-400" /> Featured Image
                </h3>
                {featuredImage ? (
                  <div className="relative group cursor-pointer rounded-lg overflow-hidden" onClick={() => openImagePicker('featured')}>
                    <img src={featuredImage} alt="Featured" className="w-full h-36 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all gap-2">
                      <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium transition-opacity bg-black/50 px-3 py-1.5 rounded-lg">Change</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFeaturedImage(''); }}
                        className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium transition-opacity bg-red-500/80 px-3 py-1.5 rounded-lg"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openImagePicker('featured')}
                    className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-blue-400 dark:hover:border-blue-600 transition-colors group"
                  >
                    <ImageIcon size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2 group-hover:text-blue-400 transition-colors" />
                    <p className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-blue-400 transition-colors">Click to select featured image</p>
                  </button>
                )}
              </div>

              <div ref={toolkitRef}>
                <WritingToolkit
                  title={title}
                  content={content}
                  excerpt={excerpt}
                  metaTitle={metaTitle}
                  metaDescription={metaDescription}
                  metaKeywords={metaKeywords}
                  postId={id}
                  onInsertContent={handleInsertContent}
                  onSetTitle={setTitle}
                  onSetMetaTitle={setMetaTitle}
                  onSetMetaDescription={setMetaDescription}
                  onSetMetaKeywords={setMetaKeywords}
                  onExportDesignImage={handleExportDesignImage}
                  onRestoreVersion={handleRestoreVersion}
                />
              </div>

              <AISEOAssistant
                title={title}
                content={content}
                excerpt={excerpt}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                metaKeywords={metaKeywords}
                onSetMetaTitle={setMetaTitle}
                onSetMetaDescription={setMetaDescription}
                onSetMetaKeywords={setMetaKeywords}
                onSetExcerpt={setExcerpt}
              />

              <AIImageGenerator
                content={content}
                onInsertContent={handleInsertContent}
                onSetFeaturedImage={setFeaturedImage}
              />

              {isCEO && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-amber-100 dark:border-amber-900/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-amber-500" />
                    <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">CEO Tools</h3>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-500">Advanced editorial review tools are available in the Editorial Review section from the sidebar menu.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── POST PREVIEW PANEL ── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          />
          {/* Drawer */}
          <div className="relative ml-auto w-full max-w-3xl h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <Eye size={15} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">Post Preview</h2>
                  <p className="text-xs text-gray-400">How your post will look when published</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {id && (
                  <a
                    href={`/post/${categories.find(c => c.id === categoryId)?.name?.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') || 'uncategorized'}/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Globe size={12} /> Live View
                  </a>
                )}
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black">
              <div className="max-w-2xl mx-auto py-8 px-6">
                {/* Featured image */}
                {featuredImage && (
                  <img
                    src={featuredImage}
                    alt={title}
                    className="w-full h-56 object-cover rounded-2xl mb-6 shadow-lg"
                  />
                )}

                {/* Title */}
                {title ? (
                  <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight mb-4">
                    {title}
                  </h1>
                ) : (
                  <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4 animate-pulse" />
                )}

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                  {author && <span className="flex items-center gap-1"><User size={11}/>{author}</span>}
                  <span className="flex items-center gap-1"><Clock size={11}/>{readingTime} min read</span>
                  <span className="flex items-center gap-1"><FileText size={11}/>{wordCount.toLocaleString()} words</span>
                  {published
                    ? <span className="flex items-center gap-1 text-green-500"><Globe size={11}/>Published</span>
                    : <span className="flex items-center gap-1 text-amber-500"><Eye size={11}/>Draft</span>
                  }
                </div>

                {/* Excerpt */}
                {excerpt && (
                  <p className="text-base italic text-gray-500 dark:text-gray-400 border-l-4 border-blue-400 pl-4 mb-6 leading-relaxed">
                    {excerpt}
                  </p>
                )}

                {/* Body */}
                {content ? (
                  <div
                    className="article-content"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(content, {
                        ADD_TAGS: ['figure', 'figcaption', 'sub', 'sup', 'iframe'],
                        ADD_ATTR: ['class', 'target', 'rel', 'style', 'allowfullscreen', 'frameborder', 'src', 'width', 'height'],
                        ALLOW_DATA_ATTR: true,
                      }),
                    }}
                  />
                ) : (
                  <div className="space-y-3">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" style={{ width: `${85 + (i % 3) * 5}%` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showImagePicker && (
        <ImagePicker onSelect={handleImageSelect} onClose={() => setShowImagePicker(false)} />
      )}

      {showPublishConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {isCEO ? 'Publish this post?' : 'Submit for approval?'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  {isCEO
                    ? <><strong className="text-gray-800 dark:text-gray-200">"{title}"</strong> will be visible to all visitors immediately.</>
                    : <><strong className="text-gray-800 dark:text-gray-200">"{title}"</strong> will be submitted for review and published once approved.</>
                  }
                </p>
              </div>
              <button onClick={() => setShowPublishConfirm(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Send size={15} />
                {isCEO ? 'Publish Now' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPublishSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {isCEO ? 'Post Published!' : 'Submitted for Approval!'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
              {isCEO
                ? <><strong className="text-gray-800 dark:text-gray-200">"{publishedTitle}"</strong> is now live.</>
                : <><strong className="text-gray-800 dark:text-gray-200">"{publishedTitle}"</strong> has been submitted for review.</>
              }
            </p>
            <button
              onClick={() => { setShowPublishSuccess(false); navigate('/admin/posts'); }}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-3 text-sm"
            >
              <FileText size={16} /> View All Posts
            </button>
            <button
              onClick={() => { setShowPublishSuccess(false); navigate('/admin/posts/new'); }}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              Write Another Post
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <AIRewriteFloater
        editorContainerRef={editorContainerRef}
        onReplace={(newText) => {
          // The floater handles execCommand in-place; this is a no-op fallback
          void newText;
        }}
      />
    </AdminLayout>
  );
}
