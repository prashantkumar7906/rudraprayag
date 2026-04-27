/**
 * reconcile.js — Manual reconciliation script
 * 
 * Cross-checks PENDING bookings older than 2 hours against Razorpay API.
 * If the payment was captured, confirms the booking.
 * If not captured, marks as EXPIRED.
 * 
 * Usage: node scripts/reconcile.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Booking = require('../src/models/Booking');
const { sendBookingConfirmation, sendAdminBookingAlert } = require('../src/email/templates');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function reconcile() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Reconcile] Connected to MongoDB');

    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    const stalePending = await Booking.find({
      status: 'PENDING',
      createdAt: { $lt: cutoff },
    });

    console.log(`[Reconcile] Found ${stalePending.length} stale PENDING bookings to reconcile`);

    let confirmed = 0;
    let expired = 0;
    let errors = 0;

    for (const booking of stalePending) {
      try {
        // Fetch Razorpay order
        const order = await razorpay.orders.fetch(booking.razorpayOrderId);
        
        if (order.status === 'paid') {
          // Fetch payment details
          const payments = await razorpay.orders.fetchPayments(booking.razorpayOrderId);
          const capturedPayment = payments.items.find(p => p.status === 'captured');
          
          if (capturedPayment) {
            booking.status = 'CONFIRMED';
            booking.razorpayPaymentId = capturedPayment.id;
            await booking.save();
            
            // Send confirmation email
            const emailSent = await sendBookingConfirmation(booking);
            if (emailSent) {
              booking.emailSentAt = new Date();
              await booking.save();
            }
            sendAdminBookingAlert(booking).catch(() => {});
            
            console.log(`  ✅ CONFIRMED: ${booking.bookingId} (Payment: ${capturedPayment.id})`);
            confirmed++;
          } else {
            // Order paid but no captured payment — expire it
            booking.status = 'EXPIRED';
            await booking.save();
            console.log(`  ⏰ EXPIRED: ${booking.bookingId} (order paid but no captured payment)`);
            expired++;
          }
        } else if (order.status === 'created' || order.status === 'attempted') {
          // Payment not captured — expire
          booking.status = 'EXPIRED';
          await booking.save();
          console.log(`  ⏰ EXPIRED: ${booking.bookingId} (order status: ${order.status})`);
          expired++;
        }
      } catch (err) {
        console.error(`  ❌ ERROR processing ${booking.bookingId}: ${err.message}`);
        errors++;
      }
    }

    console.log(`\n[Reconcile] Summary:`);
    console.log(`  Confirmed: ${confirmed}`);
    console.log(`  Expired  : ${expired}`);
    console.log(`  Errors   : ${errors}`);
    console.log('\n✅ Reconciliation complete!');
  } catch (err) {
    console.error('[Reconcile] Fatal error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

reconcile();
