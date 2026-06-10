import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const getAlerts = () => api.get('/api/alerts').then(r => r.data);

export const addAlert = (data) => api.post('/api/alerts', data).then(r => r.data);

export const updateThreshold = (id, threshold) =>
  api.patch(`/api/alerts/${id}`, { threshold }).then(r => r.data);

export const deleteAlert = (id) =>
  api.delete(`/api/alerts/${id}`).then(r => r.data);

export const fetchPrices = (coinIds) =>
  api.get('/api/prices', { params: { coins: coinIds.join(',') } }).then(r => r.data);