import express from 'express'
import authenticate from '../Middleware/authMiddleware'
import { getReviews, postReview } from '../Controller/reviewController'

const router = express.Router()

router.post("/postreview/:productId",authenticate,postReview)
router.get("/getreviews/:productId",getReviews)

export default router
