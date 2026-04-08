import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-OpenAI-Key",
};

type Action =
  | "generate_article"
  | "generate_intro"
  | "generate_headings"
  | "generate_conclusion"
  | "improve_readability"
  | "rewrite_professional"
  | "rewrite_simple"
  | "rewrite_engaging"
  | "generate_summary"
  | "suggest_tags"
  | "seo_analysis"
  | "generate_social"
  | "generate_headlines"
  | "image_prompt"
  | "translate"
  | "generate_excerpt"
  | "discover_topics"
  | "generate_outline"
  | "suggest_keywords"
  | "generate_draft"
  | "suggest_internal_links"
  | "generate_seo_meta"
  | "generate_full_draft"
  | "editorial_review"
  | "editorial_readability"
  | "editorial_seo"
  | "editorial_headline"
  | "editorial_engagement"
  | "editorial_checklist"
  | "editorial_suggestions"
  | "generate_full_post"
  | "generate_seo_title"
  | "generate_meta_description"
  | "generate_keywords"
  | "detect_ai_content"
  | "humanize_content"
  | "eeat_analysis"
  | "spam_check"
  | "quality_score"
  | "eeat_enhance"
  | "generate_evergreen_headline";

interface RequestBody {
  action: Action;
  title?: string;
  content?: string;
  excerpt?: string;
  selectedText?: string;
  language?: string;
  topic?: string;
  category?: string;
  outline?: string;
  existingPosts?: string[];
  keywords?: string[];
  metaDescription?: string;
  metaKeywords?: string;
  featuredImage?: string;
}

function buildSystemPrompt(): string {
  return `You are a senior editorial board member, SEO specialist, and content strategist for Mayobe Bros, a respected East African blog covering education, business, technology, gaming, lifestyle, and news. You specialize in creating content that fully meets Google's EEAT standards (Experience, Expertise, Authoritativeness, Trustworthiness) and strictly complies with all Google AdSense monetization policies. Your content is original, deeply valuable, well-structured, factually accurate, and optimized for both human readers and top search engine rankings. You never produce thin content, keyword-stuffed copy, misleading claims, or anything that violates AdSense prohibited content policies (no adult content, no gambling, no hacking/cracking, no deceptive advertising, no dangerous content).`;
}

