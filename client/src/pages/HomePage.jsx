import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ROOMS = [
  { id: 'non-ac', name: 'Non AC Room', hindi: 'गैर-एसी कक्ष', capacity: 'Up to 2', view: 'Free WiFi',     price: 800,  image: '/images/non_ac_room_1.webp', desc: 'A clean, peaceful room with all essentials for a comfortable pilgrimage stay near the sacred Sangam.' },
  { id: 'ac',     name: 'AC Room',     hindi: 'एसी कक्ष',      capacity: 'Up to 3', view: 'Balcony View', price: 1500, image: '/images/ac_room_1.webp',   desc: 'Spacious air-conditioned room with a private balcony overlooking the valley and the cool Himalayan mountain breeze.' },
];


const TRUST = [
  { label: 'Secure Booking' },
  { label: 'Daily Aarti' },
  { label: 'Near Railway Station' },
  { label: 'Complimentary Sattvic Meals' },
  { label: 'Yoga Classes' },
];

export default function HomePage() {
  useEffect(() => { document.title = 'Hari Om Trust — Chitrakoot Dham, Rudraprayag'; }, []);

  return (
    <>
      <Navbar />
      <main>
        {/* ══ HERO ══ */}
        <section style={{ background: 'transparent', padding: '5rem 0 4rem' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }} className="hero-grid">

              {/* Left */}
              <div className="fade-in-up">
                {/* Location badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.9rem', borderRadius: 999, border: '1.5px solid #E8520A', background: '#FDF6EE', fontSize: '0.72rem', fontWeight: 700, color: '#E8520A', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#E8520A' }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Sangam · Rudraprayag, Uttarakhand
                </div>

                {/* H1 dark */}
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem,4vw,3.3rem)', fontWeight: 700, color: '#1A0A00', lineHeight: 1.2, marginBottom: '0.25rem' }}>
                  Where two rivers meet,
                </h1>
                {/* H1 orange italic */}
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem,4vw,3.3rem)', fontWeight: 700, fontStyle: 'italic', color: '#E8520A', lineHeight: 1.2, marginBottom: '1rem' }}>
                  your soul finds rest.
                </h1>

                {/* Hindi */}
                <p style={{ fontFamily: 'Noto Sans Devanagari, sans-serif', fontSize: '0.92rem', color: '#3D2010', lineHeight: 1.65, marginBottom: '1.2rem' }}>
                  जहाँ दो नदियाँ मिलती हैं, वहीं आत्मा को विश्राम मिलता है।
                </p>

                {/* Body */}
                <p style={{ fontSize: '0.97rem', color: '#3D2010', lineHeight: 1.8, marginBottom: '2rem', maxWidth: 460 }}>
                  A pilgrim guest house at Chitrakoot Dham, Rudraprayag — complimentary sattvic meals, certified yoga classes with instructor Nakul Sharma, and peaceful rooms near the upcoming railway station.
                </p>

                {/* CTAs */}
                <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                  <Link to="/rooms"><button className="btn-primary" style={{ fontSize: '0.92rem', padding: '0.75rem 1.6rem' }}>Book a Stay / प्रवास बुक करें →</button></Link>
                  <Link to="/donate">
                    <button className="btn-outline" style={{ fontSize: '0.92rem', padding: '0.75rem 1.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#E8520A' }}>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      Offer Seva / सेवा दान
                    </button>
                  </Link>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '2.2rem', flexWrap: 'wrap' }}>
                  {[['18+','Years of seva'],['2.4k','Pilgrims hosted'],['4.8★','Guest rating']].map(([v,l]) => (
                    <div key={l}>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 700, color: '#1A0A00', lineHeight: 1, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        {v.endsWith('★') ? (
                          <>
                            {v.slice(0, -1)}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#E8520A" stroke="#E8520A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateY(-1px)' }}>
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </>
                        ) : v}
                      </div>
                      <div style={{ fontSize: '0.77rem', color: '#C4581A', marginTop: '0.2rem', fontFamily: 'Inter, sans-serif' }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — hero image */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{
                  borderRadius: 20,
                  overflow: 'hidden',
                  width: '100%',
                  maxWidth: 520,
                  aspectRatio: '4/3',
                  animation: 'heroFloat 4s ease-in-out infinite',
                  boxShadow: '0 20px 60px rgba(232,82,10,0.22)',
                  willChange: 'transform',
                }}>
                  <img src="/images/hero_temple.webp" alt="Chitrakoot Dham at the sacred river confluence" fetchpriority="high" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ TRUST BAR ══ */}
        <section style={{ background: 'transparent', borderTop: '1px solid #F0E8DF', padding: '1.5rem 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
              {TRUST.map(({ label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8520A', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.83rem', color: '#3D2010', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ ROOMS PREVIEW ══ */}
        <section style={{ background: 'transparent', padding: '5rem 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: '0.4rem' }}>Stay With Us</div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: '#1A0A00', marginBottom: '0.2rem' }}>Rooms made for stillness</h2>
                <p className="hindi" style={{ fontSize: '0.9rem' }}>शांति के लिए बने कक्ष</p>
              </div>
              <Link to="/rooms" style={{ color: '#E8520A', fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>View all rooms →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {ROOMS.map(room => <RoomPreviewCard key={room.id} room={room} />)}
            </div>
          </div>
        </section>

        {/* ══ WHY STAY WITH US ══ */}
        <section style={{ background: 'linear-gradient(160deg,#1A0A00 0%,#2C1200 60%,#3D1A00 100%)', padding: '5.5rem 0', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative ring */}
          <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: 500, height: 500, borderRadius: '50%', border: '1.5px solid rgba(232,82,10,0.12)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: 320, height: 320, borderRadius: '50%', border: '1.5px solid rgba(232,82,10,0.1)', pointerEvents: 'none' }} />

          <div className="container" style={{ position: 'relative' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <div className="eyebrow" style={{ color: '#E8520A', marginBottom: '0.6rem' }}>Why Stay With Us</div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.7rem,3.2vw,2.4rem)', color: '#FDF6EE', fontWeight: 700, marginBottom: '0.4rem' }}>
                More than a place to sleep
              </h2>
              <p style={{ fontFamily: 'Noto Sans Devanagari, sans-serif', color: '#C4581A', fontSize: '0.95rem' }}>एक अनुभव जो आत्मा को छू जाए</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>

              {/* Card 1 — Yoga */}
              <div className="feature-card" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(232,82,10,0.2)', borderRadius: 20, padding: '2rem 1.75rem', transition: 'transform 0.3s, background 0.3s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.background='rgba(232,82,10,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#E8520A,#C4581A)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', boxShadow: '0 8px 24px rgba(232,82,10,0.35)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5z"/>
                    <path d="M3 20c0-4 4-7 9-7s9 3 9 7"/>
                    <path d="M12 12v4M8 18h8"/>
                  </svg>
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: '#FDF6EE', fontWeight: 700, marginBottom: '0.5rem' }}>Certified Yoga Sessions</h3>
                <p style={{ fontFamily: 'Noto Sans Devanagari, sans-serif', fontSize: '0.72rem', color: '#E8520A', marginBottom: '0.75rem' }}>प्रमाणित योग कक्षाएँ</p>
                <p style={{ fontSize: '0.85rem', color: 'rgba(253,246,238,0.72)', lineHeight: 1.75, margin: 0 }}>
                  Daily morning yoga led by <strong style={{ color: '#FDF6EE' }}>Nakul Sharma</strong>, a registered and certified instructor trained in classical Hatha yoga — the perfect way to begin your pilgrimage day.
                </p>
              </div>

              {/* Card 2 — Rudraksha Garden */}
              <div className="feature-card" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(232,82,10,0.2)', borderRadius: 20, padding: '2rem 1.75rem', transition: 'transform 0.3s, background 0.3s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.background='rgba(232,82,10,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#2D6A2D,#1A4A1A)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', boxShadow: '0 8px 24px rgba(45,106,45,0.4)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22V12"/>
                    <path d="M12 12C12 12 7 9 7 5a5 5 0 0 1 10 0c0 4-5 7-5 7z"/>
                    <path d="M12 17c-3 0-6-1.5-6-4"/>
                    <path d="M12 17c3 0 6-1.5 6-4"/>
                  </svg>
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: '#FDF6EE', fontWeight: 700, marginBottom: '0.5rem' }}>Sacred Rudraksha Garden</h3>
                <p style={{ fontFamily: 'Noto Sans Devanagari, sans-serif', fontSize: '0.72rem', color: '#E8520A', marginBottom: '0.75rem' }}>रुद्राक्ष वाटिका</p>
                <p style={{ fontSize: '0.85rem', color: 'rgba(253,246,238,0.72)', lineHeight: 1.75, margin: 0 }}>
                  Stroll through our peaceful garden shaded by sacred <strong style={{ color: '#FDF6EE' }}>Rudraksha trees</strong> — the beads of Lord Shiva himself. A rare blessing few dharamshalas can offer.
                </p>
              </div>

              {/* Card 3 — Railway Station */}
              <div className="feature-card" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(232,82,10,0.2)', borderRadius: 20, padding: '2rem 1.75rem', transition: 'transform 0.3s, background 0.3s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.background='rgba(232,82,10,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#1A4A7A,#0D2E55)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', boxShadow: '0 8px 24px rgba(26,74,122,0.4)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="11" rx="3"/>
                    <path d="M7 18v2M17 18v2M2 11h20"/>
                    <circle cx="7" cy="15" r="1" fill="white"/>
                    <circle cx="17" cy="15" r="1" fill="white"/>
                    <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
                  </svg>
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: '#FDF6EE', fontWeight: 700, marginBottom: '0.5rem' }}>Near Upcoming Railway Station</h3>
                <p style={{ fontFamily: 'Noto Sans Devanagari, sans-serif', fontSize: '0.72rem', color: '#E8520A', marginBottom: '0.75rem' }}>रेलवे स्टेशन के निकट</p>
                <p style={{ fontSize: '0.85rem', color: 'rgba(253,246,238,0.72)', lineHeight: 1.75, margin: 0 }}>
                  Strategically located next to the <strong style={{ color: '#FDF6EE' }}>upcoming Rudraprayag railway station</strong>, making us the most convenient first stop for pilgrims arriving by train on the Char Dham Yatra.
                </p>
              </div>

              {/* Card 4 — Sattvic Meals */}
              <div className="feature-card" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(232,82,10,0.2)', borderRadius: 20, padding: '2rem 1.75rem', transition: 'transform 0.3s, background 0.3s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.background='rgba(232,82,10,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#B8860B,#8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', boxShadow: '0 8px 24px rgba(184,134,11,0.4)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 11l19-9-9 19-2-8-8-2z"/>
                  </svg>
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: '#FDF6EE', fontWeight: 700, marginBottom: '0.5rem' }}>Complimentary Sattvic Meals</h3>
                <p style={{ fontFamily: 'Noto Sans Devanagari, sans-serif', fontSize: '0.72rem', color: '#E8520A', marginBottom: '0.75rem' }}>सात्विक भोजन निःशुल्क</p>
                <p style={{ fontSize: '0.85rem', color: 'rgba(253,246,238,0.72)', lineHeight: 1.75, margin: 0 }}>
                  Every room booking includes <strong style={{ color: '#FDF6EE' }}>complimentary sattvic meals</strong> — pure, wholesome food prepared with devotion to nourish both body and spirit throughout your stay.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ══ ANNADAN BANNER ══ */}
        <section style={{ background: 'transparent', padding: '0 0 5rem' }}>
          <div className="container">
            <div style={{ background: '#fff', border: '1px solid #F0E8DF', borderLeft: '4px solid #E8520A', borderRadius: 16, padding: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Annadan Seva</div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', color: '#1A0A00', marginBottom: '0.2rem' }}>Feed a pilgrim today</h2>
                <p className="hindi" style={{ fontSize: '0.88rem', marginBottom: '0.75rem' }}>आज एक यात्री को भोजन कराएँ</p>
                <p style={{ color: '#3D2010', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 520, margin: 0 }}>
                  ₹251 sponsors a sattvic meal. Every contribution sustains the kitchen, shelter and morning aarti at the Sangam.
                </p>
              </div>
              <Link to="/donate"><button className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.75rem 1.6rem', flexShrink: 0 }}>Offer Seva / सेवा दान दें →</button></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <style>{`
        @media(max-width:768px){.hero-grid{grid-template-columns:1fr!important;}}
        @keyframes heroFloat {
          0%   { transform: translateY(0px);    box-shadow: 0 20px 60px rgba(232,82,10,0.22); }
          50%  { transform: translateY(-14px);  box-shadow: 0 34px 80px rgba(232,82,10,0.30); }
          100% { transform: translateY(0px);    box-shadow: 0 20px 60px rgba(232,82,10,0.22); }
        }
      `}</style>
    </>
  );
}

function RoomPreviewCard({ room }) {
  return (
    <div className="room-card">
      <div style={{ height: 200, overflow: 'hidden' }}>
        <img src={room.image} alt={room.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.35s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'} />
      </div>
      <div style={{ padding: '1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', fontWeight: 700 }}>{room.name}</h3>
          <span style={{ fontFamily: 'Noto Sans Devanagari, sans-serif', fontSize: '0.75rem', color: '#E8520A' }}>{room.hindi}</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#3D2010', lineHeight: 1.65, marginBottom: '0.85rem' }}>{room.desc}</p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span className="amenity-pill">{room.capacity}</span>
          <span className="amenity-pill">{room.view}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#E8520A', fontWeight: 700, fontSize: '0.95rem' }}>FROM ₹{room.price.toLocaleString('en-IN')}<span style={{ fontWeight: 400, fontSize: '0.78rem', color: '#C4581A' }}> / night</span></div>
          <Link to={`/rooms/${room.id}`}><button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}>Book →</button></Link>
        </div>
      </div>
    </div>
  );
}
