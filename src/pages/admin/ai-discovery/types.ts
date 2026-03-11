export interface DiscoveredTopic {
  title: string;
  angle: string;
  interestLevel: 'High' | 'Medium' | 'Trending';
  estimatedSearchVolume: 'Low' | 'Medium' | 'High' | 'Very High';
  difficulty: 'Easy' | 'Moderate' | 'Competitive';
  primaryKeyword: string;
  keywords: string[];
  category: string;
  whyItWorks: string;
}

export interface ArticleOutline {
  title: string;
  introduction: string;
  sections: {
    heading: string;
    description: string;
    subsections: string[];
  }[];
  conclusion: string;
  estimatedWordCount: number;
  readingTime: string;
}

export interface KeywordData {
  primary: string[];
  secondary: string[];
  longTail: string[];
  questions: string[];
  lsiKeywords: string[];
}

export interface SeoMeta {
  metaTitle: string;
  metaDescription: string;
  slug: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  ogTitle: string;
  ogDescription: string;
  structuredDataType: string;
  contentScore: number;
}

export interface InternalLinkRec {
  postTitle: string;
  reason: string;
  anchorText: string;
  placement: string;
}

export interface InternalLinksResult {
  recommendations: InternalLinkRec[];
  summary: string;
}

export interface CalendarEntry {
  id: string;
  title: string;
  topic: string;
  category: string;
  scheduled_date: string | null;
  status: 'draft' | 'in_progress' | 'ready' | 'published';
  notes: string;
  keywords: string[];
  outline: ArticleOutline | null;
  meta: SeoMeta | null;
  created_by: string;
  post_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedTopic {
  id: string;
  title: string;
  angle: string;
  interest_level: string;
  search_volume: string;
  difficulty: string;
  primary_keyword: string;
  keywords: string[];
  category: string;
  why_it_works: string;
  created_by: string;
  created_at: string;
}

export type WorkflowStep = 'discover' | 'outline' | 'keywords' | 'draft' | 'links' | 'seo' | 'calendar';
