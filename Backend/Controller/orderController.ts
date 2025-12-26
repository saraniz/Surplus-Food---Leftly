import express from "express";
import prisma from "../lib/prisma";
import { Request, Response } from "express";

// Helper function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
};

// In your placeOrder controller, update to handle both regular products and mystery boxes:
export const placeOrder = async (req: Request, res: Response) => {
  try {
    const {
      deliveryAddress,
      deliveryInfo,
      deliveryTime,
      deliveryFee,
      totalPrice,
      paymentMethod,
      items,
      guestEmail,
      guestName,
      guestPhone,
      isGuest = false,
    } = req.body;

    console.log("📦 Received order data:", {
      itemsCount: items?.length,
      items: items,
    });

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    // Generate guest session ID if not provided
    const guestSessionId = isGuest 
      ? req.body.guestSessionId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : null;

    // For guest orders, require guest email and name
    if (isGuest && (!guestEmail || !guestName)) {
      return res.status(400).json({ 
        message: "Guest email and name are required for guest orders" 
      });
    }

    // Convert deliveryTime to string
    const deliveryTimeString = deliveryTime ? deliveryTime.toString() : "45";

    // Run inside a single atomic transaction
    const order = await prisma.$transaction(async (tx) => {
      // Generate order number
      const orderNumber = generateOrderNumber();

      // Create order
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: !isGuest && req.user ? req.user.id : null,
          guestSessionId: isGuest ? guestSessionId : null,
          guestEmail: isGuest ? guestEmail : null,
          guestName: isGuest ? guestName : null,
          guestPhone: isGuest ? guestPhone : null,
          
          totalAmount: parseFloat(totalPrice),
          deliveryFee: parseFloat(deliveryFee),
          deliveryAddress: deliveryAddress,
          deliveryInfo: deliveryInfo || "",
          deliveryTime: deliveryTimeString,
          paymentMethod,
          paymentStatus: "PENDING",
          orderStatus: "PLACED",
        },
      });

      console.log("✅ Order created:", createdOrder.order_id);

      // Process each item
      for (const item of items) {
        console.log("📦 Processing item:", item);
        
        // 🔥 CHECK IF IT'S A MYSTERY BOX (productId >= 100000 or special ID range)
        const isMysteryBox = item.productId >= 100000; // Or whatever range you use for mystery boxes
        
        if (isMysteryBox) {
          // ==============================================
          // PROCESS MYSTERY BOX ORDER
          // ==============================================
          console.log("🎁 Processing mystery box order:", item.productId);
          
          // 1. Find the mystery box
          const mysteryBox = await tx.mysteryBox.findUnique({
            where: { id: item.productId },
          });
          
          if (!mysteryBox) {
            throw new Error(`Mystery Box ${item.productId} not found`);
          }
          
          // 2. Check stock
          if (mysteryBox.stock < item.quantity) {
            throw new Error(`${mysteryBox.name} is out of stock`);
          }
          
          // 3. Create order item for mystery box
          await tx.orderItem.create({
            data: {
              orderId: createdOrder.order_id,
              sellerId: mysteryBox.sellerId, // Use mystery box's seller ID
              productId: item.productId,
              quantity: item.quantity,
              totalPrice: parseFloat((item.price * item.quantity).toFixed(2)),
              itemType: "MYSTERY_BOX", // Add a field to identify mystery box items
            },
          });
          
          // 4. Update mystery box stock and sales
          await tx.mysteryBox.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              sales: { increment: item.quantity },
            },
          });
          
          // 5. Parse productDetails JSON and reduce stock of individual products
          try {
            const productDetails = JSON.parse(mysteryBox.productDetails);
            
            for (const productDetail of productDetails) {
              const product = await tx.product.findUnique({
                where: { product_id: productDetail.productId },
              });
              
              if (product) {
                const quantityToReduce = productDetail.quantity * item.quantity;
                
                if (product.stock < quantityToReduce) {
                  throw new Error(`Insufficient stock for ${product.productName} in mystery box`);
                }
                
                // Reduce stock of individual product
                await tx.product.update({
                  where: { product_id: productDetail.productId },
                  data: {
                    stock: { decrement: quantityToReduce },
                  },
                });
              }
            }
          } catch (parseError) {
            console.error("Error parsing mystery box product details:", parseError);
            // Continue even if parsing fails - mystery box should still be sold
          }
          
          console.log("✅ Mystery box processed:", item.productId);
        } else {
          // ==============================================
          // PROCESS REGULAR PRODUCT ORDER
          // ==============================================
          // 1. Validate stock before updating
          const product = await tx.product.findUnique({
            where: { product_id: item.productId },
          });

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          if (product.stock < item.quantity) {
            throw new Error(
              `${product.productName} is out of stock or insufficient quantity`
            );
          }

          // 2. Insert order item
          await tx.orderItem.create({
            data: {
              orderId: createdOrder.order_id,
              sellerId: item.sellerId,
              productId: item.productId,
              quantity: item.quantity,
              totalPrice: parseFloat((item.price * item.quantity).toFixed(2)),
              itemType: "REGULAR",
            },
          });

          // 3. Update product stock & sales
          await tx.product.update({
            where: { product_id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              sales: { increment: item.quantity },
            },
          });
          
          console.log("✅ Regular product processed:", item.productId);
        }
      }

      return { ...createdOrder, guestSessionId };
    });

    console.log("🎉 Order placed successfully:", order.order_id);

    return res.status(200).json({
      message: "Order placed successfully",
      orderId: order.order_id,
      orderNumber: order.orderNumber,
      guestSessionId: order.guestSessionId,
    });
  } catch (error: any) {
    console.error("❌ Order placement error:", error);
    return res.status(500).json({ 
      message: error.message || "Server error in placing order",
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const user = await prisma.customer.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found.Please logged again" });
    }

    const orders = await prisma.order.findMany({
      where: { customerId: userId },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: {
                  take: 1, // Get first image
                  select: {
                    imageUrl: true
                  }
                }
              }
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("Orders: ", orders);

    // Format the response
    const formattedOrders = orders.map(order => ({
      order_id: order.order_id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      deliveryFee: order.deliveryFee,
      deliveryAddress: order.deliveryAddress,
      deliveryInfo: order.deliveryInfo,
      deliveryTime: order.deliveryTime,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        product: {
          product_id: item.product.product_id,
          productName: item.product.productName,
          price: item.product.price,
          imageUrl: item.product.images[0]?.imageUrl || null,
          sellerId: item.product.sellerId,
        },
        sellerId: item.sellerId,
      })),
    }));

    return res.status(200).json({ 
      message: "Orders found.", 
      orders: formattedOrders 
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getSellerOrders = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user.seller_id;

    const seller = await prisma.seller.findUnique({
      where: { seller_id: sellerId },
    });

    if (!seller) {
      return res.status(401).json({ message: "Seller not found" });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get orders with order items for this seller
    const orders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            sellerId: sellerId,
          },
        },
      },
      include: {
        orderItems: {
          where: {
            sellerId: sellerId,
          },
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  select: {
                    imageUrl: true
                  }
                }
              }
            },
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
            location: true,
            mobileNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // Transform to include guest orders
    const formattedOrders = orders.map(order => ({
      id: order.order_id,
      orderNumber: order.orderNumber,
      customer: order.customerId ? {
        name: order.customer?.name,
        email: order.customer?.email,
        phone: order.customer?.mobileNumber,
        location: order.customer?.location,
        type: 'registered'
      } : {
        name: order.guestName,
        email: order.guestEmail,
        phone: order.guestPhone,
        type: 'guest'
      },
      items: order.orderItems.map(item => ({
        id: item.id,
        productId: item.product.product_id,
        name: item.product.productName,
        quantity: item.quantity,
        price: parseFloat(item.product.price || "0"),
        totalPrice: item.totalPrice,
        imageUrl: item.product.images[0]?.imageUrl || null,
      })),
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      deliveryTime: order.deliveryTime,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      deliveryAddress: order.deliveryAddress,
      deliveryInfo: order.deliveryInfo,
      paymentStatus: order.paymentStatus,
    }));

    // Get total count for pagination
    const totalOrders = await prisma.order.count({
      where: {
        orderItems: {
          some: {
            sellerId: sellerId,
          },
        },
      },
    });

    return res
      .status(200)
      .json({ 
        orders: formattedOrders, 
        message: "Seller order fetched successfully.",
        pagination: {
          page,
          limit,
          total: totalOrders,
          totalPages: Math.ceil(totalOrders / limit),
        }
      });
  } catch (error: any) {
    console.error("Get seller orders error:", error);
    return res.status(500).json({ message: error.message || "Server error." });
  }
};

