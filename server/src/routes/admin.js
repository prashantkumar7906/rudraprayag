const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const Booking = require('../models/Booking');
const Donation = require('../models/Donation');
const Token = require('../models/Token');
const { verifyAdminToken } = require('../middleware/verifyAdminToken');
const { adminLoginLimiter } = require('../middleware/rateLimiter');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const router = express.Router();

// ── POST /admin/login ──
router.post('/login',
  adminLoginLimiter,
  [
    body('email').isEmail().withMessage('Valid email required.'),
    body('password').notEmpty().withMessage('Password required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { email, password } = req.body;

    try {
      const admin = await Admin.findOne({ email: email.toLowerCase() });
      if (!admin) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      admin.lastLoginAt = new Date();
      await admin.save();

      const token = jwt.sign(
        { adminId: admin._id, email: admin.email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({ success: true, token });
    } catch (err) {
      console.error('[Admin] login error:', err.message);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  }
);

// ── GET /admin/dashboard — stats ──
router.get('/dashboard', verifyAdminToken, async (req, res) => {
  try {
    const [totalBookings, confirmedBookings, donationAgg, activeTokens, usedTokens] = await Promise.all([
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: 'CONFIRMED' } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$priceBreakdown.totalAmount' } } },
      ]),
      Donation.aggregate([
        { $match: { status: 'CONFIRMED' } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      Token.countDocuments({ status: 'ACTIVE' }),
      Token.countDocuments({ status: 'USED' }),
    ]);

    res.json({
      totalBookings,
      confirmedBookings: confirmedBookings[0]?.count || 0,
      totalRevenue: confirmedBookings[0]?.total || 0,
      donationCount: donationAgg[0]?.count || 0,
      donationTotal: donationAgg[0]?.total || 0,
      activeTokens,
      usedTokens,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
});

// ── GET /admin/bookings ──
router.get('/bookings', verifyAdminToken, async (req, res) => {
  const { startDate, endDate, roomTypeId, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status && status !== 'ALL') filter.status = status;
  if (roomTypeId) filter.roomTypeId = roomTypeId;
  if (startDate || endDate) {
    filter.checkIn = {};
    if (startDate) filter.checkIn.$gte = new Date(startDate);
    if (endDate) filter.checkIn.$lte = new Date(endDate);
  }

  try {
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Booking.countDocuments(filter);
    res.json({ success: true, data: bookings, total, page: Number(page), limit: Number(limit) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// ── PATCH /admin/bookings/:id/cancel ──
router.patch('/bookings/:id/cancel',
  verifyAdminToken,
  [body('reason').trim().notEmpty().withMessage('Cancellation reason is required.')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) return res.status(404).json({ error: 'Booking not found.' });
      if (booking.status !== 'CONFIRMED') {
        return res.status(400).json({ error: 'Only CONFIRMED bookings can be cancelled.' });
      }

      booking.status = 'CANCELLED';
      booking.cancellationReason = req.body.reason;
      booking.cancelledAt = new Date();
      await booking.save();

      const { sendCancellationEmail } = require('../email/templates');
      sendCancellationEmail(booking).catch(e => console.error('[Email] Cancel email error:', e.message));

      res.json({ success: true, data: booking });
    } catch {
      res.status(500).json({ error: 'Cancellation failed.' });
    }
  }
);

// ── GET /admin/donations ──
router.get('/donations', verifyAdminToken, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  try {
    const donations = await Donation.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Donation.countDocuments();
    res.json({ success: true, data: donations, total });
  } catch {
    res.status(500).json({ error: 'Failed to fetch donations.' });
  }
});

// ── GET /admin/tokens — Admin: list tokens ──
router.get('/tokens', verifyAdminToken, async (req, res) => {
  const { type, status, paymentMethod, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (type && type !== 'ALL') filter.type = type;
  if (status && status !== 'ALL') filter.status = status;
  if (paymentMethod && paymentMethod !== 'ALL') filter.paymentMethod = paymentMethod;
  if (search) {
    const escapedSearch = escapeRegExp(search.trim());
    const searchRegex = new RegExp(escapedSearch, 'i');
    filter.$or = [
      { tokenNumber: searchRegex },
      { name: searchRegex },
      { email: searchRegex },
    ];
  }

  try {
    const tokens = await Token.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('bookingId')
      .populate('donationId');
    const total = await Token.countDocuments(filter);
    res.json({ success: true, data: tokens, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tokens.' });
  }
});

// ── PATCH /admin/tokens/:id/status — Admin: update status ──
router.patch('/tokens/:id/status',
  verifyAdminToken,
  [body('status').isIn(['ACTIVE', 'USED', 'EXPIRED']).withMessage('Invalid status.')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
      const token = await Token.findById(req.params.id);
      if (!token) return res.status(404).json({ error: 'Token not found.' });

      token.status = req.body.status;
      await token.save();

      res.json({ success: true, data: token });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update token status.' });
    }
  }
);

module.exports = router;
