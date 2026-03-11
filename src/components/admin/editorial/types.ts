export interface ReviewDimension {
  score: number;
  label: string;
  feedback: string;
}

export interface OverallReview {
  overallScore: number;
  verdict: 'Publish Ready' | 'Needs Minor Edits' | 'Needs Major Revision' | 'Not Ready';
  summary: string;
  dimensions: {
    clarity: ReviewDimension;
    structure: ReviewDimension;
    readability: ReviewDimension;
    engagement: ReviewDimension;
    seo: ReviewDimension;
    originality: ReviewDimension;
  };
  topStrengths: string[];
  criticalIssues: string[];
  quickWins: string[];
}

export interface ReadabilityIssue {
  type: string;
  description: string;
  example: string;
  fix: string;
}

export interface ReadabilityResult {
  readabilityScore: number;
  gradeLevel: string;
  averageSentenceLength: number;
  complexityRating: string;
  strengths: string[];
  issues: ReadabilityIssue[];
  suggestions: string[];
  passiveVoiceEstimate: string;
  jargonLevel: string;
}

export interface SeoFactor {
  score: number;
  feedback: string;
}

export interface SeoImprovement {
  priority: 'High' | 'Medium' | 'Low';
  action: string;
  impact: string;
}

export interface SeoResult {
  seoScore: number;
  keywordDensity: string;
  titleOptimization: SeoFactor;
  metaOptimization: SeoFactor;
  headingStructure: SeoFactor;
  contentDepth: SeoFactor;
  internalLinking: SeoFactor;
  improvements: SeoImprovement[];
  targetKeywords: string[];
}

export interface HeadlineAlternative {
  headline: string;
  type: string;
  reason: string;
}

export interface HeadlineResult {
  headlineScore: number;
  rating: string;
  emotionalImpact: string;
  clarity: string;
  seoFriendly: boolean;
  clickworthiness: string;
  analysis: string;
  weaknesses: string[];
  alternatives: HeadlineAlternative[];
}

export interface EngagementFactor {
  score: number;
  feedback: string;
}

export interface EngagementTip {
  section: string;
  issue: string;
  fix: string;
}

export interface EngagementResult {
  engagementScore: number;
  estimatedBounceRisk: string;
  hookStrength: EngagementFactor;
  storyFlow: EngagementFactor;
  contentClarity: EngagementFactor;
  valueProposition: EngagementFactor;
  callToAction: { present: boolean; strength: string; feedback: string };
  engagementTips: EngagementTip[];
  predictedTimeOnPage: string;
  audienceMatch: string;
}

export interface ChecklistItem {
  category: 'Content' | 'SEO' | 'Media' | 'Technical';
  item: string;
  status: 'pass' | 'fail' | 'warning';
  detail: string;
  priority: 'Required' | 'Recommended' | 'Optional';
}

export interface ChecklistResult {
  readyToPublish: boolean;
  completionPercentage: number;
  items: ChecklistItem[];
  blockers: string[];
  warnings: string[];
}

export interface SuggestionItem {
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  issue: string;
  suggestion: string;
  example?: string;
}

export interface SuggestionsResult {
  prioritySuggestions: SuggestionItem[];
  moderateSuggestions: SuggestionItem[];
  polishSuggestions: SuggestionItem[];
  rewriteSuggestion: string;
  estimatedImprovementScore: number;
}

export interface EditorialReviewState {
  overall: OverallReview | null;
  readability: ReadabilityResult | null;
  seo: SeoResult | null;
  headline: HeadlineResult | null;
  engagement: EngagementResult | null;
  checklist: ChecklistResult | null;
  suggestions: SuggestionsResult | null;
}

export type EditorialTab = 'overview' | 'readability' | 'seo' | 'headline' | 'engagement' | 'checklist' | 'suggestions';
