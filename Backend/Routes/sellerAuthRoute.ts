import express from 'express'
import { sellerRegister,sellerLogin, getSellerDetails, updateSellerDetails, getSellerDetailsPublic, getAllSellers, getMySellerDetails } from '../Controller/sellerAuthController'
import { upload } from '../Middleware/uploadMiddleware'
import authenticate from '../Middleware/authMiddleware'

const router = express.Router()

router.post("/sellerregister",sellerRegister)
router.post("/sellerlogin",sellerLogin)
router.get("/getdetails/:id", getSellerDetailsPublic) // Public endpoint
router.get("/protected/details/:id", authenticate, getSellerDetails) // Protected endpoint
router.put("/updatedetails", authenticate, 
  upload.fields([
    { name: "storeImg", maxCount: 1 },
    { name: "coverImg", maxCount: 1 }
  ]), 
  updateSellerDetails
)
// OR if you want to keep it consistent with your naming
router.get("/getallsellers", getAllSellers);
router.get("/get-my-details", authenticate, getMySellerDetails)


export default router