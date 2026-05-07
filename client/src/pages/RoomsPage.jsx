import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ROOMS = [
  { id: 'non-ac', name: 'Non AC Room', hindi: 'गैर-एसी कक्ष', capacity: 'Up to 2', view: 'Free WiFi',     price: 800,  image: '/images/non_ac_room_1.jpg', desc: 'A clean, peaceful room with all essentials for a comfortable pilgrimage stay near the Sangam.' },
  { id: 'ac',     name: 'AC Room',     hindi: 'एसी कक्ष',      capacity: 'Up to 3', view: 'Balcony View', price: 1500, image: '/images/ac_room_1.jpg',   desc: 'Spacious air-conditioned room with a private balcony overlooking the valley and the cool Himalayan breeze.' },
];


export default function RoomsPage() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const today = new Date().toISOString().split('T')[0];
  useEffect(() => { 
    document.title = 'Rooms — Hari Om Trust, Chitrakoot Dham'; 
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ background: 'transparent', minHeight: '100vh' }}>
        <div className="container" style={{ paddingTop: '3.5rem', paddingBottom: '5rem' }}>

          <div style={{ marginBottom: '2.5rem' }}>
            <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Our Rooms</div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', color: '#1A0A00', fontWeight: 700, marginBottom: '0.25rem' }}>Choose your nest by the Sangam</h1>
            <p style={{ fontFamily: 'Noto Sans Devanagari, sans-serif', color: '#C4581A', fontSize: '0.95rem' }}>संगम के निकट अपना विश्राम-स्थल चुनें</p>
          </div>

          {/* Search bar */}
          <div style={{ background: '#fff', border: '1px solid #F0E8DF', borderRadius: 12, padding: '0.9rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '3rem', boxShadow: '0 2px 12px rgba(26,10,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flex: 1, minWidth: 180 }}>
              <span style={{ color: '#E8520A', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: 24 }}>IN</span>
              <div style={{ flex: 1 }}>
                <div className="eyebrow" style={{ marginBottom: '0.15rem', fontSize: '0.62rem' }}>Check-in</div>
                <input type="date" min={today} value={checkIn} onChange={e => setCheckIn(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '0.9rem', color: '#1A0A00', width: '100%', background: 'transparent', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ width: 1, height: 44, background: '#F0E8DF', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flex: 1, minWidth: 180 }}>
              <span style={{ color: '#E8520A', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: 24 }}>OUT</span>
              <div style={{ flex: 1 }}>
                <div className="eyebrow" style={{ marginBottom: '0.15rem', fontSize: '0.62rem' }}>Check-out</div>
                <input type="date" min={checkIn || today} value={checkOut} onChange={e => setCheckOut(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '0.9rem', color: '#1A0A00', width: '100%', background: 'transparent', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }} />
              </div>
            </div>
            <button className="btn-primary" style={{ flexShrink: 0, padding: '0.65rem 1.5rem', fontSize: '0.88rem' }}>Check Availability</button>
          </div>

          {/* Room cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {ROOMS.map(room => (
              <div key={room.id} className="room-card">
                <div style={{ height: 230, overflow: 'hidden' }}>
                  <img src={room.image} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.35s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'} />
                </div>
                <div style={{ padding: '1.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 700, color: '#1A0A00' }}>{room.name}</h3>
                    <span style={{ fontFamily: 'Noto Sans Devanagari, sans-serif', fontSize: '0.77rem', color: '#E8520A' }}>{room.hindi}</span>
                  </div>
                  <p style={{ fontSize: '0.83rem', color: '#3D2010', lineHeight: 1.65, marginBottom: '0.9rem' }}>{room.desc}</p>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
                    <span className="amenity-pill">Capacity: {room.capacity}</span>
                    <span className="amenity-pill">{room.view}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#E8520A', fontWeight: 700, fontSize: '0.97rem' }}>FROM ₹{room.price.toLocaleString('en-IN')}<span style={{ fontWeight: 400, fontSize: '0.78rem', color: '#C4581A' }}> / night</span></div>
                    <button onClick={() => navigate(`/rooms/${room.id}`, { state: { checkIn, checkOut } })} className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem' }}>Book →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
