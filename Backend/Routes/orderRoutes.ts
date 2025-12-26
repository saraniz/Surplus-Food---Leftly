import express from 'express'
import authenticate from '../Middleware/authMiddleware'
import { 
  cancelOrder, 
  getGuestOrder, 
  getOrders, 
  getSellerOrders, 
  placeOrder, 
  statusUpdate 
} from '../Controller/orderController'

const router = express.Router()

// Public routes (no authentication required)
router.post("/guest/lookup", getGuestOrder);

// Customer routes (authenticated) - Keep existing endpoint names for backward compatibility
router.post("/placeorder", authenticate, placeOrder);
router.get("/getorders", authenticate, getOrders);
router.put("/cancel-order", authenticate, cancelOrder);

// Seller routes (authenticated) - Keep existing endpoint names for backward compatibility
router.get("/getsellerorders", authenticate, getSellerOrders);
router.put("/updatestatus", authenticate, statusUpdate);

export default router