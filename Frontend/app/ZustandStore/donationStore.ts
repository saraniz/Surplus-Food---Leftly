import { create } from "zustand";
import { Charity, Donation } from "@/app/libs/donations/types";

interface CreateDonationInput {
  food_item: string;
  quantity: number;
  seller_id: number;
  charity_id: number;
}

interface DonationStoreState {
  donations: Donation[];
  charities: Charity[];
  loading: boolean;
  error: string | null;
  fetchCharities: () => Promise<void>;
  fetchDonations: (filters?: { seller_id?: number; charity_id?: number }) => Promise<void>;
  createDonation: (payload: CreateDonationInput) => Promise<void>;
  acceptDonation: (id: number) => Promise<void>;
  declineDonation: (id: number) => Promise<void>;
}

export const useDonationStore = create<DonationStoreState>((set) => ({
  donations: [],
  charities: [],
  loading: false,
  error: null,

  fetchCharities: async () => {
    try {
      set({ loading: true, error: null });
      const res = await fetch("/api/charities");
      if (!res.ok) throw new Error("Failed to load charities");
      const data = await res.json();
      set({ charities: data.charities || [], loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load charities",
      });
    }
  },

  fetchDonations: async (filters) => {
    try {
      set({ loading: true, error: null });

      const query = new URLSearchParams();
      if (filters?.seller_id) query.set("seller_id", String(filters.seller_id));
      if (filters?.charity_id) query.set("charity_id", String(filters.charity_id));

      const qs = query.toString();
      const res = await fetch(`/api/donations${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to load donations");

      const data = await res.json();
      set({ donations: data.donations || [], loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load donations",
      });
    }
  },

  createDonation: async (payload) => {
    try {
      set({ loading: true, error: null });
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create donation");
      }

      const data = await res.json();
      set((state) => ({
        donations: [data.donation, ...state.donations],
        loading: false,
      }));
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to create donation",
      });
    }
  },

  acceptDonation: async (id) => {
    try {
      set({ loading: true, error: null });
      const res = await fetch(`/api/donations/${id}/accept`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to accept donation");

      const data = await res.json();
      set((state) => ({
        donations: state.donations.map((d) => (d.id === id ? data.donation : d)),
        loading: false,
      }));
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to accept donation",
      });
    }
  },

  declineDonation: async (id) => {
    try {
      set({ loading: true, error: null });
      const res = await fetch(`/api/donations/${id}/decline`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to decline donation");

      const data = await res.json();
      set((state) => ({
        donations: state.donations.map((d) => (d.id === id ? data.donation : d)),
        loading: false,
      }));
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to decline donation",
      });
    }
  },
}));
