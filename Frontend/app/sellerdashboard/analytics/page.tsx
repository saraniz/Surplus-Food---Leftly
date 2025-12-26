// app/seller/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import SellerSidebar from "../../components/sellerdashboard";
import SellerHeader from "../../components/sellerHeader";
import { useProductStore } from "@/app/ZustandStore/productStore";
import { useOrderStore } from "@/app/ZustandStore/orderStore";
import { useReviewStore } from "@/app/ZustandStore/reviewStore";

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("7d");

  const { products,fetchProducts } = useProductStore();
  const { order, getSellerOrders } = useOrderStore();
  const { review } = useReviewStore();

  useEffect(() => {
    getSellerOrders();
    fetchProducts();
  }, []);

  // Calculate analytics from real data
  const totalRevenue = order?.reduce(
    (sum: any, order: any) => sum + (order.totalAmount || 0),
    0
  ) || 0;

  const totalOrders = order?.length || 0;
  const averageOrder = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00";

  // Calculate customer satisfaction from reviews
  const calculateSatisfaction = () => {
    if (!review || review.length === 0) return { rating: 0, positivePercentage: 0 };
    
    const totalStars = review.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
    const averageRating = totalStars / review.length;
    const positiveReviews = review.filter((r: any) => (r.rating || 0) >= 4).length;
    const positivePercentage = Math.round((positiveReviews / review.length) * 100);
    
    return { 
      rating: averageRating.toFixed(1), 
      positivePercentage 
    };
  };

  const satisfaction = calculateSatisfaction();

  // Revenue Chart Component
  const RevenueChart = () => {
    // Initialize all weekdays with zero revenue
    const weekdays = [
      { name: "Monday", short: "Mon", revenue: 0 },
      { name: "Tuesday", short: "Tue", revenue: 0 },
      { name: "Wednesday", short: "Wed", revenue: 0 },
      { name: "Thursday", short: "Thu", revenue: 0 },
      { name: "Friday", short: "Fri", revenue: 0 },
      { name: "Saturday", short: "Sat", revenue: 0 },
      { name: "Sunday", short: "Sun", revenue: 0 }
    ];

    // Calculate revenue for each day from orders
    if (order && order.length > 0) {
      order.forEach((item: any) => {
        if (!item.createdAt) return;
        try {
          const date = new Date(item.createdAt);
          const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
          const dayIndex = weekdays.findIndex(d => d.name === dayName);
          if (dayIndex !== -1) {
            weekdays[dayIndex].revenue += (item.totalAmount || 0);
          }
        } catch (error) {
          console.error('Error processing order date:', error);
        }
      });
    }

    // Find maximum revenue for scaling
    const maxRevenue = Math.max(...weekdays.map(day => day.revenue), 1);

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
            const widthPercentage = hasRevenue ? (day.revenue / maxRevenue) * 100 : 0;
            const isToday = day.name === today;

            return (
              <div key={idx} className="flex items-center space-x-3">
                <div className="w-16 flex items-center">
                  <span className={`text-sm font-medium ${
                    isToday ? 'text-blue-600 font-semibold' : 'text-gray-600'
                  }`}>
                    {day.short}
                  </span>
                  {isToday && (
                    <span className="ml-1 text-xs text-blue-600 font-medium">•</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="relative">
                    <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          hasRevenue 
                            ? 'bg-gradient-to-r from-green-400 to-blue-500' 
                            : ''
                        }`}
                        style={{ 
                          width: `${widthPercentage}%`,
                          opacity: hasRevenue ? 1 : 0
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="w-24 text-right">
                  <span className={`text-sm font-medium ${
                    hasRevenue ? 'text-gray-900' : 'text-gray-400'
                  }`}>
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
                Rs {weekdays.reduce((sum, day) => sum + day.revenue, 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Highest Revenue Day</p>
              <p className="font-semibold text-gray-900">
                {(() => {
                  const maxDay = weekdays.reduce((max, day) => 
                    day.revenue > max.revenue ? day : max, 
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

  // Top Products Component
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
    const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
    
    order.forEach((orderItem: any) => {
      orderItem.items?.forEach((item: any) => {
        const productId = item.id || item.name;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.name || "Unknown Product",
            sales: 0,
            revenue: 0
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
                <div className="text-sm text-green-600">
                  {/* You can add growth calculation here */}
                  Top seller
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <SellerHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="Analytics Dashboard"
          subtitle="Track your store performance and insights"
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Time Range Selector */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Performance Overview
              </h2>
              <p className="text-gray-600">Monitor your store's key metrics</p>
            </div>
            <select
              title="Days"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    Rs {totalRevenue.toFixed(2)}
                  </h3>
                  <p className="text-green-500 text-sm mt-1">Total all-time revenue</p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Total Orders</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {totalOrders}
                  </h3>
                  <p className="text-blue-500 text-sm mt-1">
                    Total orders received
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Avg. Order Value</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    Rs {averageOrder}
                  </h3>
                  <p className="text-purple-500 text-sm mt-1">
                    Average per order
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Satisfaction</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {satisfaction.rating}/5
                  </h3>
                  <p className="text-yellow-500 text-sm mt-1">
                    {satisfaction.positivePercentage}% positive reviews
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <span className="text-2xl">⭐</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart Component */}
            <RevenueChart />

            {/* Top Products Component */}
            <TopProducts />
          </div>
        </main>
      </div>
    </div>
  );
}