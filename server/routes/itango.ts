import { Router, Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../utils/supabase.js';

const router = Router();

const CEO_EMAILS = ['mclean@mayobebros.com', 'mcleanit@mayobebros.com'];

// ─── iTango auth: accepts Supabase Bearer JWT OR Express session ──────────────
async function requireITangoAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        const email = (data.user.email || '').toLowerCase();
        if (!CEO_EMAILS.includes(email)) {
          return res.status(403).json({ error: 'iTango requires CEO credentials' });
        }
        (req as any).itangoUser = email;
        return next();
      }
    } catch {}
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again at /itango-login' });
  }
  if ((req.session as any).userId) {
    (req as any).itangoUser = (req.session as any).email || 'admin';
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated. Please log in at /itango-login' });
}

// ─── Activity log ─────────────────────────────────────────────────────────────
const activityLog: Array<{
  id: string; ts: number; user: string;
  action: string; detail: string; risk: 'low' | 'medium' | 'high';
}> = [];

function logActivity(user: string, action: string, detail: string, risk: 'low' | 'medium' | 'high' = 'low') {
  activityLog.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(), user, action, detail, risk,
  });
  if (activityLog.length > 500) activityLog.pop();
}

// ─── AI key store ─────────────────────────────────────────────────────────────
const aiKeyStore: Record<string, string> = {
  claude: process.env.ANTHROPIC_API_KEY || '',
  openai: process.env.OPENAI_API_KEY || '',
  gemini: process.env.GEMINI_API_KEY || '',
};
let activeProvider: 'claude' | 'openai' | 'gemini' = 'claude';
const MODEL_MAP: Record<string, string> = {
  'claude-sonnet-4-6': 'claude-sonnet-4-6',
  'claude-haiku-4-5': 'claude-haiku-4-5-20251001',
  'claude-opus-4-6': 'claude-opus-4-6',
  'gpt-4o': 'gpt-4o',
  'gemini-pro': 'gemini-pro',
};

// ─── GitHub helpers ───────────────────────────────────────────────────────────
const GH_OWNER = (process.env.GITHUB_REPO || 'Matt763/Main.Mayobe.Bros').split('/')[0];
const GH_REPO  = (process.env.GITHUB_REPO || 'Matt763/Main.Mayobe.Bros').split('/')[1];
const GH_BRANCH = process.env.GITHUB_BRANCH || 'main';

