const express = require('express');
const { body, query, validationResult } = require('express-validator');
const RoomType = require('../models/RoomType');
const Booking = require('../models/Booking');
const { verifyAdminToken } = require('../middleware/verifyAdminToken');

const router = express.Router();

// ── GET /rooms — all active room types ──
router.get('/', async (req, res) => {
  try {
    const rooms = await RoomType.find({ isActive: true }).sort({ pricePerNight: 1 });
    res.json({ success: true, data: rooms });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms.' });
  }
});

// ── GET /rooms/availability ──
router.get('/availability',
  [
    query('roomTypeId').notEmpty().withMessage('roomTypeId is required.'),
    query('checkIn').notEmpty().isISO8601().withMessage('Valid checkIn date required.'),
    query('checkOut').notEmpty().isISO8601().withMessage('Valid checkOut date required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { roomTypeId, checkIn, checkOut } = req.query;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ error: 'Check-out must be after check-in.' });
    }

    try {
      const room = await RoomType.findById(roomTypeId);
      if (!room || !room.isActive) {
        return res.json({ available: false, message: 'Room type not found.' });
      }

      // Check for conflicting CONFIRMED bookings
      const conflict = await Booking.findOne({
        roomTypeId,
        status: 'CONFIRMED',
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate },
      });

      // Check for blocked dates
      const isBlocked = room.blockedDates.some(b =>
        new Date(b.from) < checkOutDate && new Date(b.to) > checkInDate
      );

      if (conflict || isBlocked) {
        return res.json({ available: false, roomTypeId, roomName: room.name });
      }

      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      const baseAmount = room.pricePerNight * nights;
      const gstAmount = Math.round(baseAmount * room.gstRate);
      const grandTotal = baseAmount + gstAmount;

      res.json({
        available: true,
        roomTypeId,
        roomName: room.name,
        totalNights: nights,
        pricePerNight: room.pricePerNight,
        baseAmount,
        gstAmount,
        grandTotal,
      });
    } catch (err) {
      res.status(500).json({ error: 'Availability check failed.' });
    }
  }
);

// ── POST /rooms — Admin: create room type ──
router.post('/',
  verifyAdminToken,
  [
    body('name').trim().notEmpty().withMessage('Room name is required.'),
    body('pricePerNight').isFloat({ min: 0 }).withMessage('Valid price required.'),
    body('capacity').isInt({ min: 1 }).withMessage('Valid capacity required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
      const room = await RoomType.create(req.body);
      res.status(201).json({ success: true, data: room });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create room.' });
    }
  }
);

// ── PATCH /rooms/:id/block — Admin: block dates ──
router.patch('/:id/block',
  verifyAdminToken,
  [
    body('from').isISO8601().withMessage('Valid from date required.'),
    body('to').isISO8601().withMessage('Valid to date required.'),
    body('reason').trim().notEmpty().withMessage('Reason is required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { from, to, reason } = req.body;
    if (new Date(to) <= new Date(from)) {
      return res.status(400).json({ error: 'To date must be after from date.' });
    }

    try {
      const room = await RoomType.findByIdAndUpdate(
        req.params.id,
        { $push: { blockedDates: { from, to, reason } } },
        { new: true }
      );
      if (!room) return res.status(404).json({ error: 'Room not found.' });
      res.json({ success: true, data: room });
    } catch (err) {
      res.status(500).json({ error: 'Failed to block dates.' });
    }
  }
);

module.exports = router;
