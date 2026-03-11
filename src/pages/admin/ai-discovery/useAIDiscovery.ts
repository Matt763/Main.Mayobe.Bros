import { useState, useCallback } from 'react';
import { DiscoveredTopic, ArticleOutline, KeywordData, SeoMeta, InternalLinksResult } from './types';

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

export function useAIDiscovery(apiKey: string) {
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

  const discoverTopics = useCallback((category?: string) =>
    run<DiscoveredTopic[]>('discover_topics', { category }, raw => parseJSON<DiscoveredTopic[]>(raw)),
    [run]);

  const generateOutline = useCallback((topic: string, category: string, keywords: string[]) =>
    run<ArticleOutline>('generate_outline', { topic, category, keywords }, raw => parseJSON<ArticleOutline>(raw)),
    [run]);

  const suggestKeywords = useCallback((topic: string, category: string) =>
    run<KeywordData>('suggest_keywords', { topic, category }, raw => parseJSON<KeywordData>(raw)),
    [run]);

  const generateDraft = useCallback((topic: string, outline: string, keywords: string[]) =>
    run<string>('generate_draft', { topic, outline, keywords }, raw => raw),
    [run]);

  const generateFullDraft = useCallback((topic: string, category: string, keywords: string[]) =>
    run<string>('generate_full_draft', { topic, category, keywords }, raw => raw),
    [run]);

  const suggestInternalLinks = useCallback((topic: string, outline: string, existingPosts: string[]) =>
    run<InternalLinksResult>('suggest_internal_links', { topic, outline, existingPosts }, raw => parseJSON<InternalLinksResult>(raw)),
    [run]);

  const generateSeoMeta = useCallback((topic: string, category: string, keywords: string[], outline: string) =>
    run<SeoMeta>('generate_seo_meta', { topic, category, keywords, outline }, raw => parseJSON<SeoMeta>(raw)),
    [run]);

  return {
    loadingAction,
    error,
    discoverTopics,
    generateOutline,
    suggestKeywords,
    generateDraft,
    generateFullDraft,
    suggestInternalLinks,
    generateSeoMeta,
  };
}
