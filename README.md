# Leftly 🍽️ — Eat Smart. Waste Less.

**Leftly** is a surplus food ordering web application built to **reduce food waste in Sri Lanka** while supporting sellers and customers in a smart, responsible, and sustainable way. The platform connects sellers having near-to-expiry (but completely safe) food with customers looking to purchase meals at discounted prices—saving food, money, and the environment.

---

## 🌐 Live Deployments

*   **Frontend Web Application:** [https://surplus-food-leftly.vercel.app](https://surplus-food-leftly.vercel.app)
*   **Backend API Service:** [https://surplus-food-leftly-production.up.railway.app](https://surplus-food-leftly-production.up.railway.app)

---

## 📸 App Interface

### Home Landing Page
![Leftly Landing Page](Frontend/public/home.png)

### Category Selection & Meals Search
![Leftly Meals Search](Frontend/public/foodh.png)

### Recommended Products & Discounts
![Leftly Discounted Products](Frontend/public/trusted.png)

---

## 🛠️ Production Deployments & Technical Fixes

During the deployment of Leftly to Vercel (Frontend) and Railway (Backend), several critical architectural and configuration issues were resolved:

### 1. Next.js Vercel Security Block (CVE-2025-66478)
*   **Issue:** Vercel automatically blocks builds that use vulnerable versions of Next.js to protect serverless infrastructure. The codebase originally used Next.js `15.5.2` which was flagged.
*   **Fix:** Updated Next.js and ESLint configurations in the frontend to `^15.5.7` (the patched secure release), allowing the build process to verify and deploy successfully.

### 2. Node.js ES Modules Extensionless Imports
*   **Issue:** The backend runs under Node.js ES Modules (`"type": "module"`). When compiled, raw Node throws `ERR_MODULE_NOT_FOUND` if relative imports do not explicitly declare file extensions (e.g. `../lib/prisma` instead of `../lib/prisma.js`).
*   **Fix:** Shifted the startup command in `package.json` to execute the code using `tsx` (`npx tsx index.ts`). `tsx` acts as an on-the-fly TypeScript loader that handles type resolution and resolves extensionless ESM imports automatically, making the build cloud-native and resilient.

### 3. Missing Remote Dependencies
*   **Issue:** `socket.io` was listed in the root dependencies but was missing from the `Backend/package.json`, causing the backend build to fail on Railway since the parent folder is not uploaded.
*   **Fix:** Restructured and installed `socket.io` directly in `Backend/package.json` dependencies.

### 4. Dynamic URL Ports (Port 2000 Mismatch)
*   **Issue:** The database stored static URLs (e.g., `http://localhost:2000/uploads/...`) generated during registration. When the backend port was updated to `5000` (or deployed to production), images failed to load (`ERR_CONNECTION_REFUSED`).
*   **Fix:** Developed a dynamic `formatImageUrl` utility on the backend that intercepts database image fields and rewrites their protocol, hostname, and port on the fly matching the active requesting client's hostname.

### 5. Guest User State Crashing (401 Unauthorized)
*   **Issue:** When an unlogged guest visited a shop, the frontend triggered a request to fetch followed shops, throwing a `401 Unauthorized` error console log.
*   **Fix:** Added validation checks in the store. If the client does not hold an authentication token, it returns early. Added client-side alerts to redirect guest users to `/login` if they attempt to perform registered actions like following or messaging.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js v22+
*   npm 11+
*   Neon PostgreSQL Instance

### Backend Installation

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   DATABASE_URL="postgresql://neondb_owner:YOUR_KEY@YOUR_HOST/neondb?sslmode=require"
   JWT_SECRET="leftly_secret_key"
   PORT=5000
   ```
4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```

### Frontend Installation

1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure API endpoints in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000"
   NEXT_PUBLIC_API_BASE_URL="http://localhost:5000"
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🌟 Core Features

### For Customers (Guests & Registered)
*   **Browse Surplus Meals:** Discover near-to-expiry food from nearby restaurants and bakeries.
*   **Instant Cart & Orders:** Quickly purchase items at heavily discounted rates.
*   **Real-time Communication:** Live chat directly with sellers to ask questions about food safety and pickup times.
*   **Mystery Boxes 🎁:** Buy surprise food combinations prepared creatively by shops at a fractional price.

### For Food Sellers (Restaurants & Bakeries)
*   **Inventory Control:** Easily list foods with custom expiry dates, discounted pricing, and shelf timings.
*   **Analytics Dashboards:** Monitor sales growth, track positive environmental impact, and view user feedback.
*   **Customer Relationship Management:** Follow-up on orders and manage reviews.

### For Admins
*   **Content Moderation:** Verify sellers, manage category directories, approve reviews, and resolve complaints.

---

## 🛠️ Tech Stack

*   **Next.js (Turbopack)** – Fast, SEO-optimized user interface with React 19.
*   **TypeScript** – Type-safety across the frontend and backend.
*   **Zustand** – Lightweight global state manager for cart, auth, and real-time chat.
*   **Neon (PostgreSQL)** – Cloud serverless database for scalable data storage.
*   **Prisma ORM** – Type-safe database queries.
*   **Express.js & Socket.io** – REST APIs and real-time WebSocket communication.

---

## 📄 License
This project is licensed under the MIT License.
