require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db');

const adminRoutes = require('./routes/admin');
const portalRoutes = require('./routes/portal');
const webhookRoutes = require('./routes/webhook');
const authRoutes = require('./routes/auth');
const checkoutRoutes = require('./routes/checkout');
const licenseRoutes = require('./routes/license');

const app = express();

connectDB();

// Stripe webhook route sab ton pehla hona chahida
app.use('/api/webhook', webhookRoutes);

// Normal middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SBU backend running successfully'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    env: process.env.NODE_ENV || 'development',
    mongo: 'connected if no startup error',
    time: new Date().toISOString()
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Checkout route
app.use('/api', checkoutRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Portal routes
app.use('/api/portal', portalRoutes);

// License validate routes
app.use('/api/license', licenseRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