function buildUserPrompt(action: Action, body: RequestBody): string {
  const { title, content, excerpt, selectedText, language, topic, category, outline, existingPosts, keywords, metaDescription, metaKeywords, featuredImage } = body;
  const subject = topic || title || "the given topic";
  const articleText = content ? content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 4000) : '';

  switch (action) {
    case "editorial_review":
      return `You are a senior editorial board member reviewing this article for publication readiness.

Title: "${title}"
Content: ${articleText}
Excerpt: "${excerpt || 'not provided'}"
Meta Description: "${metaDescription || 'not provided'}"

Evaluate across ALL 6 dimensions and return ONLY valid JSON (no markdown):
{
  "overallScore": <0-100>,
  "verdict": "<Publish Ready|Needs Minor Edits|Needs Major Revision|Not Ready>",
  "summary": "<2-3 sentence executive summary of article quality>",
  "dimensions": {
    "clarity": { "score": <0-100>, "label": "Content Clarity", "feedback": "<specific 1-2 sentence feedback>" },
    "structure": { "score": <0-100>, "label": "Structure & Headings", "feedback": "<specific 1-2 sentence feedback>" },
    "readability": { "score": <0-100>, "label": "Readability", "feedback": "<specific 1-2 sentence feedback>" },
    "engagement": { "score": <0-100>, "label": "Engagement Potential", "feedback": "<specific 1-2 sentence feedback>" },
    "seo": { "score": <0-100>, "label": "SEO Optimization", "feedback": "<specific 1-2 sentence feedback>" },
    "originality": { "score": <0-100>, "label": "Originality & Value", "feedback": "<specific 1-2 sentence feedback>" }
  },
  "topStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "criticalIssues": ["<issue 1 if any>", "<issue 2 if any>"],
  "quickWins": ["<quick improvement 1>", "<quick improvement 2>", "<quick improvement 3>"]
}`;

    case "editorial_readability":
      return `Perform a deep readability analysis of this article.

Title: "${title}"
Content: ${articleText}

Return ONLY valid JSON (no markdown):
{
  "readabilityScore": <0-100>,
  "gradeLevel": "<e.g. Grade 8, University level, General Audience>",
  "averageSentenceLength": <estimated number>,
  "complexityRating": "<Simple|Moderate|Complex|Very Complex>",
  "strengths": ["<readability strength 1>", "<strength 2>"],
  "issues": [
    { "type": "<issue type>", "description": "<what the problem is>", "example": "<quote a specific sentence if possible>", "fix": "<how to fix it>" }
  ],
  "suggestions": ["<actionable suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "passiveVoiceEstimate": "<Low|Moderate|High>",
  "jargonLevel": "<None|Minimal|Moderate|Heavy>"
}`;

    case "editorial_seo":
      return `Perform a comprehensive SEO analysis of this article.

Title: "${title}"
Content: ${articleText}
Meta Description: "${metaDescription || 'not provided'}"
Meta Keywords: "${metaKeywords || 'not provided'}"
Excerpt: "${excerpt || 'not provided'}"

Return ONLY valid JSON (no markdown):
{
  "seoScore": <0-100>,
  "keywordDensity": "<Low|Optimal|High|Overstuffed>",
  "titleOptimization": { "score": <0-100>, "feedback": "<specific feedback on title SEO>" },
  "metaOptimization": { "score": <0-100>, "feedback": "<specific feedback on meta description>" },
  "headingStructure": { "score": <0-100>, "feedback": "<feedback on H1/H2/H3 usage>" },
  "contentDepth": { "score": <0-100>, "feedback": "<feedback on content depth and authority>" },
  "internalLinking": { "score": <0-100>, "feedback": "<feedback on internal linking opportunities>" },
  "improvements": [
    { "priority": "<High|Medium|Low>", "action": "<specific SEO action to take>", "impact": "<expected impact>" }
  ],
  "targetKeywords": ["<suggested primary keyword>", "<secondary keyword>", "<long-tail keyword>"]
}`;

    case "editorial_headline":
      return `Analyze the headline effectiveness of this article title.

Title: "${title}"
Content preview: ${articleText.slice(0, 500)}

Return ONLY valid JSON (no markdown):
{
  "headlineScore": <0-100>,
  "rating": "<Excellent|Good|Average|Weak|Poor>",
  "emotionalImpact": "<High|Medium|Low>",
  "clarity": "<Clear|Somewhat Clear|Unclear>",
  "seoFriendly": <true|false>,
  "clickworthiness": "<High|Medium|Low>",
  "analysis": "<2-3 sentence analysis of the headline>",
  "weaknesses": ["<weakness 1 if any>", "<weakness 2 if any>"],
  "alternatives": [
    { "headline": "<alternative headline 1>", "type": "<How-to|Numbered|Question|Curiosity|Benefit>", "reason": "<why this is better>" },
    { "headline": "<alternative headline 2>", "type": "<type>", "reason": "<reason>" },
    { "headline": "<alternative headline 3>", "type": "<type>", "reason": "<reason>" },
    { "headline": "<alternative headline 4>", "type": "<type>", "reason": "<reason>" },
    { "headline": "<alternative headline 5>", "type": "<type>", "reason": "<reason>" }
  ]
}`;

    case "editorial_engagement":
      return `Predict and analyze the reader engagement potential of this article.

Title: "${title}"
Content: ${articleText}
Excerpt: "${excerpt || 'not provided'}"

Return ONLY valid JSON (no markdown):
{
  "engagementScore": <0-100>,
  "estimatedBounceRisk": "<Low|Medium|High>",
  "hookStrength": { "score": <0-100>, "feedback": "<analysis of the opening/introduction>" },
  "storyFlow": { "score": <0-100>, "feedback": "<analysis of narrative flow and transitions>" },
  "contentClarity": { "score": <0-100>, "feedback": "<how clear and easy to follow is the content>" },
  "valueProposition": { "score": <0-100>, "feedback": "<does the article clearly deliver value to readers>" },
  "callToAction": { "present": <true|false>, "strength": "<Strong|Moderate|Weak|Missing>", "feedback": "<feedback on the CTA>" },
  "engagementTips": [
    { "section": "<where in the article>", "issue": "<what the engagement problem is>", "fix": "<how to improve it>" }
  ],
  "predictedTimeOnPage": "<estimated engagement duration, e.g. 2-3 min>",
  "audienceMatch": "<how well the content matches the blog's target audience>"
}`;

    case "editorial_checklist":
      return `Generate a comprehensive pre-publish checklist for this article.

Title: "${title}"
Has content: ${articleText.length > 100 ? 'Yes' : 'No - content is too short'}
Has excerpt: ${excerpt ? 'Yes' : 'No'}
Has meta description: ${metaDescription ? 'Yes' : 'No'}
Has meta keywords: ${metaKeywords ? 'Yes' : 'No'}
Has featured image: ${featuredImage ? 'Yes' : 'No'}
Content length (words): approximately ${Math.round(articleText.split(/\s+/).length)}

Content preview: ${articleText.slice(0, 1000)}

Return ONLY valid JSON (no markdown):
{
  "readyToPublish": <true|false>,
  "completionPercentage": <0-100>,
  "items": [
    { "category": "<Content|SEO|Media|Technical>", "item": "<checklist item description>", "status": "<pass|fail|warning>", "detail": "<specific detail or suggestion>", "priority": "<Required|Recommended|Optional>" }
  ],
  "blockers": ["<any critical issue that must be fixed before publishing>"],
  "warnings": ["<non-critical warnings>"]
}`;

    case "editorial_suggestions":
      return `Provide detailed, actionable improvement suggestions for this article.

Title: "${title}"
Content: ${articleText}
Excerpt: "${excerpt || 'not provided'}"

Return ONLY valid JSON (no markdown):
{
  "prioritySuggestions": [
    { "priority": "High", "category": "<Writing|Structure|SEO|Engagement|Formatting>", "issue": "<what is wrong>", "suggestion": "<exactly what to do>", "example": "<example of the improvement if applicable>" }
  ],
  "moderateSuggestions": [
    { "priority": "Medium", "category": "<category>", "issue": "<issue>", "suggestion": "<suggestion>", "example": "<example>" }
  ],
  "polishSuggestions": [
    { "priority": "Low", "category": "<category>", "issue": "<issue>", "suggestion": "<suggestion>" }
  ],
  "rewriteSuggestion": "<if the intro or any section should be rewritten, provide specific rewritten text here>",
  "estimatedImprovementScore": <how many points the overall score could improve if suggestions are implemented>
}`;

    case "generate_article":
      return `Write a comprehensive, well-structured blog article about: "${subject}".
Structure it with:
- A compelling introduction (2-3 sentences)
- 3-5 main sections with <h2> headings
- Supporting paragraphs under each heading
- A strong conclusion with a call to action
Format in clean HTML using <h2>, <h3>, <p>, <ul>, <li> tags only. Do not include <html>, <body>, or <head> tags.`;

    case "generate_intro":
      return `Write a compelling introduction paragraph for a blog article titled "${subject}".
The introduction should hook the reader, state the problem or opportunity, and preview what they will learn.
Return only the introduction as a single <p> tag.`;

    case "generate_headings":
      return `Generate 5-7 section headings for a blog article titled "${subject}".
Each heading should be specific, descriptive, and SEO-friendly.
Return as an HTML unordered list: <ul><li>Heading 1</li>...</ul>`;

    case "generate_conclusion":
      return `Write a strong conclusion for a blog article titled "${subject}".
${content ? `The article covers: ${content.slice(0, 600)}` : ""}
Include a summary of key points and a call to action.
Return as one or two <p> tags.`;

    case "improve_readability":
      return `Improve the readability of the following content. Make sentences clearer, vary sentence length, use active voice, and improve flow. Keep the same meaning.
Content: ${(selectedText || content || "").slice(0, 3000)}
Return the improved version in clean HTML.`;

    case "rewrite_professional":
      return `Rewrite the following content in a polished, professional tone suitable for a business audience.
Content: ${(selectedText || content || "").slice(0, 3000)}
Return the rewritten version in clean HTML.`;

    case "rewrite_simple":
      return `Simplify the following content so it can be understood by a general audience. Use plain language, short sentences, and avoid jargon.
Content: ${(selectedText || content || "").slice(0, 3000)}
Return the simplified version in clean HTML.`;

    case "rewrite_engaging":
      return `Rewrite the following content to be more engaging, vivid, and compelling. Add energy, use storytelling techniques, and make it impossible to stop reading.
Content: ${(selectedText || content || "").slice(0, 3000)}
Return the engaging version in clean HTML.`;

    case "generate_summary":
      return `Write a concise summary (2-3 sentences, max 160 characters) of the following article for use as a meta description and excerpt.
Title: "${subject}"
${content ? `Content: ${content.slice(0, 2000)}` : ""}
Return only the summary as plain text, no HTML tags.`;

    case "generate_excerpt":
      return `Write an enticing article excerpt (2-4 sentences) for the following article that makes readers want to read more.
Title: "${subject}"
${content ? `Content intro: ${content.slice(0, 1000)}` : ""}
Return only the excerpt as plain text.`;

    case "suggest_tags":
      return `Suggest 8-12 relevant SEO tags and keywords for an article titled "${subject}".
${content ? `Content snippet: ${content.slice(0, 500)}` : ""}
Return ONLY a valid JSON array of strings, no other text. Example: ["tag1","tag2","tag3"]`;

    case "seo_analysis":
      return `Analyze the SEO quality of the following article and return a JSON object.
Title: "${title}"
Content: ${(content || "").slice(0, 3000)}
Return ONLY valid JSON (no markdown) in this exact format:
{
  "score": <number 0-100>,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "metaDescription": "<suggested meta description under 160 chars>",
  "improvedTitle": "<SEO-optimized version of the title>"
}`;

    case "generate_social":
      return `Generate social media posts for an article titled "${subject}".
${excerpt ? `Excerpt: ${excerpt}` : ""}
Return ONLY valid JSON (no markdown) in this exact format:
{
  "facebook": "<engaging Facebook post 1-3 sentences with emoji>",
  "twitter": "<punchy Twitter post under 280 chars with hashtags>",
  "linkedin": "<professional LinkedIn post 2-4 sentences>"
}`;

    case "generate_headlines":
      return `Generate 8 powerful, click-worthy article headlines for the topic: "${subject}".
Include a mix of: how-to headlines, numbered lists, question-based, curiosity-gap, and benefit-driven headlines.
Return ONLY a valid JSON array of strings. Example: ["Headline 1","Headline 2"]`;

    case "image_prompt":
      return `Generate 3 descriptive image generation prompts for a featured image for an article titled "${subject}".
Each prompt should describe a specific visual scene that would work as a compelling blog header image.
Return ONLY a valid JSON array of 3 strings. Example: ["Prompt 1","Prompt 2","Prompt 3"]`;

    case "translate":
      return `Translate the following content into ${language || "Spanish"}.
${title ? `Title: "${title}"` : ""}
Content: ${(selectedText || content || "").slice(0, 4000)}
Return the translation in clean HTML, preserving the structure. Translate all text including headings.`;

    case "discover_topics": {
      const cat = category ? ` in the "${category}" category` : "";
      return `You are a content strategist for Mayobe Bros, a blog covering education, business, technology, gaming, lifestyle, and news topics relevant to an East African audience.

Generate 8 high-traffic article topic ideas${cat} that have strong organic search potential.

For each topic return a JSON object. Return ONLY a valid JSON array with this exact structure (no markdown):
[
  {
    "title": "<specific, compelling article title>",
    "angle": "<unique angle or hook that differentiates this article>",
    "interestLevel": "<High|Medium|Trending>",
    "estimatedSearchVolume": "<Low|Medium|High|Very High>",
    "difficulty": "<Easy|Moderate|Competitive>",
    "primaryKeyword": "<main keyword to target>",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
    "category": "<category name>",
    "whyItWorks": "<1 sentence explaining why this topic will drive traffic>"
  }
]`;
    }

    case "generate_outline":
      return `Generate a detailed, structured article outline for: "${subject}".
${category ? `Category: ${category}` : ""}
${keywords && keywords.length > 0 ? `Target keywords: ${keywords.join(", ")}` : ""}

Return ONLY valid JSON (no markdown) in this exact format:
{
  "title": "<optimized article title>",
  "introduction": "<2-3 sentence description of what the introduction will cover>",
  "sections": [
    {
      "heading": "<h2 section heading>",
      "description": "<what this section will cover>",
      "subsections": ["<subsection topic 1>", "<subsection topic 2>"]
    }
  ],
  "conclusion": "<description of conclusion and call to action>",
  "estimatedWordCount": <number>,
  "readingTime": "<X min read>"
}`;

    case "suggest_keywords":
      return `Perform keyword research for an article about: "${subject}".
${category ? `Category: ${category}` : ""}

Return ONLY valid JSON (no markdown) in this exact format:
{
  "primary": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "secondary": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>", "<keyword5>"],
  "longTail": ["<phrase 1>", "<phrase 2>", "<phrase 3>", "<phrase 4>"],
  "questions": ["<question people search 1>", "<question 2>", "<question 3>"],
  "lsiKeywords": ["<semantically related term 1>", "<term 2>", "<term 3>"]
}`;

    case "generate_draft":
      return `Write a comprehensive, SEO-optimized blog article based on this outline:
Title: "${subject}"
${outline ? `Outline: ${outline}` : ""}
${keywords && keywords.length > 0 ? `Target keywords to naturally include: ${keywords.join(", ")}` : ""}

Requirements:
- Engaging introduction that hooks the reader
- Well-structured sections following the outline
- Each section should be 150-250 words
- Include target keywords naturally (do not stuff)
- Strong conclusion with a call to action
- Total length: 800-1200 words

Format in clean HTML using only <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags. Do not include <html>, <body>, or <head> tags.`;

    case "generate_full_draft":
      return `Write a comprehensive, SEO-optimized blog article about: "${subject}".
${category ? `Category: ${category}` : ""}
${keywords && keywords.length > 0 ? `Target keywords to naturally include: ${keywords.join(", ")}` : ""}

Requirements:
- Compelling introduction that hooks the reader immediately
- 4-6 well-developed sections with descriptive <h2> headings
- Each section 200-300 words with supporting details, examples, or data
- Include target keywords naturally throughout
- Subheadings (<h3>) where appropriate
- Strong conclusion with a clear call to action
- Total: 1000-1500 words

Format in clean HTML using only <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags. Do not include <html>, <body>, or <head> tags.`;

    case "generate_full_post":
      return `Write a complete, publication-ready long-form blog article about: "${subject}".

WORD COUNT REQUIREMENT: 4,000 to 5,000 words minimum. This is a HARD REQUIREMENT — do not stop early.

STRUCTURE REQUIREMENTS:
- Start with a # H1 title on the very first line
- Compelling 3-4 sentence introduction that hooks the reader and states the value of this article
- 8-12 main sections with ## H2 headings (each section 350-500 words)
- Use ### H3 subheadings and #### H4 for deeper breakdown within each section
- Mix of paragraphs, bullet points, numbered lists, and bold callouts for scannability
- Real-world examples, case studies, statistics, and expert-level insights in every section
- A thorough FAQ section at the end (minimum 5 questions with detailed answers)
- A strong conclusion (200+ words) with clear, actionable takeaways and a call to action

GOOGLE ADSENSE COMPLIANCE (MANDATORY):
- No adult, sexual, or suggestive content whatsoever
- No gambling, casino, or sports betting content
- No hacking, cracking, piracy, or enabling illegal activity
- No dangerous, derogatory, or hateful content about any group
- No misleading health or medical claims without disclaimers
- No deceptive advertising language ("You have been selected", "Click to win")
- No keyword stuffing — keywords must appear naturally
- Original content with unique insights — no scraped or auto-generated filler
- Content must be made for human readers, not search engines alone

EEAT SIGNALS (MANDATORY for Google quality):
- Experience: Include first-hand perspective, practical usage scenarios
- Expertise: Demonstrate deep subject knowledge with specific facts, data, and technical details
- Authoritativeness: Reference industry standards, well-known sources (e.g. "According to research...", "Studies show...")
- Trustworthiness: Balanced perspective, honest caveats, no exaggerated claims

SEO REQUIREMENTS:
- Naturally include primary and secondary keywords throughout — never stuffed
- Every H2 should contain a keyword or search phrase
- Include synonyms and LSI (Latent Semantic Indexing) terms naturally
- Write compelling, click-worthy meta-friendly language in the introduction

Format in Markdown only:
- # for H1 (first line only)
- ## for H2 section headings
- ### for H3 subheadings
- #### for H4 sub-subheadings
- **bold** for emphasis and key terms
- - or * for bullet points
- 1. for numbered lists
- > for important callout quotes`;

    case "generate_seo_title":
      return `Generate a single SEO-optimized title for a blog article about: "${subject}".
Requirements:
- Exactly 50–60 characters
- Include the primary keyword naturally
- Engaging and click-worthy but NOT misleading or clickbait
- Google-friendly (no ALL CAPS, no excessive punctuation)
- AdSense policy compliant
Return ONLY the title as plain text. No quotes, no explanation.`;

    case "generate_meta_description":
      return `Write a single SEO meta description for a blog article titled: "${subject}".
${content ? `Content summary: ${content.slice(0, 800)}` : ""}
Requirements:
- Exactly 150–160 characters
- Include the primary keyword naturally in the first half
- Compelling call-to-action that encourages clicks
- No misleading claims, AdSense policy compliant
Return ONLY the meta description as plain text. No quotes, no explanation.`;

    case "generate_keywords":
      return `Generate SEO keywords for a blog article titled: "${subject}".
${content ? `Content context: ${content.slice(0, 600)}` : ""}
Requirements:
- 8–15 total keywords
- Mix of: 1 primary keyword, 3-5 secondary keywords, 3-5 long-tail phrases
- All relevant to the topic and realistic search queries
- No keyword stuffing terms
Return ONLY a valid JSON array of strings. Example: ["keyword1","keyword phrase 2","long tail keyword 3"]`;

    case "suggest_internal_links":
      return `Analyze this article and recommend internal link opportunities. You must suggest anchor texts that ACTUALLY EXIST as phrases or words in the article content below.

New article topic: "${subject}"
${content ? `Full article content:\n${content.slice(0, 6000)}` : ""}

Existing published posts to link to:
${(existingPosts || []).slice(0, 50).map((p, i) => `${i + 1}. ${p}`).join("\n")}

CRITICAL RULES:
1. The "anchorText" you suggest MUST be a word or phrase that literally appears in the article content above — copy it exactly as it appears
2. Suggest minimum 40 internal link opportunities
3. Each link must be contextually relevant — a reader clicking it should find what they expect
4. Distribute links throughout the article (beginning, middle, end sections)
5. Do NOT suggest the same anchor text twice
6. Prefer specific, descriptive anchor text over generic phrases

Return ONLY valid JSON (no markdown):
{
  "recommendations": [
    {
      "postTitle": "<exact title of existing post to link to>",
      "reason": "<why this link adds value to the reader>",
      "anchorText": "<EXACT word or phrase from the article content above>",
      "placement": "<which paragraph or section of the article to place this link>"
    }
  ],
  "summary": "<2 sentence overview of the linking strategy>"
}`;

    case "generate_seo_meta":
      return `Generate complete SEO metadata for an article about: "${subject}".
${category ? `Category: ${category}` : ""}
${keywords && keywords.length > 0 ? `Target keywords: ${keywords.join(", ")}` : ""}
${outline ? `Outline summary: ${outline.slice(0, 500)}` : ""}

Return ONLY valid JSON (no markdown):
{
  "metaTitle": "<SEO-optimized title under 60 characters>",
  "metaDescription": "<compelling meta description 150-160 characters with primary keyword>",
  "slug": "<url-friendly-slug-with-hyphens>",
  "focusKeyword": "<single primary keyword>",
  "secondaryKeywords": ["<kw1>", "<kw2>", "<kw3>"],
  "ogTitle": "<Open Graph title for social sharing>",
  "ogDescription": "<Open Graph description 2-3 sentences>",
  "structuredDataType": "<Article|HowTo|FAQ|Review>",
  "contentScore": <estimated SEO content score 1-100>
}`;

    case "detect_ai_content":
      return `You are an expert AI content detector and editorial quality analyst. Analyze the following article for signs of AI-generated content, spam patterns, and quality issues.

Title: "${title}"
Content: ${articleText}

Return ONLY valid JSON (no markdown):
{
  "aiProbability": <0-100 percentage likelihood content is AI-generated>,
  "humanScore": <0-100 how human-like the writing is>,
  "verdict": "<Likely Human|Possibly AI|Likely AI|Almost Certainly AI>",
  "spamScore": <0-100 spam likelihood>,
  "keywordStuffing": <true|false>,
  "repetitivePatterns": <true|false>,
  "roboticPhrases": ["<example phrase 1 if found>", "<example phrase 2 if found>"],
  "qualityFlags": [
    { "type": "<AI Pattern|Spam|Keyword Stuffing|Repetition|Generic Writing|Thin Content>", "severity": "<High|Medium|Low>", "description": "<what was found>", "location": "<where in the article>" }
  ],
  "readabilityScore": <0-100>,
  "overallAssessment": "<2-3 sentence honest assessment of content quality>",
  "recommendHumanization": <true|false>,
  "priorityFixes": ["<most important fix 1>", "<fix 2>", "<fix 3>"]
}`;

    case "humanize_content":
      return `You are a professional human editor. Rewrite the following article to sound completely natural, authentic, and human-written while preserving all the original information and meaning.

Title: "${title}"
Content: ${articleText.slice(0, 4000)}

Humanization rules:
- Use varied, natural sentence structures (mix short punchy sentences with longer detailed ones)
- Replace generic AI phrases like "In conclusion", "It is worth noting", "Furthermore", "Moreover" with natural transitions
- Add personality, conversational touches, and a genuine voice
- Use active voice predominantly
- Include natural imperfections in phrasing that humans use
- Vary paragraph length (some 1-2 sentences, some 3-4 sentences)
- Use specific, concrete language instead of vague generalities
- Remove repetitive sentence starters
- Make the introduction hook readers immediately with a compelling opening
- Ensure the article flows like something a knowledgeable person would naturally write

Return the humanized article in clean HTML using only <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags. Preserve all section headings. Do not include <html>, <body>, or <head> tags.`;

    case "eeat_analysis":
      return `Analyze this article against Google's EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) standards.

Title: "${title}"
Content: ${articleText}
Author: "${body.excerpt || 'Not specified'}"

Return ONLY valid JSON (no markdown):
{
  "eeatScore": <0-100 overall EEAT score>,
  "dimensions": {
    "experience": { "score": <0-100>, "label": "Experience", "feedback": "<does the content demonstrate real-world experience with the topic?>", "signals": ["<signal found>"] },
    "expertise": { "score": <0-100>, "label": "Expertise", "feedback": "<does the content show deep subject matter expertise?>", "signals": ["<signal found>"] },
    "authoritativeness": { "score": <0-100>, "label": "Authoritativeness", "feedback": "<does the content cite sources, data, or expert opinions?>", "signals": ["<signal found>"] },
    "trustworthiness": { "score": <0-100>, "label": "Trustworthiness", "feedback": "<is the content accurate, balanced, and free of misleading claims?>", "signals": ["<signal found>"] }
  },
  "missingSignals": ["<EEAT signal that is absent>"],
  "improvements": [
    { "dimension": "<Experience|Expertise|Authoritativeness|Trustworthiness>", "action": "<specific thing to add or change>", "example": "<example of how to implement it>" }
  ],
  "verdict": "<Strong EEAT|Moderate EEAT|Weak EEAT|Poor EEAT>",
  "summary": "<2-3 sentence assessment of EEAT strength>"
}`;

    case "spam_check":
      return `Perform a Google AdSense policy compliance and spam check on this article.

Title: "${title}"
Content: ${articleText}

Check for violations of Google AdSense policies and spam patterns. Return ONLY valid JSON (no markdown):
{
  "complianceScore": <0-100 AdSense compliance score>,
  "spamScore": <0-100 spam likelihood>,
  "verdict": "<Compliant|Minor Issues|Moderate Issues|Policy Violation Risk>",
  "violations": [
    { "type": "<Keyword Stuffing|Thin Content|Misleading Content|Adult Content|Copyright Risk|Scraped Content|Auto-Generated Spam|Hidden Text|Deceptive Formatting>", "severity": "<Critical|High|Medium|Low>", "description": "<what was found>", "fix": "<how to fix it>" }
  ],
  "keywordDensityIssues": <true|false>,
  "contentUniqueness": "<High|Medium|Low|Suspect>",
  "readabilityForHumans": "<Excellent|Good|Fair|Poor>",
  "adsenseSafe": <true|false>,
  "recommendations": ["<specific recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "summary": "<2-3 sentence compliance assessment>"
}`;

    case "quality_score":
      return `You are a senior content quality analyst. Assign a comprehensive quality score to this article evaluating it across multiple dimensions relevant to Google AdSense approval and Google Search quality guidelines.

Title: "${title}"
Content: ${articleText}
Excerpt: "${excerpt || 'not provided'}"
Has featured image: ${body.featuredImage ? 'Yes' : 'No'}
Word count: approximately ${Math.round(articleText.split(/\s+/).length)} words

Return ONLY valid JSON (no markdown):
{
  "overallScore": <0-100>,
  "grade": "<A|B|C|D|F>",
  "verdict": "<Publication Ready|Needs Polish|Needs Work|Major Revision Required|Not Ready>",
  "dimensions": {
    "depth": { "score": <0-100>, "label": "Content Depth", "feedback": "<is the content thorough and comprehensive?>" },
    "readability": { "score": <0-100>, "label": "Readability", "feedback": "<how easy is it to read?>" },
    "originality": { "score": <0-100>, "label": "Originality", "feedback": "<does this provide unique value?>" },
    "structure": { "score": <0-100>, "label": "Structure", "feedback": "<is the article well-organized?>" },
    "eeat": { "score": <0-100>, "label": "EEAT Signals", "feedback": "<does it show experience, expertise, authority, trust?>" },
    "adsenseCompliance": { "score": <0-100>, "label": "AdSense Compliance", "feedback": "<is it policy-compliant?>" }
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "mustFix": ["<critical issue that must be fixed>"],
  "shouldFix": ["<recommended improvement>"],
  "estimatedRankingPotential": "<High|Medium|Low>",
  "summary": "<2-3 sentence overall quality assessment>"
}`;

    case "eeat_enhance":
      return `You are a senior editor specializing in EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) optimization. Enhance the following article to significantly improve its EEAT signals for Google Search quality guidelines.

Title: "${title}"
Content: ${articleText.slice(0, 4000)}

Enhancement requirements:
- Add specific, concrete examples that demonstrate real-world experience
- Include expert-level insights, statistics, or data points (you can note where real sources should be cited)
- Strengthen the introduction to establish authority on the topic
- Add a section or paragraph that demonstrates practical application
- Improve factual precision - replace vague claims with specific statements
- Add relevant context that shows deep topical understanding
- Ensure the conclusion provides genuine value and actionable takeaways
- Make the content clearly demonstrate that it was written by someone with genuine knowledge

Return the enhanced article in clean HTML using only <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags. Do not include <html>, <body>, or <head> tags.`;

    case "generate_evergreen_headline":
      return `You are a content strategist for Mayobe Bros, a popular East African blog. Generate 8 evergreen headline ideas based on the site's categories and labels.

Site categories: ${(existingPosts || []).join(', ') || 'Education, Business, Technology, Gaming, Lifestyle, News'}
Site labels/topics: ${(keywords || []).join(', ') || 'various topics'}
${category ? `Focus on this category: ${category}` : ''}

EVERGREEN HEADLINE RULES:
1. Topics must be relevant for years, not tied to current events or trends
2. High organic search volume — people consistently search for these topics
3. Fully AdSense-compliant (no gambling, adult, illegal, misleading topics)
4. Strong EEAT potential — topics where you can demonstrate real expertise
5. Click-worthy without being clickbait — promise specific value
6. Include power words: Ultimate, Complete, Proven, Essential, Best, How to, Why, Guide

HEADLINE TYPES TO MIX:
- How-To Guides ("How to Start a Business in Kenya with No Capital")
- Numbered Listicles ("15 Proven Ways to Earn Money Online in Africa")
- Ultimate Guides ("The Complete Guide to Solar Energy for African Homes")
- Question-Based ("Why Do African Startups Fail in the First Year?")
- Comparison ("YouTube vs TikTok: Which Earns More for African Creators?")
- Problem-Solution ("Struggling with Slow Internet? 10 Fixes That Work")

Return ONLY a valid JSON array (no markdown):
[
  {
    "headline": "<compelling, specific, evergreen article title>",
    "category": "<which site category this fits>",
    "label": "<most relevant label/topic>",
    "type": "<How-To|Listicle|Ultimate Guide|Question|Comparison|Problem-Solution>",
    "primaryKeyword": "<main SEO search keyword>",
    "searchVolume": "<High|Very High|Medium>",
    "whyEvergreen": "<one sentence: why this stays relevant for years>",
    "trendsQuery": "<short search phrase to look up on Google Trends>",
    "estimatedWordCount": <target word count 4000-5000>
  }
]`;

    default:
      return `Help with: ${subject}`;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const openaiKey = req.headers.get("X-OpenAI-Key");
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key is required. Please configure your key in the AI Assistant settings." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    const { action } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(action, body);

    const maxTokens =
      action === "generate_full_post" ? 8000 :
      ["generate_draft", "generate_full_draft", "generate_article", "humanize_content", "eeat_enhance"].includes(action) ? 4000 : 2000;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (!openaiRes.ok) {
      const errData = await openaiRes.json().catch(() => ({}));
      const msg = (errData as any)?.error?.message || `OpenAI API error (${openaiRes.status})`;
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiData = await openaiRes.json();
    const result = openaiData.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
