const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const RoomType = require('../models/RoomType');
const { generateBookingId, generateTokenId } = require('../utils/idGenerator');
const Token = require('../models/Token');
const { sendBookingConfirmation, sendAdminBookingAlert, sendCancellationEmail } = require('../email/templates');
const { verifyAdminToken } = require('../middleware/verifyAdminToken');
const { bookingInitiateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// ── POST /bookings/initiate ──
router.post('/initiate',
  bookingInitiateLimiter,
  [
    body('roomTypeId').notEmpty().withMessage('Room type is required.'),
    body('checkIn').isISO8601().withMessage('Valid check-in date required.'),
    body('checkOut').isISO8601().withMessage('Valid check-out date required.'),
    body('guests').isInt({ min: 1, max: 6 }).withMessage('Guests must be between 1 and 6.'),
    body('guestName').trim().notEmpty().withMessage('Guest name is required.'),
    body('guestEmail').isEmail().withMessage('Valid email is required.'),
    body('guestPhone').custom((value, { req }) => {
      if (req.body.citizenship === 'Indian') {
        if (!/^[6-9]\d{9}$/.test(value)) throw new Error('Valid Indian phone number required.');
      } else {
        if (!value || value.length < 8) throw new Error('Valid phone number required.');
      }
      return true;
    }),
    body('citizenship').isIn(['Indian', 'Foreigner']).withMessage('Valid citizenship is required.'),
    body('idType').notEmpty().withMessage('ID Type is required.'),
    body('idNumber').trim().notEmpty().withMessage('ID Number is required.'),
  ],
  async (req, res) => {
    // Honeypot check
    if (req.body.website && req.body.website !== '') {
      return res.status(400).json({ error: 'Invalid request.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { roomTypeId, checkIn, checkOut, guests, guestName, guestEmail, guestPhone, citizenship, idType, idNumber, specialRequests } = req.body;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ error: 'Check-out must be after check-in.' });
    }
    if (checkInDate < new Date()) {
      return res.status(400).json({ error: 'Check-in date cannot be in the past.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Fetch room
      const room = await RoomType.findById(roomTypeId).session(session);
      if (!room || !room.isActive) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'Room type not found.' });
      }

      // 2. Check guest count
      if (guests > room.capacity) {
        await session.abortTransaction();
        return res.status(400).json({ error: `This room supports maximum ${room.capacity} guests.` });
      }

      // 3. Check availability within transaction
      const conflict = await Booking.findOne({
        roomTypeId,
        status: 'CONFIRMED',
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate },
      }).session(session);

      if (conflict) {
        await session.abortTransaction();
        return res.status(409).json({ error: 'ROOM_NOT_AVAILABLE', message: 'Room is not available for selected dates.' });
      }

      // 4. Calculate pricing
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      const baseAmount = room.pricePerNight * nights;
      const gstAmount = Math.round(baseAmount * room.gstRate);
      const totalAmount = baseAmount + gstAmount;

      // 5. Create Razorpay order or handle CASH
      const bookingIdValue = generateBookingId();
      const isCash = req.body.paymentMethod === 'CASH';
      let orderId = 'CASH';
      let bookingStatus = 'PENDING';
      let rzpAmount = 0;

      if (isCash) {
        bookingStatus = 'CONFIRMED';
      } else {
        const order = await razorpay.orders.create({
          amount: totalAmount * 100, // paise
          currency: 'INR',
          receipt: bookingIdValue,
          notes: { bookingId: bookingIdValue, guestName, guestEmail },
        });
        orderId = order.id;
        rzpAmount = order.amount;
      }

      // 6. Create booking
      const [booking] = await Booking.create([{
        bookingId: bookingIdValue,
        roomTypeId,
        roomTypeName: room.name,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        guests,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim().toLowerCase(),
        guestPhone,
        citizenship,
        idType,
        idNumber: idNumber.trim(),
        specialRequests: (specialRequests || '').trim(),
        priceBreakdown: { baseAmount, gstAmount, totalAmount },
        razorpayOrderId: isCash ? undefined : orderId,
        paymentMethod: isCash ? 'CASH' : 'ONLINE',
        status: bookingStatus,
      }], { session });

      // If CASH, create a Token instantly
      if (isCash) {
        const tokenNum = generateTokenId();
        await Token.create([{
          tokenNumber: tokenNum,
          type: 'BOOKING',
          bookingId: booking._id,
          amount: totalAmount,
          name: booking.guestName,
          email: booking.guestEmail,
          phone: booking.guestPhone,
          paymentMethod: 'CASH',
          status: 'ACTIVE'
        }], { session });
      }

      await session.commitTransaction();

      // Trigger confirmation email for CASH booking
      if (isCash) {
        sendBookingConfirmation(booking).catch(e => console.error('[Email] Confirmation email failed:', e.message));
        sendAdminBookingAlert(booking).catch(e => console.error('[Email] Admin alert failed:', e.message));
      }

      res.status(201).json({
        success: true,
        bookingId: booking.bookingId,
        paymentMethod: isCash ? 'CASH' : 'ONLINE',
        razorpayOrderId: isCash ? null : orderId,
        amount: isCash ? totalAmount * 100 : rzpAmount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err) {
      await session.abortTransaction();
      console.error('[Booking] initiate error:', err.message);
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Room already booked. Please try again.' });
      }
      res.status(500).json({ error: 'Booking initiation failed. Please try again.' });
    } finally {
      session.endSession();
    }
  }
);

// ── POST /bookings/webhook — Razorpay webhook (raw body) ──
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['x-razorpay-signature'];
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');

    if (sig !== expected) {
      console.warn('[Webhook] Invalid signature received');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    let event;
    try {
      event = JSON.parse(req.body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      await confirmBooking(payment);
    }

    res.json({ status: 'ok' });
  }
);

// Idempotent booking confirmation
async function confirmBooking(payment) {
  try {
    const booking = await Booking.findOne({ razorpayOrderId: payment.order_id });
    if (!booking) {
      console.warn('[Webhook] Booking not found for order:', payment.order_id);
      return;
    }
    if (booking.status === 'CONFIRMED') {
      console.log('[Webhook] Booking already confirmed (idempotent):', booking.bookingId);
      return;
    }

    booking.status = 'CONFIRMED';
    booking.razorpayPaymentId = payment.id;
    await booking.save();

    // Idempotent Token creation for ONLINE booking
    const existingToken = await Token.findOne({ bookingId: booking._id });
    if (!existingToken) {
      const tokenNum = generateTokenId();
      await Token.create({
        tokenNumber: tokenNum,
        type: 'BOOKING',
        bookingId: booking._id,
        amount: booking.priceBreakdown.totalAmount,
        name: booking.guestName,
        email: booking.guestEmail,
        phone: booking.guestPhone,
        paymentMethod: 'ONLINE',
        status: 'ACTIVE'
      });
      console.log('[Webhook] Generated online booking token:', tokenNum);
    }

    // Send emails (non-blocking)
    const emailSent = await sendBookingConfirmation(booking);
    if (emailSent) {
      booking.emailSentAt = new Date();
      await booking.save();
    }
    sendAdminBookingAlert(booking).catch(e => console.error('[Email] Admin alert failed:', e.message));

    console.log('[Webhook] Booking confirmed:', booking.bookingId);
  } catch (err) {
    console.error('[Webhook] confirmBooking error:', err.message);
  }
}

// ── GET /bookings/:bookingId — public status check ──
router.get('/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
      .select('-__v');
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const token = await Token.findOne({ bookingId: booking._id }).select('-__v');
    res.json({ success: true, data: booking, token });
  } catch {
    res.status(500).json({ error: 'Failed to fetch booking.' });
  }
});

// ── GET /admin/bookings — Admin: list bookings ──
router.get('/admin/list',
  verifyAdminToken,
  async (req, res) => {
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
  }
);

// ── PATCH /admin/bookings/:id/cancel — Admin: cancel booking ──
router.patch('/admin/:id/cancel',
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

      // Expire associated token
      await Token.findOneAndUpdate(
        { bookingId: booking._id },
        { status: 'EXPIRED' }
      );

      // Send cancellation email
      sendCancellationEmail(booking).catch(e => console.error('[Email] Cancellation email failed:', e.message));

      res.json({ success: true, data: booking });
    } catch {
      res.status(500).json({ error: 'Cancellation failed.' });
    }
  }
);

module.exports = router;
module.exports.confirmBooking = confirmBooking;
