const { sendEmailWithRetry } = require('../utils/emailSender');

function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

const HEADER = `
  <div style="background:#FF6600;padding:24px 32px;text-align:center;">
    <div style="font-size:2.5rem;color:white;letter-spacing:0.05em;">ॐ</div>
    <h1 style="color:white;font-family:Georgia,serif;margin:8px 0 0;font-size:1.4rem;">
      देवप्रयाग धर्मशाला
    </h1>
    <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:0.85rem;">
      Devprayag Dharamshala — Sangam Ghat, Devprayag
    </p>
  </div>
`;

const FOOTER = `
  <div style="background:#2C1200;padding:20px 32px;text-align:center;">
    <p style="color:#F9A86A;font-size:0.8rem;margin:0;">
      Sangam Ghat Road, Devprayag, Tehri Garhwal, Uttarakhand 249301
    </p>
    <p style="color:#F9A86A;font-size:0.8rem;margin:4px 0 0;">
      📞 +91 12345 67890 &nbsp;|&nbsp; 
      ✉ <a href="mailto:dharamshala@devprayag.in" style="color:#FF6600;">dharamshala@devprayag.in</a>
    </p>
    <p style="color:#6b4c30;font-size:0.75rem;margin:8px 0 0;">
      © 2026 Devprayag Dharamshala Trust
    </p>
  </div>
`;

// ── Booking Confirmation to Guest ──
async function sendBookingConfirmation(booking) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #FFCCAA;border-radius:12px;overflow:hidden;">
      ${HEADER}
      <div style="padding:32px;background:#FFFDF8;">
        <p style="color:#2C1200;font-size:1rem;margin-bottom:1.5rem;">
          हरि ॐ <strong>${booking.guestName}</strong> जी,
        </p>
        <p style="color:#4a2a0a;margin-bottom:1.5rem;line-height:1.7;">
          Your booking at Devprayag Dharamshala has been <strong style="color:#16a34a;">confirmed</strong>.
          We look forward to welcoming you at the sacred Sangam. 🙏
        </p>
        
        <div style="background:#FFF0E0;border:2px solid #FFCCAA;border-radius:10px;padding:20px;margin-bottom:1.5rem;">
          <h2 style="color:#CC3300;font-family:Georgia,serif;margin:0 0 16px;font-size:1.1rem;">
            Booking Details
          </h2>
          <table style="width:100%;border-collapse:collapse;font-size:0.95rem;">
            ${[
              ['Booking ID', `<strong style="color:#CC3300;">${booking.bookingId}</strong>`],
              ['Room Type', booking.roomTypeName],
              ['Check-In', formatDate(booking.checkIn)],
              ['Check-Out', formatDate(booking.checkOut)],
              ['Nights', booking.nights],
              ['Guests', booking.guests],
              ['Base Amount', formatINR(booking.priceBreakdown.baseAmount)],
              ['GST (12%)', formatINR(booking.priceBreakdown.gstAmount)],
              ['Total Paid', `<strong style="color:#FF6600;">${formatINR(booking.priceBreakdown.totalAmount)}</strong>`],
            ].map(([k, v]) => `
              <tr style="border-bottom:1px solid #FFCCAA;">
                <td style="padding:8px 12px;color:#6b4c30;">${k}</td>
                <td style="padding:8px 12px;color:#2C1200;">${v}</td>
              </tr>
            `).join('')}
          </table>
        </div>
        
        <div style="background:#E8F0FF;border-radius:8px;padding:16px;margin-bottom:1.5rem;">
          <p style="color:#0055AA;margin:0;font-size:0.9rem;">
            📍 <strong>Location:</strong> Sangam Ghat Road, Devprayag, Tehri Garhwal, Uttarakhand 249301<br/>
            📞 <strong>Phone:</strong> +91 12345 67890
          </p>
        </div>
        
        <p style="color:#4a2a0a;font-style:italic;font-family:Georgia,serif;font-size:1rem;line-height:1.8;border-left:4px solid #FF6600;padding-left:16px;">
          May your pilgrimage be blessed and your journey to the Char Dhams be safe and spiritually fulfilling. 
          Hari Om 🙏
        </p>
      </div>
      ${FOOTER}
    </div>
  `;

  return sendEmailWithRetry({
    from: `"Devprayag Dharamshala" <${process.env.SMTP_USER}>`,
    to: booking.guestEmail,
    subject: `✅ Booking Confirmed — Devprayag Dharamshala | ${booking.bookingId}`,
    html,
  });
}

// ── Admin New Booking Alert ──
async function sendAdminBookingAlert(booking) {
  const text = `
New Booking Received
====================
Booking ID : ${booking.bookingId}
Guest      : ${booking.guestName}
Email      : ${booking.guestEmail}
Phone      : +91 ${booking.guestPhone}
Room       : ${booking.roomTypeName}
Check-In   : ${formatDate(booking.checkIn)}
Check-Out  : ${formatDate(booking.checkOut)}
Nights     : ${booking.nights}
Amount     : ${formatINR(booking.priceBreakdown.totalAmount)}
Payment ID : ${booking.razorpayPaymentId || 'N/A'}
  `.trim();

  return sendEmailWithRetry({
    from: `"Dharamshala System" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `🔔 New Booking: ${booking.bookingId} — ${booking.roomTypeName}`,
    text,
  });
}

