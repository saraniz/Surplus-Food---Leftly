// app/seller/page.tsx
"use client";

import { useEffect, useState } from "react";
import SellerSidebar from "../components/sellerdashboard";
import { useOrderStore } from "../ZustandStore/orderStore";
import { useProductStore } from "../ZustandStore/productStore";
import SellerHeader from "../components/sellerHeader"; // Import the SellerHeader
import { useCusAuthStore } from "../ZustandStore/authStore";

export default function SellerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications] = useState(3);
  const [messages] = useState(5);
  const [greetingName, setGreetingName] = useState("Seller");

  const { order, getSellerOrders } = useOrderStore();
  const { products, fetchProducts } = useProductStore();
  const { seller, loading: sellerLoading } = useCusAuthStore();

  useEffect(() => {
    getSellerOrders();
    fetchProducts();
  }, []);

  useEffect(() => {
    // Update greeting name when seller data is loaded
    if (seller?.businessName) {
      // Extract first name or use business name
      const nameParts = seller.businessName.split(' ');
      setGreetingName(nameParts[0] || seller.businessName);
    }
  }, [seller]);

  const RevenueChart = () => {
    // Initialize all weekdays with zero revenue
    const weekdays = [
      { name: "Monday", short: "Mon", revenue: 0 },
      { name: "Tuesday", short: "Tue", revenue: 0 },
      { name: "Wednesday", short: "Wed", revenue: 0 },
      { name: "Thursday", short: "Thu", revenue: 0 },
      { name: "Friday", short: "Fri", revenue: 0 },
      { name: "Saturday", short: "Sat", revenue: 0 },
      { name: "Sunday", short: "Sun", revenue: 0 },
    ];

    // Calculate revenue for each day from orders
    if (order && order.length > 0) {
      order.forEach((item: any) => {
        if (!item.createdAt) return;
        try {
          const date = new Date(item.createdAt);
          const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
          const dayIndex = weekdays.findIndex((d) => d.name === dayName);
          if (dayIndex !== -1) {
            weekdays[dayIndex].revenue += item.totalAmount || 0;
          }
        } catch (error) {
          console.error("Error processing order date:", error);
        }
      });
    }

    // Find maximum revenue for scaling
    const maxRevenue = Math.max(...weekdays.map((day) => day.revenue), 1);

    // Get today's weekday
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Weekly Revenue Overview
        </h3>
        <div className="space-y-3">
          {weekdays.map((day, idx) => {
            const hasRevenue = day.revenue > 0;
            const widthPercentage = hasRevenue
              ? (day.revenue / maxRevenue) * 100
              : 0;
            const isToday = day.name === today;

            return (
              <div key={idx} className="flex items-center space-x-3">
                <div className="w-16 flex items-center">
                  <span
                    className={`text-sm font-medium ${
                      isToday ? "text-blue-600 font-semibold" : "text-gray-600"
                    }`}
                  >
                    {day.short}
                  </span>
                  {isToday && (
                    <span className="ml-1 text-xs text-blue-600 font-medium">
                      •
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="relative">
                    <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          hasRevenue
                            ? "bg-gradient-to-r from-green-400 to-blue-500"
                            : ""
                        }`}
                        style={{
                          width: `${widthPercentage}%`,
                          opacity: hasRevenue ? 1 : 0,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="w-24 text-right">
                  <span
                    className={`text-sm font-medium ${
                      hasRevenue ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {hasRevenue ? `Rs ${day.revenue.toFixed(2)}` : "Rs 0.00"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary statistics */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Weekly Revenue</p>
              <p className="font-semibold text-gray-900">
                Rs{" "}
                {weekdays
                  .reduce((sum, day) => sum + day.revenue, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Highest Revenue Day</p>
              <p className="font-semibold text-gray-900">
                {(() => {
                  const maxDay = weekdays.reduce(
                    (max, day) => (day.revenue > max.revenue ? day : max),
                    weekdays[0]
                  );
                  return maxDay.revenue > 0
                    ? `${maxDay.short} (Rs ${maxDay.revenue.toFixed(2)})`
                    : "No data";
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const totalRevenue =
    order?.reduce((sum: any, order: any) => sum + (order.totalAmount || 0), 0) ||
    0;

  const totalOrders = order?.length || 0;
  const averageOrder =
    totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00";

  const menuItems = products?.length || 0;

  const TopProducts = () => {
    if (!order || order.length === 0) {
      return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Top Performing Products
          </h3>
          <div className="text-center py-8 text-gray-500">
            No products data available yet
          </div>
        </div>
      );
    }

    // Calculate product sales from orders
    const productSales: Record<
      string,
      { name: string; sales: number; revenue: number }
    > = {};

    order.forEach((orderItem: any) => {
      orderItem.items?.forEach((item: any) => {
        const productId = item.id || item.name;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.name || "Unknown Product",
            sales: 0,
            revenue: 0,
          };
        }
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        productSales[productId].sales += quantity;
        productSales[productId].revenue += quantity * price;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 4);

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Top Performing Products
        </h3>
        <div className="space-y-4">
          {topProducts.map((product, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {product.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {product.sales} sales
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  Rs {product.revenue.toFixed(2)}
                </div>
                <div className="text-sm text-green-600">Top seller</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Calculate growth percentages (you can replace with actual calculations)
  const calculateGrowth = (current: number, previous: number = 0) => {
    if (previous === 0) return "+0%";
    const growth = ((current - previous) / previous) * 100;
    return `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`;
  };

  // Get recent orders for display
  const recentOrders = order
    ? order.slice(0, 5).map((orderItem: any, index: number) => ({
        id: `ORD${String(orderItem.id || index + 1).padStart(3, "0")}`,
        customer: orderItem.customerName || "Customer",
        amount: `Rs ${(orderItem.totalAmount || 0).toFixed(2)}`,
        status: orderItem.status || "pending",
      }))
    : [];

  // Calculate followers from products (example - you can replace with actual logic)
  const followers = products
    ? products.reduce((sum: number, product: any) => sum + (product.likes || 0), 0)
    : 0;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SellerSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Use SellerHeader component instead of hardcoded header */}
        <SellerHeader />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Welcome Section - Dynamic based on seller name */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {greetingName}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your store today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Revenue</p>
                  <h3 className="text-3xl font-bold mt-2">
                    Rs {totalRevenue.toLocaleString()}
                  </h3>
                  <p className="text-blue-200 text-sm mt-1">
                    {calculateGrowth(totalRevenue, totalRevenue * 0.88)} from last month
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Menu Items</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">
                    {menuItems}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {menuItems > 2 ? "+2 new this week" : "Manage your products"}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <span className="text-2xl">🍕</span>
                </div>
              </div>
            </div>

            {/* Orders */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Total Orders</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">
                    {totalOrders}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Average: Rs {averageOrder}/order
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
            </div>

            {/* Followers */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Followers</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">
                    {followers}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {followers > 45 ? "+45 this week" : "Grow your audience"}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-xl">
                  <span className="text-2xl">❤️</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <RevenueChart />

            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Orders
                </h3>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((orderItem) => (
                    <div
                      key={orderItem.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {orderItem.id}
                        </div>
                        <div className="text-sm text-gray-600">
                          {orderItem.customer}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {orderItem.amount}
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            orderItem.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : orderItem.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {orderItem.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recent orders
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom section with Top Products */}
          <div className="mt-8">
            <TopProducts />
          </div>
        </main>
      </div>
    </div>
  );
}