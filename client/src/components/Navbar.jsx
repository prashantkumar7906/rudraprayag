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
    <nav style={{ background: '#fff', borderBottom: '1px solid #F0E8DF', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 12px rgba(26,10,0,0.05)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#FFD700,#FFA500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 10px rgba(232,82,10,0.25)', overflow: 'hidden', padding: 2 }}>
            <img src="/images/logo_harom.png" alt="Har Om" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#1A0A00', lineHeight: 1.25 }}>Rudraprayag Dharamshala</div>
            <div style={{ fontFamily: 'Noto Sans Devanagari, sans-serif', fontSize: '0.72rem', color: '#E8520A', lineHeight: 1.3 }}>रुद्रप्रयाग धर्मशाला</div>
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
  );
}
