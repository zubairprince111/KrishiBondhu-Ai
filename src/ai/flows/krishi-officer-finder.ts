// --- REPLACE the single query + googleCustomSearch section with the code below ---

// Prefer Upazila-first searching. Build multiple queries (English + Bengali + directory variants)
// Optionally, if you have a specific authoritative DB domain (e.g. 'example.gov.bd'), add it to PREFERRED_DB_DOMAINS
const PREFERRED_DB_DOMAINS = ['gov.bd', 'dae.gov.bd', 'extension.gov.bd']; // add your exact DB domain here if any

// keywords to bias toward contact / directory pages (English + Bengali)
const QUERY_KEYWORDS = [
  '"Upazila Agriculture Office" contact',
  '"Upazila Agriculture Officer" contact',
  'Upazila Agriculture Office phone',
  'Upazila Agriculture Office contact number',
  'Upazila Agriculture Office directory',
  'Upazila Agriculture Office contact site:gov.bd',
  // Bengali terms to increase recall for local pages
  'উপজেলা কৃষি অফিস ফোন',
  'উপজেলা কৃষি অফিস যোগাযোগ',
  'উপজেলা কৃষি কর্মকর্তা',
];

function buildQueries(zila: string, upazila: string) {
  const q: string[] = [];

  // 1) Strong upazila-first exact match queries (most preferred)
  for (const kw of QUERY_KEYWORDS) {
    q.push(`${upazila} ${kw} ${zila} Bangladesh`);
    // With site filters for preferred domains to bias authoritative DBs
    for (const d of PREFERRED_DB_DOMAINS) {
      q.push(`${upazila} ${kw} ${zila} site:${d} Bangladesh`);
    }
  }

  // 2) Broader queries if upazila-specific hits fail (fall back to zila)
  for (const kw of QUERY_KEYWORDS) {
    q.push(`${zila} ${kw} Bangladesh`);
    for (const d of PREFERRED_DB_DOMAINS) {
      q.push(`${zila} ${kw} site:${d} Bangladesh`);
    }
  }

  // Deduplicate while preserving order
  return Array.from(new Set(q));
}

// Try queries in order until we get search items back
let searchJson: any = { items: [] };
const allQueries = buildQueries(zila, upazila);

if (DEBUG) {
  console.debug('[krishi-officer-finder] Running ordered queries (upazila-first), total:', allQueries.length);
}

for (let qi = 0; qi < allQueries.length; qi++) {
  const qstr = allQueries[qi];
  try {
    if (DEBUG) console.debug(`[krishi-officer-finder] trying query #${qi + 1}:`, qstr);
    const candidateJson = await googleCustomSearch(qstr, MAX_SEARCH_RESULTS);
    const itemsCount = Array.isArray(candidateJson.items) ? candidateJson.items.length : 0;
    if (DEBUG) console.debug(`[krishi-officer-finder] got items for query #${qi + 1}:`, itemsCount);
    if (itemsCount > 0) {
      searchJson = candidateJson;
      break; // stop at first query that yields results (upazila-first behavior)
    }
  } catch (err) {
    console.warn(`[krishi-officer-finder] googleCustomSearch error for query "${qstr}":`, (err as Error).message);
    // continue to next query
  }
}

// After loop, if searchJson still empty items, we'll fall back to geminiDirectLookup later as before.
// Keep the existing debug logging that inspects searchJson and items length.
