"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCusAuthStore } from "@/app/ZustandStore/authStore";

interface SellerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SellerSidebar({ isOpen = true, onClose }: SellerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState(pathname);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  const { seller, loading: sellerLoading } = useCusAuthStore();
  const [storeName, setStoreName] = useState("My Store");

  // Update store name when seller data is available
  useEffect(() => {
    if (seller?.businessName) {
      setStoreName(seller.businessName);
    }
  }, [seller]);

  // SVG icons for each menu item - ADD SHOP ICON
  const menuIcons = {
    dashboard: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    products: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    messages: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    orders: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    analytics: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    shop: ( // ADD SHOP ICON
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    settings: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    logout: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
  };

  const menuItems = [
    { id: "/sellerdashboard", name: "Dashboard", icon: menuIcons.dashboard, path: "/sellerdashboard" },
    { id: "/sellerdashboard/allproducts", name: "Products", icon: menuIcons.products, path: "/sellerdashboard/allproducts" },
    { id: "/sellerdashboard/messages", name: "Messages", icon: menuIcons.messages, path: "/sellerdashboard/messages" },
    { id: "/sellerdashboard/orders", name: "Orders", icon: menuIcons.orders, path: "/sellerdashboard/orders" },
    { id: "/sellerdashboard/analytics", name: "Analytics", icon: menuIcons.analytics, path: "/sellerdashboard/analytics" },
    { id: "/shop", name: "My Shop", icon: menuIcons.shop, path: "/shop" }, // ADDED MY SHOP MENU ITEM
    { id: "/sellerdashboard/sellersettings", name: "Settings", icon: menuIcons.settings, path: "/sellerdashboard/sellersettings" },
  ];

  const handleNavigation = (path: string) => {
    setActiveItem(path);
    
    // For My Shop, navigate to the shop page with seller ID from token
    if (path === "/shop") {
      // Get seller ID from the store (fetched using token)
      if (seller?.seller_id) {
        router.push(`/shop/${seller.seller_id}`);
      } else {
        // If seller data isn't loaded yet, fetch it first
        router.push("/shop");
      }
    } else {
      router.push(path);
    }
    
    if (onClose) onClose();
  };

  const handleMouseEnter = (itemId: string) => {
    setHoveredItem(itemId);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("seller_id");
    
    // Redirect to login
    router.push("/login");
  };

  // Truncate long store names
  const truncateStoreName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Fixed with full height */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        flex flex-col
        h-screen min-h-screen overflow-y-auto
      `}>
        {/* Logo and Store Info */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            {sellerLoading ? (
              // Loading skeleton
              <>
                <div className="w-10 h-10 bg-gray-700 rounded-xl animate-pulse"></div>
                <div className="flex-1">
                  <div className="w-32 h-4 bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="w-24 h-3 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center overflow-hidden">
                  {seller?.storeImg ? (
                    <img
                      src={seller.storeImg}
                      alt={storeName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to gradient background if image fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {storeName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 
                    className="text-lg font-bold truncate"
                    title={storeName}
                  >
                    {truncateStoreName(storeName)}
                  </h1>
                  <p className="text-gray-400 text-sm truncate">
                    {seller?.category || "Business"} Dashboard
                  </p>
                </div>
              </>
            )}
          </div>
          
          {/* Store Status Indicator */}
          <div className="mt-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Online</span>
            <span className="text-xs text-gray-400 ml-auto">
              {seller ? "Premium" : "Basic"}
            </span>
          </div>
        </div>

        {/* Navigation - Takes available space */}
        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map((item) => {
            const isActive =
              item.path === "/sellerdashboard"
                ? activeItem === "/sellerdashboard"
                : activeItem.startsWith(item.path);

            const isHovered = hoveredItem === item.id && isActive; // Only hover if active
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                  transition-all duration-200 ease-out group
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                    : 'bg-transparent'
                  }
                  ${isActive && isHovered ? 'transform scale-[1.02]' : ''}
                  relative overflow-hidden
                `}
              >
                {/* Hover effect line - ONLY shows when item is active AND hovered */}
                {isActive && isHovered && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400"></div>
                )}
                
                {/* Icon */}
                <span className={`
                  transition-transform duration-200
                  ${isActive && isHovered ? 'transform scale-110' : ''}
                  ${isActive ? 'text-white' : 'text-gray-400'}
                `}>
                  {item.icon}
                </span>
                
                {/* Menu text */}
                <span className={`
                  font-medium text-left flex-1 transition-all duration-200
                  ${isActive ? 'font-bold text-white' : 'text-gray-300'}
                `}>
                  {item.name}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
                
                {/* Hover indicator - ONLY shows when active AND hovered */}
                {isActive && isHovered && (
                  <svg 
                    className="w-4 h-4 text-white/80 transform transition-transform duration-200" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                
                {/* Subtle glow effect on hover - ONLY when active */}
                {isActive && isHovered && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Section with Logout */}
        <div className="p-4 border-t border-gray-700 space-y-4">
          {/* Store Stats (Optional) */}
          <div className="text-xs text-gray-400 px-2">
            <p>Store ID: {seller?.seller_id ? `#${seller.seller_id}` : 'N/A'}</p>
            <p>Last login: Today</p>
          </div>
          
          {/* Logout Button - Always shows hover effects */}
          <div className="relative group">
            <button
              onClick={handleLogout}
              onMouseEnter={() => setHoveredItem('logout')}
              onMouseLeave={handleMouseLeave}
              className={`
                w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl
                transition-all duration-300 ease-out
                ${hoveredItem === 'logout'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-lg transform scale-[1.02]'
                  : 'bg-gradient-to-r from-red-500/90 to-red-600/90 shadow-md'
                }
                relative overflow-hidden
              `}
            >
              {/* Hover glow effect */}
              {hoveredItem === 'logout' && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-orange-400/10"></div>
              )}
              
              {/* Animated icon */}
              <span className={`
                transition-all duration-300
                ${hoveredItem === 'logout' ? 'transform scale-110' : ''}
                ${hoveredItem === 'logout' ? 'text-white' : 'text-white/90'}
              `}>
                {menuIcons.logout}
              </span>
              
              {/* Text */}
              <span className={`
                font-medium transition-all duration-300
                ${hoveredItem === 'logout' ? 'font-semibold text-white' : 'text-white/90'}
              `}>
                Logout
              </span>
              
              {/* Animated arrow on hover */}
              {hoveredItem === 'logout' && (
                <svg 
                  className="w-4 h-4 text-white/80 transform transition-transform duration-300 ml-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              )}
            </button>
            
            {/* Tooltip on hover */}
            {hoveredItem === 'logout' && (
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Sign out from your account
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}