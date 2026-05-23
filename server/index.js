require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cron = require('node-cron');

const roomsRouter    = require('./src/routes/rooms');
const bookingsRouter = require('./src/routes/bookings');
const donationsRouter = require('./src/routes/donations');
const adminRouter    = require('./src/routes/admin');
const { publicLimiter } = require('./src/middleware/rateLimiter');
const Booking = require('./src/models/Booking');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests (Postman, cURL) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Webhook routes: raw body MUST come before json() parser ──────────────────
// These middlewares only activate for their specific path; all other routes
// will fall through to the json() parser below.
app.use('/api/v1/bookings/webhook', express.raw({ type: 'application/json' }));
app.use('/api/v1/donations/webhook', express.raw({ type: 'application/json' }));

// ── Body parsers (everything else) ───────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Mongo sanitise ────────────────────────────────────────────────────────────
app.use(mongoSanitize());

// ── Rate limiting (public) ────────────────────────────────────────────────────
app.use('/api/', publicLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/rooms',     roomsRouter);
app.use('/api/v1/bookings',  bookingsRouter);
app.use('/api/v1/donations', donationsRouter);
app.use('/api/v1/admin',     adminRouter);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` })
);

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'An internal server error occurred.' : err.message,
  });
});

// ── Cron: expire stale PENDING bookings every 30 min ─────────────────────────
cron.schedule('*/30 * * * *', async () => {
  try {
    const cutoff = new Date(Date.now() - 45 * 60 * 1000);
    const { modifiedCount } = await Booking.updateMany(
      { status: 'PENDING', createdAt: { $lt: cutoff } },
      { $set: { status: 'EXPIRED' } }
    );
    if (modifiedCount > 0)
      console.log(`[Cron] Expired ${modifiedCount} stale booking(s)`);
  } catch (err) {
    console.error('[Cron] Error:', err.message);
  }
});

// ── DB + server start ─────────────────────────────────────────────────────────
async function start() {
  const mongoUri = process.env.MONGODB_URI || '';
  const isPlaceholder = mongoUri.includes('CHANGEME') || mongoUri === '';

  if (isPlaceholder) {
    console.warn('[DB] ⚠️  MONGODB_URI not configured — running without database.');
    console.warn('[DB]    Set a real MongoDB Atlas URI in server/.env to enable full functionality.');
    const { enableMockDb } = require('./src/utils/mockDb');
    enableMockDb();
  } else {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('[DB] ✅ Connected to MongoDB Atlas');

      // Ensure partial unique index for double-booking prevention
      await Booking.collection.createIndex(
        { roomTypeId: 1, checkIn: 1, checkOut: 1 },
        { unique: true, partialFilterExpression: { status: 'CONFIRMED' } }
      );
      console.log('[DB] Confirmed-booking unique index ensured');
    } catch (err) {
      console.error('[DB] ❌ Connection failed:', err.message);
      if (process.env.NODE_ENV === 'production') process.exit(1);
      console.warn('[DB] Continuing in degraded mode for local development…');
      mongoose.set('bufferCommands', false);
      const { enableMockDb } = require('./src/utils/mockDb');
      enableMockDb();
    }
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running → http://localhost:${PORT}`);
    console.log(`   Health check  → http://localhost:${PORT}/health`);
    console.log(`   Environment  : ${process.env.NODE_ENV || 'development'}\n`);
  });
}

start();
module.exports = app;
