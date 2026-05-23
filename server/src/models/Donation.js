const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donationId: { type: String, unique: true, required: true },
  donorName: { type: String, required: true },
  donorEmail: { type: String, required: true },
  amount: { type: Number, required: true, min: 11 },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'FAILED'],
    default: 'PENDING',
  },
  paymentMethod: {
    type: String,
    enum: ['ONLINE', 'CASH'],
    default: 'ONLINE',
  },
  razorpayOrderId: { type: String, unique: true, sparse: true },
  razorpayPaymentId: { type: String, sparse: true, unique: true },
  emailSentAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