export const statusUpdate = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user.seller_id;
    const { orderId, status } = req.body;

    const seller = await prisma.seller.findUnique({
      where: { seller_id: sellerId },
    });

    if (!seller) {
      return res.status(401).json({ message: "Seller not found" });
    }

    // First verify seller has items in this order
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        orderId: orderId,
        sellerId: sellerId,
      },
    });

    if (!orderItem) {
      return res.status(403).json({ 
        message: "Not authorized to update this order" 
      });
    }

    const updateStatus = await prisma.order.update({
      where: { order_id: orderId },
      data: { orderStatus: status },
    });

    console.log(updateStatus);

    return res
      .status(200)
      .json({ 
        order: updateStatus, 
        message: "Order status updated successfully" 
      });
  } catch (error: any) {
    console.error("Status update error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { orderId, cancellationReason } = req.body;

    // Validate request
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { order_id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    // Check if order exists
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns the order (for logged-in users) or has guest session
    if (order.customerId && order.customerId !== userId) {
      return res.status(403).json({ message: "Unauthorized to cancel this order" });
    }

    // Check if order can be cancelled
    const allowedStatuses = ["PLACED", "PENDING", "PROCESSING"];
    if (!allowedStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ 
        message: `Cannot cancel order with status: ${order.orderStatus}. Only orders in PLACED, PENDING, or PROCESSING can be cancelled.`
      });
    }

    // Check 5-minute time limit
    const orderTime = new Date(order.createdAt);
    const currentTime = new Date();
    const timeDifference = (currentTime.getTime() - orderTime.getTime()) / (1000 * 60); // minutes
    
    const MAX_CANCELLATION_MINUTES = 5; // 5-minute limit
    
    if (timeDifference > MAX_CANCELLATION_MINUTES) {
      return res.status(400).json({ 
        message: `Order cannot be cancelled after ${MAX_CANCELLATION_MINUTES} minutes.`
      });
    }

    // Start transaction to update order and restore stock
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status to CANCELLED
      const cancelledOrder = await tx.order.update({
        where: { order_id: orderId },
        data: {
          orderStatus: "CANCELLED",
          cancellationReason: cancellationReason || "Customer requested cancellation",
          cancelledAt: new Date(),
          // Use proper PaymentStatus enum values
          paymentStatus: order.paymentStatus === "PAID" ? "REFUNDED" : "FAILED",
        },
      });

      // Restore product stock for each item
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { product_id: item.productId },
          data: {
            stock: { increment: item.quantity },
            sales: { decrement: item.quantity },
          },
        });
      }

      // Create cancellation record (handle guest orders with null customerId)
      await tx.orderCancellation.create({
        data: {
          orderId: orderId,
          customerId: order.customerId, // Can be null for guest orders
          reason: cancellationReason || "Customer requested cancellation",
          cancelledBy: "CUSTOMER",
          refundStatus: order.paymentStatus === "PAID" ? "PENDING" : "NOT_APPLICABLE",
        },
      });

      return cancelledOrder;
    });

    return res.status(200).json({
      message: "Order cancelled successfully",
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Cancel order error:", error);
    return res.status(500).json({ 
      message: error.message || "Failed to cancel order" 
    });
  }
};

