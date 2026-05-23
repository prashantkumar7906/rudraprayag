const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const Razorpay = require('razorpay');
const Donation = require('../models/Donation');
const { generateDonationId, generateTokenId } = require('../utils/idGenerator');
const Token = require('../models/Token');
const { sendDonationReceipt } = require('../email/templates');
const { verifyAdminToken } = require('../middleware/verifyAdminToken');
const { donationInitiateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// ── POST /donations/initiate ──
router.post('/initiate',
  donationInitiateLimiter,
  [
    body('amount').isFloat({ min: 11 }).withMessage('Minimum donation amount is ₹11.'),
    body('donorName').trim().notEmpty().withMessage('Donor name is required.'),
    body('donorEmail').isEmail().withMessage('Valid email is required.'),
    body('message').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { amount, donorName, donorEmail, message, phone } = req.body;
    const amountInt = Math.round(Number(amount));
    const isCash = req.body.paymentMethod === 'CASH';

    try {
      const donationId = generateDonationId();
      let orderId = 'CASH';
      let donationStatus = 'PENDING';
      let rzpAmount = amountInt * 100;

      if (isCash) {
        donationStatus = 'CONFIRMED';
      } else {
        const order = await razorpay.orders.create({
          amount: amountInt * 100, // paise
          currency: 'INR',
          receipt: donationId,
          notes: { donationId, donorName, donorEmail },
        });
        orderId = order.id;
        rzpAmount = order.amount;
      }

      const donation = await Donation.create({
        donationId,
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim().toLowerCase(),
        amount: amountInt,
        message: (message || '').trim(),
        razorpayOrderId: orderId,
        paymentMethod: isCash ? 'CASH' : 'ONLINE',
        status: donationStatus,
      });

      // Generate Token immediately if CASH
      if (isCash) {
        const tokenNum = generateTokenId();
        await Token.create({
          tokenNumber: tokenNum,
          type: 'DONATION',
          donationId: donation._id,
          amount: amountInt,
          name: donation.donorName,
          email: donation.donorEmail,
          phone: phone || '',
          paymentMethod: 'CASH',
          status: 'ACTIVE'
        });

        // Trigger confirmation email for CASH donation
        sendDonationReceipt(donation).catch(e => console.error('[Email] Donation receipt email failed:', e.message));
      }

      res.status(201).json({
        success: true,
        donationId: donation.donationId,
        paymentMethod: isCash ? 'CASH' : 'ONLINE',
        razorpayOrderId: isCash ? null : orderId,
        amount: rzpAmount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err) {
      console.error('[Donation] initiate error:', err.message);
      res.status(500).json({ error: 'Donation initiation failed. Please try again.' });
    }
  }
);

// ── POST /donations/webhook — Razorpay webhook ──
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['x-razorpay-signature'];
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');

    if (sig !== expected) {
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
      try {
        const donation = await Donation.findOne({ razorpayOrderId: payment.order_id });
        if (donation && donation.status !== 'CONFIRMED') {
          donation.status = 'CONFIRMED';
          donation.razorpayPaymentId = payment.id;
          await donation.save();

          // Idempotent Token creation for ONLINE donation
          const existingToken = await Token.findOne({ donationId: donation._id });
          if (!existingToken) {
            const tokenNum = generateTokenId();
            await Token.create({
              tokenNumber: tokenNum,
              type: 'DONATION',
              donationId: donation._id,
              amount: donation.amount,
              name: donation.donorName,
              email: donation.donorEmail,
              paymentMethod: 'ONLINE',
              status: 'ACTIVE'
            });
            console.log('[Webhook] Generated online donation token:', tokenNum);
          }

          const emailSent = await sendDonationReceipt(donation);
          if (emailSent) {
            donation.emailSentAt = new Date();
            await donation.save();
          }
          console.log('[Webhook] Donation confirmed:', donation.donationId);
        }
      } catch (err) {
        console.error('[Webhook] Donation confirm error:', err.message);
      }
    }

    res.json({ status: 'ok' });
  }
);

// ── GET /donations/:donationId — public status check ──
router.get('/:donationId', async (req, res) => {
  try {
    const donation = await Donation.findOne({ donationId: req.params.donationId })
      .select('-__v');
    if (!donation) return res.status(404).json({ error: 'Donation not found.' });

    const token = await Token.findOne({ donationId: donation._id }).select('-__v');
    res.json({ success: true, data: donation, token });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch donation.' });
  }
});

// ── GET /admin/donations — Admin: list donations ──
router.get('/admin/list',
  verifyAdminToken,
  async (req, res) => {
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
  }
);

module.exports = router;
