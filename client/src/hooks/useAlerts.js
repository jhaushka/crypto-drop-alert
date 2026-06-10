import { useState, useEffect, useCallback, useRef } from 'react';
import { getAlerts, addAlert, updateThreshold, deleteAlert, fetchPrices } from '../api';
import toast from 'react-hot-toast';

const POLL_INTERVAL = 60; // seconds

export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(POLL_INTERVAL);
  const [lastFetchMs, setLastFetchMs] = useState(null);
  const [failedCoins, setFailedCoins] = useState([]);
  const countdownRef = useRef(null);
  const pollRef = useRef(null);

  // Load alerts from DB on mount
  useEffect(() => {
    getAlerts()
      .then(data => { setAlerts(data); setLoading(false); })
      .catch(() => { toast.error('Failed to load alerts'); setLoading(false); });
  }, []);

  // Fetch prices for all tracked coins — uses Promise.allSettled on server
  const refreshPrices = useCallback(async (alertList = alerts) => {
    if (alertList.length === 0) return;
    setRefreshing(true);

    try {
      const coinIds = alertList.map(a => a.coin_id);
      const { prices: newPrices, failed, elapsed } = await fetchPrices(coinIds);
      setPrices(newPrices);
      setFailedCoins(failed);
      setLastFetchMs(elapsed);

      // Fire browser notifications for triggered alerts
      alertList.forEach(alert => {
        const p = newPrices[alert.coin_id];
        if (p && p.price <= alert.threshold) {
          fireNotification(alert, p.price);
        }
      });
    } catch (err) {
      toast.error('Price refresh failed');
    } finally {
      setRefreshing(false);
    }
  }, [alerts]);

  // Start polling loop — refreshes every POLL_INTERVAL seconds
  useEffect(() => {
    if (alerts.length === 0) return;

    refreshPrices(alerts);
    setCountdown(POLL_INTERVAL);

    pollRef.current = setInterval(() => {
      refreshPrices(alerts);
      setCountdown(POLL_INTERVAL);
    }, POLL_INTERVAL * 1000);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : POLL_INTERVAL));
    }, 1000);

    return () => {
      clearInterval(pollRef.current);
      clearInterval(countdownRef.current);
    };
  }, [alerts.length]); // re-run when number of tracked coins changes

  // Add coin — POST then refresh prices
  const addCoin = async (coinData) => {
    const newAlert = await addAlert(coinData);
    setAlerts(prev => [newAlert, ...prev]);
    toast.success(`Now tracking ${coinData.coin_name}`);
    return newAlert;
  };

  // Update threshold — OPTIMISTIC UI pattern
  // Updates UI immediately, PATCH in background, rolls back on failure
  const updateAlert = async (id, newThreshold) => {
    const oldAlerts = alerts;

    // Step 1: optimistic update — UI changes instantly
    setAlerts(prev =>
      prev.map(a => a.id === id ? { ...a, threshold: newThreshold } : a)
    );

    try {
      // Step 2: sync with server in background
      await updateThreshold(id, newThreshold);
      // success — UI is already correct, nothing to do
    } catch (err) {
      // Step 3: rollback — server failed, revert UI
      setAlerts(oldAlerts);
      toast.error('Failed to save threshold — reverted');
    }
  };

  // Delete coin
  const removeCoin = async (id) => {
    const coin = alerts.find(a => a.id === id);
    setAlerts(prev => prev.filter(a => a.id !== id));
    try {
      await deleteAlert(id);
      toast.success(`Removed ${coin?.coin_name}`);
    } catch {
      toast.error('Failed to remove');
    }
  };

  // Compute processed alerts — adds dropPercent, triggered flag
  const processedAlerts = alerts.map(alert => {
    const priceData = prices[alert.coin_id];
    return {
      ...alert,
      currentPrice: priceData?.price ?? null,
      change24h: priceData?.change24h ?? 0,
      triggered: priceData ? priceData.price <= alert.threshold : false,
      failed: failedCoins.includes(alert.coin_id),
    };
  }).sort((a, b) => {
    // triggered alerts always first, then sort by 24h change ascending (biggest drops first)
    if (a.triggered && !b.triggered) return -1;
    if (!a.triggered && b.triggered) return 1;
    return a.change24h - b.change24h;
  });

  return {
    alerts: processedAlerts,
    loading,
    refreshing,
    countdown,
    lastFetchMs,
    addCoin,
    updateAlert,
    removeCoin,
    refreshPrices: () => refreshPrices(alerts),
  };
};

// Browser notification
const notifiedAlerts = new Set();
const fireNotification = (alert, currentPrice) => {
  const key = `${alert.id}-${Math.floor(currentPrice / 1000)}`;
  if (notifiedAlerts.has(key)) return; // don't spam
  notifiedAlerts.add(key);

  if (Notification.permission === 'granted') {
    new Notification(`🔴 Price Alert: ${alert.coin_name}`, {
      body: `${alert.coin_symbol.toUpperCase()} is ₹${currentPrice.toLocaleString('en-IN')} — below your ₹${alert.threshold.toLocaleString('en-IN')} target`,
      icon: '/favicon.ico',
    });
  }
};