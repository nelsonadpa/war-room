# CLAUDE.md — War Room Dashboard

## PROJECT: WAR ROOM DASHBOARD — Iran-USA-Israel 2026

Single self-contained HTML file (~1,835 lines). No backend, no build step, no dependencies to install. Deploys to Vercel as a static file — just `index.html`.

## STACK
- Pure HTML/CSS/JS — single file, no frameworks
- Leaflet.js (maps via CDN)
- Google Fonts: Barlow Condensed + Space Mono (via CDN)
- Anthropic API claude-sonnet-4-20250514 (AI chat embedded in HTML)
- CartoCDN dark tiles for maps

## FILE ARCHITECTURE (in order)
1. `<head>` — fonts, Leaflet CSS
2. `<style>` — CSS variables dark/light, 3-column layout, responsive breakpoints
3. TOPBAR — logo + 8-language selector + live pills + UTC clock + theme toggle button
4. TICKER — verified real news scrolling horizontally
5. MARKETS STRIP — 10 cells: Brent, WTI, Gold, S&P, Dow, 10Y Yield, VIX, DXY, VLCC, EU Gas
6. MAIN GRID — 3 columns:
   - LEFT col (260px): Operational stats D+5, Hormuz status box, Kahn Escalation Scale
   - CENTER col (flex): Events log (hero element) + collapsible mini map
   - RIGHT col (260px): FX rates + DXY gauge, Live coverage links, Key intel
7. Floating FABs: 𝕏 world positions panel + 🤖 AI chat panel
8. FOOTER: "BUILT BY 𝕏 @nelson_ad"
9. `<script>`: i18n system, Leaflet map init, events array, market flicker intervals, FX flicker, AI chat with full context system prompt

## i18n SYSTEM
- 8 languages: EN (default), ES, FR, PT, RU, AR, ZH, FA
- `data-i18n` attributes on all translatable elements
- `data-i18n-html` for elements with inner HTML (like Kahn explain box)
- Auto RTL toggle for AR and FA via `body.rtl` class
- `setLang(code)` applies translations to DOM
- `LANGS{}` object contains all translations — add new keys here when adding new UI text
- Called on DOMContentLoaded with EN default

## THEME SYSTEM
- Dark mode default (CSS variables on `:root`)
- Light mode via `body.light` class overrides
- Both modes keep dark map tiles (dark_matter) — light basemap washed out markers
- `toggleTheme()` swaps body class + swaps Leaflet tile layers
- Tile layer references stored as `window._tileLayer` and `window._wmapLayer`

## MAP SYSTEM
- Main mini-map: Leaflet, center [29,47] zoom 5, height 210px, collapsible
- `toggleMap()` collapses/expands with CSS transition
- Markers: mkExpl() = pulsing red circles (strike targets), mkBase() = pentagon shapes, mkNaval() = triangles
- World panel map: separate Leaflet instance `wmap`, center [20,10] zoom 2
- Both maps reference stored tile layers for theme switching

## CURRENT DATA (D+5 — 04 MAR 2026) — verified sources
- Iran dead: 1,045+ (Tasnim/Al Jazeera)
- US KIA: 6 (CENTCOM/WashPost — 4 from 103rd Sustainment Command, Iowa)
- Israel dead: 11
- Ships sunk: 17+ | Attack wave: 10th
- Brent: $84.18 | WTI: $77.00 | Gold: $5,187
- VLCC supertanker: $423K/day (LSEG — all-time record, +94% in one day)
- EU Natural Gas: +38% single session
- DXY: 98.54 | VIX: +27% intraday spike
- Khamenei confirmed killed D+0 (CIA intelligence tracked compound)
- Hormuz: declared closed by IRGC, CENTCOM disputes full closure
- IRIS Dena frigate sunk Indian Ocean 40nm south of Sri Lanka
- QatarEnergy halted LNG at Ras Laffan
- 11,000+ flights cancelled
- Lebanon front opened (Hezbollah), Beirut struck
- Iranian parliament + Assembly of Experts struck
- Bushehr nuclear plant threatened (Russia warning)
- NATO/Turkey destroyed Iranian ballistic missile in eastern Mediterranean

## DAILY UPDATE WORKFLOW
When Nelson gives new data, update these in order:
1. `.stats-grid` stat values (left column) — Iran dead, US KIA, ships, flights, wave count
2. Markets strip cells — Brent (#brent), Gold (#gold), DXY (#dxy-top, #dxy-num), VIX (#vix)
3. Market flicker JS intervals — update base values (currently: brent 84.18, gold 5187, dxy 98.54)
4. `evs[]` array in JS — append new events at the end with format {t:'D+X HH:MM', k:'atk|rep|dip|int', x:'[description]'}
5. Ticker inner HTML — prepend new verified facts at the start
6. Kahn scale — change `.active` class to new level segment if escalation changes
7. AI chat system prompt — update all figures and add new developments
8. Footer version badge and date
9. All i18n translations in LANGS{} for any new UI text

## VERCEL DEPLOY
- No vercel.json needed — auto-detects static
- Just push index.html to GitHub, connect to Vercel
- Each update: `git add index.html && git commit -m "D+X update — [brief]" && git push`
- Vercel auto-deploys in ~30 seconds

## IMPORTANT RULES
- NEVER split into multiple files — stays as single index.html
- NEVER add npm/node dependencies — pure CDN only
- ALWAYS update ALL 8 language translations in LANGS{} when adding new UI text
- ALWAYS verify data has a real source before adding to dashboard
- Keep the footer "BUILT BY 𝕏 @nelson_ad" — do not modify
- Anthropic API key is entered by user in the chat panel — not hardcoded

## SESSION TASK
[Nelson will describe what to do here — read index.html first, then wait for instructions]
