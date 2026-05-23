import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api/axios';

// Enrichment data by room name keyword
const ROOM_EXTRAS = {
  'ganga': {
    images: ['/images/ac_room_1.jpg', '/images/ac_room_2.jpg', '/images/ac_room_3.jpg'],
    hindi: 'गंगा व्यू डीलक्स',
    amenities: ['Balcony View', 'Free WiFi', 'Tea/Coffee', 'Attached Bath', 'Daily Housekeeping'],
    descH: 'बालकनी के साथ विशाल वातानुकूलित कक्ष, घाटी का मनोरम दृश्य।',
  },
  'sangam': {
    images: ['/images/non_ac_room_1.jpg'],
    hindi: 'संगम स्टैंडर्ड',
    amenities: ['Free WiFi', 'Attached Bath', 'Tea/Coffee', 'Daily Housekeeping'],
    descH: 'संगम के निकट एक स्वच्छ और शांतिपूर्ण कक्ष।',
  },
  'family': {
    images: ['/images/ac_room_1.jpg', '/images/ac_room_2.jpg'],
    hindi: 'पारिवारिक सुइट',
    amenities: ['AC', 'Balcony View', 'Free WiFi', 'Tea/Coffee', 'Attached Bath', 'Daily Housekeeping'],
    descH: 'परिवार और समूह तीर्थयात्रियों के लिए विशाल सुइट।',
  },
  'default': {
    images: ['/images/ac_room_1.jpg'],
    hindi: '',
    amenities: ['Free WiFi', 'Attached Bath', 'Daily Housekeeping'],
    descH: '',
  },
};

function getRoomExtras(name = '') {
  const lower = name.toLowerCase();
  for (const key of Object.keys(ROOM_EXTRAS)) {
    if (key !== 'default' && lower.includes(key)) return ROOM_EXTRAS[key];
  }
  return ROOM_EXTRAS.default;
}

function FormField({ label, h, req, type = 'text', fieldKey, form, errors, upd }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: '#3D2010', marginBottom: '0.3rem' }}>
        {label} <span style={{ fontFamily: 'Noto Sans Devanagari', fontSize: '0.75rem', color: '#C4581A' }}>/ {h}</span>
        {req && <span style={{ color: '#E8520A' }}> *</span>}
      </label>
      <input
        type={type}
        className={`form-input${errors[fieldKey] ? ' error' : ''}`}
        value={form[fieldKey]}
        onChange={upd(fieldKey)}
      />
      {errors[fieldKey] && <span className="error-text">{errors[fieldKey]}</span>}
    </div>
  );
}

