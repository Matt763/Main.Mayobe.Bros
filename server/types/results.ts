export interface Student {
  index_number: string;
  name: string;         // fallback = index_number when NECTA omits names
  sex: string;
  aggregate: number | null;
  division: string;
  subjects: string;
}

export interface SchoolSummary {
  div1: number;
  div2: number;
  div3: number;
  div4: number;
  div0: number;
}

export interface School {
  center_number: string;
  school_name: string;
  summary: SchoolSummary;
  students: Student[];
}

export interface StructuredData {
  total_students: number;
  total_schools: number;
  schools: School[];
}

export interface CrawlEvent {
  stage: 'checking' | 'crawling' | 'processing' | 'building' | 'done' | 'error' | 'duplicate';
  progress?: number;
  total?: number;
  message: string;
  result?: CrawlResult;
  existingTitle?: string;
  existingId?: string;
}

export interface CrawlResult {
  title: string;
  slug: string;
  year: number;
  exam_type: string;
  source_url: string;
  content: string;
  structured_data: StructuredData;
  meta_title: string;
  meta_description: string;
}

export interface ResultRow {
  id: string;
  title: string;
  slug: string;
  year: number;
  exam_type: string;
  source_url: string | null;
  content: string | null;
  structured_data: StructuredData | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  status: string;
  bridge_post_id: string | null;
  created_at: string;
  updated_at: string;
}
