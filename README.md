Leftly 🍽️

Leftly is a surplus food ordering web application built to reduce food waste in Sri Lanka while supporting sellers and customers in a smart and responsible way. The platform connects sellers with near-to-expiry (but safe) food to customers willing to purchase it at discounted prices, saving food, money, and the environment.

Features
Non-Registered Users

Browse available surplus food

Add items to cart and place orders

Submit complaints easily without creating an account

Registered Users

Order food and track spending

View order history

Chat with sellers and follow favorite sellers

Sellers

Add and manage products

View dashboards and analytics

Generate reports

Communicate with customers in real-time

Create Mystery Boxes 🎁 to sell surplus creatively

Admin

Manage users, categories, complaints, and reviews

Monitor dashboards and generate reports

Tech Stack

Next.js – Fast, SEO-friendly web app with server-side and client-side rendering

TypeScript – Type safety for reliable and maintainable code

Zustand – Global state management for cart, authentication, and user info

Neon (PostgreSQL) – Secure cloud database for users, products, orders, and analytics

Prisma – Simplifies database queries with type-safe ORM operations

Express.js – Backend APIs and business logic

Socket.io – Real-time features like live chat and instant updates

Security: JWT-based authentication, strong password validation, and protected APIs ensure safe user data and transactions.

Next Steps / Future Enhancements

Integrate AI-powered Smart Surplus Prediction & Spoilage Prevention to reduce waste before it happens

Add food donation features so unsold food can be redirected to charities

Getting Started

Clone the repository

git clone https://github.com/your-username/leftly.git


Install dependencies

npm install


Configure environment variables
Create a .env file:

DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PORT=5000


Run the application

npm run dev


Open http://localhost:3000
 to see the app in action.
