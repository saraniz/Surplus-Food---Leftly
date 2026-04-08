import { create } from "zustand";
import api from "../libs/api";

export interface MysteryBox {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice: number | null;
  category: string;
  stock: number;
  sales: number;
  expireDate: string;
  manufactureDate: string;
  status: string;
  sellerId: number;
  totalValue: number;
  productDetails: string; // JSON string of items contained
  seller?: {
    seller_id: number;
    businessName: string;
    storeImg: string;
    businessAddress: string;
    category: string;
    storeImgBase64?: string;
  };
}

interface MysteryBoxState {
  mysteryBoxes: MysteryBox[];
  sellerMysteryBoxes: MysteryBox[];
  singleMysteryBox: MysteryBox | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;

  fetchMysteryBoxes: (params?: any) => Promise<void>;
  fetchSellerMysteryBoxes: (params?: any) => Promise<void>;
  fetchSingleMysteryBox: (id: number) => Promise<MysteryBox | null>;
  addMysteryBox: (data: any) => Promise<void>;
  updateMysteryBox: (data: any) => Promise<void>;
  deleteMysteryBox: (id: number) => Promise<void>;
}

export const useMysteryBoxStore = create<MysteryBoxState>((set) => ({
  mysteryBoxes: [],
  sellerMysteryBoxes: [],
  singleMysteryBox: null,
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  totalPages: 1,

  fetchMysteryBoxes: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const res = await api.get("/api/product/mystery-boxes", { params });
      
      set({
        mysteryBoxes: res.data.mysteryBoxes || [],
        totalCount: res.data.totalCount || 0,
        currentPage: res.data.currentPage || 1,
        totalPages: res.data.totalPages || 1,
        loading: false
      });
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.message || err.message || "Failed to fetch mystery boxes"
      });
    }
  },

  fetchSellerMysteryBoxes: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem("token");
      
      const res = await api.get("/api/product/seller-mystery-boxes", {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({
        sellerMysteryBoxes: res.data.mysteryBoxes || [],
        totalCount: res.data.totalCount || 0,
        currentPage: res.data.currentPage || 1,
        totalPages: res.data.totalPages || 1,
        loading: false
      });
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.message || err.message || "Failed to fetch seller mystery boxes"
      });
    }
  },

  fetchSingleMysteryBox: async (id: number) => {
    try {
      set({ loading: true, error: null });
      const res = await api.get(`/api/product/mystery-box/${id}`);
      
      set({
        singleMysteryBox: res.data.mysteryBox,
        loading: false
      });
      return res.data.mysteryBox;
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.message || err.message || "Failed to fetch mystery box details"
      });
      return null;
    }
  },

  addMysteryBox: async (data: any) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem("token");
      
      await api.post("/api/product/add-mystery-box", data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ loading: false });
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.message || err.message || "Failed to create mystery box"
      });
      throw err;
    }
  },

  updateMysteryBox: async (data: any) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem("token");
      
      await api.put("/api/product/update-mystery-box", data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ loading: false });
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.message || err.message || "Failed to update mystery box"
      });
      throw err;
    }
  },

  deleteMysteryBox: async (id: number) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem("token");
      
      await api.delete("/api/product/delete-mystery-box", {
        headers: { Authorization: `Bearer ${token}` },
        data: { mysteryBoxId: id }
      });
      
      set((state) => ({
        loading: false,
        sellerMysteryBoxes: state.sellerMysteryBoxes.filter((box) => box.id !== id)
      }));
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.message || err.message || "Failed to delete mystery box"
      });
      throw err;
    }
  }
}));
