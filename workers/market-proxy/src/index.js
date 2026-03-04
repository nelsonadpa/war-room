/**
 * War Room — Market Data Proxy Worker
 * Fetches real market data from Yahoo Finance, caches in KV, serves to dashboard.
 *
 * Deploy: npx wrangler deploy
 * Dev:    npx wrangler dev
 */

const SYMBOLS = {
  brent:    { yf: 'BZ=F',      unit: '$', decimals: 2, label: 'Brent' },
  wti:      { yf: 'CL=F',      unit: '$', decimals: 2, label: 'WTI' },
  gold:     { yf: 'GC=F',      unit: '$', decimals: 0, label: 'Gold' },
  sp500:    { yf: '%5EGSPC',    unit: '',  decimals: 0, label: 'S&P 500' },
  dow:      { yf: '%5EDJI',     unit: '',  decimals: 0, label: 'Dow' },
  yield10y: { yf: '%5ETNX',     unit: '%', decimals: 3, label: '10Y Yield' },
  vix:      { yf: '%5EVIX',     unit: '',  decimals: 2, label: 'VIX' },
  dxy:      { yf: 'DX-Y.NYB',  unit: '',  decimals: 2, label: 'DXY' },
  eurusd:   { yf: 'EURUSD=X',  unit: '',  decimals: 4, label: 'EUR/USD' },
  gbpusd:   { yf: 'GBPUSD=X',  unit: '',  decimals: 4, label: 'GBP/USD' },
  usdjpy:   { yf: 'USDJPY=X',  unit: '',  decimals: 2, label: 'USD/JPY' },
  btcusd:   { yf: 'BTC-USD',   unit: '$', decimals: 0, label: 'BTC/USD' },
  eugas:    { yf: 'TTF=F',     unit: '€', decimals: 1, label: 'EU Gas' },
};

async function fetchYahooPrice(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; WarRoom/1.0)',
    },
  });

  if (!res.ok) throw new Error(`Yahoo ${symbol}: ${res.status}`);
  const data = await res.json();

  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error(`Yahoo ${symbol}: no meta`);

  return {
    price: meta.regularMarketPrice,
    previousClose: meta.previousClose || meta.chartPreviousClose,
    change: meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose || 0),
    changePercent: meta.previousClose
      ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100)
      : 0,
    marketState: meta.marketState || 'UNKNOWN', // PRE, REGULAR, POST, CLOSED
    currency: meta.currency || 'USD',
  };
}

async function fetchAllMarkets() {
  const results = {};
  const errors = [];

  // Fetch all in parallel with 5s timeout each
  const entries = Object.entries(SYMBOLS);
  const promises = entries.map(async ([key, cfg]) => {
    try {
      const data = await fetchYahooPrice(cfg.yf);
      results[key] = {
        ...data,
        unit: cfg.unit,
        decimals: cfg.decimals,
        label: cfg.label,
      };
    } catch (e) {
      errors.push(`${key}: ${e.message}`);
    }
  });

  await Promise.all(promises);
  return { data: results, errors, fetched_at: new Date().toISOString() };
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
  // Cron trigger: fetch and cache
  async scheduled(event, env, ctx) {
    const result = await fetchAllMarkets();
    await env.MARKETS_KV.put('markets:latest', JSON.stringify(result), {
      expirationTtl: 600, // 10 min TTL
    });

    // Also store historical snapshot
    const dateKey = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    await env.MARKETS_KV.put(`markets:${dateKey}`, JSON.stringify(result), {
      expirationTtl: 86400 * 7, // 7 days
    });
  },

  // HTTP handler: serve cached data
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (url.pathname === '/api/markets') {
      // Try cache first
      let data = await env.MARKETS_KV.get('markets:latest', 'json');

      // If cache empty or stale, fetch fresh
      if (!data) {
        data = await fetchAllMarkets();
        await env.MARKETS_KV.put('markets:latest', JSON.stringify(data), {
          expirationTtl: 600,
        });
      }

      return new Response(JSON.stringify(data), { headers: corsHeaders(env) });
    }

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', time: new Date().toISOString() }), {
        headers: corsHeaders(env),
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
