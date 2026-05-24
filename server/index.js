const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const roomsRouter    = require('./src/routes/rooms');
const bookingsRouter = require('./src/routes/bookings');
const donationsRouter = require('./src/routes/donations');
const adminRouter    = require('./src/routes/admin');
const { publicLimiter } = require('./src/middleware/rateLimiter');
const Booking  = require('./src/models/Booking');
const RoomType = require('./src/models/RoomType');
const Admin    = require('./src/models/Admin');

const app  = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://rudraprayag.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app') || /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Webhook routes: raw body MUST come before json() parser ──────────────────
app.use(['/api/v1/bookings/webhook', '/v1/bookings/webhook'], express.raw({ type: 'application/json' }));
app.use(['/api/v1/donations/webhook', '/v1/donations/webhook'], express.raw({ type: 'application/json' }));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Mongo sanitise ────────────────────────────────────────────────────────────
app.use(mongoSanitize());

// ── Rate limiting (public) ────────────────────────────────────────────────────
app.use(['/api/', '/v1/'], publicLimiter);

// ── DB connection (lazy — safe for serverless cold starts) ────────────────────
let dbPromise = null;
let dbReady = false;

async function getDbConnection() {
  if (!dbPromise) {
    dbPromise = initDb();
  }
  return dbPromise;
}

async function initDb() {
  const mongoUri = process.env.MONGODB_URI || '';
  const isPlaceholder = mongoUri.includes('CHANGEME') || mongoUri === '';

  if (isPlaceholder) {
    console.warn('[DB] ⚠️  MONGODB_URI not configured — running MockDB.');
    const { enableMockDb } = require('./src/utils/mockDb');
    enableMockDb();
    return;
  }

  if (mongoose.connection.readyState === 1) return; // already connected

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('[DB] ✅ Connected to MongoDB Atlas');

    // Ensure partial unique index for double-booking prevention
    await Booking.collection.createIndex(
      { roomTypeId: 1, checkIn: 1, checkOut: 1 },
      { unique: true, partialFilterExpression: { status: 'CONFIRMED' } }
    );

    // Auto-seed rooms
    const roomsCount = await RoomType.countDocuments();
    if (roomsCount === 0) {
      await RoomType.insertMany([
        {
          name: "Ganga View Deluxe Room",
          capacity: 3,
          pricePerNight: 2500,
          gstRate: 0.12,
          isActive: true,
          description: "Beautiful room with a direct view of the sacred Ganga Sangam.",
          blockedDates: []
        },
        {
          name: "Sangam Standard Room",
          capacity: 2,
          pricePerNight: 1500,
          gstRate: 0.12,
          isActive: true,
          description: "Comfortable standard room close to the temple ghats.",
          blockedDates: []
        },
        {
          name: "Family Pilgrim Suite",
          capacity: 6,
          pricePerNight: 4000,
          gstRate: 0.12,
          isActive: true,
          description: "Spacious suite designed for families and group pilgrims.",
          blockedDates: []
        }
      ]);
      console.log('[DB] ✅ Default room types seeded.');
    }

    // Auto-seed admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('Password@rudrprayad', 10);
      await Admin.create({ email: 'owner@dharamshala.com', passwordHash });
      console.log('[DB] ✅ Default admin seeded.');
    }
  } catch (err) {
    console.error('[DB] ❌ Connection failed:', err.message);
    const { enableMockDb } = require('./src/utils/mockDb');
    enableMockDb();
  } finally {
    dbReady = true;
  }
}

// ── Middleware: ensure DB is ready before any API request ─────────────────────
app.use(['/api', '/v1'], async (req, res, next) => {
  try {
    await getDbConnection();
    next();
  } catch (err) {
    next(err);
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), dbReady })
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use(['/api/v1/rooms', '/v1/rooms'],         roomsRouter);
app.use(['/api/v1/bookings', '/v1/bookings'],   bookingsRouter);
app.use(['/api/v1/donations', '/v1/donations'], donationsRouter);
app.use(['/api/v1/admin', '/v1/admin'],         adminRouter);

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

// ── Cron (only in non-serverless environments) ────────────────────────────────
if (!process.env.VERCEL) {
  const cron = require('node-cron');
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
}

// ── Local dev server start ────────────────────────────────────────────────────
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running → http://localhost:${PORT}`);
    console.log(`   Health check  → http://localhost:${PORT}/health`);
    console.log(`   Environment  : ${process.env.NODE_ENV || 'development'}\n`);
  });
  getDbConnection(); // Connect to DB asynchronously in the background
}

module.exports = app;
