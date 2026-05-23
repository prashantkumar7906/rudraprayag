// Generate a unique ID in format: PREFIX-YYYYMMDD-XXXX
// e.g. BKG-20261225-A3X9 or DON-20261225-B7K2

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

function randomSegment(length = 4) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

function dateSegment() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function generateId(prefix) {
  return `${prefix}-${dateSegment()}-${randomSegment(4)}`;
}

const generateBookingId = () => generateId('BKG');
const generateDonationId = () => generateId('DON');
const generateTokenId = () => generateId('TOK');

module.exports = { generateBookingId, generateDonationId, generateTokenId };
