import express from 'express'
import authenticate from '../Middleware/authMiddleware'
import { upload } from '../Middleware/uploadMiddleware'
import { addMysteryBox, addProduct, deleteMysteryBox, deleteProduct, fetchAllProducts, fetchMysteryBoxes, fetchProducts, fetchSellerMysteryBoxes, fetchSingleMysteryBox, fetchSingleProduct, getMysteryBoxesBySeller, getMysteryBoxStats, updateMysteryBox, updateProduct } from '../Controller/productController'

const router = express.Router()

// ✅ Change from .single("image") to .array("images", 5) for multiple images
router.post("/addproduct", authenticate, upload.array("images", 5), addProduct)

// ✅ Change from .single("productImg") to .array("images", 5) for update
router.post("/updateproducts", authenticate, upload.array("images", 5), updateProduct)

// Other routes remain the same
router.get("/fetchproducts", authenticate, fetchProducts)
router.get("/fetchproducts/:seller_id", fetchProducts)
router.delete("/deleteproduct", authenticate, deleteProduct)
router.get("/fetchallproducts", fetchAllProducts)
router.get("/fetchsingleproduct/:productId", fetchSingleProduct)

// Add new mystery box
router.post("/add-mystery-box", authenticate, addMysteryBox)

// Get seller's mystery boxes (with product details)
router.get("/seller-mystery-boxes", authenticate, fetchSellerMysteryBoxes)

// Get mystery box statistics for dashboard
router.get("/mystery-box-stats", authenticate, getMysteryBoxStats)

// Update mystery box
router.put("/update-mystery-box", authenticate, updateMysteryBox)

// Delete mystery box
router.delete("/delete-mystery-box", authenticate, deleteMysteryBox)

// Public routes (no authentication required)
// Get all active mystery boxes (for customers)
router.get("/mystery-boxes", fetchMysteryBoxes)

// Get single mystery box
// Note: This route will show different data based on whether user is authenticated as seller
router.get("/mystery-box/:id", fetchSingleMysteryBox)

router.get('/seller/:sellerId', getMysteryBoxesBySeller);


export default router