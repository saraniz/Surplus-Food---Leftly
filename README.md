# Leftly 🍽️ — Eat Smart. Waste Less.

**Leftly** is a surplus food ordering web application built to **reduce food waste in Sri Lanka** while supporting sellers and customers in a smart, responsible, and sustainable way. The platform connects sellers having near-to-expiry (but safe) food to customers willing to purchase it at discounted prices, saving food, money, and the environment.

---

## 🌐 Live Deployments

*   **Frontend Web App:** [https://surplus-food-leftly.vercel.app](https://surplus-food-leftly.vercel.app)
*   **Backend API Server:** [https://surplus-food-leftly-production.up.railway.app](https://surplus-food-leftly-production.up.railway.app)

---



## 🌟 Core Features

### 1. Non-Registered Users (Guests)
*   **Browse Surplus Food:** Browse available food items in real-time.
*   **Search & Filter:** Find meals by categories (Fruits, Vegetables, Salads, Beverages, Bakery, etc.).
*   **Instant Cart:** Add products to the cart and place orders instantly.
*   **Submit Complaints:** Lodge feedback or complaints without registration.

### 2. Registered Users (Customers)
*   **Order Tracking & Spending:** View active orders, history, and monitor expenses.
*   **Live Chat:** Communicate directly with sellers using real-time instant messaging.
*   **Follow Sellers:** Save favorite shops to quickly view their latest listings.

### 3. Food Sellers (Restaurants & Bakeries)
*   **Inventory Management:** List surplus food with descriptions, original prices, discount prices, stock counts, and shelf life.
*   **Interactive Dashboards:** Track sales revenue, top products, and overall environmental impact.
*   **Mystery Boxes 🎁:** Package multiple surplus items together as surprise boxes for creative sales.
*   **Customer Communication:** Respond to client messages and reviews directly.

### 4. Admin Portal
*   **User Directory Management:** Verify sellers, moderate customer accounts.
*   **Operations Control:** Manage categories, approve reviews, and resolve customer complaints.

---

## 🛠️ Tech Stack & Dependencies

### Frontend (Next.js Application)
*   **Next.js 15.5.7 (Turbopack)** – High performance, SEO-friendly React framework.
*   **React 19** – UI library with advanced rendering features.
*   **Tailwind CSS** – Styling framework for responsive interfaces.
*   **Zustand** – Global state management for auth, cart, and websocket states.
*   **Socket.io Client** – Real-time connection for instant customer-seller chat.
*   **Lucide React** – Clean, modern UI icon library.
*   **Framer Motion** – Micro-animations and transitions.

### Backend (Node.js & Express API)
*   **Express.js** – Server framework.
*   **TypeScript** – Strong typing across backend logic.
*   **Prisma ORM** – Type-safe query builder for PostgreSQL.
*   **Neon PostgreSQL** – Scalable serverless SQL database.
*   **Socket.io** – Event-driven real-time chat gateway.
*   **Bcrypt** – Secure hashing for user passwords.
*   **JSON Web Tokens (JWT)** – State-free secure user session tokens.
*   **Multer** – Middleware for handling file uploads (images).
*   **tsx** – High-speed typescript runtime execution.

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
3. Configure your database connection and server environment variables in a local `.env` file (refer to the backend configurations).
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
3. Configure your backend API connection URLs in a local `.env.local` file.
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 📄 License
This project is licensed under the MIT License.
