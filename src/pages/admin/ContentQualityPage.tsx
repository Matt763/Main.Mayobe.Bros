import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../lib/api';
import { Search, AlertTriangle, CheckCircle, XCircle, RefreshCw, FileText, BarChart2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface QualityReport {
  id: string;
  title: string;
  slug: string;
  categorySlug: string;
  wordCount: number;
  issues: Issue[];
  score: number;
  status: 'pass' | 'warn' | 'fail';
}

interface Issue {
  type: 'thin' | 'no_headings' | 'no_excerpt' | 'no_image' | 'short_title' | 'long_title' | 'no_content';
  severity: 'error' | 'warning';
  message: string;
  suggestion: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function hasHeadings(html: string): boolean {
  return /<h[2-6]/i.test(html);
}

function analyzePost(post: any): QualityReport {
  const issues: Issue[] = [];
  const content = post.content || '';
  const plainText = stripHtml(content);
  const wordCount = countWords(plainText);

  if (!content || wordCount === 0) {
    issues.push({
      type: 'no_content',
      severity: 'error',
      message: 'Article has no content',
      suggestion: 'Add the article body content before publishing.',
    });
  } else if (wordCount < 300) {
    issues.push({
      type: 'thin',
      severity: 'error',
      message: `Thin content — only ${wordCount} words`,
      suggestion: 'Expand the article to at least 300 words. Add more detail, examples, and useful information.',
    });
  } else if (wordCount < 600) {
    issues.push({
      type: 'thin',
      severity: 'warning',
      message: `Short content — ${wordCount} words`,
      suggestion: 'Consider expanding to 600+ words for better depth and search engine visibility.',
    });
  }

  if (content && !hasHeadings(content)) {
    issues.push({
      type: 'no_headings',
      severity: 'warning',
      message: 'No subheadings (H2/H3) found',
      suggestion: 'Add subheadings to break up the content and improve readability and SEO.',
    });
  }

  if (!post.excerpt || post.excerpt.trim().length < 20) {
    issues.push({
      type: 'no_excerpt',
      severity: 'warning',
      message: 'Missing or very short excerpt',
      suggestion: 'Add a compelling excerpt of 100-160 characters that summarizes the article.',
    });
  }

  if (!post.featuredImage) {
    issues.push({
      type: 'no_image',
      severity: 'error',
      message: 'No featured image',
      suggestion: 'Add a high-quality featured image (minimum 1200x630px recommended for Google Discover).',
    });
  }

  const titleLength = (post.title || '').length;
  if (titleLength < 20) {
    issues.push({
      type: 'short_title',
      severity: 'warning',
      message: `Title too short — ${titleLength} characters`,
      suggestion: 'Write a descriptive title of at least 40 characters that clearly states the article topic.',
    });
  } else if (titleLength > 70) {
    issues.push({
      type: 'long_title',
      severity: 'warning',
      message: `Title may be too long — ${titleLength} characters`,
      suggestion: 'Keep titles under 70 characters to avoid truncation in search results.',
    });
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warnCount = issues.filter(i => i.severity === 'warning').length;

  let score = 100;
  score -= errorCount * 25;
  score -= warnCount * 10;
  score = Math.max(0, score);

  const status: QualityReport['status'] = errorCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';

  return {
    id: post.id,
    title: post.title || '(Untitled)',
    slug: post.slug,
    categorySlug: post.categorySlug || '',
    wordCount,
    issues,
    score,
    status,
  };
}

function ScoreBadge({ score, status }: { score: number; status: QualityReport['status'] }) {
  const colors = {
    pass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    warn: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    fail: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[status]}`}>
      {score}%
    </span>
  );
}

export default function ContentQualityPage() {
  const [reports, setReports] = useState<QualityReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'fail' | 'warn' | 'pass'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('published');

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const posts = await api.posts.listWithContent({ status: statusFilter === 'all' ? 'all' : statusFilter });
      const results = (posts || []).map(analyzePost);
      results.sort((a, b) => a.score - b.score);
      setReports(results);
      setAnalyzed(true);
    } finally {
      setLoading(false);
    }
  };

  const filtered = reports.filter(r => filter === 'all' || r.status === filter);

  const counts = {
    fail: reports.filter(r => r.status === 'fail').length,
    warn: reports.filter(r => r.status === 'warn').length,
    pass: reports.filter(r => r.status === 'pass').length,
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart2 size={28} className="text-blue-600" />
              Content Quality Checker
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Analyze articles for thin content, missing elements, and AdSense readiness issues.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="published">Published Posts</option>
              <option value="draft">Draft Posts</option>
              <option value="all">All Posts</option>
            </select>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 text-sm"
            >
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
              {loading ? 'Analyzing...' : analyzed ? 'Re-analyze' : 'Analyze Posts'}
            </button>
          </div>
        </div>

        {!analyzed && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to Analyze</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Click "Analyze Posts" to scan your articles for content quality issues that could affect AdSense approval and Google rankings.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left text-sm text-gray-600 dark:text-gray-400">
              {[
                'Thin content detection',
                'Missing featured images',
                'No subheadings',
                'Missing excerpts',
                'Title length analysis',
                'Word count scoring',
              ].map(item => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {analyzed && !loading && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total Analyzed', value: reports.length, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300', icon: FileText },
                { label: 'Failing', value: counts.fail, color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300', icon: XCircle },
                { label: 'Warnings', value: counts.warn, color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300', icon: AlertTriangle },
                { label: 'Passing', value: counts.pass, color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300', icon: CheckCircle },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className={`rounded-xl p-4 ${color}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</span>
                  </div>
                  <div className="text-2xl font-black">{value}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              {(['all', 'fail', 'warn', 'pass'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {f === 'all' ? `All (${reports.length})` : f === 'fail' ? `Failing (${counts.fail})` : f === 'warn' ? `Warnings (${counts.warn})` : `Passing (${counts.pass})`}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filtered.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-400 dark:text-gray-500">
                  No posts in this category.
                </div>
              )}
              {filtered.map((report) => (
                <div
                  key={report.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {report.status === 'pass' ? (
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                    ) : report.status === 'warn' ? (
                      <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0" />
                    ) : (
                      <XCircle size={18} className="text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{report.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {report.wordCount.toLocaleString()} words
                        {report.issues.length > 0 && ` · ${report.issues.length} issue${report.issues.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <ScoreBadge score={report.score} status={report.status} />
                    {report.categorySlug && report.slug && (
                      <a
                        href={`/post/${report.categorySlug}/${report.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0 p-1"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {expandedId === report.id ? (
                      <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {expandedId === report.id && (
                    <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-4 pt-3">
                      {report.issues.length === 0 ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm py-2">
                          <CheckCircle size={15} />
                          <span>This article meets all quality standards.</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {report.issues.map((issue, i) => (
                            <div
                              key={i}
                              className={`rounded-lg p-3 ${
                                issue.severity === 'error'
                                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800'
                                  : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {issue.severity === 'error' ? (
                                  <XCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <p className={`text-sm font-semibold ${issue.severity === 'error' ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                                    {issue.message}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                                    {issue.suggestion}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
