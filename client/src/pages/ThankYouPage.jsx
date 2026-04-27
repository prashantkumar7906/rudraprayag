import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { formatINR } from '../utils/helpers';

export default function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount');
  const ref = searchParams.get('ref');
  const name = searchParams.get('name') || 'Devotee';
  const siteUrl = window.location.origin;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  useEffect(() => {
    document.title = 'Thank You for Your Donation — Devprayag Dharamshala';
  }, []);

  const whatsappText = encodeURIComponent(
    `🙏 I just donated ${formatINR(amount)} to Devprayag Dharamshala. Join me in supporting this sacred cause: ${siteUrl}/donate`
  );

  const downloadReceipt = () => {
    const receiptText = `
DEVPRAYAG DHARAMSHALA TRUST
Sangam Ghat Road, Devprayag, Tehri Garhwal, Uttarakhand 249301

DONATION RECEIPT
================
Donation ID : ${ref}
Donor Name  : ${name}
Amount      : ${formatINR(amount)}
Date        : ${today}

This receipt confirms your generous donation to Devprayag Dharamshala Trust.
May your dharma and devotion be blessed. 🙏

Hari Om — हरि ॐ
    `.trim();
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ref}-receipt.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-16" style={{ background: '#FFF0E0' }}>
        <div className="max-w-xl mx-auto px-4 text-center">
          {/* Om */}
          <div style={{ fontSize: '6rem', color: '#FF6600', lineHeight: 1, marginBottom: '1rem', textShadow: '0 0 30px rgba(255,102,0,0.3)' }}>
            ॐ
          </div>

          {/* Heading */}
          <h1 style={{ color: '#CC3300', fontFamily: 'Noto Serif', fontWeight: 700, fontSize: '2.2rem', marginBottom: '0.5rem' }}>
            Hari Om — Thank You!
          </h1>
          <p style={{ color: '#E8A020', fontFamily: 'Noto Serif', fontSize: '1.1rem', marginBottom: '2rem' }}>
            हरि ॐ — Your bhakti is deeply appreciated, {name} जी 🙏
          </p>

          {/* Details card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div style={{ background: '#FF6600', padding: '1.5rem' }}>
              <div style={{ color: 'white', fontSize: '3rem', fontWeight: 700 }}>
                {formatINR(amount)}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>Donated Successfully</div>
            </div>

            <div className="p-6 space-y-3 text-sm text-left">
              {[
                ['Donor Name', name],
                ['Donation ID', ref],
                ['Date', today],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2" style={{ borderBottom: '1px solid #FFF0E0' }}>
                  <span style={{ color: '#6b4c30' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: '#2C1200' }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="px-6 pb-4">
              <div
                className="p-3 rounded-xl text-center"
                style={{ background: '#E8F0FF', border: '1px solid #0055AA30' }}
              >
                <p style={{ color: '#0055AA', fontSize: '0.9rem' }}>
                  📧 Your donation receipt has been sent to your email.
                </p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="p-6 rounded-2xl mb-6" style={{ background: 'white', border: '2px solid #FFCCAA' }}>
            <p style={{ color: '#2C1200', lineHeight: 1.8, fontStyle: 'italic', fontFamily: 'Noto Serif' }}>
              "Your donation helps us maintain this sacred dharamshala, provide clean accommodation
              to pilgrims, and ensure that the Char Dham Yatra remains accessible to all devotees,
              regardless of their means. May the blessings of Ganga Maiya shower upon you and your family."
            </p>
            <p style={{ color: '#FF6600', marginTop: '1rem', fontWeight: 600 }}>
              — Devprayag Dharamshala Trust
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <a
              href={`https://wa.me/?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <button
                className="w-full py-3 px-6 rounded-xl font-semibold transition-all"
                style={{
                  background: '#25D366',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: 44,
                  fontSize: '0.95rem',
                }}
              >
                📱 Share on WhatsApp
              </button>
            </a>
            <button
              className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all"
              style={{
                background: 'white',
                color: '#FF6600',
                border: '2px solid #FF6600',
                cursor: 'pointer',
                minHeight: 44,
                fontSize: '0.95rem',
              }}
              onClick={downloadReceipt}
            >
              📄 Download Receipt
            </button>
          </div>

          <Link to="/">
            <button className="btn-bhagwa px-10">🏠 Back to Home</button>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
