import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function GangaLandingPage() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [activeJourney, setActiveJourney] = useState(0);

  // Monitor Scroll for parallax and timeline triggers
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // HTML5 GPU-Accelerated Canvas Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    // Mouse interaction tracking
    const mouse = { x: null, y: null, targetX: null, targetY: null, radius: 150 };
    
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };
    
    const handleMouseLeave = () => {
      mouse.targetX = null;
      mouse.targetY = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Setup dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle & Wave variables
    const particles = [];
    const particleCount = 120;
    const streams = [];
    const streamCount = 28;

    // Sacred Particle (Celestial embers/ash) Definition
    class SacredParticle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 100;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = -(Math.random() * 0.8 + 0.4);
        this.size = Math.random() * 2 + 0.5;
        this.alpha = Math.random() * 0.6 + 0.1;
        this.color = Math.random() > 0.4 
          ? '226, 232, 240' // slate light
          : '249, 115, 22'; // saffron ember
        this.wobbleSpeed = Math.random() * 0.02 + 0.005;
        this.wobbleDistance = Math.random() * 1.5 + 0.5;
        this.time = Math.random() * 100;
      }

      update() {
        this.time += this.wobbleSpeed;
        this.x += this.vx + Math.sin(this.time) * this.wobbleDistance * 0.05;
        this.y += this.vy;

        // Mouse influence
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= (dx / dist) * force * 1.2;
            this.y -= (dy / dist) * force * 1.2;
          }
        }

        // Reset if goes off screen
        if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.fill();
      }
    }

    // Procedural River Stream Definition
    class RiverStream {
      constructor(index) {
        this.index = index;
        this.reset();
      }

      reset() {
        this.x = (canvas.width * 0.4) + Math.random() * (canvas.width * 0.2);
        this.y = -50 - Math.random() * 150;
        this.speed = Math.random() * 2 + 1.5;
        this.thickness = Math.random() * 1.8 + 0.5;
        this.history = [];
        this.maxHistory = Math.floor(Math.random() * 30 + 35);
        this.hue = Math.random() > 0.3 ? 184 : 34; // Cyan or Golden-Orange
        this.saturation = 90;
        this.lightness = Math.random() > 0.5 ? 65 : 50;
      }

      update(shivlingaCenter, shivlingaY, lingaRadius, baseWidth, baseHeight) {
        // Track history for path drawing (creating continuous trails)
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > this.maxHistory) {
          this.history.shift();
        }

        // Flow downwards
        this.y += this.speed;

        // Fluid mechanics wrapping around the central Shivlinga
        const dx = this.x - shivlingaCenter;
        const dy = this.y - shivlingaY;
        const lingaTop = shivlingaY - 90;

        // Interaction near Linga cylinder
        if (this.y > lingaTop && this.y < shivlingaY) {
          const distanceX = Math.abs(dx);
          const safeRadius = lingaRadius + 8 + (this.index % 5);
          if (distanceX < safeRadius) {
            const side = dx >= 0 ? 1 : -1;
            // Push gently around the cylinder
            this.x += (safeRadius - distanceX) * 0.08 * side;
          }
        } 
        // Interaction near Yoni base
        else if (this.y >= shivlingaY && this.y < shivlingaY + baseHeight + 20) {
          const safeWidth = baseWidth / 2 + 10 + (this.index % 8);
          const distanceX = Math.abs(dx);
          if (distanceX < safeWidth) {
            const side = dx >= 0 ? 1 : -1;
            // Flow along the spout/shelf outwards
            this.x += (safeWidth - distanceX) * 0.12 * side;
          }
        }

        // Add soft turbulence waves
        this.x += Math.sin(this.y * 0.02 + this.index) * 0.25;

        // Mouse follow/repel
        if (mouse.x !== null && mouse.y !== null) {
          const mdx = mouse.x - this.x;
          const mdy = mouse.y - this.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < mouse.radius * 0.8) {
            const force = (mouse.radius * 0.8 - mdist) / (mouse.radius * 0.8);
            this.x -= (mdx / mdist) * force * 1.5;
          }
        }

        if (this.y > canvas.height + 50) {
          this.reset();
        }
      }

      draw() {
        if (this.history.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(this.history[0].x, this.history[0].y);
        for (let i = 1; i < this.history.length; i++) {
          ctx.lineTo(this.history[i].x, this.history[i].y);
        }
        ctx.lineWidth = this.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Glowing stroke style
        ctx.strokeStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${0.45})`;
        ctx.stroke();
      }
    }

    // Populate arrays
    for (let i = 0; i < particleCount; i++) {
      particles.push(new SacredParticle());
    }
    for (let i = 0; i < streamCount; i++) {
      streams.push(new RiverStream(i));
    }

    // Main Canvas Render Loop
    const render = () => {
      // Lerp mouse coordinates for butter smoothness
      if (mouse.targetX !== null && mouse.targetY !== null) {
        if (mouse.x === null) {
          mouse.x = mouse.targetX;
          mouse.y = mouse.targetY;
        } else {
          mouse.x += (mouse.targetX - mouse.x) * 0.08;
          mouse.y += (mouse.targetY - mouse.y) * 0.08;
        }
      } else {
        mouse.x = null;
        mouse.y = null;
      }

      // Deep obsidian-black background with a slight fade trail for water motion blur
      ctx.fillStyle = 'rgba(13, 13, 14, 0.16)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Ambient Grid lines in the background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const gridSize = 80;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Compute Shivlinga position metrics based on current viewport
      const shivlingaCenter = canvas.width / 2;
      const shivlingaY = canvas.height * 0.56;
      const lingaWidth = 90;
      const lingaHeight = 135;
      const lingaRadius = lingaWidth / 2;
      const baseWidth = 200;
      const baseHeight = 45;

      // Glow behind the Shivlinga (Backlit Himalayan Mist)
      const glowGrad = ctx.createRadialGradient(
        shivlingaCenter, shivlingaY - 40, 10,
        shivlingaCenter, shivlingaY - 40, 240
      );
      glowGrad.addColorStop(0, 'rgba(0, 242, 254, 0.12)'); // Cyan glow
      glowGrad.addColorStop(0.5, 'rgba(232, 82, 10, 0.05)'); // Saffron overlay
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(shivlingaCenter, shivlingaY - 40, 240, 0, Math.PI * 2);
      ctx.fill();

      // Render River Streams
      streams.forEach(stream => {
        stream.update(shivlingaCenter, shivlingaY, lingaRadius, baseWidth, baseHeight);
        stream.draw();
      });

      // RENDER SHIVLINGA SILHOUETTE
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#111215'; // Dark Obsidian Stone color
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1.5;

      // 1. Draw the cylindrical Linga capsule
      ctx.beginPath();
      ctx.arc(shivlingaCenter, shivlingaY - lingaHeight + lingaRadius, lingaRadius, Math.PI, 0, false);
      ctx.lineTo(shivlingaCenter + lingaRadius, shivlingaY);
      ctx.lineTo(shivlingaCenter - lingaRadius, shivlingaY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 2. Draw Yoni Base (Pitha)
      ctx.beginPath();
      ctx.moveTo(shivlingaCenter - baseWidth / 2, shivlingaY);
      ctx.lineTo(shivlingaCenter + baseWidth / 2, shivlingaY);
      ctx.quadraticCurveTo(shivlingaCenter + baseWidth / 2 + 10, shivlingaY + baseHeight / 2, shivlingaCenter + baseWidth / 2, shivlingaY + baseHeight);
      // Flow spout to the left
      ctx.lineTo(shivlingaCenter - baseWidth / 2, shivlingaY + baseHeight);
      ctx.quadraticCurveTo(shivlingaCenter - baseWidth / 2 - 25, shivlingaY + baseHeight / 2, shivlingaCenter - baseWidth / 2, shivlingaY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. Draw Supporting Pedestal (Lower pedestal block)
      ctx.beginPath();
      ctx.moveTo(shivlingaCenter - baseWidth * 0.35, shivlingaY + baseHeight);
      ctx.lineTo(shivlingaCenter + baseWidth * 0.35, shivlingaY + baseHeight);
      ctx.lineTo(shivlingaCenter + baseWidth * 0.25, shivlingaY + baseHeight + 35);
      ctx.lineTo(shivlingaCenter - baseWidth * 0.25, shivlingaY + baseHeight + 35);
      ctx.closePath();
      ctx.fillStyle = '#0a0a0c';
      ctx.fill();
      ctx.stroke();

      // 4. Draw the Sacred Tripundra (Three horizontal stripes of ashes on Shiva's forehead)
      const stripY = shivlingaY - lingaHeight + 50;
      const stripeWidth = 40;
      const stripeHeight = 3;
      const gap = 3;

      ctx.fillStyle = 'rgba(226, 232, 240, 0.7)'; // White-ish ash
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.roundRect(shivlingaCenter - stripeWidth / 2, stripY + j * (stripeHeight + gap), stripeWidth, stripeHeight, 1);
        ctx.fill();
      }

      // Red Tilak Dot in center of Tripundra
      ctx.fillStyle = 'rgba(232, 82, 10, 0.95)'; // Deep Saffron / Red
      ctx.beginPath();
      ctx.arc(shivlingaCenter, stripY + stripeHeight + gap, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 5. Draw sacred Bilva Leaf silhouette at the base
      ctx.fillStyle = 'rgba(16, 185, 129, 0.4)'; // soft green glow
      ctx.beginPath();
      ctx.ellipse(shivlingaCenter - 25, shivlingaY + baseHeight / 2, 8, 4, -Math.PI/6, 0, Math.PI*2);
      ctx.ellipse(shivlingaCenter, shivlingaY + baseHeight / 2 + 5, 8, 4, 0, 0, Math.PI*2);
      ctx.ellipse(shivlingaCenter + 25, shivlingaY + baseHeight / 2, 8, 4, Math.PI/6, 0, Math.PI*2);
      ctx.fill();

      // Render particles
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Subtle atmospheric storm flash occasionally
      if (Math.random() > 0.997) {
        ctx.fillStyle = 'rgba(0, 242, 254, 0.035)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Spatial Flowing Journey timeline milestones matching `/journey` WebPs
  const JOURNEY_STEPS = [
    {
      title: 'Gaumukh Glacier',
      hindi: 'गौमुख ग्लेशियर',
      elevation: '3,892 Meters',
      desc: 'The birth of divinity. Maa Ganga emerges from the mouth of ice, a pure stream crystallized directly from cosmic silence.',
      image: '/journey/gangotri.webp', // fallback to gangotri webp
    },
    {
      title: 'Gangotri Temple',
      hindi: 'गंगोत्री धाम',
      elevation: '3,100 Meters',
      desc: 'Where King Bhagiratha did severe penance for a thousand years. Here, the river is welcomed and sanctified by sacred bells.',
      image: '/journey/gangotri.webp',
    },
    {
      title: 'Uttarkashi Kashi',
      hindi: 'उत्तरकाशी',
      elevation: '1,158 Meters',
      desc: 'The ancient valley of sages. The stream gains power, echoing through deep pine forests and divine stone shrines.',
      image: '/journey/uttarkashi.webp',
    },
    {
      title: 'Rudraprayag Sangam',
      hindi: 'रुद्रप्रयाग संगम',
      elevation: '895 Meters',
      desc: 'The sacred marriage. The roaring Alaknanda merges with the fierce Mandakini in a thunderous embrace of cosmic energies.',
      image: '/journey/rudraprayag.webp',
    },
    {
      title: 'Devprayag Confluence',
      hindi: 'देवप्रयाग संगम',
      elevation: '472 Meters',
      desc: 'The ultimate union. The silent turquoise Alaknanda meets the turbulent jade Bhagirathi to officially form the river Ganga.',
      image: '/journey/devprayag.webp',
    },
    {
      title: 'Kashi Vishwanath',
      hindi: 'काशी विश्वनाथ',
      elevation: '80 Meters',
      desc: 'The city of light. Ganga caresses the ghats of Kashi, liberating billions of souls with eternal fire aarti rites.',
      image: '/journey/tehri.webp', // tehri/aarti fallback
    }
  ];

  return (
    <div 
      ref={containerRef}
      className="bg-[#0D0D0E] text-[#E2E8F0] min-h-screen relative overflow-x-hidden selection:bg-[#F97316] selection:text-white"
      style={{ fontFamily: 'Inter, sans-serif', '--dark': '#FDF6EE' }}
    >
      {/* Background Ambience Canvas */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none opacity-85">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Floating interactive glowing mist overlays */}
      <div className="fixed top-0 left-0 w-full h-1/3 bg-gradient-to-b from-[#0D0D0E] to-transparent z-1 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#0D0D0E] to-transparent z-1 pointer-events-none" />

      {/* Atmospheric Mist Backgrounds */}
      <div className="fixed top-1/4 left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-950/10 blur-[150px] pointer-events-none z-0" />

      {/* Cinematic Header Nav */}
      <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b border-white/5 bg-[#0D0D0E]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/images/logo_harom.webp" 
              alt="Hari Om Logo" 
              className="w-10 h-10 rounded-full border border-orange-500/30 object-cover" 
            />
            <div>
              <span className="font-semibold text-sm tracking-[0.2em] text-white uppercase block">Hari Om Trust</span>
              <span className="font-hindi text-[10px] tracking-[0.1em] text-orange-500 block">चित्रकूट धाम — रुद्रप्रयाग</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Link 
              to="/home" 
              className="hidden sm:inline-flex text-xs tracking-[0.15em] text-[#94A3B8] hover:text-[#09F6FF] uppercase transition-colors"
            >
              Skip Intro
            </Link>
            <Link 
              to="/home" 
              className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-[#F97316] text-white hover:text-[#0D0D0E] text-xs font-semibold tracking-[0.15em] uppercase border border-white/10 hover:border-transparent transition-all duration-300 shadow-lg hover:shadow-orange-500/20"
            >
              Enter Confluence &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* 🎬 1. HERO VIEWPORT */}
      <section className="min-h-screen flex flex-col justify-between items-center text-center relative z-10 pt-28 pb-12 px-6">
        {/* Decorative Top Subtitle */}
        <div className="fade-in-up mt-8">
          <span className="text-[10px] tracking-[0.4em] font-bold text-[#09F6FF] uppercase bg-cyan-950/40 border border-cyan-500/20 rounded-full px-4 py-1.5 backdrop-blur-md">
            Mantra of Cosmic Stillness
          </span>
          <h2 className="text-sm font-hindi tracking-[0.2em] text-orange-400 mt-4 max-w-lg mx-auto opacity-75">
            नमामि गङ्गे तव पादपङ्कजं सुर असुरैः पूजित दिव्य रूपम्
          </h2>
        </div>

        {/* Central Core Title */}
        <div className="max-w-4xl my-auto">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-serif text-white tracking-wide leading-tight">
            Where Divinity <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#09F6FF] via-[#E2E8F0] to-[#F97316]">
              Meets Eternity
            </span>
          </h1>
          
          <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-xl mx-auto tracking-wide leading-relaxed font-light">
            Witness the celestial descent of Maa Ganga from the icy peaks of Himavant, captured in the locks of Mahadev, now flowing to guide your spirit.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/home" 
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#F97316] to-[#E8520A] hover:brightness-110 text-white text-xs font-bold tracking-[0.2em] uppercase transition-all shadow-xl shadow-orange-950/30"
            >
              संगम में प्रवेश करें / Enter Confluence
            </Link>
            <a 
              href="#story" 
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold tracking-[0.2em] uppercase border border-white/10 transition-all"
            >
              Seek Narrative
            </a>
          </div>
        </div>

        {/* Animated Scroll Indicator */}
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="text-[9px] tracking-[0.35em] text-[#94A3B8] uppercase">Scroll to Descend</span>
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* 📖 2. THE DESCENT OF GANGA (Story Section) */}
      <section id="story" className="py-32 relative z-10 border-t border-white/5 bg-[#0D0D0E]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="eyebrow text-[#F97316] tracking-[0.3em]">The Mythic Narrative</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-white mt-3">The Cosmic Taming</h2>
            <div className="w-16 h-[1.5px] bg-[#09F6FF] mx-auto mt-6" />
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Story Image Panel */}
            <div className="relative group overflow-hidden rounded-3xl border border-white/10 bg-[#1C1E22] aspect-video sm:aspect-square flex items-center justify-center">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-65 transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('/images/hero_temple.webp')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0E] via-transparent to-transparent" />
              
              {/* Overlay quote card */}
              <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl bg-[#0D0D0E]/80 border border-white/10 backdrop-blur-md">
                <span className="font-hindi text-xs text-orange-400 block mb-2">श्रीमद्भागवत पुराण</span>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "The weight of Ganga descending from the heavens was so immense that Earth would have shattered under the impact. It was Mahadev who stepped forward, locking the turbulent flood within his hair..."
                </p>
              </div>
            </div>

            {/* Story Text details */}
            <div className="space-y-6">
              <span className="text-[10px] tracking-[0.25em] text-[#09F6FF] font-bold uppercase">Bhagiratha's Penance</span>
              <h3 className="text-2xl sm:text-3xl font-serif text-white leading-snug">
                Bending the Heavens through Pure Devotion
              </h3>
              
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                King Bhagiratha sought to purify the ashes of his sixty thousand ancestors. Their souls were trapped, awaiting the sacred waters of Ganga, then flowing only in the celestial heavens. Through centuries of fierce, uncompromising penance, his devotion moved the Gods.
              </p>
              
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                But the violent current was uncontrollable. To save the universe, Lord Shiva stood beneath the heavens, spreading his matted locks (Jatas). The roaring deluge fell onto Shiva's crown, winding through his infinite braids, emerging as a gentle, life-giving river to heal the mortal realm.
              </p>

              <div className="pt-4 flex flex-wrap gap-4">
                <div className="px-4 py-2.5 rounded-xl bg-[#1C1E22] border border-white/5 flex items-center gap-3">
                  <span className="text-base">📿</span>
                  <span className="text-xs text-slate-300 font-semibold tracking-wider">Unbending Faith</span>
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-[#1C1E22] border border-white/5 flex items-center gap-3">
                  <span className="text-base">🔱</span>
                  <span className="text-xs text-slate-300 font-semibold tracking-wider">Cosmic Shield</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🕉️ 3. SACRED SYMBOLISM GRID */}
      <section className="py-32 relative z-10 bg-[#0D0D0E] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="eyebrow text-[#09F6FF] tracking-[0.3em]">Eternal Truths</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-white mt-3">Sacred Triad</h2>
            <p className="text-xs text-slate-400 mt-4 tracking-wider uppercase">Deep spiritual metaphors etched in stone and water</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: Maa Ganga */}
            <div className="group rounded-3xl p-8 bg-[#1C1E22]/60 border border-white/5 hover:border-cyan-500/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between min-h-[360px]">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-xl text-[#09F6FF] mb-6">
                  🌊
                </div>
                <h3 className="text-2xl font-serif text-white">Maa Ganga</h3>
                <span className="font-hindi text-xs text-orange-400 block mt-1">गंगा मैया — The Flowing Spirit</span>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed font-light">
                  Symbol of active consciousness, dynamic movement, and infinite purification. She is the stream that washes away mortal karma, transforming dust into divinity.
                </p>
              </div>
              <div className="pt-6 border-t border-white/5 text-[10px] tracking-[0.2em] uppercase text-[#09F6FF]">
                Active Purification &rarr;
              </div>
            </div>

            {/* Card 2: Mahadev */}
            <div className="group rounded-3xl p-8 bg-[#1C1E22]/60 border border-white/5 hover:border-orange-500/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between min-h-[360px]">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-orange-950/50 border border-orange-500/30 flex items-center justify-center text-xl text-orange-500 mb-6">
                  🔱
                </div>
                <h3 className="text-2xl font-serif text-white">Lord Mahadev</h3>
                <span className="font-hindi text-xs text-[#09F6FF] block mt-1">सदाशिव — Absolute Stillness</span>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed font-light">
                  The anchor. The silent witness who withstands the thunderous forces of the cosmos. Without Shiva's absolute stillness, the active energy of Ganga would dissolve the universe.
                </p>
              </div>
              <div className="pt-6 border-t border-white/5 text-[10px] tracking-[0.2em] uppercase text-orange-500">
                Immovable Foundation &rarr;
              </div>
            </div>

            {/* Card 3: Sangam */}
            <div className="group rounded-3xl p-8 bg-[#1C1E22]/60 border border-white/5 hover:border-slate-400/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between min-h-[360px]">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-900/50 border border-slate-700 flex items-center justify-center text-xl text-white mb-6">
                  🕉️
                </div>
                <h3 className="text-2xl font-serif text-white">The Sangam</h3>
                <span className="font-hindi text-xs text-slate-400 block mt-1">पवित्र संगम — The Confluence</span>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed font-light">
                  The beautiful collision of paths. Where the static (Shiva) and dynamic (Ganga) dissolve into one holy resting place. The birthplace of deep meditation and clarity.
                </p>
              </div>
              <div className="pt-6 border-t border-white/5 text-[10px] tracking-[0.2em] uppercase text-white">
                Divine Integration &rarr;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🏔️ 4. FLOWING JOURNEY PARALLAX TIMELINE */}
      <section className="py-32 relative z-10 bg-[#0D0D0E]/95 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-24">
            <span className="eyebrow text-orange-500 tracking-[0.3em]">Geographical & Mythic Flow</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-white mt-3">Course of the Sacred Stream</h2>
            <p className="text-xs text-slate-400 mt-4 max-w-md mx-auto leading-relaxed">
              Trace the actual physical trajectory of Maa Ganga as she descends from the high Himalayas down to the vast plains.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Visual Showcase (sticky preview matching selected active milestone) */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#1C1E22] aspect-[4/3] shadow-2xl">
                {JOURNEY_STEPS.map((step, idx) => (
                  <div
                    key={step.title}
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${
                      activeJourney === idx ? 'opacity-70 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                    }`}
                    style={{ backgroundImage: `url('${step.image}')` }}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0E] via-[#0D0D0E]/20 to-transparent" />
                
                {/* Elevation Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] tracking-widest text-[#09F6FF] font-semibold uppercase">
                  {JOURNEY_STEPS[activeJourney].elevation}
                </div>

                {/* Bottom title display */}
                <div className="absolute bottom-6 left-6">
                  <span className="text-[10px] tracking-[0.2em] font-bold text-orange-400 uppercase font-hindi block mb-1">
                    {JOURNEY_STEPS[activeJourney].hindi}
                  </span>
                  <h4 className="text-lg font-serif text-white">
                    {JOURNEY_STEPS[activeJourney].title}
                  </h4>
                </div>
              </div>

              {/* Progress Bar Indicators */}
              <div className="flex gap-2">
                {JOURNEY_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveJourney(idx)}
                    className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
                      activeJourney === idx ? 'bg-[#09F6FF] w-6' : 'bg-white/10 hover:bg-white/30'
                    }`}
                    aria-label={`Go to step ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right Column: Text timeline steps */}
            <div className="lg:col-span-7 space-y-4">
              {JOURNEY_STEPS.map((step, idx) => {
                const isActive = activeJourney === idx;
                return (
                  <div
                    key={step.title}
                    className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'bg-[#1C1E22] border-cyan-500/20 shadow-xl' 
                        : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                    }`}
                    onClick={() => setActiveJourney(idx)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Step Number Badge */}
                      <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-semibold ${
                        isActive 
                          ? 'border-[#09F6FF] text-[#09F6FF] bg-cyan-950/20' 
                          : 'border-white/10 text-slate-400'
                      }`}>
                        0{idx + 1}
                      </span>
                      
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between flex-wrap gap-2">
                          <h3 className={`text-xl font-serif ${isActive ? 'text-white' : 'text-slate-400'}`}>
                            {step.title}
                          </h3>
                          <span className="text-[10px] tracking-wider text-slate-400 font-mono">
                            {step.elevation}
                          </span>
                        </div>
                        
                        <span className="font-hindi text-[10px] text-orange-400 block mt-1">
                          {step.hindi}
                        </span>

                        {isActive && (
                          <p className="mt-3 text-xs text-slate-300 leading-relaxed font-light fade-in-up">
                            {step.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ✨ 5. MYTHIC GALLERY VIEWPORT */}
      <section className="py-32 relative z-10 bg-[#0D0D0E] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="eyebrow text-[#09F6FF] tracking-[0.3em]">Visual Serenity</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-white mt-3">Sacred Snapshots</h2>
            <div className="w-12 h-[1px] bg-orange-500 mx-auto mt-4" />
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Gallery item 1 */}
            <div className="group relative overflow-hidden rounded-3xl aspect-[3/4] border border-white/10 bg-[#1C1E22]">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105 group-hover:rotate-1 opacity-70"
                style={{ backgroundImage: `url('/images/mountain.webp')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[8px] tracking-[0.25em] font-semibold text-[#09F6FF] uppercase block mb-1">Peaks of Heaven</span>
                <h4 className="text-lg font-serif text-white">Mount Kailash</h4>
              </div>
            </div>

            {/* Gallery item 2 */}
            <div className="group relative overflow-hidden rounded-3xl aspect-[3/4] border border-white/10 bg-[#1C1E22]">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105 group-hover:rotate-1 opacity-70"
                style={{ backgroundImage: `url('/images/gallery_devprayag.webp')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[8px] tracking-[0.25em] font-semibold text-orange-400 uppercase block mb-1">Sacerdotal Confluence</span>
                <h4 className="text-lg font-serif text-white">The Devprayag Sangam</h4>
              </div>
            </div>

            {/* Gallery item 3 */}
            <div className="group relative overflow-hidden rounded-3xl aspect-[3/4] border border-white/10 bg-[#1C1E22] sm:col-span-2 md:col-span-1">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105 group-hover:rotate-1 opacity-70"
                style={{ backgroundImage: `url('/images/gallery_diyas.webp')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[8px] tracking-[0.25em] font-semibold text-white uppercase block mb-1">Eternal Offering</span>
                <h4 className="text-lg font-serif text-white">Ganga Sandhya Aarti</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ⛩️ 6. FINAL ENTRANCE CTA GATEWAY */}
      <section className="py-40 relative z-10 border-t border-white/5 bg-gradient-to-b from-[#0D0D0E] to-[#120B04] text-center px-6">
        <div className="max-w-4xl mx-auto">
          {/* Sacred Symbol */}
          <div className="text-5xl sm:text-7xl text-orange-500/85 mb-8 animate-pulse drop-shadow-[0_0_25px_rgba(249,115,22,0.3)]">
            ॐ
          </div>

          <h2 className="text-3xl sm:text-6xl font-serif text-white tracking-wide leading-tight">
            Your Journey of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-[#09F6FF]">
              Devotion Begins
            </span>
          </h2>
          
          <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed font-light">
            Cross the sacred threshold and secure your peaceful rest or donate to feed sadhus at our Dharamshala in the holy valleys of Devprayag.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <Link 
              to="/home" 
              className="w-full py-4 rounded-xl bg-[#F97316] hover:bg-[#E8520A] text-white text-xs font-bold tracking-[0.15em] uppercase transition-colors shadow-lg shadow-orange-500/20"
            >
              Enter Dharamshala / गृह प्रवेश
            </Link>
            
            <Link 
              to="/donate" 
              className="w-full py-4 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 text-[#09F6FF] text-xs font-bold tracking-[0.15em] uppercase border border-cyan-500/20 transition-colors"
            >
              Offer Seva / दान अर्पण
            </Link>
          </div>

          {/* Subtext info links */}
          <div className="mt-16 flex items-center justify-center gap-6 flex-wrap text-xs text-slate-400">
            <Link to="/rooms" className="hover:text-white transition-colors">Accommodation Rooms</Link>
            <span>•</span>
            <Link to="/about" className="hover:text-white transition-colors">Our Spiritual Mission</Link>
            <span>•</span>
            <Link to="/gallery" className="hover:text-white transition-colors">Explore Gallery</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
