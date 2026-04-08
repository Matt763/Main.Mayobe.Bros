import { useMemo } from 'react';
import { FileText, Clock, BookOpen, TrendingUp, Zap } from 'lucide-react';

interface WritingStatsBarProps {
  content: string;
  title: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function fleschKincaid(text: string): { score: number; grade: string; label: string; color: string } {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3).length || 1;
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length || 1;

  // Count syllables (approximate)
  let syllables = 0;
  words.forEach(word => {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return;
    let count = 0;
    const vowels = w.match(/[aeiouy]+/g);
    count = vowels ? vowels.length : 1;
    if (w.endsWith('e') && count > 1) count--;
    syllables += Math.max(1, count);
  });

  const score = 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount);
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

  let grade = 'College';
  let label = 'Very Hard';
  let color = 'text-red-500';

  if (clampedScore >= 90) { grade = '5th grade'; label = 'Very Easy'; color = 'text-green-500'; }
  else if (clampedScore >= 80) { grade = '6th grade'; label = 'Easy'; color = 'text-green-400'; }
  else if (clampedScore >= 70) { grade = '7th grade'; label = 'Fairly Easy'; color = 'text-lime-500'; }
  else if (clampedScore >= 60) { grade = '8th–9th grade'; label = 'Standard'; color = 'text-yellow-500'; }
  else if (clampedScore >= 50) { grade = '10th–12th grade'; label = 'Fairly Hard'; color = 'text-orange-500'; }
  else if (clampedScore >= 30) { grade = 'College'; label = 'Hard'; color = 'text-red-400'; }
  else { grade = 'Graduate'; label = 'Very Hard'; color = 'text-red-600'; }

  return { score: clampedScore, grade, label, color };
}

function detectTone(text: string): { tone: string; color: string; bg: string } {
  const formal = (text.match(/\b(therefore|furthermore|moreover|consequently|nevertheless|regarding|pursuant|hereby|aforementioned)\b/gi) || []).length;
  const casual = (text.match(/\b(great|awesome|cool|really|totally|super|kind of|you know|basically|gonna|wanna)\b/gi) || []).length;
  const analytical = (text.match(/\b(analysis|research|data|evidence|study|results|findings|indicates|demonstrates|suggests)\b/gi) || []).length;

  if (analytical > 3) return { tone: 'Analytical', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' };
  if (formal > casual) return { tone: 'Formal', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' };
  if (casual > formal + 2) return { tone: 'Casual', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' };
  return { tone: 'Neutral', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800' };
}

function calcWritingScore(text: string, title: string, wordCount: number): { score: number; color: string } {
  let score = 50;

  if (wordCount >= 300) score += 10;
  if (wordCount >= 600) score += 10;
  if (wordCount >= 1000) score += 5;
  if (wordCount >= 1500) score += 5;

  if (title.length >= 30 && title.length <= 70) score += 10;

  const passiveCount = (text.match(/\b(was|were|is|are|been|being)\s+\w+ed\b/gi) || []).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3).length || 1;
  const passiveRatio = passiveCount / sentences;
  if (passiveRatio < 0.2) score += 10;

  const avgSentenceLength = wordCount / sentences;
  if (avgSentenceLength < 25) score += 10;

  score = Math.min(100, Math.max(0, score));
  const color = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-400';
  return { score, color };
}

export default function WritingStatsBar({ content, title }: WritingStatsBarProps) {
  const stats = useMemo(() => {
    const text = stripHtml(content);
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3).length;
    const paragraphs = content.split(/<\/p>/i).filter(p => p.replace(/<[^>]+>/g, '').trim().length > 0).length;
    const readingTime = Math.max(1, Math.round(wordCount / 200));
    const flesch = fleschKincaid(text);
    const tone = detectTone(text);
    const writing = calcWritingScore(text, title, wordCount);
    return { wordCount, sentences, paragraphs, readingTime, flesch, tone, writing };
  }, [content, title]);

  if (!content || stats.wordCount < 10) return null;

  return (
    <div className="flex items-center gap-4 px-6 py-2.5 bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-gray-800/80 dark:to-gray-800/40 border-b border-gray-100 dark:border-gray-700/60 flex-wrap text-xs overflow-x-auto">

      {/* Word count */}
      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 shrink-0">
        <FileText size={12} className="text-gray-400" />
        <span className="font-semibold text-gray-800 dark:text-gray-200">{stats.wordCount.toLocaleString()}</span>
        <span>words</span>
      </div>

      <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-600 shrink-0" />

      {/* Sentences */}
      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 shrink-0">
        <span className="font-medium text-gray-700 dark:text-gray-300">{stats.sentences}</span>
        <span>sentences</span>
      </div>

      <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-600 shrink-0" />

      {/* Paragraphs */}
      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 shrink-0">
        <span className="font-medium text-gray-700 dark:text-gray-300">{stats.paragraphs}</span>
        <span>paragraphs</span>
      </div>

      <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-600 shrink-0" />

      {/* Reading time */}
      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 shrink-0">
        <Clock size={12} className="text-gray-400" />
        <span className="font-medium text-gray-700 dark:text-gray-300">{stats.readingTime} min</span>
        <span>read</span>
      </div>

      <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-600 shrink-0" />

      {/* Readability */}
      <div className="flex items-center gap-1.5 shrink-0">
        <BookOpen size={12} className="text-gray-400" />
        <span className={`font-semibold ${stats.flesch.color}`}>{stats.flesch.label}</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-500 dark:text-gray-400">{stats.flesch.grade}</span>
      </div>

      <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-600 shrink-0" />

      {/* Tone */}
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full shrink-0 ${stats.tone.bg}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" style={{ color: 'inherit' }} />
        <span className={`font-medium ${stats.tone.color}`}>{stats.tone.tone}</span>
      </div>

      {/* Writing score */}
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        <TrendingUp size={12} className="text-gray-400" />
        <span className="text-gray-500 dark:text-gray-400">Writing Score</span>
        <span className={`font-bold text-sm ${stats.writing.color}`}>{stats.writing.score}</span>
        <Zap size={11} className={stats.writing.score >= 80 ? 'text-yellow-400' : 'text-gray-300'} />
      </div>
    </div>
  );
}
