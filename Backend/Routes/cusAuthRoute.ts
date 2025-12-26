import express from 'express'
import authMiddleware from '../Middleware/authMiddleware'
import {upload} from '../Middleware/uploadMiddleware'
import { customerRegister,customerLogin,updateCusProfile, getCusDetail } from '../Controller/cusAuthController'

const router  = express.Router()

router.post("/customerregister",customerRegister)
router.post("/customerlogin",customerLogin)
router.post("/updateprofile",authMiddleware,upload.single("cusProfileImg"),updateCusProfile)
router.get("/getcustomerprofile",authMiddleware,getCusDetail)

export default router