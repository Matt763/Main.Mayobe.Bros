import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Briefcase, ArrowLeft, Save, Loader2, AlertCircle, ExternalLink, Trash2,
} from 'lucide-react';
import type { Job } from '../../hooks/useJobs';

async function fetchJSON(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || 'Request failed');
  return res.json();
}

const TYPES: Job['employmentType'][] = [
  'full-time', 'part-time', 'contract', 'internship', 'freelance',
];

interface FormState {
  title: string;
  slug: string;
  company: string;
  companyLogo: string;
  location: string;
  isRemote: boolean;
  employmentType: Job['employmentType'];
  salaryRange: string;
  description: string;
  applyUrl: string;
  status: Job['status'];
  expiresAt: string;
}

const EMPTY: FormState = {
  title: '',
  slug: '',
  company: '',
  companyLogo: '',
  location: '',
  isRemote: false,
  employmentType: 'full-time',
  salaryRange: '',
  description: '',
  applyUrl: '',
  status: 'draft',
  expiresAt: '',
};

export default function AdminJobEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [original, setOriginal] = useState<Job | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setLoading(true);
    fetchJSON(`/api/jobs/admin`)
      .then(data => {
        if (cancelled) return;
        const found = (data.jobs || []).find((j: Job) => j.id === id);
        if (!found) {
          setError('Job not found');
          return;
        }
        setOriginal(found);
        setForm({
          title:          found.title,
          slug:           found.slug,
          company:        found.company,
          companyLogo:    found.companyLogo || '',
          location:       found.location || '',
          isRemote:       found.isRemote,
          employmentType: found.employmentType,
          salaryRange:    found.salaryRange || '',
          description:    found.description || '',
          applyUrl:       found.applyUrl || '',
          status:         found.status,
          expiresAt:      found.expiresAt ? found.expiresAt.slice(0, 10) : '',
        });
      })
      .catch(e => {
        if (!cancelled) setError(e.message || 'Failed to load job');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) return setError('Title is required.');
    if (!form.company.trim()) return setError('Company is required.');

    setSaving(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        company: form.company.trim(),
        companyLogo: form.companyLogo.trim() || null,
        location: form.location.trim() || null,
        isRemote: form.isRemote,
        employmentType: form.employmentType,
        salaryRange: form.salaryRange.trim() || null,
        description: form.description,
        applyUrl: form.applyUrl.trim() || null,
        status: form.status,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };

      const result: Job = isEdit
        ? await fetchJSON(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        : await fetchJSON('/api/jobs', { method: 'POST', body: JSON.stringify(payload) });

      navigate(`/admin/jobs`, { replace: true });
      void result;
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !id) return;
    if (!confirm(`Delete "${form.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetchJSON(`/api/jobs/${id}`, { method: 'DELETE' });
      navigate('/admin/jobs', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-blue-600" size={24} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <Link
        to="/admin/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        All jobs
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white inline-flex items-center gap-2">
            <Briefcase className="text-blue-600" size={24} />
            {isEdit ? 'Edit job' : 'New job'}
          </h1>
          {original?.slug && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 inline-flex items-center gap-2">
              Public URL:{' '}
              <Link
                to={`/jobs/${original.slug}`}
                target="_blank"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                /jobs/{original.slug}
                <ExternalLink size={11} />
              </Link>
            </p>
          )}
        </div>
      </header>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300 mb-4 flex items-start gap-3">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basics */}
        <section className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Basics
          </h2>
          <Field label="Title" required>
            <input
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Senior Frontend Engineer"
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company" required>
              <input
                required
                value={form.company}
                onChange={e => set('company', e.target.value)}
                placeholder="Acme Inc"
                className={inputCls}
              />
            </Field>
            <Field
              label="Slug"
              hint={isEdit ? 'Changing the slug breaks existing links.' : 'Leave blank to auto-generate from title.'}
            >
              <input
                value={form.slug}
                onChange={e => set('slug', e.target.value)}
                placeholder="senior-frontend-engineer"
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company logo URL">
              <input
                value={form.companyLogo}
                onChange={e => set('companyLogo', e.target.value)}
                placeholder="https://example.com/logo.png"
                className={inputCls}
              />
            </Field>
            <Field label="Location">
              <input
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="Nairobi, Kenya"
                className={inputCls}
              />
            </Field>
          </div>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRemote}
              onChange={e => set('isRemote', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-200">This role can be done remotely</span>
          </label>
        </section>

        {/* Compensation + Type */}
        <section className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Type & Compensation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employment type">
              <select
                value={form.employmentType}
                onChange={e => set('employmentType', e.target.value as Job['employmentType'])}
                className={inputCls}
              >
                {TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Salary range">
              <input
                value={form.salaryRange}
                onChange={e => set('salaryRange', e.target.value)}
                placeholder="$80,000 – $120,000"
                className={inputCls}
              />
            </Field>
          </div>
        </section>

        {/* Description */}
        <section className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Description
          </h2>
          <Field
            label="Body"
            hint="HTML is supported (sanitized on render). Paste from a doc or write Markdown-style HTML."
          >
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={12}
              placeholder="<p>About the role…</p><h3>Requirements</h3><ul><li>…</li></ul>"
              className={`${inputCls} font-mono text-xs leading-relaxed`}
            />
          </Field>
        </section>

        {/* Apply */}
        <section className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Apply
          </h2>
          <Field label="Apply URL" hint="External URL the 'Apply now' button opens.">
            <input
              type="url"
              value={form.applyUrl}
              onChange={e => set('applyUrl', e.target.value)}
              placeholder="https://example.com/jobs/abc123"
              className={inputCls}
            />
          </Field>
        </section>

        {/* Publish */}
        <section className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Publish
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Status">
              <select
                value={form.status}
                onChange={e => set('status', e.target.value as Job['status'])}
                className={inputCls}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </Field>
            <Field label="Expires on" hint="Optional. After this date the job stays in the DB but you may want to mark it closed.">
              <input
                type="date"
                value={form.expiresAt}
                onChange={e => set('expiresAt', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold transition-colors shadow-sm cursor-pointer"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isEdit ? 'Save changes' : 'Create job'}
            </button>
            <Link
              to="/admin/jobs"
              className="px-5 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </Link>
          </div>
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete job
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] text-gray-500 dark:text-gray-400 mt-1">{hint}</span>
      )}
    </label>
  );
}
