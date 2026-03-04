# War Room Dashboard — Iran-USA-Israel 2026

Real-time situational awareness dashboard tracking the Iran-USA-Israel military conflict starting March 2026 (D+0).

## Live at: [warroom.vercel.app](https://warroom.vercel.app) *(update with actual URL)*

## What it does

- **Events log** — chronological timeline of verified military, diplomatic, and intelligence events
- **Markets strip** — live-flickering Brent, WTI, Gold, S&P, Dow, 10Y, VIX, DXY, VLCC, EU Gas
- **Interactive maps** — Leaflet-based strike map (Middle East) + world positions panel
- **Operational stats** — casualty counts, ships sunk, attack waves, flights cancelled
- **Kahn Escalation Scale** — visual nuclear escalation gauge
- **AI chat** — Claude-powered analyst with full conflict context (user provides own API key)
- **8 languages** — EN, ES, FR, PT, RU, AR, ZH, FA (with RTL support)
- **Dark/Light theme** — dark default, both keep dark map tiles

## Stack

Single self-contained `index.html`. No build step, no backend, no dependencies to install.

- Pure HTML/CSS/JS
- [Leaflet.js](https://leafletjs.com/) via CDN (maps)
- [Google Fonts](https://fonts.google.com/) — Barlow Condensed + Space Mono
- [CartoCDN](https://carto.com/basemaps/) dark tiles
- Anthropic API (Claude Sonnet) for embedded AI chat

## Deploy

Push to GitHub, connect repo to [Vercel](https://vercel.com). No config needed — auto-detects static.

```bash
git add index.html && git commit -m "D+X update — [brief]" && git push
```

Vercel auto-deploys in ~30 seconds.

## Author

Built by [@nelson_ad](https://x.com/nelson_ad)
