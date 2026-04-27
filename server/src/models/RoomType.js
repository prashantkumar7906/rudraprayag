const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  capacity: { type: Number, required: true, min: 1 },
  pricePerNight: { type: Number, required: true, min: 0 },
  gstRate: { type: Number, default: 0.12 },
  totalRooms: { type: Number, default: 1 },
  amenities: [{ type: String }],
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
  blockedDates: [{
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    reason: { type: String, default: '' },
    _id: false,
  }],
}, { timestamps: true });

module.exports = mongoose.model('RoomType', roomTypeSchema);
