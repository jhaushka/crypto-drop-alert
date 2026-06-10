const express = require('express');
const { fetchAllPricesConcurrently } = require('../services/coinService');
const router = express.Router();

// GET /api/prices?coins=bitcoin,ethereum,solana
// Fires one concurrent request per coin using Promise.allSettled
router.get('/', async (req, res) => {
  const { coins } = req.query;

  if (!coins) return res.status(400).json({ error: 'coins query param required' });

  const coinIds = coins.split(',').map(c => c.trim()).filter(Boolean);

  if (coinIds.length === 0) return res.status(400).json({ error: 'No valid coin IDs' });
  if (coinIds.length > 50) return res.status(400).json({ error: 'Max 50 coins per request' });

  try {
    const { prices, failed, elapsed } = await fetchAllPricesConcurrently(
      coinIds,
      process.env.COINGECKO_API_KEY
    );
    res.json({ prices, failed, elapsed, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[Prices] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

module.exports = router;