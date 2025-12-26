// app/admin/reports/page.tsx
"use client";

import { useState } from "react";
import AdminSidebar from "../../components/adminSidebar";
import AdminTopbar from "../../components/AdminTopbar";

export default function ReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"generate" | "orders" | "sellers" | "complaints">("generate");
  const [selectedReportType, setSelectedReportType] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportFormat, setReportFormat] = useState("pdf");
  const [reportGenerating, setReportGenerating] = useState(false);

  // Report configuration state
  const [reportConfig, setReportConfig] = useState({
    includeCharts: true,
    includeDetails: true,
    includeSummary: true,
    exportData: false
  });

  // Order report filters
  const [orderFilters, setOrderFilters] = useState({
    status: "all",
    paymentMethod: "all",
    minAmount: "",
    maxAmount: ""
  });

  // Seller performance filters
  const [sellerFilters, setSellerFilters] = useState({
    rating: "all",
    salesRange: "all",
    status: "active"
  });

  // Complaint summary filters
  const [complaintFilters, setComplaintFilters] = useState({
    type: "all",
    priority: "all",
    resolutionStatus: "all"
  });

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      setReportGenerating(false);
      setShowReportPreview(true);
    }, 2000);
  };

  const handleExportReport = () => {
    // POST /admin/reports/export
    console.log(`Exporting ${reportFormat} report`);
    setShowReportPreview(false);
  };

  const handleScheduleReport = () => {
    // POST /admin/reports/schedule
    console.log("Scheduling report");
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <AdminTopbar 
            title="Reports Dashboard"
            subtitle="Generate and analyze system reports"
            onMenuClick={() => setSidebarOpen(true)}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("generate")}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "generate"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>📊</span>
                <span>Generate Reports</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "orders"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>📦</span>
                <span>Order Reports</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("sellers")}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "sellers"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🏪</span>
                <span>Seller Performance</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("complaints")}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "complaints"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>📋</span>
                <span>Complaint Summary</span>
              </span>
            </button>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {activeTab === "generate" && "Report Generator"}
                {activeTab === "orders" && "Order Analytics"}
                {activeTab === "sellers" && "Seller Performance"}
                {activeTab === "complaints" && "Complaint Summary"}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeTab === "generate" && "Create custom reports and export data"}
                {activeTab === "orders" && "Analyze order patterns and trends"}
                {activeTab === "sellers" && "Monitor seller performance metrics"}
                {activeTab === "complaints" && "Summary of complaints and resolutions"}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {activeTab === "generate" && (
                <button
                  onClick={handleScheduleReport}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <span>⏰</span>
                  <span>Schedule Reports</span>
                </button>
              )}
              
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                onClick={() => {/* Refresh data */}}
              >
                <span>🔄</span>
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          {activeTab === "generate" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Report Types */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Select Report Type</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sales Report */}
                    <button
                      onClick={() => setSelectedReportType("sales")}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedReportType === "sales"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          selectedReportType === "sales" ? "bg-blue-100" : "bg-gray-100"
                        }`}>
                          <span className={selectedReportType === "sales" ? "text-blue-600" : "text-gray-600"}>💰</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Sales Report</h4>
                          <p className="text-sm text-gray-500 mt-1">Revenue, transactions, and sales trends</p>
                        </div>
                      </div>
                    </button>

                    {/* Order Report */}
                    <button
                      onClick={() => setSelectedReportType("orders")}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedReportType === "orders"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          selectedReportType === "orders" ? "bg-green-100" : "bg-gray-100"
                        }`}>
                          <span className={selectedReportType === "orders" ? "text-green-600" : "text-gray-600"}>📦</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Order Analysis</h4>
                          <p className="text-sm text-gray-500 mt-1">Order volume, status, and fulfillment</p>
                        </div>
                      </div>
                    </button>

                    {/* Customer Report */}
                    <button
                      onClick={() => setSelectedReportType("customers")}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedReportType === "customers"
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          selectedReportType === "customers" ? "bg-purple-100" : "bg-gray-100"
                        }`}>
                          <span className={selectedReportType === "customers" ? "text-purple-600" : "text-gray-600"}>👥</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Customer Insights</h4>
                          <p className="text-sm text-gray-500 mt-1">Customer behavior and demographics</p>
                        </div>
                      </div>
                    </button>

                    {/* Seller Report */}
                    <button
                      onClick={() => setSelectedReportType("sellers")}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedReportType === "sellers"
                          ? "border-yellow-500 bg-yellow-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          selectedReportType === "sellers" ? "bg-yellow-100" : "bg-gray-100"
                        }`}>
                          <span className={selectedReportType === "sellers" ? "text-yellow-600" : "text-gray-600"}>🏪</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Seller Performance</h4>
                          <p className="text-sm text-gray-500 mt-1">Sales, ratings, and compliance</p>
                        </div>
                      </div>
                    </button>

                    {/* Inventory Report */}
                    <button
                      onClick={() => setSelectedReportType("inventory")}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedReportType === "inventory"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          selectedReportType === "inventory" ? "bg-red-100" : "bg-gray-100"
                        }`}>
                          <span className={selectedReportType === "inventory" ? "text-red-600" : "text-gray-600"}>📦</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Inventory Report</h4>
                          <p className="text-sm text-gray-500 mt-1">Stock levels and product performance</p>
                        </div>
                      </div>
                    </button>

                    {/* Complaint Report */}
                    <button
                      onClick={() => setSelectedReportType("complaints")}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedReportType === "complaints"
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          selectedReportType === "complaints" ? "bg-orange-100" : "bg-gray-100"
                        }`}>
                          <span className={selectedReportType === "complaints" ? "text-orange-600" : "text-gray-600"}>📋</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Complaint Summary</h4>
                          <p className="text-sm text-gray-500 mt-1">Complaints analysis and resolution rates</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Report Configuration */}
              <div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Report Configuration</h3>
                  
                  <form onSubmit={handleGenerateReport}>
                    <div className="space-y-6">
                      {/* Date Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date Range
                        </label>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={dateRange.startDate}
                              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">End Date</label>
                            <input
                              type="date"
                              value={dateRange.endDate}
                              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Export Format */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Export Format
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {["PDF", "Excel", "CSV", "HTML"].map((format) => (
                            <button
                              key={format}
                              type="button"
                              onClick={() => setReportFormat(format.toLowerCase())}
                              className={`p-2 border rounded-lg text-center ${
                                reportFormat === format.toLowerCase()
                                  ? "border-blue-500 bg-blue-50 text-blue-700"
                                  : "border-gray-200 text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              {format}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Report Options */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Report Options
                        </label>
                        <div className="space-y-3">
                          {[
                            { id: "charts", label: "Include Charts & Graphs", checked: reportConfig.includeCharts },
                            { id: "details", label: "Include Detailed Data", checked: reportConfig.includeDetails },
                            { id: "summary", label: "Include Executive Summary", checked: reportConfig.includeSummary },
                            { id: "export", label: "Export Raw Data", checked: reportConfig.exportData }
                          ].map((option) => (
                            <label key={option.id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={option.checked}
                                onChange={(e) => setReportConfig({
                                  ...reportConfig,
                                  [option.id]: e.target.checked
                                })}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Generate Button */}
                      <button
                        type="submit"
                        disabled={!selectedReportType || reportGenerating}
                        className={`w-full py-3 rounded-lg font-medium ${
                          !selectedReportType || reportGenerating
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {reportGenerating ? (
                          <span className="flex items-center justify-center">
                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                            Generating Report...
                          </span>
                        ) : (
                          "Generate Report"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <>
              {/* Order Reports Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Filters */}
                <div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Filters</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Order Status
                        </label>
                        <select
                          value={orderFilters.status}
                          onChange={(e) => setOrderFilters({...orderFilters, status: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="delivering">Delivering</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
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
                          <option value="cash">Cash on Delivery</option>
                          <option value="card">Credit Card</option>
                          <option value="digital">Digital Wallet</option>
                          <option value="bank">Bank Transfer</option>
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

                      <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Apply Filters
                      </button>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Metrics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Orders</span>
                        <span className="font-bold text-gray-800">--</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Revenue</span>
                        <span className="font-bold text-gray-800">--</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg. Order Value</span>
                        <span className="font-bold text-gray-800">--</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Success Rate</span>
                        <span className="font-bold text-gray-800">--%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Charts */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">Order Trends</h3>
                      <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>Last 3 Months</option>
                        <option>Custom Range</option>
                      </select>
                    </div>
                    
                    <div className="h-80 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl text-gray-400">📈</span>
                        </div>
                        <p className="text-gray-500">Order trends chart</p>
                        <p className="text-gray-400 text-sm mt-2">
                          Apply filters to view order data visualization
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Status Distribution */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Order Status Distribution</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {["Pending", "Confirmed", "Preparing", "Delivering", "Delivered", "Cancelled"].map((status) => (
                        <div key={status} className="text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-gray-600">📦</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{status}</p>
                          <p className="font-bold text-gray-800">--</p>
                          <p className="text-xs text-gray-500">--%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "sellers" && (
            <>
              {/* Seller Performance Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Filters */}
                <div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Seller Filters</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Rating
                        </label>
                        <select
                          value={sellerFilters.rating}
                          onChange={(e) => setSellerFilters({...sellerFilters, rating: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Ratings</option>
                          <option value="5">5 Stars</option>
                          <option value="4">4+ Stars</option>
                          <option value="3">3+ Stars</option>
                          <option value="2">2+ Stars</option>
                          <option value="1">1+ Stars</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sales Volume
                        </label>
                        <select
                          value={sellerFilters.salesRange}
                          onChange={(e) => setSellerFilters({...sellerFilters, salesRange: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Sellers</option>
                          <option value="top10">Top 10%</option>
                          <option value="top25">Top 25%</option>
                          <option value="bottom25">Bottom 25%</option>
                          <option value="new">New Sellers</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Status
                        </label>
                        <select
                          value={sellerFilters.status}
                          onChange={(e) => setSellerFilters({...sellerFilters, status: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                          <option value="all">All Statuses</option>
                        </select>
                      </div>

                      <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Apply Filters
                      </button>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Performance</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Active Sellers</span>
                        <span className="font-bold text-gray-800">--</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg. Seller Rating</span>
                        <span className="font-bold text-gray-800">--</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Sales</span>
                        <span className="font-bold text-gray-800">--</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Compliance Rate</span>
                        <span className="font-bold text-gray-800">--%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Seller Performance */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">Top Performing Sellers</h3>
                      <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700">
                        <option>By Revenue</option>
                        <option>By Orders</option>
                        <option>By Rating</option>
                        <option>By Growth</option>
                      </select>
                    </div>
                    
                    {/* Seller Performance Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 text-gray-600 font-medium">Seller</th>
                            <th className="text-left py-3 text-gray-600 font-medium">Revenue</th>
                            <th className="text-left py-3 text-gray-600 font-medium">Orders</th>
                            <th className="text-left py-3 text-gray-600 font-medium">Rating</th>
                            <th className="text-left py-3 text-gray-600 font-medium">Status</th>
                            <th className="text-left py-3 text-gray-600 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td colSpan={6} className="py-8 text-center text-gray-500">
                              Apply filters to view seller performance data
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Performance Charts */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">Seller Growth Trends</h3>
                      <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700">
                        <option>Monthly</option>
                        <option>Quarterly</option>
                        <option>Yearly</option>
                      </select>
                    </div>
                    
                    <div className="h-64 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl text-gray-400">📊</span>
                        </div>
                        <p className="text-gray-500">Seller performance metrics chart</p>
                        <p className="text-gray-400 text-sm mt-2">
                          Data visualization based on selected filters
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "complaints" && (
            <>
              {/* Complaint Summary Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Filters */}
                <div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Complaint Filters</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Complaint Type
                        </label>
                        <select
                          value={complaintFilters.type}
                          onChange={(e) => setComplaintFilters({...complaintFilters, type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Types</option>
                          <option value="customer">Customer Complaints</option>
                          <option value="seller">Seller Complaints</option>
                          <option value="delivery">Delivery Issues</option>
                          <option value="quality">Quality Concerns</option>
                          <option value="refund">Refund Requests</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Priority Level
                        </label>
                        <select
                          value={complaintFilters.priority}
                          onChange={(e) => setComplaintFilters({...complaintFilters, priority: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Priorities</option>
                          <option value="high">High Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="low">Low Priority</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Resolution Status
                        </label>
                        <select
                          value={complaintFilters.resolutionStatus}
                          onChange={(e) => setComplaintFilters({...complaintFilters, resolutionStatus: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Apply Filters
                      </button>
                    </div>
                  </div>

                  {/* Complaint Metrics */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary Metrics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Complaints</span>
                        <span className="font-bold text-gray-800">--</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg. Resolution Time</span>
                        <span className="font-bold text-gray-800">-- hours</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Resolution Rate</span>
                        <span className="font-bold text-gray-800">--%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Customer Satisfaction</span>
                        <span className="font-bold text-gray-800">--%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Complaint Analysis */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">Complaint Trends</h3>
                      <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>Last 3 Months</option>
                        <option>By Category</option>
                      </select>
                    </div>
                    
                    <div className="h-64 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl text-gray-400">📊</span>
                        </div>
                        <p className="text-gray-500">Complaint trends analysis</p>
                        <p className="text-gray-400 text-sm mt-2">
                          Apply filters to view complaint patterns
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Complaint Type Distribution */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Complaint Distribution</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {["Customer", "Seller", "Delivery", "Quality", "Refund"].map((type) => (
                        <div key={type} className="text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-gray-600">📋</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{type}</p>
                          <p className="font-bold text-gray-800">--</p>
                          <p className="text-xs text-gray-500">--% of total</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Recent Reports */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Recent Reports</h3>
                <p className="text-gray-500 text-sm">Previously generated reports</p>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All Reports →
              </button>
            </div>
            
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">📁</span>
              </div>
              <p className="text-gray-500">No recent reports generated</p>
              <p className="text-gray-400 text-sm mt-2">Generate your first report to see it here</p>
            </div>
          </div>
        </main>
      </div>

      {/* Report Preview Modal */}
      {showReportPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Report Preview</h3>
                <button
                  onClick={() => setShowReportPreview(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Report Header */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">
                      {selectedReportType === "sales" && "Sales Report"}
                      {selectedReportType === "orders" && "Order Analysis Report"}
                      {selectedReportType === "customers" && "Customer Insights Report"}
                      {selectedReportType === "sellers" && "Seller Performance Report"}
                      {selectedReportType === "inventory" && "Inventory Report"}
                      {selectedReportType === "complaints" && "Complaint Summary Report"}
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Generated on {new Date().toLocaleDateString()} | Period: {dateRange.startDate} to {dateRange.endDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Report ID</p>
                    <p className="font-mono text-gray-800">--</p>
                  </div>
                </div>
              </div>

              {/* Report Content Preview */}
              <div className="border border-gray-200 rounded-lg p-6 mb-6">
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-gray-400">📊</span>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-3">Report Preview</h4>
                  <p className="text-gray-600 max-w-md mx-auto">
                    This is a preview of the {selectedReportType} report. The actual report would contain:
                  </p>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <div className="text-left p-4 border border-gray-200 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-2">📈 Charts & Graphs</h5>
                      <p className="text-sm text-gray-500">Visual data representation</p>
                    </div>
                    <div className="text-left p-4 border border-gray-200 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-2">📋 Summary Statistics</h5>
                      <p className="text-sm text-gray-500">Key metrics and insights</p>
                    </div>
                    <div className="text-left p-4 border border-gray-200 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-2">🔢 Detailed Data</h5>
                      <p className="text-sm text-gray-500">Raw data and analysis</p>
                    </div>
                    <div className="text-left p-4 border border-gray-200 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-2">📄 Executive Summary</h5>
                      <p className="text-sm text-gray-500">High-level overview</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4">Export Options</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {["PDF", "Excel", "CSV", "HTML"].map((format) => (
                    <button
                      key={format}
                      onClick={() => setReportFormat(format.toLowerCase())}
                      className={`p-4 border rounded-lg text-center ${
                        reportFormat === format.toLowerCase()
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="block text-lg mb-1">
                        {format === "PDF" && "📄"}
                        {format === "Excel" && "📊"}
                        {format === "CSV" && "📋"}
                        {format === "HTML" && "🌐"}
                      </span>
                      <span className="font-medium">{format}</span>
                    </button>
                  ))}
                </div>

                {/* Additional Options */}
                <div className="space-y-3 mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeCharts}
                      onChange={(e) => setReportConfig({...reportConfig, includeCharts: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Include charts in export</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportConfig.exportData}
                      onChange={(e) => setReportConfig({...reportConfig, exportData: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Include raw data file</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowReportPreview(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScheduleReport}
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    Schedule Report
                  </button>
                  <button
                    onClick={handleExportReport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Export Report
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