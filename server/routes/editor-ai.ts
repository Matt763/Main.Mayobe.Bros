import { Router, Request, Response } from 'express';

const router = Router();

// ── AI PROVIDER HELPERS ──────────────────────────────────────────────────────

async function callClaude(prompt: string, systemPrompt: string, maxTokens = 2048): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('No Anthropic API key configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err.error?.message || `Claude API error ${res.status}`);
  }

  const data = await res.json() as any;
  return data.content?.[0]?.text || '';
}

async function callOpenAI(prompt: string, systemPrompt: string, maxTokens = 2048): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('No OpenAI API key configured');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error ${res.status}`);
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content || '';
}

async function callAI(prompt: string, systemPrompt: string, maxTokens = 2048): Promise<string> {
  try {
    return await callClaude(prompt, systemPrompt, maxTokens);
  } catch {
    return await callOpenAI(prompt, systemPrompt, maxTokens);
  }
}

function extractJson(text: string): any {
  // Try raw parse first
  try { return JSON.parse(text.trim()); } catch {}
  // Try code fence
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1].trim()); } catch {} }
  // Try first { ... } block
  const match = text.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  throw new Error('Could not parse AI JSON response');
}

// ── PROOFREAD ────────────────────────────────────────────────────────────────

router.post('/proofread', async (req: Request, res: Response) => {
  try {
    const { content } = req.body as { content: string };
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 3000);

    const systemPrompt = `You are an expert writing editor. Analyze text and return ONLY valid JSON with no extra text.`;

    const prompt = `Analyze this text for grammar, style, tone, and readability. Return ONLY this JSON structure:
{
  "tone": "formal|casual|professional|friendly|neutral|academic",
  "toneConfidence": 85,
  "readabilityScore": 72,
  "readabilityGrade": "8th grade",
  "overallScore": 78,
  "issues": [
    {
      "id": "g1",
      "type": "grammar|spelling|style|readability|passive|filler",
      "severity": "error|warning|info",
      "original": "exact phrase from text",
      "suggestion": "corrected version",
      "explanation": "brief reason"
    }
  ],
  "strengths": ["what the writing does well"],
  "topSuggestions": ["most important improvement to make"],
  "stats": {
    "passiveVoiceCount": 2,
    "longSentenceCount": 3,
    "fillerWordCount": 5,
    "complexWordCount": 8
  }
}

Text: ${text}`;

    const raw = await callAI(prompt, systemPrompt, 2048);
    const parsed = extractJson(raw);
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── MULTI-REWRITE (Wordtune style) ───────────────────────────────────────────

router.post('/multi-rewrite', async (req: Request, res: Response) => {
  try {
    const { text } = req.body as { text: string };
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const systemPrompt = `You are an expert writing assistant. Return ONLY valid JSON with no extra text.`;

    const prompt = `Rewrite this text in 5 different ways. Return ONLY this JSON:
{
  "rewrites": [
    { "label": "Shorter", "icon": "compress", "text": "...", "description": "More concise" },
    { "label": "More Detail", "icon": "expand", "text": "...", "description": "Richer explanation" },
    { "label": "Formal", "icon": "briefcase", "text": "...", "description": "Professional tone" },
    { "label": "Casual", "icon": "message", "text": "...", "description": "Conversational feel" },
    { "label": "Impactful", "icon": "zap", "text": "...", "description": "Stronger phrasing" }
  ]
}

