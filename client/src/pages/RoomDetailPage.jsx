import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api/axios';

const DB = {
  'non-ac': { name:'Non AC Room', hindi:'गैर-एसी कक्ष', capacity:'Up to 2', price:800,  image:'/images/room_standard.png', desc:'A clean, peaceful room with all essentials for a comfortable pilgrimage stay near the Sangam. Ideal for solo pilgrims and couples.', descH:'संगम के निकट एक स्वच्छ और शांतिपूर्ण कक्ष।', amenities:['Balcony View','Free WiFi','Tea/Coffee','Attached Bath','Daily Housekeeping'] },
  'ac':     { name:'AC Room',     hindi:'एसी कक्ष',     capacity:'Up to 3', price:1500, image:'/images/room_deluxe.png',   desc:'Spacious air-conditioned room with a private balcony overlooking the sacred valley. Wake up to cool Himalayan air and the sound of flowing rivers.', descH:'बालकनी के साथ विशाल वातानुकूलित कक्ष, घाटी का मनोरम दृश्य।', amenities:['AC','Balcony View','Free WiFi','Attached Bath','Tea/Coffee','Daily Housekeeping'] },
};

// Defined OUTSIDE the page component so React doesn't remount it on every render
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
  const { roomId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const room = DB[roomId];
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({ name:'', email:'', phone:'', guests:1, checkIn: state?.checkIn||'', checkOut: state?.checkOut||'', requests:'', citizenship:'Indian', idType:'Aadhar', idNumber:'' });
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);

  const nights = form.checkIn && form.checkOut ? Math.max(0, Math.round((new Date(form.checkOut)-new Date(form.checkIn))/86400000)) : 0;
  const total  = nights * (room?.price||0);

  useEffect(() => {
    if (!room) { navigate('/rooms',{replace:true}); return; }
    document.title = `${room.name} — Devprayag Dharamshala`;
  }, [room, navigate]);

  if (!room) return null;

  const upd = k => e => { setForm(f=>({...f,[k]:e.target.value})); setErrors(er=>({...er,[k]:''})); };

  const validate = () => {
    const e={};
    if (!form.name.trim()) e.name='Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email='Valid email required';
    const phone = form.phone.replace(/\s/g,'');
    if (form.citizenship === 'Indian') {
      if (!/^[6-9]\d{9}$/.test(phone)) e.phone='Valid 10-digit mobile required';
    } else {
      if (!phone || phone.length < 8) e.phone='Valid mobile required';
    }
    if (!form.idNumber.trim()) e.idNumber='ID Number required';
    if (!form.checkIn) e.checkIn='Select check-in';
    if (!form.checkOut) e.checkOut='Select check-out';
    if (form.checkOut && form.checkIn && form.checkOut<=form.checkIn) e.checkOut='Check-out must be after check-in';
    return e;
  };

  const handleBook = async () => {
    const errs=validate(); if(Object.keys(errs).length) return setErrors(errs);
    setPaying(true);
    try {
      const res = await api.post('/bookings/initiate', { roomTypeId:roomId, checkIn:form.checkIn, checkOut:form.checkOut, guests:Number(form.guests), guestName:form.name.trim(), guestEmail:form.email.trim(), guestPhone:form.phone.replace(/\s/g,''), citizenship:form.citizenship, idType:form.idType, idNumber:form.idNumber.trim(), specialRequests:form.requests.trim() });
      const { bookingId, razorpayOrderId, amount, keyId } = res.data;
      new window.Razorpay({ key:keyId||import.meta.env.VITE_RAZORPAY_KEY_ID, amount, currency:'INR', name:'Devprayag Dharamshala', description:`${room.name} — ${nights} night${nights!==1?'s':''}`, order_id:razorpayOrderId, prefill:{name:form.name,email:form.email,contact:form.phone}, theme:{color:'#E8520A'}, handler:()=>navigate(`/booking-confirmation/${bookingId}`), modal:{ondismiss:()=>setPaying(false)} }).open();
    } catch(err) { setErrors({submit:err.message||'Booking failed. Try again.'}); setPaying(false); }
  };


  return (
    <>
      <Navbar />
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <main style={{background:'#FDF6EE',minHeight:'100vh',padding:'3rem 0 5rem'}}>
        <div className="container">
          <div style={{display:'grid',gridTemplateColumns:'2fr 3fr',gap:'2.5rem',alignItems:'start'}} className="detail-grid">

            {/* LEFT */}
            <div>
              <div style={{borderRadius:16,overflow:'hidden',marginBottom:'1.5rem',boxShadow:'0 8px 32px rgba(26,10,0,0.1)'}}>
                <img src={room.image} alt={room.name} style={{width:'100%',height:270,objectFit:'cover',display:'block'}} />
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'0.5rem'}}>
                <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'1.5rem',color:'#1A0A00'}}>{room.name}</h1>
                <span style={{fontFamily:'Noto Sans Devanagari,sans-serif',fontSize:'0.85rem',color:'#E8520A'}}>{room.hindi}</span>
              </div>
              <p style={{fontSize:'0.88rem',color:'#3D2010',lineHeight:1.75,marginBottom:'0.4rem'}}>{room.desc}</p>
              <p style={{fontFamily:'Noto Sans Devanagari,sans-serif',fontSize:'0.82rem',color:'#C4581A',marginBottom:'1.25rem'}}>{room.descH}</p>
              <div style={{marginBottom:'1.5rem'}}>
                {room.amenities.map(a=>(
                  <div key={a} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.45rem 0',borderBottom:'1px solid #F0E8DF',fontSize:'0.85rem',color:'#3D2010'}}>
                    <span style={{color:'#E8520A',fontSize:'0.65rem'}}>✦</span>{a}
                  </div>
                ))}
              </div>
              <div className="eyebrow" style={{marginBottom:'0.3rem'}}>Tariff</div>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:'2rem',fontWeight:700,color:'#E8520A'}}>
                ₹{room.price.toLocaleString('en-IN')}<span style={{fontSize:'0.95rem',color:'#C4581A',fontWeight:400,fontFamily:'Inter,sans-serif'}}> / night</span>
              </div>
            </div>

            {/* RIGHT */}
            <div style={{background:'#fff',border:'1px solid #F0E8DF',borderRadius:16,padding:'2rem'}}>
              <h2 style={{fontFamily:'Playfair Display,serif',fontSize:'1.25rem',marginBottom:'1.5rem',color:'#1A0A00'}}>Reserve this room</h2>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <FormField label="Name"  h="नाम"   fieldKey="name"  req form={form} errors={errors} upd={upd} />
                <FormField label="Email" h="ईमेल"  fieldKey="email" type="email" req form={form} errors={errors} upd={upd} />
                <FormField label="Phone" h="फ़ोन"  fieldKey="phone" type="tel"   req form={form} errors={errors} upd={upd} />
                {/* Citizenship */}
                <div style={{gridColumn:'span 2'}}>
                  <label style={{display:'block',fontSize:'0.82rem',fontWeight:500,color:'#3D2010',marginBottom:'0.3rem'}}>Citizenship <span style={{fontFamily:'Noto Sans Devanagari',fontSize:'0.75rem',color:'#C4581A'}}>/ नागरिकता</span> <span style={{color:'#E8520A'}}>*</span></label>
                  <div style={{display:'flex',gap:'1rem'}}>
                    <label style={{display:'flex',alignItems:'center',gap:'0.3rem',fontSize:'0.85rem'}}><input type="radio" name="citizenship" value="Indian" checked={form.citizenship==='Indian'} onChange={e=>{setForm(f=>({...f,citizenship:'Indian',idType:'Aadhar',idNumber:''}));}} /> Indian</label>
                    <label style={{display:'flex',alignItems:'center',gap:'0.3rem',fontSize:'0.85rem'}}><input type="radio" name="citizenship" value="Foreigner" checked={form.citizenship==='Foreigner'} onChange={e=>{setForm(f=>({...f,citizenship:'Foreigner',idType:'Passport',idNumber:''}));}} /> Foreigner</label>
                  </div>
                </div>

                {/* ID Type */}
                <div>
                  <label style={{display:'block',fontSize:'0.82rem',fontWeight:500,color:'#3D2010',marginBottom:'0.3rem'}}>ID Type <span style={{fontFamily:'Noto Sans Devanagari',fontSize:'0.75rem',color:'#C4581A'}}>/ पहचान पत्र</span> <span style={{color:'#E8520A'}}>*</span></label>
                  <select className={`form-input${errors.idType?' error':''}`} value={form.idType} onChange={upd('idType')} disabled={form.citizenship==='Foreigner'}>
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

                {/* ID Number */}
                <FormField label="ID Number" h="पहचान संख्या" fieldKey="idNumber" req form={form} errors={errors} upd={upd} />
                {/* Guests */}
                <div>
                  <label style={{display:'block',fontSize:'0.82rem',fontWeight:500,color:'#3D2010',marginBottom:'0.3rem'}}>Guests <span style={{fontFamily:'Noto Sans Devanagari',fontSize:'0.75rem',color:'#C4581A'}}>/ अतिथि</span></label>
                  <input type="number" min={1} max={10} className="form-input" value={form.guests} onChange={upd('guests')} />
                </div>
                {/* Check-in */}
                <div>
                  <label style={{display:'block',fontSize:'0.82rem',fontWeight:500,color:'#3D2010',marginBottom:'0.3rem'}}>Check-in <span style={{fontFamily:'Noto Sans Devanagari',fontSize:'0.75rem',color:'#C4581A'}}>/ आगमन</span> <span style={{color:'#E8520A'}}>*</span></label>
                  <input type="date" min={today} className={`form-input${errors.checkIn?' error':''}`} value={form.checkIn} onChange={upd('checkIn')} />
                  {errors.checkIn&&<span className="error-text">{errors.checkIn}</span>}
                </div>
                {/* Check-out */}
                <div>
                  <label style={{display:'block',fontSize:'0.82rem',fontWeight:500,color:'#3D2010',marginBottom:'0.3rem'}}>Check-out <span style={{fontFamily:'Noto Sans Devanagari',fontSize:'0.75rem',color:'#C4581A'}}>/ प्रस्थान</span> <span style={{color:'#E8520A'}}>*</span></label>
                  <input type="date" min={form.checkIn||today} className={`form-input${errors.checkOut?' error':''}`} value={form.checkOut} onChange={upd('checkOut')} />
                  {errors.checkOut&&<span className="error-text">{errors.checkOut}</span>}
                </div>
                {/* Requests */}
                <div style={{gridColumn:'span 2'}}>
                  <label style={{display:'block',fontSize:'0.82rem',fontWeight:500,color:'#3D2010',marginBottom:'0.3rem'}}>Special Requests <span style={{fontFamily:'Noto Sans Devanagari',fontSize:'0.75rem',color:'#C4581A'}}>/ विशेष अनुरोध</span></label>
                  <textarea rows={3} className="form-input" style={{resize:'vertical'}} value={form.requests} onChange={upd('requests')} placeholder="Any special requirements…" />
                </div>
              </div>

              {/* Total + Pay */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'1px solid #F0E8DF',marginTop:'1.25rem',paddingTop:'1.25rem',flexWrap:'wrap',gap:'1rem'}}>
                <div>
                  <div className="eyebrow" style={{marginBottom:'0.2rem'}}>Total</div>
                  <div style={{fontFamily:'Playfair Display,serif',fontSize:'1.7rem',fontWeight:700,color:'#1A0A00',lineHeight:1}}>₹{total.toLocaleString('en-IN')}</div>
                  <div style={{fontSize:'0.75rem',color:'#C4581A',marginTop:'0.2rem'}}>{nights} night{nights!==1?'s':''} × ₹{room.price.toLocaleString('en-IN')}</div>
                </div>
                <button className="btn-primary" onClick={handleBook} disabled={paying} style={{fontSize:'0.9rem',padding:'0.75rem 1.75rem'}}>
                  {paying?<><span className="spinner" style={{marginRight:6}}/>Processing…</>:'Pay & Book / भुगतान करें'}
                </button>
              </div>
              {errors.submit&&<p className="error-text" style={{textAlign:'center',marginTop:'0.5rem'}}>{errors.submit}</p>}
              <p style={{fontSize:'0.74rem',color:'#C4581A',textAlign:'center',marginTop:'0.75rem'}}>Payments are processed securely via Razorpay.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <style>{`@media(max-width:768px){.detail-grid{grid-template-columns:1fr!important;}}`}</style>
    </>
  );
}
