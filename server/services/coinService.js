const axios = require('axios');

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Batch price fetch — one API call gets ALL coin prices at once
// This is what we use in production polling
const fetchBatchPrices = async (coinIds, apiKey) => {
  const response = await axios.get(`${COINGECKO_BASE}/simple/price`, {
    params: {
      ids: coinIds.join(','),
      vs_currencies: 'inr',
      include_24hr_change: true,
    },
    headers: { 'x-cg-demo-api-key': apiKey },
  });
  return response.data;
  // Returns: { bitcoin: { inr: 5234000, inr_24h_change: -2.3 }, ... }
};

// Per-coin fetch — used when we want one Promise per coin for Promise.allSettled demo
// This is what demonstrates the concurrent fetch pattern
const fetchSinglePrice = async (coinId, apiKey) => {
  const response = await axios.get(`${COINGECKO_BASE}/simple/price`, {
    params: {
      ids: coinId,
      vs_currencies: 'inr',
      include_24hr_change: true,
    },
    headers: { 'x-cg-demo-api-key': apiKey },
  });
  return {
    coinId,
    price: response.data[coinId]?.inr ?? null,
    change24h: response.data[coinId]?.inr_24h_change ?? 0,
  };
};

// THE KEY FUNCTION — fires one request per coin simultaneously
// With 20 coins this completes in ~300ms instead of 20 * 300ms = 6000ms
const fetchAllPricesConcurrently = async (coinIds, apiKey) => {
  const startTime = Date.now();

  // Promise.allSettled — never rejects even if one coin fails
  const results = await Promise.allSettled(
    coinIds.map(id => fetchSinglePrice(id, apiKey))
  );

  const elapsed = Date.now() - startTime;
  console.log(`[CoinService] Fetched ${coinIds.length} prices in ${elapsed}ms`);

  const prices = {};
  const failed = [];

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.price !== null) {
      prices[result.value.coinId] = {
        price: result.value.price,
        change24h: Math.round(result.value.change24h * 100) / 100,
      };
    } else {
      // Extract coinId from the failed promise
      const coinId = result.reason?.config?.params?.ids;
      if (coinId) failed.push(coinId);
    }
  });

  return { prices, failed, elapsed };
};

module.exports = { fetchBatchPrices, fetchSinglePrice, fetchAllPricesConcurrently }; 