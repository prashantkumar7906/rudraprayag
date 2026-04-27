// Format a number as Indian currency (₹1,00,000)
export const formatINR = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
};

// Format date as DD/MM/YYYY
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Convert DD/MM/YYYY to Date object
export const parseDate = (str) => {
  if (!str) return null;
  const [day, month, year] = str.split('/');
  return new Date(`${year}-${month}-${day}`);
};

// Get today's date as YYYY-MM-DD for input[type=date] min
export const todayISO = () => {
  return new Date().toISOString().split('T')[0];
};

// Calculate nights between two dates
export const calculateNights = (checkIn, checkOut) => {
  const diff = new Date(checkOut) - new Date(checkIn);
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

// Validate Indian phone number
export const isValidIndianPhone = (phone) => {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
};

// Generate booking summary for download
export const generateBookingSummaryText = (booking) => {
  return `
DEVPRAYAG DHARAMSHALA
Sangam Ghat Road, Devprayag, Tehri Garhwal, Uttarakhand 249301
  
BOOKING SUMMARY
===============
Booking ID: ${booking.bookingId}
Guest Name: ${booking.guestName}
Room: ${booking.roomTypeName}
Check-In: ${formatDate(booking.checkIn)}
Check-Out: ${formatDate(booking.checkOut)}
Nights: ${booking.nights}

PAYMENT DETAILS
===============
Base Amount: ${formatINR(booking.priceBreakdown?.baseAmount)}
GST (12%): ${formatINR(booking.priceBreakdown?.gstAmount)}
Total Paid: ${formatINR(booking.priceBreakdown?.totalAmount)}

Payment ID: ${booking.razorpayPaymentId || 'N/A'}
Status: ${booking.status}

Generated: ${new Date().toLocaleString('en-IN')}
  `.trim();
};
