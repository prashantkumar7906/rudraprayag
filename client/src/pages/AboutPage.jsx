import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CARDS = [
  { title:'The Sacred Sangam', hindi:'पवित्र संगम', body:'Rudraprayag is one of the Panch Prayag — five sacred confluences in Uttarakhand. Here, the emerald Alaknanda meets the Mandakini river. This confluence is supremely auspicious for bathing, worship, and Pitru Tarpan.' },
  { title:'Char Dham Yatra Route', hindi:'चार धाम यात्रा मार्ग', body:'Rudraprayag is a key gateway on the Char Dham Yatra — the sacred pilgrimage to Kedarnath and Badrinath. Pilgrims traditionally stop here to bathe at the Sangam before proceeding to the holy Himalayan shrines.' },
  { title:'Our Dharamshala', hindi:'हमारी धर्मशाला', body:'We provide clean, comfortable and affordable accommodation to pilgrims of all means. Every room booking includes complimentary sattvic meals. Our morning aarti at the Sangam Ghat is a deeply moving experience.' },
  { title:'Yoga & Wellness', hindi:'योग और आरोग्य', body:'Deepen your spiritual journey with daily yoga sessions led by certified instructor Nakul Sharma. Registered and trained in classical Hatha yoga, Nakul guides guests through morning practices to centre the mind and body before pilgrimage.' },
  { title:'Near Upcoming Railway Station', hindi:'रेलवे स्टेशन के निकट', body:'The dharamshala is conveniently located close to the upcoming Rudraprayag railway station, making it easy for pilgrims arriving by train to begin their yatra with comfort and grace.' },
];

export default function AboutPage() {
  useEffect(() => { document.title = 'About — Rudraprayag Dharamshala'; }, []);

  return (
    <>
      <Navbar />
      <main style={{background:'#FDF6EE',minHeight:'100vh',padding:'3.5rem 0 5rem'}}>
        <div className="container">
          <div style={{marginBottom:'3rem'}}>
            <div className="eyebrow" style={{marginBottom:'0.5rem'}}>About Us</div>
            <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(1.8rem,3.5vw,2.6rem)',color:'#1A0A00',fontWeight:700,marginBottom:'0.25rem'}}>A place of peace &amp; seva</h1>
            <p style={{fontFamily:'Noto Sans Devanagari,sans-serif',color:'#C4581A',fontSize:'0.95rem',marginBottom:'1.5rem'}}>शांति और सेवा का स्थान</p>
            <p style={{fontSize:'0.97rem',color:'#3D2010',lineHeight:1.85,maxWidth:620}}>Rudraprayag Dharamshala has served pilgrims at the sacred confluence of the Alaknanda and Mandakini rivers — a gateway to the Char Dham. Run by a charitable trust, our mission is to make the Char Dham Yatra accessible and spiritually enriching for every devotee. Every room includes complimentary sattvic meals, and certified yoga sessions are available daily.</p>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2.5rem',alignItems:'start'}} className="about-grid">
            {/* Left */}
            <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
              {CARDS.map(({title,hindi,body})=>(
                <div key={title} style={{background:'#fff',border:'1px solid #F0E8DF',borderRadius:12,padding:'1.5rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'0.6rem'}}>
                    <h3 style={{fontFamily:'Playfair Display,serif',fontSize:'1.05rem',color:'#1A0A00'}}>{title}</h3>
                    <span style={{fontFamily:'Noto Sans Devanagari,sans-serif',fontSize:'0.75rem',color:'#E8520A',marginLeft:'0.5rem',flexShrink:0}}>{hindi}</span>
                  </div>
                  <p style={{fontSize:'0.875rem',color:'#3D2010',lineHeight:1.8,margin:0}}>{body}</p>
                </div>
              ))}
              <Link to="/donate">
                <button className="btn-primary" style={{width:'100%',justifyContent:'center'}}>♡ Support our seva / हमारी सेवा का समर्थन करें</button>
              </Link>
            </div>

            {/* Right */}
            <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
              <div style={{background:'#fff',border:'1px solid #F0E8DF',borderRadius:12,overflow:'hidden'}}>
                <iframe
                  title="Chitrakoot Dham Sumerpur Rudraprayag"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3456.1!2d79.0206579!3d30.2997658!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3909c95e4c2e9a05%3A0x98fbdfe6f25e6aa1!2sChitrakoot%20dham%20Sumerpur%20Rudraprayag!5e0!3m2!1sen!2sin!4v1714000000000!5m2!1sen!2sin"
                  width="100%" height="380" style={{border:0,display:'block'}} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div style={{background:'#fff',border:'1px solid #F0E8DF',borderRadius:12,padding:'1.5rem'}}>
                <h3 style={{fontFamily:'Playfair Display,serif',fontSize:'1.05rem',marginBottom:'1rem',color:'#1A0A00'}}>Visit Us</h3>
                <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                  {[{label:'Address',text:'Chitrakoot Dham, Sumerpur, Badrinath Rd, Rudraprayag, Uttarakhand 246171'},{label:'Phone',text:'+91 98765 43210',href:'tel:+919876543210'},{label:'Email',text:'stay@rudraprayagdharamshala.in',href:'mailto:stay@rudraprayagdharamshala.in'}].map(({label,text,href})=>(
                    <div key={text} style={{display:'flex',gap:'0.75rem',alignItems:'flex-start',fontSize:'0.87rem',color:'#3D2010'}}>
                      <span style={{color:'#E8520A',fontWeight:600,fontSize:'0.75rem',minWidth:44,flexShrink:0,paddingTop:'0.05rem'}}>{label}</span>
                      {href?<a href={href} style={{color:'#3D2010'}}>{text}</a>:<span>{text}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <style>{`@media(max-width:768px){.about-grid{grid-template-columns:1fr!important;}}`}</style>
    </>
  );
}
