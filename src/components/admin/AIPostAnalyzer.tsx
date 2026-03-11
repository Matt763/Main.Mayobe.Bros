import { useEffect, useState, useCallback } from 'react';
import { BarChart2, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, RefreshCw, TrendingUp } from 'lucide-react';

interface AIPostAnalyzerProps {
  title: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  metaKeywords: string;
}

interface AnalysisResult {
  wordCount: number;
  seoScore: number;
  readabilityScore: number;
  adSenseCompliant: boolean;
  headingStructure: HeadingCheck;
  keywordScore: number;
  suggestions: Suggestion[];
  paragraphCount: number;
  avgSentenceLength: number;
  hasMetaDescription: boolean;
  hasMetaKeywords: boolean;
  hasImages: boolean;
  hasFeaturedImage: boolean;
}

interface HeadingCheck {
  hasH2: boolean;
  hasH3: boolean;
  hasH4: boolean;
  h2Count: number;
  h3Count: number;
  h4Count: number;
}

interface Suggestion {
  type: 'error' | 'warning' | 'tip';
  message: string;
}

function analyzeContent(title: string, content: string, excerpt: string, metaDescription: string, metaKeywords: string): AnalysisResult {
  const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const avgSentenceLength = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;

  const paragraphs = content.split(/<\/p>|<br\s*\/?>|<\/div>/i).filter(p => p.replace(/<[^>]+>/g, '').trim().length > 10);
  const paragraphCount = paragraphs.length;

  const h2Matches = content.match(/<h2[^>]*>/gi) || [];
  const h3Matches = content.match(/<h3[^>]*>/gi) || [];
  const h4Matches = content.match(/<h4[^>]*>/gi) || [];
  const headingStructure: HeadingCheck = {
    hasH2: h2Matches.length > 0,
    hasH3: h3Matches.length > 0,
    hasH4: h4Matches.length > 0,
    h2Count: h2Matches.length,
    h3Count: h3Matches.length,
    h4Count: h4Matches.length,
  };

  const hasImages = /<img/i.test(content);
  const hasMetaDescription = metaDescription.trim().length > 0;
  const hasMetaKeywords = metaKeywords.trim().length > 0;

  const keywords = metaKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  let keywordHits = 0;
  if (keywords.length > 0) {
    const textLower = text.toLowerCase();
    keywords.forEach(kw => { if (kw && textLower.includes(kw)) keywordHits++; });
    keywordHits = Math.min(10, Math.round((keywordHits / keywords.length) * 10));
  } else {
    keywordHits = 5;
  }

  let seoScore = 0;
  if (title.length >= 30 && title.length <= 70) seoScore += 15;
  else if (title.length > 0) seoScore += 8;
  if (wordCount >= 700) seoScore += 20;
  else if (wordCount >= 300) seoScore += 10;
  if (headingStructure.hasH2) seoScore += 15;
  if (headingStructure.hasH3) seoScore += 8;
  if (hasMetaDescription && metaDescription.length >= 120 && metaDescription.length <= 160) seoScore += 15;
  else if (hasMetaDescription) seoScore += 8;
  if (hasMetaKeywords && keywords.length >= 3) seoScore += 10;
  else if (hasMetaKeywords) seoScore += 5;
  if (keywordHits > 5) seoScore += 10;
  else if (keywordHits > 2) seoScore += 5;
  if (hasImages) seoScore += 7;
  seoScore = Math.min(100, seoScore);

  let readabilityScore = 100;
  if (avgSentenceLength > 25) readabilityScore -= 20;
  else if (avgSentenceLength > 20) readabilityScore -= 10;
  if (wordCount < 300) readabilityScore -= 20;
  if (paragraphCount < 3) readabilityScore -= 15;
  if (!headingStructure.hasH2 && wordCount > 300) readabilityScore -= 15;
  if (paragraphCount > 0) {
    const avgParaWords = wordCount / paragraphCount;
    if (avgParaWords > 150) readabilityScore -= 10;
  }
  readabilityScore = Math.max(0, Math.min(100, readabilityScore));

  const adSenseProblems = checkAdSenseCompliance(content, title, wordCount);
  const adSenseCompliant = adSenseProblems.length === 0;

  const suggestions: Suggestion[] = [];

  if (wordCount < 300) suggestions.push({ type: 'error', message: `Content too short (${wordCount} words). Aim for at least 700 words.` });
  else if (wordCount < 700) suggestions.push({ type: 'warning', message: `Article is ${wordCount} words. Google AdSense prefers 700+ words.` });

  if (!headingStructure.hasH2) suggestions.push({ type: 'error', message: 'Add H2 headings to structure your content for better SEO.' });
  if (!headingStructure.hasH3 && wordCount > 500) suggestions.push({ type: 'warning', message: 'Add H3 subheadings to improve readability and structure.' });

  if (!hasMetaDescription) suggestions.push({ type: 'error', message: 'Missing meta description. Add one (120–160 characters) for better SEO.' });
  else if (metaDescription.length < 120) suggestions.push({ type: 'warning', message: `Meta description is short (${metaDescription.length} chars). Aim for 120–160 characters.` });
  else if (metaDescription.length > 160) suggestions.push({ type: 'warning', message: `Meta description is too long (${metaDescription.length} chars). Keep it under 160.` });

  if (!hasMetaKeywords) suggestions.push({ type: 'tip', message: 'Add meta keywords to help with keyword targeting.' });
  else if (keywords.length < 3) suggestions.push({ type: 'tip', message: 'Add at least 3–5 keywords for better keyword coverage.' });

  if (title.length > 70) suggestions.push({ type: 'warning', message: 'Title is too long for Google search results. Keep it under 70 characters.' });
  else if (title.length < 30 && title.length > 0) suggestions.push({ type: 'warning', message: 'Title is too short. A 30–70 character title performs best.' });

  if (!hasImages) suggestions.push({ type: 'tip', message: 'Add images to increase engagement and time-on-page.' });

  if (avgSentenceLength > 25) suggestions.push({ type: 'warning', message: 'Sentences are too long. Break them up for better readability.' });

  adSenseProblems.forEach(p => suggestions.push({ type: 'error', message: p }));

  if (suggestions.length === 0) suggestions.push({ type: 'tip', message: 'Great job! Your content looks well-optimized.' });

  return {
    wordCount,
    seoScore,
    readabilityScore,
    adSenseCompliant,
    headingStructure,
    keywordScore: keywordHits * 10,
    suggestions,
    paragraphCount,
    avgSentenceLength,
    hasMetaDescription,
    hasMetaKeywords,
    hasImages,
    hasFeaturedImage: false,
  };
}

