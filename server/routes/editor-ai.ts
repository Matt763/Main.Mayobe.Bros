import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getApiKeys } from '../utils/api-keys.js';

const router = Router();

// ── AI PROVIDER HELPERS ──────────────────────────────────────────────────────

async function callClaude(prompt: string, systemPrompt: string, maxTokens = 4096): Promise<string> {
  const dbKeys = await getApiKeys();
  const apiKey = process.env.ANTHROPIC_API_KEY || dbKeys.claudeKey;
  if (!apiKey) throw new Error('No Anthropic API key configured. Add your Claude key in Settings → AI Keys.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
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

async function callOpenAI(prompt: string, systemPrompt: string, maxTokens = 4096, userApiKey?: string): Promise<string> {
  const dbKeys = await getApiKeys();
  const apiKey = userApiKey || process.env.OPENAI_API_KEY || dbKeys.openaiKey;
  if (!apiKey) throw new Error('No OpenAI API key configured. Add your OpenAI key in Settings → AI Keys.');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({})) as any;
    throw new Error(errBody?.error?.message || `OpenAI API error ${res.status}`);
  }
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content || '';
}

async function callAI(prompt: string, systemPrompt: string, maxTokens = 4096): Promise<string> {
  try {
    return await callClaude(prompt, systemPrompt, maxTokens);
  } catch {
    return await callOpenAI(prompt, systemPrompt, maxTokens);
  }
}

function extractJson(text: string): any {
  try { return JSON.parse(text.trim()); } catch {}
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1].trim()); } catch {} }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  throw new Error('Could not parse AI JSON response');
}

// ── SHARED SYSTEM PROMPTS ────────────────────────────────────────────────────

const ADSENSE_EEAT_SYSTEM = `You are an expert content writer for Mayobe Bros, an African news and lifestyle website (mayobebros.com). You create high-quality, in-depth content that meets Google AdSense approval requirements and Google's EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) standards for top search ranking.

GOOGLE ADSENSE POLICY COMPLIANCE (mandatory):
- Content must be original, valuable, and not copied or spun from other sources
- No adult, explicit, or sexually suggestive content
- No content promoting violence, hatred, or discrimination
- No deceptive, misleading, or clickbait headlines
- Content must have clear purpose and genuine informational value
- No content designed primarily to display ads with thin value
- No copyright-infringing material — always suggest original angles
- Content should be family-safe and suitable for general audiences
- Avoid excessive use of copyrighted names or brand trademarks
- No content about hacking, phishing, or harmful activities

EEAT STANDARDS (Experience, Expertise, Authoritativeness, Trustworthiness):
- EXPERIENCE: Include real-world examples, practical demonstrations, lived experience signals
- EXPERTISE: Show deep knowledge of the subject, accurate technical details, professional insights
- AUTHORITATIVENESS: Reference credible sources (WHO, UN, official institutions), use authoritative data
- TRUSTWORTHINESS: Balanced perspectives, acknowledge limitations, cite sources, honest about uncertainty
- Include "According to [source]", statistics with year and source, expert quotes where appropriate
- Writer bio signals: "As someone who [relevant experience]…"

SEO EXCELLENCE STANDARDS:
- Keyword density 1.0–2.0% for primary keyword (never keyword stuffing)
- Semantic keywords and LSI (Latent Semantic Indexing) variations throughout
- First paragraph must contain primary keyword naturally
- H2/H3 headings should contain keywords and questions people search for
- Include FAQ-style questions that match voice search patterns
- Content gap coverage: address all angles a reader would need
- Long-form: 4,000–5,000 words for comprehensive articles (Google ranks longer, more thorough content higher)`;

// ── PROOFREAD ────────────────────────────────────────────────────────────────

