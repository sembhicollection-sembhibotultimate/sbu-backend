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
const publicRoutes = require('./routes/public');

const app = express();

// Start server services
async function startServer() {
  try {
    await connectDB();
    console.log('🚀 Server ready');
  } catch (error) {
    console.error('❌ Startup error:', error.message);
  }
}

startServer();

// IMPORTANT:
// Stripe webhook route MUST stay before express.json()
app.use('/api/webhook', webhookRoutes);

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true
  })
);

// JSON parser
app.use(express.json());

// Other routes
app.use('/api/admin-tools', adminToolsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'SBU backend running',
    time: new Date()
  });
});

// Root
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
