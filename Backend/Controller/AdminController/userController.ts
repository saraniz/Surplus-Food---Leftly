import express from 'express'
import prisma from '../../lib/prisma'
import { Request,Response } from 'express'

// Helper function to calculate total spent for a customer
const calculateCustomerTotalSpent = async (customerId: number): Promise<number> => {
  const orders = await prisma.order.findMany({
    where: { 
      customerId: customerId,
      paymentStatus: 'PAID' // Only count paid orders
    },
    select: {
      totalAmount: true,
      deliveryFee: true
    }
  });

  return orders.reduce((total, order) => total + order.totalAmount + order.deliveryFee, 0);
};

// Helper function to calculate total orders for a customer
const calculateCustomerTotalOrders = async (customerId: number): Promise<number> => {
  return await prisma.order.count({
    where: { customerId: customerId }
  });
};

// Helper function to get customer's last activity
const getCustomerLastActivity = async (customerId: number): Promise<Date | null> => {
  const lastOrder = await prisma.order.findFirst({
    where: { customerId: customerId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true }
  });

  return lastOrder?.createdAt || null;
};

//get all customers with statistics
export const getAllCustomers = async (req:Request,res:Response) => {
    try{
        const admin = req.user

        if (!admin){
            return res.status(401).json({message:"Unauthorized access"})
        }

        const allcustomers = await prisma.customer.findMany({
            select:{
                id:true,
                name:true,
                email:true,
                mobileNumber: true,
                location: true,
                city: true,
                cusProfileImg: true,
                createdAt:true,
            },
            orderBy: { createdAt: 'desc' }
        });

        // Enrich customer data with statistics
        const customersWithStats = await Promise.all(
            allcustomers.map(async (customer) => {
                const totalOrders = await calculateCustomerTotalOrders(customer.id);
                const totalSpent = await calculateCustomerTotalSpent(customer.id);
                const lastActivity = await getCustomerLastActivity(customer.id);
                
                return {
                    ...customer,
                    totalOrders,
                    totalSpent,
                    lastActive: lastActivity,
                    status: 'ACTIVE' // Default status, you can add a status field to Customer model if needed
                };
            })
        );

        return res.status(200).json({
            allcustomers: customersWithStats,
            totalCustomers: customersWithStats.length,
            activeCustomers: customersWithStats.length, // Modify based on actual status
            newThisMonth: customersWithStats.filter(customer => {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return new Date(customer.createdAt) > monthAgo;
            }).length,
            message:"Customers fetched successfully"
        })
    } catch(error: any){
        console.error("Get all customers error:", error);
        return res.status(500).json({message:"Server error", error: error.message})
    }
}

//get all sellers with statistics
export const getAllSellers = async (req:Request,res:Response) => {
    try{
        

        const allsellers = await prisma.seller.findMany({
            select:{
                seller_id:true,
                businessName:true,
                businessEmail:true,
                businessAddress:true,
                phoneNum: true,
                category: true,
                openingHours: true,
                deliveryRadius: true,
                website: true,
                storeDescription: true,
                storeImg: true,
                coverImg: true,
                createdAt:true,
            },
            orderBy: { createdAt: 'desc' }
        });


        // Enrich seller data with statistics
        const sellersWithStats = await Promise.all(
            allsellers.map(async (seller) => {
                const totalProducts = await prisma.product.count({
                    where: { sellerId: seller.seller_id }
                });

                const totalSales = await prisma.orderItem.aggregate({
                    where: { sellerId: seller.seller_id },
                    _sum: { quantity: true }
                });

                // Calculate average rating
                const reviews = await prisma.review.findMany({
                    where: { sellerId: seller.seller_id },
                    select: { rating: true }
                });

                const avgRating = reviews.length > 0 
                    ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
                    : 0;

                // Get total revenue
                const revenueData = await prisma.orderItem.aggregate({
                    where: { sellerId: seller.seller_id },
                    _sum: { totalPrice: true }
                });

                return {
                    ...seller,
                    totalProducts,
                    totalSales: totalSales._sum.quantity || 0,
                    rating: parseFloat(avgRating.toFixed(1)),
                    totalRevenue: revenueData._sum.totalPrice || 0,
                    status: 'ACTIVE', // Default status
                    verificationStatus: 'PENDING' // You can add verification status to Seller model
                };
            })
        );

        return res.status(200).json({
            allsellers: sellersWithStats,
            totalSellers: sellersWithStats.length,
            verifiedSellers: sellersWithStats.filter(s => s.verificationStatus === 'VERIFIED').length,
            pendingSellers: sellersWithStats.filter(s => s.verificationStatus === 'PENDING').length,
            message:"Sellers fetched successfully"
        })
    } catch(error: any){
        console.error("Get all sellers error:", error);
        return res.status(500).json({message:"Server error", error: error.message})
    }
}