router.post('/proofread', async (req: Request, res: Response) => {
  try {
    const { content } = req.body as { content: string };
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 4000);

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

    const raw = await callAI(prompt, systemPrompt, 2000);
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
    const raw = await callAI(`${instruction}\n\n${text.substring(0, 2000)}`, systemPrompt, 1500);
    return res.json({ rewritten: raw.trim() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── AI WRITING ACTIONS ────────────────────────────────────────────────────────

router.post('/write', async (req: Request, res: Response) => {
  try {
    const { action, title, content, selectedText, tone, customPrompt } = req.body as {
      action: string; title?: string; content?: string; selectedText?: string; tone?: string; customPrompt?: string;
    };

    const toneNote = tone ? ` Write in a ${tone} tone.` : '';
    const systemPrompt = `${ADSENSE_EEAT_SYSTEM}${toneNote}`;

    let prompt = '';
    let maxTokens = 6000;

    switch (action) {
      case 'generate':
        prompt = `Write a comprehensive, in-depth, SEO-optimized blog article about: "${customPrompt || title}".

MANDATORY REQUIREMENTS:
- Target length: 4,000–5,000 words (this is critical for Google ranking and AdSense approval)
- Structure: Compelling introduction (250+ words) + 10–14 sections with H2 headings + at least 4 subsections with H3 headings + Strong conclusion with CTA
- Include: Statistics with sources (Year), real-world examples, expert perspectives, practical tips/steps
- AdSense compliance: Original insights, family-safe, no misleading claims, genuine value
- EEAT signals: Deep expertise, authoritative data, trustworthy balanced views
- SEO: Primary keyword in first 100 words, keyword variations, semantic terms, FAQ section near end
- Engagement hooks: Rhetorical questions, surprising statistics, relatable scenarios
- Formatting: Numbered lists, bullet points, callout boxes (use <div class="callout callout-info">, <div class="callout callout-tip"> etc.), bold key terms, blockquotes for expert quotes
- Internal linking opportunities: Where you reference related topics write [LINK: topic] as a placeholder
- Images: Suggest image placement with [IMAGE: description] comments in HTML

Return as clean, well-structured HTML using: <h2>, <h3>, <h4>, <p>, <ul>, <li>, <ol>, <blockquote>, <strong>, <em>, <figure class="chart-figure">, <div class="callout callout-info/tip/warning/success">, <table class="editor-table">, <div class="table-wrapper"> tags.`;
        maxTokens = 8000;
        break;

      case 'expand':
        prompt = `Expand this content significantly. Add more depth, real-world examples, statistics, expert perspectives, and practical implementation details. Target 3x the current length. Maintain the same topic and tone. Add EEAT signals (expertise, authority). Return as HTML:\n\n${selectedText || content || ''}`;
        maxTokens = 5000;
        break;

      case 'improve_clarity':
        prompt = `Improve this content for clarity, flow, and reader engagement. Use active voice, vary sentence length, add transitions, remove jargon, strengthen weak phrases. Keep the meaning and length similar. Return as HTML:\n\n${selectedText || content || ''}`;
        maxTokens = 4000;
        break;

      case 'suggest_headings':
        prompt = `Suggest 10 compelling H2 section headings for a comprehensive 4,000-5,000 word article titled: "${title}".
Requirements:
- Include primary keyword variations
- Mix informational, how-to, and question-based headings
- Some headings should match common Google search queries
- Include one FAQ heading and one Summary/Key Takeaways heading
Return ONLY this JSON: {"headings": ["Heading 1", "Heading 2", ...]}`;
        maxTokens = 1000;
        break;

      case 'fix_structure':
        prompt = `Restructure this content for a 4,000-5,000 word comprehensive article. Add proper H2/H3 hierarchy, introductory sentences for each section, transition sentences between sections, and a proper conclusion. Return as clean HTML:\n\n${(content || '').substring(0, 4000)}`;
        maxTokens = 6000;
        break;

      case 'write_intro':
        prompt = `Write a powerful, hook-driven introduction for an article titled: "${title}".

Requirements:
- Open with a surprising statistic, bold claim, or relatable scenario (NOT "In today's world...")
- 250–350 words
- Include primary keyword naturally within first 2 sentences
- Address reader's pain point or curiosity directly
- Preview what the article will cover (value proposition)
- End with a smooth transition into the first section
- EEAT signal: briefly establish authority/expertise

Return as HTML <p> tags only.`;
        maxTokens = 800;
        break;

      case 'write_conclusion':
        prompt = `Write a powerful conclusion for an article about "${title}".

Requirements:
- 200–300 words
- Summarize the 3–5 key takeaways concisely
- Reinforce the primary keyword naturally
- Include a strong, specific call-to-action (not generic "let us know in comments")
- End with a forward-looking statement or memorable closing line
- Add a "Key Takeaways" box using <div class="callout callout-success">

Return as HTML.`;
        maxTokens = 800;
        break;

      case 'summarize':
        prompt = `Create a concise but comprehensive summary of this content. Include: key points, main takeaways, and action items. Format as a styled "Article Summary" callout box followed by 2-3 paragraphs:\n\n${(content || '').replace(/<[^>]+>/g, ' ').substring(0, 4000)}`;
        maxTokens = 1500;
        break;

      case 'continue':
        prompt = `Continue writing this article naturally and seamlessly from where it ends. Add 500–800 words covering the next logical aspects of the topic. Maintain the same style, tone, and depth. Add EEAT signals, real examples, statistics. Return as HTML:\n\n${(content || '').substring(-3000)}`;
        maxTokens = 2500;
        break;

      case 'write_faq':
        prompt = `Write a comprehensive FAQ (Frequently Asked Questions) section for an article about "${title}".
Requirements:
- 8–10 questions that match real Google search queries
- Concise but complete answers (50–100 words each)
- Include the primary keyword in at least 3 questions
- Address common doubts, misconceptions, and practical questions
- Format: <h3>Question?</h3><p>Answer.</p> structure
Return as HTML.`;
        maxTokens = 2000;
        break;

      case 'seo_optimize':
        prompt = `Optimize this content for SEO while maintaining natural readability. Actions:
1. Add primary keyword "${title}" more naturally (aim for 1.5% density)
2. Add semantic/LSI keywords related to the topic
3. Strengthen H2/H3 headings with keyword variations
4. Add internal link opportunities marked as [LINK: anchor text | topic]
5. Improve meta-friendliness of the opening paragraph
6. Add schema-friendly FAQ structure if not present
Return the optimized HTML with changes applied:\n\n${(content || '').substring(0, 4000)}`;
        maxTokens = 5000;
        break;

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    const raw = await callAI(prompt, systemPrompt, maxTokens);

    if (action === 'suggest_headings') {
      try {
        return res.json(extractJson(raw));
      } catch {
        const lines = raw.split('\n').filter(l => l.trim()).map(l => l.replace(/^[-•*\d.]+\s*/, '').trim()).filter(Boolean);
        return res.json({ headings: lines.slice(0, 10) });
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

    const h2s = (content || '').match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
    const h3s = (content || '').match(/<h3[^>]*>(.*?)<\/h3>/gi) || [];
    const links = (content || '').match(/<a\s/gi) || [];
    const imgs = (content || '').match(/<img[^>]*>/gi) || [];

    const systemPrompt = `You are an expert SEO consultant and Google AdSense policy specialist. Return ONLY valid JSON.`;

    const prompt = `Perform a comprehensive SEO and AdSense readiness analysis. Return ONLY this JSON:
{
  "score": 72,
  "grade": "B",
  "adSenseReadiness": {
    "score": 65,
    "status": "needs_work",
    "issues": ["specific AdSense policy concern"],
    "strengths": ["what's good for AdSense"]
  },
  "primaryKeyword": "detected primary topic",
  "secondaryKeywords": ["kw1", "kw2", "kw3"],
  "suggestedKeywords": ["missing kw1", "missing kw2", "missing kw3", "missing kw4"],
  "lsiKeywords": ["semantic variant 1", "semantic variant 2"],
  "keywordDensity": 1.8,
  "readabilityScore": 68,
  "eatAnalysis": {
    "experience": "assessment of experience signals",
    "expertise": "assessment of expertise signals",
    "authority": "assessment of authority signals",
    "trust": "assessment of trust signals"
  },
  "recommendations": [
    { "priority": "high", "category": "title|meta|content|headings|links|readability|adsense|eeat", "issue": "specific issue", "fix": "actionable fix with example" }
  ],
  "metaSuggestions": {
    "title": "optimized meta title under 60 chars",
    "description": "compelling meta description 120-155 chars",
    "keywords": "keyword1, keyword2, keyword3"
  },
  "contentGaps": ["important topic angle not covered"],
  "competitorAngle": "what would make this outrank competing articles",
  "internalLinkOpportunities": ["anchor text ideas for internal linking"]
}

Article Title: ${title || 'Not set'}
Meta Title: ${metaTitle || 'Not set'}
Meta Description: ${metaDescription || 'Not set'}
Meta Keywords: ${metaKeywords || 'Not set'}
Word Count: ${wordCount}
Link Count: ${links.length}
Image Count: ${imgs.length}
H2 Headings: ${h2s.map(h => h.replace(/<[^>]+>/g, '')).join(' | ') || 'None'}
H3 Headings: ${h3s.map(h => h.replace(/<[^>]+>/g, '')).join(' | ') || 'None'}
Content excerpt: ${plainText.substring(0, 2000)}`;

    const raw = await callAI(prompt, systemPrompt, 3000);
    const parsed = extractJson(raw);
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── ADSENSE COMPLIANCE CHECK ──────────────────────────────────────────────────

router.post('/adsense-check', async (req: Request, res: Response) => {
  try {
    const { content, title } = req.body as { content: string; title: string };
    if (!content) return res.status(400).json({ error: 'Content required' });

    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    const systemPrompt = `You are a Google AdSense policy compliance expert. Evaluate content against Google's official AdSense policies. Return ONLY valid JSON.`;

    const prompt = `Evaluate this blog post for Google AdSense approval readiness based on official AdSense policies.

Check against these REAL AdSense policies:
1. Valuable Inventory policy: Content must be original, substantial, and genuinely useful
2. Adult content: No explicit sexual content
3. Dangerous & derogatory content: No hate speech, violence glorification
4. Copyrighted material: No reproducing copyrighted work without permission
5. Misleading content: No false claims, deceptive presentations
6. Thin content: Must have substantial original value (minimum 1,500 words ideally 4,000+)
7. Traffic sources: Content must be legitimate (this is analysis only)
8. Privacy violations: No doxxing or private information exposure
9. Shocking content: No gruesome or disturbing imagery/descriptions
10. Gambling/drugs: No content promoting illegal activities

Return ONLY this JSON:
{
  "overallScore": 78,
  "approvalLikelihood": "high|medium|low|very_low",
  "status": "ready|needs_improvement|not_ready",
  "verdict": "one sentence overall assessment",
  "wordCount": ${wordCount},
  "wordCountStatus": "excellent|good|below_target|too_short",
  "violations": [
    { "policy": "policy name", "severity": "critical|warning|info", "detail": "specific concern", "fix": "how to fix" }
  ],
  "strengths": ["what the content does well for AdSense"],
  "improvements": [
    { "priority": "high|medium|low", "area": "content_quality|length|originality|eeat|safety", "suggestion": "specific improvement" }
  ],
  "eatScore": {
    "experience": 70,
    "expertise": 65,
    "authority": 60,
    "trust": 75
  },
  "safetyFlags": {
    "adultContent": false,
    "violentContent": false,
    "hateSpeech": false,
    "misleadingClaims": false,
    "thinContent": ${wordCount < 1500}
  }
}

Title: ${title || 'Not set'}
Word Count: ${wordCount}
Content (first 3000 chars): ${text.substring(0, 3000)}`;

    const raw = await callAI(prompt, systemPrompt, 2000);
    const parsed = extractJson(raw);
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── IN-ARTICLE LINK SUGGESTIONS ───────────────────────────────────────────────

router.post('/internal-links', async (req: Request, res: Response) => {
  try {
    const { content, posts } = req.body as {
      content: string;
      posts: { id: string; title: string; slug: string; excerpt?: string; category?: string }[];
    };
    if (!content) return res.status(400).json({ error: 'Content required' });
    if (!posts || posts.length === 0) return res.status(400).json({ error: 'Posts list required' });

    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const systemPrompt = `You are an expert SEO specialist for an African news and lifestyle website. You analyze article content and identify optimal anchor text opportunities for internal linking. Return ONLY valid JSON.`;

    const postsJson = posts.slice(0, 60).map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt?.substring(0, 80) || '',
      category: p.category || '',
    }));

    const prompt = `Analyze this article and identify the BEST opportunities to add internal links to related posts.

Rules for link selection:
1. Find natural anchor text already in the article (existing words/phrases that could be linked)
2. Anchor text must be contextually relevant to the target post
3. Prefer specific noun phrases, named concepts, or topic keywords — not generic phrases like "click here"
4. Each suggestion should link to the MOST relevant post from the list
5. Identify 10-20 of the strongest linking opportunities — quality over quantity
6. Don't repeat the same anchor text more than twice
7. Prioritize high-relevance matches (topic overlap between anchor text and target post)
8. Include the exact surrounding sentence for context

ARTICLE CONTENT (plain text):
${plainText.substring(0, 4000)}

AVAILABLE POSTS TO LINK TO:
${JSON.stringify(postsJson)}

Return ONLY this JSON:
{
  "suggestions": [
    {
      "anchorText": "exact words from the article to hyperlink",
      "postId": "post id from list",
      "postTitle": "target post title",
      "postSlug": "target post slug",
      "relevanceScore": 95,
      "context": "...surrounding sentence with the anchor text...",
      "reason": "why this link is contextually relevant"
    }
  ],
  "totalFound": 15,
  "analysisNotes": "brief note on linking strategy for this article"
}`;

    const raw = await callAI(prompt, systemPrompt, 8000);
    const parsed = extractJson(raw);
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── HEADLINE GENERATOR ────────────────────────────────────────────────────────

router.post('/headlines', async (req: Request, res: Response) => {
  try {
    const { categories, labels, trends, count = 20 } = req.body as {
      categories: string[];
      labels: string[];
      trends?: string[];
      count?: number;
    };

    const systemPrompt = `You are an expert digital content strategist and SEO headline specialist for Mayobe Bros, an African news and lifestyle website. You create evergreen, SEO-optimized headlines that rank on Google and attract clicks. Return ONLY valid JSON.`;

    const trendContext = trends && trends.length > 0
      ? `\nCurrently trending Google search topics: ${trends.slice(0, 15).join(', ')}`
      : '';

    const prompt = `Generate ${Math.min(count, 30)} powerful, evergreen headline ideas for a news and lifestyle blog targeting African audiences.

Site categories: ${categories.join(', ')}
Site labels/tags: ${labels.join(', ')}${trendContext}

HEADLINE REQUIREMENTS:
1. EVERGREEN: Topics that stay relevant for 1–3+ years (not breaking news)
2. SEO OPTIMIZED: Include high-search-volume keywords, long-tail variations
3. CLICK-WORTHY: Use proven headline formulas: numbers, "How to", "Why", "What", listicles, surprising claims
4. SPECIFIC: Concrete specifics beat vague generalities (e.g., "7 Ways" not "Some Ways")
5. AFRICAN AUDIENCE: Relevant to African readers, local context where appropriate
6. ADSENSE SAFE: No clickbait, no misleading promises, no sensationalism
7. SEARCH INTENT: Match informational, navigational, or commercial intent

HEADLINE FORMULAS TO USE:
- "X [Time Period] Ways to [Achieve Desired Outcome]"
- "How to [Solve Problem] Without [Common Obstacle]"
- "The [Authority Source] Guide to [Topic]"
- "Why [Surprising Fact About Common Topic]"
- "X Signs You Should [Take Important Action]"
- "The Truth About [Common Misconception]"
- "[Number] [Category] Experts Share Their Top Tips on [Topic]"
- "What Nobody Tells You About [Important Topic]"

Return ONLY this JSON:
{
  "headlines": [
    {
      "title": "The headline text",
      "category": "which site category this fits",
      "searchIntent": "informational|commercial|navigational",
      "keywordFocus": "primary keyword this targets",
      "formula": "the headline formula used",
      "evergreen": true,
      "estimatedDifficulty": "low|medium|high",
      "whyItWorks": "brief reason this headline is strong"
    }
  ],
  "trendingAngles": ["trending topic angle you could write about"],
  "contentGaps": ["topic areas the site might be missing"]
}`;

    const raw = await callAI(prompt, systemPrompt, 4000);
    const parsed = extractJson(raw);
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GOOGLE TRENDS PROXY ───────────────────────────────────────────────────────

router.get('/trends', async (req: Request, res: Response) => {
  try {
    const geo = (req.query.geo as string) || 'KE'; // Kenya default for Africa focus
    const hl = (req.query.hl as string) || 'en-US';

    const url = `https://trends.google.com/trends/api/dailytrends?hl=${hl}&tz=-180&geo=${geo}&ns=15`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://trends.google.com/',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Google Trends fetch failed', trends: [] });
    }

    const text = await response.text();
    // Google Trends prepends )]}'\n to prevent JSON hijacking — strip it
    const jsonStr = text.replace(/^\)\]\}'\s*\n?/, '');
    const data = JSON.parse(jsonStr) as any;

    const days = data?.default?.trendingSearchesDays || [];
    const today = days[0];
    const trends: string[] = (today?.trendingSearches || [])
      .slice(0, 20)
      .map((item: any) => item?.title?.query || '')
      .filter(Boolean);

    return res.json({ trends, geo, date: today?.date || '' });
  } catch (err: any) {
    // Graceful degradation: return empty list instead of error
    return res.json({ trends: [], error: `Trends unavailable: ${err.message}` });
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

Text (first 4000 chars): ${text.substring(0, 4000)}`;

    const raw = await callAI(prompt, systemPrompt, 2000);
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

    const systemPrompt = `You are a professional content writer who creates detailed, AdSense-compliant article content from media descriptions.`;

    const prompt = `Create comprehensive article content based on this ${mediaType || 'media'} file.

File: "${fileName}"
${description ? `Description/Context: ${description}` : ''}

Write a detailed, 2,000-word article with:
1. An engaging introduction (use EEAT signals)
2. Key points covered (based on file name context)
3. Detailed sections with H2 headings and practical insights
4. Statistics or data points where relevant
5. A conclusion with CTA

Return as clean HTML with <h2>, <h3>, <p>, <ul>, <li>, <blockquote> tags.`;

    const raw = await callAI(prompt, systemPrompt, 3000);
    return res.json({ transcript: raw.trim() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── TONE ANALYSIS ─────────────────────────────────────────────────────────────

router.post('/tone', async (req: Request, res: Response) => {
  try {
    const { content } = req.body as { content: string };
    const text = (content || '').replace(/<[^>]+>/g, ' ').substring(0, 3000);

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

    const raw = await callAI(prompt, systemPrompt, 1000);
    const parsed = extractJson(raw);
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── SEO AUTO-GENERATE (all fields at once) ───────────────────────────────────

router.post('/seo-auto', async (req: Request, res: Response) => {
  try {
    const { title, content, apiProvider = 'claude', openaiKey } = req.body as {
      title: string; content: string; apiProvider?: string; openaiKey?: string;
    };
    if (!content && !title) return res.status(400).json({ error: 'Title or content required' });

    const plainText = (content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const h2s = (content || '').match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];

    const systemPrompt = `You are an expert SEO content strategist for an African news and lifestyle website (mayobebros.com). You write precise, compelling meta content optimized for Google search. Return ONLY valid JSON — no extra text, no markdown fences.`;

    const prompt = `Generate all SEO metadata for this article. Return ONLY this JSON object (no markdown, no explanation):
{
  "seoTitle": "Compelling SEO title 50-60 characters with primary keyword near start",
  "metaDescription": "Compelling meta description exactly 150-160 characters. Include primary keyword. End with a value proposition.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10"],
  "excerpt": "Compelling article excerpt 150-200 words that hooks the reader and summarizes the article value. Write in active voice."
}

Rules:
- seoTitle: 50-60 chars total, primary keyword within first 3 words
- metaDescription: EXACTLY 150-160 characters (count carefully)
- keywords: JSON array of 10-15 strings, mix of short-tail and long-tail, Africa/Kenya context where relevant
- excerpt: 150-200 words, hooks reader, ends with implied promise of value

Article Title: ${title || 'Not set'}
Word Count: ${wordCount}
H2 Headings: ${h2s.map(h => h.replace(/<[^>]+>/g, '')).slice(0, 8).join(' | ') || 'None'}
Content (first 3000 chars): ${plainText.substring(0, 3000)}`;

    let raw: string;
    if (apiProvider === 'openai') {
      raw = await callOpenAI(prompt, systemPrompt, 2000, openaiKey);
    } else {
      raw = await callClaude(prompt, systemPrompt, 2000);
    }
    const parsed = extractJson(raw);

    // Normalise keywords to always be an array
    if (typeof parsed.keywords === 'string') {
      parsed.keywords = parsed.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
    }

    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GEMINI IMAGE GENERATION ───────────────────────────────────────────────────

const IMAGE_STYLE_SUFFIX = [
  'hyper-realistic photograph',
  '8K UHD ultra-high resolution',
  'shot with Canon EOS R5, 85mm f/1.8 prime lens',
  'ultra-sharp focus on subject',
  'professional photography lighting',
  'no AI smoothing, no digital artifacts',
  'rich color grading, high dynamic range',
  'magazine-quality photo',
  '16:9 widescreen composition',
].join(', ');

// Model preference list — tried in order until one succeeds.
// gemini-3.1-flash-image-preview = "Nano Banana 2" (latest, per Google AI docs Apr 2026)
// gemini-2.5-flash-image = "Nano Banana" (stable fallback)
// gemini-2.0-flash-exp  = experimental fallback (supports IMAGE responseModality)
const IMAGE_MODELS = [
  'gemini-3.1-flash-image-preview',
  'gemini-2.5-flash-image',
  'gemini-2.0-flash-exp',
];

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Call one Gemini model for text-to-image. Returns the raw fetch response.
 * Auth via x-goog-api-key header (recommended) — also passes key as query
 * param as belt-and-suspenders for older model routing.
 */
async function callGeminiImageModel(
  model: string,
  parts: object[],
  apiKey: string,
  withImageConfig = true,
): Promise<{ imageBase64: string; mimeType: string }> {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;

  const generationConfig: Record<string, any> = {
    responseModalities: ['TEXT', 'IMAGE'],
  };
  if (withImageConfig) {
    generationConfig.imageConfig = { aspectRatio: '16:9' };
  }

  const body = {
    contents: [{ parts }],
    generationConfig,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({})) as any;
    const msg = errBody?.error?.message || `HTTP ${res.status}`;
    throw new Error(`[${model}] ${msg}`);
  }

  const data = await res.json() as any;
  const responseParts: any[] = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = responseParts.find(
    (p: any) => p.inlineData?.mimeType?.startsWith('image/'),
  );

  if (!imagePart) {
    // Surface any finish reason to help with debugging
    const finishReason = data?.candidates?.[0]?.finishReason || 'UNKNOWN';
    const safetyRatings = JSON.stringify(data?.candidates?.[0]?.safetyRatings || []);
    throw new Error(`[${model}] No image in response. finishReason=${finishReason} safety=${safetyRatings}`);
  }

  return {
    imageBase64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || 'image/png',
  };
}

/**
 * Try each model in IMAGE_MODELS until one succeeds.
 * Collects errors so we can surface a useful message if all fail.
 * On first success, returns immediately.
 */
async function geminiGenerateImage(
  textParts: object[],
  apiKey: string,
  withImageConfig = true,
): Promise<{ imageBase64: string; mimeType: string; modelUsed: string }> {
  const errors: string[] = [];

  for (const model of IMAGE_MODELS) {
    try {
      const result = await callGeminiImageModel(model, textParts, apiKey, withImageConfig);
      return { ...result, modelUsed: model };
    } catch (err: any) {
      errors.push(err.message);
    }
  }

  throw new Error(
    `All Gemini image models failed:\n${errors.join('\n')}\n\nCheck: (1) API key is valid, (2) Gemini API is enabled in your Google Cloud project at aistudio.google.com`,
  );
}

// ── TEXT-TO-IMAGE ─────────────────────────────────────────────────────────────

router.post('/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, geminiApiKey } = req.body as { prompt: string; geminiApiKey?: string };
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });

    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'Gemini API key required. Click the key icon in the Image Generator panel to add it.' });

    const fullPrompt = `${prompt.trim()}, ${IMAGE_STYLE_SUFFIX}`;
    const { imageBase64, mimeType, modelUsed } = await geminiGenerateImage(
      [{ text: fullPrompt }],
      apiKey,
    );

    return res.json({ imageBase64, mimeType, prompt: fullPrompt, modelUsed });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── IMAGE TRANSFORM ───────────────────────────────────────────────────────────

router.post('/transform-image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, imageUrl, instructions, geminiApiKey } = req.body as {
      imageBase64?: string;
      imageUrl?: string;
      instructions?: string;
      geminiApiKey?: string;
    };
    if (!imageBase64 && !imageUrl) return res.status(400).json({ error: 'Image source required (imageBase64 or imageUrl)' });

    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'Gemini API key required.' });

    // Resolve image to base64
    let imgData = imageBase64;
    let imgMime = 'image/jpeg';

    if (imageUrl && !imageBase64) {
      const fetchRes = await fetch(imageUrl);
      if (!fetchRes.ok) throw new Error(`Could not fetch image from URL: ${fetchRes.status}`);
      imgMime = (fetchRes.headers.get('content-type') || 'image/jpeg').split(';')[0];
      imgData = Buffer.from(await fetchRes.arrayBuffer()).toString('base64');
    }

    const transformInstruction = instructions
      ? `Transform this image: ${instructions}. Also apply: ${IMAGE_STYLE_SUFFIX}, 16:9 aspect ratio.`
      : `Enhance this image: ${IMAGE_STYLE_SUFFIX}, 16:9 aspect ratio, professional photo editing.`;

    // For image editing, text instruction first, then image — as per Google docs example
    const { imageBase64: outBase64, mimeType: outMime, modelUsed } = await geminiGenerateImage(
      [
        { text: transformInstruction },
        { inlineData: { mimeType: imgMime, data: imgData } },
      ],
      apiKey,
      false, // imageConfig not supported for image-editing calls
    );

    return res.json({ imageBase64: outBase64, mimeType: outMime, modelUsed });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── BULK H2 IMAGE GENERATION ──────────────────────────────────────────────────

router.post('/bulk-images', async (req: Request, res: Response) => {
  try {
    const { headings, articleTitle, geminiApiKey } = req.body as {
      headings: string[];
      articleTitle?: string;
      geminiApiKey?: string;
    };
    if (!headings?.length) return res.status(400).json({ error: 'Headings array required' });

    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'Gemini API key required.' });

    const results: { heading: string; imageBase64: string; mimeType: string; prompt: string; modelUsed: string }[] = [];

    for (const heading of headings.slice(0, 12)) {
      try {
        const imagePrompt = [
          `Editorial photograph for article section: "${heading}"`,
          articleTitle ? `Article: "${articleTitle}"` : '',
          'Professional news/lifestyle magazine photo, African context where relevant',
          IMAGE_STYLE_SUFFIX,
        ].filter(Boolean).join('. ');

        const { imageBase64, mimeType, modelUsed } = await geminiGenerateImage(
          [{ text: imagePrompt }],
          apiKey,
        );
        results.push({ heading, imageBase64, mimeType, prompt: imagePrompt, modelUsed });
      } catch {
        // Skip failed heading, continue with the rest
      }

      // Rate limit: ~1 req/sec for free tier
      await new Promise(r => setTimeout(r, 1000));
    }

    return res.json({ images: results, generated: results.length, total: headings.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── AI VOICEOVER (OpenAI TTS) ─────────────────────────────────────────────────
// Returns base64-encoded MP3 audio.

router.post('/voiceover', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'nova', speed = 1.0 } = req.body as {
      text: string;
      voice?: string;
      speed?: number;
    };

    if (!text?.trim()) return res.status(400).json({ error: 'text is required' });
    if (text.length > 4096) return res.status(400).json({ error: 'Text exceeds 4 096-character limit. Use a shorter excerpt.' });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'OpenAI API key not configured on the server.' });

    const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.trim(),
        voice,
        speed: Math.min(Math.max(speed, 0.25), 4.0),
        response_format: 'mp3',
      }),
    });

    if (!ttsRes.ok) {
      const errBody = await ttsRes.json().catch(() => ({})) as any;
      throw new Error(errBody?.error?.message || `OpenAI TTS error ${ttsRes.status}`);
    }

    const buffer = Buffer.from(await ttsRes.arrayBuffer());
    return res.json({ audioBase64: buffer.toString('base64'), mimeType: 'audio/mpeg' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── SUBTITLE GENERATION (Claude → VTT cues) ───────────────────────────────────
// Splits article text into timed VTT cues based on reading speed.

router.post('/subtitles', async (req: Request, res: Response) => {
  try {
    const { content, title, wpm = 150, lang = 'en' } = req.body as {
      content: string; title?: string; wpm?: number; lang?: string;
    };

    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plainText.length < 50) return res.status(400).json({ error: 'Content is too short.' });

    const prompt = `You are a subtitle generator. Convert the following article into a WebVTT subtitle file.

Rules:
1. Break text into natural spoken chunks of 8-12 words each.
2. Calculate timestamps based on ${wpm} words per minute speaking speed.
3. Each cue starts exactly where the previous one ended.
4. Output ONLY a JSON array of cue objects — no other text.
5. Language for the subtitles: ${lang}

Format each cue as:
{"index": 1, "start": "00:00:00.000", "end": "00:00:03.200", "text": "the subtitle text here"}

Title: ${title || ''}
Article:
${plainText.slice(0, 6000)}`;

    const raw = await callClaude(prompt, 'You are a precise subtitle generator. Output only valid JSON arrays.', 4096);

    // Extract JSON array from Claude response
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Failed to parse subtitle response.');
    const cues = JSON.parse(jsonMatch[0]);

    return res.json({ cues, count: cues.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GOOGLE DISCOVER SCORE (Claude analysis) ───────────────────────────────────

router.post('/discover-score', async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body as { title: string; content: string };
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });

    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const hasImages = /<img/i.test(content);
    const h2Count   = (content.match(/<h2/gi) || []).length;

    const prompt = `You are a Google Discover SEO expert. Evaluate this article for Google Discover eligibility and rank potential.

Title: "${title}"
Word count: ${wordCount}
Has images: ${hasImages}
H2 headings: ${h2Count}
Content (first 3000 chars):
${plainText.slice(0, 3000)}

Evaluate these 8 criteria and assign an overall score 0-100 plus letter grade (A/B/C/D/F).

Criteria to assess:
1. Headline Appeal — Is the title curiosity-driven, specific, and click-worthy?
2. Image Quality — Does the article include images? (minimum 1200×628px recommended)
3. Content Depth — Is the content comprehensive and expert-level (1500+ words ideal)?
4. E-E-A-T Signals — Does content show experience, expertise, authority, trustworthiness?
5. Freshness — Is the topic timely and relevant to current events/trends?
6. Engagement Potential — Would this trigger strong emotional response or sharing?
7. Topic Breadth — Does it cover a topic people genuinely want to explore?
8. Mobile Readability — Short paragraphs, scannable headings, good structure?

Return ONLY valid JSON:
{
  "score": 72,
  "grade": "B",
  "verdict": "one-sentence overall assessment",
  "criteria": [
    {"name": "Headline Appeal", "pass": true, "note": "brief specific note"},
    ...all 8 criteria...
  ],
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["actionable improvement 1", "actionable improvement 2", "actionable improvement 3"]
}`;

    const raw = await callClaude(prompt, 'You are a Google Discover SEO expert. Output only valid JSON.', 2048);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse analysis response.');
    const result = JSON.parse(jsonMatch[0]);

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── SHORTS SCRIPT GENERATOR (Claude) ─────────────────────────────────────────

router.post('/shorts-script', async (req: Request, res: Response) => {
  try {
    const { title, content, format = '30s', platform = 'reels' } = req.body as {
      title: string; content: string; format?: string; platform?: string;
    };

    if (!title || !content) return res.status(400).json({ error: 'title and content required' });

    const maxWords: Record<string, number> = { '15s': 38, '30s': 75, '60s': 150 };
    const words = maxWords[format] || 75;
    const platformNames: Record<string, string> = {
      reels: 'Instagram Reels', tiktok: 'TikTok', shorts: 'YouTube Shorts',
    };

    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);

    const prompt = `You are a viral social media content writer. Create a ${format} ${platformNames[platform] || platform} script from this article.

Article title: "${title}"
Article summary: ${plainText.slice(0, 1200)}

Requirements:
- Hook: one powerful opening line (max 10 words) that stops the scroll
- Script: engaging narration, exactly ${words} words (spoken naturally aloud)
- Hashtags: 8-10 relevant hashtags including niche + broad tags
- Duration: "${format} script"
- Style: conversational, energetic, perfect for ${platformNames[platform] || platform}

Return ONLY valid JSON:
{
  "hook": "The single hook line here",
  "script": "Full ${words}-word narration script…",
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "duration": "${format}",
  "platforms": ["${platform}"]
}`;

    const raw = await callClaude(prompt, 'You are a viral social media content creator. Output only valid JSON.', 1024);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse script response.');
    const result = JSON.parse(jsonMatch[0]);

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── TEXT-TO-SPEECH (server-side fallback for browsers without Web Speech API) ─
router.post('/tts', requireAuth, async (req: Request, res: Response) => {
  try {
    const { text, voice = 'alloy' } = req.body as { text: string; voice?: string };
    if (!text) return res.status(400).json({ error: 'text is required' });

    const dbKeys = await getApiKeys();
    const apiKey = process.env.OPENAI_API_KEY || dbKeys.openaiKey;
    if (!apiKey) {
      return res.status(503).json({ error: 'No OpenAI API key configured. Add your OpenAI key in Settings → AI Keys.' });
    }

    // Truncate to 4096 chars (OpenAI TTS limit)
    const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 4096);

    const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: plain,
        voice,
        response_format: 'mp3',
      }),
    });

    if (!ttsRes.ok) {
      const err = await ttsRes.json().catch(() => ({})) as any;
      return res.status(ttsRes.status).json({ error: err?.error?.message || `TTS error ${ttsRes.status}` });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const arrayBuffer = await ttsRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
