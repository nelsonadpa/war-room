# War Room — Setup Guide

## Quick Start (Dashboard only)
Just open `index.html` in a browser. No build step, no dependencies.

## Vercel Deploy
1. Push to GitHub: `git push`
2. Connect repo on [vercel.com](https://vercel.com)
3. Auto-deploys on every push (~30s)

## Configuration

### 1. Google Analytics 4
1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Get Measurement ID (format: `G-XXXXXXXXXX`)
3. Replace `G-XXXXXXXXXX` in both `index.html` and `landing.html`

**Events tracked:**
| Event | Trigger |
|-------|---------|
| `language_switch` | User changes language |
| `theme_toggle` | Dark/light toggle |
| `map_toggle` | Show/hide map |
| `world_panel_toggle` | Open/close X positions |
| `chat_toggle` | Open/close AI chat |
| `intel_section_toggle` | Expand/collapse intel section |
| `intel_card_toggle` | Expand/collapse analysis card |
| `share_panel` | Share intel panel |
| `ai_refresh` | Refresh analysis with AI |
| `waitlist_signup` | Email submitted on landing page |

### 2. Formspree (Waitlist)
1. Create account at [formspree.io](https://formspree.io)
2. Create new form → get form ID
3. Replace `FORM_ID` in `landing.html` form action URL

### 3. Cloudflare Workers (Real Market Data)
```bash
cd workers/market-proxy
npm install -g wrangler
wrangler login
wrangler kv:namespace create MARKETS_KV
# Copy namespace ID into wrangler.toml
wrangler deploy
```
Then update `MARKET_API` URL in `index.html` with your worker URL.

### 4. Cloudflare Workers (Event Ingestion)
```bash
cd workers/event-ingest
wrangler kv:namespace create EVENTS_KV
# Copy namespace ID into wrangler.toml
wrangler secret put ANTHROPIC_API_KEY
# Paste your Anthropic API key
wrangler deploy
```

### 5. Custom Domain
1. In Vercel: Settings → Domains → Add `war-room.live`
2. In Cloudflare (for workers): Add custom routes or use `api.war-room.live`

## File Structure
```
├── index.html          # Main dashboard (single file)
├── landing.html        # Waitlist landing page
├── vercel.json         # Vercel routing config
├── CLAUDE.md           # AI assistant instructions
├── SETUP.md            # This file
├── war-menu.sh         # Daily operations CLI menu
├── pricing.html        # Pricing page (4 tiers)
├── embed.html          # Embeddable iframe widget
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline + push)
├── og-image.svg        # Social sharing image (1200x630)
├── conflicts/
│   └── iran-usa-israel-2026.html  # SEO static page
├── distribution/
│   ├── posts.md        # Ready-to-publish social posts
│   ├── competitive-analysis.md
│   ├── newsletter-strategy.md
│   └── twitter-strategy.md
├── architecture/
│   ├── ingestion-pipeline.md
│   ├── market-feed.md
│   └── api-spec.md     # Public API specification
└── workers/
    ├── market-proxy/   # CF Worker: real market data
    └── event-ingest/   # CF Worker: RSS ingestion + AI classification
```
