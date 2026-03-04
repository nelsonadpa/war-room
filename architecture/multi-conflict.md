# Multi-Conflict Auto-Generation — Architecture

## Overview
Replicate the war-room.live dashboard for any active conflict. Each conflict gets its own dashboard instance with shared infrastructure.

## Conflict Template Variables

Every conflict dashboard is generated from a config object:

```javascript
const CONFLICT = {
  id: 'iran-usa-israel-2026',
  name: 'Iran-USA-Israel 2026',
  slug: 'iran-usa-israel-2026',
  startDate: '2026-02-28',
  dayCount: 5, // D+5
  status: 'active', // active | frozen | resolved

  // Kahn
  kahnLevel: 8,
  kahnName: 'Full Regional War',

  // Actors
  actors: {
    blue: { name: 'US + Israel', flag: '🇺🇸🇮🇱' },
    red: { name: 'Iran + Proxies', flag: '🇮🇷' },
    neutral: ['🇨🇳 China', '🇮🇳 India', '🇹🇷 Turkey'],
  },

  // Map
  mapCenter: [29, 47],
  mapZoom: 5,
  theaters: ['Persian Gulf', 'E. Mediterranean', 'Indian Ocean', 'Lebanon', 'Yemen'],

  // Markets
  primaryCommodity: 'brent',
  marketSymbols: ['brent', 'gold', 'vix', 'dxy'],

  // Data sources
  sources: {
    tier1: ['CENTCOM', 'Pentagon', 'IDF'],
    tier2: ['Reuters', 'AP', 'Al Jazeera'],
    tier3: ['NetBlocks', 'FlightRadar24'],
  },

  // Languages (subset of 8)
  languages: ['en', 'es', 'fr', 'ar', 'fa'],

  // SEO
  keywords: ['Iran war 2026', 'Hormuz closed', ...],
};
```

## Planned Conflict Expansions

### 1. Ukraine-Russia (existing conflict)
```javascript
{
  id: 'ukraine-russia',
  name: 'Ukraine-Russia War',
  startDate: '2022-02-24',
  kahnLevel: 7,
  actors: { blue: 'Ukraine + NATO', red: 'Russia' },
  mapCenter: [49, 32], mapZoom: 6,
  primaryCommodity: 'wheat', // Different market focus
  languages: ['en', 'es', 'fr', 'ru', 'zh'],
}
```

### 2. Taiwan Strait (potential)
```javascript
{
  id: 'taiwan-strait',
  name: 'Taiwan Strait Crisis',
  status: 'monitoring',
  kahnLevel: 3, // Sanctions/coercion
  actors: { blue: 'Taiwan + US', red: 'China' },
  mapCenter: [24, 121], mapZoom: 6,
  primaryCommodity: 'semiconductors',
  languages: ['en', 'es', 'zh', 'ja'],
}
```

### 3. Sudan Civil War (existing)
```javascript
{
  id: 'sudan-civil-war',
  name: 'Sudan Civil War',
  startDate: '2023-04-15',
  kahnLevel: 6,
  actors: { blue: 'SAF', red: 'RSF' },
  mapCenter: [15.5, 32.5], mapZoom: 6,
  primaryCommodity: 'gold',
  languages: ['en', 'ar', 'fr'],
}
```

## Generation Approach

### Phase 1: Template Engine (Static)
1. Base `index.html` becomes a template with `{{VARIABLE}}` placeholders
2. Build script reads conflict config → replaces variables → outputs HTML
3. Each conflict deploys to `/conflicts/{slug}/` or subdomain `{slug}.war-room.live`

```bash
# Build script
node scripts/generate.js --conflict=ukraine-russia
# Outputs: dist/ukraine-russia/index.html
```

### Phase 2: Dynamic SPA
1. Single app loads conflict config from API
2. URL determines conflict: `war-room.live/c/ukraine-russia`
3. Shared components, conflict-specific data
4. Still no framework — vanilla JS with dynamic rendering

### Phase 3: CMS + Auto-Generation
1. Admin panel to create new conflicts
2. AI generates initial content from news sources
3. Human review before publish
4. Automated daily updates via event ingestion worker

## URL Structure
```
war-room.live/                           → Conflict hub (all active)
war-room.live/c/iran-usa-israel-2026     → Iran dashboard
war-room.live/c/ukraine-russia           → Ukraine dashboard
war-room.live/c/taiwan-strait            → Taiwan dashboard
war-room.live/conflicts/iran-...         → SEO static page
war-room.live/api/conflicts              → List all conflicts
```

## Shared Infrastructure
```
[Conflict Hub Page]
       ↓
  ┌────┴────┐
  │ CF Workers │ (shared market + event workers)
  │ per-conflict KV namespaces │
  └────┬────┘
       ↓
  [Per-Conflict Dashboard]
  - Own event log
  - Own Kahn level
  - Own market focus
  - Shared i18n system
  - Shared AI chat (context-switched)
```

## Implementation Timeline
1. **Week 1-2**: Extract template variables from current index.html
2. **Week 2-3**: Build generation script + first template
3. **Week 3-4**: Generate Ukraine-Russia dashboard
4. **Week 4-6**: Conflict hub landing page
5. **Month 2+**: Dynamic SPA migration