// Get customer details with full statistics
export const getCustomerDetails = async (req:Request, res:Response) => {
    try {
        const admin = req.user;
        const { customerId } = req.params;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        if (!customerId) {
            return res.status(400).json({message:"Customer ID is required"});
        }

        const customer = await prisma.customer.findUnique({
            where: { id: parseInt(customerId) },
            select: {
                id: true,
                name: true,
                email: true,
                mobileNumber: true,
                location: true,
                city: true,
                zipCode: true,
                cusProfileImg: true,
                latitude: true,
                longitude: true,
                createdAt: true,
            }
        });

        if (!customer) {
            return res.status(404).json({message:"Customer not found"});
        }

        // Get customer statistics
        const totalOrders = await prisma.order.count({
            where: { customerId: parseInt(customerId) }
        });

        const orders = await prisma.order.findMany({
            where: { customerId: parseInt(customerId) },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10 // Last 10 orders
        });

        const totalSpent = orders.reduce((total, order) => 
            total + order.totalAmount + order.deliveryFee, 0
        );

        const recentActivity = await prisma.order.findFirst({
            where: { customerId: parseInt(customerId) },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        });

        // Get order status distribution
        const orderStatusCount = await prisma.order.groupBy({
            by: ['orderStatus'],
            where: { customerId: parseInt(customerId) },
            _count: { order_id: true }
        });

        return res.status(200).json({
            customer: {
                ...customer,
                totalOrders,
                totalSpent,
                lastActive: recentActivity?.createdAt || customer.createdAt,
                orderStatusDistribution: orderStatusCount,
                recentOrders: orders
            },
            message: "Customer details fetched successfully"
        });
    } catch (error: any) {
        console.error("Get customer details error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Get seller details with full statistics
export const getSellerDetails = async (req:Request, res:Response) => {
    try {
        const admin = req.user;
        const { sellerId } = req.params;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        if (!sellerId) {
            return res.status(400).json({message:"Seller ID is required"});
        }

        const seller = await prisma.seller.findUnique({
            where: { seller_id: parseInt(sellerId) },
            select: {
                seller_id: true,
                businessName: true,
                businessEmail: true,
                businessAddress: true,
                phoneNum: true,
                category: true,
                openingHours: true,
                deliveryRadius: true,
                website: true,
                storeDescription: true,
                storeImg: true,
                coverImg: true,
                latitude: true,
                longitude: true,
                createdAt: true,
            }
        });

        if (!seller) {
            return res.status(404).json({message:"Seller not found"});
        }

        // Get seller statistics
        const totalProducts = await prisma.product.count({
            where: { sellerId: parseInt(sellerId) }
        });

        const totalOrders = await prisma.orderItem.count({
            where: { sellerId: parseInt(sellerId) }
        });

        const revenueData = await prisma.orderItem.aggregate({
            where: { sellerId: parseInt(sellerId) },
            _sum: { totalPrice: true }
        });

        const totalRevenue = revenueData._sum.totalPrice || 0;

        const reviews = await prisma.review.findMany({
            where: { sellerId: parseInt(sellerId) },
            select: { rating: true, message: true, createdAt: true, customer: true }
        });

        const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
            : 0;

        // Get recent orders
        const recentOrders = await prisma.orderItem.findMany({
            where: { sellerId: parseInt(sellerId) },
            include: {
                order: {
                    include: { customer: true }
                },
                product: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Get product performance
        const topProducts = await prisma.product.findMany({
            where: { sellerId: parseInt(sellerId) },
            orderBy: { sales: 'desc' },
            take: 5,
            select: {
                product_id: true,
                productName: true,
                price: true,
                sales: true
            }
        });

        return res.status(200).json({
            seller: {
                ...seller,
                totalProducts,
                totalOrders,
                totalRevenue,
                avgRating: parseFloat(avgRating.toFixed(1)),
                totalReviews: reviews.length,
                reviews: reviews.slice(0, 5), // Last 5 reviews
                recentOrders,
                topProducts
            },
            message: "Seller details fetched successfully"
        });
    } catch (error: any) {
        console.error("Get seller details error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Suspend user (customer or seller)
export const suspendUser = async (req:Request, res:Response) => {
    try {
        const admin = req.user;
        const { userId, userType, reason, duration, notes } = req.body;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        if (!userId || !userType || !reason) {
            return res.status(400).json({
                message: "User ID, user type, and reason are required"
            });
        }

        // You can create a Suspension model in your Prisma schema to track suspensions
        // For now, we'll just return a success message
        // In production, you would:
        // 1. Create a Suspension record
        // 2. Update user status
        // 3. Log the action

        const suspensionRecord = {
            userId: parseInt(userId),
            userType, // 'CUSTOMER' or 'SELLER'
            reason,
            duration: duration || 'PERMANENT',
            notes: notes || '',
            suspendedBy: admin.id,
            suspendedAt: new Date(),
            expiresAt: duration === 'PERMANENT' ? null : new Date(Date.now() + getDurationInMs(duration))
        };

        // Here you would save to your Suspension table
        // await prisma.suspension.create({ data: suspensionRecord });

        return res.status(200).json({
            message: `User ${userType.toLowerCase()} suspended successfully`,
            suspension: suspensionRecord
        });
    } catch (error: any) {
        console.error("Suspend user error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Activate/Reactivate user
export const activateUser = async (req:Request, res:Response) => {
    try {
        const admin = req.user;
        const { userId, userType, notes } = req.body;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        if (!userId || !userType) {
            return res.status(400).json({
                message: "User ID and user type are required"
            });
        }

        // In production, you would:
        // 1. Update suspension record to mark as lifted
        // 2. Update user status to ACTIVE
        // 3. Log the action

        return res.status(200).json({
            message: `User ${userType.toLowerCase()} activated successfully`,
            activatedAt: new Date(),
            activatedBy: admin.id,
            notes: notes || ''
        });
    } catch (error: any) {
        console.error("Activate user error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Delete user (soft delete or hard delete)
export const deleteUser = async (req:Request, res:Response) => {
    try {
        const admin = req.user;
        const { userId, userType, reason, hardDelete = false } = req.body;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        if (!userId || !userType || !reason) {
            return res.status(400).json({
                message: "User ID, user type, and reason are required"
            });
        }

        if (userType === 'CUSTOMER') {
            if (hardDelete) {
                // Hard delete - only if user has no orders
                const orderCount = await prisma.order.count({
                    where: { customerId: parseInt(userId) }
                });

                if (orderCount > 0) {
                    return res.status(400).json({
                        message: "Cannot delete customer with existing orders. Consider suspension instead."
                    });
                }

                await prisma.customer.delete({
                    where: { id: parseInt(userId) }
                });
            } else {
                // Soft delete - mark as deleted
                // You would update a 'deletedAt' field if you add it to your schema
                return res.status(200).json({
                    message: "Customer marked as deleted (soft delete)",
                    deletedAt: new Date()
                });
            }
        } else if (userType === 'SELLER') {
            if (hardDelete) {
                // Hard delete - only if seller has no products or orders
                const productCount = await prisma.product.count({
                    where: { sellerId: parseInt(userId) }
                });

                const orderCount = await prisma.orderItem.count({
                    where: { sellerId: parseInt(userId) }
                });

                if (productCount > 0 || orderCount > 0) {
                    return res.status(400).json({
                        message: "Cannot delete seller with existing products or orders. Consider suspension instead."
                    });
                }

                await prisma.seller.delete({
                    where: { seller_id: parseInt(userId) }
                });
            } else {
                // Soft delete
                return res.status(200).json({
                    message: "Seller marked as deleted (soft delete)",
                    deletedAt: new Date()
                });
            }
        } else {
            return res.status(400).json({message: "Invalid user type"});
        }

        return res.status(200).json({
            message: `User ${userType.toLowerCase()} deleted successfully`,
            deletedAt: new Date(),
            deletedBy: admin.id,
            reason: reason
        });
    } catch (error: any) {
        console.error("Delete user error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Verify seller
export const verifySeller = async (req:Request, res:Response) => {
    try {
        const admin = req.user;
        const { sellerId, status, notes } = req.body;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        if (!sellerId || !status) {
            return res.status(400).json({
                message: "Seller ID and verification status are required"
            });
        }

        // Check if seller exists
        const seller = await prisma.seller.findUnique({
            where: { seller_id: parseInt(sellerId) }
        });

        if (!seller) {
            return res.status(404).json({message: "Seller not found"});
        }

        // In production, you would update a verificationStatus field in Seller model
        // For now, we'll return a success message
        // await prisma.seller.update({
        //     where: { seller_id: parseInt(sellerId) },
        //     data: { verificationStatus: status }
        // });

        const verificationRecord = {
            sellerId: parseInt(sellerId),
            status, // 'APPROVED', 'REJECTED', 'PENDING'
            notes: notes || '',
            verifiedBy: admin.id,
            verifiedAt: new Date()
        };

        return res.status(200).json({
            message: `Seller verification status updated to ${status}`,
            verification: verificationRecord
        });
    } catch (error: any) {
        console.error("Verify seller error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Get user analytics dashboard
export const getUserAnalytics = async (req:Request, res:Response) => {
    try {
        const admin = req.user;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        // Get total counts
        const totalCustomers = await prisma.customer.count();
        const totalSellers = await prisma.seller.count();

        // Get new users this month
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const newCustomers = await prisma.customer.count({
            where: { createdAt: { gte: monthAgo } }
        });

        const newSellers = await prisma.seller.count({
            where: { createdAt: { gte: monthAgo } }
        });

        // Get active users (users with orders in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeCustomers = await prisma.order.groupBy({
            by: ['customerId'],
            where: { createdAt: { gte: thirtyDaysAgo } },
            having: {
                customerId: {
                    _count: { gt: 0 }
                }
            }
        }).then(results => results.length);

        const activeSellers = await prisma.orderItem.groupBy({
            by: ['sellerId'],
            where: { createdAt: { gte: thirtyDaysAgo } },
            having: {
                sellerId: {
                    _count: { gt: 0 }
                }
            }
        }).then(results => results.length);

        // Get revenue statistics
        const revenueData = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { 
                createdAt: { gte: thirtyDaysAgo },
                paymentStatus: 'PAID'
            }
        });

        // Get user growth data for chart
        const customerGrowth = await getGrowthData('customer');
        const sellerGrowth = await getGrowthData('seller');

        return res.status(200).json({
            analytics: {
                totalCustomers,
                totalSellers,
                newCustomers,
                newSellers,
                activeCustomers,
                activeSellers,
                monthlyRevenue: revenueData._sum.totalAmount || 0,
                customerGrowth,
                sellerGrowth
            },
            message: "User analytics fetched successfully"
        });
    } catch (error: any) {
        console.error("Get user analytics error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}

// Helper function to get growth data
async function getGrowthData(userType: 'customer' | 'seller') {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (userType === 'customer') {
        return await prisma.customer.groupBy({
            by: ['createdAt'],
            where: { createdAt: { gte: sixMonthsAgo } },
            _count: { id: true },
            orderBy: { createdAt: 'asc' }
        });
    } else {
        return await prisma.seller.groupBy({
            by: ['createdAt'],
            where: { createdAt: { gte: sixMonthsAgo } },
            _count: { seller_id: true },
            orderBy: { createdAt: 'asc' }
        });
    }
}

// Helper function to convert duration string to milliseconds
function getDurationInMs(duration: string): number {
    switch (duration) {
        case '7days':
            return 7 * 24 * 60 * 60 * 1000;
        case '30days':
            return 30 * 24 * 60 * 60 * 1000;
        case '90days':
            return 90 * 24 * 60 * 60 * 1000;
        default:
            return 0; // permanent
    }
}

// Send warning/notification to user
export const sendWarning = async (req:Request, res:Response) => {
    try {
        const admin = req.user;
        const { userId, userType, warningType, message, sendEmail = true } = req.body;

        if (!admin) {
            return res.status(401).json({message:"Unauthorized access"});
        }

        if (!userId || !userType || !warningType || !message) {
            return res.status(400).json({
                message: "User ID, user type, warning type, and message are required"
            });
        }

        const warningRecord = {
            userId: parseInt(userId),
            userType,
            warningType,
            message,
            sentBy: admin.id,
            sentAt: new Date(),
            sendEmail,
            status: 'SENT'
        };

        // Here you would:
        // 1. Save warning to database
        // 2. Send email notification if sendEmail is true
        // 3. Possibly send in-app notification

        return res.status(200).json({
            message: "Warning sent successfully",
            warning: warningRecord
        });
    } catch (error: any) {
        console.error("Send warning error:", error);
        return res.status(500).json({message:"Server error", error: error.message});
    }
}