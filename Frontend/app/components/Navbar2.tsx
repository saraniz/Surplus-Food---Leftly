"use client";

import { motion } from "framer-motion";
import { lora, alconica } from "@/app/libs/fonts";
import { ShoppingCart, User, Search, LogOut, Settings, Package, Store, ChefHat, Menu, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCusAuthStore } from "../ZustandStore/authStore";
import { useCartState } from "../ZustandStore/cartStore";
import { usePathname } from "next/navigation";

export default function Navbar2() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [effectiveRole, setEffectiveRole] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean>(false);
  
  const pathname = usePathname();
  const { customer, seller, token, logout, fetchCusDetails, fetchSellerDetails } = useCusAuthStore();
  const { cart, fetchCart } = useCartState();
  
  // Navigation items
  const navItems = [
    { name: "Home", path: "/", icon: null },
    { name: "Meals", path: "/homepage", icon: null },
    { name: "Mystery", path: "/mystery", icon: null },
    { name: "About", path: "/aboutus", icon: null },
    { name: "Contact", path: "/contact", icon: null },
  ];
  
  // Check if a nav item is active
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };
  
  // Helper function to validate and decode token
  const validateAndDecodeToken = () => {
    if (typeof window === 'undefined') return { isValid: false, role: null, isExpired: false };
    
    const storedToken = localStorage.getItem("token");
    
    if (!storedToken) {
      return { isValid: false, role: null, isExpired: false };
    }
    
    try {
      const payload = JSON.parse(atob(storedToken.split('.')[1]));
      const isExpired = Date.now() >= payload.exp * 1000;
      const role = payload.role;
      
      if (isExpired) {
        return { isValid: false, role: null, isExpired: true };
      }
      
      return { 
        isValid: true, 
        role, 
        isExpired: false,
        payload 
      };
    } catch (error) {
      return { isValid: false, role: null, isExpired: false };
    }
  };
  
  useEffect(() => {
    setIsMounted(true);
    
    // First, validate the token
    const tokenValidation = validateAndDecodeToken();
    setIsValidToken(tokenValidation.isValid);
    setEffectiveRole(tokenValidation.role);
    
    // Check if we should fetch user data
    if (tokenValidation.isValid && tokenValidation.role) {
      console.log("Valid token found, role:", tokenValidation.role);
      
      if (tokenValidation.role === "customer" && !customer) {
        console.log("Fetching customer details...");
        fetchCusDetails();
      } else if (tokenValidation.role === "seller" && !seller) {
        console.log("Fetching seller details...");
        const sellerId = localStorage.getItem("sellerId") || tokenValidation.payload?.id;
        if (sellerId) {
          fetchSellerDetails(parseInt(sellerId));
        } else {
          console.log("No sellerId available for fetching seller details");
        }
      }
    } else {
      console.log("No valid token found or token invalid");
    }
    
    // ALWAYS fetch cart (it will handle guest/seller logic internally)
    fetchCart();
    
    // Add scroll effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [token, customer, seller, fetchCusDetails, fetchSellerDetails, fetchCart, logout]);

  // FIXED: More strict check for logged in status
  const isLoggedIn = () => {
    // Check if we have a valid token
    if (!isValidToken) {
      console.log("Token invalid or expired, not logged in");
      return false;
    }
    
    // Check if we have matching user data in Zustand store
    if (effectiveRole === "customer" && customer) {
      return true;
    }
    
    if (effectiveRole === "seller" && seller) {
      return true;
    }

    return true;
  };

  const getCartItemCount = () => {
    if (!cart || !cart.cartItems) return 0;
    return cart.cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const isUserLoggedIn = isLoggedIn();
  const user = customer || seller;
  const cartItemCount = getCartItemCount();

  // Get greeting text for the button
  const getGreetingText = () => {
    if (!isUserLoggedIn) return "Sign In";
    
    if (!user) return "Sign In";
    
    if (effectiveRole === "customer") {
      const customerName = (user as any)?.name;
      return customerName ? `${customerName.split(' ')[0]}` : "Account";
    } else if (effectiveRole === "seller") {
      const storeName = (user as any)?.businessName;
      return storeName ? `${storeName}` : "Seller";
    }
    return "Account";
  };

  // Get user display name for dropdown
  const getUserDisplayName = () => {
    if (!isUserLoggedIn) return "Not logged in";
    
    if (!user) return "Loading...";
    
    if (effectiveRole === "customer") {
      return customer?.name || "Customer";
    } else if (effectiveRole === "seller") {
      return seller?.businessName || "Seller";
    }
    return "User";
  };

  const handleLogout = () => {
    // Call Zustand logout to clear store state
    logout();
    
    setIsDropdownOpen(false);
    window.location.href = '/';
  };

  if (!isMounted) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse"></div>
              <div className="h-6 w-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="h-16"></div>
      </nav>
    );
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled 
            ? "bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm" 
            : "bg-white/80 backdrop-blur-lg border-b border-gray-100/30"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo - Modernized */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 group"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-green-500/20 to-yellow-500/20 blur-lg rounded-full"
                />
                <div className="relative bg-gradient-to-br from-green-500 via-green-600 to-yellow-500 w-8 h-8 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-green-200/50 transition-shadow">
                  <span className={`${alconica.className} text-white text-lg font-bold tracking-tighter`}>L</span>
                </div>
              </div>
              <div className={`${alconica.className} text-gray-900 text-xl font-bold tracking-tight relative`}>
                Leftly
                <span className="absolute -right-2 top-0 text-green-500 text-xl">.</span>
              </div>
            </motion.div>

            {/* Navigation Links - Modernized with Hover Effects */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <motion.div 
                    key={item.name} 
                    whileHover={{ y: -1 }} 
                    className="relative group"
                  >
                    <Link
                      href={item.path || "#"}
                      className={`relative flex items-center py-2 px-4 transition-all duration-200 ${
                        active
                          ? "text-gray-900 font-semibold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <span className={`${lora.className} font-medium text-sm tracking-wide relative z-10`}>
                        {item.name}
                      </span>
                      
                      {/* Active Underline */}
                      {active && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-gradient-to-r from-green-500 to-yellow-400 rounded-full"
                          initial={false}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      
                      {/* Hover Underline Effect */}
                      {!active && (
                        <motion.div
                          className="absolute bottom-0 left-1/2 right-1/2 h-0.5 bg-gradient-to-r from-green-400 to-yellow-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:left-0 group-hover:right-0 transition-all duration-300"
                          initial={false}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Right Side Actions - Modernized */}
            <div className="flex items-center space-x-3">
              
              {/* Cart - ALWAYS SHOW for everyone (logged in or not) */}
              <Link href="/cart">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button className="relative flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-b from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 border border-gray-200/50 shadow-xs hover:shadow-sm transition-all duration-200">
                    <ShoppingCart className="w-4 h-4 text-gray-600" />
                    <span className={`${lora.className} text-gray-700 text-sm hidden md:block`}>
                      Cart
                    </span>
                    {cartItemCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs rounded-full font-bold min-w-[18px] h-[18px] flex items-center justify-center shadow-sm"
                      >
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </motion.span>
                    )}
                  </button>
                </motion.div>
              </Link>

              {/* Check login status */}
              {isUserLoggedIn ? (
                <>
                  {/* User dropdown - Modern */}
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-gray-50/50 transition-all duration-200 group"
                    >
                      <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                        {effectiveRole === "customer" && customer?.cusProfileImg ? (
                          <img 
                            src={customer.cusProfileImg} 
                            alt={customer.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : effectiveRole === "seller" && seller?.storeImg ? (
                          <img 
                            src={seller.storeImg} 
                            alt={seller.businessName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <span className={`${lora.className} text-gray-700 text-sm hidden md:block`}>
                        {getGreetingText()}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </motion.button>

                    {/* Dropdown Menu - Modern */}
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-200/50 backdrop-blur-lg overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {getUserDisplayName()}
                          </p>
                          <span className="inline-block mt-1 px-2.5 py-0.5 text-xs bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-full border border-green-100">
                            {effectiveRole ? effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1) : "User"}
                          </span>
                          
                          {/* Show warning for seller trying to use cart */}
                          {effectiveRole === "seller" && (
                            <p className="text-xs text-yellow-600 mt-2">
                              ⚠️ Seller accounts use guest cart
                            </p>
                          )}
                        </div>
                        
                        <div className="py-2">
                          <Link 
                            href={effectiveRole === "customer" ? "/customerdashboard" : "/sellerdashboard"} 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors group"
                          >
                            <div className="mr-3 w-4 h-4 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                            </div>
                            {effectiveRole === "customer" ? "My Profile" : "Dashboard"}
                          </Link>
                          
                          {/* Cart in dropdown for customers and sellers (both use cart) */}
                          {(effectiveRole === "customer" || effectiveRole === "seller") && (
                            <Link 
                              href="/cart" 
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors group"
                            >
                              <div className="mr-3 w-4 h-4 flex items-center justify-center">
                                <ShoppingCart className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                              </div>
                              My Cart {cartItemCount > 0 && `(${cartItemCount})`}
                              {effectiveRole === "seller" && (
                                <span className="ml-2 text-xs text-yellow-600">(Guest)</span>
                              )}
                            </Link>
                          )}
                          
                          {effectiveRole === "customer" && (
                            <>
                              <Link 
                                href="/customerdashboard/orderhistory" 
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors group"
                              >
                                <div className="mr-3 w-4 h-4 flex items-center justify-center">
                                  <Package className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                                </div>
                                My Orders
                              </Link>
                              
                            </>
                          )}
                          
                          {effectiveRole === "seller" && (
                            <>
                              <Link 
                                href="/sellerdashboard/allproducts" 
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors group"
                              >
                                <div className="mr-3 w-4 h-4 flex items-center justify-center">
                                  <Store className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                                </div>
                                My Products
                              </Link>
                              <Link 
                                href="/sellerdashboard/analytics" 
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors group"
                              >
                                <div className="mr-3 w-4 h-4 flex items-center justify-center">
                                  <Settings className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                                </div>
                                Analytics
                              </Link>
                            </>
                          )}
                          
                          
                        </div>
                        
                        <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/80 transition-colors group"
                          >
                            <div className="mr-3 w-4 h-4 flex items-center justify-center">
                              <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                            </div>
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                // Not logged in - Show Sign In and Register buttons
                <div className="flex items-center space-x-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/login">
                      <button className={`${lora.className} px-4 py-2 rounded-xl font-semibold text-white 
                        bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700
                        shadow-xs hover:shadow-sm transition-all duration-200 text-sm`}>
                        Sign In
                      </button>
                    </Link>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="hidden md:block"
                  >
                    <Link href="/register">
                      <button className={`${lora.className} px-4 py-2 rounded-xl font-semibold
                        border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50/50
                        shadow-xs hover:shadow-sm transition-all duration-200 text-sm`}>
                        Register
                      </button>
                    </Link>
                  </motion.div>
                </div>
              )}

              {/* Mobile Menu Button - Modern */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="lg:hidden p-2 rounded-xl bg-gray-50/50 hover:bg-gray-100 text-gray-700 transition-colors duration-200 border border-gray-200/50"
              >
                <Menu className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Mobile Search Bar - Modern */}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={isSearchOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden"
          >
            <div className="py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search restaurants or dishes..."
                  className={`${lora.className} w-full pl-9 pr-4 py-2.5 bg-white 
                    border border-gray-300 rounded-xl text-gray-700 placeholder-gray-400 
                    focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 
                    text-sm transition-all duration-200 shadow-sm`}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.nav>

      <div className="h-16"></div>
    </>
  );
}