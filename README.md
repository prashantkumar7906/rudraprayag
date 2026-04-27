# Devprayag Dharamshala — Full-Stack Web Application

A production-grade pilgrim guest house booking and donation platform for **Devprayag Dharamshala**, located at the sacred Alaknanda–Bhagirathi confluence in Devprayag, Uttarakhand, India.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS v4 |
| Backend | Node.js + Express 5 |
| Database | MongoDB Atlas (Mongoose) |
| Payments | Razorpay (UPI, Cards, Net Banking) |
| Email | Nodemailer + Gmail SMTP |
| Auth | JWT HS256 (admin only, 8h expiry) |
| Hosting | Vercel (client) + Render (server) |

---

## Project Structure

```
/dharamshala
  /client        ← React + Vite frontend
  /server        ← Express backend
  .env.example   ← All required environment variables
  README.md
```

---

## Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (M0 free tier)
- Razorpay test account
- Gmail account with App Password enabled

### 1. Clone & Install

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Configure Environment Variables

```bash
# Server
cp ../.env.example server/.env
# Edit server/.env with your values

# Client
cp ../.env.example client/.env
# Edit client/.env — only the VITE_ prefixed vars matter
```

#### Server `.env` variables

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Min 32-char random string (`openssl rand -base64 32`) |
| `RAZORPAY_KEY_ID` | Razorpay Key ID (`rzp_live_...` or `rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook Secret (from dashboard) |
| `SMTP_USER` | Gmail address for sending emails |
| `SMTP_PASS` | Gmail App Password (16 chars, spaces OK) |
| `ADMIN_EMAIL` | Email to receive admin booking alerts |
| `FRONTEND_URL` | Production frontend URL for CORS allowlist |

#### Client `.env` variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g. `https://dharamshala-api.onrender.com/api/v1`) |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Key ID (same as server, test or live) |

### 3. Seed the Database

```bash
cd server
npm run seed
```

This creates:
- **4 room types**: Dormitory Bed (₹300), Standard Double (₹800), Family Room (₹1,400), Deluxe Suite (₹2,200)
- **1 admin user**: `admin@dharamshala.com` / `Devprayag@2026`

### 4. Run Locally

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Visit: http://localhost:5173

---

## API Reference

All routes are prefixed `/api/v1`.

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/rooms` | List all active room types |
| `GET` | `/rooms/availability` | Check availability for dates |
| `POST` | `/bookings/initiate` | Create booking + Razorpay order |
| `POST` | `/bookings/webhook` | Razorpay webhook (raw body) |
| `GET` | `/bookings/:bookingId` | Get booking status |
| `POST` | `/donations/initiate` | Create donation + Razorpay order |
| `POST` | `/donations/webhook` | Razorpay donation webhook |

### Admin Endpoints (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/admin/login` | Admin login — returns JWT |
| `GET` | `/admin/dashboard` | Stats overview |
| `GET` | `/admin/bookings` | Paginated + filtered bookings |
| `PATCH` | `/admin/bookings/:id/cancel` | Cancel a confirmed booking |
| `GET` | `/admin/donations` | Paginated donations list |
| `POST` | `/rooms` | Create a new room type |
| `PATCH` | `/rooms/:id/block` | Block dates for a room |

---

## Deployment

### Frontend → Vercel

1. Push `client/` to a GitHub repo (or use the monorepo root)
2. Import in [vercel.com](https://vercel.com)
3. Set **Root Directory** to `client`
4. Add environment variables:
   - `VITE_API_URL` = `https://your-api.onrender.com/api/v1`
   - `VITE_RAZORPAY_KEY_ID` = your live key
5. Deploy

Add a `client/vercel.json` for SPA routing:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory** to `server`
4. **Build Command**: `npm install`
5. **Start Command**: `node index.js`
6. Add all server environment variables in the Render dashboard
7. Deploy

### MongoDB Atlas

1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user with read/write permissions
3. Whitelist `0.0.0.0/0` (all IPs) for Render's dynamic IPs
4. Copy the connection string to `MONGODB_URI`

---

## Razorpay Webhook Configuration

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to **Settings → Webhooks → Add New Webhook**
3. Set **Webhook URL**:
   - Bookings: `https://your-api.onrender.com/api/v1/bookings/webhook`
   - Donations: `https://your-api.onrender.com/api/v1/donations/webhook`
4. Select event: **`payment.captured`**
5. Set a **Secret** and copy it to `RAZORPAY_WEBHOOK_SECRET`
6. Enable the webhook

> For local webhook testing, use [ngrok](https://ngrok.com): `ngrok http 5000`

---

## Maintenance Scripts

```bash
# Expire stale bookings manually (also runs via cron every 30 min)
# Already handled automatically — no action needed

# Reconcile PENDING bookings older than 2 hours against Razorpay
cd server
npm run reconcile
```

---

## Security Features

- ✅ Razorpay HMAC-SHA256 webhook signature verification
- ✅ Atomic MongoDB transaction prevents double-booking
- ✅ Partial unique index on confirmed bookings
- ✅ Stale booking cron (expires PENDING after 45 min)
- ✅ Rate limiting: 100/15min public, 5/15min bookings, 10/15min donations, 5/15min admin login
- ✅ `helmet()` security headers
- ✅ CORS allowlist (env var + localhost)
- ✅ `express-mongo-sanitize` (strips `$` and `.`)
- ✅ `express-validator` server-side validation
- ✅ Honeypot field bot protection
- ✅ JWT expiry 8h, bcrypt rounds 12
- ✅ No card data stored (PCI-DSS delegated to Razorpay)

---

## Admin Access

- URL: `/admin/login`
- Default credentials (after seeding):
  - Email: `admin@dharamshala.com`
  - Password: `Devprayag@2026`
- **Change the password in production!**

---

© 2026 Devprayag Dharamshala Trust — हर हर गंगे 🙏
