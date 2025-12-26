import express from 'express'
import authenticate from '../Middleware/authMiddleware'
import { addToCart, deleteCart, fetchCart, bulkAddToCart } from '../Controller/cartController'

const router = express.Router()

router.post("/addtocart", authenticate, addToCart)
router.get("/fetchcart", authenticate, fetchCart)
router.delete("/deleteitem", authenticate, deleteCart)
router.post("/bulkadd", authenticate, bulkAddToCart) // New endpoint for merging

export default router