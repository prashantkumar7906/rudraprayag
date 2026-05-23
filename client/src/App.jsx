import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import HomePage from './pages/HomePage';

// Lazy-loaded pages — each becomes its own JS chunk, loaded on-demand
const RoomsPage = lazy(() => import('./pages/RoomsPage'));
const RoomDetailPage = lazy(() => import('./pages/RoomDetailPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const DonatePage = lazy(() => import('./pages/DonatePage'));
const BookingConfirmationPage = lazy(() => import('./pages/BookingConfirmationPage'));
const ThankYouPage = lazy(() => import('./pages/ThankYouPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));

/* Minimal loading spinner matching the site's warm palette */
function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDF6EE' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #F0E8DF', borderTopColor: '#E8520A', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ProtectedRoute({ children }) {
  return localStorage.getItem('adminToken') ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"                                element={<HomePage />} />
          <Route path="/rooms"                           element={<RoomsPage />} />
          <Route path="/rooms/:roomId"                   element={<RoomDetailPage />} />
          <Route path="/gallery"                         element={<GalleryPage />} />
          <Route path="/about"                           element={<AboutPage />} />
          <Route path="/donate"                          element={<DonatePage />} />
          <Route path="/book"                            element={<Navigate to="/rooms" replace />} />
          <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmationPage />} />
          <Route path="/thank-you"                       element={<ThankYouPage />} />
          <Route path="/admin/login"                     element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin"                           element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={
            <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#FDF6EE'}}>
              <div style={{fontSize:'4rem',color:'#E8520A',marginBottom:'1rem'}}>ॐ</div>
              <h1 style={{fontFamily:'Playfair Display,serif',color:'#1A0A00',fontSize:'2rem',fontWeight:700}}>Page Not Found</h1>
              <p style={{color:'#3D2010',margin:'0.5rem 0 2rem'}}>The page you are looking for does not exist.</p>
              <a href="/" className="btn-primary">Back to Home</a>
            </div>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
