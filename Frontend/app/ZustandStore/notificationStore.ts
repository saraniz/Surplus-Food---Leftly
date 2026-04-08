import { create } from "zustand";
import { NotificationItem } from "@/app/libs/donations/types";

interface NotificationStoreState {
  notifications: NotificationItem[];
  loading: boolean;
  error: string | null;
  fetchNotifications: (userId?: number) => Promise<void>;
  markAsRead: (notificationId: number) => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,

  fetchNotifications: async (userId) => {
    try {
      set({ loading: true, error: null });
      const query = userId ? `?user_id=${userId}` : "";
      const res = await fetch(`/api/notifications${query}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");

      const data = await res.json();
      set({ notifications: data.notifications || [], loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to fetch notifications",
      });
    }
  },

  markAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read_status: true } : n
      ),
    }));
  },

  unreadCount: () => get().notifications.filter((n) => !n.read_status).length,
}));
