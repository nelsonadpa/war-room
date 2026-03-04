# White-Label Configuration — Specification

## Overview
Allow newsrooms, think tanks, and organizations to embed a customized version of the war room dashboard under their own branding.

## Customization Layers

### Layer 1: Branding (CSS Variables)
```css
:root {
  --wl-bg: #040810;          /* Background */
  --wl-accent: #ef4444;      /* Primary accent (red) */
  --wl-logo-url: url(...);   /* Customer logo */
  --wl-logo-text: 'WAR ROOM'; /* Or customer name */
  --wl-footer: 'Powered by war-room.live';
}
```

### Layer 2: Content Filter
```javascript
const WL_CONFIG = {
  // Which panels to show
  panels: ['events', 'markets', 'kahn', 'pmesii', 'scenarios'],
  // panels: ['events', 'markets'], // Minimal version

  // Languages (subset)
  languages: ['en', 'es', 'fr'],

  // Conflicts to show
  conflicts: ['iran-usa-israel-2026'],

  // Market symbols
  markets: ['brent', 'gold', 'vix'],

  // Features
  showChat: true,
  showWorldMap: false,
  showIntel: true,
  showEmbed: false,

  // Data freshness
  maxEventAge: 48, // hours — only show events from last 48h
};
```

### Layer 3: Data Source Attribution
```javascript
const WL_ATTRIBUTION = {
  showSources: true,        // Show source labels on events
  showConfidence: false,     // Hide confidence scores
  customDisclaimer: 'Data provided by war-room.live. Verify independently.',
  hideFooter: false,         // Can't hide "Powered by" on basic tier
};
```

## White-Label Tiers

### Tier 1: Embed Widget ($included in Professional)
- iframe embed (embed.html)
- Shows: Kahn level, 3 market cells, 3 latest events
- Branding: "Powered by war-room.live" footer
- Size: 400px wide, responsive

### Tier 2: Branded Dashboard ($499/mo)
- Full dashboard with custom CSS variables
- Customer logo replaces "WAR ROOM"
- Custom color scheme
- "Powered by war-room.live" in footer (small)
- Choose which panels to display
- Subset of languages
- Custom domain support (CNAME)
- Up to 5 conflicts

### Tier 3: Full White-Label ($2,000+/yr)
- Everything in Tier 2
- No "Powered by" branding (fully white-labeled)
- Custom footer text
- Custom data sources (add their own feeds)
- API access with custom endpoints
- Priority data: events tagged for their coverage area
- Dedicated support + SLA
- Unlimited conflicts
- Custom AI system prompt (their editorial guidelines)

## Implementation

### Embed (Already Built)
```html
<!-- Customer paste this -->
<iframe
  src="https://war-room.live/embed?theme=dark&markets=brent,gold,vix"
  width="400" height="500"
  frameborder="0"
  style="border-radius:8px;"
></iframe>
```

### Branded Dashboard
1. Customer signs up → gets config ID
2. Dashboard loads with: `war-room.live/?wl=CUSTOMER_ID`
3. Config fetched from KV → CSS variables + panel config applied
4. Or: CNAME `intel.their-domain.com` → same config

```javascript
// On load, check for white-label config
const wlId = new URLSearchParams(location.search).get('wl');
if (wlId) {
  const cfg = await fetch(`/api/wl/${wlId}`).then(r => r.json());
  applyWhiteLabel(cfg);
}

function applyWhiteLabel(cfg) {
  // Apply CSS variables
  Object.entries(cfg.css || {}).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });
  // Hide/show panels
  if (cfg.panels) {
    document.querySelectorAll('.intel-card').forEach(card => {
      const id = card.id.replace('intel-', '');
      card.style.display = cfg.panels.includes(id) ? '' : 'none';
    });
  }
  // Update logo
  if (cfg.logoText) {
    document.querySelector('.logo').textContent = cfg.logoText;
  }
  // Language subset
  if (cfg.languages) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const lang = btn.getAttribute('data-lang');
      btn.style.display = cfg.languages.includes(lang) ? '' : 'none';
    });
  }
}
```

### CF Worker: White-Label Config
```javascript
// GET /api/wl/:id
async function handleWL(id, env) {
  const cfg = await env.WL_KV.get(`wl:${id}`, 'json');
  if (!cfg) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(cfg), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=300' }
  });
}
```

## Target Customers
| Segment | Example | Tier | Price |
|---------|---------|------|-------|
| News blogs | Bellingcat, War on the Rocks | Embed | $199/mo (Pro) |
| Regional newsrooms | Al Jazeera English, Folha | Branded | $499/mo |
| Think tanks | CSIS, Chatham House, IISS | Branded | $499/mo |
| Wire services | Reuters, AP | Full WL | $2,000+/yr |
| Government/Defense | NATO, CENTCOM comms | Full WL | Custom |
| Universities | Georgetown SFS, KCL War Studies | Branded (50% off) | $250/mo |

## Sales Process
1. Customer fills contact form on /pricing
2. 15-min demo call
3. Config created in KV (< 5 min setup)
4. Customer gets embed code or CNAME instructions
5. Ongoing: monthly usage reports, quarterly review
