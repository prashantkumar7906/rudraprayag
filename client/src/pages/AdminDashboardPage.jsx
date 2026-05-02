import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { formatINR, formatDate } from '../utils/helpers';

// ── Sidebar ──
function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'bookings', label: 'Bookings', icon: '🏨' },
    { id: 'donations', label: 'Donations', icon: '🙏' },
    { id: 'rooms', label: 'Rooms', icon: '🚪' },
  ];

  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #2C1200, #4a1500)', padding: '0' }}
    >
      {/* Brand */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(255,102,0,0.2)' }}>
        <div style={{ fontSize: '1.5rem', color: '#FF6600', marginBottom: '0.25rem' }}>ॐ</div>
        <div style={{ color: '#FF6600', fontFamily: 'Noto Serif', fontWeight: 700, fontSize: '0.95rem' }}>
          देवप्रयाग धर्मशाला
        </div>
        <div style={{ color: '#F9A86A', fontSize: '0.75rem' }}>Admin Panel</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(255,102,0,0.2)' : 'transparent',
              color: activeTab === tab.id ? '#FF6600' : '#F9A86A',
              border: activeTab === tab.id ? '1px solid rgba(255,102,0,0.3)' : '1px solid transparent',
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            <span>{tab.icon}</span>
            <span className="font-medium text-sm">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,102,0,0.2)' }}>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
          style={{ color: '#F9A86A', background: 'transparent', border: 'none', cursor: 'pointer', minHeight: 44 }}
        >
          <span>🚪</span>
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}

// ── Stat Card ──
function StatCard({ label, value, icon, color }) {
  return (
    <div
      className="p-6 rounded-2xl"
      style={{ background: 'white', border: `2px solid ${color}30`, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: '2rem' }}>{icon}</span>
        <span
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: `${color}15`, color }}
        >
          LIVE
        </span>
      </div>
      <div style={{ color, fontWeight: 700, fontSize: '1.8rem', fontFamily: 'Noto Serif' }}>
        {value}
      </div>
      <div style={{ color: '#6b4c30', fontSize: '0.9rem', marginTop: '0.25rem' }}>{label}</div>
    </div>
  );
}

