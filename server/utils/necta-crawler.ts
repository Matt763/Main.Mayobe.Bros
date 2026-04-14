import * as cheerio from 'cheerio';
import axios from 'axios';
import type { CrawlEvent, CrawlResult, DivCount, School, Student, StructuredData } from '../types/results.js';

const NECTA_ORIGIN = 'https://onlinesys.necta.go.tz';
const SITE_ORIGIN  = 'https://www.mayobebros.com';
const BATCH_SIZE  = 20;  // parallel fetches per batch
const BATCH_DELAY = 0;   // ms between batches

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchHtml(url: string): Promise<string> {
  const { data } = await axios.get(url, {
    timeout: 8_000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MayobeBros/1.0)' },
    responseType: 'text',
  });
  return data as string;
}

function extractSchoolLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.match(/results\/[PS]\d+\.htm/i)) {
      const absolute = new URL(href, baseUrl).href;
      links.push(absolute);
    }
  });
  return [...new Set(links)];
}

function parseDivRow(cells: cheerio.Cheerio<any>, $: cheerio.CheerioAPI, offset = 1): DivCount {
  const n = (i: number) => parseInt($(cells[offset + i])?.text?.() ?? '') || 0;
  const div1 = n(0); const div2 = n(1); const div3 = n(2); const div4 = n(3); const div0 = n(4);
  const total = div1 + div2 + div3 + div4 + div0;
  return { div1, div2, div3, div4, div0, total };
}

function parseSchoolPage(html: string, centerNumber: string): School {
  const $ = cheerio.load(html);

  // School name from page title or first heading
  const rawTitle = $('title').text() || $('h1,h2,h3').first().text() || centerNumber;
  const school_name = rawTitle.replace(/results|enquir[iy]es?|necta|\d{4}/gi, '').trim() || centerNumber;

  // Summary table — first table: div counts by sex (rows: M, F, T)
  const zeroRow = (): DivCount => ({ div1: 0, div2: 0, div3: 0, div4: 0, div0: 0, total: 0 });
  let male = zeroRow(), female = zeroRow(), totalRow = zeroRow();
  const summaryTable = $('table').first();
  summaryTable.find('tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 6) return;
    const label = $(cells[0]).text().trim().toUpperCase();
    if (label === 'M' || label === 'MALE' || label === 'BOYS') {
      male = parseDivRow(cells, $);
    } else if (label === 'F' || label === 'FEM' || label === 'FEMALE' || label === 'GIRLS') {
      female = parseDivRow(cells, $);
    } else if (label === 'T' || label === 'TOTAL') {
      totalRow = parseDivRow(cells, $);
    } else if (cells.length >= 6) {
      // Fallback: add all rows to total
      const r = parseDivRow(cells, $);
      totalRow.div1 += r.div1; totalRow.div2 += r.div2; totalRow.div3 += r.div3;
      totalRow.div4 += r.div4; totalRow.div0 += r.div0; totalRow.total += r.total;
    }
  });
  // If totals were computed by label, compute them from M+F if missing
  if (totalRow.total === 0 && (male.total > 0 || female.total > 0)) {
    totalRow = {
      div1: male.div1 + female.div1, div2: male.div2 + female.div2,
      div3: male.div3 + female.div3, div4: male.div4 + female.div4,
      div0: male.div0 + female.div0,
      total: male.total + female.total,
    };
  }
  const summary = {
    div1: totalRow.div1, div2: totalRow.div2, div3: totalRow.div3,
    div4: totalRow.div4, div0: totalRow.div0,
    male, female, total: totalRow,
  };

  // Student results table — second table
  const students: Student[] = [];
  const resultTable = $('table').eq(1);

  // Detect column indices from headers
  const headerRow = resultTable.find('tr').first();
  const headers = headerRow.find('th, td')
    .map((_, el) => $(el).text().trim().toUpperCase())
    .get();

  const cnoIdx    = headers.findIndex(h => h.includes('CNO'));
  const sexIdx    = headers.findIndex(h => h === 'SEX' || h.includes('SEX'));
  const aggtIdx   = headers.findIndex(h => h.includes('AGGT') || h.includes('AGG') || h.includes('PREM'));
  const divIdx    = headers.findIndex(h => h === 'DIV' || h.includes('DIV'));
  const subjStart = Math.max(cnoIdx, sexIdx, aggtIdx, divIdx) + 1;

  resultTable.find('tr').slice(1).each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 4) return;

    const get = (idx: number) => idx >= 0 ? $(cells[idx]).text().trim() : '';
    const cno = get(cnoIdx !== -1 ? cnoIdx : 0);
    if (!cno || cno === 'ABS' || cno.toLowerCase() === 'absent') return;

    const rawAggt = get(aggtIdx !== -1 ? aggtIdx : 1);
    const aggregate = parseInt(rawAggt) || null;
    const sex       = get(sexIdx !== -1 ? sexIdx : 2);
    const division  = get(divIdx !== -1 ? divIdx : 3);

    // Subjects: join remaining cells
    const subjectParts: string[] = [];
    cells.each((i, cell) => {
      if (i >= subjStart) subjectParts.push($(cell).text().trim());
    });
    const subjects = subjectParts.filter(Boolean).join(' ').trim();

    students.push({
      index_number: cno,
      name: cno,           // NECTA omits student names — fallback = index_number
      sex,
      aggregate,
      division,
      subjects,
    });
  });

  return { center_number: centerNumber, school_name, summary, students };
}

