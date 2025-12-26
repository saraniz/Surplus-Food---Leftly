import { create } from "zustand";
import api from "../libs/api";

interface Follow {
  followId: number;
  createdAt: string;
  seller: {
    businessName: string;
    businessEmail: string;
    storeImg: string;
    seller_id: number;
  };
}

interface FollowState {
  follow: Follow[];
  token: string | null;
  loading: boolean;
  error: string | null;

  // Methods
  followShops: (sellerId: number) => Promise<void>;
  unfollowShop: (sellerId: number) => Promise<void>;
  checkIfFollowed: (sellerId: number) => boolean;
  fetchFollowedShops: () => Promise<void>;
}

export const useFollowStore = create<FollowState>((set, get) => ({
  follow: [],
  token: localStorage.getItem("token"),
  loading: false,
  error: null,

  // Check if user follows a specific shop
  checkIfFollowed: (sellerId) => {
    const state = get();
    return state.follow.some(
      (item) => item.seller.seller_id === sellerId
    );
  },

  // Fetch all followed shops
  fetchFollowedShops: async () => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem("token");

      const res = await api.get(
        `/api/follow/getfollowshops`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      set({ follow: res.data.followshops || [], loading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || "Failed to fetch followed shops",
        loading: false,
      });
    }
  },

  // FOLLOW SHOP
  followShops: async (sellerId) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem("token");

      const res = await api.post(
        `/api/follow/followshops/${sellerId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Add newly followed shop to state
      const newFollowItem = {
        followId: res.data.follow.followId || Date.now(), // Use proper ID from response
        createdAt: new Date().toISOString(),
        seller: {
          seller_id: sellerId,
          businessName: "", // You might want to fetch this or get from response
          businessEmail: "",
          storeImg: ""
        }
      };

      set((state) => ({
        follow: [...state.follow, newFollowItem],
        loading: false,
      }));
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || "Failed to follow shop",
        loading: false,
      });
      throw err; // Re-throw to handle in component
    }
  },

  // UNFOLLOW SHOP
  unfollowShop: async (sellerId) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem("token");

      await api.delete(
        `/api/follow/unfollow`,
        {
          data: { storeId: sellerId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Remove unfollowed shop from state
      set((state) => ({
        follow: state.follow.filter(
          (item) => item.seller.seller_id !== sellerId
        ),
        loading: false,
      }));
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || "Failed to unfollow shop",
        loading: false,
      });
      throw err; // Re-throw to handle in component
    }
  },
}));