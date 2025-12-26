import express from 'express'
import authenticate from '../../Middleware/authMiddleware'
import { 
    getAllReviews,
    getReviewDetails,
    approveReview,
    rejectReview,
    deleteReview,
    reportReview,
    getReportedReviews,
    getAbuseReviews,
    getModerationAnalytics,
    bulkReviewActions,
    warnUser
} from '../../Controller/AdminController/adminReviewController'

const router = express.Router()

// Get reviews for moderation
router.get("/getallreviews", authenticate, getAllReviews)
router.get("/review/:reviewId", authenticate, getReviewDetails)

// Single review actions
router.post("/approve", authenticate, approveReview)
router.post("/reject", authenticate, rejectReview)
router.post("/delete", authenticate, deleteReview)

// Reports and abuse
router.post("/report", reportReview) // Public endpoint for users to report
router.get("/reported", authenticate, getReportedReviews)
router.get("/abuse", authenticate, getAbuseReviews)

// Analytics
router.get("/analytics", authenticate, getModerationAnalytics)

// Bulk actions
router.post("/bulk-actions", authenticate, bulkReviewActions)

// User warnings
router.post("/warn-user", authenticate, warnUser)

export default router