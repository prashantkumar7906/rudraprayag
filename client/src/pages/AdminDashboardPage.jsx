import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { formatINR, formatDate } from '../utils/helpers';

// ── WebGL Ripple Displacement Zoom Background ──
function RippleZoomBackground() {
  const canvasRef = useRef(null);
  const ripplesRef = useRef([]); // holds { x, y, startTime }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }

    // Shader sources
    const vsSource = `
      attribute vec2 position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = position * 0.5 + 0.5;
        v_texCoord.y = 1.0 - v_texCoord.y;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec3 u_ripples[5];
      uniform float u_rippleCount;

      void main() {
        vec2 uv = v_texCoord;
        vec2 displacement = vec2(0.0);
        
        for (int i = 0; i < 5; i++) {
          if (float(i) >= u_rippleCount) break;
          
          vec3 r = u_ripples[i];
          vec2 center = r.xy;
          float age = u_time - r.z;
          
          if (age > 2.0) continue;
          
          vec2 toCenter = uv - center;
          // Aspect ratio correction
          toCenter.x *= u_resolution.x / u_resolution.y;
          
          float dist = length(toCenter);
          float speed = 0.7;
          float currentRadius = age * speed;
          float waveWidth = 0.18;
          float waveDist = abs(dist - currentRadius);
          
          if (waveDist < waveWidth && dist < currentRadius + 0.02) {
            float wave = sin((waveDist / waveWidth) * 3.14159);
            float strength = 0.09 * (1.0 - (age / 2.0)) * (1.0 - dist);
            displacement += normalize(uv - center) * wave * strength;
          }
        }
        
        vec2 displacedUv = uv - displacement;
        
        // Beautiful elegant gradient matching the reference image's soft silver-grey to warm peach glow
        vec3 col1 = vec3(0.894, 0.906, 0.922); // Light neutral silver-grey (#ECEEF1)
        vec3 col2 = vec3(1.0, 0.957, 0.831);   // Glowing pale warm yellow-peach (#FFF4D4)
        vec3 col3 = vec3(0.984, 0.749, 0.141);  // Accent gold saffron (#FBBF24)
        
        vec3 bg = mix(col1, col2, displacedUv.y);
        float glow = 1.0 - length(displacedUv - vec2(0.5, 0.3));
        bg = mix(bg, col3, clamp(glow * 0.18, 0.0, 1.0));
        
        gl_FragColor = vec4(bg, 1.0);
      }
    `;

    // Compile shader helper
    const compileShader = (source, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader program linking failed:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Set up geometry (fullscreen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const ripplesLoc = gl.getUniformLocation(program, 'u_ripples');
    const countLoc = gl.getUniformLocation(program, 'u_rippleCount');

    // Resize handler
    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Mouse click handler
    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / canvas.width;
      const y = 1.0 - (e.clientY - rect.top) / canvas.height;
      
      const now = performance.now() / 1000.0;
      
      ripplesRef.current.push({ x, y, startTime: now });
      if (ripplesRef.current.length > 5) {
        ripplesRef.current.shift();
      }
    };
    window.addEventListener('mousedown', handleClick);

    // Animation Loop
    let animFrameId;
    const startTime = performance.now() / 1000.0;

    const render = () => {
      const now = performance.now() / 1000.0;
      const elapsed = now - startTime;

      ripplesRef.current = ripplesRef.current.filter(r => elapsed - r.startTime < 2.0);

      const rippleData = new Float32Array(15);
      ripplesRef.current.forEach((r, idx) => {
        rippleData[idx * 3 + 0] = r.x;
        rippleData[idx * 3 + 1] = r.y;
        rippleData[idx * 3 + 2] = r.startTime;
      });

      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, elapsed);
      gl.uniform3fv(ripplesLoc, rippleData);
      gl.uniform1f(countLoc, ripplesRef.current.length);

      gl.clearColor(1.0, 0.985, 0.94, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousedown', handleClick);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block'
      }}
    />
  );
}

// ── SVG Icons ──
const Icons = {
  Dashboard: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Bookings: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Donations: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Tokens: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  Rooms: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Revenue: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  UsedToken: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Filter: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
};

