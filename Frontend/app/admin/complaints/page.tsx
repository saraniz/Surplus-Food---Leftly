// app/admin/complaints/page.tsx
"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "../../components/adminSidebar";
import AdminTopbar from "../../components/AdminTopbar";
import { useComplaintStore } from "../../ZustandStore/Admin/complaintStore";
import { Loader2, AlertCircle, Download, RefreshCw } from "lucide-react";

export default function ComplaintsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [complaintType, setComplaintType] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "pending" | "resolved">("all");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("month");

  const [resolutionForm, setResolutionForm] = useState({
    resolution: "",
    actionTaken: "",
    followUpRequired: false,
    followUpDate: "",
    status: "RESOLVED"
  });

  // Get Zustand store methods and state
  const {
    complaints,
    stats,
    analytics,
    loading,
    error,
    pagination,
    filters,
    getAllComplaints,
    getComplaintById,
    getComplaintStats,
    getComplaintAnalytics,
    resolveComplaint,
    addComplaintNote,
    exportComplaints,
    setFilters,
    clearFilters,
  } = useComplaintStore();

  // Initialize data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load all data
  const loadData = () => {
    getAllComplaints();
    getComplaintStats();
    getComplaintAnalytics(analyticsPeriod);
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters: any = {
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: complaintType !== "all" ? complaintType : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        page: 1,
      };
      
      // Add date filters if provided
      if (startDate) newFilters.startDate = startDate;
      if (endDate) newFilters.endDate = endDate;
      
      setFilters(newFilters);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, complaintType, priorityFilter, startDate, endDate]);

  // Handle tab selection
  useEffect(() => {
    let status = "all";
    if (selectedTab === "pending") {
      status = "PENDING";
    } else if (selectedTab === "resolved") {
      status = "RESOLVED";
    }
    
    setStatusFilter(selectedTab === "all" ? "all" : status);
    setFilters({ 
      status: selectedTab === "all" ? undefined : status,
      page: 1
    });
  }, [selectedTab]);

  // Handle resolve complaint
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      await resolveComplaint(selectedComplaint.id, {
        resolution: resolutionForm.resolution,
        actionTaken: resolutionForm.actionTaken,
        followUpRequired: resolutionForm.followUpRequired,
        followUpDate: resolutionForm.followUpDate || undefined,
        status: resolutionForm.status,
      });

      setShowResolveModal(false);
      setResolutionForm({
        resolution: "",
        actionTaken: "",
        followUpRequired: false,
        followUpDate: "",
        status: "RESOLVED"
      });
      
      // Refresh data
      loadData();
    } catch (error) {
      console.error("Failed to resolve complaint:", error);
    }
  };

  // Handle view details
  const handleViewDetails = async (complaint: any) => {
    try {
      const fullComplaint = await getComplaintById(complaint.id);
      setSelectedComplaint(fullComplaint);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Failed to load complaint details:", error);
    }
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      await exportComplaints(format);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // Handle analytics period change
  const handleAnalyticsPeriodChange = (period: string) => {
    setAnalyticsPeriod(period);
    getComplaintAnalytics(period);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'URGENT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter complaints for display based on search (client-side as fallback)
  const filteredComplaints = complaints.filter(complaint => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      complaint.complaintCode?.toLowerCase().includes(searchLower) ||
      complaint.title?.toLowerCase().includes(searchLower) ||
      (complaint.complainant?.name?.toLowerCase().includes(searchLower) || 
       complaint.complainant?.businessName?.toLowerCase().includes(searchLower)) ||
      (complaint.accused?.name?.toLowerCase().includes(searchLower) || 
       complaint.accused?.businessName?.toLowerCase().includes(searchLower))
    );
  });

  // Calculate stats if not available from API
  const pendingCount = stats?.pendingCount || complaints.filter(c => c.status === 'PENDING').length;
  const resolvedCount = stats?.resolvedCount || complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
  const totalCount = stats?.total || complaints.length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Admin Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="flex-shrink-0">
          <AdminTopbar 
            title="Complaints Management"
            subtitle="Handle customer and seller complaints"
            onMenuClick={() => setSidebarOpen(true)}
          />
        </div>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* Header with Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Complaints Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage and resolve complaints efficiently</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                onClick={() => handleExport('csv')}
                disabled={loading}
              >
                <Download className="w-4 h-4" />
                <span>{loading ? 'Exporting...' : 'Export'}</span>
              </button>
              
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                onClick={loadData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setSelectedTab("all")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                selectedTab === "all"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              All Complaints ({totalCount})
            </button>
            <button
              onClick={() => setSelectedTab("pending")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                selectedTab === "pending"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setSelectedTab("resolved")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                selectedTab === "resolved"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Complaints */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-blue-600">📋</span>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Complaints</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{totalCount}</p>
                  <p className="text-gray-500 text-xs mt-2">All types</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Customers</p>
                  <p className="font-medium text-gray-800">{stats?.byComplainantType?.CUSTOMER || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Sellers</p>
                  <p className="font-medium text-gray-800">{stats?.byComplainantType?.SELLER || 0}</p>
                </div>
              </div>
            </div>
            
            {/* Pending Complaints */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-red-600">⏳</span>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{pendingCount}</p>
                  <p className="text-gray-500 text-xs mt-2">Awaiting resolution</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. wait time</span>
                  <span className="font-medium text-gray-800">{stats?.avgWaitTime?.toFixed(1) || 0} hours</span>
                </div>
              </div>
            </div>
            
            {/* Resolved Complaints */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-green-600">✅</span>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Resolved</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{resolvedCount}</p>
                  <p className="text-gray-500 text-xs mt-2">This month</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Resolution rate</span>
                  <span className="font-medium text-gray-800">{stats?.resolutionRate?.toFixed(1) || 0}%</span>
                </div>
              </div>
            </div>
            
            {/* Average Response Time */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-purple-600">⏱️</span>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Avg. Response Time</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats?.avgResolutionTime?.toFixed(1) || 0}h</p>
                  <p className="text-gray-500 text-xs mt-2">Hours to resolution</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Goal</span>
                  <span className="font-medium text-green-600">24h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by complaint ID, title, or names..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <select 
                  title="Complaint Type"
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="ORDER_ISSUE">Order Issues</option>
                  <option value="DELIVERY_PROBLEM">Delivery Problems</option>
                  <option value="QUALITY_ISSUE">Quality Issues</option>
                  <option value="REFUND_REQUEST">Refund Requests</option>
                  <option value="SELLER_BEHAVIOR">Seller Behavior</option>
                  <option value="CUSTOMER_BEHAVIOR">Customer Behavior</option>
                  <option value="PAYMENT_ISSUE">Payment Issues</option>
                  <option value="ACCOUNT_ISSUE">Account Issues</option>
                  <option value="PRODUCT_ISSUE">Product Issues</option>
                  <option value="OTHER">Other</option>
                </select>

                <select 
                  title="filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="ESCALATED">Escalated</option>
                </select>

                <select 
                  title="priority"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm"
                  placeholder="From date"
                />

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm"
                  placeholder="To date"
                />

                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setComplaintType("all");
                    setPriorityFilter("all");
                    setStartDate("");
                    setEndDate("");
                    clearFilters();
                    setSelectedTab("all");
                  }}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Complaints List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-gray-600 text-sm font-medium">
                <div className="col-span-1">ID</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Complainant</div>
                <div className="col-span-2">Against</div>
                <div className="col-span-1">Priority</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
                <p className="text-gray-500">Loading complaints...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Error Loading Complaints</h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
              </div>
            )}

            {/* Complaints List */}
            {!loading && !error && filteredComplaints.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredComplaints.map((complaint) => (
                  <div key={complaint.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50">
                    <div className="col-span-1">
                      <span className="font-mono text-sm text-gray-700">{complaint.complaintCode?.substring(0, 8) || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-gray-700">{complaint.complaintType?.replace('_', ' ') || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {complaint.complainant?.name || complaint.complainant?.businessName || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">{complaint.complainantType || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {complaint.accused?.name || complaint.accused?.businessName || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">{complaint.accusedType || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority || 'N/A'}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {complaint.status?.replace('_', ' ') || 'N/A'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-gray-500">{formatDate(complaint.createdAt)}</span>
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() => handleViewDetails(complaint)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              !loading && !error && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {selectedTab === "all" && <span className="text-2xl text-gray-400">📋</span>}
                    {selectedTab === "pending" && <span className="text-2xl text-gray-400">⏳</span>}
                    {selectedTab === "resolved" && <span className="text-2xl text-gray-400">✅</span>}
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    {searchTerm 
                      ? "No matching complaints found" 
                      : selectedTab === "pending" 
                        ? "No pending complaints" 
                        : selectedTab === "resolved"
                          ? "No resolved complaints"
                          : "No complaints yet"
                    }
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm 
                      ? "Try adjusting your search or filters" 
                      : "Customer and seller complaints will appear here"
                    }
                  </p>
                  {!searchTerm && selectedTab === "all" && (
                    <button
                      onClick={loadData}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Check for New Complaints</span>
                    </button>
                  )}
                </div>
              )
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setFilters({ page: pagination.page - 1 });
                    getAllComplaints();
                  }}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => {
                    setFilters({ page: pagination.page + 1 });
                    getAllComplaints();
                  }}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Complaint Type Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Complaint Types</h3>
                  <p className="text-gray-500 text-sm">Distribution by category</p>
                </div>
                <select 
                  title="Analytics Period"
                  value={analyticsPeriod}
                  onChange={(e) => handleAnalyticsPeriodChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">Last 3 Months</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              
              <div className="h-64 rounded-lg flex flex-col items-center justify-center">
                {analytics?.data?.types ? (
                  <div className="w-full h-full">
                    {/* Simple bar chart visualization */}
                    {Object.entries(analytics.data.types).map(([type, count]: [string, any]) => (
                      <div key={type} className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{type.replace('_', ' ')}</span>
                          <span className="text-gray-500">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((count / totalCount) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-gray-400">📊</span>
                    </div>
                    <p className="text-gray-500">Loading type distribution...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Status Overview</h3>
                  <p className="text-gray-500 text-sm">Current complaint statuses</p>
                </div>
              </div>
              
              <div className="h-64 rounded-lg flex flex-col items-center justify-center">
                {stats?.byStatus ? (
                  <div className="w-full h-full">
                    {Object.entries(stats.byStatus).map(([status, count]: [string, any]) => (
                      <div key={status} className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{status.replace('_', ' ')}</span>
                          <span className="text-gray-500">{count} ({(count / totalCount * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${getStatusColor(status).split(' ')[0]}`}
                            style={{ width: `${Math.min((count / totalCount) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-gray-400">📈</span>
                    </div>
                    <p className="text-gray-500">Loading status data...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Resolve Complaint Modal */}
      {showResolveModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Resolve Complaint</h3>
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleResolveSubmit}>
                <div className="space-y-4">
                  {/* Complaint Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Complaint Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">ID:</span>
                        <span className="ml-2 font-medium">{selectedComplaint.complaintCode}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2 font-medium">{selectedComplaint.complaintType?.replace('_', ' ') || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Priority:</span>
                        <span className="ml-2 font-medium">{selectedComplaint.priority || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className="ml-2 font-medium">{selectedComplaint.status?.replace('_', ' ') || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Resolution Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resolution Description *
                    </label>
                    <textarea
                      required
                      value={resolutionForm.resolution}
                      onChange={(e) => setResolutionForm({...resolutionForm, resolution: e.target.value})}
                      placeholder="Describe how the complaint was resolved..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      This will be visible to the complainant
                    </p>
                  </div>

                  {/* Action Taken */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Actions Taken *
                    </label>
                    <textarea
                      required
                      value={resolutionForm.actionTaken}
                      onChange={(e) => setResolutionForm({...resolutionForm, actionTaken: e.target.value})}
                      placeholder="What specific actions were taken to resolve this complaint?"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Follow Up */}
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={resolutionForm.followUpRequired}
                        onChange={(e) => setResolutionForm({...resolutionForm, followUpRequired: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Requires Follow-up</span>
                    </label>

                    {resolutionForm.followUpRequired && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Follow-up Date
                        </label>
                        <input
                          title="date"
                          type="date"
                          value={resolutionForm.followUpDate}
                          onChange={(e) => setResolutionForm({...resolutionForm, followUpDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Final Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Final Status
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                        resolutionForm.status === "RESOLVED" 
                          ? "border-green-500 bg-green-50" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          value="RESOLVED"
                          checked={resolutionForm.status === "RESOLVED"}
                          onChange={(e) => setResolutionForm({...resolutionForm, status: e.target.value})}
                          className="mr-2"
                        />
                        <div>
                          <span className="font-medium text-gray-800">✅ Resolved</span>
                          <p className="text-sm text-gray-500 mt-1">Issue has been successfully resolved</p>
                        </div>
                      </label>
                      
                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                        resolutionForm.status === "CLOSED" 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          value="CLOSED"
                          checked={resolutionForm.status === "CLOSED"}
                          onChange={(e) => setResolutionForm({...resolutionForm, status: e.target.value})}
                          className="mr-2"
                        />
                        <div>
                          <span className="font-medium text-gray-800">🔒 Closed</span>
                          <p className="text-sm text-gray-500 mt-1">No further action required</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Mark as ${resolutionForm.status === "RESOLVED" ? "Resolved" : "Closed"}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Details Modal */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Complaint Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Header Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Complaint ID</p>
                    <p className="font-medium">{selectedComplaint.complaintCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium">{selectedComplaint.complaintType?.replace('_', ' ') || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Priority</p>
                    <p className="font-medium">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(selectedComplaint.priority)}`}>
                        {selectedComplaint.priority || 'N/A'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{formatDate(selectedComplaint.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Parties Involved */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Complainant */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Complainant</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">{selectedComplaint.complainantType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">
                        {selectedComplaint.complainant?.name || selectedComplaint.complainant?.businessName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact</p>
                      <p className="font-medium">
                        {selectedComplaint.complainant?.email || selectedComplaint.complainant?.businessEmail || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ID</p>
                      <p className="font-medium">{selectedComplaint.complainantId}</p>
                    </div>
                  </div>
                </div>

                {/* Accused Party */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Accused Party</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">{selectedComplaint.accusedType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">
                        {selectedComplaint.accused?.name || selectedComplaint.accused?.businessName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact</p>
                      <p className="font-medium">
                        {selectedComplaint.accused?.email || selectedComplaint.accused?.businessEmail || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ID</p>
                      <p className="font-medium">{selectedComplaint.accusedId}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Complaint Details */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Complaint Details</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Subject</p>
                    <p className="font-medium">{selectedComplaint.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="whitespace-pre-line">{selectedComplaint.description}</p>
                  </div>
                  {selectedComplaint.orderId && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Related Order</p>
                      <p className="font-medium">Order #{selectedComplaint.orderId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Status */}
              <div className="mb-6">
                <div className={`inline-flex items-center px-4 py-2 rounded-lg ${getStatusColor(selectedComplaint.status)}`}>
                  <span className="font-medium">Current Status: {selectedComplaint.status?.replace('_', ' ') || 'N/A'}</span>
                </div>
                {selectedComplaint.resolvedAt && (
                  <p className="text-sm text-gray-500 mt-2">
                    Resolved on {formatDate(selectedComplaint.resolvedAt)}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                {!['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowResolveModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Start Resolution
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}