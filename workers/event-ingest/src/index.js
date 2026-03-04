/**
 * War Room — Event Ingestion Worker
 * Ingests RSS feeds, classifies events with AI, serves to dashboard.
 *
 * Deploy: npx wrangler deploy
 * Dev:    npx wrangler dev
 */

const RSS_SOURCES = [
  { name: 'AP News',     url: 'https://rsshub.app/apnews/topics/world-news', tier: 2 },
  { name: 'Al Jazeera',  url: 'https://www.aljazeera.com/xml/rss/all.xml', tier: 2 },
  { name: 'BBC World',   url: 'https://feeds.bbci.co.uk/news/world/rss.xml', tier: 2 },
  { name: 'Reuters',     url: 'https://rsshub.app/reuters/world', tier: 2 },
  { name: 'CENTCOM',     url: 'https://www.centcom.mil/MEDIA/PRESS-RELEASES/', tier: 1, type: 'scrape' },
];

const CONFLICT_KEYWORDS = [
  'iran', 'tehran', 'isfahan', 'natanz', 'bushehr', 'hormuz', 'persian gulf',
  'israel', 'idf', 'tel aviv', 'mossad', 'hamas', 'hezbollah', 'beirut',
  'centcom', 'pentagon', 'us military', 'carrier', 'strike',
  'houthi', 'yemen', 'aden', 'red sea',
  'irgc', 'quds force', 'khamenei', 'pezeshkian',
  'strait of hormuz', 'oil tanker', 'vlcc', 'brent', 'sanctions',
  'nuclear', 'enrichment', 'fordow', 'arak',
];

// Simple RSS parser (no dependencies)
function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] || block.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    const desc = block.match(/<description><!\[CDATA\[(.*?)\]\]>|<description>(.*?)<\/description>/)?.[1] || '';
    items.push({ title: title.trim(), link: link.trim(), pubDate, description: desc.substring(0, 300) });
  }
  return items;
}

function isConflictRelevant(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  return CONFLICT_KEYWORDS.some(kw => text.includes(kw));
}

function computeConfidence(tier, corroboration = 0) {
  const tierWeights = { 1: 0.95, 2: 0.85, 3: 0.60, 4: 0.30 };
  const base = tierWeights[tier] || 0.5;
  return Math.min(1.0, base + corroboration * 0.1);
}

async function classifyWithAI(items, env) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey || items.length === 0) return items.map(i => ({ ...i, category: 'int', escalation: 0 }));

  const prompt = `Classify these conflict news items. For each, return JSON with:
- category: "atk" (attack/strike), "rep" (response/retaliation), "dip" (diplomatic), "int" (intelligence/intel), "mkt" (market impact)
- escalation_delta: -2 to +2 (impact on conflict escalation)
- summary: 1 sentence normalized summary

Items:
${items.map((it, i) => `${i + 1}. ${it.title}`).join('\n')}

Return a JSON array of objects. Only JSON, no explanation.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic: ${res.status}`);
    const data = await res.json();
    const text = data.content?.[0]?.text || '[]';
    const classifications = JSON.parse(text);

    return items.map((item, i) => ({
      ...item,
      category: classifications[i]?.category || 'int',
      escalation: classifications[i]?.escalation_delta || 0,
      aiSummary: classifications[i]?.summary || item.title,
    }));
  } catch (e) {
    // Fallback: no AI classification
    return items.map(i => ({ ...i, category: 'int', escalation: 0, aiSummary: i.title }));
  }
}

async function ingestAll(env) {
  const allItems = [];
  const errors = [];

  for (const source of RSS_SOURCES) {
    if (source.type === 'scrape') continue; // Skip scrape sources for now
    try {
      const res = await fetch(source.url, {
        headers: { 'User-Agent': 'WarRoom/1.0 RSS Reader' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) { errors.push(`${source.name}: ${res.status}`); continue; }
      const xml = await res.text();
      const items = parseRSS(xml);
      const relevant = items.filter(isConflictRelevant);
      relevant.forEach(item => {
        item.source = source.name;
        item.tier = source.tier;
        item.confidence = computeConfidence(source.tier);
        item.ingested_at = new Date().toISOString();
      });
      allItems.push(...relevant);
    } catch (e) {
      errors.push(`${source.name}: ${e.message}`);
    }
  }

  // Deduplicate by title similarity
  const seen = new Set();
  const unique = allItems.filter(item => {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // AI classify
  const classified = await classifyWithAI(unique.slice(0, 20), env); // Max 20 items per batch

  return { events: classified, errors, count: classified.length, ingested_at: new Date().toISOString() };
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60',
  };
}

export default {
  async scheduled(event, env) {
    const result = await ingestAll(env);
    await env.EVENTS_KV.put('events:latest', JSON.stringify(result), { expirationTtl: 600 });

    // Append to daily log
    const dateKey = new Date().toISOString().slice(0, 10);
    const existing = await env.EVENTS_KV.get(`events:daily:${dateKey}`, 'json') || { events: [] };
    const combined = [...existing.events, ...result.events];
    // Dedupe
    const seenIds = new Set();
    const deduped = combined.filter(e => {
      const id = (e.title || '').substring(0, 50);
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    });
    await env.EVENTS_KV.put(`events:daily:${dateKey}`, JSON.stringify({ events: deduped }), {
      expirationTtl: 86400 * 30,
    });
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (url.pathname === '/api/events') {
      let data = await env.EVENTS_KV.get('events:latest', 'json');
      if (!data) {
        data = await ingestAll(env);
        await env.EVENTS_KV.put('events:latest', JSON.stringify(data), { expirationTtl: 600 });
      }
      return new Response(JSON.stringify(data), { headers: corsHeaders(env) });
    }

    if (url.pathname === '/api/events/today') {
      const dateKey = new Date().toISOString().slice(0, 10);
      const data = await env.EVENTS_KV.get(`events:daily:${dateKey}`, 'json') || { events: [] };
      return new Response(JSON.stringify(data), { headers: corsHeaders(env) });
    }

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', sources: RSS_SOURCES.length }), {
        headers: corsHeaders(env),
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
