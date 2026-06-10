require('dotenv').config();
const express = require('express');
const cors = require('cors');
const alertRoutes = require('./routes/alerts');
const priceRoutes = require('./routes/prices');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
app.use(express.json());

app.use('/api/alerts', alertRoutes);
app.use('/api/prices', priceRoutes);

// Health check — Render pings this to keep the server alive
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));