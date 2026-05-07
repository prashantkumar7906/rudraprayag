import { useEffect, useRef, useState, useCallback } from 'react';

const STOPS = [
  {
    id: 'gangotri',
    km: 0,
    title: 'Gangotri Glacier',
    hindi: 'गंगोत्री हिमनद',
    alt: 'The Source — Gaumukh',
    elev: '3,892 m',
    desc: 'At Gaumukh, where ancient ice meets eternity, the Bhagirathi River is born — cradled in eternal Himalayan snow, pure and untouched by the world below.',
    img: '/journey/gangotri.png',
    accent: '#a8d8ea',
    dark: '#0a2a3d',
  },
  {
    id: 'uttarkashi',
    km: 100,
    title: 'Uttarkashi',
    hindi: 'उत्तरकाशी',
    alt: 'The Northern Kashi',
    elev: '1,158 m',
    desc: 'The river widens through Uttarkashi — the Northern Kashi — where stone temples have echoed with prayers for thousands of years.',
    img: '/journey/uttarkashi.png',
    accent: '#78b4d0',
    dark: '#0b2535',
  },
  {
    id: 'tehri',
    km: 175,
    title: 'Tehri Dam',
    hindi: 'टिहरी बाँध',
    alt: 'Where rivers pause',
    elev: '770 m',
    desc: 'The Bhagirathi slows into the vast Tehri reservoir — a serene blue jewel set deep in the Garhwal hills — before resuming its sacred southward journey.',
    img: '/journey/tehri.png',
    accent: '#3a8fb5',
    dark: '#0d2a3a',
  },
  {
    id: 'devprayag',
    km: 260,
    title: 'Devprayag',
    hindi: 'देवप्रयाग',
    alt: 'The Sacred Confluence',
    elev: '618 m',
    desc: 'At Devprayag, the Bhagirathi embraces the Alaknanda in an ancient, sacred union. Here, the river is finally named — Ganga — and begins her great journey to the plains.',
    img: '/journey/devprayag.png',
    accent: '#1a6a9a',
    dark: '#0d1f30',
  },
  {
    id: 'rudraprayag',
    km: 340,
    title: 'Rudraprayag',
    hindi: 'रुद्रप्रयाग',
    alt: 'Gateway to the Char Dham',
    elev: '895 m',
    desc: 'Where the Mandakini descends from sacred Kedarnath to join the Alaknanda — Rudraprayag stands as the living gateway to all four Dhams, where your journey of devotion begins.',
    img: '/journey/rudraprayag.png',
    accent: '#b8620a',
    dark: '#1a0800',
  },
];

