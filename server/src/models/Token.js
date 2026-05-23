const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  tokenNumber: { type: String, unique: true, required: true },
  type: { type: String, enum: ['BOOKING', 'DONATION'], required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
  amount: { type: Number, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  paymentMethod: { type: String, enum: ['ONLINE', 'CASH'], default: 'ONLINE' },
  status: { type: String, enum: ['ACTIVE', 'USED', 'EXPIRED'], default: 'ACTIVE' },
}, { timestamps: true });

module.exports = mongoose.model('Token', tokenSchema);
