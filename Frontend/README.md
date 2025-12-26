
---

# Leftly 🍽️

**Leftly** is a surplus food ordering web application designed to **reduce food waste in Sri Lanka** while supporting both sellers and customers in a smart and responsible way. The platform connects sellers with near-to-expiry (but safe) food to customers willing to purchase it at discounted prices, helping save food, money, and the environment.

---

## Features

### Non-Registered Users

* Browse available surplus food
* Add items to cart and place orders
* Submit complaints easily without creating an account

### Registered Users

* Order food and track spending
* View order history
* Chat with sellers and follow favorite sellers

### Sellers

* Add and manage products
* View dashboards and analytics
* Generate reports
* Communicate with customers in real-time
* Create **Mystery Boxes 🎁** to sell surplus creatively

### Admin

* Manage users, categories, complaints, and reviews
* Monitor dashboards and generate reports

---

## Tech Stack

* **Next.js** – Fast, SEO-friendly web application with server-side and client-side rendering
* **TypeScript** – Adds type safety for reliable and maintainable code
* **Zustand** – Global state management for authentication, cart, and user info
* **Neon (PostgreSQL)** – Cloud database for storing users, products, orders, and analytics
* **Prisma** – Simplifies database queries with type-safe ORM operations
* **Express.js** – Backend APIs and business logic
* **Socket.io** – Real-time features such as live chat and instant updates

**Security:** JWT-based authentication, strong password validation, and protected APIs to ensure user data and transactions remain secure.

---

## Next Steps / Future Enhancements

* Integrate **AI-powered Smart Surplus Prediction & Spoilage Prevention** to reduce waste before it happens
* Add **food donation features** so unsold food can be redirected to charities

---

## Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/your-username/leftly.git
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**
   Create a `.env` file with the following (example):

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. **Run the application**

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the app in action.

---

## Contribution

Contributions, issues, and feature requests are welcome! Feel free to submit a pull request or open an issue.

---

## License

This project is licensed under the MIT License.

---


