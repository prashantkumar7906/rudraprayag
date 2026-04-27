import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api/axios';
import { formatINR, formatDate, generateBookingSummaryText } from '../utils/helpers';

export default function BookingConfirmationPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState('polling'); // polling | confirmed | timeout | error
  const [error, setError] = useState('');
  const pollRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    document.title = 'Booking Confirmation — Devprayag Dharamshala';

    const poll = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        const b = res.data.data || res.data;
        setBooking(b);
        if (b.status === 'CONFIRMED') {
          setStatus('confirmed');
          clearInterval(pollRef.current);
        } else if (Date.now() - startTimeRef.current > 2 * 60 * 1000) {
          setStatus('timeout');
          clearInterval(pollRef.current);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch booking status.');
        setStatus('error');
        clearInterval(pollRef.current);
      }
    };

    poll(); // immediate first check
    pollRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollRef.current);
  }, [bookingId]);

  const downloadSummary = () => {
    if (!booking) return;
    const text = generateBookingSummaryText(booking);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${booking.bookingId}-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-16" style={{ background: '#FFF0E0' }}>
        <div className="max-w-2xl mx-auto px-4">
          {/* Polling state */}
          {status === 'polling' && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⌛</div>
              <div className="flex justify-center mb-4">
                <div style={{
                  width: 50, height: 50,
                  border: '4px solid #FFF0E0',
                  borderTop: '4px solid #FF6600',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              </div>
              <h2 style={{ color: '#E8A020', fontFamily: 'Noto Serif', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                Verifying your payment…
              </h2>
              <p style={{ color: '#9a7050' }}>Please wait while we confirm your booking with Razorpay.</p>
              <p style={{ color: '#9a7050', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Booking ID: <strong style={{ color: '#CC3300' }}>{bookingId}</strong>
              </p>
            </div>
          )}

          {/* Confirmed state */}
          {status === 'confirmed' && booking && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Header */}
              <div style={{ background: '#FF6600', padding: '2rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="38" fill="none" stroke="white" strokeWidth="3" opacity="0.4" />
                    <circle cx="40" cy="40" r="38" fill="none" stroke="white" strokeWidth="3"
                      strokeDasharray="240"
                      strokeDashoffset="0"
                      style={{ animation: 'none' }}
                    />
                    <polyline
                      points="22,40 34,52 58,28"
                      fill="none"
                      stroke="white"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h1 style={{ color: 'white', fontFamily: 'Noto Serif', fontSize: '1.8rem', fontWeight: 700 }}>
                  Booking Confirmed! 🙏
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.85)', marginTop: '0.5rem' }}>
                  हरि ॐ — Your stay is reserved
                </p>
              </div>

              {/* Details */}
              <div className="p-8">
                <div
                  className="rounded-xl p-4 mb-6 text-center"
                  style={{ background: '#FFF0E0', border: '2px solid #FFCCAA' }}
                >
                  <div style={{ color: '#9a7050', fontSize: '0.85rem' }}>Booking ID</div>
                  <div style={{ color: '#CC3300', fontWeight: 700, fontSize: '1.4rem', fontFamily: 'Noto Serif' }}>
                    {booking.bookingId}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  {[
                    ['Guest Name', booking.guestName],
                    ['Room Type', booking.roomTypeName],
                    ['Check-In', formatDate(booking.checkIn)],
                    ['Check-Out', formatDate(booking.checkOut)],
                    ['Nights', booking.nights],
                    ['Guests', booking.guests],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2" style={{ borderBottom: '1px solid #FFF0E0' }}>
                      <span style={{ color: '#6b4c30' }}>{k}</span>
                      <span style={{ fontWeight: 600, color: '#2C1200' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Payment breakdown */}
                <div className="mt-4 p-4 rounded-xl" style={{ background: '#FFF0E0' }}>
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{ color: '#6b4c30' }}>Base Amount</span>
                    <span>{formatINR(booking.priceBreakdown?.baseAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{ color: '#6b4c30' }}>GST (12%)</span>
                    <span>{formatINR(booking.priceBreakdown?.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base">
                    <span style={{ color: '#CC3300' }}>Total Paid</span>
                    <span style={{ color: '#FF6600' }}>{formatINR(booking.priceBreakdown?.totalAmount)}</span>
                  </div>
                </div>

                {/* Email note */}
                <div className="mt-6 p-4 rounded-xl text-center" style={{ background: '#E8F0FF', border: '2px solid #0055AA20' }}>
                  <p style={{ color: '#0055AA', fontSize: '0.9rem' }}>
                    📧 A confirmation email has been sent to <strong>{booking.guestEmail}</strong>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    className="flex-1 py-3 rounded-xl font-medium border-2 transition-all"
                    style={{ borderColor: '#FF6600', color: '#FF6600', background: 'white', minHeight: 44 }}
                    onClick={downloadSummary}
                  >
                    📄 Download Summary
                  </button>
                  <Link to="/" className="flex-1">
                    <button className="btn-bhagwa w-full">
                      🏠 Back to Home
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Timeout state */}
          {status === 'timeout' && (
            <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
              <h2 style={{ color: '#E8A020', fontFamily: 'Noto Serif', fontSize: '1.5rem', marginBottom: '1rem' }}>
                Payment received — confirmation in progress
              </h2>
              <p style={{ color: '#6b4c30', lineHeight: 1.8 }}>
                We have received your payment. Your booking confirmation is being processed.
                <br />
                Please check your email shortly.
              </p>
              <p className="mt-3 text-sm" style={{ color: '#9a7050' }}>
                Booking ID: <strong style={{ color: '#CC3300' }}>{bookingId}</strong>
              </p>
              <Link to="/" className="inline-block mt-6">
                <button className="btn-bhagwa">Back to Home</button>
              </Link>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
              <h2 style={{ color: '#CC3300', fontFamily: 'Noto Serif', fontSize: '1.5rem', marginBottom: '1rem' }}>
                Unable to verify booking
              </h2>
              <p style={{ color: '#6b4c30' }}>{error}</p>
              <button
                className="btn-bhagwa mt-6"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
