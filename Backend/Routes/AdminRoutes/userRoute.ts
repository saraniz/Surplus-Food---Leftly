import express from 'express'
import authenticate from '../../Middleware/authMiddleware'
import { 
  getAllCustomers, 
  getAllSellers,
  getCustomerDetails,
  getSellerDetails,
  suspendUser,
  activateUser,
  deleteUser,
  verifySeller,
  getUserAnalytics,
  sendWarning
} from '../../Controller/AdminController/userController'

const router = express.Router()

router.get("/getallcustomers", authenticate, getAllCustomers)
router.get("/getallsellers", getAllSellers)
router.get("/customer/:customerId", authenticate, getCustomerDetails)
router.get("/seller/:sellerId", authenticate, getSellerDetails)
router.get("/analytics", authenticate, getUserAnalytics)

router.post("/suspend", authenticate, suspendUser)
router.post("/activate", authenticate, activateUser)
router.post("/delete", authenticate, deleteUser)
router.post("/verify-seller", authenticate, verifySeller)
router.post("/warning", authenticate, sendWarning)

export default router