# Real Market Data Feed — Architecture

## Overview
Replace the current simulated flicker (random ±0.2% around base values) with real market data from free/affordable APIs.

## Current State (index.html)
```javascript
// Current: fake flicker around hardcoded base
setInterval(()=>{ flickMkt('brent', 84.18, '$'); }, 3000);
setInterval(()=>{ flickMkt('gold', 5187, '$',0); }, 4000);
setInterval(()=>{ flickMkt('dxy-top', 98.54, ''); }, 5000);
```

## Target State
Real prices from APIs, updated every 1-5 minutes, with flicker animation between updates.

## Data Sources Comparison

### Option 1: Alpha Vantage (Recommended for start)
- **Free tier**: 25 requests/day (sufficient for 10 symbols × 2 updates/day)
- **Premium**: $49.99/mo for 75 req/min
- **Coverage**: Stocks, FX, Commodities, Crypto
- **Symbols we need**:
  - Brent: `BRENT` (via commodity endpoint)
  - WTI: `WTI`
  - Gold: `GOLD` (or `XAUUSD` via FX)
  - S&P 500: `SPY` or `^GSPC`
  - Dow: `DIA` or `^DJI`
  - 10Y Yield: `^TNX`
  - VIX: `^VIX`
  - DXY: `DX-Y.NYB`
  - EUR/USD: `EURUSD` (FX endpoint)
- **Limitation**: No VLCC tanker rates, no EU gas
- **API**: REST, JSON response, API key in URL

### Option 2: Yahoo Finance (via unofficial API)
- **Free**: Unlimited (unofficial, may break)
- **Coverage**: Same as Alpha Vantage + more
- **Risk**: No SLA, could be blocked
- **Endpoint**: `query1.finance.yahoo.com/v8/finance/chart/{symbol}`

### Option 3: Twelve Data
- **Free tier**: 800 req/day, 8 symbols
- **Coverage**: Stocks, FX, Commodities
- **Better than AV**: WebSocket support for real-time

### Option 4: Commodities-API
- **Free tier**: 100 req/mo
- **Good for**: Brent, WTI, Gold specifically
- **Limitation**: Low request count

### Recommendation: Alpha Vantage free tier + Yahoo Finance fallback

## Architecture

```
[Cloudflare Worker] → [Market APIs] → [KV Cache] → [Dashboard Polling]
   cron: */5 min          ↓                              ↓
                    Alpha Vantage              JSON endpoint
                    Yahoo Finance              /api/markets
                    (fallback)
```

### Worker: market-worker.js
```javascript
export default {
  async scheduled(event, env) {
    const symbols = {
      brent: { av: 'BRENT', yf: 'BZ=F', unit: '$', decimals: 2 },
      wti:   { av: 'WTI', yf: 'CL=F', unit: '$', decimals: 2 },
      gold:  { av: null, yf: 'GC=F', unit: '$', decimals: 0, fx: 'XAU/USD' },
      sp500: { av: 'SPY', yf: '^GSPC', unit: '', decimals: 0 },
      dow:   { av: 'DIA', yf: '^DJI', unit: '', decimals: 0 },
      yield10y: { av: null, yf: '^TNX', unit: '%', decimals: 3 },
      vix:   { av: null, yf: '^VIX', unit: '', decimals: 2 },
      dxy:   { av: null, yf: 'DX-Y.NYB', unit: '', decimals: 2 },
      vlcc:  { av: null, yf: null, unit: '$K/day', decimals: 0, manual: true },
      eugas: { av: null, yf: 'TTF=F', unit: '€/MWh', decimals: 1 },
    };

    const results = {};
    for (const [key, cfg] of Object.entries(symbols)) {
      if (cfg.manual) continue; // VLCC must be manual — no free API
      try {
        results[key] = await fetchPrice(cfg, env);
      } catch(e) {
        results[key] = await env.MARKETS_KV.get(`market:${key}`, 'json'); // fallback to cached
      }
    }

    // Store in KV
    await env.MARKETS_KV.put('markets:latest', JSON.stringify({
      data: results,
      updated_at: new Date().toISOString()
    }));
  },

  async fetch(request, env) {
    // Public endpoint: GET /api/markets
    const data = await env.MARKETS_KV.get('markets:latest', 'json');
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://war-room.live',
        'Cache-Control': 'public, max-age=60'
      }
    });
  }
}
```

### FX Rates
Currently displayed: USD/EUR, USD/GBP, USD/JPY, USD/CNY, BTC/USD
```javascript
const fxPairs = {
  'usdeur': { yf: 'USDEUR=X' },
  'usdgbp': { yf: 'USDGBP=X' },
  'usdjpy': { yf: 'USDJPY=X' },
  'usdcny': { yf: 'USDCNY=X' },
  'btcusd': { yf: 'BTC-USD' },
};
```

## Dashboard Integration

### New function in index.html:
```javascript
let marketPollInterval;
function startMarketFeed() {
  async function fetchMarkets() {
    try {
      const res = await fetch('https://api.war-room.live/api/markets');
      const { data, updated_at } = await res.json();

      // Update each market cell with animation
      for (const [key, val] of Object.entries(data)) {
        const el = document.getElementById(key);
        if (!el || !val) continue;
        const valEl = el.querySelector('.mkt-val');
        if (!valEl) continue;

        const old = parseFloat(valEl.textContent.replace(/[^0-9.-]/g, ''));
        const neu = val.price;

        // Flash green/red on change
        if (neu > old) valEl.classList.add('mkt-up');
        else if (neu < old) valEl.classList.add('mkt-dn');
        setTimeout(() => valEl.classList.remove('mkt-up', 'mkt-dn'), 1500);

        valEl.textContent = val.unit + neu.toFixed(val.decimals);
      }
    } catch(e) {
      // Silently fall back to flicker mode
    }
  }

  fetchMarkets(); // Initial fetch
  marketPollInterval = setInterval(fetchMarkets, 60000); // Every 60s
}

// On load: try real feed, fall back to flicker
startMarketFeed();
```

## Symbols Not Available via Free APIs

| Symbol | Issue | Solution |
|--------|-------|----------|
| VLCC tanker rates | Only via LSEG/Clarkson (expensive) | Manual update, flag as "last updated" |
| EU Natural Gas (TTF) | Yahoo has TTF=F but unreliable | Try Yahoo, manual fallback |

## CSS Additions
```css
.mkt-up { color: var(--green) !important; transition: color 0.3s; }
.mkt-dn { color: var(--red) !important; transition: color 0.3s; }
.mkt-stale { opacity: 0.5; } /* If data older than 15 min */
```

## Implementation Plan

### Week 1: Client-side direct (MVP)
- Call Yahoo Finance API directly from browser (CORS issues → use cors-anywhere or Cloudflare proxy)
- Update every 5 minutes during market hours
- Fallback to flicker when API fails

### Week 2: Cloudflare Worker proxy
- Worker fetches from Alpha Vantage + Yahoo
- Caches in KV with 60s TTL
- Dashboard polls worker endpoint
- Remove CORS issues

### Week 3: Polish
- Add .mkt-up / .mkt-dn flash animations
- Add "last updated" timestamp to markets strip
- Add "LIVE" / "DELAYED" indicator
- Handle market hours (show "CLOSED" outside hours)

## Cost

| Phase | Cost | Notes |
|-------|------|-------|
| Week 1 (client-side) | $0 | Yahoo unofficial, no SLA |
| Week 2 (CF Worker) | $0 | Free tier covers it |
| Premium upgrade | $49.99/mo | Alpha Vantage for 75 req/min |
| Enterprise | $200+/mo | Reuters/Bloomberg API |