// ── Top Header Navigation Bar (Matches mockup layout precisely and is fully usable) ──
function TopHeader({ activeTab, setActiveTab, onLogout }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'donations', label: 'Donations' },
    { id: 'tokens', label: 'Tokens' },
    { id: 'rooms', label: 'Rooms' },
  ];

  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [brandName, setBrandName] = useState('Hariom Trust');
  
  // Real active notifications list
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New Cash Room Booking संजय कुमार confirmed by admin", time: "5 mins ago", read: false },
    { id: 2, text: "Stay Token TOK-20260523-JDXM marked as USED", time: "15 mins ago", read: false },
    { id: 3, text: "System initialized with offline JSON database layer", time: "1 hour ago", read: true }
  ]);

  // Compute unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <header
      className="w-full flex flex-wrap items-center justify-between gap-4 px-8 py-5 border-b mb-8 z-20 relative"
      style={{
        background: 'transparent',
        border: 'none',
      }}
    >
      {/* Left: Brand Logo Capsule */}
      <div
        className="px-6 py-2.5 rounded-full flex items-center gap-2 border bg-white shadow-sm"
        style={{ borderColor: '#D1D5DB' }}
      >
        <span className="font-bold text-sm tracking-tight text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
          ॐ {brandName}
        </span>
      </div>

      {/* Center: Tabs in Horizontal Pill Container */}
      <nav
        className="flex items-center p-1 rounded-full border bg-white shadow-sm"
        style={{ borderColor: '#D1D5DB' }}
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-6 py-2 rounded-full font-bold text-xs tracking-wider transition-all duration-300"
              style={{
                background: isActive ? '#1F2937' : 'transparent', // dark active pill as in mockup
                color: isActive ? 'white' : '#6B7280',
                border: 'none',
                cursor: 'pointer',
                minHeight: 34,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Right: Settings, Notification, Profile Avatar, and Logout */}
      <div className="flex items-center gap-3 relative">
        {/* Settings Pill */}
        <button
          onClick={() => {
            setShowSettings(!showSettings);
            setShowNotifications(false);
          }}
          className="px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 border bg-white hover:bg-gray-50 transition-all shadow-sm"
          style={{ borderColor: '#D1D5DB', cursor: 'pointer', minHeight: 36 }}
        >
          <svg className="w-3.5 h-3.5 text-gray-600 animate-spin-hover" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.004.831a1.125 1.125 0 01.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.83c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.831a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128c.332-.183.582-.495.645-.869L9.59 3.94z" />
          </svg>
          <span>Setting</span>
        </button>

        {/* Notification Bell */}
        <div
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowSettings(false);
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center border bg-white hover:bg-gray-50 transition-all shadow-sm cursor-pointer relative"
          style={{ borderColor: '#D1D5DB' }}
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          )}
        </div>

        {/* Profile Avatar / Logout */}
        <div
          onClick={onLogout}
          className="w-9 h-9 rounded-full flex items-center justify-center border bg-white hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
          style={{ borderColor: '#D1D5DB' }}
          title="Click to Logout"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        {/* ── Settings Dropdown Panel ── */}
        {showSettings && (
          <div
            className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-3xl p-5 shadow-xl z-50 flex flex-col gap-4 backdrop-blur-md"
            style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
          >
            <h3 className="font-bold text-sm text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
              Panel Configurations
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-2xs font-extrabold uppercase text-gray-400 mb-1">Dharamshala Branding Name</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-full text-xs font-bold focus:outline-none focus:border-amber-500"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-2xs font-extrabold uppercase text-gray-400 mb-1">Administrator Password</label>
                <input
                  type="password"
                  disabled
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-full text-xs font-semibold bg-gray-50 text-gray-400 cursor-not-allowed"
                  value="Password@rudrprayad"
                />
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2.5 rounded-full text-xs font-extrabold text-white bg-gray-800 hover:bg-gray-900 transition-all border-none cursor-pointer text-center"
            >
              Save & Close
            </button>
          </div>
        )}

        {/* ── Notification Dropdown Panel ── */}
        {showNotifications && (
          <div
            className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-3xl p-4 shadow-xl z-50 flex flex-col gap-3 backdrop-blur-md"
            style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
          >
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="font-extrabold text-xs text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                Live Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-2xs font-bold text-amber-600 hover:text-amber-700 bg-transparent border-none cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-3 rounded-2xl flex items-start gap-2.5 transition-all cursor-pointer ${n.read ? 'bg-transparent hover:bg-gray-50/50' : 'bg-amber-50/30 hover:bg-amber-50/50'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-gray-300' : 'bg-amber-500 animate-pulse'}`} />
                  <div className="flex-1">
                    <p className={`text-2xs leading-relaxed font-semibold ${n.read ? 'text-gray-500' : 'text-gray-800'}`}>
                      {n.text}
                    </p>
                    <span className="text-3xs text-gray-400 block mt-1 font-bold">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowNotifications(false)}
              className="w-full py-2 rounded-full text-2xs font-extrabold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all border-none cursor-pointer text-center"
            >
              Close Panel
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ── Status Badge (Matches mockup Invited/Absent capsule pills precisely) ──
function StatusBadge({ status }) {
  const config = {
    CONFIRMED: { bg: '#D1FAE5', color: '#065F46', label: 'Served' },
    PENDING: { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
    CANCELLED: { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' },
    EXPIRED: { bg: '#E5E7EB', color: '#374151', label: 'Expired' },
    FAILED: { bg: '#FEE2E2', color: '#991B1B', label: 'Failed' },
    ACTIVE: { bg: '#D1FAE5', color: '#065F46', label: 'Active' },
    USED: { bg: '#E5E7EB', color: '#374151', label: 'Used' },
  };
  const c = config[status] || { bg: '#E5E7EB', color: '#374151', label: status };
  return (
    <span
      className="status-badge-dot"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}

// ── Block Dates Modal ──
function BlockDatesModal({ room, onClose }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!from || !to || !reason) return setError('All fields are required.');
    setLoading(true);
    try {
      await api.patch(`/rooms/${room._id}/block`, { from, to, reason });
      onClose(true);
    } catch (err) {
      setError(err.message || 'Failed to block dates.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h3 style={{ color: '#CC3300', fontFamily: 'Noto Serif', fontWeight: 700, marginBottom: '1rem' }}>
          Block Dates — {room.name}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>From Date</label>
            <input type="date" className="form-input" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>To Date</label>
            <input type="date" className="form-input" value={to} onChange={e => setTo(e.target.value)} min={from} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>Reason</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Maintenance, Festival reservation"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="error-text mt-2">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 py-3 rounded-xl border-2 font-medium"
            style={{ borderColor: '#e0d0c0', color: '#9a7050' }}
            onClick={() => onClose(false)}
          >
            Cancel
          </button>
          <button className="btn-bhagwa flex-1" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner spinner-dark" /> Saving...</> : 'Block Dates'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cancel Booking Modal ──
function CancelModal({ booking, onClose }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = async () => {
    if (!reason.trim()) return setError('Cancellation reason is required.');
    setLoading(true);
    try {
      await api.patch(`/admin/bookings/${booking._id}/cancel`, { reason });
      onClose(true);
    } catch (err) {
      setError(err.message || 'Cancellation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h3 style={{ color: '#CC3300', fontFamily: 'Noto Serif', fontWeight: 700, marginBottom: '0.5rem' }}>
          Cancel Booking
        </h3>
        <p style={{ color: '#6b4c30', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Booking ID: <strong>{booking.bookingId}</strong> — {booking.guestName}
        </p>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>
            Cancellation Reason *
          </label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Reason for cancellation..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>
        {error && <p className="error-text mt-2">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 py-3 rounded-xl border-2 font-medium"
            style={{ borderColor: '#e0d0c0', color: '#9a7050', cursor: 'pointer' }}
            onClick={() => onClose(false)}
          >
            Keep Booking
          </button>
          <button
            className="flex-1 py-3 rounded-xl font-medium text-white transition-all"
            style={{ background: '#CC3300', border: 'none', cursor: 'pointer', minHeight: 44 }}
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Confirm Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [donations, setDonations] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Checkbox Selection states (matches mockup interactive checkboxes)
  const [selectedBookings, setSelectedBookings] = useState({});
  const [selectedDonations, setSelectedDonations] = useState({});
  const [selectedTokens, setSelectedTokens] = useState({});

  // Helper to extract initials for mock avatar badges
  const getInitials = (name) => {
    if (!name) return 'H';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Filters for bookings
  const [bStatus, setBStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filters for tokens
  const [tStatus, setTStatus] = useState('ALL');
  const [tType, setTType] = useState('ALL');
  const [tSearch, setTSearch] = useState('');

  // Expanded booking row
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [blockModal, setBlockModal] = useState(null);

  useEffect(() => {
    document.title = 'Admin Dashboard — Hariom Trust Organisation';
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/admin/login');
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchStats();
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'donations') fetchDonations();
    if (activeTab === 'tokens') fetchTokens();
    if (activeTab === 'rooms') fetchRooms();
  }, [activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data);
    } catch { } finally { setLoading(false); }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (bStatus !== 'ALL') params.status = bStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/admin/bookings', { params });
      setBookings(res.data.data || res.data);
    } catch { } finally { setLoading(false); }
  };

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/donations');
      setDonations(res.data.data || res.data);
    } catch { } finally { setLoading(false); }
  };

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tStatus !== 'ALL') params.status = tStatus;
      if (tType !== 'ALL') params.type = tType;
      if (tSearch) params.search = tSearch;
      const res = await api.get('/admin/tokens', { params });
      setTokens(res.data.data || res.data);
    } catch { } finally { setLoading(false); }
  };

  const handleUpdateTokenStatus = async (tokenId, newStatus) => {
    try {
      await api.patch(`/admin/tokens/${tokenId}/status`, { status: newStatus });
      fetchTokens();
    } catch (err) {
      alert(err.message || 'Failed to update token status.');
    }
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rooms');
      setRooms(res.data.data || res.data);
    } catch { } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="mockup-shell">
      <RippleZoomBackground />
      
      <div className="mockup-container flex flex-col pb-12 min-h-[90vh]">
        {/* Horizontal Top Header */}
        <TopHeader activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

        {/* Main content */}
        <main className="flex-1 px-8 overflow-auto z-10">

          {/* ── DASHBOARD TAB ── */}
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-gray-900" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '2.5rem', marginBottom: '0.2rem', letterSpacing: '-0.03em' }}>
                Dashboard
              </h1>
              <p className="text-gray-500 text-xs font-semibold mb-6">Overview of Hariom Trust Organisation</p>

              {loading ? (
                <div className="bento-grid">
                  {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton rounded-[30px] h-48 animate-pulse" />)}
                </div>
              ) : stats ? (
                /* Bento Box Interactive Grid Layout */
                <div className="bento-grid mb-8">
                  
                  {/* Card 1: Majestic Himalaya Showcase (Spans all columns) */}
                  <div
                    className="bento-card bento-card-glass md:col-span-2 lg:col-span-3 relative group overflow-hidden cursor-pointer !p-0 shadow-sm"
                    style={{ minHeight: 240 }}
                  >
                    <img
                      src="/images/mountain.png"
                      alt="Majestic Himalayas"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to right, rgba(31, 41, 55, 0.9) 0%, rgba(31, 41, 55, 0.4) 60%, transparent 100%)',
                        padding: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <div className="font-bold text-amber-400 text-2xl mb-2" style={{ fontFamily: 'Playfair Display' }}>
                        Himalayas — The Sacred Abode
                      </div>
                      <p className="text-gray-200 text-xs font-medium max-w-md leading-relaxed transition-all duration-300 group-hover:translate-y-[-2px]">
                        "He who contemplates the Ganges Sangam and the heights of Himavat achieves peace beyond understanding." Sustaining our pilgrims, sadhus, and holy spaces.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Total Bookings (Dark Slate, 1 col) */}
                  <div className="bento-card bento-card-dark cursor-pointer shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-gray-400 text-2xs uppercase tracking-widest font-extrabold" style={{ fontSize: '0.65rem' }}>Total Bookings</span>
                        <div className="text-4xl font-extrabold tracking-tight mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {stats.totalBookings || 0}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-700 text-gray-300">
                        <Icons.Bookings />
                      </div>
                    </div>
                    <div className="text-2xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ fontSize: '0.6rem' }}>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      Live Room Bookings Active
                    </div>
                  </div>

                  {/* Card 3: Revenue (Saffron Gold, 1 col) */}
                  <div className="bento-card bento-card-saffron cursor-pointer shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-gray-700 text-2xs uppercase tracking-widest font-extrabold" style={{ fontSize: '0.65rem' }}>Confirmed Revenue</span>
                        <div className="text-3xl font-black mt-2 text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {formatINR(stats.totalRevenue || 0)}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/40 text-gray-800 shadow-inner">
                        <Icons.Revenue />
                      </div>
                    </div>
                    <div className="text-2xs text-gray-800 font-bold uppercase tracking-wider flex items-center gap-1" style={{ fontSize: '0.6rem' }}>
                      +12.4% vs last month
                    </div>
                  </div>

                  {/* Card 4: Donations Insights (White Glass, Spans 2 cols) */}
                  <div className="bento-card bento-card-glass md:col-span-2 cursor-pointer shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-gray-400 text-2xs uppercase tracking-widest font-extrabold" style={{ fontSize: '0.65rem' }}>Donations Campaign</span>
                        <div className="flex gap-10 mt-2">
                          <div>
                            <span className="text-2xs text-gray-400 block font-bold uppercase" style={{ fontSize: '0.55rem' }}>Total Offerings</span>
                            <span className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatINR(stats.donationTotal || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-2xs text-gray-400 block font-bold uppercase" style={{ fontSize: '0.55rem' }}>Pledgers Count</span>
                            <span className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {stats.donationCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 text-red-500 animate-fast-pulse shadow-sm">
                        <Icons.Donations />
                      </div>
                    </div>
                    <div className="w-full">
                      <div className="flex justify-between text-2xs text-gray-400 font-bold uppercase mb-1" style={{ fontSize: '0.6rem' }}>
                        <span>Target Progress</span>
                        <span>85%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200/80 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Stay Tokens (White Glass, 1 col) */}
                  <div className="bento-card bento-card-glass cursor-pointer shadow-sm animate-float">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-gray-400 text-2xs uppercase tracking-widest font-extrabold" style={{ fontSize: '0.65rem' }}>Active Stay Tokens</span>
                        <div className="text-3xl font-bold text-gray-800 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {stats.activeTokens || 0}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600">
                        <Icons.Tokens />
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('tokens')}
                      className="px-4 py-2 rounded-full text-2xs font-extrabold text-white bg-gray-800 hover:bg-gray-900 transition-all border-none cursor-pointer text-center w-full shadow-sm"
                      style={{ fontSize: '0.65rem' }}
                    >
                      Verify Active Tokens
                    </button>
                  </div>

                  {/* Card 6: Room Allocation Status (Striped, 1 col) */}
                  <div className="bento-card bento-card-striped cursor-pointer shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-gray-500 text-2xs uppercase tracking-widest font-extrabold" style={{ fontSize: '0.65rem' }}>Dharamshala Capacity</span>
                        <div className="text-3xl font-extrabold text-gray-800 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                          3 Rooms
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 text-gray-600 border border-gray-200">
                        <Icons.Rooms />
                      </div>
                    </div>
                    <div className="text-2xs text-gray-500 font-bold uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>
                      Standard | Deluxe | Suite
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#9a7050' }}>Unable to load stats.</p>
              )}
            </div>
          )}

        {/* ── BOOKINGS TAB ── */}
        {activeTab === 'bookings' && (
          <div>
            <h1 className="text-gray-900" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '2.5rem', marginBottom: '0.2rem', letterSpacing: '-0.03em' }}>
              Bookings
            </h1>
            <p className="text-gray-500 text-xs font-semibold mb-6">Manage pilgrims stays and check-in rosters</p>

            {/* Capsule Filters Action Row (Matches mockup precisely) */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              {/* Left Dropdown Capsules */}
              <div className="flex flex-wrap gap-2">
                <div className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-2xs font-extrabold text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center gap-1.5 shadow-sm">
                  Columns <span className="text-gray-400">▼</span>
                </div>
                
                {/* Status Dropdown */}
                <div className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-2xs font-extrabold text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center gap-1.5 shadow-sm relative">
                  <span>Status: {bStatus}</span>
                  <select
                    className="absolute inset-0 opacity-0 cursor-pointer text-xs font-bold"
                    value={bStatus}
                    onChange={e => setBStatus(e.target.value)}
                  >
                    {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="text-gray-400">▼</span>
                </div>

                {/* From Date Capsule */}
                <div className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-2xs font-extrabold text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center gap-1.5 shadow-sm relative">
                  <span>From: {startDate ? formatDate(startDate) : 'Select'}</span>
                  <input
                    type="date"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                  <span className="text-gray-400">▼</span>
                </div>

                {/* To Date Capsule */}
                <div className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-2xs font-extrabold text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center gap-1.5 shadow-sm relative">
                  <span>To: {endDate ? formatDate(endDate) : 'Select'}</span>
                  <input
                    type="date"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    min={startDate}
                  />
                  <span className="text-gray-400">▼</span>
                </div>
              </div>

              {/* Center Search Input */}
              <div className="flex-1 max-w-xs px-5 py-2.5 rounded-full border border-gray-300 bg-white flex items-center gap-2 text-2xs font-semibold text-gray-700 shadow-sm">
                <Icons.Search />
                <input
                  type="text"
                  placeholder="Search guest or ID..."
                  className="border-none bg-transparent focus:outline-none p-0 text-2xs font-bold text-gray-700 w-full"
                  value={tSearch} // reuse existing search state
                  onChange={e => setTSearch(e.target.value)}
                />
              </div>

              {/* Right Side Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchBookings}
                  className="w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 shadow-sm cursor-pointer"
                  title="Apply Filter"
                >
                  <Icons.Filter />
                </button>
                <button
                  className="w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 shadow-sm cursor-pointer font-extrabold text-sm text-gray-700"
                  title="Add New Row"
                >
                  +
                </button>
                <button
                  className="px-5 py-2.5 rounded-full border border-gray-300 bg-white hover:bg-gray-50 shadow-sm cursor-pointer text-2xs font-extrabold text-gray-700 flex items-center gap-2"
                  title="Export"
                >
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Pristine Highly-Rounded White Card Container (Matches Mockup) */}
            <div
              className="overflow-hidden shadow-sm bg-white"
              style={{
                borderRadius: '36px', // Large border-radius as mockup
                border: '1px solid #E5E7EB',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="dotted-divider bg-gray-50/50">
                      <th className="px-5 py-4 text-left w-12">
                        <input
                          type="checkbox"
                          className="checkbox-custom"
                          checked={bookings.length > 0 && bookings.every(b => selectedBookings[b._id])}
                          onChange={() => {
                            const allChecked = bookings.length > 0 && bookings.every(b => selectedBookings[b._id]);
                            const nextMap = {};
                            if (!allChecked) {
                              bookings.forEach(b => { nextMap[b._id] = true; });
                            }
                            setSelectedBookings(nextMap);
                          }}
                        />
                      </th>
                      {['Booking ID', 'Guest Name', 'Room Type', 'Check-In', 'Check-Out', 'Nights', 'Total Amount', 'Status', ''].map(h => (
                        <th key={h} className="px-5 py-4 text-left font-bold text-gray-400 tracking-wider text-xs uppercase" style={{ whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={10} className="text-center py-10 text-gray-500 font-medium">Loading records...</td></tr>
                    ) : bookings.length === 0 ? (
                      <tr><td colSpan={10} className="text-center py-10 text-gray-500 font-medium">No bookings found.</td></tr>
                    ) : bookings.filter(b => b.guestName.toLowerCase().includes(tSearch.toLowerCase()) || b.bookingId.toLowerCase().includes(tSearch.toLowerCase())).map(b => {
                      const isExpanded = expandedBooking === b._id;
                      const isRowChecked = !!selectedBookings[b._id];
                      return (
                        <>
                          <tr
                            key={b._id}
                            className={`transition-all duration-200 ${isRowChecked ? 'table-row-selected' : ''}`}
                            style={{
                              borderBottom: isRowChecked ? 'none' : '1px solid #FAF7F0',
                              cursor: 'pointer',
                            }}
                            onClick={() => setExpandedBooking(isExpanded ? null : b._id)}
                          >
                            <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="checkbox-custom"
                                checked={isRowChecked}
                                onChange={() => {
                                  setSelectedBookings(prev => ({
                                    ...prev,
                                    [b._id]: !prev[b._id]
                                  }));
                                }}
                              />
                            </td>
                            <td className="px-5 py-4 font-mono text-xs font-bold" style={{ color: isRowChecked ? '#1F2937' : '#CC3300' }}>{b.bookingId}</td>
                            <td className="px-5 py-4 font-bold flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs bg-amber-100 text-amber-800 border border-amber-200">
                                {getInitials(b.guestName)}
                              </div>
                              <span>{b.guestName}</span>
                            </td>
                            <td className={`px-5 py-4 font-medium ${isRowChecked ? 'text-gray-800' : 'text-gray-600'}`}>{b.roomTypeName}</td>
                            <td className={`px-5 py-4 font-medium whitespace-nowrap ${isRowChecked ? 'text-gray-800' : 'text-gray-500'}`}>{formatDate(b.checkIn)}</td>
                            <td className={`px-5 py-4 font-medium whitespace-nowrap ${isRowChecked ? 'text-gray-800' : 'text-gray-500'}`}>{formatDate(b.checkOut)}</td>
                            <td className={`px-5 py-4 text-center font-bold ${isRowChecked ? 'text-gray-800' : 'text-gray-700'}`}>{b.nights}</td>
                            <td className="px-5 py-4 font-bold whitespace-nowrap">
                              {formatINR(b.priceBreakdown?.totalAmount)}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={b.status} />
                            </td>
                            <td className="px-5 py-4 text-right text-gray-400 font-semibold">
                              {isExpanded ? '▲' : '▼'}
                            </td>
                          </tr>

                          {/* Expanded row details card */}
                          {isExpanded && (
                            <tr key={b._id + '-exp'} style={{ background: 'rgba(254, 243, 199, 0.4)' }}>
                              <td colSpan={10} className="px-8 py-5 border-b border-amber-200">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                                  <div>
                                    <span className="text-gray-400 text-xs font-semibold uppercase block mb-1">Email Address</span>
                                    <div className="font-bold text-gray-800">{b.guestEmail}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 text-xs font-semibold uppercase block mb-1">Phone Number</span>
                                    <div className="font-bold text-gray-800">{b.citizenship === 'Indian' ? '+91 ' : ''}{b.guestPhone}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 text-xs font-semibold uppercase block mb-1">Citizenship</span>
                                    <div className="font-bold text-gray-800">{b.citizenship || 'Indian'}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 text-xs font-semibold uppercase block mb-1">ID Card ({b.idType})</span>
                                    <div className="font-bold text-gray-800">{b.idNumber}</div>
                                  </div>
                                </div>
                                {b.status === 'CONFIRMED' && (
                                  <button
                                    className="mt-5 px-6 py-2.5 rounded-full text-xs font-bold text-white transition-all duration-200 cursor-pointer border-none shadow-sm hover:shadow"
                                    style={{ background: '#CC3300' }}
                                    onClick={(e) => { e.stopPropagation(); setCancelModal(b); }}
                                  >
                                    Cancel Booking
                                  </button>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── DONATIONS TAB ── */}
        {activeTab === 'donations' && (
          <div>
            <h1 className="text-gray-900" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '2.5rem', marginBottom: '0.2rem', letterSpacing: '-0.03em' }}>
              Donations
            </h1>
            <p className="text-gray-500 text-xs font-semibold mb-6">Manage pilgrims offerings and charitable contributions</p>

            {/* Mockup filter rows */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              {/* Left Dropdown Capsules */}
              <div className="flex flex-wrap gap-2">
                <div className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-2xs font-extrabold text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center gap-1.5 shadow-sm">
                  Columns <span className="text-gray-400">▼</span>
                </div>
                <div className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-2xs font-extrabold text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center gap-1.5 shadow-sm">
                  Campaign: General <span className="text-gray-400">▼</span>
                </div>
              </div>

              {/* Center Search Input */}
              <div className="flex-1 max-w-xs px-5 py-2.5 rounded-full border border-gray-300 bg-white flex items-center gap-2 text-2xs font-semibold text-gray-700 shadow-sm">
                <Icons.Search />
                <input
                  type="text"
                  placeholder="Search donor..."
                  className="border-none bg-transparent focus:outline-none p-0 text-2xs font-bold text-gray-700 w-full"
                  value={tSearch} // reuse existing search state
                  onChange={e => setTSearch(e.target.value)}
                />
              </div>

              {/* Right Side Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDonations}
                  className="w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 shadow-sm cursor-pointer"
                  title="Apply Filter"
                >
                  <Icons.Filter />
                </button>
                <button
                  className="w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 shadow-sm cursor-pointer font-extrabold text-sm text-gray-700"
                  title="Add New Row"
                >
                  +
                </button>
                <button
                  className="px-5 py-2.5 rounded-full border border-gray-300 bg-white hover:bg-gray-50 shadow-sm cursor-pointer text-2xs font-extrabold text-gray-700 flex items-center gap-2"
                  title="Export"
                >
                  <span>Export</span>
                </button>
              </div>
            </div>
            
            {/* Pristine Highly-Rounded White Card Container */}
            <div
              className="overflow-hidden shadow-sm bg-white"
              style={{
                borderRadius: '36px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="dotted-divider bg-gray-50/50">
                      <th className="px-5 py-4 text-left w-12">
                        <input
                          type="checkbox"
                          className="checkbox-custom"
                          checked={donations.length > 0 && donations.every(d => selectedDonations[d._id])}
                          onChange={() => {
                            const allChecked = donations.length > 0 && donations.every(d => selectedDonations[d._id]);
                            const nextMap = {};
                            if (!allChecked) {
                              donations.forEach(d => { nextMap[d._id] = true; });
                            }
                            setSelectedDonations(nextMap);
                          }}
                        />
                      </th>
                      {['Donation ID', 'Donor Name', 'Email Address', 'Amount Paid', 'Dedication Message', 'Date', 'Status'].map(h => (
                        <th key={h} className="px-5 py-4 text-left font-bold text-gray-400 tracking-wider text-xs uppercase" style={{ whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="text-center py-10 text-gray-500 font-medium">Loading records...</td></tr>
                    ) : donations.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-10 text-gray-500 font-medium">No donations found.</td></tr>
                    ) : donations.filter(d => d.donorName.toLowerCase().includes(tSearch.toLowerCase()) || d.donationId.toLowerCase().includes(tSearch.toLowerCase())).map(d => {
                      const isRowChecked = !!selectedDonations[d._id];
                      return (
                        <tr
                          key={d._id}
                          className={`transition-all duration-200 ${isRowChecked ? 'table-row-selected' : ''}`}
                          style={{
                            borderBottom: isRowChecked ? 'none' : '1px solid #FAF7F0',
                          }}
                        >
                          <td className="px-5 py-4">
                            <input
                              type="checkbox"
                              className="checkbox-custom"
                              checked={isRowChecked}
                              onChange={() => {
                                setSelectedDonations(prev => ({
                                  ...prev,
                                  [d._id]: !prev[d._id]
                                }));
                              }}
                            />
                          </td>
                          <td className="px-5 py-4 font-mono text-xs font-bold" style={{ color: isRowChecked ? '#1F2937' : '#0055AA' }}>{d.donationId}</td>
                          <td className="px-5 py-4 font-bold flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs bg-red-100 text-red-800 border border-red-200">
                              {getInitials(d.donorName)}
                            </div>
                            <span>{d.donorName}</span>
                          </td>
                          <td className={`px-5 py-4 font-medium ${isRowChecked ? 'text-gray-800' : 'text-gray-600'}`}>{d.donorEmail}</td>
                          <td className="px-5 py-4 font-bold text-amber-600">{formatINR(d.amount)}</td>
                          <td className={`px-5 py-4 font-medium max-w-xs truncate ${isRowChecked ? 'text-gray-700' : 'text-gray-400'}`} title={d.message}>{d.message || '—'}</td>
                          <td className={`px-5 py-4 font-medium whitespace-nowrap ${isRowChecked ? 'text-gray-800' : 'text-gray-500'}`}>
                            {new Date(d.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-4"><StatusBadge status={d.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TOKENS TAB ── */}
        {activeTab === 'tokens' && (
          <div>
            <h1 className="text-gray-900" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '2.5rem', marginBottom: '0.2rem', letterSpacing: '-0.03em' }}>
              Receipt Tokens
            </h1>
            <p className="text-gray-500 text-xs font-semibold mb-6">Verify and check-in active stay & donation receipt tokens</p>

            {/* Filters Bar exactly like Mockup */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              {/* Left Dropdown Capsules */}
              <div className="flex flex-wrap gap-2">
                <div className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-2xs font-extrabold text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center gap-1.5 shadow-sm">
                  Columns <span className="text-gray-400">▼</span>
                </div>

                {/* Type Dropdown */}
                <div className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-2xs font-extrabold text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center gap-1.5 shadow-sm relative">
                  <span>Type: {tType === 'ALL' ? 'All' : tType === 'BOOKING' ? 'Stay' : 'Donation'}</span>
                  <select
                    className="absolute inset-0 opacity-0 cursor-pointer text-xs font-bold"
                    value={tType}
                    onChange={e => setTType(e.target.value)}
                  >
                    <option value="ALL">All Types</option>
                    <option value="BOOKING">Bookings</option>
                    <option value="DONATION">Donations</option>
                  </select>
                  <span className="text-gray-400">▼</span>
                </div>

                {/* Status Dropdown */}
                <div className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-2xs font-extrabold text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center gap-1.5 shadow-sm relative">
                  <span>Status: {tStatus}</span>
                  <select
                    className="absolute inset-0 opacity-0 cursor-pointer text-xs font-bold"
                    value={tStatus}
                    onChange={e => setTStatus(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="USED">Used</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                  <span className="text-gray-400">▼</span>
                </div>
              </div>

              {/* Center Search Input */}
              <div className="flex-1 max-w-xs px-5 py-2.5 rounded-full border border-gray-300 bg-white flex items-center gap-2 text-2xs font-semibold text-gray-700 shadow-sm">
                <Icons.Search />
                <input
                  type="text"
                  placeholder="Search token or name..."
                  className="border-none bg-transparent focus:outline-none p-0 text-2xs font-bold text-gray-700 w-full"
                  value={tSearch}
                  onChange={e => setTSearch(e.target.value)}
                />
              </div>

              {/* Right Side Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchTokens}
                  className="w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 shadow-sm cursor-pointer"
                  title="Search Token"
                >
                  <Icons.Search />
                </button>
                <button
                  className="w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 shadow-sm cursor-pointer font-extrabold text-sm text-gray-700"
                  title="Add New Row"
                >
                  +
                </button>
                <button
                  className="px-5 py-2.5 rounded-full border border-gray-300 bg-white hover:bg-gray-50 shadow-sm cursor-pointer text-2xs font-extrabold text-gray-700 flex items-center gap-2"
                  title="Export"
                >
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Pristine Highly-Rounded White Card Container */}
            <div
              className="overflow-hidden shadow-sm bg-white"
              style={{
                borderRadius: '36px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="dotted-divider bg-gray-50/50">
                      <th className="px-5 py-4 text-left w-12">
                        <input
                          type="checkbox"
                          className="checkbox-custom"
                          checked={tokens.length > 0 && tokens.every(t => selectedTokens[t._id])}
                          onChange={() => {
                            const allChecked = tokens.length > 0 && tokens.every(t => selectedTokens[t._id]);
                            const nextMap = {};
                            if (!allChecked) {
                              tokens.forEach(t => { nextMap[t._id] = true; });
                            }
                            setSelectedTokens(nextMap);
                          }}
                        />
                      </th>
                      {['Token Number', 'Type', 'Holder Details', 'Amount', 'Payment Method', 'Date Issued', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-4 text-left font-bold text-gray-400 tracking-wider text-xs uppercase" style={{ whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="text-center py-10 text-gray-500 font-medium">Loading tokens...</td></tr>
                    ) : tokens.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-10 text-gray-500 font-medium">No tokens found.</td></tr>
                    ) : tokens.map(t => {
                      const isRowChecked = !!selectedTokens[t._id];
                      return (
                        <tr
                          key={t._id}
                          className={`transition-all duration-200 ${isRowChecked ? 'table-row-selected' : ''}`}
                          style={{
                            borderBottom: isRowChecked ? 'none' : '1px solid #FAF7F0',
                          }}
                        >
                          <td className="px-5 py-4">
                            <input
                              type="checkbox"
                              className="checkbox-custom"
                              checked={isRowChecked}
                              onChange={() => {
                                setSelectedTokens(prev => ({
                                  ...prev,
                                  [t._id]: !prev[t._id]
                                }));
                              }}
                            />
                          </td>
                          <td className="px-5 py-4 font-mono text-xs font-extrabold" style={{ color: isRowChecked ? '#1F2937' : '#CC3300' }}>
                            {t.tokenNumber}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className="px-3.5 py-1 rounded-full text-2xs font-extrabold tracking-wider uppercase inline-block"
                              style={{
                                background: t.type === 'BOOKING' ? 'rgba(255, 102, 0, 0.08)' : 'rgba(0, 85, 170, 0.08)',
                                color: t.type === 'BOOKING' ? '#FF6600' : '#0055AA',
                                fontSize: '0.65rem'
                              }}
                            >
                              {t.type === 'BOOKING' ? 'Stay' : 'Donation'}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-bold flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs bg-indigo-100 text-indigo-800 border border-indigo-200">
                              {getInitials(t.name)}
                            </div>
                            <div>
                              <div className="font-bold">{t.name}</div>
                              <div className={`text-xs font-semibold ${isRowChecked ? 'text-gray-700' : 'text-gray-400'}`}>{t.email}</div>
                              {t.phone && <div className={`text-xs font-semibold ${isRowChecked ? 'text-gray-700' : 'text-gray-400'}`}>{t.phone}</div>}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-bold">{formatINR(t.amount)}</td>
                          <td className="px-5 py-4">
                            <span
                              className="px-3.5 py-1 rounded-full text-xs font-bold inline-block"
                              style={{
                                background: t.paymentMethod === 'ONLINE' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(232, 160, 32, 0.08)',
                                color: t.paymentMethod === 'ONLINE' ? '#16a34a' : '#D97706',
                              }}
                            >
                              {t.paymentMethod}
                            </span>
                          </td>
                          <td className={`px-5 py-4 whitespace-nowrap font-medium ${isRowChecked ? 'text-gray-800' : 'text-gray-500'}`}>
                            {new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={t.status} />
                          </td>
                          <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                            {t.status === 'ACTIVE' && (
                              <div className="flex gap-2">
                                <button
                                  className="px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all border-none cursor-pointer hover:shadow-sm"
                                  style={{ backgroundColor: '#16a34a', minHeight: 30 }}
                                  onClick={() => handleUpdateTokenStatus(t._id, 'USED')}
                                >
                                  Mark Used
                                </button>
                                <button
                                  className="px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all border-none cursor-pointer hover:shadow-sm"
                                  style={{ backgroundColor: '#dc2626', minHeight: 30 }}
                                  onClick={() => handleUpdateTokenStatus(t._id, 'EXPIRED')}
                                >
                                  Expire
                                </button>
                              </div>
                            )}
                            {t.status === 'USED' && (
                              <span className="text-green-600 font-bold text-xs flex items-center gap-1">Served</span>
                            )}
                            {t.status === 'EXPIRED' && (
                              <span className="text-red-600 font-bold text-xs">Expired</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ROOMS TAB ── */}
        {activeTab === 'rooms' && (
          <div>
            <h1 className="text-gray-900" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '2.5rem', marginBottom: '0.2rem', letterSpacing: '-0.03em' }}>
              Rooms
            </h1>
            <p className="text-gray-500 text-xs font-semibold mb-6">Configure room rates and block maintenance periods</p>

            <div className="space-y-4">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-[24px]" />)
              ) : rooms.map(room => (
                <div
                  key={room._id}
                  className="p-6 flex items-center justify-between gap-4 transition-all duration-300 shadow-sm border bg-white hover:shadow-md hover:scale-[1.005]"
                  style={{
                    borderRadius: '24px',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {room.name}
                    </div>
                    <div style={{ color: '#9a7050', fontSize: '0.85rem', marginTop: '0.25rem', fontWeight: 600 }}>
                      Capacity: {room.capacity} Guests | {formatINR(room.pricePerNight)}/night
                    </div>
                    {room.blockedDates?.length > 0 && (
                      <div className="mt-2">
                        <span style={{ color: '#CC3300', fontSize: '0.75rem', fontWeight: 700 }}>
                          Blocked: {room.blockedDates.length} date range(s)
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    className="btn-bhagwa text-xs py-2.5 px-6 rounded-full font-bold cursor-pointer border-none shadow-sm transition-all hover:scale-102"
                    onClick={() => setBlockModal(room)}
                  >
                    Block Dates
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Cancel modal */}
      {cancelModal && (
        <CancelModal
          booking={cancelModal}
          onClose={(refresh) => {
            setCancelModal(null);
            if (refresh) fetchBookings();
          }}
        />
      )}

      {/* Block modal */}
      {blockModal && (
        <BlockDatesModal
          room={blockModal}
          onClose={(refresh) => {
            setBlockModal(null);
            if (refresh) fetchRooms();
          }}
        />
      )}
      </div>
    </div>
  );
}
