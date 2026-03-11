import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import AdminLayout from '../../components/admin/AdminLayout';
import Toast from '../../components/admin/Toast';
import ImagePicker from '../../components/admin/ImagePicker';
import { Plus, CreditCard as Edit, Trash2, Save, X, Folder, Eye, EyeOff, AlertTriangle, Image as ImageIcon, Globe, ChevronDown, ChevronUp } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  show_in_footer: boolean;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
}

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  display_order: 0,
  show_in_footer: true,
  featured_image: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showSeoSection, setShowSeoSection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await api.categories.list();
      setCategories(data || []);
    } catch {
      setToast({ message: 'Failed to load categories', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      display_order: category.display_order,
      show_in_footer: category.show_in_footer,
      featured_image: category.featuredImage || '',
      meta_title: category.metaTitle || '',
      meta_description: category.metaDescription || '',
      meta_keywords: category.metaKeywords || '',
    });
    setShowAddForm(false);
    setShowSeoSection(!!(category.metaTitle || category.metaDescription || category.metaKeywords));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setToast({ message: 'Please enter a category name', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const categoryData = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: formData.description || null,
        display_order: formData.display_order,
        show_in_footer: formData.show_in_footer,
        featured_image: formData.featured_image || null,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        meta_keywords: formData.meta_keywords || null,
      };
      if (editingId) {
        await api.categories.update(editingId, categoryData);
      } else {
        await api.categories.create(categoryData);
      }
      setToast({ message: editingId ? 'Category updated' : 'Category created', type: 'success' });
      resetForm();
      loadCategories();
    } catch {
      setToast({ message: 'Failed to save category', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.categories.delete(id);
      setDeleteConfirmId(null);
      setToast({ message: 'Category deleted', type: 'success' });
      loadCategories();
    } catch {
      setToast({ message: 'Failed to delete category', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowAddForm(false);
    setShowSeoSection(false);
  };

  const deleteTarget = categories.find(c => c.id === deleteConfirmId);
  const isFormOpen = showAddForm || !!editingId;

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
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Categories</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage categories, hero images, and SEO settings</p>
          </div>
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); setFormData(emptyForm); setShowSeoSection(false); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>

        {isFormOpen && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Category' : 'New Category'}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Category name"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated from name if empty"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description shown on the category page"
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_in_footer}
                      onChange={e => setFormData({ ...formData, show_in_footer: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show in Footer</span>
                  </label>
                </div>
              </div>

              {/* Hero image */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                  <ImageIcon size={14} /> Category Hero Image
                </label>
                {formData.featured_image ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height: 200 }}>
                    <img src={formData.featured_image} alt="Category hero" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setShowImagePicker(true)}
                        className="bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, featured_image: '' })}
                        className="bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowImagePicker(true)}
                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-10 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-all flex flex-col items-center gap-2.5"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <ImageIcon size={20} className="text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Click to select a hero image</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">Appears as the background at the top of the category page</span>
                  </button>
                )}
              </div>

              {/* SEO section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSeoSection(!showSeoSection)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe size={15} className="text-blue-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">SEO Settings</span>
                    {(formData.meta_title || formData.meta_description || formData.meta_keywords) && (
                      <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">Configured</span>
                    )}
                  </div>
                  {showSeoSection ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                </button>

                {showSeoSection && (
                  <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-5 space-y-4 bg-gray-50/50 dark:bg-gray-800/30">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Meta Title</label>
                      <input
                        type="text"
                        value={formData.meta_title}
                        onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                        placeholder="SEO title (defaults to category name if empty)"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className={`text-xs mt-1 ${formData.meta_title.length > 60 ? 'text-amber-500' : 'text-gray-400'}`}>
                        {formData.meta_title.length} / 60 characters recommended
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Meta Description</label>
                      <textarea
                        value={formData.meta_description}
                        onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                        placeholder="Description shown in search results (120-160 characters recommended)"
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-400">{formData.meta_description.length} characters</p>
                        {formData.meta_description.length > 0 && (
                          <p className={`text-xs font-medium ${formData.meta_description.length >= 120 && formData.meta_description.length <= 160 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                            {formData.meta_description.length >= 120 && formData.meta_description.length <= 160 ? 'Perfect length' : 'Aim for 120-160 chars'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Meta Keywords</label>
                      <input
                        type="text"
                        value={formData.meta_keywords}
                        onChange={e => setFormData({ ...formData, meta_keywords: e.target.value })}
                        placeholder="keyword1, keyword2, keyword3"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {(formData.meta_title || formData.name) && (
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Search Preview</p>
                        <p className="text-blue-700 dark:text-blue-400 text-sm font-medium leading-tight mb-0.5 truncate">
                          {formData.meta_title || formData.name} — Mayobe Bros
                        </p>
                        <p className="text-green-700 dark:text-green-500 text-xs mb-1.5">
                          mayobebros.com/category/{formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'category'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed line-clamp-2">
                          {formData.meta_description || formData.description || 'No meta description set.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors font-semibold"
              >
                <Save size={18} />
                {saving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
              </button>
              <button
                onClick={resetForm}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Slug</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Image</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">SEO</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Order</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Footer</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {categories.map(category => (
                <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {category.featuredImage ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
                          <img src={category.featuredImage} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                          <Folder size={16} className="text-blue-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5 max-w-xs">{category.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{category.slug}</span>
                  </td>
                  <td className="px-5 py-4 text-center hidden md:table-cell">
                    {category.featuredImage
                      ? <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">Custom</span>
                      : <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Default</span>
                    }
                  </td>
                  <td className="px-5 py-4 text-center hidden md:table-cell">
                    {category.metaDescription
                      ? <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-full">Set</span>
                      : <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">None</span>
                    }
                  </td>
                  <td className="px-5 py-4 text-center hidden sm:table-cell">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{category.display_order}</span>
                  </td>
                  <td className="px-5 py-4 text-center hidden sm:table-cell">
                    {category.show_in_footer
                      ? <Eye size={15} className="mx-auto text-emerald-500" />
                      : <EyeOff size={15} className="mx-auto text-gray-300 dark:text-gray-600" />
                    }
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(category.id)}
                        className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <Folder size={44} className="mx-auto mb-3 opacity-30" />
              <p className="text-base font-semibold mb-1">No categories yet</p>
              <button onClick={() => setShowAddForm(true)} className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                Create your first category
              </button>
            </div>
          )}
        </div>
      </div>

      {showImagePicker && (
        <ImagePicker
          onSelect={url => { setFormData(f => ({ ...f, featured_image: url })); setShowImagePicker(false); }}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      {deleteConfirmId && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Delete category?</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Deleting <span className="font-semibold text-gray-800 dark:text-gray-200">"{deleteTarget.name}"</span> will affect all posts in this category. This cannot be undone.
                </p>
              </div>
              <button onClick={() => setDeleteConfirmId(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
