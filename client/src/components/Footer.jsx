import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: '#fff', borderTop: '1px solid #F0E8DF', paddingTop: '3.5rem', paddingBottom: '2rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid #F0E8DF' }}>

          {/* Col 1 — Brand */}
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.05rem', color: '#1A0A00', marginBottom: '0.2rem' }}>Hari Om Trust</div>
            <div style={{ fontFamily: 'Noto Sans Devanagari, sans-serif', fontSize: '0.82rem', color: '#E8520A', marginBottom: '0.9rem' }}>चित्रकूट धाम</div>
            <p style={{ fontSize: '0.85rem', color: '#3D2010', lineHeight: 1.75, maxWidth: 240 }}>
              A peaceful pilgrim guest house at the sacred Alaknanda–Mandakini Sangam, Rudraprayag.
            </p>
          </div>

          {/* Col 2 — Explore */}
          <div>
            <div className="eyebrow" style={{ marginBottom: '1rem' }}>Explore</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {[['Rooms','/rooms'],['Gallery','/gallery'],['About','/about'],['Donate / दान','/donate']].map(([l,to]) => (
                <Link key={to} to={to} style={{ color: '#3D2010', fontSize: '0.88rem', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color='#E8520A'} onMouseLeave={e => e.currentTarget.style.color='#3D2010'}>{l}</Link>
              ))}
            </div>
          </div>

          {/* Col 3 — Contact */}
          <div>
            <div className="eyebrow" style={{ marginBottom: '1rem' }}>Contact</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.85rem', color: '#3D2010' }}>
                <span style={{ color: '#E8520A', fontWeight: 600, fontSize: '0.75rem', minWidth: 44, flexShrink: 0 }}>Addr.</span>
                <span>Chitrakoot Dham, Sumerpur, Badrinath Rd, Rudraprayag, Uttarakhand 246171</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: '#E8520A', fontWeight: 600, fontSize: '0.75rem', minWidth: 44, flexShrink: 0 }}>Tel.</span>
                <a href="tel:+919876543210" style={{ color: '#3D2010' }}>+91 98765 43210</a>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: '#E8520A', fontWeight: 600, fontSize: '0.75rem', minWidth: 44, flexShrink: 0 }}>Email</span>
                <a href="mailto:stay@rudraprayagdharamshala.in" style={{ color: '#3D2010' }}>stay@rudraprayagdharamshala.in</a>
              </div>
            </div>
          </div>

          {/* Col 4 — Sangam Seva */}
          <div>
            <div className="eyebrow" style={{ marginBottom: '1rem' }}>Sangam Seva</div>
            <p style={{ fontSize: '0.85rem', color: '#3D2010', lineHeight: 1.75, marginBottom: '0.9rem' }}>
              Your contribution sustains free meals and shelter for sadhus and pilgrims.
            </p>
            <Link to="/donate" style={{ color: '#E8520A', fontWeight: 600, fontSize: '0.88rem' }}>Offer a donation &rarr;</Link>
          </div>
        </div>

        <div style={{ paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <p style={{ fontSize: '0.78rem', color: '#C4581A', margin: 0 }}>© {new Date().getFullYear()} Hari Om Trust. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/" style={{ fontSize: '0.78rem', color: '#E8520A', textDecoration: 'none', fontWeight: '500' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>Re-enter Gateway / द्वार प्रवेश</Link>
            <span style={{ fontSize: '0.78rem', color: '#F0E8DF' }}>|</span>
            <p style={{ fontSize: '0.78rem', color: '#C4581A', margin: 0 }}>Built with ♡ for pilgrims</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
