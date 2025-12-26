"use client";

import { useState, useEffect, useMemo } from "react";
import AdminSidebar from "../../components/adminSidebar";
import AdminTopbar from "../../components/AdminTopbar";
import { useUserStore, type Customer, type Seller, type UserStatus } from "@/app/ZustandStore/Admin/userStore";

// Type guard functions using imported types
const isCustomer = (user: Customer | Seller): user is Customer => {
  return 'id' in user && 'name' in user;
};

const isSeller = (user: Customer | Seller): user is Seller => {
  return 'seller_id' in user && 'businessName' in user;
};

// Helper functions for safe UI display
const getUserDisplayName = (user: Customer | Seller): string => {
  if (isCustomer(user)) return user.name;
  if (isSeller(user)) return user.businessName;
  return "Unknown User";
};

const getUserEmail = (user: Customer | Seller): string => {
  if (isCustomer(user)) return user.email;
  if (isSeller(user)) return user.businessEmail;
  return "No Email";
};

const getUserId = (user: Customer | Seller): string => {
  if (isCustomer(user)) return user.id.toString();
  if (isSeller(user)) return user.seller_id.toString();
  return "N/A";
};

export default function UsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"customers" | "sellers" | "suspended">("customers");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Customer | Seller | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "activate" | "delete" | "promote">("suspend");

  const { customers, sellers, getAllCustomers, getAllSellers, loading, error, suspendUser, activateUser } = useUserStore();

  // Load data when component mounts or tab changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === "customers") {
          await getAllCustomers();
        } else if (activeTab === "sellers") {
          await getAllSellers();
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [activeTab, getAllCustomers, getAllSellers]);

  // User filters
  const [customerFilters, setCustomerFilters] = useState({
    status: "all",
    activity: "all",
    registrationDate: "all",
    orderCount: "all"
  });

  const [sellerFilters, setSellerFilters] = useState({
    status: "all",
    rating: "all",
    performance: "all"
  });

  const [suspendedFilters, setSuspendedFilters] = useState({
    suspensionType: "all",
    duration: "all",
    reason: "all"
  });

  // Action form state
  const [actionForm, setActionForm] = useState({
    reason: "",
    duration: "",
    notes: "",
    notifyUser: true
  });

  const handleUserAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const uType = isCustomer(selectedUser) ? 'CUSTOMER' : 'SELLER';
    const uId = isCustomer(selectedUser) ? selectedUser.id : selectedUser.seller_id;

    try {
      if (actionType === "suspend") {
        await suspendUser(uId, uType, actionForm.reason, actionForm.duration, actionForm.notes);
      } else if (actionType === "activate") {
        await activateUser(uId, uType, actionForm.notes);
      }
      setShowActionModal(false);
      setActionForm({ reason: "", duration: "", notes: "", notifyUser: true });
    } catch (err) {
      console.error("Action failed:", err);
      alert("Action failed. Check console.");
    }
  };

  const handleBanUser = () => {
    console.log("Banning user", selectedUser);
    setShowBanModal(false);
  };

  const handleViewDetails = (user: Customer | Seller) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  // Memoized filtered results
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = 
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.id?.toString().includes(searchTerm);

      const matchesStatus = 
        customerFilters.status === "all" || 
        customer.status.toLowerCase() === customerFilters.status.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, customerFilters]);

  const filteredSellers = useMemo(() => {
    return sellers.filter(seller => {
      const matchesSearch = 
        seller.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.businessEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.seller_id?.toString().includes(searchTerm) ||
        seller.businessAddress?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        sellerFilters.status === "all" || 
        seller.status.toLowerCase() === sellerFilters.status.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [sellers, searchTerm, sellerFilters]);

  // Get suspended users
  const allSuspended: (Customer | Seller)[] = useMemo(() => {
    return [
      ...customers.filter(c => c.status === "SUSPENDED"),
      ...sellers.filter(s => s.status === "SUSPENDED")
    ];
  }, [customers, sellers]);

  // Filter suspended users
  const filteredSuspended = useMemo(() => {
    return allSuspended.filter(user => {
      const displayName = getUserDisplayName(user).toLowerCase();
      const email = getUserEmail(user).toLowerCase();
      const id = getUserId(user);
      
      const matchesSearch = 
        displayName.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase()) ||
        id.includes(searchTerm);

      return matchesSearch;
    });
  }, [allSuspended, searchTerm]);

  // Calculate statistics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === "ACTIVE").length;
  const newThisMonth = customers.filter(c => {
    const createdAt = new Date(c.createdAt);
    const now = new Date();
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
    return createdAt > monthAgo;
  }).length;

  const totalSellers = sellers.length;
  const activeSellers = sellers.filter(s => s.status === "ACTIVE").length;
  const totalSuspended = allSuspended.length;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get status badge color
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Check if there are results for the current tab
  const hasResults = () => {
    if (activeTab === "customers") return filteredCustomers.length > 0;
    if (activeTab === "sellers") return filteredSellers.length > 0;
    if (activeTab === "suspended") return filteredSuspended.length > 0;
    return false;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <AdminTopbar 
            title="User Management"
            subtitle="Manage customers, sellers, and suspended accounts"
            onMenuClick={() => setSidebarOpen(true)}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("customers")}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "customers"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>👥</span>
                <span>Customers ({totalCustomers})</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("sellers")}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "sellers"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🏪</span>
                <span>Sellers ({totalSellers})</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("suspended")}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "suspended"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🚫</span>
                <span>Suspended Accounts ({totalSuspended})</span>
              </span>
            </button>
          </div>

          {/* Header with Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {activeTab === "customers" && "Customer Management"}
                {activeTab === "sellers" && "Seller Management"}
                {activeTab === "suspended" && "Suspended Accounts"}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeTab === "customers" && "Manage customer accounts and activities"}
                {activeTab === "sellers" && "Monitor seller performance and compliance"}
                {activeTab === "suspended" && "Review and manage suspended accounts"}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {activeTab === "customers" && (
                <button
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {/* Export customers */}}
                >
                  <span>📊</span>
                  <span>Export List</span>
                </button>
              )}

              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                onClick={() => {
                  if (activeTab === "customers") getAllCustomers();
                  else if (activeTab === "sellers") getAllSellers();
                  else {
                    getAllCustomers();
                    getAllSellers();
                  }
                }}
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading {activeTab} data...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <p className="text-red-700">{error}</p>
              </div>
              <button 
                onClick={() => {
                  if (activeTab === "customers") getAllCustomers();
                  else if (activeTab === "sellers") getAllSellers();
                  else {
                    getAllCustomers();
                    getAllSellers();
                  }
                }}
                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {/* User Statistics */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Dynamic Stats based on Active Tab */}
              {activeTab === "customers" && (
                <>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-2xl text-blue-600">👥</span>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Total Customers</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{totalCustomers}</p>
                        <p className="text-gray-500 text-xs mt-2">Registered accounts</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-2xl text-green-600">✅</span>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Active Customers</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{activeCustomers}</p>
                        <p className="text-gray-500 text-xs mt-2">Currently active</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-2xl text-purple-600">📈</span>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">New This Month</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{newThisMonth}</p>
                        <p className="text-gray-500 text-xs mt-2">30-day growth</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-2xl text-yellow-600">💰</span>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Avg. Spent</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                          {customers.length > 0 
                            ? formatCurrency(customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / customers.length)
                            : "Rs 0.00"
                          }
                        </p>
                        <p className="text-gray-500 text-xs mt-2">Per customer</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "sellers" && (
                <>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-2xl text-green-600">🏪</span>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Total Sellers</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{totalSellers}</p>
                        <p className="text-gray-500 text-xs mt-2">Registered sellers</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-2xl text-blue-600">✅</span>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Active Sellers</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{activeSellers}</p>
                        <p className="text-gray-500 text-xs mt-2">Currently active</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-2xl text-purple-600">⭐</span>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Avg. Seller Rating</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                          {sellers.length > 0 
                            ? (sellers.reduce((sum, s) => sum + (s.rating || 0), 0) / sellers.length).toFixed(1)
                            : "0.0"
                          }
                        </p>
                        <p className="text-gray-500 text-xs mt-2">Customer feedback</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-2xl text-blue-600">📦</span>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Total Products</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                          {sellers.reduce((sum, s) => sum + (s.totalProducts || 0), 0)}
                        </p>
                        <p className="text-gray-500 text-xs mt-2">Across all sellers</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "suspended" && (
                <>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-2xl text-red-600">🚫</span>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Total Suspended</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{totalSuspended}</p>
                        <p className="text-gray-500 text-xs mt-2">All account types</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-2xl text-orange-600">⏰</span>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Suspended Customers</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{allSuspended.filter(isCustomer).length}</p>
                        <p className="text-gray-500 text-xs mt-2">Customer accounts</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-2xl text-gray-600">🏪</span>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Suspended Sellers</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{allSuspended.filter(isSeller).length}</p>
                        <p className="text-gray-500 text-xs mt-2">Seller accounts</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-2xl text-blue-600">📈</span>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Appeals Pending</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">0</p>
                        <p className="text-gray-500 text-xs mt-2">Review requests</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={
                      activeTab === "customers" 
                        ? "Search customers by name, email, or ID..." 
                        : activeTab === "sellers"
                          ? "Search sellers by name, store, or ID..."
                          : "Search suspended accounts by name, email, or ID..."
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                </div>
              </div>

              {/* Tab-specific Filters */}
              <div className="flex items-center gap-4 flex-wrap">
                {activeTab === "customers" && (
                  <>
                    <select 
                      title="filter"
                      value={customerFilters.status}
                      onChange={(e) => setCustomerFilters({...customerFilters, status: e.target.value})}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>

                    <select 
                      title="filter"
                      value={customerFilters.orderCount}
                      onChange={(e) => setCustomerFilters({...customerFilters, orderCount: e.target.value})}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm"
                    >
                      <option value="all">Any Orders</option>
                      <option value="none">No Orders</option>
                      <option value="1-5">1-5 Orders</option>
                      <option value="5-20">5-20 Orders</option>
                      <option value="20+">20+ Orders</option>
                    </select>
                  </>
                )}

                {activeTab === "sellers" && (
                  <>
                    <select 
                      title="seller filter"
                      value={sellerFilters.status}
                      onChange={(e) => setSellerFilters({...sellerFilters, status: e.target.value})}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </>
                )}

                {activeTab === "suspended" && (
                  <>
                    <select 
                      title="suspension filter"
                      value={suspendedFilters.suspensionType}
                      onChange={(e) => setSuspendedFilters({...suspendedFilters, suspensionType: e.target.value})}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="customer">Customer Accounts</option>
                      <option value="seller">Seller Accounts</option>
                    </select>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {!loading && !error && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {activeTab === "customers" && filteredCustomers.length > 0 && (
                  <>
                    <button 
                      onClick={() => {
                        setActionType("suspend");
                        setShowActionModal(true);
                      }}
                      className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-4 hover:bg-red-100 transition-colors"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-2">🚫</span>
                        <span className="font-medium">Suspend Selected</span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setActionType("activate");
                        setShowActionModal(true);
                      }}
                      className="border border-green-200 bg-green-50 text-green-700 rounded-lg p-4 hover:bg-green-100 transition-colors"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-2">✅</span>
                        <span className="font-medium">Activate/Deactivate</span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setShowBanModal(true)}
                      className="border border-yellow-200 bg-yellow-50 text-yellow-700 rounded-lg p-4 hover:bg-yellow-100 transition-colors"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-2">⚠️</span>
                        <span className="font-medium">Send Warning</span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setActionType("promote");
                        setShowActionModal(true);
                      }}
                      className="border border-blue-200 bg-blue-50 text-blue-700 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-2">⭐</span>
                        <span className="font-medium">Promote to VIP</span>
                      </div>
                    </button>
                  </>
                )}

                {activeTab === "sellers" && filteredSellers.length > 0 && (
                  <>
                    <button 
                      onClick={() => {
                        setActionType("suspend");
                        setShowActionModal(true);
                      }}
                      className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-4 hover:bg-red-100 transition-colors"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-2">🚫</span>
                        <span className="font-medium">Suspend Selected</span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setActionType("activate");
                        setShowActionModal(true);
                      }}
                      className="border border-blue-200 bg-blue-50 text-blue-700 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-2">🔄</span>
                        <span className="font-medium">Activate/Deactivate</span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setShowBanModal(true)}
                      className="border border-yellow-200 bg-yellow-50 text-yellow-700 rounded-lg p-4 hover:bg-yellow-100 transition-colors"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-2">📋</span>
                        <span className="font-medium">Performance Review</span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setActionType("promote");
                        setShowActionModal(true);
                      }}
                      className="border border-purple-200 bg-purple-50 text-purple-700 rounded-lg p-4 hover:bg-purple-100 transition-colors"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-2">🏆</span>
                        <span className="font-medium">Feature Seller</span>
                      </div>
                    </button>
                  </>
                )}

                {activeTab === "suspended" && filteredSuspended.length > 0 && (
                  <>
                    <button 
                      onClick={() => {
                        setActionType("activate");
                        setShowActionModal(true);
                      }}
                      className="border border-green-200 bg-green-50 text-green-700 rounded-lg p-4 hover:bg-green-100 transition-colors"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-2">✅</span>
                        <span className="font-medium">Re-activate Selected</span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setActionType("delete");
                        setShowActionModal(true);
                      }}
                      className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-4 hover:bg-red-100 transition-colors"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-2">🗑️</span>
                        <span className="font-medium">Delete Permanently</span>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="border-b border-gray-200">
              {activeTab === "customers" && (
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-gray-600 text-sm font-medium">
                  <div className="col-span-1">ID</div>
                  <div className="col-span-2">Customer</div>
                  <div className="col-span-2">Contact</div>
                  <div className="col-span-1">Orders</div>
                  <div className="col-span-1">Spent</div>
                  <div className="col-span-2">Joined</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
              )}
              
              {activeTab === "sellers" && (
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-gray-600 text-sm font-medium">
                  <div className="col-span-1">ID</div>
                  <div className="col-span-2">Seller</div>
                  <div className="col-span-2">Store</div>
                  <div className="col-span-1">Rating</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2">Joined</div>
                  <div className="col-span-2">Products</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
              )}
              
              {activeTab === "suspended" && (
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-gray-600 text-sm font-medium">
                  <div className="col-span-1">ID</div>
                  <div className="col-span-2">Account</div>
                  <div className="col-span-1">Type</div>
                  <div className="col-span-2">Email</div>
                  <div className="col-span-2">Suspended On</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
              )}
            </div>

            {/* Table Body */}
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading {activeTab}...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-red-600">⚠️</span>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Error loading data</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <button
                  onClick={() => {
                    if (activeTab === "customers") getAllCustomers();
                    else if (activeTab === "sellers") getAllSellers();
                    else {
                      getAllCustomers();
                      getAllSellers();
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                {/* Customers Table */}
                {activeTab === "customers" && filteredCustomers.length > 0 && (
                  <div className="divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                      <div key={customer.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="col-span-1 text-gray-800 font-medium">
                          {customer.id}
                        </div>
                        <div className="col-span-2">
                          <div className="font-medium text-gray-800">{customer.name}</div>
                          <div className="text-gray-500 text-sm">{customer.email}</div>
                        </div>
                        <div className="col-span-2 text-gray-600">
                          {customer.mobileNumber || "No phone"}
                        </div>
                        <div className="col-span-1 text-gray-700">
                          {customer.totalOrders || 0}
                        </div>
                        <div className="col-span-1 text-gray-700">
                          {formatCurrency(customer.totalSpent || 0)}
                        </div>
                        <div className="col-span-2 text-gray-600">
                          {formatDate(customer.createdAt)}
                        </div>
                        <div className="col-span-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                            {customer.status}
                          </span>
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            onClick={() => handleViewDetails(customer)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(customer);
                              setActionType("suspend");
                              setShowActionModal(true);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Suspend
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sellers Table */}
                {activeTab === "sellers" && filteredSellers.length > 0 && (
                  <div className="divide-y divide-gray-200">
                    {filteredSellers.map((seller) => (
                      <div key={seller.seller_id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="col-span-1 text-gray-800 font-medium">
                          {seller.seller_id}
                        </div>
                        <div className="col-span-2">
                          <div className="font-medium text-gray-800">{seller.businessName}</div>
                          <div className="text-gray-500 text-sm">{seller.businessEmail}</div>
                        </div>
                        <div className="col-span-2 text-gray-600 text-sm">
                          {seller.businessAddress?.substring(0, 30) || "No address"}...
                        </div>
                        <div className="col-span-1 text-gray-700">
                          {seller.rating ? `${seller.rating}★` : "N/A"}
                        </div>
                        <div className="col-span-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(seller.status)}`}>
                            {seller.status}
                          </span>
                        </div>
                        <div className="col-span-2 text-gray-600">
                          {formatDate(seller.createdAt)}
                        </div>
                        <div className="col-span-2 text-gray-700">
                          {seller.totalProducts || 0}
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            onClick={() => handleViewDetails(seller)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(seller);
                              setActionType("suspend");
                              setShowActionModal(true);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Suspend
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suspended Accounts Table - FIXED with type checking */}
                {activeTab === "suspended" && filteredSuspended.length > 0 && (
                  <div className="divide-y divide-gray-200">
                    {filteredSuspended.map((user) => (
                      <div key={getUserId(user)} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="col-span-1 text-gray-800 font-medium">
                          {getUserId(user)}
                        </div>
                        <div className="col-span-2">
                          <div className="font-medium text-gray-800">
                            {getUserDisplayName(user)}
                          </div>
                          <div className="text-gray-500 text-sm">
                            {getUserEmail(user)}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isCustomer(user) ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                          }`}>
                            {isCustomer(user) ? "Customer" : "Seller"}
                          </span>
                        </div>
                        <div className="col-span-2 text-gray-600">
                          {getUserEmail(user)}
                        </div>
                        <div className="col-span-2 text-gray-600">
                          {formatDate(user.createdAt)}
                        </div>
                        <div className="col-span-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </div>
                        <div className="col-span-2 text-right">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType("activate");
                              setShowActionModal(true);
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            Activate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {!hasResults() && (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {activeTab === "customers" && <span className="text-2xl text-gray-400">👥</span>}
                      {activeTab === "sellers" && <span className="text-2xl text-gray-400">🏪</span>}
                      {activeTab === "suspended" && <span className="text-2xl text-gray-400">🚫</span>}
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      {searchTerm 
                        ? "No matching users found" 
                        : activeTab === "customers" 
                          ? "No customers found" 
                          : activeTab === "sellers"
                            ? "No sellers found"
                            : "No suspended accounts"
                      }
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm 
                        ? "Try adjusting your search or filters" 
                        : activeTab === "customers"
                          ? "Customer accounts will appear here"
                          : activeTab === "sellers"
                            ? "Seller accounts will appear here"
                            : "Suspended accounts will appear here"
                      }
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Additional Statistics */}
          {!loading && !error && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {activeTab === "customers" && "Customer Distribution"}
                    {activeTab === "sellers" && "Seller Performance"}
                    {activeTab === "suspended" && "Suspension Analytics"}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {activeTab === "customers" && `Total: ${totalCustomers} customers`}
                    {activeTab === "sellers" && `Total: ${totalSellers} sellers`}
                    {activeTab === "suspended" && `Total: ${totalSuspended} suspended accounts`}
                  </p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Detailed Report →
                </button>
              </div>
              
              <div className="h-64 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-gray-400">📊</span>
                  </div>
                  <p className="text-gray-500">
                    {activeTab === "customers" && `${totalCustomers} customers registered`}
                    {activeTab === "sellers" && `${totalSellers} sellers registered`}
                    {activeTab === "suspended" && `${totalSuspended} suspended accounts`}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    {activeTab === "customers" && "Data from GET /api/user/getallcustomers"}
                    {activeTab === "sellers" && "Data from GET /api/user/getallsellers"}
                    {activeTab === "suspended" && "Data from user accounts"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* User Details Modal - FIXED with type checking */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {isCustomer(selectedUser) ? "Customer Details" : "Seller Details"}
                </h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* User Info Header */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl text-gray-600">
                      {isCustomer(selectedUser) ? "👤" : "🏪"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      {isCustomer(selectedUser) ? selectedUser.name : selectedUser.businessName}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>ID: {isCustomer(selectedUser) ? selectedUser.id : selectedUser.seller_id}</span>
                      <span>•</span>
                      <span>Type: {isCustomer(selectedUser) ? "Customer" : "Seller"}</span>
                      <span>•</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Account Information */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Account Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium">
                        {isCustomer(selectedUser) ? selectedUser.email : selectedUser.businessEmail}
                      </p>
                    </div>
                    {isCustomer(selectedUser) && selectedUser.mobileNumber && (
                      <div>
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="font-medium">{selectedUser.mobileNumber}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Registration Date</p>
                      <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                    {isCustomer(selectedUser) && selectedUser.lastActive && (
                      <div>
                        <p className="text-sm text-gray-500">Last Active</p>
                        <p className="font-medium">{formatDate(selectedUser.lastActive)}</p>
                      </div>
                    )}
                    {isSeller(selectedUser) && selectedUser.businessAddress && (
                      <div>
                        <p className="text-sm text-gray-500">Business Address</p>
                        <p className="font-medium">{selectedUser.businessAddress}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Activity Summary</h4>
                  <div className="space-y-3">
                    {isCustomer(selectedUser) ? (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Total Orders</p>
                          <p className="font-medium">{selectedUser.totalOrders || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Spent</p>
                          <p className="font-medium">{formatCurrency(selectedUser.totalSpent || 0)}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Rating</p>
                          <p className="font-medium">{selectedUser.rating ? `${selectedUser.rating}★` : "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Products</p>
                          <p className="font-medium">{selectedUser.totalProducts || 0}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowUserDetails(false);
                    setShowActionModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Take Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {actionType === "suspend" && "Suspend Account"}
                  {actionType === "activate" && "Activate Account"}
                  {actionType === "delete" && "Delete Account"}
                  {actionType === "promote" && "Promote Account"}
                </h3>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUserAction}>
                <div className="space-y-4">
                  {/* Action Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {actionType === "suspend" && "Suspension Reason *"}
                      {actionType === "activate" && "Activation Notes"}
                      {actionType === "delete" && "Deletion Reason *"}
                      {actionType === "promote" && "Promotion Reason"}
                    </label>
                    <textarea
                      required={actionType === "suspend" || actionType === "delete"}
                      value={actionForm.reason}
                      onChange={(e) => setActionForm({...actionForm, reason: e.target.value})}
                      placeholder={
                        actionType === "suspend" 
                          ? "Why is this account being suspended?" 
                          : actionType === "activate"
                            ? "Notes about reactivation..."
                            : actionType === "delete"
                              ? "Why is this account being deleted?"
                              : "Reason for promotion..."
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Duration (for suspensions) */}
                  {actionType === "suspend" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Suspension Duration
                      </label>
                      <select
                        title="duration"
                        value={actionForm.duration}
                        onChange={(e) => setActionForm({...actionForm, duration: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Duration</option>
                        <option value="7days">7 Days</option>
                        <option value="30days">30 Days</option>
                        <option value="90days">90 Days</option>
                        <option value="permanent">Permanent</option>
                        <option value="custom">Custom Duration</option>
                      </select>
                    </div>
                  )}

                  {/* Internal Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Internal Notes
                    </label>
                    <textarea
                      value={actionForm.notes}
                      onChange={(e) => setActionForm({...actionForm, notes: e.target.value})}
                      placeholder="Additional notes for the admin team..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Notification Option */}
                  <div className="flex items-center">
                    <input
                      title="notify"
                      type="checkbox"
                      checked={actionForm.notifyUser}
                      onChange={(e) => setActionForm({...actionForm, notifyUser: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Notify user about this action
                    </span>
                  </div>

                  {/* Warning for destructive actions */}
                  {(actionType === "delete" || actionType === "suspend") && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex">
                        <span className="text-yellow-500 mr-2">⚠️</span>
                        <p className="text-sm text-yellow-700">
                          <strong>Warning:</strong> This action will affect user access.
                          {actionType === "delete" && " Account deletion cannot be undone."}
                          {actionType === "suspend" && " User will lose access to their account."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowActionModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-lg ${
                      actionType === "suspend" 
                        ? "bg-red-600 hover:bg-red-700"
                        : actionType === "activate"
                          ? "bg-green-600 hover:bg-green-700"
                          : actionType === "delete"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {actionType === "suspend" && "Suspend Account"}
                    {actionType === "activate" && "Activate Account"}
                    {actionType === "delete" && "Delete Account"}
                    {actionType === "promote" && "Promote Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ban/Warning Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {activeTab === "suspended" ? "Review Appeal" : "Send Warning"}
                </h3>
                <button
                  onClick={() => setShowBanModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {activeTab === "suspended" ? "Appeal Response" : "Warning Message"}
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      activeTab === "suspended" 
                        ? "Write your response to the appeal..." 
                        : "Write the warning message to the user..."
                    }
                  />
                </div>

                {activeTab === "suspended" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Final Decision
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="radio" name="decision" value="approve" className="mr-2" />
                        <span>Approve Appeal (Re-activate account)</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="decision" value="deny" className="mr-2" />
                        <span>Deny Appeal (Keep suspended)</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="decision" value="modify" className="mr-2" />
                        <span>Modify Suspension (Change duration)</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex">
                    <span className="text-blue-500 mr-2">💡</span>
                    <p className="text-sm text-blue-700">
                      {activeTab === "suspended" 
                        ? "Review the appeal carefully before making a decision."
                        : "Warnings should be clear, professional, and specify the violation."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBanModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {activeTab === "suspended" ? "Submit Decision" : "Send Warning"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}