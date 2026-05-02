const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true, required: true },
  roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  roomTypeName: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  nights: { type: Number, required: true },
  guests: { type: Number, required: true, default: 1 },
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  guestPhone: { type: String, required: true },
  citizenship: { type: String, enum: ['Indian', 'Foreigner'], required: true, default: 'Indian' },
  idType: { type: String, required: true },
  idNumber: { type: String, required: true },
  specialRequests: { type: String, default: '' },
  priceBreakdown: {
    baseAmount: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED'],
    default: 'PENDING',
  },
  razorpayOrderId: { type: String, unique: true, required: true },
  razorpayPaymentId: { type: String, sparse: true, unique: true },
  cancellationReason: { type: String },
  cancelledAt: { type: Date },
  emailSentAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
