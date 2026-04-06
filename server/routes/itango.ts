import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ─── In-memory activity log (production: store in Supabase) ──────────────────
const activityLog: Array<{
  id: string;
  ts: number;
  user: string;
  action: string;
  detail: string;
  risk: 'low' | 'medium' | 'high';
}> = [];

function logActivity(user: string, action: string, detail: string, risk: 'low' | 'medium' | 'high' = 'low') {
  activityLog.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    user,
    action,
    detail,
    risk,
  });
  if (activityLog.length > 500) activityLog.pop();
}

// ─── AI Key store (env-first, then in-memory overrides via settings route) ───
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
const GH_REPO = (process.env.GITHUB_REPO || 'Matt763/Main.Mayobe.Bros').split('/')[1];
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

// ─── POST /api/itango/chat ────────────────────────────────────────────────────
router.post('/chat', requireAuth, async (req: Request, res: Response) => {
  const { messages, model = 'claude-sonnet-4-6', systemContext = '' } = req.body;
  const user = (req.session as any).email || 'unknown';

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const resolvedModel = MODEL_MAP[model] || MODEL_MAP['claude-sonnet-4-6'];
  const provider = resolvedModel.startsWith('claude') ? 'claude'
    : resolvedModel.startsWith('gpt') ? 'openai' : 'gemini';

  const apiKey = aiKeyStore[provider];
  if (!apiKey) {
    return res.status(400).json({
      error: `No API key configured for ${provider}. Go to Admin → iTango Settings to add your key.`,
    });
  }

  logActivity(user, 'AI_CHAT', `model=${resolvedModel} provider=${provider}`, 'low');

  const systemPrompt = `You are iTango AI — an expert full-stack engineer and website architect embedded inside the Mayobe Bros Admin CMS.

You have deep knowledge of this project:
- React 18 + TypeScript + Vite frontend
- Express.js backend (server/routes/, server/utils/)
- Supabase for auth and database
- Tailwind CSS for styling
- React Router v7 for routing
- The site is mayobebros.com — a news/blog CMS

Your capabilities:
- Read and analyze any file in the project
- Suggest and write code changes
- Identify bugs and performance issues
- Optimize SEO and content structure
- Generate new components, routes, and features

Safety rules you MUST follow:
- Never suggest deleting critical auth files, routing files, or database configs
- Always warn before destructive changes
- Provide complete, working code in your suggestions
- Explain what each change does and why

${systemContext ? `\nExtra context:\n${systemContext}` : ''}`;

  try {
    // ─── Claude ──────────────────────────────────────────────────────────────
    if (provider === 'claude') {
      const body = {
        model: resolvedModel,
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      };

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ ...body, stream: true }),
      });

      if (!upstream.ok) {
        const err = await upstream.json().catch(() => ({}));
        return res.status(upstream.status).json({ error: (err as any).error?.message || 'Anthropic API error' });
      }

      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        res.write(chunk);
      }
      res.end();
      return;
    }

    // ─── OpenAI ───────────────────────────────────────────────────────────────
    if (provider === 'openai') {
      const body = {
        model: resolvedModel,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
      };

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!upstream.ok) {
        const err = await upstream.json().catch(() => ({}));
        return res.status(upstream.status).json({ error: (err as any).error?.message || 'OpenAI API error' });
      }

      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value));
      }
      res.end();
      return;
    }

    return res.status(400).json({ error: `Provider ${provider} not yet supported for streaming` });
  } catch (err: any) {
    console.error('[iTango chat]', err);
    return res.status(500).json({ error: err.message || 'AI request failed' });
  }
});

