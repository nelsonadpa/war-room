# War Room — Public API Specification

**Base URL**: `https://api.war-room.live` (Cloudflare Worker)
**Auth**: API key via `X-API-Key` header (free tier: 100 req/day, paid: 10K req/day)
**Format**: JSON
**CORS**: Allowed for all origins

---

## Endpoints

### GET /api/markets
Latest market data for all tracked symbols.

**Response:**
```json
{
  "data": {
    "brent": {
      "price": 84.18,
      "previousClose": 70.85,
      "change": 13.33,
      "changePercent": 18.81,
      "unit": "$",
      "label": "Brent Crude",
      "marketState": "REGULAR"
    },
    "gold": { "price": 5187, "...": "..." },
    "dxy": { "price": 98.54, "...": "..." },
    "vix": { "price": 27.3, "...": "..." }
  },
  "fetched_at": "2026-03-04T14:30:00Z",
  "symbols": ["brent","wti","gold","sp500","dow","yield10y","vix","dxy","eurusd","gbpusd","usdjpy","btcusd","eugas"]
}
```

### GET /api/events
Latest conflict events (last 24h, filtered for Iran-USA-Israel).

**Query params:**
- `category` — Filter: `atk`, `rep`, `dip`, `int`, `mkt` (optional)
- `since` — ISO timestamp, return events after this time (optional)
- `limit` — Max results, default 50, max 200

**Response:**
```json
{
  "events": [
    {
      "title": "10th wave: Natanz underground + Isfahan centrifuge halls",
      "category": "atk",
      "source": "AP News",
      "tier": 2,
      "confidence": 0.85,
      "escalation_delta": 1,
      "link": "https://apnews.com/...",
      "published_at": "2026-03-04T08:00:00Z",
      "ingested_at": "2026-03-04T08:02:30Z"
    }
  ],
  "count": 23,
  "period": "24h"
}
```

### GET /api/kahn
Current Kahn Escalation Scale status.

**Response:**
```json
{
  "level": 8,
  "name": "Full Regional War",
  "description": "Multi-theater conventional war with regional power involvement",
  "updated_at": "2026-03-04T00:00:00Z",
  "day": "D+5",
  "triggers_to_next": [
    "Bushehr struck — radiation release",
    "Iran deploys chemical/bio agents",
    "Russia provides S-400 / direct military aid",
    "Nuclear device detonation threat"
  ],
  "scenarios": {
    "quick_resolution": { "probability": 10, "timeline": "1-2 weeks" },
    "sustained_air": { "probability": 45, "timeline": "3-5 weeks" },
    "prolonged_regional": { "probability": 30, "timeline": "2-4 months" },
    "extreme_escalation": { "probability": 15, "timeline": "months+" }
  },
  "history": [
    { "day": "D+0", "level": 6, "event": "US strikes begin" },
    { "day": "D+1", "level": 7, "event": "Hormuz closed by IRGC" },
    { "day": "D+3", "level": 8, "event": "Lebanon front opens" }
  ]
}
```

### GET /api/scenarios
Probabilistic conflict scenarios with market impact projections.

**Response:**
```json
{
  "scenarios": [
    {
      "id": "quick_resolution",
      "name": "Quick Resolution",
      "probability": 10,
      "color": "#22c55e",
      "triggers": "Iran signals via China/Turkey. Nuclear sites confirmed destroyed.",
      "timeline": "1-2 weeks",
      "market_impact": {
        "brent": "$70 (-17%)",
        "gold": "$4,800 (-7%)",
        "vix": "normalize to 15"
      }
    },
    { "id": "sustained_air", "...": "..." },
    { "id": "prolonged_regional", "...": "..." },
    { "id": "extreme_escalation", "...": "..." }
  ],
  "updated_at": "2026-03-04T00:00:00Z"
}
```

### GET /api/stats
Operational statistics summary.

**Response:**
```json
{
  "conflict_day": "D+5",
  "date": "2026-03-04",
  "casualties": {
    "iran_dead": { "value": 1045, "source": "Tasnim/Al Jazeera", "note": "minimum confirmed" },
    "us_kia": { "value": 6, "source": "CENTCOM/WashPost" },
    "israel_dead": { "value": 11, "source": "IDF" }
  },
  "operations": {
    "attack_waves": 10,
    "ships_sunk": 17,
    "flights_cancelled": 11000
  },
  "hormuz": {
    "status": "closed",
    "declared_by": "IRGC",
    "disputed_by": "CENTCOM"
  }
}
```

### GET /api/embed
Returns HTML snippet for embedding the widget.

**Response:** HTML (not JSON)

---

## Rate Limits

| Tier | Requests/day | Price |
|------|-------------|-------|
| Free | 100 | $0 |
| Developer | 10,000 | $49/mo |
| Enterprise | 100,000 | $199/mo |

**Headers returned:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1709596800
```

## Error Responses

```json
{
  "error": "rate_limit_exceeded",
  "message": "Daily request limit reached. Upgrade at war-room.live/pricing",
  "retry_after": 3600
}
```

Status codes: `200` OK, `400` Bad request, `401` Missing API key, `429` Rate limited, `500` Server error.

## Webhooks (Future)
POST endpoint where we push real-time updates:
- `event.new` — New conflict event
- `kahn.level_change` — Escalation level changed
- `market.alert` — Significant market move (>5% in session)

---

## SDK Example

```javascript
// Browser
const res = await fetch('https://api.war-room.live/api/kahn', {
  headers: { 'X-API-Key': 'YOUR_KEY' }
});
const kahn = await res.json();
console.log(`Level ${kahn.level}: ${kahn.name}`);
```

```python
# Python
import requests
r = requests.get('https://api.war-room.live/api/markets',
                  headers={'X-API-Key': 'YOUR_KEY'})
data = r.json()
print(f"Brent: ${data['data']['brent']['price']}")
```