function buildHtml(data: StructuredData, examLabel: string, year: number): string {
  // Index table rows (NECTA-style school listing)
  const indexRows = data.schools.map((school, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${school.center_number}</td>
        <td><a class="results-school-link" href="#school-${school.center_number}">${school.school_name}</a></td>
        <td>${school.summary.div1}</td>
        <td>${school.summary.div2}</td>
        <td>${school.summary.div3}</td>
        <td>${school.summary.div4}</td>
        <td>${school.summary.div0}</td>
      </tr>`).join('');

  // Individual school detail sections (hidden by default, shown on click)
  const schoolSections = data.schools.map(school => {
    const rows = school.students.map(s => `
        <tr id="${s.index_number}">
          <td>${s.index_number}</td>
          <td>${s.sex}</td>
          <td>${s.aggregate ?? '-'}</td>
          <td>${s.division}</td>
          <td>${s.subjects}</td>
        </tr>`).join('');

    return `
    <div class="results-school results-school-detail" id="school-${school.center_number}">
      <div class="results-school-header">
        <h2>${school.school_name} <small>(${school.center_number})</small></h2>
        <button class="results-back-btn" type="button">&#8592; Back to Schools List</button>
      </div>
      <div class="results-summary">
        DIV I: <strong>${school.summary.div1}</strong> &nbsp;|&nbsp;
        DIV II: <strong>${school.summary.div2}</strong> &nbsp;|&nbsp;
        DIV III: <strong>${school.summary.div3}</strong> &nbsp;|&nbsp;
        DIV IV: <strong>${school.summary.div4}</strong> &nbsp;|&nbsp;
        ABS/FAIL: <strong>${school.summary.div0}</strong>
      </div>
      <div class="table-responsive">
        <table class="results-table">
          <thead>
            <tr>
              <th>CNO</th><th>SEX</th><th>AGGT</th><th>DIV</th><th>SUBJECTS</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  }).join('\n');

  return `
<div class="results-content">
  <div class="results-stats">
    <strong>${data.total_schools}</strong> schools &nbsp;|&nbsp;
    <strong>${data.total_students.toLocaleString()}</strong> candidates
  </div>

  <div class="results-index" id="results-index">
    <div class="table-responsive">
      <table class="results-table results-index-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Centre No.</th>
            <th>School Name</th>
            <th>Div I</th>
            <th>Div II</th>
            <th>Div III</th>
            <th>Div IV</th>
            <th>Abs/Fail</th>
          </tr>
        </thead>
        <tbody>${indexRows}</tbody>
      </table>
    </div>
  </div>

  <div class="results-detail-container" id="results-detail-container">
    ${schoolSections}
  </div>
</div>`.trim();
}

