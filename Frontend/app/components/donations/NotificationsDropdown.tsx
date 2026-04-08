"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/app/ZustandStore/notificationStore";

interface NotificationsDropdownProps {
  userId: number;
  title?: string;
}

export default function NotificationsDropdown({ userId, title = "Notifications" }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false);
  const { notifications, fetchNotifications, markAsRead, unreadCount, loading } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(userId);
  }, [fetchNotifications, userId]);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50"
        aria-label="Toggle notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount() > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
            {unreadCount()}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            {loading ? <span className="text-xs text-slate-400">Loading...</span> : null}
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No notifications found.</p>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    item.read_status
                      ? "border-slate-200 bg-white text-slate-600"
                      : "border-amber-200 bg-amber-50 text-slate-800"
                  }`}
                >
                  <p>{item.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
