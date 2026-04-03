require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initCronJobs } = require('./services/cronService');

// Route imports
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const investmentRoutes = require('./routes/investments');
const aiRoutes = require('./routes/ai');
const emailRoutes = require('./routes/email');

// Connect to MongoDB
connectDB();

const app = express();

// Trust reverse proxies like ngrok
app.set('trust proxy', 1);

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : true, // Allow all origins in development
    credentials: true,
  })
);

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Static files (.well-known for App Links) ────────────────────────────────
app.use(express.static(require('path').join(__dirname, '../public')));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'MoneyMind AI Backend',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/investments', investmentRoutes);
app.use('/ai', aiRoutes);
app.use('/email', emailRoutes);

// ─── App Link pass-through (Android App Links redirect to app) ───────────────
// These URLs are only visited if the app is not installed; show a fallback page.
app.get('/app/*', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>MoneyMind AI</title></head>
<body style="background:#0A0A1A;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px;text-align:center;padding:24px;">
<p style="font-size:20px;font-weight:700;">MoneyMind AI</p>
<p style="color:#888;">Please install the MoneyMind AI app to continue.</p>
</body></html>`);
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 MoneyMind AI Backend running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
  
  // Start background cron jobs (SIP parsing, live pricing)
  initCronJobs();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