export default function RoomDetailPage() {
  const { roomId } = useParams(); // This is now the real MongoDB _id
  const { state } = useLocation();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [room, setRoom] = useState(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [extras, setExtras] = useState(ROOM_EXTRAS.default);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', guests: 1,
    checkIn: state?.checkIn || '', checkOut: state?.checkOut || '',
    requests: '', citizenship: 'Indian', idType: 'Aadhar', idNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);

  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000))
    : 0;

  const baseTotal = nights * (room?.pricePerNight || 0);
  const gst = Math.round(baseTotal * (room?.gstRate || 0.12));
  const grandTotal = baseTotal + gst;

  useEffect(() => {
    setRoomLoading(true);
    api.get('/rooms')
      .then(res => {
        const data = res.data?.data || res.data;
        const rooms = Array.isArray(data) ? data : [];
        const found = rooms.find(r => r._id === roomId);
        if (!found) {
          navigate('/rooms', { replace: true });
          return;
        }
        setRoom(found);
        setExtras(getRoomExtras(found.name));
        document.title = `${found.name} — Hariom Trust Organisation`;
        window.scrollTo(0, 0);
      })
      .catch(() => navigate('/rooms', { replace: true }))
      .finally(() => setRoomLoading(false));
  }, [roomId, navigate]);

  if (roomLoading) {
    return (
      <>
        <Navbar />
        <main style={{ background: 'transparent', minHeight: '100vh', padding: '3rem 0 5rem' }}>
          <div className="container">
            <div className="skeleton" style={{ height: 270, borderRadius: 16, marginBottom: '2rem' }} />
            <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!room) return null;

  const upd = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setErrors(er => ({ ...er, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    const phone = form.phone.replace(/\s/g, '');
    if (form.citizenship === 'Indian') {
      if (!/^[6-9]\d{9}$/.test(phone)) e.phone = 'Valid 10-digit mobile required';
    } else {
      if (!phone || phone.length < 8) e.phone = 'Valid mobile required';
    }
    if (!form.idNumber.trim()) e.idNumber = 'ID Number required';
    if (!form.checkIn) e.checkIn = 'Select check-in';
    if (!form.checkOut) e.checkOut = 'Select check-out';
    if (form.checkOut && form.checkIn && form.checkOut <= form.checkIn) e.checkOut = 'Check-out must be after check-in';
    if (nights < 1) e.checkOut = 'Minimum stay is 1 night';
    return e;
  };

  const handleBook = async () => {
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setPaying(true);
    try {
      // Use room._id (real MongoDB ID) for the booking
      const res = await api.post('/bookings/initiate', {
        roomTypeId: room._id,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: Number(form.guests),
        guestName: form.name.trim(),
        guestEmail: form.email.trim(),
        guestPhone: form.phone.replace(/\s/g, ''),
        citizenship: form.citizenship,
        idType: form.idType,
        idNumber: form.idNumber.trim(),
        specialRequests: form.requests.trim(),
        paymentMethod: 'CASH', // Default to cash for direct room detail booking
      });

      const { bookingId } = res.data;
      navigate(`/booking-confirmation/${bookingId}`);
    } catch (err) {
      setErrors({ submit: err.message || 'Booking failed. Try again.' });
      setPaying(false);
    }
  };

  const images = extras.images || ['/images/ac_room_1.jpg'];

  return (
    <>
      <Navbar />
      <main style={{ background: 'transparent', minHeight: '100vh', padding: '3rem 0 5rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '2.5rem', alignItems: 'start' }} className="detail-grid">

            {/* LEFT — Room info */}
            <div>
              <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(26,10,0,0.1)', position: 'relative' }}>
                <img
                  src={images[currentImageIndex]}
                  alt={room.name}
                  style={{ width: '100%', height: 270, objectFit: 'cover', display: 'block', transition: 'opacity 0.2s' }}
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1)}
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                    >
                      <span style={{ fontSize: '1.5rem', lineHeight: 1, color: '#1A0A00', position: 'relative', top: -1 }}>‹</span>
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(i => (i + 1) % images.length)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                    >
                      <span style={{ fontSize: '1.5rem', lineHeight: 1, color: '#1A0A00', position: 'relative', top: -1 }}>›</span>
                    </button>
                    <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.4rem' }}>
                      {images.map((_, i) => (
                        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === currentImageIndex ? '#E8520A' : 'rgba(255,255,255,0.6)', cursor: 'pointer' }} onClick={() => setCurrentImageIndex(i)} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.5rem', color: '#1A0A00' }}>{room.name}</h1>
                {extras.hindi && (
                  <span style={{ fontFamily: 'Noto Sans Devanagari,sans-serif', fontSize: '0.85rem', color: '#E8520A' }}>{extras.hindi}</span>
                )}
              </div>
              <p style={{ fontSize: '0.88rem', color: '#3D2010', lineHeight: 1.75, marginBottom: '0.4rem' }}>{room.description}</p>
              {extras.descH && (
                <p style={{ fontFamily: 'Noto Sans Devanagari,sans-serif', fontSize: '0.82rem', color: '#C4581A', marginBottom: '1.25rem' }}>{extras.descH}</p>
              )}
              <div style={{ marginBottom: '1.5rem' }}>
                {(extras.amenities || []).map(a => (
                  <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0', borderBottom: '1px solid #F0E8DF', fontSize: '0.85rem', color: '#3D2010' }}>
                    <span style={{ color: '#E8520A', fontSize: '0.65rem' }}>✦</span>{a}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0', borderBottom: '1px solid #F0E8DF', fontSize: '0.85rem', color: '#3D2010' }}>
                  <span style={{ color: '#E8520A', fontSize: '0.65rem' }}>✦</span>Capacity: {room.capacity} Guests
                </div>
              </div>
              <div className="eyebrow" style={{ marginBottom: '0.3rem' }}>Tariff</div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '2rem', fontWeight: 700, color: '#E8520A' }}>
                ₹{room.pricePerNight.toLocaleString('en-IN')}
                <span style={{ fontSize: '0.95rem', color: '#C4581A', fontWeight: 400, fontFamily: 'Inter,sans-serif' }}> / night + GST</span>
              </div>
            </div>

            {/* RIGHT — Booking form */}
            <div style={{ background: '#fff', border: '1px solid #F0E8DF', borderRadius: 16, padding: '2rem' }}>
              <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.25rem', marginBottom: '1.5rem', color: '#1A0A00' }}>Reserve this room</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="Name" h="नाम" fieldKey="name" req form={form} errors={errors} upd={upd} />
                <FormField label="Email" h="ईमेल" fieldKey="email" type="email" req form={form} errors={errors} upd={upd} />
                <FormField label="Phone" h="फ़ोन" fieldKey="phone" type="tel" req form={form} errors={errors} upd={upd} />

                {/* Citizenship */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: '#3D2010', marginBottom: '0.3rem' }}>
                    Citizenship <span style={{ fontFamily: 'Noto Sans Devanagari', fontSize: '0.75rem', color: '#C4581A' }}>/ नागरिकता</span> <span style={{ color: '#E8520A' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                      <input type="radio" name="citizenship" value="Indian" checked={form.citizenship === 'Indian'} onChange={() => setForm(f => ({ ...f, citizenship: 'Indian', idType: 'Aadhar', idNumber: '' }))} /> Indian
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                      <input type="radio" name="citizenship" value="Foreigner" checked={form.citizenship === 'Foreigner'} onChange={() => setForm(f => ({ ...f, citizenship: 'Foreigner', idType: 'Passport', idNumber: '' }))} /> Foreigner
                    </label>
                  </div>
                </div>

                {/* ID Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: '#3D2010', marginBottom: '0.3rem' }}>
                    ID Type <span style={{ fontFamily: 'Noto Sans Devanagari', fontSize: '0.75rem', color: '#C4581A' }}>/ पहचान पत्र</span> <span style={{ color: '#E8520A' }}>*</span>
                  </label>
                  <select className="form-input" value={form.idType} onChange={upd('idType')} disabled={form.citizenship === 'Foreigner'}>
                    {form.citizenship === 'Indian' ? (
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

                <FormField label="ID Number" h="पहचान संख्या" fieldKey="idNumber" req form={form} errors={errors} upd={upd} />

                {/* Guests */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: '#3D2010', marginBottom: '0.3rem' }}>
                    Guests <span style={{ fontFamily: 'Noto Sans Devanagari', fontSize: '0.75rem', color: '#C4581A' }}>/ अतिथि</span>
                  </label>
                  <input type="number" min={1} max={room.capacity} className="form-input" value={form.guests} onChange={upd('guests')} />
                </div>

                {/* Check-in */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: '#3D2010', marginBottom: '0.3rem' }}>
                    Check-in <span style={{ fontFamily: 'Noto Sans Devanagari', fontSize: '0.75rem', color: '#C4581A' }}>/ आगमन</span> <span style={{ color: '#E8520A' }}>*</span>
                  </label>
                  <input type="date" min={today} className={`form-input${errors.checkIn ? ' error' : ''}`} value={form.checkIn} onChange={upd('checkIn')} />
                  {errors.checkIn && <span className="error-text">{errors.checkIn}</span>}
                </div>

                {/* Check-out */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: '#3D2010', marginBottom: '0.3rem' }}>
                    Check-out <span style={{ fontFamily: 'Noto Sans Devanagari', fontSize: '0.75rem', color: '#C4581A' }}>/ प्रस्थान</span> <span style={{ color: '#E8520A' }}>*</span>
                  </label>
                  <input type="date" min={form.checkIn || today} className={`form-input${errors.checkOut ? ' error' : ''}`} value={form.checkOut} onChange={upd('checkOut')} />
                  {errors.checkOut && <span className="error-text">{errors.checkOut}</span>}
                </div>

                {/* Special Requests */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: '#3D2010', marginBottom: '0.3rem' }}>
                    Special Requests <span style={{ fontFamily: 'Noto Sans Devanagari', fontSize: '0.75rem', color: '#C4581A' }}>/ विशेष अनुरोध</span>
                  </label>
                  <textarea rows={3} className="form-input" style={{ resize: 'vertical' }} value={form.requests} onChange={upd('requests')} placeholder="Any special requirements…" />
                </div>
              </div>

              {/* Pricing Summary */}
              {nights > 0 && (
                <div style={{ background: '#FDF6EE', borderRadius: 10, padding: '1rem', marginTop: '1rem', border: '1px solid #F0E8DF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: '#3D2010', marginBottom: '0.3rem' }}>
                    <span>{nights} night{nights !== 1 ? 's' : ''} × ₹{room.pricePerNight.toLocaleString('en-IN')}</span>
                    <span>₹{baseTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: '#C4581A', marginBottom: '0.5rem' }}>
                    <span>GST ({Math.round((room.gstRate || 0.12) * 100)}%)</span>
                    <span>₹{gst.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: '#1A0A00', borderTop: '1px solid #F0E8DF', paddingTop: '0.5rem' }}>
                    <span>Total</span>
                    <span style={{ color: '#E8520A' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button className="btn-primary" onClick={handleBook} disabled={paying} style={{ fontSize: '0.9rem', padding: '0.75rem 1.75rem' }}>
                  {paying ? <><span className="spinner" style={{ marginRight: 6 }} />Processing…</> : 'Book Now / आरक्षण करें'}
                </button>
              </div>
              {errors.submit && <p className="error-text" style={{ textAlign: 'center', marginTop: '0.5rem' }}>{errors.submit}</p>}
              <p style={{ fontSize: '0.74rem', color: '#C4581A', textAlign: 'center', marginTop: '0.75rem' }}>
                Cash payment collected at check-in. Booking is confirmed immediately.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <style>{`@media(max-width:768px){.detail-grid{grid-template-columns:1fr!important;}}`}</style>
    </>
  );
}
