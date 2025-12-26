import express from 'express'
import dotenv from "dotenv"
dotenv.config()
import connectDB from './Config/database.js'
import cusAuthRoutes from './Routes/cusAuthRoute.js'
import sellerAuthRoute from './Routes/sellerAuthRoute.js'
import cartRoute from './Routes/cartRoute.js'
import productRoute from './Routes/productRoute.js'
import orderRoutes from './Routes/orderRoutes.js'
import reviewRoute from './Routes/reviewRoute.js'
import followRoute from './Routes/followRoute.js'
import chatRoute from './Routes/chatRoute.js'
import categoryRoute from './Routes/AdminRoutes/categoryRoute.js'
import userRoute from './Routes/AdminRoutes/userRoute.js'
import complaintRoute from './Routes/AdminRoutes/complaintRoute.js'
import adminreviewRoute from './Routes/AdminRoutes/adminReviewRoute.js'
import admincomplainRoute from './Routes/AdminRoutes/complaintRoute.js'
import cors from 'cors'
import chatSocket from './sockets/chatSocket.js'
import { Server } from 'socket.io'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const PORT = process.env.PORT || 5000
app.use(express.json());

app.use(cors({
    origin:process.env.CLIENT_ORIGIN || '*',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
}))

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// For debugging: Log all requests to uploads
app.use('/uploads', (req, res, next) => {
    console.log(`Static file request: ${req.path}`);
    next();
});

connectDB();

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_ORIGIN || "http://localhost:3000", // Fixed
        credentials: true
    },
});
chatSocket(io)

server.listen(PORT, () => {
    console.log("Server running on port " + PORT)
})


//routes
app.use("/api/customer",cusAuthRoutes)
app.use("/api/seller",sellerAuthRoute)
app.use("/api/product",productRoute)
app.use("/api/cart",cartRoute)
app.use("/api/order",orderRoutes)
app.use("/api/review",reviewRoute)
app.use("/api/follow",followRoute)
app.use("/api/chat",chatRoute)
app.use("/api/category",categoryRoute)
app.use("/api/user",userRoute)
app.use("/api/complaints",complaintRoute)
app.use("/api/adminreview",adminreviewRoute)
app.use("/api/admincomplaint",admincomplainRoute)

// Root route for testing
app.get('/', (req, res) => {
    res.json({
        message: 'Server is running',
        uploads_path: path.join(__dirname, 'uploads'),
        static_files: 'Access via /uploads/filename.jpg'
    });
});
