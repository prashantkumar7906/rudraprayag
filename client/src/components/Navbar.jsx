import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/',        label: 'Home' },
  { to: '/rooms',   label: 'Rooms' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about',   label: 'About' },
  { to: '/donate',  label: 'Donate' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const active = (to) => to === '/' ? pathname === '/' : pathname.startsWith(to);

  const linkStyle = (to) => ({
    padding: '0.45rem 0.9rem', borderRadius: 8, fontSize: '0.88rem', fontWeight: 500,
    fontFamily: 'Inter, sans-serif', color: active(to) ? '#E8520A' : '#3D2010',
    background: active(to) ? 'rgba(232,82,10,0.07)' : 'transparent',
    textDecoration: 'none', transition: 'color 0.15s',
  });

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Top Social Banner */}
      <div style={{ background: '#1A0A00', color: '#FDF6EE', padding: '0.45rem 0', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FDF6EE', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.9, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.9}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            Follow on Instagram
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FDF6EE', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.9, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.9}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            Subscribe on YouTube
          </a>
        </div>
      </div>
      <nav style={{ background: '#fff', borderBottom: '1px solid #F0E8DF', boxShadow: '0 1px 12px rgba(26,10,0,0.05)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#FFD700,#FFA500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 10px rgba(232,82,10,0.25)', overflow: 'hidden', padding: 2 }}>
            <img src="/images/logo_harom.png" alt="Har Om" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#1A0A00', lineHeight: 1.25 }}>Hari Om Trust</div>
            <div style={{ fontFamily: 'Noto Sans Devanagari, sans-serif', fontSize: '0.72rem', color: '#E8520A', lineHeight: 1.3 }}>चित्रकूट धाम</div>
          </div>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: '0.1rem' }}>
          {LINKS.map(({ to, label }) => <Link key={to} to={to} style={linkStyle(to)}>{label}</Link>)}
          <Link to="/rooms" style={{ marginLeft: '0.6rem', textDecoration: 'none' }}>
            <button className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.55rem 1.2rem' }}>
              Book Now&nbsp;<span style={{ fontFamily: 'Noto Sans Devanagari, sans-serif', fontSize: '0.76rem', opacity: 0.9 }}>/ अभी बुक करें</span>
            </button>
          </Link>
        </div>

        {/* Mobile burger */}
        <button className="md:hidden" onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#3D2010' }} aria-label="Menu">
          {open
            ? <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            : <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          }
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: '#fff', borderTop: '1px solid #F0E8DF', padding: '0.5rem 1.5rem 1rem' }}>
          {LINKS.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} style={{ display: 'block', padding: '0.7rem 0', color: active(to) ? '#E8520A' : '#3D2010', fontWeight: 500, borderBottom: '1px solid #F0E8DF', fontSize: '0.92rem' }}>
              {label}
            </Link>
          ))}
          <Link to="/rooms" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ width: '100%', marginTop: '0.9rem' }}>Book Now / अभी बुक करें</button>
          </Link>
        </div>
      )}
    </nav>
    </header>
  );
}