// ── Donation Receipt to Donor ──
async function sendDonationReceipt(donation) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #FFCCAA;border-radius:12px;overflow:hidden;">
      ${HEADER}
      <div style="padding:32px;background:#FFFDF8;">
        <p style="color:#2C1200;font-size:1rem;margin-bottom:1rem;">
          हरि ॐ <strong>${donation.donorName}</strong> जी,
        </p>
        <p style="color:#4a2a0a;margin-bottom:1.5rem;line-height:1.7;">
          Thank you for your generous donation to Devprayag Dharamshala Trust.
          Your contribution helps us serve pilgrims and maintain this sacred space. 🙏
        </p>
        
        <div style="background:#FFF0E0;border:2px solid #FFCCAA;border-radius:10px;padding:20px;margin-bottom:1.5rem;text-align:center;">
          <div style="font-size:2.5rem;margin-bottom:0.5rem;">🙏</div>
          <div style="color:#FF6600;font-size:2rem;font-weight:bold;">${formatINR(donation.amount)}</div>
          <div style="color:#9a7050;font-size:0.85rem;margin-top:0.5rem;">Donated on ${today}</div>
        </div>
        
        <table style="width:100%;border-collapse:collapse;font-size:0.95rem;margin-bottom:1.5rem;">
          ${[
            ['Donation ID', `<strong style="color:#0055AA;">${donation.donationId}</strong>`],
            ['Donor Name', donation.donorName],
            ['Amount', `<strong style="color:#FF6600;">${formatINR(donation.amount)}</strong>`],
            ['Date', today],
            ['Payment Ref', donation.razorpayPaymentId || 'Processing'],
            ...(donation.message ? [['Dedicated To', donation.message]] : []),
          ].map(([k, v]) => `
            <tr style="border-bottom:1px solid #FFF0E0;">
              <td style="padding:8px 12px;color:#6b4c30;">${k}</td>
              <td style="padding:8px 12px;color:#2C1200;">${v}</td>
            </tr>
          `).join('')}
        </table>
        
        <div style="background:#FFF0E0;border-radius:8px;padding:16px;margin-bottom:1.5rem;">
          <p style="color:#6b4c30;font-size:0.9rem;line-height:1.7;margin:0;">
            Your donation helps us: provide free or subsidized accommodation to underprivileged pilgrims,
            maintain the dharamshala facilities, support local priests and staff, and keep the sacred 
            space clean and dignified for all devotees.
          </p>
        </div>
        
        <p style="color:#4a2a0a;font-style:italic;font-family:Georgia,serif;font-size:1rem;line-height:1.8;border-left:4px solid #FF6600;padding-left:16px;">
          "Dana (charity) is the highest virtue. May the blessings of Ganga Maiya and 
          the divine grace of the holy Sangam shower upon you and your family." 🙏
        </p>
      </div>
      ${FOOTER}
    </div>
  `;

  return sendEmailWithRetry({
    from: `"Devprayag Dharamshala Trust" <${process.env.SMTP_USER}>`,
    to: donation.donorEmail,
    subject: `🙏 Thank You for Your Donation — ${donation.donationId}`,
    html,
  });
}

// ── Booking Cancellation to Guest ──
async function sendCancellationEmail(booking) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #FFCCAA;border-radius:12px;overflow:hidden;">
      ${HEADER}
      <div style="padding:32px;background:#FFFDF8;">
        <p style="color:#2C1200;font-size:1rem;margin-bottom:1rem;">
          Dear <strong>${booking.guestName}</strong>,
        </p>
        <p style="color:#4a2a0a;line-height:1.7;margin-bottom:1.5rem;">
          We regret to inform you that your booking (<strong>${booking.bookingId}</strong>) has been cancelled.
        </p>
        <div style="background:#fee2e2;border-radius:8px;padding:16px;margin-bottom:1.5rem;">
          <p style="color:#991b1b;margin:0;font-size:0.9rem;">
            <strong>Cancellation Reason:</strong> ${booking.cancellationReason || 'As requested'}
          </p>
        </div>
        <p style="color:#4a2a0a;line-height:1.7;">
          If you have any questions, please contact us at 
          <a href="mailto:dharamshala@devprayag.in" style="color:#FF6600;">dharamshala@devprayag.in</a> 
          or call us at +91 12345 67890. We are sorry for any inconvenience. 🙏
        </p>
      </div>
      ${FOOTER}
    </div>
  `;

  return sendEmailWithRetry({
    from: `"Devprayag Dharamshala" <${process.env.SMTP_USER}>`,
    to: booking.guestEmail,
    subject: `❌ Booking Cancelled — ${booking.bookingId}`,
    html,
  });
}

module.exports = {
  sendBookingConfirmation,
  sendAdminBookingAlert,
  sendDonationReceipt,
  sendCancellationEmail,
};
