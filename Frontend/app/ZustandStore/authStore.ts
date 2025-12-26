import { create } from "zustand";
import api from "../libs/api";

// Structure of the customer
interface Customer {
  id: number;
  name: string;
  email: string;
  location: string;
  mobileNumber?: string;
  city?: string;
  zipCode?: string;
  cusProfileImg?: string;
  password: string;
}

interface UpdateCustomerResponse {
  cusProfileImg?: string;
  name?: string;
  email?: string;
  location?: string;
  mobileNumber?: string;
  city?: string;
  zipCode?: string;
}

// Structure of the seller
interface Seller {
  seller_id: number;
  businessEmail: string;
  businessName: string;
  businessAddress: string;
  phoneNum: string;
  category: string;
  openingHours: string;
  deliveryRadius: string;
  website: string;
  storeDescription: string;
  storeImg: string;
  coverImg: string;
  password: string;
  followers?: number;
  productsCount?: number;
  following?: number;
  rating?: number;
}

// Structure of the zustand store
interface AuthState {
  customer: Customer | null;
  seller: Seller | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  
  // Add sellers array for storing all sellers
  sellers: Seller[];
  
  register: (
    name: string,
    email: string,
    location: string,
    password: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  fetchCusDetails: () => Promise<void>;
  updateCusDetails: (fields: Partial<Customer>, file?: File) => Promise<UpdateCustomerResponse>;
  logout: () => Promise<void>;

  sellerRegister: (
    businessName: string,
    businessEmail: string,
    businessAddress: string,
    password: string
  ) => Promise<void>;
  fetchSellerDetails: (id: number) => Promise<void>;
  fetchSellerDetailsProtected: (id: number) => Promise<void>;
  updateSellerDetails: (
    fields: Partial<Seller>,
    storeImgFile?: File,
    coverImgFile?: File
  ) => Promise<void>;

  setSeller: (seller: Partial<Seller>) => void;
  fetchSellerDetailsFromToken: () => Promise<void>;
  
  // Add getAllSellers function
  getAllSellers: () => Promise<void>;
}

// Create<AuthState> tells zustand that store will follow the AuthState structure
// set is a function provided by zustand to update the store state
export const useCusAuthStore = create<AuthState>((set, get) => ({
  // Initial values
  customer: null,
  seller: null,
  sellers: [], // Initialize sellers array
  token: null, // Load token
  loading: false,
  error: null,

  register: async (name, email, location, password) => {
    let Cdata = { name, email, location, password };
    console.log("CData: ", Cdata);

    try {
      set({ loading: true, error: null });

      const res = await api.post("/api/customer/customerregister", {
        name: name,
        email: email,
        location: location,
        password: password,
      });

      console.log("Res: ", res);

      // Update store with customer and token
      set({
        customer: res.data.customer,
        token: res.data.token,
        loading: false,
      });

      localStorage.setItem("token", res.data.token);
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Registration failed",
        loading: false,
      });
    }
  },

  sellerRegister: async (businessName, businessEmail, businessAddress, password) => {
    console.log("Seller d: ", businessAddress, businessName, businessEmail, password);
    try {
      set({ loading: true, error: null });

      const res = await api.post("/api/seller/sellerregister", {
        businessName: businessName,
        businessEmail: businessEmail,
        businessAddress: businessAddress,
        password: password,
      });

      console.log("Res: ", res);

      set({ seller: res.data.seller, token: res.data.token, loading: false });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", "seller");
      if (res.data.seller?.seller_id) {
        localStorage.setItem("sellerId", res.data.seller.seller_id.toString());
      }
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Registration failed",
        loading: false,
      });
    }
  },

  login: async (email, password) => {
    console.log("Login attempt:", { email, password });

    try {
      set({ loading: true, error: null });

      const res = await api.post("/api/customer/customerlogin", { email, password });
      console.log("Login response:", res.data);

      const { token, user } = res.data;
      const role = user.role;

      // Store token and role
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      // Update store based on role
      if (role === "customer") {
        set({
          customer: user,
          seller: null,
          token,
          loading: false,
        });
      } else if (role === "seller") {
        set({
          seller: user,
          customer: null,
          token,
          loading: false,
        });
        // Store seller ID in localStorage for easy access
        if (user.seller_id) {
          localStorage.setItem("sellerId", user.seller_id.toString());
        }
      } else if (role === "admin") {
        // For admin, clear both customer/seller and optionally store a minimal object
        set({
          customer: null,
          seller: null,
          token,
          loading: false,
        });
      }

      return true;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Login failed",
        loading: false,
      });
      return false;
    }
  },

  fetchCusDetails: async () => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");
      console.log("Token: ", token);
      if (!token) {
        throw new Error("No token found..Please log in");
      }

      const res = await api.get("/api/customer/getcustomerprofile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Response: ", res);

      set({ customer: res.data.customerD, loading: false });
    } catch (err: any) {
      set({
        error:
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch customer",
        loading: false,
      });
    }
  },

  fetchSellerDetails: async (id) => {
    console.log("Fetching seller details for ID:", id);

    try {
      set({ loading: true, error: null });

      // Use the public endpoint for customer dashboard
      const res = await api.get(`/api/seller/getdetails/${id}`);
      
      console.log("Seller details response:", res.data);

      if (res.data && res.data.seller) {
        set({ seller: res.data.seller, loading: false });
      } else {
        throw new Error("Invalid response format");
      }

    } catch (err: any) {
      console.error("Error fetching seller:", err.response?.data || err);
      set({
        error:
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch seller details",
        loading: false,
      });
      throw err;
    }
  },

  // Add a method to fetch seller details from token
  fetchSellerDetailsFromToken: async () => {
    try {
      set({ loading: true, error: null });
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      
      const res = await api.get("/api/seller/get-my-details", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Seller details from token:", res.data);
      
      if (res.data && res.data.seller) {
        set({ 
          seller: res.data.seller, 
          loading: false 
        });
        
        // Store seller ID for future use
        localStorage.setItem("sellerId", res.data.seller.seller_id.toString());
      }
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to fetch seller details",
        loading: false,
      });
    }
  },

  // Add a method for sellers to get their own details (with auth)
  fetchSellerDetailsProtected: async (id) => {
    console.log("Fetching protected seller details for ID:", id);

    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("Authentication required");
      }

      const res = await api.get(`/api/seller/protected/details/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Protected seller details response:", res.data);

      if (res.data && res.data.seller) {
        set({ seller: res.data.seller, loading: false });
      } else {
        throw new Error("Invalid response format");
      }

    } catch (err: any) {
      console.error("Error fetching protected seller:", err.response?.data || err);
      set({
        error:
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch seller details",
        loading: false,
      });
      throw err;
    }
  },

  updateCusDetails: async (fields, file) => {
    console.log("fd: ", fields, file);
    
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in again..");
      }

      const formData = new FormData();

      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined) {
          let finalValue: string;

          if (value === null) {
            finalValue = "";
          } else {
            finalValue = value.toString();
          }

          formData.append(key, finalValue);
        }
      });

      if (file) {
        formData.append("cusProfileImg", file);
      }

      const res = await api.post("/api/customer/updateprofile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Updated: ", res);

      const updatedUser = res.data.updateUser;
      set({ customer: updatedUser, loading: false });

      // Always return the updated user
      return updatedUser as UpdateCustomerResponse;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message ||
        err.message ||
        "Failed to update customer detail";
      
      set({
        error: errorMessage,
        loading: false,
      });
      
      // Throw the error instead of silently failing
      throw new Error(errorMessage);
    }
  },

  // In your authStore.ts - update the updateSellerDetails function
updateSellerDetails: async (fields, storeImgFile, coverImgFile) => {
  console.log("Seller UD: ", fields);
  console.log("Store Image File: ", storeImgFile);
  console.log("Cover Image File: ", coverImgFile);

  try {
    set({ loading: true, error: null });

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Login timeout..Please log in again");
    }

    const formData = new FormData();

    // Add all fields to FormData
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined) {
        let finalValue: string;

        if (value === null) {
          finalValue = "";
        } else {
          finalValue = value.toString();
        }

        formData.append(key, finalValue);
      }
    });

    // Add store image if provided
    if (storeImgFile) {
      formData.append("storeImg", storeImgFile);
    }

    // Add cover image if provided
    if (coverImgFile) {
      formData.append("coverImg", coverImgFile);
    }

    // CHANGE FROM POST TO PUT:
    const res = await api.put("/api/seller/updatedetails", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("Updated Seller Response: ", res);

    // Update the seller in state with the response data
    set({ seller: res.data.seller, loading: false }); // Changed from updateSeller to seller

  } catch (err: any) {
    console.error("Update seller error details:", {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message
    });
    
    const errorMessage = err.response?.data?.message ||
      err.message ||
      "Failed to update seller details";
    
    set({
      error: errorMessage,
      loading: false,
    });

    throw new Error(errorMessage);
  }
},

  logout: async () => {
    // Clear all auth data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("sellerId");
    
    set({
      customer: null,
      seller: null,
      token: null,
      loading: false,
      error: null,
    });
  },

  setSeller: (seller: Partial<Seller>) =>
    set((state) => ({
      seller: state.seller ? { ...state.seller, ...seller } : (seller as Seller),
    })),

  // Add getAllSellers function here
  getAllSellers: async () => {
    console.log("🔄 getAllSellers function called");
    
    try {
      set({ loading: true, error: null });
      
      // Make API call to fetch all sellers
      const res = await api.get("/api/seller/getallsellers");
      
      console.log("✅ getAllSellers response:", res.data);
      
      if (res.data && res.data.sellers) {
        set({ 
          sellers: res.data.sellers, 
          loading: false 
        });
        console.log(`✅ Successfully loaded ${res.data.sellers.length} sellers`);
      } else {
        console.log("⚠️ No sellers array in response:", res.data);
        set({ 
          sellers: [], 
          loading: false 
        });
      }
      
    } catch (err: any) {
      console.error("❌ Error in getAllSellers:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      set({
        error: err.response?.data?.message || "Failed to fetch sellers",
        loading: false,
      });
    }
  },
}));