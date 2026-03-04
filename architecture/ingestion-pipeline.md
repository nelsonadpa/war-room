# Auto-Ingestion Pipeline — Architecture

## Overview
Replace manual data updates with an automated pipeline that ingests, verifies, and pushes conflict data to the dashboard.

## Architecture

```
[Sources] → [Ingest Workers] → [Verification Layer] → [Normalized Store] → [Dashboard Push]
     ↓              ↓                    ↓                    ↓                    ↓
  RSS/API      Cloudflare Workers    AI Classification    KV / R2 Bucket     SSE / Polling
```

## Data Sources

### Tier 1: Official (highest confidence)
| Source | Type | Endpoint | Update Freq |
|--------|------|----------|-------------|
| CENTCOM | RSS/Press | centcom.mil/MEDIA/PRESS-RELEASES | ~2-4h |
| Pentagon | RSS | defense.gov/News/ | ~1-2h |
| IDF Spokesman | Telegram API | t.me/iaborofficial | Real-time |
| State Dept | RSS | state.gov/press-releases/feed | ~4h |
| IAEA | RSS | iaea.org/newscenter/pressreleases/feed | Daily |

### Tier 2: Wire Services (high confidence)
| Source | Type | Endpoint | Update Freq |
|--------|------|----------|-------------|
| Reuters | API (paid) | reuters.com/pf/api/v3/ | Real-time |
| AP News | RSS | apnews.com/feed | ~15min |
| Al Jazeera | RSS | aljazeera.com/xml/rss/all.xml | ~15min |
| BBC World | RSS | feeds.bbci.co.uk/news/world/rss.xml | ~15min |

### Tier 3: OSINT (medium confidence, needs verification)
| Source | Type | Endpoint | Update Freq |
|--------|------|----------|-------------|
| NetBlocks | API | netblocks.org/api | Real-time |
| FlightRadar24 | API (paid) | fr24.com/api | Real-time |
| MarineTraffic | API (paid) | marinetraffic.com/api | Real-time |
| ACLED | API | acleddata.com/api | Daily |

### Tier 4: Social/Unverified (low confidence, flagged)
| Source | Type | Endpoint | Update Freq |
|--------|------|----------|-------------|
| X/Twitter | API v2 | api.twitter.com/2/ | Real-time |
| Telegram channels | Bot API | Various OSINT channels | Real-time |

## Ingest Workers (Cloudflare Workers)

### Why Cloudflare Workers:
- Free tier: 100K requests/day — more than enough
- Edge-deployed: low latency worldwide
- Cron triggers: scheduled polling
- KV storage: built-in key-value store
- R2: object storage for historical data
- No server to maintain

### Worker Architecture:
```javascript
// worker-ingest.js — runs on cron schedule
export default {
  async scheduled(event, env) {
    const sources = [
      { name: 'centcom', url: 'https://www.centcom.mil/rss', type: 'rss', tier: 1 },
      { name: 'ap', url: 'https://apnews.com/feed', type: 'rss', tier: 2 },
      // ...
    ];

    for (const src of sources) {
      const items = await fetchAndParse(src);
      const filtered = items.filter(i => isConflictRelevant(i));
      const verified = await verifyAndClassify(filtered, env);
      await env.EVENTS_KV.put(`events:${Date.now()}`, JSON.stringify(verified));
    }
  }
}
```

### Cron Schedule:
```toml
# wrangler.toml
[triggers]
crons = [
  "*/5 * * * *",   # Tier 1-2: every 5 min
  "*/15 * * * *",  # Tier 3: every 15 min
  "0 * * * *",     # Tier 4: hourly
]
```

## Verification Layer

### AI Classification (Claude Haiku — fast + cheap)
```
Input: Raw headline + excerpt
Output: {
  relevant: boolean,        // Is this about Iran-USA-Israel conflict?
  category: 'atk|rep|dip|int|mkt',  // Attack, Reprisal, Diplomatic, Intel, Market
  escalation_delta: -2 to +2,       // Impact on Kahn scale
  confidence: 0.0 to 1.0,           // Source reliability × content certainty
  entities: ['Iran', 'US', ...],    // Actors mentioned
  summary: '...'                     // 1-line normalized summary
}
```

### Confidence Scoring:
```
confidence = source_tier_weight × content_corroboration × recency_factor

source_tier_weight:
  Tier 1 (official): 0.95
  Tier 2 (wire): 0.85
  Tier 3 (OSINT): 0.60
  Tier 4 (social): 0.30

content_corroboration: +0.1 per additional source confirming
recency_factor: 1.0 if <1h, 0.9 if <6h, 0.7 if <24h
```

### Rules:
- confidence < 0.5 → flagged as UNVERIFIED, not shown by default
- confidence 0.5-0.7 → shown with ⚠ warning
- confidence > 0.7 → shown as verified ✅
- Two independent Tier 2+ sources required for casualty/KIA numbers
- Market data only from financial APIs (never social media)

## Normalized Store

### KV Schema (Cloudflare KV):
```
events:{timestamp} → { event JSON }
markets:{symbol}:{timestamp} → { price, source, confidence }
stats:latest → { iran_dead, us_kia, ships_sunk, ... }
kahn:level → { level: 8, triggers: [...], updated_at }
meta:last_ingest → { timestamp, sources_checked, events_added }
```

### R2 Archive (historical):
```
/archive/2026-03-04/events.jsonl   # All events for the day
/archive/2026-03-04/markets.jsonl  # All market snapshots
/archive/2026-03-04/sources.jsonl  # Raw source data for audit
```

## Dashboard Push

### Option A: SSE (Server-Sent Events) — Recommended
```javascript
// In index.html
const evtSource = new EventSource('https://api.war-room.live/stream');
evtSource.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === 'event') appendEvent(data);
  if (data.type === 'market') updateMarket(data);
  if (data.type === 'stat') updateStat(data);
};
```

### Option B: Polling (simpler, works with static hosting)
```javascript
// Poll every 60s
setInterval(async () => {
  const res = await fetch('https://api.war-room.live/latest');
  const data = await res.json();
  applyUpdates(data);
}, 60000);
```

### Recommended: Start with Option B (polling), migrate to A when traffic justifies it.

## Cost Estimate (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Cloudflare Workers | Free | $0 (100K req/day) |
| Cloudflare KV | Free | $0 (100K reads/day) |
| Cloudflare R2 | Free | $0 (10GB storage) |
| Claude Haiku API | Pay-per-use | ~$5-15/mo (classification) |
| Reuters API | Paid | $500+/mo (skip initially) |
| Alpha Vantage | Free tier | $0 (25 req/day) |
| **Total (Phase 2 start)** | | **~$5-15/mo** |

## Implementation Order

1. **Week 1**: Set up Cloudflare Worker with RSS feeds (AP, Al Jazeera, BBC, CENTCOM)
2. **Week 1**: Basic AI classification with Claude Haiku
3. **Week 2**: KV storage + polling endpoint
4. **Week 2**: Dashboard integration (replace manual events)
5. **Week 3**: Confidence scoring + verification rules
6. **Week 3**: Market data feed (see market-feed.md)
7. **Week 4**: R2 archival + historical playback foundation

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| RSS feeds change format | Broken ingestion | Parser per source + fallback |
| AI hallucination in classification | False events shown | Confidence threshold + human review queue |
| Rate limiting on free APIs | Missing data | Multiple source redundancy |
| Source goes offline | Coverage gap | Tier system ensures 2+ sources per fact |
| Cost spike on Claude API | Budget overrun | Haiku (cheapest), batch requests, cache |