Original: ${text.substring(0, 1000)}`;

    const raw = await callAI(prompt, systemPrompt, 1500);
    const parsed = extractJson(raw);
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── QUICK REWRITE (single mode) ───────────────────────────────────────────────

router.post('/rewrite', async (req: Request, res: Response) => {
  try {
    const { text, mode } = req.body as { text: string; mode: string };
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const modeInstructions: Record<string, string> = {
      shorter:  'Rewrite this to be significantly shorter while keeping the key meaning.',
      longer:   'Expand this with more detail, examples, and explanation.',
      formal:   'Rewrite this in a formal, professional tone.',
      casual:   'Rewrite this in a casual, conversational tone.',
      fix:      'Fix all grammar and spelling errors. Keep meaning exactly the same.',
      improve:  'Improve this for clarity, flow, and impact without changing the core meaning.',
      simpler:  'Rewrite using simpler language and shorter sentences for easier reading.',
      creative: 'Rewrite with more vivid, creative, engaging language.',
    };

    const instruction = modeInstructions[mode] || 'Improve this text.';
    const systemPrompt = `You are a professional writing assistant. Return ONLY the rewritten text. No preamble, no labels, no quotation marks.`;
    const raw = await callAI(`${instruction}\n\n${text.substring(0, 2000)}`, systemPrompt, 1000);
    return res.json({ rewritten: raw.trim() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── AI WRITING ACTIONS ────────────────────────────────────────────────────────

router.post('/write', async (req: Request, res: Response) => {
  try {
    const { action, title, content, selectedText, tone } = req.body as {
      action: string; title?: string; content?: string; selectedText?: string; tone?: string;
    };

    const toneNote = tone ? ` Write in a ${tone} tone.` : '';
    const systemPrompt = `You are an expert content writer for Mayobe Bros, an African news and lifestyle website. Write engaging, SEO-friendly, factually accurate content.${toneNote}`;

    let prompt = '';
    switch (action) {
      case 'generate':
        prompt = `Write a comprehensive, well-structured blog article about: "${title}".\n\nRequirements:\n- Engaging introduction\n- 5-7 sections with H2 headings\n- Practical examples and details\n- Strong conclusion with a call-to-action\n- 800-1200 words\n\nReturn the content as clean HTML using <h2>, <h3>, <p>, <ul>, <li> tags only.`;
        break;
      case 'expand':
        prompt = `Expand this section with more detail, context, examples, and statistics. Make it 3x longer. Return as HTML:\n\n${selectedText || content || ''}`;
        break;
      case 'improve_clarity':
        prompt = `Improve the clarity, flow, and readability of this text. Use active voice, shorter sentences, and clearer phrasing. Return as HTML:\n\n${selectedText || content || ''}`;
        break;
      case 'suggest_headings':
        prompt = `Suggest 6-8 compelling H2 section headings for an article titled: "${title}".\nReturn ONLY this JSON: {"headings": ["Heading 1", "Heading 2", ...]}`;
        break;
      case 'fix_structure':
        prompt = `Reorganize this content for better logical flow. Add appropriate H2/H3 headings. Return as clean HTML:\n\n${(content || '').substring(0, 3000)}`;
        break;
      case 'write_intro':
        prompt = `Write a compelling, hook-driven introduction paragraph for an article titled: "${title}". The intro should grab attention immediately and set up the article's value. Return as HTML <p> tag.`;
        break;
      case 'write_conclusion':
        prompt = `Write a strong, memorable conclusion for an article about "${title}". Include a brief summary and call-to-action. Return as HTML.`;
        break;
      case 'summarize':
        prompt = `Summarize this content in 2-3 concise paragraphs capturing the key points:\n\n${(content || '').replace(/<[^>]+>/g, ' ').substring(0, 3000)}`;
        break;
      case 'continue':
        prompt = `Continue writing this article naturally from where it ends. Add 2-3 more paragraphs that flow seamlessly. Return as HTML:\n\n${(content || '').substring(0, 2000)}`;
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    const raw = await callAI(prompt, systemPrompt, 2500);

    if (action === 'suggest_headings') {
      try {
        return res.json(extractJson(raw));
      } catch {
        const lines = raw.split('\n').filter(l => l.trim()).map(l => l.replace(/^[-•*\d.]+\s*/, '').trim());
        return res.json({ headings: lines.slice(0, 8) });
      }
    }

    return res.json({ result: raw.trim() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── SEO ANALYSIS ──────────────────────────────────────────────────────────────

router.post('/seo', async (req: Request, res: Response) => {
  try {
    const { title, content, metaTitle, metaDescription, metaKeywords } = req.body as Record<string, string>;

    const plainText = (content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;

    // Extract headings from HTML
    const h2s = (content || '').match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
    const h3s = (content || '').match(/<h3[^>]*>(.*?)<\/h3>/gi) || [];

    const systemPrompt = `You are an expert SEO consultant. Return ONLY valid JSON.`;

    const prompt = `Perform a deep SEO analysis and return ONLY this JSON:
{
  "score": 72,
  "grade": "B",
  "primaryKeyword": "detected primary topic",
  "secondaryKeywords": ["kw1", "kw2", "kw3"],
  "suggestedKeywords": ["missing kw1", "missing kw2", "missing kw3", "missing kw4"],
  "keywordDensity": 1.8,
  "recommendations": [
    { "priority": "high", "category": "title|meta|content|headings|links|readability", "issue": "specific issue", "fix": "actionable fix" }
  ],
  "metaSuggestions": {
    "title": "optimized meta title under 60 chars",
    "description": "compelling meta description 120-155 chars",
    "keywords": "keyword1, keyword2, keyword3"
  },
  "contentGaps": ["topic angle not covered"],
  "competitorAngle": "what would make this stand out vs similar articles"
}

Article Title: ${title || 'Not set'}
Meta Title: ${metaTitle || 'Not set'}
Meta Description: ${metaDescription || 'Not set'}
Meta Keywords: ${metaKeywords || 'Not set'}
Word Count: ${wordCount}
H2 Headings: ${h2s.map(h => h.replace(/<[^>]+>/g, '')).join(' | ') || 'None'}
H3 Headings: ${h3s.map(h => h.replace(/<[^>]+>/g, '')).join(' | ') || 'None'}
Content excerpt: ${plainText.substring(0, 1500)}`;

    const raw = await callAI(prompt, systemPrompt, 2000);
    const parsed = extractJson(raw);
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── PLAGIARISM CHECK ──────────────────────────────────────────────────────────

router.post('/plagiarism', async (req: Request, res: Response) => {
  try {
    const { content } = req.body as { content: string };
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const systemPrompt = `You are a plagiarism and originality analysis system. Return ONLY valid JSON.`;

    const prompt = `Analyze this text for originality and content freshness. Look for:
- Generic, templated phrases common across the web
- Wikipedia-style encyclopedic writing
- Overused clichés
- Lack of unique voice or original insights
- Common filler that adds no value

Return ONLY this JSON:
{
  "originalityScore": 85,
  "status": "highly_original|original|mixed|generic",
  "verdict": "one sentence verdict",
  "genericPhrases": [
    { "phrase": "exact phrase", "concern": "why it seems unoriginal" }
  ],
  "originalElements": ["unique angles or phrases detected"],
  "improvements": [
    { "section": "intro|body|conclusion|general", "suggestion": "how to make it more original" }
  ],
  "uniquenessReport": {
    "hasUniqueAngle": true,
    "hasPersonalVoice": true,
    "hasOriginalExamples": false,
    "hasDataOrStats": false
  }
}

Text (first 3000 chars): ${text.substring(0, 3000)}`;

    const raw = await callAI(prompt, systemPrompt, 1500);
    const parsed = extractJson(raw);
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── MEDIA TRANSCRIPT ─────────────────────────────────────────────────────────

router.post('/transcribe', async (req: Request, res: Response) => {
  try {
    const { fileName, description, mediaType } = req.body as {
      fileName: string; description?: string; mediaType?: string;
    };

    if (!fileName) return res.status(400).json({ error: 'File name required' });

    const systemPrompt = `You are a professional content writer who creates detailed article content from media descriptions.`;

    const prompt = `Create comprehensive article content based on this ${mediaType || 'media'} file.

File: "${fileName}"
${description ? `Description/Context: ${description}` : ''}

Write a detailed article with:
1. An engaging introduction
2. Key points or topics covered (based on file name context)
3. Detailed sections with H2 headings
4. A conclusion

Return as clean HTML with <h2>, <p>, <ul>, <li> tags.`;

    const raw = await callAI(prompt, systemPrompt, 2000);
    return res.json({ transcript: raw.trim() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── TONE ANALYSIS ─────────────────────────────────────────────────────────────

router.post('/tone', async (req: Request, res: Response) => {
  try {
    const { content } = req.body as { content: string };
    const text = (content || '').replace(/<[^>]+>/g, ' ').substring(0, 2000);

    const systemPrompt = `You are a writing tone analyzer. Return ONLY valid JSON.`;
    const prompt = `Analyze the tone of this writing sample. Return ONLY this JSON:
{
  "primaryTone": "professional|casual|formal|friendly|authoritative|conversational|academic|persuasive|informative|neutral",
  "toneBreakdown": {
    "professional": 40,
    "casual": 20,
    "authoritative": 30,
    "friendly": 10
  },
  "sentiment": "positive|neutral|negative",
  "sentimentScore": 65,
  "audience": "general public|professionals|academics|beginners|experts",
  "readingLevel": "elementary|middle school|high school|college|graduate",
  "suggestions": ["tone improvement suggestion 1", "tone improvement suggestion 2"]
}

Text: ${text}`;

    const raw = await callAI(prompt, systemPrompt, 800);
    const parsed = extractJson(raw);
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
