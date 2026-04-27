require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const RoomType = require('../src/models/RoomType');
const Admin = require('../src/models/Admin');

const ROOMS = [
  {
    name: 'Dormitory Bed',
    description: 'Shared dormitory for solo pilgrims. Basic amenities, common bathrooms. Ideal for budget-conscious yatris.',
    capacity: 1,
    pricePerNight: 300,
    gstRate: 0.12,
    totalRooms: 10,
    amenities: ['Common Bathroom', 'WiFi'],
    isActive: true,
  },
  {
    name: 'Standard Double Room',
    description: 'Private room with double bed, attached bathroom, river view. Comfortable stay for couples or solo travelers.',
    capacity: 2,
    pricePerNight: 800,
    gstRate: 0.12,
    totalRooms: 6,
    amenities: ['Attached Bathroom', 'River View', 'WiFi'],
    isActive: true,
  },
  {
    name: 'Family Room',
    description: 'Spacious room for families. Two beds, attached bathroom, mountain view. Perfect for families on the Char Dham Yatra.',
    capacity: 4,
    pricePerNight: 1400,
    gstRate: 0.12,
    totalRooms: 4,
    amenities: ['Attached Bathroom', 'Mountain View', 'WiFi'],
    isActive: true,
  },
  {
    name: 'Deluxe Suite',
    description: 'Premium suite with sitting area, attached bathroom, balcony, and panoramic Sangam view. The finest accommodation in Devprayag.',
    capacity: 4,
    pricePerNight: 2200,
    gstRate: 0.12,
    totalRooms: 2,
    amenities: ['Attached Bathroom', 'Balcony', 'River View', 'Mountain View', 'Sitting Area', 'WiFi'],
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
