import { create } from 'zustand'
import api from '@/app/libs/api'

interface Review {
    reviewId: number;
    rating: number;
    message: string;
    createdAt: string;
    customer: {
        id: number;
        name: string;
        email: string;
    };
    seller: {
        seller_id: number;
        businessName: string;
        businessEmail: string;
    };
    product: {
        product_id: number;
        productName: string;
    };
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELETED';
    reportedCount?: number;
    abuseScore?: number;
}

interface Report {
    reportId: number;
    reviewId: number;
    reportType: string;
    reason: string;
    reporterId?: number;
    reportedAt: string;
    status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}

interface AbuseReview {
    reviewId: number;
    message: string;
    rating: number;
    createdAt: string;
    customer: {
        id: number;
        name: string;
        email: string;
    };
    abuseType: string;
    confidenceScore: number;
    detectedAt: string;
}

interface ModerationAnalytics {
    totalReviews: number;
    reviewsByDay: Array<{ date: string; count: number }>;
    ratingDistribution: Array<{ rating: number; _count: { reviewId: number } }>;
    abuseDetected: number;
    abuseRate: string;
    avgResponseTime: string;
    approvalRate: string;
}

interface ReviewStore {
    // Data
    reviews: Review[];
    reportedReviews: Report[];
    abuseReviews: AbuseReview[];
    analytics: ModerationAnalytics | null;
    selectedReview: Review | null;
    
    // State
    loading: boolean;
    error: string | null;
    success: boolean;

    // Fetch functions
    getAllReviews: () => Promise<void>;
    getReviewDetails: (reviewId: number) => Promise<Review>;
    getReportedReviews: () => Promise<void>;
    getAbuseReviews: () => Promise<void>;
    getModerationAnalytics: (timeframe?: string) => Promise<void>;

    // Action functions
    approveReview: (reviewId: number, reason?: string, notes?: string, notifyUser?: boolean) => Promise<void>;
    rejectReview: (reviewId: number, reason: string, notes?: string, notifyUser?: boolean) => Promise<void>;
    deleteReview: (reviewId: number, reason: string, notes?: string, notifyUser?: boolean, banUser?: boolean) => Promise<void>;
    reportReview: (reviewId: number, reportType: string, reason: string, reporterId?: number) => Promise<void>;
    bulkReviewActions: (reviewIds: number[], action: 'APPROVE' | 'REJECT' | 'DELETE', reason?: string, notes?: string, notifyUsers?: boolean) => Promise<void>;
    warnUser: (userId: number, warningType: string, message: string, notifyUser?: boolean, suspendUser?: boolean) => Promise<void>;

    // Helper functions
    setSelectedReview: (review: Review | null) => void;
    clearError: () => void;
    clearSuccess: () => void;
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
    // Initial state
    reviews: [],
    reportedReviews: [],
    abuseReviews: [],
    analytics: null,
    selectedReview: null,
    loading: false,
    error: null,
    success: false,

