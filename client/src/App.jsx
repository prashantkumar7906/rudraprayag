import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import GalleryPage from './pages/GalleryPage';
import AboutPage from './pages/AboutPage';
import DonatePage from './pages/DonatePage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import ThankYouPage from './pages/ThankYouPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function ProtectedRoute({ children }) {
  return localStorage.getItem('adminToken') ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
