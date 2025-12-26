// app/register/page.tsx
"use client";

import Register from "../components/Register";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export default function RegisterPage() {
  // Toast state at page level
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    show: boolean;
  } | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, show: true });
  };

  // CSS for animation
  const slideInStyle = {
    animation: 'slideIn 0.3s ease-out'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004030] via-[#1B3A2C] to-[#2E5A3F] relative overflow-hidden">
      {/* Add CSS animation styles */}
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>

      {/* Toast Notification - At PAGE LEVEL */}
      {toast && (
        <div 
          className={`
            fixed top-4 right-4 z-50 max-w-md
            ${toast.type === "success" 
              ? "bg-gradient-to-r from-emerald-500 to-green-500" 
              : "bg-gradient-to-r from-rose-500 to-red-500"
            } 
            text-white p-4 rounded-xl shadow-2xl flex items-center space-x-3
          `}
          style={slideInStyle}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="flex-1 font-medium">{toast.message}</span>
          <button
            type="button"
            title="Close" 
            onClick={() => setToast(null)} 
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating organic shapes */}
      <div className="absolute inset-0">
        {/* Soft glowing circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-xl animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute top-40 right-32 w-96 h-96 bg-gradient-to-r from-lime-400/15 to-green-400/15 rounded-full blur-2xl animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-32 left-40 w-80 h-80 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-xl animate-[pulse_7s_ease-in-out_infinite]" />

        {/* Medium floating shapes */}
        <div className="absolute bottom-60 right-1/4 w-24 h-24 bg-gradient-to-r from-lime-400/40 to-emerald-400/40 rounded-full animate-[bounce_6s_infinite]" />
        <div className="absolute top-1/3 right-20 w-20 h-20 bg-gradient-to-r from-teal-400/35 to-green-400/35 rounded-lg rotate-12 animate-[bounce_7s_infinite]" />

        {/* Floating lines/bars */}
        <div className="absolute top-1/4 right-1/3 w-40 h-2 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent rounded-full rotate-12 animate-[pulse_7s_infinite]" />
        <div className="absolute bottom-1/3 left-1/3 w-32 h-1 bg-gradient-to-r from-transparent via-green-400/40 to-transparent rounded-full -rotate-12 animate-[pulse_8s_infinite]" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-4rem)]">
          {/* Left side - Login Form */}
          <div className="flex items-center justify-center">
            {/* Pass showToast function to Register component */}
            <Register onShowToast={showToast} />
          </div>

          {/* Right side - Enlarged image */}
          <div className="hidden lg:flex items-center justify-center relative">
            <div className="relative max-w-2xl">
              <img
                className="w-full h-auto object-cover transform scale-110"
                src="/ls.png"
                alt="food image"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}