# War Room — Market Proxy Worker

Cloudflare Worker that fetches real market data from Yahoo Finance and serves it via API.

## Setup

```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create KV namespace
wrangler kv:namespace create MARKETS_KV
# Copy the ID into wrangler.toml

# Dev
wrangler dev

# Deploy
wrangler deploy
```

## Endpoints

- `GET /api/markets` — Latest market data (JSON)
- `GET /api/health` — Health check

## Symbols Tracked
Brent, WTI, Gold, S&P 500, Dow, 10Y Yield, VIX, DXY, EUR/USD, GBP/USD, USD/JPY, BTC/USD, EU Gas (TTF)

## Notes
- VLCC tanker rates not available via Yahoo Finance — must be updated manually
- Cron runs every 5 minutes
- Data cached in KV with 10-min TTL
- Historical snapshots kept for 7 days
