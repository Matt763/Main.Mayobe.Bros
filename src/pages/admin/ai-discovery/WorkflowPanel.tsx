import { useState } from 'react';
import { FileText, Search, CreditCard as Edit3, Link2, Tag, ChevronRight, Loader2, Copy, CheckCircle, RotateCcw, ExternalLink, ListOrdered, AlignLeft, Globe } from 'lucide-react';
import { ArticleOutline, KeywordData, SeoMeta, InternalLinksResult, DiscoveredTopic, WorkflowStep } from './types';
import { useNavigate } from 'react-router-dom';

interface Props {
  topic: DiscoveredTopic;
  onBack: () => void;
  loadingAction: string | null;
  outline: ArticleOutline | null;
  keywords: KeywordData | null;
  draft: string | null;
  internalLinks: InternalLinksResult | null;
  seoMeta: SeoMeta | null;
  onGenerateOutline: () => void;
  onGenerateKeywords: () => void;
  onGenerateDraft: () => void;
  onGenerateLinks: () => void;
  onGenerateSeoMeta: () => void;
  onSendToEditor: () => void;
}

const steps: { key: WorkflowStep; label: string; icon: React.ElementType }[] = [
  { key: 'outline', label: 'Outline', icon: ListOrdered },
  { key: 'keywords', label: 'Keywords', icon: Search },
  { key: 'draft', label: 'Draft', icon: Edit3 },
  { key: 'links', label: 'Internal Links', icon: Link2 },
  { key: 'seo', label: 'SEO Meta', icon: Tag },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20">
      {copied ? <CheckCircle size={11} className="text-emerald-500" /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function WorkflowPanel({
  topic, onBack, loadingAction,
  outline, keywords, draft, internalLinks, seoMeta,
  onGenerateOutline, onGenerateKeywords, onGenerateDraft, onGenerateLinks, onGenerateSeoMeta,
  onSendToEditor,
}: Props) {
  const [activeStep, setActiveStep] = useState<WorkflowStep>('outline');
  const navigate = useNavigate();

  const isLoading = (action: string) => loadingAction === action;

  const completedSteps = {
    outline: !!outline,
    keywords: !!keywords,
    draft: !!draft,
    links: !!internalLinks,
    seo: !!seoMeta,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <ChevronRight size={14} className="rotate-180" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-0.5">Planning Workflow</p>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">{topic.title}</h2>
          </div>
        </div>

        {/* Step tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {steps.map(s => {
            const Icon = s.icon;
            const done = completedSteps[s.key as keyof typeof completedSteps];
            return (
              <button
                key={s.key}
                onClick={() => setActiveStep(s.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  activeStep === s.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : done
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {done && activeStep !== s.key ? <CheckCircle size={10} /> : <Icon size={10} />}
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* OUTLINE */}
        {activeStep === 'outline' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ListOrdered size={14} className="text-blue-600" /> Article Outline
              </h3>
              <button
                onClick={onGenerateOutline}
                disabled={!!loadingAction}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                {isLoading('generate_outline') ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                {outline ? 'Regenerate' : 'Generate'}
              </button>
            </div>
            {outline ? (
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Title</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{outline.title}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">~{outline.estimatedWordCount.toLocaleString()} words</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{outline.readingTime}</span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Introduction</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{outline.introduction}</p>
                </div>
                {outline.sections.map((sec, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{sec.heading}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">{sec.description}</p>
                    {sec.subsections.length > 0 && (
                      <ul className="space-y-1">
                        {sec.subsections.map((sub, j) => (
                          <li key={j} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                            <span className="text-blue-400 mt-0.5">›</span> {sub}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Conclusion</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{outline.conclusion}</p>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setActiveStep('keywords')} className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    Next: Keywords <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                <ListOrdered size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Click Generate to create a structured article outline</p>
              </div>
            )}
          </div>
        )}

        {/* KEYWORDS */}
        {activeStep === 'keywords' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Search size={14} className="text-blue-600" /> Keyword Research
              </h3>
              <button
                onClick={onGenerateKeywords}
                disabled={!!loadingAction}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                {isLoading('suggest_keywords') ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                {keywords ? 'Regenerate' : 'Generate'}
              </button>
            </div>
            {keywords ? (
              <div className="space-y-3">
                {([
                  { label: 'Primary Keywords', key: 'primary', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
                  { label: 'Secondary Keywords', key: 'secondary', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
                  { label: 'Long-tail Phrases', key: 'longTail', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
                  { label: 'Questions People Search', key: 'questions', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
                  { label: 'LSI / Related Terms', key: 'lsiKeywords', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
                ] as const).map(({ label, key, color }) => (
                  <div key={key} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
                      <CopyButton text={keywords[key].join(', ')} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {keywords[key].map((kw, i) => (
                        <span key={i} className={`text-[11px] font-medium px-2 py-0.5 rounded-lg border ${color}`}>{kw}</span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <button onClick={() => setActiveStep('draft')} className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    Next: Draft <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                <Search size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Click Generate to research keywords for this topic</p>
              </div>
            )}
          </div>
        )}

        {/* DRAFT */}
        {activeStep === 'draft' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlignLeft size={14} className="text-blue-600" /> Article Draft
              </h3>
              <div className="flex gap-2">
                {draft && <CopyButton text={draft} />}
                <button
                  onClick={onGenerateDraft}
                  disabled={!!loadingAction}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  {isLoading('generate_draft') || isLoading('generate_full_draft') ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                  {draft ? 'Regenerate' : 'Generate'}
                </button>
              </div>
            </div>
            {draft ? (
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 max-h-[400px] overflow-y-auto">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_p]:mb-2 [&_ul]:mb-2 [&_li]:mb-0.5"
                    dangerouslySetInnerHTML={{ __html: draft }}
                  />
                </div>
                <button
                  onClick={onSendToEditor}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <ExternalLink size={14} />
                  Open in Post Editor
                </button>
                <div className="flex justify-end">
                  <button onClick={() => setActiveStep('links')} className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    Next: Internal Links <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                  <Edit3 size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {outline ? 'Generate a full draft based on your outline' : 'Generate a full article draft for this topic'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INTERNAL LINKS */}
        {activeStep === 'links' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Link2 size={14} className="text-blue-600" /> Internal Link Suggestions
              </h3>
              <button
                onClick={onGenerateLinks}
                disabled={!!loadingAction}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                {isLoading('suggest_internal_links') ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                {internalLinks ? 'Regenerate' : 'Analyze'}
              </button>
            </div>
            {internalLinks ? (
              <div className="space-y-3">
                {internalLinks.summary && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">{internalLinks.summary}</p>
                  </div>
                )}
                {internalLinks.recommendations.map((rec, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">{rec.postTitle}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">{rec.reason}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Anchor text</p>
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">"{rec.anchorText}"</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Placement</p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400">{rec.placement}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <button onClick={() => setActiveStep('seo')} className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    Next: SEO Meta <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                <Link2 size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Analyze existing posts to find internal linking opportunities</p>
              </div>
            )}
          </div>
        )}

        {/* SEO META */}
        {activeStep === 'seo' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Globe size={14} className="text-blue-600" /> SEO Metadata
              </h3>
              <button
                onClick={onGenerateSeoMeta}
                disabled={!!loadingAction}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                {isLoading('generate_seo_meta') ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                {seoMeta ? 'Regenerate' : 'Generate'}
              </button>
            </div>
            {seoMeta ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Content Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${seoMeta.contentScore >= 80 ? 'bg-emerald-500' : seoMeta.contentScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${seoMeta.contentScore}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${seoMeta.contentScore >= 80 ? 'text-emerald-600' : seoMeta.contentScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {seoMeta.contentScore}
                      </span>
                    </div>
                  </div>
                </div>
                {([
                  { label: 'Meta Title', value: seoMeta.metaTitle, hint: `${seoMeta.metaTitle.length} chars` },
                  { label: 'Meta Description', value: seoMeta.metaDescription, hint: `${seoMeta.metaDescription.length} chars` },
                  { label: 'URL Slug', value: seoMeta.slug, hint: 'URL-friendly' },
                  { label: 'Focus Keyword', value: seoMeta.focusKeyword, hint: '' },
                  { label: 'OG Title', value: seoMeta.ogTitle, hint: 'Social sharing' },
                  { label: 'OG Description', value: seoMeta.ogDescription, hint: '' },
                ]).map(({ label, value, hint }) => (
                  <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                        {hint && <span className="text-[10px] text-gray-400">· {hint}</span>}
                      </div>
                      <CopyButton text={value} />
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{value}</p>
                  </div>
                ))}
                {seoMeta.secondaryKeywords.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Secondary Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {seoMeta.secondaryKeywords.map((kw, i) => (
                        <span key={i} className="text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-lg">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={onSendToEditor}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <ExternalLink size={14} />
                  Send to Post Editor
                </button>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                <Tag size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Generate SEO metadata to populate the post editor automatically</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: Send to editor */}
      {(draft || seoMeta) && (
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <button
            onClick={onSendToEditor}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <ExternalLink size={14} />
            Open in Post Editor
          </button>
        </div>
      )}
    </div>
  );
}
