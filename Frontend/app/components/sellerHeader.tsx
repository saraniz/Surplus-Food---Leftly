"use client";

import { useState, useEffect } from "react";
import { useCusAuthStore } from "@/app/ZustandStore/authStore";
import { useRouter } from "next/navigation";

interface SellerHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  subtitle: string;
}

export default function SellerHeader({
  sidebarOpen,
  setSidebarOpen,
  title,
  subtitle,
}: SellerHeaderProps) {
  const [notifications] = useState<any[]>([]);
  const [messages] = useState<any[]>([]);

  const { seller, fetchSellerDetailsProtected, token, loading, error, logout } =
    useCusAuthStore();
  const router = useRouter();

  useEffect(() => {
    const fetchSellerData = async () => {
      if (token) {
        const role = localStorage.getItem("role");
        if (role === "seller") {
          try {
            const sellerId = getSellerId();
            if (sellerId && (!seller || seller.seller_id !== sellerId)) {
              await fetchSellerDetailsProtected(sellerId);
            }
          } catch (err) {
            console.error("Error fetching seller data:", err);
          }
        }
      }
    };
    fetchSellerData();
  }, [token, seller, fetchSellerDetailsProtected]);

  const getSellerId = (): number | null => {
    if (seller?.seller_id) return seller.seller_id;

    const storedSellerId = localStorage.getItem("seller_id");
    if (storedSellerId) return parseInt(storedSellerId);

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.sellerId || payload.id || payload.seller_id;
      } catch (e) {
        console.error("Failed to decode token:", e);
      }
    }
    return null;
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("seller_id");
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleProfileClick = () => {
    if (seller?.seller_id) {
      router.push(`/seller/dashboard`);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left section: Mobile menu + Title */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          {/* Mobile Menu Button */}
          <button
            title="Menu"
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Title & Subtitle */}
          <div className="hidden md:flex flex-col text-black">
            <h1 className="text-lg font-bold truncate max-w-[200px]">{title}</h1>
            <p className="text-sm text-gray-500 truncate max-w-[200px]">{subtitle}</p>
          </div>
        </div>

        {/* Center section: Search Bar - now left-aligned */}
        <div className="flex-1 mx-4 text-black">
          <div className="relative max-w-xl text-black">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search orders, products, customers..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right section: User profile */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="hidden md:block">
                  <div className="w-24 h-4 bg-gray-200 animate-pulse rounded mb-1"></div>
                  <div className="w-16 h-3 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-sm">{error}</div>
            ) : seller ? (
              <>
                <div
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={handleProfileClick}
                  title="Go to Dashboard"
                >
                  <div className="relative">
                    {seller.storeImg ? (
                      <img
                        src={seller.storeImg}
                        alt={seller.businessName || "Seller Store"}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/default-store-img.jpg";
                          target.onerror = null;
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                      {seller.businessName || "My Store"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {seller.category ? `${seller.category} Seller` : "Seller"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="hidden md:block ml-2 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900">Not Logged In</div>
                  <div className="text-xs text-gray-500">
                    <button
                      onClick={() => router.push("/login")}
                      className="text-blue-500 hover:text-blue-700 hover:underline"
                    >
                      Login as Seller
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}