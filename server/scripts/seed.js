require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const RoomType = require('../src/models/RoomType');
const Admin = require('../src/models/Admin');

const ROOMS = [
  {
    name: 'Non AC Room',
    description: 'Private room with double bed, attached bathroom, river view. Comfortable stay for couples or solo travelers.',
    capacity: 2,
    pricePerNight: 800,
    gstRate: 0.12,
    totalRooms: 10,
    amenities: ['Attached Bathroom', 'River View', 'WiFi'],
    isActive: true,
  },
  {
    name: 'AC Room',
    description: 'Air-conditioned room with double bed, attached bathroom, and balcony. Comfortable and cool stay in summer.',
    capacity: 3,
    pricePerNight: 1500,
    gstRate: 0.12,
    totalRooms: 10,
    amenities: ['AC', 'Attached Bathroom', 'Balcony', 'River View', 'WiFi'],
    isActive: true,
  },
];

const ADMIN = {
  email: 'admin@dharamshala.com',
  password: 'Devprayag@2026',
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected to MongoDB Atlas');

    // Clear existing data
    await RoomType.deleteMany({});
    await Admin.deleteMany({});
    console.log('[Seed] Cleared existing data');

    // Seed rooms
    const rooms = await RoomType.insertMany(ROOMS);
    console.log(`[Seed] Created ${rooms.length} room types`);
    rooms.forEach(r => console.log(`  - ${r.name}: ₹${r.pricePerNight}/night (capacity: ${r.capacity})`));

    // Seed admin
    const passwordHash = await bcrypt.hash(ADMIN.password, 12);
    const admin = await Admin.create({ email: ADMIN.email, passwordHash });
    console.log(`[Seed] Created admin: ${admin.email}`);
    console.log(`[Seed] Admin password: ${ADMIN.password}`);

    console.log('\n✅ Seeding complete!');
    console.log('\nAdmin credentials:');
    console.log(`  Email:    ${ADMIN.email}`);
    console.log(`  Password: ${ADMIN.password}`);
  } catch (err) {
    console.error('[Seed] Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
