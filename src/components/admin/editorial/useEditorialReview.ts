import { useState, useCallback } from 'react';
import {
  OverallReview, ReadabilityResult, SeoResult, HeadlineResult,
  EngagementResult, ChecklistResult, SuggestionsResult,
} from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const EDGE_URL = `${SUPABASE_URL}/functions/v1/ai-assistant`;

async function callAI(action: string, payload: Record<string, unknown>, apiKey: string): Promise<string> {
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'X-OpenAI-Key': apiKey,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || 'AI request failed');
  return data.result as string;
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned) as T;
}

interface ArticlePayload {
  title: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  metaKeywords: string;
  featuredImage: string;
}

export function useEditorialReview(apiKey: string) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T>(
    action: string,
    payload: Record<string, unknown>,
    parser: (raw: string) => T
  ): Promise<T | null> => {
    setLoadingAction(action);
    setError(null);
    try {
      const raw = await callAI(action, payload, apiKey);
      return parser(raw);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      return null;
    } finally {
      setLoadingAction(null);
    }
  }, [apiKey]);

  const runOverallReview = useCallback((article: ArticlePayload) =>
    run<OverallReview>('editorial_review', article, raw => parseJSON<OverallReview>(raw)),
    [run]);

  const runReadability = useCallback((article: ArticlePayload) =>
    run<ReadabilityResult>('editorial_readability', article, raw => parseJSON<ReadabilityResult>(raw)),
    [run]);

  const runSeoAnalysis = useCallback((article: ArticlePayload) =>
    run<SeoResult>('editorial_seo', article, raw => parseJSON<SeoResult>(raw)),
    [run]);

  const runHeadlineAnalysis = useCallback((article: ArticlePayload) =>
    run<HeadlineResult>('editorial_headline', article, raw => parseJSON<HeadlineResult>(raw)),
    [run]);

  const runEngagementAnalysis = useCallback((article: ArticlePayload) =>
    run<EngagementResult>('editorial_engagement', article, raw => parseJSON<EngagementResult>(raw)),
    [run]);

  const runChecklist = useCallback((article: ArticlePayload) =>
    run<ChecklistResult>('editorial_checklist', article, raw => parseJSON<ChecklistResult>(raw)),
    [run]);

  const runSuggestions = useCallback((article: ArticlePayload) =>
    run<SuggestionsResult>('editorial_suggestions', article, raw => parseJSON<SuggestionsResult>(raw)),
    [run]);

  return {
    loadingAction,
    error,
    runOverallReview,
    runReadability,
    runSeoAnalysis,
    runHeadlineAnalysis,
    runEngagementAnalysis,
    runChecklist,
    runSuggestions,
  };
}