    // Fetch all reviews
    getAllReviews: async () => {
        try {
            set({ loading: true, error: null });

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("No token provided");
            }

            const res = await api.get("/api/adminreview/getallreviews", {
                headers: { Authorization: `Bearer ${token}` }
            });

            set({ 
                reviews: res.data.reviews, 
                loading: false 
            });
        } catch (err: any) {
            set({ 
                error: err?.response?.data?.message || err?.message || "Failed to fetch reviews",
                loading: false 
            });
        }
    },

    // Get review details
    getReviewDetails: async (reviewId: number) => {
        try {
            set({ loading: true, error: null });

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("No token provided");
            }

            const res = await api.get(`/api/adminreview/${reviewId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            set({ loading: false });
            return res.data.review;
        } catch (err: any) {
            set({ 
                error: err?.response?.data?.message || err?.message || "Failed to fetch review details",
                loading: false 
            });
            throw err;
        }
    },

    // Get reported reviews
    getReportedReviews: async () => {
        try {
            set({ loading: true, error: null });

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("No token provided");
            }

            const res = await api.get("/api/adminreview/reported", {
                headers: { Authorization: `Bearer ${token}` }
            });

            set({ 
                reportedReviews: res.data.reports, 
                loading: false 
            });
        } catch (err: any) {
            set({ 
                error: err?.response?.data?.message || err?.message || "Failed to fetch reported reviews",
                loading: false 
            });
        }
    },

    // Get abuse reviews
    getAbuseReviews: async () => {
        try {
            set({ loading: true, error: null });

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("No token provided");
            }

            const res = await api.get("/api/adminreview/abuse", {
                headers: { Authorization: `Bearer ${token}` }
            });

            set({ 
                abuseReviews: res.data.abuseReviews, 
                loading: false 
            });
        } catch (err: any) {
            set({ 
                error: err?.response?.data?.message || err?.message || "Failed to fetch abuse reviews",
                loading: false 
            });
        }
    },

    // Get moderation analytics
    getModerationAnalytics: async (timeframe = '7days') => {
        try {
            set({ loading: true, error: null });

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("No token provided");
            }

            const res = await api.get(`/api/adminreview/analytics?timeframe=${timeframe}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            set({ 
                analytics: res.data.analytics, 
                loading: false 
            });
        } catch (err: any) {
            set({ 
                error: err?.response?.data?.message || err?.message || "Failed to fetch analytics",
                loading: false 
            });
        }
    },

    // Approve review
    approveReview: async (reviewId, reason, notes, notifyUser = true) => {
        try {
            set({ loading: true, error: null, success: false });

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("No token provided");
            }

            const res = await api.post("/api/adminreview/approve", {
                reviewId,
                reason,
                notes,
                notifyUser
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state
            set((state) => ({
                reviews: state.reviews.map(review => 
                    review.reviewId === reviewId 
                        ? { ...review, status: 'APPROVED' }
                        : review
                ),
                loading: false,
                success: true,
                error: null
            }));

            return res.data;
        } catch (err: any) {
            set({ 
                error: err?.response?.data?.message || err?.message || "Failed to approve review",
                loading: false,
                success: false
            });
            throw err;
        }
    },

    // Reject review
    rejectReview: async (reviewId, reason, notes, notifyUser = true) => {
        try {
            set({ loading: true, error: null, success: false });

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("No token provided");
            }

            const res = await api.post("/api/adminreview/reject", {
                reviewId,
                reason,
                notes,
                notifyUser
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state
            set((state) => ({
                reviews: state.reviews.map(review => 
                    review.reviewId === reviewId 
                        ? { ...review, status: 'REJECTED' }
                        : review
                ),
                loading: false,
                success: true,
                error: null
            }));

            return res.data;
        } catch (err: any) {
            set({ 
                error: err?.response?.data?.message || err?.message || "Failed to reject review",
                loading: false,
                success: false
            });
            throw err;
        }
    },

    // Delete review
    deleteReview: async (reviewId, reason, notes, notifyUser = true, banUser = false) => {
        try {
            set({ loading: true, error: null, success: false });

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("No token provided");
            }

            const res = await api.post("/api/adminreview/delete", {
                reviewId,
                reason,
                notes,
                notifyUser,
                banUser
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Remove from local state
            set((state) => ({
                reviews: state.reviews.filter(review => review.reviewId !== reviewId),
                reportedReviews: state.reportedReviews.filter(report => report.reviewId !== reviewId),
                abuseReviews: state.abuseReviews.filter(review => review.reviewId !== reviewId),
                loading: false,
                success: true,
                error: null
            }));

            return res.data;
        } catch (err: any) {
            set({ 
                error: err?.response?.data?.message || err?.message || "Failed to delete review",
                loading: false,
                success: false
            });
            throw err;
        }
    },

    // Report review (public endpoint - keep as /api/reviews/report for public access)
    reportReview: async (reviewId, reportType, reason, reporterId) => {
        try {
            set({ loading: true, error: null, success: false });

            const res = await api.post("/apireviews/report", {
                reviewId,
                reportType,
                reason,
                reporterId
            });

            set({ 
                loading: false,
                success: true,
                error: null
            });

            return res.data;
        } catch (err: any) {
            set({ 
                error: err?.response?.data?.message || err?.message || "Failed to report review",
                loading: false,
                success: false
            });
            throw err;
        }
    },

    // Bulk review actions
    bulkReviewActions: async (reviewIds, action, reason, notes, notifyUsers = true) => {
        try {
            set({ loading: true, error: null, success: false });

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("No token provided");
            }

            const res = await api.post("/api/adminreview/bulk-actions", {
                reviewIds,
                action,
                reason,
                notes,
                notifyUsers
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state based on action
            if (action === 'DELETE') {
                set((state) => ({
                    reviews: state.reviews.filter(review => !reviewIds.includes(review.reviewId)),
                    loading: false,
                    success: true,
                    error: null
                }));
            } else {
                set((state) => ({
                    reviews: state.reviews.map(review => 
                        reviewIds.includes(review.reviewId) 
                            ? { ...review, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
                            : review
                    ),
                    loading: false,
                    success: true,
                    error: null
                }));
            }

            return res.data;
        } catch (err: any) {
            set({ 
                error: err?.response?.data?.message || err?.message || "Failed to perform bulk actions",
                loading: false,
                success: false
            });
            throw err;
        }
    },

    // Warn user
    warnUser: async (userId, warningType, message, notifyUser = true, suspendUser = false) => {
        try {
            set({ loading: true, error: null, success: false });

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("No token provided");
            }

            const res = await api.post("/api/adminreview/warn-user", {
                userId,
                warningType,
                message,
                notifyUser,
                suspendUser
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            set({ 
                loading: false,
                success: true,
                error: null
            });

            return res.data;
        } catch (err: any) {
            set({ 
                error: err?.response?.data?.message || err?.message || "Failed to warn user",
                loading: false,
                success: false
            });
            throw err;
        }
    },

    // Helper functions
    setSelectedReview: (review) => {
        set({ selectedReview: review });
    },

    clearError: () => {
        set({ error: null });
    },

    clearSuccess: () => {
        set({ success: false });
    }
}));