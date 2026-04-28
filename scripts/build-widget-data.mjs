// Build-time helper: derive a slim widget-only data file from the full corpus.
// We DO NOT commit the full 1.87 MB JSONL. We commit only this generated slim file
// (src/data/jei_widget_data.json) which is small enough to ship with the site.
//
// Source: ../../research/02_iris_articles_full.jsonl (relative to site/)
// Output: ./src/data/jei_widget_data.json
//
// For each normalized topic tag, pick up to 5 representative recent titles
// (preferring 2024 and 2025), with HTML-escaped strings.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = resolve(__dirname, '..');
const CORPUS = resolve(SITE_ROOT, '../research/02_iris_articles_full.jsonl');
const METRICS = resolve(SITE_ROOT, '../output/jei_metrics.json');
const OUT = resolve(SITE_ROOT, 'src/data/jei_widget_data.json');

function htmlEscape(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Replace em and en dashes defensively. Even though the rendered site is checked,
// scraped corpus titles can contain em-dashes; substitute with a comma + space.
function dedash(s) {
  if (s == null) return '';
  return String(s).replace(/[—–]/g, ', ');
}

if (!existsSync(CORPUS)) {
  console.error(`[build-widget-data] corpus not found at ${CORPUS}`);
  console.error('Cannot build widget data. Aborting.');
  process.exit(1);
}
if (!existsSync(METRICS)) {
  console.error(`[build-widget-data] metrics not found at ${METRICS}`);
  process.exit(1);
}

const lines = readFileSync(CORPUS, 'utf8').split('\n').filter(Boolean);
const records = [];
for (const line of lines) {
  try {
    records.push(JSON.parse(line));
  } catch {
    // skip malformed lines silently
  }
}

const TOPIC_LABELS = {
  cs_data: 'CS / data',
  behavioral_social: 'Behavioral / social',
  biology: 'Biology',
  physics: 'Physics',
  chemistry: 'Chemistry',
  earth_env: 'Earth / environment',
  engineering: 'Engineering',
  math: 'Math',
  other: 'Other',
};

const byTopic = {};
for (const t of Object.keys(TOPIC_LABELS)) byTopic[t] = [];
for (const r of records) {
  const t = r.topic_tag_normalized;
  if (!byTopic[t]) continue;
  byTopic[t].push(r);
}

// Prefer 2024 and 2025, then 2023, then 2026, then 2022. Sort within bucket
// alphabetically by title for stability.
function pickRepresentative(arr, n = 5) {
  const yearRank = { 2024: 0, 2025: 1, 2023: 2, 2026: 3, 2022: 4 };
  const sorted = [...arr].sort((a, b) => {
    const ra = yearRank[a.year] ?? 99;
    const rb = yearRank[b.year] ?? 99;
    if (ra !== rb) return ra - rb;
    return String(a.title || '').localeCompare(String(b.title || ''));
  });
  const seen = new Set();
  const out = [];
  for (const r of sorted) {
    const t = (r.title || '').trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push({
      title: htmlEscape(dedash(t)),
      year: r.year ?? null,
      lead_school: htmlEscape(dedash(r.lead_school_or_program || '')) || null,
      doi: r.doi ? htmlEscape(String(r.doi)) : null,
    });
    if (out.length >= n) break;
  }
  return out;
}

const examples = {};
for (const t of Object.keys(TOPIC_LABELS)) {
  examples[t] = {
    label: TOPIC_LABELS[t],
    count: byTopic[t].length,
    examples: pickRepresentative(byTopic[t], 5),
  };
}

const metrics = JSON.parse(readFileSync(METRICS, 'utf8'));

const out = {
  generated_at: new Date().toISOString(),
  source: 'research/02_iris_articles_full.jsonl',
  corpus_total: metrics.papers_total,
  topic_distribution_pct: metrics.topic_distribution_pct,
  topic_examples: examples,
  // for the geography heatmap
  geography: metrics.geography,
};

writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`[build-widget-data] wrote ${OUT} with ${Object.keys(examples).length} topic groups`);
