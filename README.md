# 🌊 WanderWave Journeys — Sovereign Bespoke Luxury Travel Atelier

[![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-v8-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Multi-Language](https://img.shields.io/badge/i18n-EN%20%7C%20SI%20%7C%20TA-f59e0b?style=flat-square)](https://github.com/)

**WanderWave** is a premier bespoke luxury travel and private aviation atelier. Designed for sovereign voyagers, it delivers ultra-exclusive private island retreats, chartered jet links, and 24/7 journey concierges across 140+ countries.

---

## ✨ Key Features & Architecture

### 1. 🏰 Destination Explorer (`/destinations`)
- **Interactive Multi-Filter Atelier**: Filter destinations by **Country**, **Geographic Region**, **Budget Tier**, and **Travel Style** (*Romantic, Luxury, Adventure, Cultural, Heritage, Beach & Coastal, Alpine*).
- **Instant Search**: Real-time keyword matching across titles, countries, regions, popular attractions, and signature experiences.
- **Rich Sanctuary Details Modal**:
  - High-resolution interactive photo gallery carousel and thumbnail strip.
  - Popular attractions and must-see landmarks.
  - Best time to visit insights (meteorological conditions & sailing calendar).
  - Transparent 4-point budget estimate (villa, private charter, activities, total).
  - Signature curated experiences checklist.
- **Sovereign Wishlist**: 1-click wishlist toggle synced to `localStorage` with live reactive cross-tab and cross-component updates.

### 2. ✈️ 4-Step Bespoke Booking Studio (`/book`)
- **Step 1: Sanctuary & Aviation Fleet**: Live catalog from MongoDB with FBO Departure Hubs (Geneva, London, New York, Zurich, Tokyo, Colombo) and private jet selection (*Gulfstream G650ER, Bombardier Global 7500, Dassault Falcon 8X*).
- **Step 2: Dates & Sovereign Suite**: Calendar check-in, duration pills, guest count scaling, and suite tier selection (*Presidential Cliff Villa, Royal Overwater Pavilion, Imperial Penthouse, Sovereign Ocean Residence*).
- **Step 3: Curated Add-ons & Notes**: Private yachts, Michelin-starred in-villa chefs, panoramic helicopter hops, VIP airside tarmac transfers, and dietary preferences.
- **Step 4: Primary Voyager Details & Confirmation**: Auto-filled authenticated details, live cost calculation with 10% Platinum Elite discount, and booking confirmation screen.

### 3. 🛡️ Executive Traveler Dashboard (`/dashboard`)
- **Sovereign Traveler Profile**: Live account tier status (`Platinum Elite`), 4 real-time KPI metric cards (Active Expeditions, Sovereign Miles, Saved Retreats, Dedicated Concierge Desk).
- **My Expeditions**: Active and past bookings, boarding pass cards, one-click reference code copy, official boarding pass & voucher modal with printable layout, and self-service booking cancellation.
- **Saved Wishlist**: Visual luxury retreat cards with 1-click details and direct booking reservation.
- **Sovereign Membership & Perks**: Privilege tracking (private catamarans, suite upgrades, zero-penalty flexibility, dedicated journey concierge).
- **Traveler Preferences**: Encrypted jet cabin, culinary, chauffeur, and security preferences.

### 4. 🌐 100% Reactive Multi-Language Localization
- Complete multi-language localization supporting:
  - 🇬🇧 **English**
  - 🇱🇰 **Sinhala (`සිංහල`)**
  - 🇱🇰 **Tamil (`தமிழ்`)**
- Instant, zero-reload language switching across every UI element, notification, filter, and modal.

### 5. 🤖 AI Travel Concierge Chatbot ("Aura")
- Persistent global travel assistant with ambient aura indicator.
- **Dual Intelligence Engine**: Powered by Google Gemini API with native fallback catalog extraction operating seamlessly with zero API keys.
- Full multilingual support in English, Sinhala, and Tamil with interactive destination recommendation cards.

### 6. 🔐 Admin Management Portal (`/admin`)
- Role-based access control protecting administrative endpoints.
- Real-time platform KPI metrics, full destination CRUD management, booking status toggles, and registered voyagers directory.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite v8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Linter**: [oxlint](https://oxc.rs/) (0 errors, 0 warnings)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Authentication**: JWT (JSON Web Tokens) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **AI Engine**: Google Gemini API (`@google/genai`) with native catalog fallback

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) running locally on port `27017` or a MongoDB Atlas URI

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/WanderWave.git
cd WanderWave
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/wanderwave_db
JWT_SECRET=supersecretjwtkey_wanderwave_2026_secure
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
# Optional: GEMINI_API_KEY=your_gemini_key_here
```

Start the backend server:
```bash
npm start
# Server starts on http://localhost:5000
```
*(On first boot, the backend automatically seeds initial rich sanctuary destinations and demo user accounts).*

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
# App launches on http://localhost:5173
```

---

## 🔑 Demo & Test Accounts

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@wanderwave.com` | `AdminPassword2026!` | Access to `/admin` Console & Full Management |
| **Traveler (Primary)** | `demo@wanderwave.com` | `Password123!` | Platinum Elite Member with active bookings |
| **Traveler (Secondary)** | `traveler@wanderwave.com` | `Adventurer2026!` | Gold Voyager Member access |

---

## 📄 License
This project is licensed under the MIT License — see the LICENSE file for details.
© 2026 WanderWave Journeys Ltd. All rights reserved.
