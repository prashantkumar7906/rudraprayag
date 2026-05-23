import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api/axios';
import { formatINR, calculateNights, todayISO } from '../utils/helpers';

// ── Step Indicator ──
function StepIndicator({ step }) {
  const steps = ['Availability', 'Guest Details', 'Review & Pay'];
  return (
    <div className="mb-10">
      <div className="flex items-center justify-center gap-0 max-w-xl mx-auto">
        {steps.map((s, i) => {
          const idx = i + 1;
          const isActive = idx === step;
          const isDone = idx < step;
          return (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className="flex items-center justify-center rounded-full font-bold text-sm transition-all"
                  style={{
                    width: 40,
                    height: 40,
                    background: isDone ? '#FF6600' : isActive ? '#FF6600' : '#e0d0c0',
                    color: isDone || isActive ? 'white' : '#9a7050',
                    boxShadow: isActive ? '0 0 0 4px rgba(255,102,0,0.2)' : 'none',
                  }}
                >
                  {isDone ? '✓' : idx}
                </div>
                <span
                  className="text-xs mt-2 font-medium text-center"
                  style={{ color: isActive ? '#FF6600' : isDone ? '#CC3300' : '#9a7050' }}
                >
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-1 mx-1 mb-6 rounded-full transition-all"
                  style={{ background: isDone ? '#FF6600' : '#e0d0c0', maxWidth: 80 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Room Type Radio Card ──
function RoomRadioCard({ room, selected, onSelect }) {
  return (
    <label
      className="block rounded-xl p-4 cursor-pointer transition-all"
      style={{
        border: selected ? '2px solid #FF6600' : '2px solid #e0d0c0',
        background: selected ? '#FFF0E0' : 'white',
        boxShadow: selected ? '0 0 0 3px rgba(255,102,0,0.15)' : 'none',
      }}
    >
      <input
        type="radio"
        name="roomType"
        value={room._id}
        checked={selected}
        onChange={() => onSelect(room)}
        className="sr-only"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div style={{ fontFamily: 'Noto Serif', fontWeight: 700, color: '#CC3300', fontSize: '1rem' }}>
            {room.name}
          </div>
          <div style={{ color: '#6b4c30', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Capacity: {room.capacity} {room.capacity === 1 ? 'guest' : 'guests'}
          </div>
          <div style={{ color: '#9a7050', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            {room.description}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div style={{ color: '#FF6600', fontWeight: 700, fontSize: '1.2rem' }}>
            {formatINR(room.pricePerNight)}
          </div>
          <div style={{ color: '#9a7050', fontSize: '0.75rem' }}>/night + GST</div>
          {selected && (
            <div className="mt-1" style={{ color: '#FF6600', fontSize: '1.1rem' }}>✓</div>
          )}
        </div>
      </div>
    </label>
  );
}

// ── Availability Result ──
function AvailabilityResult({ result, onProceed }) {
  if (!result) return null;
  if (!result.available) {
    return (
      <div className="p-5 rounded-xl mt-6" style={{ background: '#fee2e2', border: '2px solid #CC3300' }}>
        <p style={{ color: '#991b1b', fontWeight: 600 }}>
          Room not available for selected dates. Please choose different dates or another room type.
        </p>
      </div>
    );
  }
  return (
    <div className="p-6 rounded-xl mt-6" style={{ background: '#dcfce7', border: '2px solid #16a34a' }}>
      <div style={{ color: '#16a34a', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>
        Room Available
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        {[
          ['Room', result.roomName],
          ['Nights', result.totalNights],
          ['Per Night', formatINR(result.pricePerNight)],
          ['Base Amount', formatINR(result.baseAmount)],
          ['GST (12%)', formatINR(result.gstAmount)],
          ['Grand Total', formatINR(result.grandTotal)],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between col-span-1">
            <span style={{ color: '#166534' }}>{k}:</span>
            <span style={{ fontWeight: 600, color: '#15803d' }}>{v}</span>
          </div>
        ))}
      </div>
      <button className="btn-bhagwa w-full" onClick={onProceed}>
        Continue to Guest Details →
      </button>
    </div>
  );
}

export default function BookPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  // Step 1 state
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availResult, setAvailResult] = useState(null);
  const [step1Error, setStep1Error] = useState('');

  // Step 2 state
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [citizenship, setCitizenship] = useState('Indian');
  const [idType, setIdType] = useState('Aadhar');
  const [idNumber, setIdNumber] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [honeypot, setHoneypot] = useState(''); // hidden field
  const [step2Errors, setStep2Errors] = useState({});

  // Step 3 state
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');

  // Network error state
  const [networkError, setNetworkError] = useState('');

  useEffect(() => {
    document.title = 'Book a Room — Devprayag Dharamshala';
    api.get('/rooms')
      .then(res => {
        const data = res.data.data || res.data;
        setRooms(data);
        const preselect = searchParams.get('roomTypeId');
        if (preselect) {
          const found = data.find(r => r._id === preselect);
          if (found) setSelectedRoom(found);
        }
      })
      .catch(() => setNetworkError('Unable to load rooms. Please refresh.'))
      .finally(() => setRoomsLoading(false));
  }, [searchParams]);

  const today = todayISO();

  const checkAvailability = async () => {
    setStep1Error('');
    setAvailResult(null);
    if (!selectedRoom) return setStep1Error('Please select a room type.');
    if (!checkIn) return setStep1Error('Please select a check-in date.');
    if (!checkOut) return setStep1Error('Please select a check-out date.');
    if (checkOut <= checkIn) return setStep1Error('Check-out must be after check-in.');
    setCheckingAvail(true);
    try {
      const res = await api.get('/rooms/availability', {
        params: { roomTypeId: selectedRoom._id, checkIn, checkOut },
      });
      setAvailResult(res.data);
    } catch (err) {
      setAvailResult({ available: false });
      setStep1Error(err.message || 'Failed to check availability.');
    } finally {
      setCheckingAvail(false);
    }
  };

  const validateStep2 = () => {
    const errors = {};
    if (!guestName.trim()) errors.guestName = 'Full name is required.';
    if (!guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))
      errors.guestEmail = 'Valid email is required.';
    const phone = guestPhone.replace(/\s/g, '');
    if (citizenship === 'Indian') {
      if (!phone || !/^[6-9]\d{9}$/.test(phone))
        errors.guestPhone = 'Enter a valid 10-digit Indian mobile number.';
    } else {
      if (!phone || phone.length < 8)
        errors.guestPhone = 'Enter a valid mobile number.';
    }
    if (!idNumber.trim()) errors.idNumber = 'ID Number is required.';
    return errors;
  };

  const handleStep2Submit = () => {
    const errors = validateStep2();
    if (Object.keys(errors).length > 0) return setStep2Errors(errors);
    setStep2Errors({});
    setStep(3);
  };

  const handlePayNow = async () => {
    setPaying(true);
    setPayError('');
    setNetworkError('');
    try {
      const res = await api.post('/bookings/initiate', {
        roomTypeId: selectedRoom._id,
        checkIn,
        checkOut,
        guests,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.replace(/\s/g, ''),
        citizenship,
        idType,
        idNumber: idNumber.trim(),
        specialRequests: specialRequests.trim(),
        website: honeypot, // honeypot
        paymentMethod: paymentMethod,
      });
      const { bookingId, paymentMethod: returnedMethod, razorpayOrderId, amount, keyId } = res.data;

      if (returnedMethod === 'CASH') {
        navigate(`/booking-confirmation/${bookingId}`);
        return;
      }

      const rzp = new window.Razorpay({
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: 'INR',
        name: 'Devprayag Dharamshala',
        description: `${selectedRoom.name} — ${calculateNights(checkIn, checkOut)} nights`,
        order_id: razorpayOrderId,
        prefill: {
          name: guestName,
          email: guestEmail,
          contact: guestPhone,
        },
        theme: { color: '#FF6600' },
        handler: () => {
          navigate(`/booking-confirmation/${bookingId}`);
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });
      rzp.open();
    } catch (err) {
      if (err.isNetworkError) setNetworkError(err.message);
      else setPayError(err.message || 'Payment initiation failed. Please try again.');
      setPaying(false);
    }
  };

  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0;
  const baseAmount = selectedRoom ? selectedRoom.pricePerNight * nights : 0;
  const gstAmount = Math.round(baseAmount * 0.12);
  const grandTotal = baseAmount + gstAmount;

  return (
    <>
      <Navbar />
      {/* Load Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <main className="min-h-screen py-12" style={{ background: '#FFF0E0' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h1 style={{ color: '#CC3300', fontFamily: 'Noto Serif', fontWeight: 700, fontSize: '2rem' }}>
              Book a Room
            </h1>
            <p style={{ color: '#9a7050' }}>Reserve your stay at the sacred Sangam</p>
          </div>

          <StepIndicator step={step} />

          {networkError && (
            <div className="p-4 rounded-xl mb-6" style={{ background: '#fee2e2', border: '2px solid #CC3300' }}>
              <p style={{ color: '#991b1b' }}>{networkError}</p>
              <button
                className="mt-2 text-sm underline"
                style={{ color: '#CC3300' }}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div>
                <h2 style={{ color: '#E8A020', fontFamily: 'Noto Serif', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.5rem' }}>
                  Step 1 — Check Availability
                </h2>

                {/* Room selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3" style={{ color: '#2C1200' }}>
                    Select Room Type *
                  </label>
                  {roomsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rooms.filter(r => r.isActive !== false).map(room => (
                        <RoomRadioCard
                          key={room._id}
                          room={room}
                          selected={selectedRoom?._id === room._id}
                          onSelect={setSelectedRoom}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>
                      Check-In Date *
                    </label>
                    <input
                      type="date"
                      className={'form-input' + (step1Error && !checkIn ? ' error' : '')}
                      min={today}
                      value={checkIn}
                      onChange={e => { setCheckIn(e.target.value); setAvailResult(null); }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>
                      Check-Out Date *
                    </label>
                    <input
                      type="date"
                      className={'form-input' + (step1Error && !checkOut ? ' error' : '')}
                      min={checkIn || today}
                      value={checkOut}
                      onChange={e => { setCheckOut(e.target.value); setAvailResult(null); }}
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>
                    Number of Guests
                  </label>
                  <select
                    className="form-input"
                    value={guests}
                    onChange={e => setGuests(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                {step1Error && !availResult && (
                  <p className="error-text mb-4">{step1Error}</p>
                )}

                <button
                  className="btn-bhagwa w-full"
                  onClick={checkAvailability}
                  disabled={checkingAvail}
                >
                  {checkingAvail ? (
                    <><span className="spinner spinner-dark" /> Checking...</>
                  ) : 'Check Availability →'}
                </button>

                <AvailabilityResult
                  result={availResult}
                  onProceed={() => setStep(2)}
                />
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div>
                <h2 style={{ color: '#E8A020', fontFamily: 'Noto Serif', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.5rem' }}>
                  Step 2 — Guest Details
                </h2>

                {/* Honeypot — hidden from users */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ display: 'none' }}
                  value={honeypot}
                  onChange={e => setHoneypot(e.target.value)}
                  aria-hidden="true"
                />

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className={'form-input' + (step2Errors.guestName ? ' error' : '')}
                      placeholder="e.g. Ramesh Kumar Sharma"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                    />
                    {step2Errors.guestName && <p className="error-text">{step2Errors.guestName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      className={'form-input' + (step2Errors.guestEmail ? ' error' : '')}
                      placeholder="your@email.com"
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                    />
                    {step2Errors.guestEmail && <p className="error-text">{step2Errors.guestEmail}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>
                      Phone Number {citizenship === 'Indian' && '(+91)'} *
                    </label>
                    <div className="flex gap-2">
                      {citizenship === 'Indian' && (
                        <div
                          className="form-input w-20 flex items-center justify-center text-sm"
                          style={{ background: '#FFF0E0', flexShrink: 0 }}
                        >
                          +91
                        </div>
                      )}
                      <input
                        type="tel"
                        className={'form-input flex-1' + (step2Errors.guestPhone ? ' error' : '')}
                        placeholder={citizenship === 'Indian' ? "98765 43210" : "Phone Number"}
                        maxLength={citizenship === 'Indian' ? 10 : 15}
                        value={guestPhone}
                        onChange={e => setGuestPhone(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    {step2Errors.guestPhone && <p className="error-text">{step2Errors.guestPhone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#2C1200' }}>
                      Citizenship *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="citizenship"
                          value="Indian"
                          checked={citizenship === 'Indian'}
                          onChange={() => {
                            setCitizenship('Indian');
                            setIdType('Aadhar');
                            setIdNumber('');
                          }}
                          className="w-4 h-4 text-bhagwa focus:ring-bhagwa"
                        />
                        <span>Indian</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="citizenship"
                          value="Foreigner"
                          checked={citizenship === 'Foreigner'}
                          onChange={() => {
                            setCitizenship('Foreigner');
                            setIdType('Passport');
                            setIdNumber('');
                          }}
                          className="w-4 h-4 text-bhagwa focus:ring-bhagwa"
                        />
                        <span>Foreigner</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>
                        ID Type *
                      </label>
                      <select
                        className="form-input"
                        value={idType}
                        onChange={e => setIdType(e.target.value)}
                        disabled={citizenship === 'Foreigner'}
                      >
                        {citizenship === 'Indian' ? (
                          <>
                            <option value="Aadhar">Aadhar Card</option>
                            <option value="PAN">PAN Card</option>
                            <option value="Voter ID">Voter ID</option>
                            <option value="Driving License">Driving License</option>
                          </>
                        ) : (
                          <option value="Passport">Passport</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>
                        ID Number *
                      </label>
                      <input
                        type="text"
                        className={'form-input' + (step2Errors.idNumber ? ' error' : '')}
                        placeholder={idType === 'Passport' ? "Passport Number" : `${idType} Number`}
                        value={idNumber}
                        onChange={e => setIdNumber(e.target.value)}
                      />
                      {step2Errors.idNumber && <p className="error-text">{step2Errors.idNumber}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>
                      Special Requests <span style={{ color: '#9a7050' }}>(optional)</span>
                    </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Any special requirements — e.g. ground floor room, early check-in, etc."
                      value={specialRequests}
                      onChange={e => setSpecialRequests(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    className="flex-1 py-3 rounded-xl font-medium transition-all"
                    style={{ background: '#FFF0E0', color: '#9a7050', border: '2px solid #e0d0c0', minHeight: 44 }}
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </button>
                  <button className="btn-bhagwa flex-1" onClick={handleStep2Submit}>
                    Review & Pay →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div>
                <h2 style={{ color: '#E8A020', fontFamily: 'Noto Serif', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.5rem' }}>
                  Step 3 — Review & Pay
                </h2>

                {/* Summary card */}
                <div className="rounded-2xl p-6 mb-6" style={{ background: '#FFF0E0', border: '2px solid #FFCCAA' }}>
                  <h3 style={{ color: '#CC3300', fontFamily: 'Noto Serif', fontWeight: 700, marginBottom: '1rem' }}>
                    Booking Summary
                  </h3>
                  <div className="space-y-3 text-sm">
                    {[
                      ['Room', selectedRoom?.name],
                      ['Guest', guestName],
                      ['Check-In', checkIn ? new Date(checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''],
                      ['Check-Out', checkOut ? new Date(checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''],
                      ['Nights', nights],
                      ['Guests', guests],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1" style={{ borderBottom: '1px solid #FFCCAA' }}>
                        <span style={{ color: '#6b4c30' }}>{k}</span>
                        <span style={{ fontWeight: 600, color: '#2C1200' }}>{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #FFCCAA' }}>
                      <span style={{ color: '#6b4c30' }}>Base Amount</span>
                      <span style={{ fontWeight: 600 }}>{formatINR(baseAmount)}</span>
                    </div>
                    <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #FFCCAA' }}>
                      <span style={{ color: '#6b4c30' }}>GST (12%)</span>
                      <span style={{ fontWeight: 600 }}>{formatINR(gstAmount)}</span>
                    </div>
                    <div className="flex justify-between py-2 rounded-xl px-3" style={{ background: '#FF6600' }}>
                      <span style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>Grand Total</span>
                      <span style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>{formatINR(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Choose Payment Method */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3" style={{ color: '#2C1200' }}>
                    Choose Payment Method *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label
                      className="block rounded-xl p-4 cursor-pointer transition-all border-2"
                      style={{
                        borderColor: paymentMethod === 'ONLINE' ? '#FF6600' : '#e0d0c0',
                        background: paymentMethod === 'ONLINE' ? '#FFF0E0' : 'white',
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="ONLINE"
                        checked={paymentMethod === 'ONLINE'}
                        onChange={() => setPaymentMethod('ONLINE')}
                        className="sr-only"
                      />
                      <div className="font-bold flex items-center gap-2" style={{ color: '#CC3300' }}>
                        <span>💳</span> Pay Online (Securely)
                      </div>
                      <div className="text-xs mt-1" style={{ color: '#9a7050', lineHeight: 1.4 }}>
                        Pay online instantly using UPI, Cards, Net Banking via Razorpay.
                      </div>
                    </label>

                    <label
                      className="block rounded-xl p-4 cursor-pointer transition-all border-2"
                      style={{
                        borderColor: paymentMethod === 'CASH' ? '#FF6600' : '#e0d0c0',
                        background: paymentMethod === 'CASH' ? '#FFF0E0' : 'white',
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CASH"
                        checked={paymentMethod === 'CASH'}
                        onChange={() => setPaymentMethod('CASH')}
                        className="sr-only"
                      />
                      <div className="font-bold flex items-center gap-2" style={{ color: '#CC3300' }}>
                        <span>💵</span> Pay Cash at counter
                      </div>
                      <div className="text-xs mt-1" style={{ color: '#9a7050', lineHeight: 1.4 }}>
                        Reserve room now. Pay physically at the reception during check-in.
                      </div>
                    </label>
                  </div>
                </div>

                {payError && (
                  <div className="p-4 rounded-xl mb-4" style={{ background: '#fee2e2', border: '2px solid #CC3300' }}>
                    <p style={{ color: '#991b1b' }}>{payError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    className="flex-1 py-3 rounded-xl font-medium transition-all"
                    style={{ background: '#FFF0E0', color: '#9a7050', border: '2px solid #e0d0c0', minHeight: 44 }}
                    onClick={() => setStep(2)}
                    disabled={paying}
                  >
                    ← Back
                  </button>
                  <button className="btn-bhagwa flex-1 text-lg" onClick={handlePayNow} disabled={paying}>
                    {paying ? (
                      <><span className="spinner spinner-dark" /> Processing...</>
                    ) : paymentMethod === 'CASH' ? 'Confirm Booking (Cash) 🙏' : `Pay ${formatINR(grandTotal)}`}
                  </button>
                </div>

                {paymentMethod === 'ONLINE' ? (
                  <p className="text-center mt-4 text-xs" style={{ color: '#9a7050' }}>
                    Secured by Razorpay — UPI, Cards, Net Banking accepted
                  </p>
                ) : (
                  <p className="text-center mt-4 text-xs font-semibold" style={{ color: '#CC3300' }}>
                    🙏 Hari Om — A physical stay token will be generated instantly for check-in.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