// ── Status Badge ──
function StatusBadge({ status }) {
  const config = {
    CONFIRMED: { bg: '#dcfce7', color: '#15803d', label: 'Confirmed' },
    PENDING: { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
    CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
    EXPIRED: { bg: '#f3f4f6', color: '#6b7280', label: 'Expired' },
    FAILED: { bg: '#fee2e2', color: '#991b1b', label: 'Failed' },
  };
  const c = config[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };
  return (
    <span
      className="badge"
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
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [bStatus, setBStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Expanded booking row
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [blockModal, setBlockModal] = useState(null);

  useEffect(() => {
    document.title = 'Admin Dashboard — Devprayag Dharamshala';
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/admin/login');
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchStats();
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'donations') fetchDonations();
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
    <div className="flex min-h-screen" style={{ background: '#E8F0FF' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {/* Mobile tab bar */}
        <div className="flex md:hidden gap-2 mb-6 overflow-x-auto pb-2">
          {['dashboard', 'bookings', 'donations', 'rooms'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
              style={{
                background: activeTab === tab ? '#FF6600' : 'white',
                color: activeTab === tab ? 'white' : '#6b4c30',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ml-auto"
            style={{ background: '#fee2e2', color: '#CC3300', border: 'none', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 style={{ color: '#CC3300', fontFamily: 'Noto Serif', fontWeight: 700, fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              Dashboard
            </h1>
            <p style={{ color: '#9a7050', marginBottom: '2rem' }}>Overview of Devprayag Dharamshala</p>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="skeleton h-36 rounded-2xl" />)}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Bookings" value={stats.totalBookings || 0} icon="🏨" color="#FF6600" />
                <StatCard label="Confirmed Revenue" value={formatINR(stats.totalRevenue || 0)} icon="💰" color="#16a34a" />
                <StatCard label="Total Donations" value={stats.donationCount || 0} icon="🙏" color="#0055AA" />
                <StatCard label="Donations Revenue" value={formatINR(stats.donationTotal || 0)} icon="💛" color="#E8A020" />
              </div>
            ) : (
              <p style={{ color: '#9a7050' }}>Unable to load stats.</p>
            )}
          </div>
        )}

        {/* ── BOOKINGS TAB ── */}
        {activeTab === 'bookings' && (
          <div>
            <h1 style={{ color: '#CC3300', fontFamily: 'Noto Serif', fontWeight: 700, fontSize: '1.8rem', marginBottom: '1.5rem' }}>
              Bookings
            </h1>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b4c30' }}>From</label>
                <input type="date" className="form-input" style={{ width: 160 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b4c30' }}>To</label>
                <input type="date" className="form-input" style={{ width: 160 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b4c30' }}>Status</label>
                <select
                  className="form-input"
                  style={{ width: 160 }}
                  value={bStatus}
                  onChange={e => setBStatus(e.target.value)}
                >
                  {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <button className="btn-bhagwa" onClick={fetchBookings}>
                🔍 Filter
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#FFF0E0', borderBottom: '2px solid #FFCCAA' }}>
                      {['Booking ID', 'Guest', 'Room', 'Check-In', 'Check-Out', 'Nights', 'Amount', 'Status', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: '#CC3300', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="text-center py-8" style={{ color: '#9a7050' }}>Loading...</td></tr>
                    ) : bookings.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-8" style={{ color: '#9a7050' }}>No bookings found.</td></tr>
                    ) : bookings.map(b => (
                      <>
                        <tr
                          key={b._id}
                          style={{
                            borderBottom: '1px solid #FFF0E0',
                            cursor: 'pointer',
                            background: expandedBooking === b._id ? '#FFF8F0' : 'white',
                          }}
                          onClick={() => setExpandedBooking(expandedBooking === b._id ? null : b._id)}
                        >
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: '#CC3300' }}>{b.bookingId}</td>
                          <td className="px-4 py-3 font-medium" style={{ color: '#2C1200' }}>{b.guestName}</td>
                          <td className="px-4 py-3" style={{ color: '#6b4c30' }}>{b.roomTypeName}</td>
                          <td className="px-4 py-3" style={{ color: '#6b4c30', whiteSpace: 'nowrap' }}>{formatDate(b.checkIn)}</td>
                          <td className="px-4 py-3" style={{ color: '#6b4c30', whiteSpace: 'nowrap' }}>{formatDate(b.checkOut)}</td>
                          <td className="px-4 py-3 text-center" style={{ color: '#6b4c30' }}>{b.nights}</td>
                          <td className="px-4 py-3 font-semibold" style={{ color: '#FF6600', whiteSpace: 'nowrap' }}>
                            {formatINR(b.priceBreakdown?.totalAmount)}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                          <td className="px-4 py-3 text-right" style={{ color: '#9a7050', fontSize: '1rem' }}>
                            {expandedBooking === b._id ? '▲' : '▼'}
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {expandedBooking === b._id && (
                          <tr key={b._id + '-exp'} style={{ background: '#FFF8F0' }}>
                            <td colSpan={9} className="px-6 py-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span style={{ color: '#9a7050' }}>Email:</span>
                                  <div style={{ fontWeight: 600 }}>{b.guestEmail}</div>
                                </div>
                                <div>
                                  <span style={{ color: '#9a7050' }}>Phone:</span>
                                  <div style={{ fontWeight: 600 }}>{b.citizenship === 'Indian' ? '+91 ' : ''}{b.guestPhone}</div>
                                </div>
                                <div>
                                  <span style={{ color: '#9a7050' }}>Citizenship:</span>
                                  <div style={{ fontWeight: 600 }}>{b.citizenship || 'Indian'}</div>
                                </div>
                                <div>
                                  <span style={{ color: '#9a7050' }}>ID ({b.idType || 'N/A'}):</span>
                                  <div style={{ fontWeight: 600 }}>{b.idNumber || 'N/A'}</div>
                                </div>
                                <div>
                                  <span style={{ color: '#9a7050' }}>Payment ID:</span>
                                  <div style={{ fontWeight: 600 }} className="font-mono text-xs">
                                    {b.razorpayPaymentId || 'N/A'}
                                  </div>
                                </div>
                                <div>
                                  <span style={{ color: '#9a7050' }}>Email Sent:</span>
                                  <div style={{ fontWeight: 600 }}>
                                    {b.emailSentAt ? new Date(b.emailSentAt).toLocaleString('en-IN') : 'Not sent'}
                                  </div>
                                </div>
                              </div>
                              {b.status === 'CONFIRMED' && (
                                <button
                                  className="mt-4 px-5 py-2 rounded-xl text-sm font-medium text-white transition-all"
                                  style={{ background: '#CC3300', border: 'none', cursor: 'pointer' }}
                                  onClick={(e) => { e.stopPropagation(); setCancelModal(b); }}
                                >
                                  ❌ Cancel Booking
                                </button>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── DONATIONS TAB ── */}
        {activeTab === 'donations' && (
          <div>
            <h1 style={{ color: '#CC3300', fontFamily: 'Noto Serif', fontWeight: 700, fontSize: '1.8rem', marginBottom: '1.5rem' }}>
              Donations
            </h1>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#FFF0E0', borderBottom: '2px solid #FFCCAA' }}>
                      {['Donation ID', 'Donor Name', 'Email', 'Amount', 'Message', 'Date', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: '#CC3300', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-8" style={{ color: '#9a7050' }}>Loading...</td></tr>
                    ) : donations.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8" style={{ color: '#9a7050' }}>No donations yet.</td></tr>
                    ) : donations.map(d => (
                      <tr key={d._id} style={{ borderBottom: '1px solid #FFF0E0' }}>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: '#0055AA' }}>{d.donationId}</td>
                        <td className="px-4 py-3 font-medium" style={{ color: '#2C1200' }}>{d.donorName}</td>
                        <td className="px-4 py-3" style={{ color: '#6b4c30' }}>{d.donorEmail}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: '#FF6600' }}>{formatINR(d.amount)}</td>
                        <td className="px-4 py-3" style={{ color: '#9a7050', maxWidth: 200 }}>
                          <span className="truncate block">{d.message || '—'}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#6b4c30' }}>
                          {new Date(d.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ROOMS TAB ── */}
        {activeTab === 'rooms' && (
          <div>
            <h1 style={{ color: '#CC3300', fontFamily: 'Noto Serif', fontWeight: 700, fontSize: '1.8rem', marginBottom: '1.5rem' }}>
              Rooms
            </h1>
            <div className="space-y-4">
              {loading ? (
                [1, 2, 3, 4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)
              ) : rooms.map(room => (
                <div
                  key={room._id}
                  className="bg-white rounded-2xl p-6 flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex-1">
                    <div style={{ fontFamily: 'Noto Serif', fontWeight: 700, color: '#CC3300', fontSize: '1.1rem' }}>
                      {room.name}
                    </div>
                    <div style={{ color: '#9a7050', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      Capacity: {room.capacity} | {formatINR(room.pricePerNight)}/night
                    </div>
                    {room.blockedDates?.length > 0 && (
                      <div className="mt-2">
                        <span style={{ color: '#CC3300', fontSize: '0.75rem', fontWeight: 600 }}>
                          Blocked: {room.blockedDates.length} date range(s)
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    className="btn-bhagwa text-sm py-2 px-4"
                    onClick={() => setBlockModal(room)}
                  >
                    🚫 Block Dates
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
  );
}