function checkAdSenseCompliance(content: string, title: string, wordCount: number): string[] {
  const problems: string[] = [];
  const text = (content + ' ' + title).toLowerCase();

  const prohibited = ['casino', 'gambling', 'pornography', 'adult content', 'xxx', 'hack', 'crack software', 'illegal drugs'];
  prohibited.forEach(term => {
    if (text.includes(term)) problems.push(`Content may violate AdSense policies: contains "${term}".`);
  });

  if (wordCount > 0 && wordCount < 150) problems.push('Very short content may not meet AdSense quality requirements.');

  return problems;
}

function ScoreRing({ score, size = 56, strokeWidth = 5, color }: { score: number; size?: number; strokeWidth?: number; color: string }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-200 dark:text-gray-700" />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

function ScoreBadge({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <ScoreRing score={score} color={color} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">{label}</span>
    </div>
  );
}

const DEBOUNCE_MS = 1500;

export default function AIPostAnalyzer({ title, content, excerpt, metaDescription, metaKeywords }: AIPostAnalyzerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const runAnalysis = useCallback(() => {
    if (!content && !title) { setAnalysis(null); return; }
    setAnalyzing(true);
    const result = analyzeContent(title, content, excerpt, metaDescription, metaKeywords);
    setAnalysis(result);
    setAnalyzing(false);
  }, [title, content, excerpt, metaDescription, metaKeywords]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(runAnalysis, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [title, content, excerpt, metaDescription, metaKeywords, isOpen, runAnalysis]);

  useEffect(() => {
    if (isOpen) runAnalysis();
  }, [isOpen]);

  const seoColor = analysis ? (analysis.seoScore >= 80 ? '#16a34a' : analysis.seoScore >= 60 ? '#ca8a04' : '#dc2626') : '#94a3b8';
  const readColor = analysis ? (analysis.readabilityScore >= 80 ? '#16a34a' : analysis.readabilityScore >= 60 ? '#ca8a04' : '#dc2626') : '#94a3b8';

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-gray-700 flex items-center justify-center shadow-md">
            <BarChart2 size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">AI Post Analyzer</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {analysis ? `SEO ${analysis.seoScore}/100 · ${analysis.wordCount} words` : 'Real-time SEO & quality analysis'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {analyzing && <RefreshCw size={14} className="text-gray-400 animate-spin" />}
          {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-5">
          {!analysis ? (
            <div className="text-center py-6 text-gray-400">
              <BarChart2 size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">Start writing to see analysis</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-around bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <ScoreBadge label="SEO Score" score={analysis.seoScore} color={seoColor} />
                <ScoreBadge label="Readability" score={analysis.readabilityScore} color={readColor} />
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 ${analysis.adSenseCompliant ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                    {analysis.adSenseCompliant
                      ? <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
                      : <XCircle size={20} className="text-red-600 dark:text-red-400" />
                    }
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">AdSense</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <StatCard label="Word Count" value={analysis.wordCount} target={700} unit="words" />
                <StatCard label="Paragraphs" value={analysis.paragraphCount} target={5} unit="sections" />
                <StatCard label="H2 Headings" value={analysis.headingStructure.h2Count} target={2} unit="headings" />
                <StatCard label="H3 Headings" value={analysis.headingStructure.h3Count} target={2} unit="subheadings" />
              </div>

              <div className="space-y-2">
                <CheckRow label="H2 Headings" passed={analysis.headingStructure.hasH2} info={`${analysis.headingStructure.h2Count} found`} />
                <CheckRow label="H3 Subheadings" passed={analysis.headingStructure.hasH3} info={`${analysis.headingStructure.h3Count} found`} />
                <CheckRow label="Meta Description" passed={analysis.hasMetaDescription} info={analysis.hasMetaDescription ? 'Added' : 'Missing'} />
                <CheckRow label="Keywords Set" passed={analysis.hasMetaKeywords} info={analysis.hasMetaKeywords ? 'Added' : 'Missing'} />
                <CheckRow label="Images" passed={analysis.hasImages} info={analysis.hasImages ? 'Found' : 'None'} />
                <CheckRow label="700+ Words" passed={analysis.wordCount >= 700} info={`${analysis.wordCount} words`} />
                <CheckRow label="AdSense Safe" passed={analysis.adSenseCompliant} info={analysis.adSenseCompliant ? 'Passed' : 'Issues found'} />
              </div>

              {analysis.suggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={13} className="text-gray-500" />
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Suggestions</p>
                  </div>
                  {analysis.suggestions.slice(0, 6).map((s, i) => (
                    <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg text-xs border ${
                      s.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' :
                      s.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400' :
                      'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                    }`}>
                      <span className="flex-shrink-0 mt-0.5">
                        {s.type === 'error' ? <XCircle size={12} /> : s.type === 'warning' ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                      </span>
                      <span className="leading-relaxed">{s.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={runAnalysis}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw size={12} /> Refresh Analysis
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  const pct = Math.min(100, (value / target) * 100);
  const good = value >= target;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`text-xs font-bold ${good ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${good ? 'bg-green-500' : 'bg-amber-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Target: {target} {unit}</p>
    </div>
  );
}

function CheckRow({ label, passed, info }: { label: string; passed: boolean; info: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {passed
          ? <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
          : <XCircle size={14} className="text-red-400 flex-shrink-0" />
        }
        <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <span className={`text-xs font-medium ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{info}</span>
    </div>
  );
}