async function callClaude(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error ${res.status}`);
  const json = await res.json() as any;
  return json.content?.[0]?.text?.trim() || '';
}

export async function crawlNectaResults(
  url: string,
  onEvent: (e: CrawlEvent) => void,
  onSchoolCrawled?: (school: School, progress: number, total: number) => Promise<void>,
): Promise<CrawlResult> {
  // Validate origin
  if (!url.startsWith(NECTA_ORIGIN)) {
    throw new Error('URL must start with https://onlinesys.necta.go.tz');
  }

  // Extract year + exam_type from URL
  // e.g. /results/2025/ftna/ftna.htm  →  year=2025, exam_type=ftna
  const urlMatch = url.match(/\/results\/(\d{4})\/([^/]+)\//);
  const year      = urlMatch ? parseInt(urlMatch[1]) : new Date().getFullYear();
  const exam_type = urlMatch ? urlMatch[2].toLowerCase() : 'unknown';

  onEvent({ stage: 'crawling', progress: 0, total: 0, message: 'Fetching index page...' });

  const indexHtml  = await fetchHtml(url);
  const schoolLinks = extractSchoolLinks(indexHtml, url);
  const total       = schoolLinks.length;

  if (total === 0) throw new Error('No school links found on this page.');

  onEvent({ stage: 'crawling', progress: 0, total, message: `Found ${total} schools. Starting crawl...` });

  const schools: School[] = [];
  let processed = 0;

  for (let i = 0; i < schoolLinks.length; i += BATCH_SIZE) {
    const batch = schoolLinks.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (link) => {
      const centerMatch  = link.match(/([PS]\d+)\.htm/i);
      const centerNumber = centerMatch ? centerMatch[1].toUpperCase() : 'UNKNOWN';
      try {
        const html    = await fetchHtml(link);
        const school  = parseSchoolPage(html, centerNumber);
        schools.push(school);
        if (onSchoolCrawled) await onSchoolCrawled(school, processed + 1, total);
      } catch {
        // skip failed pages silently
      } finally {
        processed++;
        onEvent({ stage: 'crawling', progress: processed, total, message: `Crawling schools... ${processed}/${total}` });
      }
    }));

    if (i + BATCH_SIZE < schoolLinks.length && BATCH_DELAY > 0) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }

  onEvent({ stage: 'processing', progress: total, total, message: 'Generating title and meta with AI...' });

  const examLabel = exam_type.toUpperCase();
  const structured_data: StructuredData = {
    total_schools: schools.length,
    total_students: schools.reduce((sum, s) => sum + s.students.length, 0),
    schools,
  };

  // Use Claude only for title, meta_description, intro — NOT the full content
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  let title        = `${examLabel} ${year} Results | Tanzania NECTA`;
  let meta_title   = `Matokeo ${examLabel} ${year} | NECTA Results | Mayobe Bros`;
  let meta_description = `Angalia matokeo ya ${examLabel} mwaka ${year} Tanzania. Tafuta kwa index number au shule. ${structured_data.total_students.toLocaleString()} candidates.`;

  if (apiKey) {
    try {
      const aiResponse = await callClaude(apiKey,
        `Generate a JSON object (no markdown) for NECTA ${examLabel} ${year} results page with these keys:
- title: English page title (max 70 chars)
- meta_title: SEO title mixing Swahili+English (max 60 chars), include "Mayobe Bros"
- meta_description: Swahili+English SEO description (120-160 chars) mentioning year, exam, search by index/school

JSON only, no explanation.`
      );
      const parsed = JSON.parse(aiResponse);
      if (parsed.title) title = parsed.title;
      if (parsed.meta_title) meta_title = parsed.meta_title;
      if (parsed.meta_description) meta_description = parsed.meta_description;
    } catch {
      // AI failed — use defaults generated above
    }
  }

  onEvent({ stage: 'building', progress: 1, total: 1, message: 'Building HTML content...' });

  const content = buildHtml(structured_data, examLabel, year)
    .replace(new RegExp(NECTA_ORIGIN, 'g'), SITE_ORIGIN);

  const slug = slugify(`${exam_type}-${year}-results`);

  return {
    title,
    slug,
    year,
    exam_type,
    source_url: url,
    content,
    structured_data,
    meta_title,
    meta_description,
  };
}