// ─── GET /api/itango/files ────────────────────────────────────────────────────
router.get('/files', requireAuth, async (req: Request, res: Response) => {
  const { path = '' } = req.query as { path?: string };
  const user = (req.session as any).email || 'unknown';

  try {
    const data = await ghFetch(
      `/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`
    ) as any[];

    const items = Array.isArray(data)
      ? data
          .map((f: any) => ({
            name: f.name,
            path: f.path,
            type: f.type, // 'file' | 'dir'
            size: f.size,
            sha: f.sha,
          }))
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

// ─── GET /api/itango/file ─────────────────────────────────────────────────────
router.get('/file', requireAuth, async (req: Request, res: Response) => {
  const { path } = req.query as { path?: string };
  const user = (req.session as any).email || 'unknown';

  if (!path) return res.status(400).json({ error: 'path is required' });

  // Block reading sensitive files
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

// ─── POST /api/itango/commit ──────────────────────────────────────────────────
router.post('/commit', requireAuth, async (req: Request, res: Response) => {
  const { path, content, message = 'iTango AI: update file', sha } = req.body;
  const user = (req.session as any).email || 'unknown';

  if (!path || content === undefined) {
    return res.status(400).json({ error: 'path and content are required' });
  }

  // Safety: block critical file edits without explicit override
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

    await ghFetch(`/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    logActivity(user, 'FILE_COMMIT', `path=${path} msg="${message}"`, 'high');
    res.json({ success: true, message: `Committed ${path} to ${GH_BRANCH}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/itango/deploy ──────────────────────────────────────────────────
router.post('/deploy', requireAuth, async (req: Request, res: Response) => {
  const { target = 'preview' } = req.body;
  const user = (req.session as any).email || 'unknown';
  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID;

  if (!vercelToken || !vercelProjectId) {
    return res.status(400).json({
      error: 'VERCEL_TOKEN and VERCEL_PROJECT_ID are required. Add them in your .env file.',
    });
  }

  try {
    const deployRes = await fetch(
      `https://api.vercel.com/v13/deployments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: GH_REPO,
          gitSource: {
            type: 'github',
            repoId: process.env.VERCEL_GITHUB_REPO_ID || '',
            ref: GH_BRANCH,
          },
          target: target === 'production' ? 'production' : undefined,
        }),
      }
    );

    if (!deployRes.ok) {
      const err = await deployRes.json().catch(() => ({}));
      return res.status(deployRes.status).json({ error: (err as any).error?.message || 'Vercel API error' });
    }

    const deployment = await deployRes.json() as any;
    logActivity(user, 'DEPLOY', `target=${target} id=${deployment.id}`, 'high');
    res.json({
      success: true,
      deploymentId: deployment.id,
      url: deployment.url ? `https://${deployment.url}` : null,
      target,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/itango/activity ─────────────────────────────────────────────────
router.get('/activity', requireAuth, (_req: Request, res: Response) => {
  res.json({ log: activityLog.slice(0, 100) });
});

// ─── GET/POST /api/itango/settings ───────────────────────────────────────────
router.get('/settings', requireAuth, (_req: Request, res: Response) => {
  res.json({
    activeProvider,
    providers: {
      claude: { configured: !!aiKeyStore.claude, keyHint: aiKeyStore.claude ? `sk-ant-...${aiKeyStore.claude.slice(-6)}` : null },
      openai: { configured: !!aiKeyStore.openai, keyHint: aiKeyStore.openai ? `sk-...${aiKeyStore.openai.slice(-6)}` : null },
      gemini: { configured: !!aiKeyStore.gemini, keyHint: aiKeyStore.gemini ? `AIza...${aiKeyStore.gemini.slice(-6)}` : null },
    },
    github: {
      configured: !!process.env.GITHUB_TOKEN,
      repo: `${GH_OWNER}/${GH_REPO}`,
      branch: GH_BRANCH,
    },
    vercel: {
      configured: !!(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID),
    },
  });
});

router.post('/settings', requireAuth, (req: Request, res: Response) => {
  const { provider, apiKey, setActive } = req.body;
  const user = (req.session as any).email || 'unknown';

  if (provider && apiKey !== undefined) {
    if (!['claude', 'openai', 'gemini'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }
    aiKeyStore[provider] = apiKey;
    logActivity(user, 'API_KEY_UPDATE', `provider=${provider}`, 'medium');
  }

  if (setActive && ['claude', 'openai', 'gemini'].includes(setActive)) {
    activeProvider = setActive as typeof activeProvider;
    // Deactivate others (enforced at chat time by key check)
    logActivity(user, 'PROVIDER_SWITCH', `active=${setActive}`, 'low');
  }

  res.json({ success: true, activeProvider });
});

// ─── POST /api/itango/analyze ─────────────────────────────────────────────────
// Quick AI analysis of a file without full conversation context
router.post('/analyze', requireAuth, async (req: Request, res: Response) => {
  const { filePath, fileContent, analysisType = 'general' } = req.body;
  const user = (req.session as any).email || 'unknown';

  if (!fileContent) return res.status(400).json({ error: 'fileContent is required' });

  const apiKey = aiKeyStore.claude;
  if (!apiKey) return res.status(400).json({ error: 'Claude API key not configured' });

  const prompts: Record<string, string> = {
    general: `Analyze this file and provide: 1) What it does, 2) Potential bugs, 3) Performance improvements, 4) Security issues`,
    seo: `Analyze this file for SEO issues and opportunities. Focus on meta tags, structured data, page speed, content structure.`,
    security: `Security audit this file. Identify: XSS vulnerabilities, injection risks, auth bypass risks, exposed secrets.`,
    performance: `Performance review this file. Identify: unnecessary re-renders, large bundle imports, slow operations, memory leaks.`,
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: 'You are iTango AI, an expert code analyzer for the Mayobe Bros website. Be concise and actionable.',
        messages: [
          {
            role: 'user',
            content: `File: ${filePath}\n\n${prompts[analysisType] || prompts.general}\n\n\`\`\`\n${fileContent.slice(0, 8000)}\n\`\`\``,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: (err as any).error?.message || 'Analysis failed' });
    }

    const data = await response.json() as any;
    logActivity(user, 'FILE_ANALYZE', `path=${filePath} type=${analysisType}`, 'low');
    res.json({ analysis: data.content[0]?.text || '' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { logActivity };
export default router;
