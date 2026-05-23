import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const IMGS = [
  { src:'/images/gallery_user_1.jpg',       alt:'Gau Mata' },
  { src:'/images/gallery_user_2.jpg',       alt:'Riverside view' },
  { src:'/images/gallery_user_3.jpg',       alt:'Night sky' },
  { src:'/images/gallery_user_4.jpg',       alt:'Gau Mata calf' },
  { src:'/images/gallery_user_5.jpg',       alt:'Pooja rituals' },
  { src:'/images/gallery_devprayag.png',   alt:'Devprayag aerial — sacred river confluence' },
  { src:'/images/gallery_diyas.png',        alt:'Diyas burning in temple' },
  { src:'/images/gallery_diya_single.png',  alt:'Single diya flame' },
  { src:'/images/room_standard.png',        alt:'Non AC Room interior' },
  { src:'/images/room_deluxe.png',          alt:'AC Room interior' },
  { src:'/images/room_family.png',          alt:'Spacious AC Room interior' },
];

export default function GalleryPage() {
  const [lb, setLb] = useState(null);

  useEffect(() => {
    document.title = 'Gallery — Devprayag Dharamshala';
    const h = e => {
      if (lb===null) return;
      if (e.key==='ArrowLeft')  setLb(i=>(i-1+IMGS.length)%IMGS.length);
      if (e.key==='ArrowRight') setLb(i=>(i+1)%IMGS.length);
      if (e.key==='Escape')     setLb(null);
    };
    window.addEventListener('keydown',h);
    return ()=>window.removeEventListener('keydown',h);
  },[lb]);

  return (
    <>
      <Navbar />
      <main style={{background:'transparent',minHeight:'100vh',padding:'3.5rem 0 5rem'}}>
        <div className="container">
          <div style={{marginBottom:'2.5rem'}}>
            <div className="eyebrow" style={{marginBottom:'0.5rem'}}>Gallery</div>
            <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(1.8rem,3.5vw,2.6rem)',color:'#1A0A00',fontWeight:700,marginBottom:'0.25rem'}}>Sacred moments at the Sangam</h1>
            <p style={{fontFamily:'Noto Sans Devanagari,sans-serif',color:'#C4581A',fontSize:'0.95rem'}}>संगम के पवित्र क्षण</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {IMGS.map((img,i)=>(
              <div key={i} onClick={()=>setLb(i)} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&setLb(i)} aria-label={img.alt}
                style={{height:290,borderRadius:16,overflow:'hidden',cursor:'pointer',position:'relative',background:'#F0E8DF'}}>
                <img src={img.src} alt={img.alt} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover',display:'block',transition:'transform 0.35s'}}
                  onMouseEnter={e=>e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'} />
                <div style={{position:'absolute',inset:0,background:'rgba(232,82,10,0)',transition:'background 0.25s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(232,82,10,0.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(232,82,10,0)'} />
              </div>
            ))}
          </div>
        </div>
      </main>

      {lb!==null&&(
        <div onClick={()=>setLb(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <button onClick={e=>{e.stopPropagation();setLb(i=>(i-1+IMGS.length)%IMGS.length);}} style={{position:'absolute',left:24,background:'rgba(255,255,255,0.12)',border:'none',color:'#fff',fontSize:'2rem',borderRadius:'50%',width:52,height:52,cursor:'pointer'}}>‹</button>
          <img src={IMGS[lb].src} alt={IMGS[lb].alt} onClick={e=>e.stopPropagation()} style={{maxHeight:'85vh',maxWidth:'85vw',borderRadius:12,objectFit:'contain'}} />
          <button onClick={e=>{e.stopPropagation();setLb(i=>(i+1)%IMGS.length);}} style={{position:'absolute',right:24,background:'rgba(255,255,255,0.12)',border:'none',color:'#fff',fontSize:'2rem',borderRadius:'50%',width:52,height:52,cursor:'pointer'}}>›</button>
          <button onClick={()=>setLb(null)} style={{position:'absolute',top:20,right:20,background:'rgba(255,255,255,0.12)',border:'none',color:'#fff',fontSize:'1.2rem',borderRadius:'50%',width:42,height:42,cursor:'pointer'}}>×</button>
          <div style={{position:'absolute',bottom:20,left:0,right:0,textAlign:'center',color:'rgba(255,255,255,0.55)',fontSize:'0.82rem'}}>{IMGS[lb].alt}</div>
        </div>
      )}
      <Footer />
    </>
  );
}