export default function GangaJourneyHero() {
  const sectionRef = useRef(null);
  const ticking = useRef(false);
  const [progress, setProgress] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);
  const [crossfade, setCrossfade] = useState(1); // 1 = fully on new image

  const lastIdxRef = useRef(0);

  const onScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        const el = sectionRef.current;
        if (!el) {
          ticking.current = false;
          return;
        }
        const rect = el.getBoundingClientRect();
        const total = el.offsetHeight - window.innerHeight;
        const scrolled = Math.max(0, -rect.top);
        const p = Math.min(1, Math.max(0, scrolled / total));
        setProgress(p);

        const idx = Math.min(STOPS.length - 1, Math.floor(p * STOPS.length));
        if (idx !== lastIdxRef.current) {
          setPrevIdx(lastIdxRef.current);
          lastIdxRef.current = idx;
          setActiveIdx(idx);
          setCrossfade(0);
          setTimeout(() => setCrossfade(1), 50);
        }
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  const stop = STOPS[activeIdx];
  const prev = STOPS[prevIdx];

  return (
    <section ref={sectionRef} style={{ position: 'relative', height: '500vh' }}>

      {/* Sticky cinematic viewport */}
      <div style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}>

        {/* ── Background image: previous (fading out) ── */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${prev.img})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: crossfade === 0 ? 1 : 0,
          transition: 'opacity 0.9s ease',
        }} />

        {/* ── Background image: active (fading in) ── */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${stop.img})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: crossfade,
          transition: 'opacity 0.9s ease',
          transform: `scale(${1 + progress * 0.04})`,
          transformOrigin: 'center bottom',
          willChange: 'transform, opacity',
        }} />

        {/* ── Dark overlay replacing expensive CSS filter ── */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          pointerEvents: 'none',
        }} />

        {/* Colour-tinted gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(
            170deg,
            ${stop.dark}cc 0%,
            ${stop.dark}88 40%,
            transparent 70%,
            rgba(0,0,0,0.7) 100%
          )`,
          transition: 'background 0.9s ease',
        }} />

        {/* Bottom fade to cream */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
        }} />

        {/* ── Progress bar ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'rgba(255,255,255,0.1)',
          zIndex: 10,
        }}>
          <div style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${stop.accent}, #E8520A)`,
            transition: 'width 0.15s linear',
            boxShadow: `0 0 10px ${stop.accent}99`,
          }} />
        </div>

        {/* ── Header label ── */}
        <div style={{
          position: 'absolute', top: 22, left: 0, right: 0,
          textAlign: 'center', zIndex: 10, pointerEvents: 'none',
        }}>
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.7rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 500,
          }}>
            The Sacred Journey of Ganga
          </span>
        </div>

        {/* ── Stop dots nav (right side) ── */}
        <div style={{
          position: 'absolute', top: '50%', right: 28,
          transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: 20,
          zIndex: 10,
        }}>
          {STOPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'row-reverse' }}>
              {i <= activeIdx && (
                <span style={{
                  fontSize: '0.6rem',
                  color: i === activeIdx ? '#fff' : 'rgba(255,255,255,0.45)',
                  fontFamily: 'Inter, sans-serif',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.05em',
                  transition: 'color 0.4s',
                }}>
                  {s.title}
                </span>
              )}
              <div style={{
                width: i === activeIdx ? 11 : 6,
                height: i === activeIdx ? 11 : 6,
                borderRadius: '50%',
                background: i < activeIdx
                  ? '#E8520A'
                  : i === activeIdx
                    ? '#fff'
                    : 'rgba(255,255,255,0.2)',
                border: i === activeIdx ? `2px solid ${stop.accent}` : 'none',
                boxShadow: i === activeIdx ? `0 0 14px ${stop.accent}` : 'none',
                transition: 'all 0.45s ease',
                flexShrink: 0,
              }} />
            </div>
          ))}
        </div>

        {/* ── Animated river line ── */}
        <svg
          viewBox="0 0 1440 120"
          style={{
            position: 'absolute',
            bottom: '18%',
            width: '100%',
            pointerEvents: 'none',
            zIndex: 5,
          }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="30%" stopColor={`${stop.accent}cc`} />
              <stop offset="70%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          {[0, 1, 2].map(i => (
            <path
              key={i}
              d={`M0,${55 + i * 14} C360,${20 + i * 8} 720,${90 - i * 10} 1080,${50 + i * 5} S1440,${70 - i * 8} 1440,${55 + i * 14}`}
              fill="none"
              stroke="url(#rg)"
              strokeWidth={2.5 - i * 0.6}
              opacity={0.55 - i * 0.12}
              style={{ animation: `riverFlow ${4 + i * 1.5}s ease-in-out infinite alternate` }}
            />
          ))}
        </svg>

        {/* ── Main content ── */}
        <div style={{
          position: 'absolute',
          bottom: '22%',
          left: 0, right: 0,
          padding: '0 clamp(1.5rem, 6vw, 6rem)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          zIndex: 8,
        }}>

          {/* Left — stop details */}
          <div style={{ maxWidth: 520 }}>

            {/* Elevation / alt badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 999,
              padding: '0.28rem 1rem',
              marginBottom: '1rem',
              backdropFilter: 'blur(10px)',
              transition: 'background 0.6s',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: stop.accent, transition: 'background 0.6s', flexShrink: 0 }} />
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.12em' }}>
                {stop.elev}
              </span>
              <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.25)' }} />
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif' }}>
                {stop.alt}
              </span>
            </div>

            {/* Title */}
            <h2
              key={stop.id + '-h'}
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 'clamp(1.9rem, 4vw, 3rem)',
                color: '#fff',
                fontWeight: 700,
                margin: '0 0 0.2rem',
                lineHeight: 1.1,
                textShadow: '0 4px 30px rgba(0,0,0,0.6)',
                animation: 'slideUp 0.55s cubic-bezier(0.22,1,0.36,1) both',
              }}
            >
              {stop.title}
            </h2>

            {/* Hindi */}
            <p style={{
              fontFamily: 'Noto Sans Devanagari, sans-serif',
              fontSize: '1rem',
              color: stop.accent,
              margin: '0 0 0.9rem',
              letterSpacing: '0.03em',
              transition: 'color 0.6s',
            }}>
              {stop.hindi}
            </p>

            {/* Description */}
            <p
              key={stop.id + '-p'}
              style={{
                fontSize: 'clamp(0.85rem, 1.3vw, 0.97rem)',
                color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.8,
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                maxWidth: 440,
                animation: 'slideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.1s both',
              }}
            >
              {stop.desc}
            </p>
          </div>

          {/* Right — KM card */}
          <div style={{
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${stop.accent}44`,
            borderRadius: 18,
            padding: '1.2rem 2rem',
            textAlign: 'center',
            transition: 'border-color 0.6s',
            minWidth: 140,
          }}>
            <div style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '2.8rem',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              {stop.km}
            </div>
            <div style={{
              fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.45)',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginTop: 5,
            }}>
              km from source
            </div>
            {/* mini progress bar */}
            <div style={{
              marginTop: 12,
              height: 2,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 99,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(stop.km / 340) * 100}%`,
                background: `linear-gradient(90deg, ${stop.accent}, #fff)`,
                borderRadius: 99,
                transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)',
              }} />
            </div>
            <div style={{
              marginTop: 8,
              fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.1em',
            }}>
              {activeIdx + 1} / {STOPS.length} stops
            </div>
          </div>
        </div>

        {/* ── Final CTA at Rudraprayag ── */}
        {activeIdx === STOPS.length - 1 && (
          <div style={{
            position: 'absolute',
            top: '42%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 9,
            animation: 'slideUp 0.7s cubic-bezier(0.22,1,0.36,1) both',
            pointerEvents: 'none',
            width: '90%', maxWidth: 560,
          }}>
            <div style={{
              width: 1, height: 48,
              background: 'linear-gradient(#E8520A, transparent)',
              margin: '0 auto 18px',
            }} />
            <p style={{
              fontFamily: 'Noto Sans Devanagari, sans-serif',
              fontSize: 'clamp(0.82rem, 1.5vw, 1rem)',
              color: 'rgba(255,255,255,0.65)',
              marginBottom: 10,
              letterSpacing: '0.04em',
            }}>
              रुद्रप्रयाग — जहाँ मंदाकिनी अलकनंदा से मिलती है
            </p>
            <p style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)',
              color: '#fff',
              fontWeight: 600,
              textShadow: '0 0 40px rgba(232,82,10,0.6)',
              margin: 0,
            }}>
              Your donation sustains this sacred land
            </p>
          </div>
        )}

        {/* ── Scroll hint ── */}
        <div style={{
          position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
          opacity: progress < 0.04 ? 1 : 0,
          transition: 'opacity 0.5s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          zIndex: 10,
        }}>
          <span style={{
            fontSize: '0.6rem',
            color: 'rgba(255,255,255,0.35)',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}>
            Scroll to journey
          </span>
          <div style={{
            width: 1, height: 32,
            background: 'linear-gradient(rgba(255,255,255,0.5), transparent)',
            animation: 'scrollPulse 1.8s ease-in-out infinite',
          }} />
        </div>

      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes riverFlow {
          from { d: path("M0,55 C360,20 720,90 1080,50 S1440,70 1440,55"); }
          to   { d: path("M0,65 C360,35 720,70 1080,65 S1440,55 1440,65"); }
        }
        @keyframes scrollPulse {
          0%,100% { opacity: 0.25; transform: scaleY(0.85); }
          50%      { opacity: 0.8;  transform: scaleY(1.05); }
        }
      `}</style>
    </section>
  );
}
