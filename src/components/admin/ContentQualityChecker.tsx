import { useMemo } from 'react';
import { CheckCircle, AlertCircle, XCircle, BookOpen } from 'lucide-react';

interface ContentQualityCheckerProps {
  title: string;
  content: string;
  excerpt: string;
  metaDescription: string;
}

interface Check {
  label: string;
  pass: boolean;
  warning?: boolean;
  detail: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateReadingTime(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

export default function ContentQualityChecker({ title, content, excerpt, metaDescription }: ContentQualityCheckerProps) {
  const analysis = useMemo(() => {
    const plainText = stripHtml(content);
    const wordCount = countWords(plainText);
    const readingTime = estimateReadingTime(wordCount);

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const hasH2 = doc.querySelectorAll('h2').length > 0;
    const hasH3 = doc.querySelectorAll('h3').length > 0;
    const hasImages = doc.querySelectorAll('img').length > 0;
    const paragraphs = Array.from(doc.querySelectorAll('p'));
    const longParagraphs = paragraphs.filter(p => countWords(p.textContent || '') > 120).length;
    const hasLists = doc.querySelectorAll('ul, ol').length > 0;

    const metaLen = metaDescription.length;
    const excerptLen = excerpt.length;

    const checks: Check[] = [
      {
        label: 'Word count',
        pass: wordCount >= 300,
        warning: wordCount >= 300 && wordCount < 600,
        detail: wordCount < 300
          ? `${wordCount} words — aim for 600+`
          : wordCount < 600
          ? `${wordCount} words — good, aim for 600+`
          : `${wordCount} words — great`,
      },
      {
        label: 'Title length',
        pass: title.length >= 10 && title.length <= 70,
        warning: title.length > 60 && title.length <= 70,
        detail: title.length === 0
          ? 'No title yet'
          : title.length > 70
          ? `${title.length} chars — keep under 70 for SEO`
          : `${title.length} chars — good`,
      },
      {
        label: 'Section headings (H2)',
        pass: hasH2,
        detail: hasH2 ? 'H2 headings found' : 'Add H2 headings to structure content',
      },
      {
        label: 'Subheadings (H3)',
        pass: hasH3,
        warning: !hasH3,
        detail: hasH3 ? 'H3 subheadings found' : 'Consider adding H3 subheadings',
      },
      {
        label: 'Images in content',
        pass: hasImages,
        warning: !hasImages,
        detail: hasImages ? 'Images present in content' : 'Add images to improve engagement',
      },
      {
        label: 'Meta description',
        pass: metaLen >= 120 && metaLen <= 160,
        warning: metaLen > 0 && (metaLen < 120 || metaLen > 160),
        detail: metaLen === 0
          ? 'No meta description'
          : metaLen < 120
          ? `${metaLen} chars — too short (120-160 recommended)`
          : metaLen > 160
          ? `${metaLen} chars — too long (max 160)`
          : `${metaLen} chars — perfect`,
      },
      {
        label: 'Excerpt / summary',
        pass: excerptLen > 0,
        detail: excerptLen > 0 ? 'Excerpt provided' : 'Add an excerpt for previews',
      },
      {
        label: 'Paragraph length',
        pass: longParagraphs === 0,
        warning: longParagraphs > 0,
        detail: longParagraphs === 0
          ? 'Paragraph lengths are good'
          : `${longParagraphs} paragraph(s) too long — break them up`,
      },
      {
        label: 'Lists for scannability',
        pass: hasLists,
        warning: !hasLists,
        detail: hasLists ? 'Lists present — good for readability' : 'Consider adding bullet lists',
      },
    ];

    const passed = checks.filter(c => c.pass).length;
    const score = Math.round((passed / checks.length) * 100);

    return { checks, score, wordCount, readingTime };
  }, [title, content, excerpt, metaDescription]);

  const scoreColor = analysis.score >= 80 ? 'text-green-500' : analysis.score >= 60 ? 'text-amber-500' : 'text-red-500';
  const scoreBg = analysis.score >= 80 ? 'bg-green-500' : analysis.score >= 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen size={18} className="text-gray-600 dark:text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Content Quality</h3>
      </div>

      <div className="flex items-center gap-4">
        <div className={`text-3xl font-black ${scoreColor}`}>{analysis.score}</div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Quality Score</span>
            <span>{analysis.score >= 80 ? 'Excellent' : analysis.score >= 60 ? 'Good' : 'Needs Work'}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${scoreBg}`} style={{ width: `${analysis.score}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center">
          <div className="font-bold text-gray-900 dark:text-white">{analysis.wordCount}</div>
          <div className="text-gray-500 dark:text-gray-400">Words</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center">
          <div className="font-bold text-gray-900 dark:text-white">{analysis.readingTime} min</div>
          <div className="text-gray-500 dark:text-gray-400">Read time</div>
        </div>
      </div>

      <div className="space-y-1.5">
        {analysis.checks.map((check, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              {check.pass ? (
                <CheckCircle size={13} className="text-green-500" />
              ) : check.warning ? (
                <AlertCircle size={13} className="text-amber-500" />
              ) : (
                <XCircle size={13} className="text-red-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{check.label}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{check.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
