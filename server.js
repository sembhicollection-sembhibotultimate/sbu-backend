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
const adminToolsRoutes = require('./routes/adminTools');

const { verifyEmailServer } = require('./services/emailService');

const app = express();

// START SERVER PROPER WAY
async function startServer() {
  try {
    await connectDB();
    await verifyEmailServer();

    console.log('🚀 Server ready');
  } catch (err) {
    console.error('❌ Startup error:', err.message);
  }
}

startServer();

// IMPORTANT: webhook BEFORE json
app.use('/api/webhook', webhookRoutes);

// other routes
app.use('/api/admin-tools', adminToolsRoutes);

// middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

app.use(express.json());

// routes
app.use('/api/admin', adminRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/license', licenseRoutes);

// health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SBU backend running',
    time: new Date()
  });
});

// root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SBU backend running successfully'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});
