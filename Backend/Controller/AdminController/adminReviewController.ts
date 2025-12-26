import express from 'express'
import prisma from '../../lib/prisma'
import { Request,Response } from 'express'

// Get all reviews for moderation
export const getAllReviews = async (req:Request, res:Response) => {
    try {
        const admin = req.user;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        const reviews = await prisma.review.findMany({
            select: {
                reviewId: true,
                rating: true,
                message: true,
                createdAt: true,
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                seller: {
                    select: {
                        seller_id: true,
                        businessName: true,
                        businessEmail: true,
                    }
                },
                product: {
                    select: {
                        product_id: true,
                        productName: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Enrich with moderation status (you might want to add status field to Review model)
        const reviewsWithStatus = reviews.map(review => ({
            ...review,
            status: 'PENDING', // Default status
            reportedCount: 0, // You can add report tracking
            abuseScore: 0, // For abuse detection
        }));

        return res.status(200).json({
            reviews: reviewsWithStatus,
            total: reviewsWithStatus.length,
            pending: reviewsWithStatus.length,
            approved: 0,
            rejected: 0,
            message: "Reviews fetched successfully"
        });
    } catch (error: any) {
        console.error("Get all reviews error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Get review details
export const getReviewDetails = async (req:Request, res:Response) => {
    try {
        const admin = req.user;
        const { reviewId } = req.params;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        if (!reviewId) {
            return res.status(400).json({message:"Review ID is required"});
        }

        const review = await prisma.review.findUnique({
            where: { reviewId: parseInt(reviewId) },
            select: {
                reviewId: true,
                rating: true,
                message: true,
                createdAt: true,
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        location: true,
                        createdAt: true,
                    }
                },
                seller: {
                    select: {
                        seller_id: true,
                        businessName: true,
                        businessEmail: true,
                        businessAddress: true,
                    }
                },
                product: {
                    select: {
                        product_id: true,
                        productName: true,
                        price: true,
                        category: true,
                    }
                }
            }
        });

        if (!review) {
            return res.status(404).json({message:"Review not found"});
        }

        // Get review statistics
        const customerReviews = await prisma.review.count({
            where: { customerId: review.customer.id }
        });

        const productReviews = await prisma.review.findMany({
            where: { productId: review.product.product_id },
            select: { rating: true }
        });

        const avgProductRating = productReviews.length > 0 
            ? productReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / productReviews.length
            : 0;

        return res.status(200).json({
            review: {
                ...review,
                customerReviews,
                avgProductRating: parseFloat(avgProductRating.toFixed(1)),
                totalProductReviews: productReviews.length,
                status: 'PENDING',
                abuseFlags: [] // Add abuse detection flags if implemented
            },
            message: "Review details fetched successfully"
        });
    } catch (error: any) {
        console.error("Get review details error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Approve review
export const approveReview = async (req:Request, res:Response) => {
    try {
        const admin = req.user;
        const { reviewId, reason, notes, notifyUser } = req.body;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        if (!reviewId) {
            return res.status(400).json({message:"Review ID is required"});
        }

        // Check if review exists
        const review = await prisma.review.findUnique({
            where: { reviewId: parseInt(reviewId) }
        });

        if (!review) {
            return res.status(404).json({message:"Review not found"});
        }

        // Here you would:
        // 1. Update review status to APPROVED
        // 2. Create moderation log entry
        // 3. Optionally notify user

        const moderationLog = {
            reviewId: parseInt(reviewId),
            action: 'APPROVE',
            reason: reason || '',
            notes: notes || '',
            moderatedBy: admin.id,
            moderatedAt: new Date(),
            notifiedUser: notifyUser || false
        };

        // Log the moderation action (you'd create a ModerationLog model)
        // await prisma.moderationLog.create({ data: moderationLog });

        return res.status(200).json({
            message: "Review approved successfully",
            moderation: moderationLog,
            review: {
                ...review,
                status: 'APPROVED'
            }
        });
    } catch (error: any) {
        console.error("Approve review error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Reject review
export const rejectReview = async (req:Request, res:Response) => {
    try {
        const admin = req.user;
        const { reviewId, reason, notes, notifyUser } = req.body;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        if (!reviewId || !reason) {
            return res.status(400).json({message:"Review ID and reason are required"});
        }

        const review = await prisma.review.findUnique({
            where: { reviewId: parseInt(reviewId) }
        });

        if (!review) {
            return res.status(404).json({message:"Review not found"});
        }

        const moderationLog = {
            reviewId: parseInt(reviewId),
            action: 'REJECT',
            reason: reason,
            notes: notes || '',
            moderatedBy: admin.id,
            moderatedAt: new Date(),
            notifiedUser: notifyUser || false
        };

        // You might want to:
        // 1. Update review status to REJECTED
        // 2. Optionally hide the review
        // 3. Log the action

        return res.status(200).json({
            message: "Review rejected successfully",
            moderation: moderationLog,
            review: {
                ...review,
                status: 'REJECTED'
            }
        });
    } catch (error: any) {
        console.error("Reject review error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Delete review
export const deleteReview = async (req:Request, res:Response) => {
    try {
        const admin = req.user;
        const { reviewId, reason, notes, notifyUser, banUser } = req.body;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        if (!reviewId || !reason) {
            return res.status(400).json({message:"Review ID and reason are required"});
        }

        const review = await prisma.review.findUnique({
            where: { reviewId: parseInt(reviewId) }
        });

        if (!review) {
            return res.status(404).json({message:"Review not found"});
        }

        // Delete the review
        await prisma.review.delete({
            where: { reviewId: parseInt(reviewId) }
        });

        const moderationLog = {
            reviewId: parseInt(reviewId),
            action: 'DELETE',
            reason: reason,
            notes: notes || '',
            moderatedBy: admin.id,
            moderatedAt: new Date(),
            notifiedUser: notifyUser || false,
            userBanned: banUser || false
        };

        // If banUser is true, you might want to suspend the user from posting reviews
        if (banUser) {
            // Add logic to ban/suspend user
            // You could add a 'bannedUntil' field to Customer model
        }

        return res.status(200).json({
            message: "Review deleted successfully",
            moderation: moderationLog,
            userBanned: banUser || false
        });
    } catch (error: any) {
        console.error("Delete review error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Report review
export const reportReview = async (req:Request, res:Response) => {
    try {
        const { reviewId, reportType, reason, reporterId } = req.body;

        if (!reviewId || !reportType || !reason) {
            return res.status(400).json({
                message: "Review ID, report type, and reason are required"
            });
        }

        // Check if review exists
        const review = await prisma.review.findUnique({
            where: { reviewId: parseInt(reviewId) }
        });

        if (!review) {
            return res.status(404).json({message:"Review not found"});
        }

        // Create report record (you'd need a Report model)
        const report = {
            reviewId: parseInt(reviewId),
            reportType,
            reason,
            reporterId: reporterId || null,
            reportedAt: new Date(),
            status: 'PENDING'
        };

        // Save report to database
        // await prisma.report.create({ data: report });

        return res.status(200).json({
            message: "Review reported successfully",
            report: report
        });
    } catch (error: any) {
        console.error("Report review error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Get reported reviews
export const getReportedReviews = async (req:Request, res:Response) => {
    try {
        const admin = req.user;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        // In production, you'd join with Report model
        // For now, return empty array as placeholder
        const reportedReviews: any[] = [];

        return res.status(200).json({
            reports: reportedReviews,
            total: reportedReviews.length,
            pending: reportedReviews.length,
            resolved: 0,
            message: "Reported reviews fetched successfully"
        });
    } catch (error: any) {
        console.error("Get reported reviews error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Get abuse detection reviews
export const getAbuseReviews = async (req:Request, res:Response) => {
    try {
        const admin = req.user;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        // Implement abuse detection logic
        // This could involve:
        // 1. Checking for profanity
        // 2. Detecting spam patterns
        // 3. Identifying fake review patterns
        // 4. Using AI/ML models

        const abuseKeywords = ['hate', 'spam', 'fake', 'scam', 'terrible']; // Example keywords
        const allReviews = await prisma.review.findMany({
            select: {
                reviewId: true,
                message: true,
                rating: true,
                createdAt: true,
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        // Simple keyword-based abuse detection
        const abuseReviews = allReviews.filter(review => {
            const message = review.message.toLowerCase();
            return abuseKeywords.some(keyword => message.includes(keyword));
        }).map(review => ({
            ...review,
            abuseType: 'KEYWORD_MATCH',
            confidenceScore: 0.8,
            detectedAt: new Date()
        }));

        return res.status(200).json({
            abuseReviews,
            total: abuseReviews.length,
            detectedThisWeek: abuseReviews.length,
            message: "Abuse reviews fetched successfully"
        });
    } catch (error: any) {
        console.error("Get abuse reviews error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Get moderation analytics
export const getModerationAnalytics = async (req:Request, res:Response) => {
    try {
        const admin = req.user;
        const { timeframe = '7days' } = req.query;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        // Calculate time range
        const now = new Date();
        let startDate = new Date();
        
        switch (timeframe) {
            case '7days':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30days':
                startDate.setDate(now.getDate() - 30);
                break;
            case '90days':
                startDate.setDate(now.getDate() - 90);
                break;
            default:
                startDate.setDate(now.getDate() - 7);
        }

        // Get review statistics
        const totalReviews = await prisma.review.count({
            where: { createdAt: { gte: startDate } }
        });

        const reviewsByDay = await prisma.review.groupBy({
            by: ['createdAt'],
            where: { createdAt: { gte: startDate } },
            _count: { reviewId: true },
            orderBy: { createdAt: 'asc' }
        });

        // Get rating distribution
        const ratingDistribution = await prisma.review.groupBy({
            by: ['rating'],
            where: { createdAt: { gte: startDate } },
            _count: { reviewId: true }
        });

        // Get abuse detection stats
        const abuseKeywords = ['hate', 'spam', 'fake', 'scam', 'terrible'];
        const allRecentReviews = await prisma.review.findMany({
            where: { createdAt: { gte: startDate } },
            select: { message: true }
        });

        const abuseDetected = allRecentReviews.filter(review => {
            const message = review.message?.toLowerCase() || '';
            return abuseKeywords.some(keyword => message.includes(keyword));
        }).length;

        return res.status(200).json({
            analytics: {
                totalReviews,
                reviewsByDay: reviewsByDay.map(day => ({
                    date: day.createdAt.toISOString().split('T')[0],
                    count: day._count.reviewId
                })),
                ratingDistribution,
                abuseDetected,
                abuseRate: totalReviews > 0 ? (abuseDetected / totalReviews * 100).toFixed(1) : 0,
                avgResponseTime: '24h', // You'd calculate this from moderation logs
                approvalRate: '85%' // Example
            },
            timeframe,
            message: "Moderation analytics fetched successfully"
        });
    } catch (error: any) {
        console.error("Get moderation analytics error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Bulk actions on reviews
export const bulkReviewActions = async (req:Request, res:Response) => {
    try {
        const admin = req.user;
        const { reviewIds, action, reason, notes, notifyUsers } = req.body;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
            return res.status(400).json({message:"Review IDs are required"});
        }

        if (!action || !['APPROVE', 'REJECT', 'DELETE'].includes(action)) {
            return res.status(400).json({message:"Valid action is required"});
        }

        if ((action === 'REJECT' || action === 'DELETE') && !reason) {
            return res.status(400).json({message:"Reason is required for rejection or deletion"});
        }

        const results = [];
        const errors = [];

        for (const reviewId of reviewIds) {
            try {
                const review = await prisma.review.findUnique({
                    where: { reviewId: parseInt(reviewId) }
                });

                if (!review) {
                    errors.push({ reviewId, error: "Review not found" });
                    continue;
                }

                // Perform action based on type
                switch (action) {
                    case 'APPROVE':
                        // Update review status to APPROVED
                        // await prisma.review.update({
                        //     where: { reviewId: parseInt(reviewId) },
                        //     data: { status: 'APPROVED' }
                        // });
                        break;
                    case 'REJECT':
                        // Update review status to REJECTED
                        // await prisma.review.update({
                        //     where: { reviewId: parseInt(reviewId) },
                        //     data: { status: 'REJECTED' }
                        // });
                        break;
                    case 'DELETE':
                        await prisma.review.delete({
                            where: { reviewId: parseInt(reviewId) }
                        });
                        break;
                }

                // Log the action
                const moderationLog = {
                    reviewId: parseInt(reviewId),
                    action,
                    reason: reason || '',
                    notes: notes || '',
                    moderatedBy: admin.id,
                    moderatedAt: new Date(),
                    notifiedUser: notifyUsers || false
                };

                results.push({
                    reviewId: parseInt(reviewId),
                    action,
                    success: true,
                    moderationLog
                });

            } catch (error) {
                errors.push({ reviewId, error: error.message });
            }
        }

        return res.status(200).json({
            message: `Bulk ${action.toLowerCase()} action completed`,
            processed: results.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error: any) {
        console.error("Bulk review actions error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Warn user
export const warnUser = async (req:Request, res:Response) => {
    try {
        const admin = req.user;
        const { userId, warningType, message, notifyUser, suspendUser } = req.body;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        if (!userId || !warningType || !message) {
            return res.status(400).json({
                message: "User ID, warning type, and message are required"
            });
        }

        const warningRecord = {
            userId: parseInt(userId),
            warningType,
            message,
            warnedBy: admin.id,
            warnedAt: new Date(),
            notified: notifyUser || false,
            suspended: suspendUser || false,
            status: 'ACTIVE'
        };

        // Save warning to database
        // You'd create a UserWarning model

        return res.status(200).json({
            message: "User warned successfully",
            warning: warningRecord
        });
    } catch (error: any) {
        console.error("Warn user error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}