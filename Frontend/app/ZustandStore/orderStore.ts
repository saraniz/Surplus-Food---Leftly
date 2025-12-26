import { create } from "zustand";
import api from "../libs/api";
import { useProductStore } from "./productStore";

interface OrderItemRequest {
  productId: number;
  sellerId: number;
  quantity: number;
  price: number;
}

interface PlaceOrderRequest {
  deliveryAddress: string;
  deliveryInfo: string;
  deliveryTime: string; // Changed from number to string
  deliveryFee: number;
  totalPrice: number;
  paymentMethod: string;
  items: OrderItemRequest[];
  guestEmail?: string; // Added for guest orders
  guestName?: string;  // Added for guest orders
  guestPhone?: string; // Added for guest orders
  isGuest?: boolean;   // Added for guest orders
}

interface OrderResponse {
  message: string;
  orderId: number;
  orderNumber?: string; // Added for guest orders
  guestSessionId?: string; // Added for guest orders
}

interface OrderState {
  order: any | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  success: boolean;

  placeOrder: (data: PlaceOrderRequest) => Promise<OrderResponse>; // Changed return type
  clearOrder: () => void;
  getOrders: () => Promise<void>;
  updateOrderStatus: (orderId: number, status: string) => Promise<void>;
  getSellerOrders: (page?: number, limit?: number) => Promise<void>; // Added pagination params
  cancelOrder: (orderId: number, cancellationReason?: string) => Promise<void>;
  getGuestOrder: (orderNumber: string, guestEmail: string) => Promise<any>; // Added new method
}

export const useOrderStore = create<OrderState>((set, get) => ({
  order: [],
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
  success: false,

  placeOrder: async (orderData: PlaceOrderRequest) => {
    try {
      set({ loading: true, error: null, success: false });

      const token = localStorage.getItem("token") || get().token;

      if (!orderData.items || orderData.items.length === 0) {
        throw new Error("No items in order");
      }

      // For guest orders, don't send token
      const headers = orderData.isGuest 
        ? {} 
        : { Authorization: `Bearer ${token}` };

      const validatedData = {
        ...orderData,
        totalPrice: parseFloat(orderData.totalPrice.toFixed(2)), // Changed from Math.round
        deliveryFee: parseFloat(orderData.deliveryFee.toFixed(2)), // Changed from Math.round
        deliveryTime: orderData.deliveryTime.toString(), // Ensure it's string
      };

      const res = await api.post("/api/order/placeorder", validatedData, {
        headers,
      });

      if (res.data.message === "Order placed successfully") {
        // 🔥 Refresh product stock right after placing order
        const productStore = useProductStore.getState();
        await productStore.fetchAllProducts();

        // Save guest session ID for guest orders
        if (orderData.isGuest && res.data.guestSessionId) {
          localStorage.setItem('guestSessionId', res.data.guestSessionId);
        }

        set({
          loading: false,
          success: true,
          order: res.data,
          error: null,
        });

        return res.data; // Return the response data
      } else {
        throw new Error(res.data.message || "Failed to place order");
      }
    } catch (error: any) {
      set({
        loading: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to place order",
        success: false,
      });
      throw error; // Re-throw so caller can handle it
    }
  },

  clearOrder: () => set({ order: null, error: null, success: false }),

  getOrders: async () => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      const res = await api.get("/api/order/getorders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(res);

      set({ order: res.data.orders || res.data.order, loading: false }); // Use res.data.orders
    } catch (err: any) {
      set({ loading: false, error: err?.message ?? "Orders not found" });
    }
  },

  getSellerOrders: async (page = 1, limit = 20) => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication required");
      }

      // Add pagination parameters
      const res = await api.get(`/api/order/getsellerorders?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Seller orders response:", res.data);

      // Make sure we're setting the orders array correctly
      const ordersArray = res.data.orders || res.data.order || [];

      set({
        order: Array.isArray(ordersArray) ? ordersArray : [],
        loading: false,
      });
    } catch (err: any) {
      console.error("Error fetching seller orders:", err);
      set({
        error:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch seller orders",
        loading: false,
      });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    console.log(orderId, status);

    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      const res = await api.put(
        "/api/order/updatestatus",
        { orderId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(res);

      const updateOrder = res.data.order || res.data.updateStatus;

      set((state) => ({
        order: state.order.map((o: any) =>
          o.order_id === orderId || o.id === orderId ? updateOrder : o // Fixed: return o instead of 0
        ),
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err?.message ?? "Order status updated failed" });
    }
  },

  cancelOrder: async (orderId: number, cancellationReason?: string) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem("token");

      const res = await api.put(
        "/api/order/cancel-order",
        { orderId, cancellationReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state - fixed payment status values
      set((state) => ({
        loading: false,
        order: state.order.map((order: any) =>
          order.order_id === orderId
            ? {
                ...order,
                orderStatus: "CANCELLED",
                cancellationReason: cancellationReason,
                cancelledAt: new Date().toISOString(),
                // Use valid payment status values from your enum
                paymentStatus:
                  order.paymentStatus === "PAID"
                    ? "REFUNDED" // Changed from REFUND_PENDING
                    : "FAILED",   // Changed from CANCELLED
              }
            : order
        ),
        success: true,
      }));

      return res.data;
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.message || "Failed to cancel order",
        success: false,
      });
      throw err;
    }
  },

  // New method for guest order lookup
  getGuestOrder: async (orderNumber: string, guestEmail: string) => {
    try {
      set({ loading: true, error: null });

      const res = await api.post("/api/order/guest/lookup", {
        orderNumber,
        guestEmail,
      });

      set({ loading: false });
      return res.data.order;
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.message || err.message || "Failed to fetch guest order",
      });
      throw err;
    }
  },
}));