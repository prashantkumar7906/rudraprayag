import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api/axios';

const PRESETS = [101, 251, 501, 1001, 2501];
const SEVAS = [
  { title:'Annadan',     hindi:'अन्नदान', desc:'₹251 feeds one pilgrim a sattvic meal.' },
  { title:'Sangam Aarti',hindi:'आरती',    desc:'₹501 supports a day of evening aarti.' },
  { title:'Shelter',     hindi:'आश्रय',  desc:'₹1001 covers a night\'s stay for a needy traveller.' },
];
const PURPOSES = ['Annadan / अन्नदान','Sangam Aarti / संगम आरती','Shelter / आश्रय','General / सामान्य दान'];

export default function DonatePage() {
  const navigate = useNavigate();
  const [sel, setSel] = useState(251);
  const [amt, setAmt] = useState('251');
  const [form, setForm] = useState({ name:'', email:'', phone:'', purpose:PURPOSES[0], msg:'' });
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);

  const effective = amt ? Number(amt) : sel;
  useEffect(() => { document.title = 'Donate — Devprayag Dharamshala'; }, []);

  const pick = v => { setSel(v); setAmt(String(v)); setErrors(e=>({...e,amount:''})); };
  const upd = k => e => { setForm(f=>({...f,[k]:e.target.value})); setErrors(er=>({...er,[k]:''})); };

  const validate = () => {
    const e={};
    if (!effective||effective<11) e.amount='Minimum donation is ₹11.';
    if (!form.name.trim()) e.name='Name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email='Valid email required.';
    return e;
  };

  const handleDonate = async () => {
    const errs=validate(); if(Object.keys(errs).length) return setErrors(errs);
    setErrors({}); setPaying(true);
    try {
      const res = await api.post('/donations/initiate',{ amount:effective, donorName:form.name.trim(), donorEmail:form.email.trim(), message:`${form.purpose} — ${form.msg.trim()}` });
      const {donationId,razorpayOrderId,amount,keyId}=res.data;
      new window.Razorpay({ key:keyId||import.meta.env.VITE_RAZORPAY_KEY_ID, amount, currency:'INR', name:'Devprayag Dharamshala Trust', description:'Donation — Dharma Seva', order_id:razorpayOrderId, prefill:{name:form.name,email:form.email}, theme:{color:'#E8520A'}, handler:()=>navigate(`/thank-you?amount=${effective}&ref=${donationId}&name=${encodeURIComponent(form.name)}`), modal:{ondismiss:()=>setPaying(false)} }).open();
    } catch(err) { setErrors({submit:err.message||'Donation failed. Try again.'}); setPaying(false); }
  };

  return (
    <>
      <Navbar />
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <main style={{background:'#FDF6EE',minHeight:'100vh',padding:'3.5rem 0 5rem'}}>
        <div className="container">

          {/* Header */}
          <div style={{marginBottom:'2.5rem'}}>
            <div className="eyebrow" style={{marginBottom:'0.5rem'}}>♡ Annadan &amp; Seva</div>
            <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(1.8rem,3.5vw,2.6rem)',color:'#1A0A00',fontWeight:700,marginBottom:'0.2rem'}}>Offer a donation</h1>
            <p style={{fontFamily:'Noto Sans Devanagari,sans-serif',color:'#C4581A',fontSize:'0.95rem',marginBottom:'0.9rem'}}>अपनी सेवा अर्पित करें</p>
            <p style={{fontSize:'0.92rem',color:'#3D2010',lineHeight:1.75,maxWidth:560}}>Your contribution sustains the kitchen, the daily aarti, and shelter for sadhus and pilgrims at the Sangam. Donate any amount above ₹11.</p>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'2fr 3fr',gap:'2rem',alignItems:'start'}} className="donate-grid">

            {/* LEFT — seva cards */}
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              {SEVAS.map(({title,hindi,desc})=>(
                <div key={title} style={{background:'#fff',border:'1px solid #F0E8DF',borderRadius:12,padding:'1.25rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'0.35rem'}}>
                    <span style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:'0.95rem',color:'#1A0A00'}}>{title}</span>
                    <span style={{fontFamily:'Noto Sans Devanagari,sans-serif',fontSize:'0.72rem',color:'#E8520A',marginLeft:'0.5rem'}}>/ {hindi}</span>
                  </div>
                  <p style={{fontSize:'0.82rem',color:'#C4581A',margin:0,lineHeight:1.6}}>{desc}</p>
                </div>
              ))}
            </div>

            {/* RIGHT — donation form */}
            <div style={{background:'#fff',border:'1px solid #F0E8DF',borderRadius:16,padding:'2rem'}}>
              <div className="eyebrow" style={{marginBottom:'0.75rem'}}>Choose Amount / राशि चुनें</div>

              {/* Preset pills */}
              <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'0.9rem'}}>
                {PRESETS.map(p=>(
                  <button key={p} onClick={()=>pick(p)} style={{ background:sel===p?'#E8520A':'#fff', color:sel===p?'#fff':'#3D2010', border:sel===p?'2px solid #E8520A':'2px solid #E4D0C0', borderRadius:999, padding:'0.45rem 1.1rem', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:'0.88rem', cursor:'pointer', transition:'all 0.15s', minHeight:40 }}>
                    ₹{p.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div style={{marginBottom:'1.25rem'}}>
                <label style={{display:'block',fontSize:'0.82rem',fontWeight:500,color:'#3D2010',marginBottom:'0.3rem'}}>Custom amount (₹)</label>
                <input type="number" min={11} className={`form-input${errors.amount?' error':''}`} value={amt} onChange={e=>{setAmt(e.target.value);setSel(null);}} placeholder="e.g. 751" />
                {errors.amount&&<span className="error-text">{errors.amount}</span>}
              </div>

              {/* Form fields */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                <div>
                  <label style={{display:'block',fontSize:'0.82rem',fontWeight:500,color:'#3D2010',marginBottom:'0.3rem'}}>Name / नाम <span style={{color:'#E8520A'}}>*</span></label>
                  <input className={`form-input${errors.name?' error':''}`} value={form.name} onChange={upd('name')} placeholder="Full name" />
                  {errors.name&&<span className="error-text">{errors.name}</span>}
                </div>
                <div>
                  <label style={{display:'block',fontSize:'0.82rem',fontWeight:500,color:'#3D2010',marginBottom:'0.3rem'}}>Email / ईमेल <span style={{color:'#E8520A'}}>*</span></label>
                  <input type="email" className={`form-input${errors.email?' error':''}`} value={form.email} onChange={upd('email')} placeholder="you@example.com" />
                  {errors.email&&<span className="error-text">{errors.email}</span>}
                </div>
                <div>
                  <label style={{display:'block',fontSize:'0.82rem',fontWeight:500,color:'#3D2010',marginBottom:'0.3rem'}}>Phone / फ़ोन <span style={{color:'#C4581A',fontWeight:400}}>(optional)</span></label>
                  <input type="tel" className="form-input" value={form.phone} onChange={upd('phone')} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label style={{display:'block',fontSize:'0.82rem',fontWeight:500,color:'#3D2010',marginBottom:'0.3rem'}}>Purpose / उद्देश्य</label>
                  <select className="form-input" value={form.purpose} onChange={upd('purpose')}>{PURPOSES.map(p=><option key={p}>{p}</option>)}</select>
                </div>
                <div style={{gridColumn:'span 2'}}>
                  <label style={{display:'block',fontSize:'0.82rem',fontWeight:500,color:'#3D2010',marginBottom:'0.3rem'}}>Message / संदेश</label>
                  <textarea rows={3} className="form-input" style={{resize:'vertical'}} value={form.msg} onChange={upd('msg')} placeholder="Optional dedication or message" />
                </div>
              </div>

              {errors.submit&&<p className="error-text" style={{textAlign:'center',marginBottom:'0.75rem'}}>{errors.submit}</p>}

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.75rem'}}>
                <p style={{fontSize:'0.75rem',color:'#C4581A',margin:0}}>Secure checkout &middot; Razorpay</p>
                <button className="btn-primary" onClick={handleDonate} disabled={paying} style={{fontSize:'0.9rem',padding:'0.75rem 1.75rem'}}>
                  {paying?<><span className="spinner" style={{marginRight:6}}/>Processing…</>:'Donate / दान करें'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <style>{`@media(max-width:768px){.donate-grid{grid-template-columns:1fr!important;}}`}</style>
    </>
  );
}
