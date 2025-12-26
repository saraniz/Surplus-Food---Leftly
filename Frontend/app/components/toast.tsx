// app/components/Toast.tsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export default function Toast() {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    show: boolean;
  } | null>(null);

  // Listen for toast events
  useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      const { message, type } = event.detail;
      showToast(message, type);
    };

    window.addEventListener("showToast", handleShowToast as EventListener);
    
    return () => {
      window.removeEventListener("showToast", handleShowToast as EventListener);
    };
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, show: true });
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setToast((prev) => prev ? { ...prev, show: false } : null);
    }, 4000);
  };

  if (!toast?.show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div
        className={`
          flex items-center space-x-3 p-4 rounded-xl shadow-2xl
          transform transition-all duration-300
          ${toast.show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
          ${toast.type === "success" 
            ? "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200" 
            : "bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200"
          }
        `}
      >
        {toast.type === "success" ? (
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
        ) : (
          <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
            <XCircle className="w-6 h-6 text-white" />
          </div>
        )}
        
        <div className="flex-1">
          <p className="font-semibold text-gray-900">
            {toast.type === "success" ? "Success!" : "Error!"}
          </p>
          <p className="text-sm text-gray-700">{toast.message}</p>
        </div>
        
        <button
          onClick={() => setToast({ ...toast, show: false })}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}