// Vercel Serverless Function — Free market data proxy
// Fetches from Yahoo Finance server-side (no CORS issues)
// Endpoint: /api/markets

const SYMBOLS = {
  brent:  'BZ=F',
  wti:    'CL=F',
  gold:   'GC=F',
  sp500:  '^GSPC',
  dow:    '^DJI',
  us10y:  '^TNX',
  vix:    '^VIX',
  dxy:    'DX-Y.NYB',
  eugas:  'TTF=F',
  vlcc:   'FRO',       // Frontline (VLCC proxy)
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');

  try {
    const tickers = Object.values(SYMBOLS).join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${tickers}&fields=regularMarketPrice,regularMarketChangePercent,shortName`;

    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!resp.ok) {
      // Fallback: try v6 endpoint
      const url2 = `https://query2.finance.yahoo.com/v6/finance/quote?symbols=${tickers}`;
      const resp2 = await fetch(url2, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!resp2.ok) throw new Error(`Yahoo API ${resp2.status}`);
      const data2 = await resp2.json();
      return res.status(200).json(formatResponse(data2.quoteResponse?.result || []));
    }

    const data = await resp.json();
    const quotes = data.quoteResponse?.result || [];
    return res.status(200).json(formatResponse(quotes));

  } catch (err) {
    return res.status(200).json({
      ok: false,
      error: err.message,
      ts: new Date().toISOString(),
      markets: getDefaults()
    });
  }
}

function formatResponse(quotes) {
  const lookup = {};
  for (const q of quotes) {
    lookup[q.symbol] = {
      price: q.regularMarketPrice,
      change: q.regularMarketChangePercent,
      name: q.shortName
    };
  }

  const markets = {};
  for (const [key, symbol] of Object.entries(SYMBOLS)) {
    const q = lookup[symbol];
    if (q) {
      markets[key] = { price: q.price, change: q.change };
    }
  }

  return {
    ok: true,
    ts: new Date().toISOString(),
    markets
  };
}

function getDefaults() {
  return {
    brent:  { price: 84.18, change: 19.0 },
    wti:    { price: 77.00, change: 15.2 },
    gold:   { price: 5187,  change: 3.8 },
    sp500:  { price: 5680,  change: -2.1 },
    dow:    { price: 41200, change: -1.8 },
    us10y:  { price: 4.12,  change: -5.0 },
    vix:    { price: 28.5,  change: 27.0 },
    dxy:    { price: 98.54, change: 1.2 },
    eugas:  { price: 48.2,  change: 38.0 },
    vlcc:   { price: 423,   change: 94.0 },
  };
}
