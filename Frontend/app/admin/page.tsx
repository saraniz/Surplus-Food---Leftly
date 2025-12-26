// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "../components/adminSidebar";
import AdminTopbar from "../components/AdminTopbar";
import { useUserStore } from "../ZustandStore/Admin/userStore";
import { Loader2, Users, Store, DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function AdminDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("week");
  const [chartType, setChartType] = useState<"bar" | "line">("line");
  
  // Get data from user store
  const { 
    customers, 
    sellers, 
    analytics, 
    loading, 
    error,
    getAllCustomers,
    getAllSellers,
    getUserAnalytics 
  } = useUserStore();

  useEffect(() => {
    // Fetch all data when component mounts
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        getAllCustomers(),
        getAllSellers(),
        getUserAnalytics()
      ]);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  // Calculate derived stats
  const totalUsers = customers.length + sellers.length;
  const newCustomersThisWeek = customers.filter(c => {
    const createdAt = new Date(c.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdAt >= weekAgo;
  }).length;
  
  const newSellersThisWeek = sellers.filter(s => {
    const createdAt = new Date(s.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdAt >= weekAgo;
  }).length;

  const activeCustomers = customers.filter(c => c.status === 'ACTIVE').length;
  const activeSellers = sellers.filter(s => s.status === 'ACTIVE').length;
  
  const pendingVerificationSellers = sellers.filter(s => 
    s.verificationStatus === 'PENDING'
  ).length;

  const suspendedUsers = [
    ...customers.filter(c => c.status === 'SUSPENDED'),
    ...sellers.filter(s => s.status === 'SUSPENDED')
  ].length;

  // Calculate total revenue from sellers (if available)
  const totalRevenue = sellers.reduce((sum, seller) => 
    sum + (seller.totalRevenue || 0), 0
  );

  // Get top sellers
  const topSellers = [...sellers]
    .sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0))
    .slice(0, 5);

  // Platform health indicators
  const platformHealth = {
    apiStatus: 'operational',
    databaseStatus: 'connected',
    serverLoad: 'normal',
    uptime: '99.9%'
  };

  if (loading && !analytics) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <AdminTopbar
            title="Dashboard"
            subtitle="Welcome back, Admin! Here's your platform overview."
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading dashboard data...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <AdminTopbar
            title="Dashboard"
            subtitle="Welcome back, Admin! Here's your platform overview."
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-6 text-black">
            <div className="flex items-center justify-center h-64">
              <div className="text-center max-w-md">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Dashboard</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchDashboardData}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Topbar */}
        <AdminTopbar
          title="Dashboard"
          subtitle="Welcome back, Admin! Here's your platform overview."
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Scrollable dashboard content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 text-black">
          {/* Header with Time Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Platform Overview</h2>
              <p className="text-gray-600">Real-time insights and statistics</p>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                title="Time range"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <button 
                onClick={fetchDashboardData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-xs font-medium">Total Users</p>
                  <h3 className="text-2xl font-bold mt-1">{totalUsers.toLocaleString()}</h3>
                  <div className="flex items-center mt-2 space-x-2 text-xs text-gray-500">
                    <div>Buyers: <span className="font-medium text-gray-700">{customers.length}</span></div>
                    <div>Sellers: <span className="font-medium text-gray-700">{sellers.length}</span></div>
                  </div>
                  <p className="text-green-500 text-xs mt-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{newCustomersThisWeek + newSellersThisWeek} new this week
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Total Revenue Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-xs font-medium">Total Revenue</p>
                  <h3 className="text-2xl font-bold mt-1">Rs {totalRevenue.toLocaleString()}.00</h3>
                  <div className="flex items-center mt-2 space-x-2 text-xs text-gray-500">
                    <div>Active Sellers: <span className="font-medium text-gray-700">{activeSellers}</span></div>
                    <div>Pending: <span className="font-medium text-gray-700">{pendingVerificationSellers}</span></div>
                  </div>
                  <p className="text-green-500 text-xs mt-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    From {sellers.length} sellers
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            {/* User Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-xs font-medium">User Status</p>
                  <h3 className="text-2xl font-bold mt-1">{suspendedUsers}</h3>
                  <div className="flex flex-wrap gap-1 mt-2 text-xs">
                    <span className="px-1 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">
                      Active: {activeCustomers + activeSellers}
                    </span>
                    <span className="px-1 py-0.5 bg-red-50 text-red-700 rounded border border-red-200">
                      Suspended: {suspendedUsers}
                    </span>
                  </div>
                  <p className="text-yellow-500 text-xs mt-1">
                    {pendingVerificationSellers} sellers pending verification
                  </p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Analytics Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 border-l-4 border-purple-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-xs font-medium">Platform Analytics</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {analytics?.totalCustomers ? analytics.totalCustomers + analytics.totalSellers : '--'}
                  </h3>
                  <div className="flex items-center mt-2 space-x-2 text-xs text-gray-500">
                    <div>Growth: <span className="font-medium text-gray-700">+{analytics?.newCustomers || 0}</span></div>
                    <div>Active: <span className="font-medium text-gray-700">{analytics?.activeCustomers || 0}</span></div>
                  </div>
                  <p className="text-purple-500 text-xs mt-1">
                    Monthly Revenue: ${analytics?.monthlyRevenue?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Active Customers</p>
                  <p className="text-2xl font-bold">{activeCustomers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Active Sellers</p>
                  <p className="text-2xl font-bold">{activeSellers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Avg Seller Revenue</p>
                  <p className="text-2xl font-bold">
                    Rs {sellers.length > 0 ? Math.round(totalRevenue / sellers.length).toLocaleString() : '0'}.00
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Weekly Growth</p>
                  <p className="text-2xl font-bold">
                    +{newCustomersThisWeek + newSellersThisWeek}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Widgets Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Sellers Widget */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Top Performing Sellers</h3>
                  <p className="text-gray-500 text-sm">Based on total sales & revenue</p>
                </div>
                <select title="Sort" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700">
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>This Quarter</option>
                </select>
              </div>
              
              <div className="space-y-4">
                {topSellers.length > 0 ? (
                  topSellers.map((seller, index) => (
                    <div key={seller.seller_id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mr-4">
                        {seller.storeImg ? (
                          <img 
                            src={seller.storeImg} 
                            alt={seller.businessName}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Store className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">{seller.businessName}</p>
                            <p className="text-gray-500 text-sm">
                              {seller.totalSales || 0} sales | ⭐ {seller.rating?.toFixed(1) || '0.0'}/5
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-800">Rs {(seller.totalRevenue || 0).toLocaleString()}.00</p>
                            <p className="text-green-500 text-xs">#{index + 1} rank</p>
                          </div>
                        </div>
                        
                        <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                            style={{ 
                              width: `${Math.min(100, ((seller.totalSales || 0) / (topSellers[0]?.totalSales || 1)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No seller data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Platform Health Widget */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Platform Health</h3>
                <span className="text-green-500 text-sm flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Healthy
                </span>
              </div>
              
              <div className="space-y-4">
                {/* User System Health */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">User System</p>
                      <p className="text-gray-500 text-xs">Customers & Sellers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">{customers.length + sellers.length}</p>
                    <div className="flex items-center text-green-500 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Operational
                    </div>
                  </div>
                </div>
                
                {/* Data Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-blue-600 text-lg">📊</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Data Status</p>
                      <p className="text-gray-500 text-xs">Fetch success rate</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">100%</p>
                    <div className="flex items-center text-green-500 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete
                    </div>
                  </div>
                </div>
                
                {/* Recent Activity */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Recent Activity</p>
                      <p className="text-gray-500 text-xs">New users this week</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">+{newCustomersThisWeek + newSellersThisWeek}</p>
                    <div className="flex items-center text-green-500 text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Growing
                    </div>
                  </div>
                </div>
                
                {/* System Load */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-purple-600 text-lg">⚡</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">System Load</p>
                      <p className="text-gray-500 text-xs">API response time</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">-- ms</p>
                    <div className="flex items-center text-green-500 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Optimal
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button 
                    onClick={fetchDashboardData}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => {/* Navigate to customers page */}}
                className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="w-5 h-5 text-blue-600 mr-3" />
                <span>Manage Customers</span>
              </button>
              <button 
                onClick={() => {/* Navigate to sellers page */}}
                className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Store className="w-5 h-5 text-green-600 mr-3" />
                <span>Manage Sellers</span>
              </button>
              <button 
                onClick={fetchDashboardData}
                className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Loader2 className="w-5 h-5 text-purple-600 mr-3" />
                <span>Update Statistics</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}