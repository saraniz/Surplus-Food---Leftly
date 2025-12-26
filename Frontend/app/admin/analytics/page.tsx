// app/admin/analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "../../ZustandStore/Admin/userStore";
import { useOrderStore } from "../../ZustandStore/orderStore";
import AdminSidebar from "../../components/adminSidebar";
import AdminTopbar from "../../components/AdminTopbar";

export default function AnalyticsPage() {
  // User Store
  const {
    customers,
    sellers,
    analytics: userAnalytics,
    loading: userLoading,
    error: userError,
    getAllCustomers,
    getAllSellers,
    getUserAnalytics
  } = useUserStore();

  // Order Store
  const {
    order: orders,
    loading: orderLoading,
    error: orderError,
    getOrders
  } = useOrderStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "orders">("users");
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });

  // Initialize with default filters
  const [userFilters, setUserFilters] = useState({
    userType: "all",
    activityLevel: "all",
    registrationPeriod: "all",
    location: "all"
  });

  const [orderFilters, setOrderFilters] = useState({
    orderType: "all",
    paymentMethod: "all",
    deliveryType: "all",
    minAmount: "",
    maxAmount: ""
  });

  // Fetch data on mount and when active tab changes
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === "users") {
        await Promise.all([
          getAllCustomers(),
          getAllSellers(),
          getUserAnalytics()
        ]);
      } else {
        await getOrders();
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExportAnalytics = (format: string) => {
    console.log(`Exporting ${activeTab} analytics in ${format} format`);
    setShowExportOptions(false);
  };

  const applyUserFilters = () => {
    console.log("Applying user filters:", userFilters);
    // Filter logic would go here
  };

  const applyOrderFilters = () => {
    console.log("Applying order filters:", orderFilters);
    // Filter logic would go here
  };

  const handleTabChange = (tab: "users" | "orders") => {
    setActiveTab(tab);
    // Reset filters when changing tabs
    if (tab === "users") {
      setUserFilters({
        userType: "all",
        activityLevel: "all",
        registrationPeriod: "all",
        location: "all"
      });
    } else {
      setOrderFilters({
        orderType: "all",
        paymentMethod: "all",
        deliveryType: "all",
        minAmount: "",
        maxAmount: ""
      });
    }
  };

  // Calculate derived user metrics
  const getUserMetrics = () => {
    const totalUsers = customers.length + sellers.length;
    const newCustomers = customers.filter(c => {
      const createdAt = new Date(c.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdAt > thirtyDaysAgo;
    }).length;

    const newSellers = sellers.filter(s => {
      const createdAt = new Date(s.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdAt > thirtyDaysAgo;
    }).length;

    const activeCustomers = customers.filter(c => c.status === "ACTIVE").length;
    const activeSellers = sellers.filter(s => s.status === "ACTIVE").length;

    return {
      totalUsers,
      newCustomers,
      newSellers,
      activeCustomers,
      activeSellers,
      customerGrowth: userAnalytics?.customerGrowth || [],
      sellerGrowth: userAnalytics?.sellerGrowth || []
    };
  };

  // Calculate derived order metrics
  const getOrderMetrics = () => {
    if (!orders || !Array.isArray(orders)) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancellationRate: 0,
        satisfactionScore: 0,
        orderStatus: {},
        paymentMethods: {},
        topProducts: [],
        monthlyRevenue: userAnalytics?.monthlyRevenue || 0
      };
    }

    const completedOrders = orders.filter(o => o.status === "DELIVERED" || o.status === "COMPLETED");
    const pendingOrders = orders.filter(o => o.status === "PENDING" || o.status === "PROCESSING");
    const cancelledOrders = orders.filter(o => o.status === "CANCELLED");

    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders.length / totalOrders) * 100 : 0;

    // Calculate order status distribution
    const orderStatus: Record<string, number> = {};
    orders.forEach(order => {
      orderStatus[order.status] = (orderStatus[order.status] || 0) + 1;
    });

    // Calculate payment method distribution
    const paymentMethods: Record<string, number> = {};
    orders.forEach(order => {
      const method = order.paymentMethod || "Unknown";
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    // Get top products (simplified - would need product data)
    const topProducts = orders.slice(0, 5).map(order => ({
      productName: `Order #${order.order_id}`,
      revenue: order.totalPrice || 0,
      orders: 1
    }));

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      completedOrders: completedOrders.length,
      pendingOrders: pendingOrders.length,
      cancellationRate: parseFloat(cancellationRate.toFixed(2)),
      satisfactionScore: 4.5, // This would come from reviews
      orderStatus,
      paymentMethods,
      topProducts,
      monthlyRevenue: userAnalytics?.monthlyRevenue || 0
    };
  };

  const userMetrics = getUserMetrics();
  const orderMetrics = getOrderMetrics();

  const loading = activeTab === "users" ? userLoading : orderLoading;
  const error = activeTab === "users" ? userError : orderError;

  const getRetentionMetrics = () => {
    // Simplified retention metrics - would need actual retention data
    return {
      day1: 85, // Example values
      day7: 72,
      day30: 58,
      churn: 12
    };
  };

  const renderUserDemographics = () => {
    if (!customers.length) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Age Distribution</span>
            <span className="text-gray-400">--</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Gender Ratio</span>
            <span className="text-gray-400">--</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Top Locations</span>
            <span className="text-gray-400">--</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Device Usage</span>
            <span className="text-gray-400">--</span>
          </div>
        </div>
      );
    }

    // Calculate demographics from customers data
    const locations: Record<string, number> = {};
    customers.forEach(customer => {
      const location = customer.location || "Unknown";
      locations[location] = (locations[location] || 0) + 1;
    });

    const topLocations = Object.entries(locations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([location, count]) => ({ location, count }));

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Customers</span>
          <span className="font-bold text-gray-800">{customers.length}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Sellers</span>
          <span className="font-bold text-gray-800">{sellers.length}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Top Locations</span>
          <span className="text-gray-800 font-medium">
            {topLocations.map(loc => `${loc.location}: ${loc.count}`).join(', ')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Active Rate</span>
          <span className="font-bold text-gray-800">
            {userMetrics.totalUsers > 0 
              ? `${Math.round(((userMetrics.activeCustomers + userMetrics.activeSellers) / userMetrics.totalUsers) * 100)}%`
              : "0%"}
          </span>
        </div>
      </div>
    );
  };

  const renderPerformanceMetrics = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Revenue</span>
          <span className="font-bold text-gray-800">${orderMetrics.totalRevenue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Completed Orders</span>
          <span className="font-bold text-gray-800">{orderMetrics.completedOrders}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Cancellation Rate</span>
          <span className="font-bold text-gray-800">{orderMetrics.cancellationRate}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Avg. Order Value</span>
          <span className="font-bold text-gray-800">${orderMetrics.avgOrderValue.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  const renderTopProducts = () => {
    if (orderMetrics.topProducts.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <p>No order data available</p>
          <p className="text-sm">Complete some orders to see top products</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {orderMetrics.topProducts.slice(0, 5).map((product, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">{product.productName}</p>
              <p className="text-sm text-gray-600">{product.orders} order(s)</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800">${product.revenue.toLocaleString()}</p>
              <p className="text-sm text-green-600">Revenue</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getOrderStatusDistribution = () => {
    const statusOrder = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERING", "DELIVERED", "CANCELLED"];
    
    return statusOrder.map(status => ({
      status,
      count: orderMetrics.orderStatus[status] || 0,
      percentage: orderMetrics.totalOrders > 0 
        ? Math.round(((orderMetrics.orderStatus[status] || 0) / orderMetrics.totalOrders) * 100)
        : 0
    }));
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <AdminTopbar 
            title="Analytics Dashboard"
            subtitle="Comprehensive insights and data analysis"
            onMenuClick={() => setSidebarOpen(true)}
          />
        </div>

        {/* Error Messages */}
        {error && (
          <div className="m-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span>{error}</span>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => handleTabChange("users")}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "users"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>👥</span>
                <span>User Analytics</span>
                {loading && activeTab === "users" && <span className="animate-spin">⟳</span>}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("orders")}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "orders"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>📦</span>
                <span>Order Analytics</span>
                {loading && activeTab === "orders" && <span className="animate-spin">⟳</span>}
              </span>
            </button>
          </div>

          {/* Header with Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {activeTab === "users" ? "User Analytics" : "Order Analytics"}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeTab === "users" 
                  ? `Analyzing ${customers.length} customers and ${sellers.length} sellers` 
                  : `Analyzing ${orderMetrics.totalOrders} orders`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Date Range Picker */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateRangeChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Start Date"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateRangeChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="End Date"
                />
              </div>

              {/* Comparison Toggle */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={comparisonMode}
                  onChange={(e) => setComparisonMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-sm text-gray-700">Compare</span>
              </label>

              {/* Export Button */}
              <button
                onClick={() => setShowExportOptions(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                disabled={loading}
              >
                <span>📥</span>
                <span>Export</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <span>🔄</span>
                <span>{loading ? "Loading..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          {activeTab === "users" && (
            <>
              {/* User Analytics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-2xl text-blue-600">👥</span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {userMetrics.totalUsers.toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">Customers & Sellers</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-2xl text-green-600">📈</span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">New Users</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {(userMetrics.newCustomers + userMetrics.newSellers).toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">Last 30 days</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-2xl text-purple-600">📱</span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Active Users</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {(userMetrics.activeCustomers + userMetrics.activeSellers).toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">Currently active</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-2xl text-yellow-600">💰</span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        ${userAnalytics?.monthlyRevenue?.toLocaleString() || "0"}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">From all users</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - User Filters */}
                <div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">User Segments</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          User Type
                        </label>
                        <select
                          value={userFilters.userType}
                          onChange={(e) => setUserFilters({...userFilters, userType: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Users</option>
                          <option value="customers">Customers</option>
                          <option value="sellers">Sellers</option>
                          <option value="new">New Users</option>
                          <option value="returning">Returning Users</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Activity Level
                        </label>
                        <select
                          value={userFilters.activityLevel}
                          onChange={(e) => setUserFilters({...userFilters, activityLevel: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Activity Levels</option>
                          <option value="high">High Activity</option>
                          <option value="medium">Medium Activity</option>
                          <option value="low">Low Activity</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Registration Period
                        </label>
                        <select
                          value={userFilters.registrationPeriod}
                          onChange={(e) => setUserFilters({...userFilters, registrationPeriod: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Time</option>
                          <option value="week">Last 7 Days</option>
                          <option value="month">Last 30 Days</option>
                          <option value="quarter">Last 90 Days</option>
                          <option value="year">Last Year</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={applyUserFilters}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Apply Filters
                        </button>
                        <button 
                          onClick={() => setUserFilters({
                            userType: "all",
                            activityLevel: "all",
                            registrationPeriod: "all",
                            location: "all"
                          })}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* User Demographics */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Demographics</h3>
                    {renderUserDemographics()}
                  </div>
                </div>

                {/* Right Column - User Analytics Charts */}
                <div className="lg:col-span-2 space-y-6">
                  {/* User Growth Chart */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">User Growth Trend</h3>
                      <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700">
                        <option>Monthly</option>
                        <option>Weekly</option>
                        <option>Daily</option>
                        <option>Quarterly</option>
                      </select>
                    </div>
                    
                    <div className="h-64 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
                      {userMetrics.customerGrowth.length > 0 ? (
                        <div className="w-full h-full p-4">
                          <div className="text-sm text-gray-500 mb-2">
                            Showing user growth data
                          </div>
                          <div className="h-48 flex items-center justify-center">
                            <div className="text-center">
                              <p className="text-lg font-bold text-gray-800">{userMetrics.newCustomers} new customers</p>
                              <p className="text-gray-600 mt-2">+{userMetrics.newSellers} new sellers</p>
                              <p className="text-sm text-gray-500 mt-4">
                                Total growth: {userMetrics.newCustomers + userMetrics.newSellers} users
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl text-gray-400">📈</span>
                          </div>
                          <p className="text-gray-500">User growth visualization</p>
                          <p className="text-gray-400 text-sm mt-2">
                            {loading ? "Loading data..." : "No growth data available"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Activity Patterns */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">User Distribution</h3>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                          By Type
                        </button>
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                          By Status
                        </button>
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                          By Location
                        </button>
                      </div>
                    </div>
                    
                    <div className="h-48 bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 h-full">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-medium text-gray-800 mb-2">Customers</h4>
                          <p className="text-3xl font-bold text-blue-600">{customers.length}</p>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm">
                              <span>Active</span>
                              <span>{userMetrics.activeCustomers}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                              <span>New (30d)</span>
                              <span>{userMetrics.newCustomers}</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-medium text-gray-800 mb-2">Sellers</h4>
                          <p className="text-3xl font-bold text-green-600">{sellers.length}</p>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm">
                              <span>Active</span>
                              <span>{userMetrics.activeSellers}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                              <span>New (30d)</span>
                              <span>{userMetrics.newSellers}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Retention Metrics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Performance Metrics</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl text-blue-600">📊</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Customer Growth</p>
                    <p className="text-2xl font-bold text-gray-800">{userMetrics.newCustomers}</p>
                    <p className="text-xs text-gray-500">Last 30 days</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl text-green-600">📊</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Seller Growth</p>
                    <p className="text-2xl font-bold text-gray-800">{userMetrics.newSellers}</p>
                    <p className="text-xs text-gray-500">Last 30 days</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl text-purple-600">💰</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-800">
                      ${userAnalytics?.monthlyRevenue?.toLocaleString() || "0"}
                    </p>
                    <p className="text-xs text-gray-500">From all users</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl text-yellow-600">📈</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Active Rate</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {userMetrics.totalUsers > 0 
                        ? `${Math.round(((userMetrics.activeCustomers + userMetrics.activeSellers) / userMetrics.totalUsers) * 100)}%`
                        : "0%"}
                    </p>
                    <p className="text-xs text-gray-500">Currently active</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "orders" && (
            <>
              {/* Order Analytics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-2xl text-green-600">📦</span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {orderMetrics.totalOrders.toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">All time</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-2xl text-blue-600">💰</span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        ${orderMetrics.totalRevenue.toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">Gross revenue</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-2xl text-purple-600">📊</span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Avg. Order Value</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        ${orderMetrics.avgOrderValue.toFixed(2)}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">Per transaction</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-2xl text-yellow-600">✅</span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Completed Orders</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {orderMetrics.completedOrders.toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">Successfully delivered</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Order Filters */}
                <div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Filters</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Order Type
                        </label>
                        <select
                          value={orderFilters.orderType}
                          onChange={(e) => setOrderFilters({...orderFilters, orderType: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Orders</option>
                          <option value="delivery">Delivery</option>
                          <option value="pickup">Pickup</option>
                          <option value="dine_in">Dine-in</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Method
                        </label>
                        <select
                          value={orderFilters.paymentMethod}
                          onChange={(e) => setOrderFilters({...orderFilters, paymentMethod: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Methods</option>
                          <option value="cash">Cash</option>
                          <option value="card">Credit Card</option>
                          <option value="digital">Digital Wallet</option>
                          <option value="bank">Bank Transfer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Type
                        </label>
                        <select
                          value={orderFilters.deliveryType}
                          onChange={(e) => setOrderFilters({...orderFilters, deliveryType: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Types</option>
                          <option value="standard">Standard</option>
                          <option value="express">Express</option>
                          <option value="scheduled">Scheduled</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Min Amount</label>
                          <input
                            type="number"
                            value={orderFilters.minAmount}
                            onChange={(e) => setOrderFilters({...orderFilters, minAmount: e.target.value})}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Max Amount</label>
                          <input
                            type="number"
                            value={orderFilters.maxAmount}
                            onChange={(e) => setOrderFilters({...orderFilters, maxAmount: e.target.value})}
                            placeholder="99999"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={applyOrderFilters}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Apply Filters
                        </button>
                        <button 
                          onClick={() => setOrderFilters({
                            orderType: "all",
                            paymentMethod: "all",
                            deliveryType: "all",
                            minAmount: "",
                            maxAmount: ""
                          })}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Order Metrics */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h3>
                    {renderPerformanceMetrics()}
                  </div>

                  {/* Top Products */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
                    {renderTopProducts()}
                  </div>
                </div>

                {/* Right Column - Order Analytics Charts */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Revenue Chart */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">Revenue Overview</h3>
                      <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700">
                        <option>All Time</option>
                        <option>This Month</option>
                        <option>This Year</option>
                      </select>
                    </div>
                    
                    <div className="h-64 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
                      {orderMetrics.totalRevenue > 0 ? (
                        <div className="w-full h-full p-4">
                          <div className="text-center">
                            <p className="text-4xl font-bold text-gray-800">
                              ${orderMetrics.totalRevenue.toLocaleString()}
                            </p>
                            <p className="text-gray-600 mt-2">Total Revenue</p>
                            <div className="mt-6 grid grid-cols-2 gap-4">
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600">Avg. Order Value</p>
                                <p className="text-xl font-bold text-green-600">
                                  ${orderMetrics.avgOrderValue.toFixed(2)}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600">Completed Orders</p>
                                <p className="text-xl font-bold text-blue-600">
                                  {orderMetrics.completedOrders}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl text-gray-400">💰</span>
                          </div>
                          <p className="text-gray-500">Revenue overview</p>
                          <p className="text-gray-400 text-sm mt-2">
                            {loading ? "Loading data..." : "No revenue data available"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Status Distribution */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">Order Status Distribution</h3>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                          By Status
                        </button>
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                          By Payment
                        </button>
                      </div>
                    </div>
                    
                    <div className="h-48 bg-gray-50 rounded-lg p-4">
                      {orderMetrics.totalOrders > 0 ? (
                        <div className="grid grid-cols-3 gap-3 h-full">
                          {getOrderStatusDistribution().slice(0, 6).map((statusData) => (
                            <div key={statusData.status} className="bg-white rounded-lg p-3 border border-gray-200">
                              <p className="text-sm font-medium text-gray-800 capitalize truncate">
                                {statusData.status.toLowerCase()}
                              </p>
                              <p className="text-xl font-bold text-gray-800 mt-1">{statusData.count}</p>
                              <p className="text-xs text-gray-500">{statusData.percentage}%</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">No order data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Status Details */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Order Status Breakdown</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {getOrderStatusDistribution().map((statusData) => (
                    <div key={statusData.status} className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl text-gray-600">📦</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1 capitalize">{statusData.status.toLowerCase()}</p>
                      <p className="text-2xl font-bold text-gray-800">{statusData.count}</p>
                      <p className="text-xs text-gray-500">{statusData.percentage}% of total</p>
                    </div>
                  ))}
                  
                  {orderMetrics.totalOrders === 0 && (
                    <>
                      {["Pending", "Confirmed", "Preparing", "Ready", "Delivering", "Delivered"].map((status) => (
                        <div key={status} className="text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl text-gray-600">📦</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{status}</p>
                          <p className="text-2xl font-bold text-gray-800">--</p>
                          <p className="text-xs text-gray-500">--% of total</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Key Insights Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Key Insights</h3>
                <p className="text-gray-500 text-sm">Automated insights from your data</p>
              </div>
              <button 
                onClick={loadData}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Refresh Insights →
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600">💡</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {activeTab === "users" 
                        ? `${userMetrics.newCustomers + userMetrics.newSellers} New Users`
                        : `${orderMetrics.newCustomers} New Customers (30d)`}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {activeTab === "users" 
                        ? "Total new users in the last 30 days"
                        : "Customers who placed their first order recently"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start mb-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-green-600">📈</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {activeTab === "users"
                        ? `$${userAnalytics?.monthlyRevenue?.toLocaleString() || "0"} Revenue`
                        : `$${orderMetrics.totalRevenue.toLocaleString()} Total Revenue`}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {activeTab === "users"
                        ? "Monthly revenue generated from all users"
                        : "Total revenue from all completed orders"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start mb-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-purple-600">🎯</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {activeTab === "users"
                        ? `${userMetrics.activeCustomers + userMetrics.activeSellers} Active Users`
                        : `${orderMetrics.completedOrders} Completed Orders`}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {activeTab === "users"
                        ? "Currently active users in the system"
                        : "Orders successfully delivered to customers"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Export Options Modal */}
      {showExportOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Export Analytics</h3>
                <button
                  onClick={() => setShowExportOptions(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Export Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Export Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {["PDF", "Excel", "CSV", "JSON"].map((format) => (
                      <button
                        key={format}
                        onClick={() => handleExportAnalytics(format.toLowerCase())}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-2xl mb-2">
                            {format === "PDF" && "📄"}
                            {format === "Excel" && "📊"}
                            {format === "CSV" && "📋"}
                            {format === "JSON" && "{}"}
                          </span>
                          <span className="font-medium text-gray-800">{format}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Export Options
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm text-gray-700">Include summary statistics</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm text-gray-700">Include raw data</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-700">Include charts and graphs</span>
                    </label>
                  </div>
                </div>

                {/* Data Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Data Type:</span> {activeTab === "users" ? "User Analytics" : "Order Analytics"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Records:</span> {activeTab === "users" 
                      ? `${customers.length} customers, ${sellers.length} sellers` 
                      : `${orderMetrics.totalOrders} orders`}
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowExportOptions(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleExportAnalytics("pdf")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Export Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}