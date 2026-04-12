require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db');

const adminRoutes = require('./routes/admin');
const portalRoutes = require('./routes/portal');
const webhookRoutes = require('./routes/webhook');

const app = express();

connectDB();

app.use('/api/webhook', webhookRoutes);
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'SBU backend running successfully' });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    env: process.env.NODE_ENV || 'development',
    mongo: 'connected if no startup error',
    time: new Date().toISOString()
  });
});

app.use('/api/admin', adminRoutes);
app.use('/api/portal', portalRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
