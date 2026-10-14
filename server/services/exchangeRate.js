/**
 * Anlık USD/TRY kuru. Önce Yahoo (dakikalık), ulaşılamazsa günlük kaynaklar.
 * Sonuç 10 dakika bellekte tutulur; hepsi düşerse son bilinen kur döner.
 */
const TTL_MS = 10 * 60_000;
const TIMEOUT_MS = 5000;

const SOURCES = [
  {
    name: 'yahoo',
    url: 'https://query1.finance.yahoo.com/v8/finance/chart/USDTRY=X?interval=1m&range=1d',
    read: (json) => json?.chart?.result?.[0]?.meta?.regularMarketPrice
  },
  {
    name: 'er-api',
    url: 'https://open.er-api.com/v6/latest/USD',
    read: (json) => json?.rates?.TRY
  },
  {
    name: 'frankfurter',
    url: 'https://api.frankfurter.app/latest?from=USD&to=TRY',
    read: (json) => json?.rates?.TRY
  }
];

let cache = null;
let inflight = null;

const fetchRate = async () => {
  for (const source of SOURCES) {
    try {
      const response = await fetch(source.url, {
        headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0 (NikBag rates)' },
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      if (!response.ok) continue;
      const rate = Number(source.read(await response.json()));
      if (Number.isFinite(rate) && rate > 1) {
        return { usdTry: Number(rate.toFixed(4)), source: source.name, updatedAt: new Date().toISOString() };
      }
    } catch (error) {
      console.warn(`[kur] ${source.name}: ${error.message}`);
    }
  }
  return null;
};

const getUsdTry = async () => {
  if (cache && Date.now() - new Date(cache.updatedAt).getTime() < TTL_MS) return cache;
  if (!inflight) {
    inflight = fetchRate()
      .then((fresh) => {
        if (fresh) cache = fresh;
        return cache;
      })
      .finally(() => { inflight = null; });
  }
  const result = await inflight;
  if (result) return result;
  const fallback = Number(process.env.USD_TRY_FALLBACK || 0);
  return fallback > 1 ? { usdTry: fallback, source: 'env', updatedAt: null } : null;
};

module.exports = { getUsdTry };
