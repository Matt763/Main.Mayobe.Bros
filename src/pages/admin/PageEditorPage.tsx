import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import AdminLayout from '../../components/admin/AdminLayout';
import RichTextEditor from '../../components/admin/RichTextEditor';
import ImagePicker from '../../components/admin/ImagePicker';
import Toast from '../../components/admin/Toast';
import {
  Save,
  Send,
  ArrowLeft,
  Globe,
  Menu as MenuIcon,
  AlertTriangle,
  X,
  CheckCircle2,
  FileText,
  Image,
  ExternalLink,
  Trash2,
} from 'lucide-react';

export default function PageEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [showInMenu, setShowInMenu] = useState(false);
  const [isIndexed, setIsIndexed] = useState(true);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showFeaturedImagePicker, setShowFeaturedImagePicker] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [publishedTitle, setPublishedTitle] = useState('');

  useEffect(() => {
    if (isEditing) loadPage();
  }, [id]);

  useEffect(() => {
    if (!isEditing || !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generatedSlug);
    }
  }, [title]);

  const loadPage = async () => {
    setLoading(true);
    try {
      const data = await api.pages.getById(id!);
      if (data) {
        setTitle(data.title || '');
        setSlug(data.slug || '');
        setContent(data.content || '');
        setStatus(data.status || (data.published ? 'published' : 'draft'));
        setShowInMenu(data.showInMenu ?? data.show_in_menu ?? false);
        setIsIndexed(data.isIndexed ?? data.is_indexed ?? true);
        setMetaTitle(data.metaTitle || data.meta_title || '');
        setMetaDescription(data.metaDescription || data.meta_description || '');
        setFeaturedImage(data.featuredImage || data.featured_image || null);
      }
    } catch (error) {
      console.error('Error loading page:', error);
      setToast({ message: 'Failed to load page', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const buildPageData = (overrideStatus?: 'draft' | 'published') => ({
    title,
    slug,
    content,
    status: overrideStatus ?? status,
    showInMenu,
    isIndexed,
    metaTitle: metaTitle || null,
    metaDescription: metaDescription || null,
    featuredImage: featuredImage || null,
  });

  const handleSave = async () => {
    if (!title.trim()) {
      setToast({ message: 'Please enter a title', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await api.pages.update(id!, buildPageData());
        setToast({ message: 'Page saved successfully', type: 'success' });
      } else {
        const created = await api.pages.create(buildPageData());
        setTimeout(() => navigate(`/admin/pages/edit/${created.id}`), 300);
      }
    } catch (error) {
      console.error('Error saving page:', error);
      setToast({ message: 'Failed to save page. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmPublish = () => {
    if (!title.trim()) {
      setToast({ message: 'Please enter a title before publishing', type: 'error' });
      return;
    }
    if (!content.trim()) {
      setToast({ message: 'Please add some content before publishing', type: 'error' });
      return;
    }
    setShowPublishConfirm(true);
  };

  const handlePublish = async () => {
    setShowPublishConfirm(false);
    setStatus('published');

    setSaving(true);
    try {
      if (isEditing) {
        await api.pages.update(id!, buildPageData('published'));
      } else {
        const created = await api.pages.create(buildPageData('published'));
        setTimeout(() => navigate(`/admin/pages/edit/${created.id}`), 300);
      }
      setPublishedTitle(title);
      setShowPublishSuccess(true);
    } catch (error) {
      console.error('Error publishing page:', error);
      setToast({ message: 'Failed to publish page. Please try again.', type: 'error' });
      setStatus('draft');
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    const imgTag = `<img src="${imageUrl}" alt="" class="max-w-full h-auto rounded-lg my-4" />`;
    setContent(content + imgTag);
    setShowImagePicker(false);
  };

  const handleFeaturedImageSelect = (imageUrl: string) => {
    setFeaturedImage(imageUrl);
    setShowFeaturedImagePicker(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/pages')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Page' : 'New Page'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isEditing ? 'Update your page content' : 'Create a new static page'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>
            <button
              onClick={confirmPublish}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Send size={20} />
              <span>{status === 'published' ? 'Update & Publish' : 'Publish Now'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter page title..."
                className="w-full text-2xl font-bold border-0 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none pb-2"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Slug (URL)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="page-url-slug"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">URL: /page/{slug}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Content *
              </label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                onImageClick={() => setShowImagePicker(true)}
                placeholder="Start writing your page content..."
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe size={20} />
                SEO Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="SEO title (defaults to page title)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="SEO description"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Page Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status === 'published'}
                    onChange={(e) => setStatus(e.target.checked ? 'published' : 'draft')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Published</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInMenu}
                    onChange={(e) => setShowInMenu(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <MenuIcon size={14} />
                    Show in Menu
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isIndexed}
                    onChange={(e) => setIsIndexed(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Index by Search Engines
                  </span>
                </label>
                {status === 'published' && slug && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <a
                      href={`/page/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      <ExternalLink size={12} />
                      View live page
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Image size={18} />
                Featured Image
              </h3>
              {featuredImage ? (
                <div className="space-y-3">
                  <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img
                      src={featuredImage}
                      alt="Featured"
                      className="w-full h-40 object-cover"
                      onError={() => setFeaturedImage(null)}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowFeaturedImagePicker(true)}
                        className="bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeaturedImage(null)}
                        className="bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{featuredImage}</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFeaturedImagePicker(true)}
                  className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                >
                  <Image size={28} className="mx-auto mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Set Featured Image
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Used as the hero banner on the page
                  </p>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showImagePicker && (
        <ImagePicker
          onSelect={handleImageSelect}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      {showFeaturedImagePicker && (
        <ImagePicker
          onSelect={handleFeaturedImageSelect}
          onClose={() => setShowFeaturedImagePicker(false)}
        />
      )}

      {showPublishConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Publish this page?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">"{title}"</span> will be visible to all visitors on the website immediately.
                </p>
              </div>
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Yes, Publish Now
              </button>
            </div>
          </div>
        </div>
      )}

      {showPublishSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Page Published!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
              <span className="font-semibold text-gray-800 dark:text-gray-200">"{publishedTitle}"</span> is now live and visible to all visitors on the website.
            </p>
            <button
              onClick={() => { setShowPublishSuccess(false); navigate('/admin/pages'); }}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={18} />
              View All Pages
            </button>
            <button
              onClick={() => navigate('/admin/pages/new')}
              className="w-full mt-3 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Create Another Page
            </button>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}
