import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import AdminLayout from '../../components/admin/AdminLayout';
import RichTextEditor from '../../components/admin/RichTextEditor';
import Toast from '../../components/admin/Toast';
import AIResultsAssistant from '../../components/admin/AIResultsAssistant';
import { Save, ArrowLeft, Globe, GraduationCap } from 'lucide-react';

const EXAM_TYPES = ['ftna', 'csee', 'acsee', 'psle'];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function ResultsEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [title, setTitle]       = useState('');
  const [slug, setSlug]         = useState('');
  const [year, setYear]         = useState(new Date().getFullYear());
  const [examType, setExamType] = useState('ftna');
  const [sourceUrl, setSourceUrl] = useState('');
  const [content, setContent]   = useState('');
  const [structuredData, setStructuredData] = useState<any>(null);
  const [metaTitle, setMetaTitle]     = useState('');
  const [metaDesc, setMetaDesc]       = useState('');
  const [metaKeys, setMetaKeys]       = useState('');
  const [status, setStatus]     = useState<'draft' | 'published'>('draft');
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load existing result when editing
  useEffect(() => {
    if (!isEditing) return;
    api.results.getById(id!).then(r => {
      if (!r) return;
      setTitle(r.title);
      setSlug(r.slug);
      setYear(r.year);
      setExamType(r.exam_type);
      setSourceUrl(r.source_url || '');
      setContent(r.content || '');
      setStructuredData(r.structured_data);
      setMetaTitle(r.meta_title || '');
      setMetaDesc(r.meta_description || '');
      setMetaKeys(r.meta_keywords || '');
      setStatus(r.status as 'draft' | 'published');
    });
  }, [id, isEditing]);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) setSlug(slugify(val));
  };

  // Called by AIResultsAssistant when crawl completes
  const handleCrawlComplete = (result: any) => {
    setTitle(result.title);
    setSlug(result.slug);
    setYear(result.year);
    setExamType(result.exam_type);
    setSourceUrl(result.source_url);
    setStructuredData(result.structured_data);
    setMetaTitle(result.meta_title);
    setMetaDesc(result.meta_description);
    setContent(result.content);
    showToast('Content loaded from NECTA. Review and save.', 'success');
  };

  const handleSave = async (saveStatus: 'draft' | 'published') => {
    if (!title.trim() || !slug.trim()) {
      showToast('Title and slug are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const body = {
        title, slug, year, exam_type: examType,
        source_url: sourceUrl || null,
        content,
        structured_data: structuredData,
        meta_title: metaTitle || null,
        meta_description: metaDesc || null,
        meta_keywords: metaKeys || null,
        status: saveStatus,
      };

      if (isEditing) {
        await api.results.update(id!, body);
        showToast(saveStatus === 'published' ? 'Published!' : 'Draft saved', 'success');
        setStatus(saveStatus);
      } else {
        const created = await api.results.create(body);
        showToast('Result created', 'success');
        // For publish, call update (which handles bridge post)
        if (saveStatus === 'published') {
          await api.results.update(created.id, { ...body, status: 'published' });
        }
        navigate(`/admin/results/${created.id}`, { replace: true });
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/admin/results')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GraduationCap size={18} className="text-green-600 shrink-0" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {isEditing ? 'Edit Result' : 'New Result'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <Save size={15} /> Save Draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Globe size={15} /> {status === 'published' ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-6 p-6 max-w-7xl mx-auto">
        {/* Main column */}
        <div className="flex-1 min-w-0">
          {/* AI Assistant */}
          <AIResultsAssistant onComplete={handleCrawlComplete} />

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Result title..."
            className="w-full text-2xl font-bold border-0 border-b border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-green-500 pb-3 mb-6"
          />

          {/* Editor */}
          <RichTextEditor
            value={content}
            onChange={setContent}
          />
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 space-y-4">
          {/* Slug */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Exam details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exam Details</label>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(parseInt(e.target.value))}
                min={2000} max={2100}
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Exam Type</label>
              <select
                value={examType}
                onChange={e => setExamType(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {EXAM_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</label>
            <div className={`text-sm font-medium px-3 py-2 rounded-lg ${status === 'published' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
              {status === 'published' ? '✓ Published' : '○ Draft'}
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SEO</label>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Meta Title</label>
              <input type="text" value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Meta Description</label>
              <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)} rows={3}
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Keywords</label>
              <input type="text" value={metaKeys} onChange={e => setMetaKeys(e.target.value)}
                placeholder="necta results, ftna 2025..."
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          {/* Source URL */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Source URL</label>
            <input type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)}
              placeholder="https://onlinesys.necta.go.tz/..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