async function ghFetch(path: string, options: RequestInit = {}) {
  const token = process.env.GITHUB_TOKEN || '';
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message || `GitHub API error: ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE BASE — iTango's accumulated intelligence
// ─────────────────────────────────────────────────────────────────────────────

interface KnowledgeEntry {
  id: string;
  ts: number;
  category: 'bug-fix' | 'performance' | 'security' | 'seo' | 'accessibility' | 'best-practice' | 'ux' | 'typescript';
  problem: string;
  solution: string;
  tags: string[];
  filePattern: string;
  effectiveness: number; // increments each time this pattern helps
  example?: { before: string; after: string };
}

// Seeded with project-specific knowledge
const knowledgeBase: KnowledgeEntry[] = [
  {
    id: 'seed-react-memo',
    ts: Date.now(),
    category: 'performance',
    problem: 'Inline objects/arrays in JSX props cause unnecessary child re-renders on every parent render',
    solution: 'Move static objects outside component scope or use useMemo for derived values. Use useCallback for function props.',
    tags: ['react', 'performance', 'hooks', 'rendering'],
    filePattern: 'src/**/*.tsx',
    effectiveness: 5,
  },
  {
    id: 'seed-supabase-auth',
    ts: Date.now(),
    category: 'security',
    problem: 'Supabase JWT tokens and API keys must never be logged or returned in full to the client',
    solution: 'Use keyHint patterns (show only last 6 chars), never log req.session or token payloads, store keys in env vars only',
    tags: ['security', 'auth', 'supabase', 'jwt'],
    filePattern: 'server/**/*.ts',
    effectiveness: 8,
  },
  {
    id: 'seed-seo-meta',
    ts: Date.now(),
    category: 'seo',
    problem: 'Missing or incomplete meta tags (description, og:image, og:type) on public-facing pages',
    solution: 'Every public page needs: title (50-60 chars), meta description (150-160 chars), og:title, og:description, og:image, og:type, canonical URL',
    tags: ['seo', 'meta', 'open-graph'],
    filePattern: 'src/pages/**/*.tsx',
    effectiveness: 7,
  },
  {
    id: 'seed-useeffect-cleanup',
    ts: Date.now(),
    category: 'bug-fix',
    problem: 'useEffect without cleanup causes memory leaks when component unmounts during async operations',
    solution: 'Return a cleanup function from useEffect; for async calls, use an isMounted flag or AbortController to cancel in-flight requests',
    tags: ['react', 'hooks', 'memory-leak', 'async'],
    filePattern: 'src/**/*.tsx',
    effectiveness: 6,
  },
  {
    id: 'seed-input-validation',
    ts: Date.now(),
    category: 'security',
    problem: 'User input passed to API routes without validation or sanitization',
    solution: 'Validate all req.body and req.query fields at route entry. Use typeof checks, length limits, allowlists. Never pass raw user input to database queries.',
    tags: ['security', 'validation', 'express', 'api'],
    filePattern: 'server/routes/**/*.ts',
    effectiveness: 9,
  },
  {
    id: 'seed-img-optimization',
    ts: Date.now(),
    category: 'performance',
    problem: 'Images without explicit width/height cause Cumulative Layout Shift (CLS) hurting Core Web Vitals',
    solution: 'Always set explicit width and height on img tags. Use loading="lazy" for below-fold images. Use WebP format where possible.',
    tags: ['performance', 'cls', 'images', 'core-web-vitals'],
    filePattern: 'src/**/*.tsx',
    effectiveness: 6,
  },
  {
    id: 'seed-error-boundary',
    ts: Date.now(),
    category: 'best-practice',
    problem: 'Unhandled errors in async useEffect crash the entire React tree with no user feedback',
    solution: 'Always wrap async operations in try/catch. Show user-friendly error states. Use Error Boundaries for subtrees that might fail.',
    tags: ['react', 'error-handling', 'ux'],
    filePattern: 'src/**/*.tsx',
    effectiveness: 5,
  },
  {
    id: 'seed-rate-limit',
    ts: Date.now(),
    category: 'security',
    problem: 'Public API endpoints without rate limiting are vulnerable to brute force and abuse',
    solution: 'Apply rate limiting middleware (express-rate-limit) to all public endpoints, especially auth, contact, and payment routes',
    tags: ['security', 'rate-limiting', 'express', 'api'],
    filePattern: 'server/routes/**/*.ts',
    effectiveness: 7,
  },
  {
    id: 'seed-a11y-contrast',
    ts: Date.now(),
    category: 'accessibility',
    problem: 'Low color contrast text fails WCAG AA standards (requires 4.5:1 for normal text, 3:1 for large text)',
    solution: 'Test contrast ratios with browser devtools or tools. For dark backgrounds, use text with luminance contrast ≥ 4.5:1. Never use gray-on-gray combinations.',
    tags: ['accessibility', 'wcag', 'contrast', 'ui'],
    filePattern: 'src/**/*.tsx',
    effectiveness: 4,
  },
  {
    id: 'seed-tailwind-bundle',
    ts: Date.now(),
    category: 'performance',
    problem: 'Dynamically constructed Tailwind class names are purged from the production bundle',
    solution: 'Use complete class names in source (avoid string concatenation for class names). Use safelist in tailwind.config for dynamic classes.',
    tags: ['tailwind', 'css', 'bundle', 'performance'],
    filePattern: 'src/**/*.tsx',
    effectiveness: 4,
  },
];

function getKnowledgeContext(): string {
  if (knowledgeBase.length === 0) return 'No accumulated knowledge yet — I will build it from fixes.';
  const sorted = [...knowledgeBase].sort((a, b) => b.effectiveness - a.effectiveness).slice(0, 20);
  return sorted.map(k =>
    `• [${k.category.toUpperCase()}] ${k.problem}\n  → ${k.solution}\n  Tags: ${k.tags.join(', ')}`
  ).join('\n\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER SYSTEM PROMPT — iTango's full intelligence
// ─────────────────────────────────────────────────────────────────────────────

function buildMasterSystemPrompt(fileContext = ''): string {
  const knowledge = getKnowledgeContext();
  return `You are iTango AI — an elite, battle-tested full-stack engineer and the dedicated guardian of mayobebros.com. You have deep, hands-on mastery across the entire modern web stack. You think proactively, catch issues before they become problems, and always provide complete, working solutions.

## Mayobe Bros Project — Complete Architecture

### Frontend Stack
- React 18 + TypeScript (strict mode) + Vite 5
- React Router v7 (file-based routing under src/pages/)
- Tailwind CSS 3 (utility-first, no CSS modules)
- Lucide React (icon library — prefer these over emoji in UI)
- State: React Context + useState/useReducer (no Redux)
- Lazy-loaded pages with React.lazy + Suspense in App.tsx

### Backend Stack
- Express.js (TypeScript) — server/index.ts entry point
- Routes: server/routes/ — one file per domain (auth, posts, pages, itango, etc.)
- Middleware: server/middleware/ — auth.ts, securityMonitor.ts
- Utilities: server/utils/ — supabase.ts, resend.ts, fileSystem.ts, activityLogger.ts
- Session-based auth for CMS admin, Bearer JWT for iTango standalone

### Database & Auth
- Supabase PostgreSQL — client at server/utils/supabase.ts
- Row Level Security (RLS) policies active
- CEO email whitelist for iTango: ['mclean@mayobebros.com', 'mcleanit@mayobebros.com']
- Session stored in Express sessions + Supabase JWT

### Integrations
- Email: Resend (server/utils/resend.ts) — 3 sender identities: welcome, password-reset, newsletter
- Payments: Stripe (subscriptions) + Pesapal + Flutterwave (regional/Kenya)
- AI: Anthropic Claude (primary) → OpenAI GPT-4o → Google Gemini (fallback chain)
- Storage: Supabase Storage + GitHub API for code file management
- Mobile: Capacitor wrapping the React app for iOS/Android
- Deployment: Vercel (serverless) — git push to main triggers production deploy
- Version control: GitHub — repo Matt763/Main.Mayobe.Bros, branch: main

## Your Expert Domains

### React & TypeScript Excellence
- Hooks rules: never call conditionally, always declare exhaustive deps in useEffect
- Always return cleanup functions from useEffect with subscriptions or timers
- useMemo for expensive computations, useCallback for stable function references
- React.memo for pure components that receive the same props frequently
- Avoid prop drilling beyond 2 levels — use Context or composition
- TypeScript: discriminated unions, type guards (is, as const), utility types (Partial, Required, Pick)
- Generic components with proper constraints, avoid 'any' — use 'unknown' + type guards
- Error boundaries around suspense boundaries and data-fetching components

### Express.js Security (Zero Trust)
- ALWAYS validate req.body, req.query, req.params before using them
- NEVER pass user input directly to SQL queries — use parameterized queries
- NEVER log tokens, passwords, or session data
- NEVER return full API keys — use keyHint patterns (show last 6 chars only)
- Rate limit ALL public endpoints — especially auth, contact, payments
- Set security headers: helmet.js, CORS with allowlist, CSP
- Sanitize HTML input before storage (DOMPurify equivalent server-side)
- Check JWT expiry on every protected route — do not trust session alone

### SEO & Core Web Vitals Mastery
- LCP < 2.5s: optimize hero image loading, preload critical fonts
- CLS < 0.1: set explicit width/height on all images, reserve space for async content
- INP < 200ms: avoid long-running main thread tasks, defer non-critical JS
- Every page needs: <title> (50-60 chars), <meta name="description"> (150-160 chars)
- Social: og:title, og:description, og:image (1200×630px), og:type, twitter:card
- Canonical URL on every page to prevent duplicate content penalties
- Structured data (JSON-LD): Article for posts, Organization for homepage, BreadcrumbList
- Semantic HTML: one <h1> per page, logical h2→h6 hierarchy, landmark elements

### Performance Engineering
- Bundle analysis: check for large deps (moment.js, lodash — use date-fns, lodash-es)
- Dynamic imports for routes and heavy components
- Images: WebP, explicit dimensions, loading="lazy" for below-fold
- Fonts: preconnect to font CDN, font-display: swap
- API responses: paginate lists, cache frequent reads, avoid N+1 queries
- Virtualize lists > 100 items (react-window or similar)
- Never block the main thread with synchronous operations

### Accessibility (WCAG 2.1 AA)
- Color contrast: ≥4.5:1 for normal text, ≥3:1 for large text (18px+ or 14px bold+)
- All interactive elements keyboard-navigable with visible focus indicators
- Images: meaningful alt text (empty alt="" for decorative images)
- Forms: labels associated with inputs via htmlFor/id pairs
- ARIA: use sparingly, native HTML semantics first
- Touch targets: minimum 44×44px on mobile
- Reduced motion: wrap animations in @media (prefers-reduced-motion: no-preference)

### UI/UX Design Intelligence
- Loading states: skeleton screens preferred over spinners for layout-heavy content
- Error states: always provide an action (retry, contact support)
- Empty states: explain why empty and guide next action
- Form validation: inline, real-time for fields user has touched (not on initial render)
- Typography: line-height 1.5-1.7 for body, 1.2-1.4 for headings
- Spacing: consistent 8px grid
- Mobile-first: test at 375px, then scale up

## Behavioral Standards

When you analyze code:
1. Understand INTENT before judging implementation
2. Rank issues by severity: security > bug > performance > UX > style
3. For every issue: state the problem, explain the risk, give a complete fix
4. Never suggest partial fixes or "you can improve this" without showing exactly how

When you propose code changes:
- Return COMPLETE file contents or EXACT diff — no ellipsis, no "rest remains the same"
- Mention any other files that need corresponding changes
- State what to test after applying the fix
- Flag any potential breaking changes

When you detect a security issue:
- Escalate urgency clearly
- Explain the attack vector in plain language
- Provide the fix AND explain how to verify the fix works

## Knowledge I've Accumulated From Past Fixes

${knowledge}

${fileContext ? `## Current File Under Review\n${fileContext}` : ''}

Remember: You are the guardian of this codebase. Think proactively. Catch problems before they reach production. Be decisive, be complete, be accurate.`;
}

// ─── Helper: call Claude cleanly ─────────────────────────────────────────────
async function callClaude(
  systemPrompt: string,
  userMessage: string,
  model = 'claude-sonnet-4-6',
  maxTokens = 4096,
): Promise<string> {
  const apiKey = aiKeyStore.claude;
  if (!apiKey) throw new Error('Claude API key not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL_MAP[model] || 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).error?.message || `Anthropic API error (${response.status})`);
  }

  const data = await response.json() as any;
  return data?.content?.[0]?.text || '';
}

// ─── Helper: safely extract JSON from AI response ────────────────────────────
function extractJSON<T>(text: string, fallback: T): T {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch {}
  try {
    // Extract from markdown code block
    const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) return JSON.parse(codeBlock[1].trim());
  } catch {}
  try {
    // Extract first JSON array
    const arr = text.match(/\[[\s\S]*\]/);
    if (arr) return JSON.parse(arr[0]);
  } catch {}
  try {
    // Extract first JSON object
    const obj = text.match(/\{[\s\S]*\}/);
    if (obj) return JSON.parse(obj[0]);
  } catch {}
  return fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL DEFINITIONS — what iTango can do autonomously
// ─────────────────────────────────────────────────────────────────────────────

const ITANGO_TOOLS = [
  {
    name: 'list_files',
    description: `List files and directories in the GitHub repository. Use this to explore the codebase structure before reading or editing files. Call with an empty path "" to list the root.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Directory path relative to repo root. Empty string "" for root.' },
      },
      required: [],
    },
  },
  {
    name: 'read_file',
    description: `Read the full contents of a file from the GitHub repository. Use this before making any edits so you understand the existing code.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path relative to repo root (e.g. "src/components/Header.tsx")' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: `Write/update a file in the GitHub repository and commit the change. ALWAYS read the file first. ALWAYS return the COMPLETE file content — never partial. Show a brief summary of what changed.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path relative to repo root' },
        content: { type: 'string', description: 'COMPLETE new file content (not a diff, not partial — the full file)' },
        commit_message: { type: 'string', description: 'Concise git commit message describing the change' },
      },
      required: ['path', 'content', 'commit_message'],
    },
  },
  {
    name: 'search_code',
    description: `Search for text patterns across all files in the repository. Use to find where a function, component, class, or string is defined or used.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query (supports exact strings and simple patterns)' },
        path: { type: 'string', description: 'Optional: narrow search to a specific directory (e.g. "src/components")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_repo_info',
    description: `Get repository metadata: name, default branch, last commit, open issues count.`,
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
];

// OpenAI function format (different schema shape)
const OPENAI_TOOLS = ITANGO_TOOLS.map(t => ({
  type: 'function' as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// TOOL EXECUTOR — runs a tool call and returns a string result
// ─────────────────────────────────────────────────────────────────────────────

interface ToolCallRecord {
  tool: string;
  input: Record<string, unknown>;
  result: string;
  error?: boolean;
  ts: number;
}

// In-memory SHA cache so write_file doesn't need a separate round-trip
const shaCache: Record<string, string> = {};

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {

      case 'list_files': {
        const path = (input.path as string) || '';
        const data = await ghFetch(
          `/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`
        ) as any[];
        if (!Array.isArray(data)) return 'Error: path is a file, not a directory.';
        const sorted = [...data].sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        const lines = sorted.map((f: any) =>
          `${f.type === 'dir' ? '📁' : '📄'} ${f.path}${f.type === 'file' ? ` (${f.size} bytes)` : ''}`
        );
        return `Repository: ${GH_OWNER}/${GH_REPO} | Branch: ${GH_BRANCH}\nPath: /${path || '(root)'}\n\n${lines.join('\n')}`;
      }

      case 'read_file': {
        const path = input.path as string;
        if (!path) return 'Error: path is required';
        const blocked = ['.env', 'credentials', 'secrets'];
        if (blocked.some(b => path.toLowerCase().includes(b))) {
          return 'Error: access to sensitive files is restricted.';
        }
        const data = await ghFetch(
          `/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`
        ) as any;
        if (data.type === 'dir') return 'Error: path is a directory — use list_files instead.';
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        shaCache[path] = data.sha;
        return `File: ${path} (${data.size} bytes, sha: ${data.sha})\n\`\`\`\n${content}\n\`\`\``;
      }

      case 'write_file': {
        const path = input.path as string;
        const content = input.content as string;
        const commitMsg = (input.commit_message as string) || 'iTango AI: update file';
        if (!path || content === undefined) return 'Error: path and content are required';

        const critical = ['server/middleware/auth', 'contexts/AuthContext', '.env'];
        if (critical.some(c => path.includes(c))) {
          return `Error: ${path} is a protected file. Explicit forceOverride is required for auth/security files.`;
        }

        if (!process.env.GITHUB_TOKEN) return 'Error: GITHUB_TOKEN not configured.';

        // Get current SHA (needed by GitHub API to update a file)
        let sha = shaCache[path];
        if (!sha) {
          try {
            const existing = await ghFetch(
              `/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`
            ) as any;
            sha = existing.sha;
            shaCache[path] = sha;
          } catch {
            // File doesn't exist yet — creating new file is fine (no sha needed)
          }
        }

        const body: any = {
          message: `${commitMsg}\n\nCo-authored by iTango AI`,
          content: Buffer.from(content, 'utf-8').toString('base64'),
          branch: GH_BRANCH,
        };
        if (sha) body.sha = sha;

        const result = await ghFetch(
          `/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`,
          { method: 'PUT', body: JSON.stringify(body) }
        ) as any;

        const newSha = result?.content?.sha || '';
        if (newSha) shaCache[path] = newSha;

        return `✅ Successfully committed "${commitMsg}" to ${GH_BRANCH}\nFile: ${path}\nNew SHA: ${newSha || '(unknown)'}`;
      }

      case 'search_code': {
        const query = input.query as string;
        const pathScope = input.path ? ` path:${input.path}` : '';
        if (!query) return 'Error: query is required';

        const searchUrl = `/search/code?q=${encodeURIComponent(query + ` repo:${GH_OWNER}/${GH_REPO}${pathScope}`)}&per_page=10`;
        const data = await ghFetch(searchUrl) as any;
        if (!data.items?.length) return `No results found for: "${query}"`;

        const results = data.items.map((item: any) =>
          `📄 ${item.path} (${item.repository?.full_name})\n   Match: ${item.text_matches?.[0]?.fragment?.replace(/\n/g, ' ').slice(0, 120) || '(see file)'}`
        );
        return `Found ${data.total_count} result(s) for "${query}":\n\n${results.join('\n\n')}`;
      }

      case 'get_repo_info': {
        const data = await ghFetch(`/repos/${GH_OWNER}/${GH_REPO}`) as any;
        return `Repository: ${data.full_name}
Description: ${data.description || 'none'}
Default branch: ${data.default_branch}
Language: ${data.language}
Stars: ${data.stargazers_count} | Forks: ${data.forks_count}
Open issues: ${data.open_issues_count}
Last push: ${data.pushed_at}
URL: ${data.html_url}`;
      }

      default:
        return `Error: unknown tool "${name}"`;
    }
  } catch (err: any) {
    return `Error executing ${name}: ${err.message}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/itango/chat  (agentic loop with tool use)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/chat', requireITangoAuth, async (req: Request, res: Response) => {
  const { messages, model = 'claude-sonnet-4-6', systemContext = '' } = req.body;
  const user = (req as any).itangoUser || 'unknown';

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const resolvedModel = MODEL_MAP[model] || MODEL_MAP['claude-sonnet-4-6'];
  const provider = resolvedModel.startsWith('claude') ? 'claude'
    : resolvedModel.startsWith('gpt') ? 'openai' : 'gemini';

  const apiKey = aiKeyStore[provider];
  if (!apiKey) {
    return res.status(400).json({
      error: `No API key configured for ${provider}. Go to iTango Settings to add your key.`,
    });
  }

  logActivity(user, 'AI_CHAT', `model=${resolvedModel}`, 'low');

  const systemPrompt = buildMasterSystemPrompt(systemContext ? `Current file context:\n${systemContext}` : '');
  const toolCallLog: ToolCallRecord[] = [];

  try {
    // ── CLAUDE (full agentic loop with tool use) ──────────────────────────────
    if (provider === 'claude') {
      let loopMessages = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content),
      }));

      let finalText = '';
      const MAX_ITERATIONS = 8;

      for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: resolvedModel,
            max_tokens: 8192,
            system: systemPrompt,
            tools: ITANGO_TOOLS,
            messages: loopMessages,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          return res.status(response.status).json({ error: (err as any).error?.message || `Anthropic error (${response.status})` });
        }

        const data = await response.json() as any;
        const stopReason: string = data.stop_reason;
        const contentBlocks: any[] = data.content || [];

        // Extract any text from this turn
        const textBlock = contentBlocks.find((b: any) => b.type === 'text');
        if (textBlock?.text) finalText = textBlock.text;

        // If no tool calls, we're done
        if (stopReason !== 'tool_use') break;

        // Process all tool calls in this turn
        const toolUseBlocks = contentBlocks.filter((b: any) => b.type === 'tool_use');
        if (toolUseBlocks.length === 0) break;

        // Add assistant message with tool use blocks
        loopMessages.push({ role: 'assistant', content: contentBlocks });

        // Execute each tool and collect results
        const toolResults: any[] = [];
        for (const toolUse of toolUseBlocks) {
          logActivity(user, `TOOL:${toolUse.name}`, JSON.stringify(toolUse.input).slice(0, 120), 'low');

          const result = await executeTool(toolUse.name, toolUse.input || {});
          toolCallLog.push({
            tool: toolUse.name,
            input: toolUse.input || {},
            result: result.slice(0, 500),
            error: result.startsWith('Error'),
            ts: Date.now(),
          });

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result,
          });
        }

        // Add tool results as user message and continue the loop
        loopMessages.push({ role: 'user', content: toolResults });
      }

      return res.json({ reply: finalText, toolCalls: toolCallLog });
    }

    // ── OPENAI (function calling) ─────────────────────────────────────────────
    if (provider === 'openai') {
      let loopMessages: any[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: String(m.content) })),
      ];

      let finalText = '';
      const MAX_ITERATIONS = 8;

      for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: resolvedModel,
            tools: OPENAI_TOOLS,
            tool_choice: 'auto',
            messages: loopMessages,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          return res.status(response.status).json({ error: (err as any).error?.message || `OpenAI error (${response.status})` });
        }

        const data = await response.json() as any;
        const choice = data.choices?.[0];
        const assistantMsg = choice?.message;
        if (!assistantMsg) break;

        loopMessages.push(assistantMsg);

        if (!assistantMsg.tool_calls?.length) {
          finalText = assistantMsg.content || '';
          break;
        }

        // Execute tool calls
        for (const tc of assistantMsg.tool_calls) {
          const toolInput = JSON.parse(tc.function.arguments || '{}');
          logActivity(user, `TOOL:${tc.function.name}`, JSON.stringify(toolInput).slice(0, 120), 'low');

          const result = await executeTool(tc.function.name, toolInput);
          toolCallLog.push({ tool: tc.function.name, input: toolInput, result: result.slice(0, 500), error: result.startsWith('Error'), ts: Date.now() });
          loopMessages.push({ role: 'tool', tool_call_id: tc.id, content: result });
        }
      }

      return res.json({ reply: finalText, toolCalls: toolCallLog });
    }

    // ── GEMINI (basic, no tool use — falls back to text with context injection) ─
    if (provider === 'gemini') {
      // Inject repo info into the system prompt since Gemini tool use is complex
      const repoInfo = await executeTool('get_repo_info', {}).catch(() => '');
      const geminiSystem = systemPrompt + `\n\nRepo info:\n${repoInfo}\n\nNote: You cannot directly browse the repo in this mode. Ask the user to select a file in the editor sidebar, and I will include its content in context.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: geminiSystem }] },
            contents: messages.map((m: any) => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: String(m.content) }],
            })),
          }),
        }
      );
      if (!response.ok) return res.status(response.status).json({ error: 'Gemini API error' });
      const data = await response.json() as any;
      return res.json({ reply: data?.candidates?.[0]?.content?.parts?.[0]?.text || '', toolCalls: [] });
    }

    return res.status(400).json({ error: `Provider "${provider}" not supported` });
  } catch (err: any) {
    console.error('[iTango chat]', err);
    return res.status(500).json({ error: err.message || 'AI request failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/itango/scan — Deep structured issue scan
// ─────────────────────────────────────────────────────────────────────────────
router.post('/scan', requireITangoAuth, async (req: Request, res: Response) => {
  const { filePath, fileContent } = req.body;
  const user = (req as any).itangoUser || 'unknown';

  if (!fileContent) return res.status(400).json({ error: 'fileContent is required' });
  if (!aiKeyStore.claude) return res.status(400).json({ error: 'Claude API key not configured' });

  const scanPrompt = `Perform a comprehensive code review of this file. Find ALL issues — bugs, security vulnerabilities, performance problems, SEO issues, TypeScript errors, accessibility gaps, and code quality problems.

Return ONLY a valid JSON array (no explanation, no markdown, just the array):
[
  {
    "severity": "critical",
    "type": "security",
    "line": 42,
    "title": "SQL injection vulnerability in search handler",
    "description": "User input is concatenated directly into a query string without sanitization, allowing attackers to manipulate the database query.",
    "suggestion": "Use parameterized queries: db.query('SELECT * FROM posts WHERE title = $1', [userInput])",
    "autoFixable": true
  }
]

Severity levels:
- "critical": crashes, security breach, data loss, broken auth
- "high": significant UX impact, potential security hole, broken feature
- "medium": performance issue, code smell, missing best practice
- "low": minor improvement, style inconsistency
- "info": observation, informational note

Types: "bug" | "security" | "performance" | "seo" | "accessibility" | "typescript" | "best-practice" | "ux"

autoFixable: true only when the fix is a clear, isolated code change with no ambiguity.

Be thorough. Find real issues, not nitpicks. If the code is clean, return an empty array [].

File: ${filePath || 'unknown'}
\`\`\`
${fileContent.slice(0, 12000)}
\`\`\``;

  try {
    const rawText = await callClaude(
      buildMasterSystemPrompt(),
      scanPrompt,
      'claude-sonnet-4-6',
      4096,
    );

    const issues = extractJSON<any[]>(rawText, []).map((iss: any, i: number) => ({
      id: `issue-${Date.now()}-${i}`,
      severity: iss.severity || 'info',
      type: iss.type || 'best-practice',
      line: iss.line || null,
      title: iss.title || 'Unknown issue',
      description: iss.description || '',
      suggestion: iss.suggestion || '',
      autoFixable: iss.autoFixable ?? false,
    }));

    logActivity(user, 'FILE_SCAN', `path=${filePath} found=${issues.length} issues`, 'low');
    res.json({ issues, filePath, scannedAt: Date.now() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/itango/propose — Generate a complete fix for a specific issue
// ─────────────────────────────────────────────────────────────────────────────
router.post('/propose', requireITangoAuth, async (req: Request, res: Response) => {
  const { filePath, fileContent, issueTitle, issueDescription, issueSuggestion } = req.body;
  const user = (req as any).itangoUser || 'unknown';

  if (!fileContent || !issueTitle) {
    return res.status(400).json({ error: 'fileContent and issueTitle are required' });
  }
  if (!aiKeyStore.claude) return res.status(400).json({ error: 'Claude API key not configured' });

  const proposePrompt = `Fix the following issue in this file. Return ONLY valid JSON (no markdown, no explanation outside the JSON):

Issue to fix: ${issueTitle}
Details: ${issueDescription || ''}
Suggested approach: ${issueSuggestion || ''}
File: ${filePath}

Required JSON format:
{
  "title": "Short verb phrase of what was fixed (max 60 chars)",
  "description": "2-3 sentences explaining what changed and why it matters",
  "newContent": "THE COMPLETE UPDATED FILE CONTENT HERE",
  "commitMessage": "fix(scope): concise description under 72 chars",
  "confidence": 90,
  "warnings": ["Any side effects or things to test after applying", "Other warning if applicable"]
}

Rules:
- "newContent" MUST be the complete, full file — not a snippet, not a diff, not abbreviated
- confidence is 0-100: 90+ means very certain, 60-80 means some ambiguity, <60 means needs manual review
- warnings should mention any other files that may need updating
- If you cannot safely fix this without more context, set confidence below 50 and explain in description

Original file content:
\`\`\`
${fileContent.slice(0, 10000)}
\`\`\``;

  try {
    const rawText = await callClaude(
      buildMasterSystemPrompt(`File being fixed: ${filePath}`),
      proposePrompt,
      'claude-sonnet-4-6',
      8192,
    );

    const proposal = extractJSON<any>(rawText, {});

    if (!proposal.newContent || !proposal.title) {
      return res.status(500).json({ error: 'AI returned an incomplete proposal. Try again or fix manually.' });
    }

    logActivity(user, 'FIX_PROPOSED', `path=${filePath} "${issueTitle}" confidence=${proposal.confidence}%`, 'medium');
    res.json({
      id: `prop-${Date.now()}`,
      ts: Date.now(),
      filePath,
      title: proposal.title,
      description: proposal.description || '',
      newContent: proposal.newContent,
      commitMessage: proposal.commitMessage || `fix: ${issueTitle}`,
      confidence: proposal.confidence || 80,
      warnings: Array.isArray(proposal.warnings) ? proposal.warnings : [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/itango/learn — Extract reusable pattern from a committed fix
// ─────────────────────────────────────────────────────────────────────────────
router.post('/learn', requireITangoAuth, async (req: Request, res: Response) => {
  const { filePath, beforeContent, afterContent, commitMessage } = req.body;
  const user = (req as any).itangoUser || 'unknown';

  if (!afterContent || !commitMessage) {
    return res.json({ skipped: true, reason: 'insufficient data' });
  }

  if (!aiKeyStore.claude) return res.json({ skipped: true, reason: 'no claude key' });

  // Use haiku (faster, cheaper) for learning extraction
  const learnPrompt = `Extract a reusable learning pattern from this code change.

File: ${filePath}
Commit: ${commitMessage}

Before (first 1500 chars):
${(beforeContent || '').slice(0, 1500)}

After (first 1500 chars):
${afterContent.slice(0, 1500)}

Return ONLY valid JSON:
{
  "category": "bug-fix",
  "problem": "Generic description of what was wrong (applicable to any similar file, not just this one)",
  "solution": "Generic description of how to fix it",
  "tags": ["react", "hooks", "typescript"],
  "filePattern": "src/**/*.tsx",
  "worthStoring": true
}

Categories: "bug-fix" | "performance" | "security" | "seo" | "accessibility" | "best-practice" | "ux" | "typescript"
worthStoring: false if the change is too project-specific to be reusable
Make problem/solution GENERIC — they are stored in a knowledge base used to scan future files.`;

  try {
    const rawText = await callClaude(
      'You are a code pattern extraction system. Extract reusable learnings from code changes. Return only JSON.',
      learnPrompt,
      'claude-haiku-4-5',
      512,
    );

    const learning = extractJSON<any>(rawText, {});

    if (!learning.problem || !learning.solution || learning.worthStoring === false) {
      return res.json({ skipped: true, reason: 'not worth storing' });
    }

    const entry: KnowledgeEntry = {
      id: `learn-${Date.now()}`,
      ts: Date.now(),
      category: learning.category || 'best-practice',
      problem: learning.problem,
      solution: learning.solution,
      tags: Array.isArray(learning.tags) ? learning.tags : [],
      filePattern: learning.filePattern || '*',
      effectiveness: 1,
    };

    knowledgeBase.unshift(entry);
    if (knowledgeBase.length > 150) knowledgeBase.pop();

    logActivity(user, 'KNOWLEDGE_LEARNED', `[${entry.category}] ${entry.problem.slice(0, 70)}`, 'low');
    res.json({ learned: true, entry });
  } catch (err: any) {
    res.json({ skipped: true, reason: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/itango/knowledge — Return accumulated knowledge base
// ─────────────────────────────────────────────────────────────────────────────
router.get('/knowledge', requireITangoAuth, (_req: Request, res: Response) => {
  const sorted = [...knowledgeBase].sort((a, b) => b.effectiveness - a.effectiveness);
  res.json({ entries: sorted.slice(0, 50), total: knowledgeBase.length });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/itango/health — Check site health
// ─────────────────────────────────────────────────────────────────────────────
router.post('/health', requireITangoAuth, async (req: Request, res: Response) => {
  const targets = ['https://www.mayobebros.com'];
  const checks: any[] = [];

  for (const url of targets) {
    try {
      const start = Date.now();
      const r = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'iTango-Guardian/1.0' },
      });
      const responseTime = Date.now() - start;
      checks.push({
        url, status: r.status, ok: r.ok, responseTime,
        contentType: r.headers.get('content-type'),
        assessment: responseTime < 1000 ? 'excellent' : responseTime < 2500 ? 'good' : responseTime < 4000 ? 'slow' : 'critical',
      });
    } catch (e: any) {
      checks.push({ url, status: 0, ok: false, error: e.message, assessment: 'unreachable' });
    }
  }

  const allOk = checks.every(c => c.ok);
  res.json({ checks, healthy: allOk, ts: Date.now() });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/itango/files
// ─────────────────────────────────────────────────────────────────────────────
router.get('/files', requireITangoAuth, async (req: Request, res: Response) => {
  const { path = '' } = req.query as { path?: string };
  const user = (req as any).itangoUser || 'unknown';
  try {
    const data = await ghFetch(
      `/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`
    ) as any[];
    const items = Array.isArray(data)
      ? data
          .map((f: any) => ({ name: f.name, path: f.path, type: f.type, size: f.size, sha: f.sha }))
          .sort((a: any, b: any) => {
            if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
            return a.name.localeCompare(b.name);
          })
      : [];
    logActivity(user, 'FILE_BROWSE', `path=${path || '/'}`, 'low');
    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/itango/file
// ─────────────────────────────────────────────────────────────────────────────
router.get('/file', requireITangoAuth, async (req: Request, res: Response) => {
  const { path } = req.query as { path?: string };
  const user = (req as any).itangoUser || 'unknown';
  if (!path) return res.status(400).json({ error: 'path is required' });

  const blocked = ['.env', '.env.local', 'users.json', 'credentials'];
  if (blocked.some(b => path.includes(b))) {
    return res.status(403).json({ error: 'Access to sensitive files is restricted' });
  }

  try {
    const data = await ghFetch(
      `/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`
    ) as any;
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    logActivity(user, 'FILE_READ', `path=${path}`, 'low');
    res.json({ path, content, sha: data.sha, size: data.size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/itango/commit
// ─────────────────────────────────────────────────────────────────────────────
router.post('/commit', requireITangoAuth, async (req: Request, res: Response) => {
  const { path, content, message = 'iTango AI: update file', sha } = req.body;
  const user = (req as any).itangoUser || 'unknown';

  if (!path || content === undefined) {
    return res.status(400).json({ error: 'path and content are required' });
  }

  const critical = ['server/middleware/auth', 'contexts/AuthContext', 'supabase.ts', '.env'];
  const isCritical = critical.some(c => path.includes(c));
  if (isCritical && !req.body.forceOverride) {
    return res.status(403).json({
      error: 'Critical file protection: set forceOverride=true to edit auth/security files',
      isCritical: true,
    });
  }

  if (!process.env.GITHUB_TOKEN) {
    return res.status(400).json({ error: 'GITHUB_TOKEN not configured. Add it in your .env file.' });
  }

  try {
    const encoded = Buffer.from(content, 'utf-8').toString('base64');
    const body: any = {
      message: `${message}\n\nCo-authored by iTango AI`,
      content: encoded,
      branch: GH_BRANCH,
    };
    if (sha) body.sha = sha;

    const result = await ghFetch(`/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }) as any;

    const newSha = result?.content?.sha || result?.commit?.sha || '';
    logActivity(user, 'FILE_COMMIT', `path=${path} msg="${message}"`, 'high');
    res.json({ success: true, message: `Committed ${path} to ${GH_BRANCH}`, sha: newSha });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/itango/deploy
// ─────────────────────────────────────────────────────────────────────────────
router.post('/deploy', requireITangoAuth, async (req: Request, res: Response) => {
  const { target = 'preview' } = req.body;
  const user = (req as any).itangoUser || 'unknown';
  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID || '';

  if (!vercelToken || !vercelProjectId) {
    return res.status(400).json({ error: 'VERCEL_TOKEN and VERCEL_PROJECT_ID are required in .env' });
  }

  const repoId = Number(process.env.VERCEL_GITHUB_REPO_ID);
  if (!repoId) {
    return res.status(400).json({ error: 'VERCEL_GITHUB_REPO_ID is required in .env (get it from GitHub API)' });
  }

  try {
    const teamQuery = teamId ? `?teamId=${teamId}` : '';
    const deployRes = await fetch(`https://api.vercel.com/v13/deployments${teamQuery}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: GH_REPO.toLowerCase(),
        project: vercelProjectId,
        gitSource: {
          type: 'github',
          repoId,
          ref: GH_BRANCH,
          org: GH_OWNER,
          repo: GH_REPO,
        },
        target: target === 'production' ? 'production' : undefined,
      }),
    });

    if (!deployRes.ok) {
      const err = await deployRes.json().catch(() => ({}));
      const msg = (err as any).error?.message || (err as any).message || `Vercel API error (${deployRes.status})`;
      logActivity(user, 'DEPLOY_FAILED', `target=${target} error=${msg}`, 'high');
      return res.status(deployRes.status).json({ error: msg });
    }

    const deployment = await deployRes.json() as any;
    const deployUrl = deployment.url ? `https://${deployment.url}` : null;
    logActivity(user, 'DEPLOY', `target=${target} id=${deployment.id} url=${deployUrl}`, 'high');
    res.json({
      success: true,
      deploymentId: deployment.id,
      url: deployUrl,
      state: deployment.readyState || 'BUILDING',
      target,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/itango/activity
// ─────────────────────────────────────────────────────────────────────────────
router.get('/activity', requireITangoAuth, (_req: Request, res: Response) => {
  res.json({ log: activityLog.slice(0, 100) });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET/POST /api/itango/settings
// ─────────────────────────────────────────────────────────────────────────────
router.get('/settings', requireITangoAuth, (_req: Request, res: Response) => {
  res.json({
    activeProvider,
    providers: {
      claude: { configured: !!aiKeyStore.claude, keyHint: aiKeyStore.claude ? `sk-ant-...${aiKeyStore.claude.slice(-6)}` : null },
      openai: { configured: !!aiKeyStore.openai, keyHint: aiKeyStore.openai ? `sk-...${aiKeyStore.openai.slice(-6)}` : null },
      gemini: { configured: !!aiKeyStore.gemini, keyHint: aiKeyStore.gemini ? `AIza...${aiKeyStore.gemini.slice(-6)}` : null },
    },
    github: { configured: !!process.env.GITHUB_TOKEN, repo: `${GH_OWNER}/${GH_REPO}`, branch: GH_BRANCH },
    vercel: { configured: !!(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID) },
    knowledgeBase: { entries: knowledgeBase.length },
  });
});

router.post('/settings', requireITangoAuth, (req: Request, res: Response) => {
  const { provider, apiKey, setActive } = req.body;
  const user = (req as any).itangoUser || 'unknown';

  if (provider && apiKey !== undefined) {
    if (!['claude', 'openai', 'gemini'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }
    aiKeyStore[provider] = apiKey;
    logActivity(user, 'API_KEY_UPDATE', `provider=${provider}`, 'medium');
  }

  if (setActive && ['claude', 'openai', 'gemini'].includes(setActive)) {
    activeProvider = setActive as typeof activeProvider;
    logActivity(user, 'PROVIDER_SWITCH', `active=${setActive}`, 'low');
  }

  res.json({ success: true, activeProvider });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/itango/analyze — Legacy endpoint (kept for compatibility)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/analyze', requireITangoAuth, async (req: Request, res: Response) => {
  const { filePath, fileContent, analysisType = 'general' } = req.body;
  const user = (req as any).itangoUser || 'unknown';

  if (!fileContent) return res.status(400).json({ error: 'fileContent is required' });
  if (!aiKeyStore.claude) return res.status(400).json({ error: 'Claude API key not configured' });

  const prompts: Record<string, string> = {
    general: `Analyze this file thoroughly. Explain what it does, identify bugs, performance issues, and security vulnerabilities. Provide specific, actionable recommendations with code examples.`,
    seo: `Perform a comprehensive SEO audit. Check meta tags, structured data, semantic HTML, Core Web Vitals impact, social sharing tags, and content structure. Provide exact code fixes.`,
    security: `Security audit. Find: input validation gaps, XSS vectors, auth bypass risks, exposed secrets, SQL injection, CSRF vulnerabilities, insecure data handling. Explain each risk's attack vector.`,
    performance: `Performance review. Find: unnecessary re-renders, large bundle imports, blocking operations, missing lazy loading, N+1 queries, unoptimized images, memory leaks. Quantify impact where possible.`,
  };

  try {
    const analysis = await callClaude(
      buildMasterSystemPrompt(`Analyzing: ${filePath}`),
      `${prompts[analysisType] || prompts.general}\n\nFile: ${filePath}\n\`\`\`\n${fileContent.slice(0, 8000)}\n\`\`\``,
    );
    logActivity(user, 'FILE_ANALYZE', `path=${filePath} type=${analysisType}`, 'low');
    res.json({ analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/itango/repos — list authenticated user's GitHub repos
// ─────────────────────────────────────────────────────────────────────────────
router.get('/repos', requireITangoAuth, async (_req: Request, res: Response) => {
  try {
    const repos = await ghFetch('/user/repos?type=all&sort=updated&per_page=50&affiliation=owner,collaborator') as any[];
    res.json({
      repos: repos.map((r: any) => ({
        id: r.id,
        name: r.full_name,
        description: r.description || '',
        private: r.private,
        updatedAt: r.updated_at,
        defaultBranch: r.default_branch,
        language: r.language,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/itango/branches — list branches for a repo
// ─────────────────────────────────────────────────────────────────────────────
router.get('/branches', requireITangoAuth, async (req: Request, res: Response) => {
  const { repo } = req.query as { repo?: string };
  const target = repo || `${GH_OWNER}/${GH_REPO}`;
  if (!target.includes('/')) {
    return res.status(400).json({ error: 'repo must be in owner/name format' });
  }
  try {
    const branches = await ghFetch(`/repos/${target}/branches?per_page=50`) as any[];
    res.json({ branches: branches.map((b: any) => ({ name: b.name, sha: b.commit.sha })) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/itango/deployments — list recent Vercel deployments
// ─────────────────────────────────────────────────────────────────────────────
router.get('/deployments', requireITangoAuth, async (_req: Request, res: Response) => {
  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID || '';
  if (!vercelToken || !vercelProjectId) {
    return res.status(400).json({ error: 'VERCEL_TOKEN and VERCEL_PROJECT_ID required' });
  }
  try {
    const teamQuery = teamId ? `&teamId=${teamId}` : '';
    const r = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${vercelProjectId}&limit=10${teamQuery}`,
      { headers: { Authorization: `Bearer ${vercelToken}` } }
    );
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: (err as any).error?.message || 'Vercel API error' });
    }
    const data = await r.json() as any;
    const deployments = (data.deployments || []).map((d: any) => ({
      id: d.uid,
      url: d.url ? `https://${d.url}` : null,
      state: d.readyState || d.state,
      target: d.target,
      createdAt: d.created || d.createdAt,   // Vercel v6 uses 'created'
      branch: d.meta?.githubCommitRef || GH_BRANCH,
      message: d.meta?.githubCommitMessage?.split('\n')[0] || '',
    }));
    res.json({ deployments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { logActivity };
export default router;