// New function for guest order lookup
export const getGuestOrder = async (req: Request, res: Response) => {
  try {
    const { orderNumber, guestEmail } = req.body;

    if (!orderNumber || !guestEmail) {
      return res.status(400).json({ 
        message: "Order number and email are required" 
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber,
        OR: [
          { guestEmail: guestEmail },
          { customer: { email: guestEmail } }
        ]
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  select: {
                    imageUrl: true
                  }
                },
                seller: {
                  select: {
                    businessName: true,
                  }
                }
              }
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ 
        message: "Order not found. Please check your order number and email." 
      });
    }

    const formattedOrder = {
      orderId: order.order_id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      deliveryFee: order.deliveryFee,
      deliveryAddress: order.deliveryAddress,
      deliveryInfo: order.deliveryInfo,
      deliveryTime: order.deliveryTime,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      customerType: order.customerId ? 'registered' : 'guest',
      items: order.orderItems.map(item => ({
        productId: item.productId,
        productName: item.product.productName,
        quantity: item.quantity,
        price: parseFloat(item.product.price || "0"),
        totalPrice: item.totalPrice,
        imageUrl: item.product.images[0]?.imageUrl || null,
        sellerName: item.product.seller?.businessName,
      })),
    };

    return res.status(200).json({
      order: formattedOrder,
    });
  } catch (error: any) {
    console.error("Get guest order error:", error);
    return res.status(500).json({ 
      message: error.message || "Server error" 
    });
  }
};