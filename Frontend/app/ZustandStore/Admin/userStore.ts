import { create } from 'zustand'
import api from '@/app/libs/api'

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface Customer {
  id: number;
  name: string;
  email: string;
  mobileNumber?: string;
  location?: string;
  city?: string;
  cusProfileImg?: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  lastActive: string;
  status: UserStatus; // Changed from string
}

export interface Seller {
  seller_id: number;
  businessName: string;
  businessEmail: string;
  businessAddress: string;
  phoneNum?: string;
  createdAt: string;
  totalProducts: number;
  totalSales: number;
  rating: number;
  totalRevenue: number;
  status: UserStatus; // Changed from string
  verificationStatus: string;
}

interface UserAnalytics {
  totalCustomers: number;
  totalSellers: number;
  newCustomers: number;
  newSellers: number;
  activeCustomers: number;
  activeSellers: number;
  monthlyRevenue: number;
  customerGrowth: any[];
  sellerGrowth: any[];
}

interface UserStore {
  customers: Customer[];
  sellers: Seller[];
  analytics: UserAnalytics | null;
  loading: boolean;
  error: string | null;

  // Fetch functions
  getAllCustomers: () => Promise<void>;
  getAllSellers: () => Promise<void>;
  getCustomerDetails: (customerId: number) => Promise<any>;
  getSellerDetails: (sellerId: number) => Promise<any>;
  getUserAnalytics: () => Promise<void>;

  // Action functions
  suspendUser: (userId: number, userType: 'CUSTOMER' | 'SELLER', reason: string, duration?: string, notes?: string) => Promise<void>;
  activateUser: (userId: number, userType: 'CUSTOMER' | 'SELLER', notes?: string) => Promise<void>;
  deleteUser: (userId: number, userType: 'CUSTOMER' | 'SELLER', reason: string, hardDelete?: boolean) => Promise<void>;
  verifySeller: (sellerId: number, status: 'APPROVED' | 'REJECTED' | 'PENDING', notes?: string) => Promise<void>;
  sendWarning: (userId: number, userType: 'CUSTOMER' | 'SELLER', warningType: string, message: string, sendEmail?: boolean) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  customers: [],
  sellers: [],
  analytics: null,
  loading: false,
  error: null,

  getAllCustomers: async () => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.get("/api/user/getallcustomers", {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log(res);

      set({ 
        customers: res.data.allcustomers, 
        loading: false 
      });
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Customers fetch failed",
        loading: false 
      });
    }
  },

  getAllSellers: async () => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.get("/api/user/getallsellers");

       // Log the full response to debug
    console.log("Full response:", res);
    console.log("Response data:", res.data);
    console.log("All sellers:", res.data.allsellers);

    if (res.data.allsellers && res.data.allsellers.length > 0) {
      console.log("First seller:", res.data.allsellers[0]);
      console.log("First seller storeImg:", res.data.allsellers[0].storeImg);
    }

      set({ 
        sellers: res.data.allsellers, 
        loading: false 
      });
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Sellers fetch failed",
        loading: false 
      });
    }
  },

  getCustomerDetails: async (customerId: number) => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.get(`/api/user/customer/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ loading: false });
      return res.data.customer;
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Customer details fetch failed",
        loading: false 
      });
      throw err;
    }
  },

  getSellerDetails: async (sellerId: number) => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.get(`/api/user/seller/${sellerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ loading: false });
      return res.data.seller;
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Seller details fetch failed",
        loading: false 
      });
      throw err;
    }
  },

  getUserAnalytics: async () => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.get("/api/user/analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ 
        analytics: res.data.analytics, 
        loading: false 
      });
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Analytics fetch failed",
        loading: false 
      });
    }
  },

  suspendUser: async (userId, userType, reason, duration, notes) => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.post("/api/user/suspend", {
        userId,
        userType,
        reason,
        duration,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      if (userType === 'CUSTOMER') {
        set((state) => ({
          customers: state.customers.map(customer => 
            customer.id === userId 
              ? { ...customer, status: 'SUSPENDED' }
              : customer
          ),
          loading: false
        }));
      } else {
        set((state) => ({
          sellers: state.sellers.map(seller => 
            seller.seller_id === userId 
              ? { ...seller, status: 'SUSPENDED' }
              : seller
          ),
          loading: false
        }));
      }

      return res.data;
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Suspension failed",
        loading: false 
      });
      throw err;
    }
  },

  activateUser: async (userId, userType, notes) => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.post("/api/user/activate", {
        userId,
        userType,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      if (userType === 'CUSTOMER') {
        set((state) => ({
          customers: state.customers.map(customer => 
            customer.id === userId 
              ? { ...customer, status: 'ACTIVE' }
              : customer
          ),
          loading: false
        }));
      } else {
        set((state) => ({
          sellers: state.sellers.map(seller => 
            seller.seller_id === userId 
              ? { ...seller, status: 'ACTIVE' }
              : seller
          ),
          loading: false
        }));
      }

      return res.data;
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Activation failed",
        loading: false 
      });
      throw err;
    }
  },

  deleteUser: async (userId, userType, reason, hardDelete = false) => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.post("/api/user/delete", {
        userId,
        userType,
        reason,
        hardDelete
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove from local state
      if (userType === 'CUSTOMER') {
        set((state) => ({
          customers: state.customers.filter(customer => customer.id !== userId),
          loading: false
        }));
      } else {
        set((state) => ({
          sellers: state.sellers.filter(seller => seller.seller_id !== userId),
          loading: false
        }));
      }

      return res.data;
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Deletion failed",
        loading: false 
      });
      throw err;
    }
  },

  verifySeller: async (sellerId, status, notes) => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.post("/api/user/verify-seller", {
        sellerId,
        status,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      set((state) => ({
        sellers: state.sellers.map(seller => 
          seller.seller_id === sellerId 
            ? { ...seller, verificationStatus: status }
            : seller
        ),
        loading: false
      }));

      return res.data;
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Verification failed",
        loading: false 
      });
      throw err;
    }
  },

  sendWarning: async (userId, userType, warningType, message, sendEmail = true) => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.post("/api/user/warning", {
        userId,
        userType,
        warningType,
        message,
        sendEmail
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ loading: false });
      return res.data;
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Warning sending failed",
        loading: false 
      });
      throw err;
    }
  },
}));