// app/admin/reviews/moderation/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useReviewStore } from "../../ZustandStore/Admin/adminreviewStore"; // Adjust path as needed
import AdminSidebar from "../../components/adminSidebar";
import AdminTopbar from "../../components/AdminTopbar";
import { Loader2, AlertCircle, CheckCircle, Trash2, Flag, Shield, Filter, Search, Settings, RefreshCw } from "lucide-react";

export default function ReviewsModerationPage() {
  const {
    // Data
    reviews,
    reportedReviews,
    abuseReviews,
    analytics,
    selectedReview,
    
    // State
    loading,
    error,
    success,
    
    // Actions
    getAllReviews,
    getReviewDetails,
    getReportedReviews,
    getAbuseReviews,
    getModerationAnalytics,
    approveReview,
    rejectReview,
    deleteReview,
    bulkReviewActions,
    warnUser,
    
    // Helpers
    setSelectedReview,
    clearError,
    clearSuccess
  } = useReviewStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"moderation" | "abuse" | "reported">("moderation");
  const [searchTerm, setSearchTerm] = useState("");
  const [showActionModal, setShowActionModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "delete" | "warn">("approve");
  const [selectedReviewIds, setSelectedReviewIds] = useState<number[]>([]);
  const [timeframe, setTimeframe] = useState("7days");

  // Action form state
  const [actionForm, setActionForm] = useState({
    reason: "",
    notes: "",
    notifyUser: true,
    banUser: false
  });

  // Settings state
  const [settings, setSettings] = useState({
    autoFlagKeywords: "",
    minRatingForAutoApprove: 4,
    requireModeration: true,
    notifyOnReport: true
  });

  // Fetch data based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab, timeframe]);

  const fetchData = async () => {
    try {
      switch (activeTab) {
        case "moderation":
          await getAllReviews();
          await getModerationAnalytics(timeframe);
          break;
        case "abuse":
          await getAbuseReviews();
          break;
        case "reported":
          await getReportedReviews();
          break;
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const pendingReviews = reviews.filter(r => r.status === "PENDING").length;
    const moderatedToday = reviews.filter(r => {
      const today = new Date().toDateString();
      const reviewDate = new Date(r.createdAt).toDateString();
      return reviewDate === today && (r.status === "APPROVED" || r.status === "REJECTED");
    }).length;
    
    const approvedReviews = reviews.filter(r => r.status === "APPROVED").length;
    const totalModerated = reviews.filter(r => r.status !== "PENDING").length;
    const approvalRate = totalModerated > 0 ? Math.round((approvedReviews / totalModerated) * 100) : 0;

    return {
      pendingReviews,
      moderatedToday,
      approvalRate
    };
  };

  const stats = calculateStats();

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const reviewId = selectedReview?.reviewId || selectedReviewIds[0];
      
      if (!reviewId && selectedReviewIds.length === 0) {
        throw new Error("No review selected");
      }

      switch (actionType) {
        case "approve":
          if (selectedReviewIds.length > 0) {
            await bulkReviewActions(selectedReviewIds, "APPROVE", actionForm.reason, actionForm.notes, actionForm.notifyUser);
          } else {
            await approveReview(reviewId!, actionForm.reason, actionForm.notes, actionForm.notifyUser);
          }
          break;
        case "reject":
          if (selectedReviewIds.length > 0) {
            await bulkReviewActions(selectedReviewIds, "REJECT", actionForm.reason, actionForm.notes, actionForm.notifyUser);
          } else {
            await rejectReview(reviewId!, actionForm.reason, actionForm.notes, actionForm.notifyUser);
          }
          break;
        case "delete":
          if (selectedReviewIds.length > 0) {
            await bulkReviewActions(selectedReviewIds, "DELETE", actionForm.reason, actionForm.notes, actionForm.notifyUser);
          } else {
            await deleteReview(reviewId!, actionForm.reason, actionForm.notes, actionForm.notifyUser, actionForm.banUser);
          }
          break;
        case "warn":
          // Assuming we have userId from selected review
          if (selectedReview) {
            await warnUser(
              selectedReview.customer.id,
              "REVIEW_VIOLATION",
              actionForm.reason,
              actionForm.notifyUser,
              actionForm.banUser
            );
          }
          break;
      }

      setShowActionModal(false);
      setActionForm({ reason: "", notes: "", notifyUser: true, banUser: false });
      setSelectedReviewIds([]);
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error("Failed to perform action:", err);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // PUT /admin/reviews/settings
    console.log("Saving settings", settings);
    setShowSettingsModal(false);
  };

  // Filter reviews based on search term
  const filteredReviews = reviews.filter(review => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      review.message.toLowerCase().includes(searchLower) ||
      review.customer.name.toLowerCase().includes(searchLower) ||
      review.product.productName.toLowerCase().includes(searchLower)
    );
  });

  // Filter reported reviews
  const filteredReportedReviews = reportedReviews.filter(report => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      report.reason.toLowerCase().includes(searchLower) ||
      report.reportType.toLowerCase().includes(searchLower)
    );
  });

  // Filter abuse reviews
  const filteredAbuseReviews = abuseReviews.filter(abuse => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      abuse.message.toLowerCase().includes(searchLower) ||
      abuse.abuseType.toLowerCase().includes(searchLower) ||
      abuse.customer.name.toLowerCase().includes(searchLower)
    );
  });

  // Handle tab change
  const handleTabChange = (tab: "moderation" | "abuse" | "reported") => {
    setActiveTab(tab);
    setSearchTerm("");
    setSelectedReviewIds([]);
    setSelectedReview(null);
  };

  // Handle bulk selection
  const handleBulkSelect = (reviewId: number) => {
    setSelectedReviewIds(prev => {
      if (prev.includes(reviewId)) {
        return prev.filter(id => id !== reviewId);
      } else {
        return [...prev, reviewId];
      }
    });
  };

  // Handle select all
  // Handle select all
const handleSelectAll = () => {
  const currentTabReviews = 
    activeTab === "moderation" ? filteredReviews :
    activeTab === "abuse" ? abuseReviews :
    reportedReviews;
  
  if (selectedReviewIds.length === currentTabReviews.length) {
    setSelectedReviewIds([]);
  } else {
    setSelectedReviewIds(currentTabReviews.map(item => {
      // For moderation tab - reviews have reviewId
      if (activeTab === "moderation") {
        return (item as any).reviewId;
      }
      // For abuse tab - abuse reviews have reviewId
      else if (activeTab === "abuse") {
        return (item as any).reviewId;
      }
      // For reported tab - reports have reportId
      else {
        return (item as any).reportId;
      }
    }));
  }
};

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'DELETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <AdminTopbar 
            title="Reviews Moderation"
            subtitle="Manage reviews, abuse detection, and user reports"
            onMenuClick={() => setSidebarOpen(true)}
          />
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="m-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
              <button onClick={clearError} className="text-red-700 hover:text-red-900">×</button>
            </div>
          </div>
        )}

        {success && (
          <div className="m-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>Action completed successfully!</span>
              </div>
              <button onClick={clearSuccess} className="text-green-700 hover:text-green-900">×</button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabChange("moderation")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "moderation"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>📋</span>
              <span>Moderation Queue</span>
              {reviews.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                  {reviews.filter(r => r.status === "PENDING").length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange("abuse")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "abuse"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Abuse Detection</span>
              {abuseReviews.length > 0 && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                  {abuseReviews.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange("reported")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "reported"
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Flag className="w-4 h-4" />
              <span>Reported Reviews</span>
              {reportedReviews.length > 0 && (
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">
                  {reportedReviews.filter(r => r.status === "PENDING").length}
                </span>
              )}
            </button>
          </div>

          {/* Header Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {activeTab === "moderation" && "Reviews Moderation"}
                {activeTab === "abuse" && "Abuse Detection"}
                {activeTab === "reported" && "Reported Reviews"}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeTab === "moderation" && "Approve, reject, or moderate customer reviews"}
                {activeTab === "abuse" && "Detect and manage abusive content"}
                {activeTab === "reported" && "Handle user-reported review violations"}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? "Loading..." : "Refresh"}</span>
              </button>

              {selectedReviewIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <span className="text-blue-700 text-sm">
                    {selectedReviewIds.length} selected
                  </span>
                </div>
              )}
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
                    placeholder={
                      activeTab === "moderation" 
                        ? "Search pending reviews..." 
                        : activeTab === "abuse"
                          ? "Search abusive content..."
                          : "Search reported reviews..."
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Timeframe Selector for Analytics */}
              {activeTab === "moderation" && (
                <div className="relative">
                  <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <select 
                    title="time"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-700 text-sm"
                  >
                    <option value="today">Today</option>
                    <option value="7days">Last 7 days</option>
                    <option value="30days">Last 30 days</option>
                    <option value="90days">Last 90 days</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Tab Specific */}
          {activeTab === "moderation" && (
            <>
              {/* Moderation Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-2xl text-yellow-600">⏳</span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Pending Reviews</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {stats.pendingReviews}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">Awaiting moderation</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-2xl text-blue-600">📊</span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Moderated Today</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {stats.moderatedToday}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">Last 24 hours</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-2xl text-green-600">✅</span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Approval Rate</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {stats.approvalRate}%
                      </p>
                      <p className="text-gray-500 text-xs mt-2">Overall</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-2xl text-purple-600">📈</span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Total Reviews</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {reviews.length}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">In system</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Moderation Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => {
                      setActionType("approve");
                      setShowActionModal(true);
                    }}
                    disabled={selectedReviewIds.length === 0}
                    className={`border rounded-lg p-4 transition-colors flex flex-col items-center ${
                      selectedReviewIds.length > 0
                        ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                        : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <CheckCircle className="w-6 h-6 mb-2" />
                    <span className="font-medium">Approve Selected</span>
                    {selectedReviewIds.length > 0 && (
                      <span className="text-xs mt-1">{selectedReviewIds.length} reviews</span>
                    )}
                  </button>
                  <button 
                    onClick={() => {
                      setActionType("reject");
                      setShowActionModal(true);
                    }}
                    disabled={selectedReviewIds.length === 0}
                    className={`border rounded-lg p-4 transition-colors flex flex-col items-center ${
                      selectedReviewIds.length > 0
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <AlertCircle className="w-6 h-6 mb-2" />
                    <span className="font-medium">Reject Selected</span>
                    {selectedReviewIds.length > 0 && (
                      <span className="text-xs mt-1">{selectedReviewIds.length} reviews</span>
                    )}
                  </button>
                  <button 
                    onClick={() => {
                      setActionType("delete");
                      setShowActionModal(true);
                    }}
                    disabled={selectedReviewIds.length === 0}
                    className={`border rounded-lg p-4 transition-colors flex flex-col items-center ${
                      selectedReviewIds.length > 0
                        ? "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                        : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Trash2 className="w-6 h-6 mb-2" />
                    <span className="font-medium">Delete Selected</span>
                    {selectedReviewIds.length > 0 && (
                      <span className="text-xs mt-1">{selectedReviewIds.length} reviews</span>
                    )}
                  </button>
                  <button 
                    onClick={handleSelectAll}
                    className="border border-purple-200 bg-purple-50 text-purple-700 rounded-lg p-4 hover:bg-purple-100 transition-colors flex flex-col items-center"
                  >
                    {selectedReviewIds.length === filteredReviews.length ? (
                      <CheckCircle className="w-6 h-6 mb-2" />
                    ) : (
                      <span className="text-2xl mb-2">⬜</span>
                    )}
                    <span className="font-medium">
                      {selectedReviewIds.length === filteredReviews.length ? "Deselect All" : "Select All"}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Content Table/List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Loading State */}
            {loading && (
              <div className="p-12 text-center">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            )}

            {/* Content */}
            {!loading && (
              <>
                {/* Moderation Tab Content */}
                {activeTab === "moderation" && (
                  <>
                    {/* Table Header */}
                    <div className="border-b border-gray-200">
                      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-gray-600 text-sm font-medium">
                        <div className="col-span-1">
                          <input
                            title="table"
                            type="checkbox"
                            checked={selectedReviewIds.length === filteredReviews.length && filteredReviews.length > 0}
                            onChange={handleSelectAll}
                            className="h-4 w-4"
                          />
                        </div>
                        <div className="col-span-3">Review Content</div>
                        <div className="col-span-1">Rating</div>
                        <div className="col-span-2">Product</div>
                        <div className="col-span-2">User</div>
                        <div className="col-span-2">Submitted</div>
                        <div className="col-span-1 text-right">Actions</div>
                      </div>
                    </div>

                    {/* Reviews List */}
                    {filteredReviews.length > 0 ? (
                      filteredReviews.map((review) => (
                        <div 
                          key={review.reviewId}
                          className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 hover:bg-gray-50 ${
                            selectedReviewIds.includes(review.reviewId) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="col-span-1 flex items-center">
                            <input
                              title="filter"
                              type="checkbox"
                              checked={selectedReviewIds.includes(review.reviewId)}
                              onChange={() => handleBulkSelect(review.reviewId)}
                              className="h-4 w-4"
                            />
                          </div>
                          <div className="col-span-3">
                            <p className="text-gray-800 font-medium">{review.message.substring(0, 100)}...</p>
                            <p className="text-gray-500 text-sm mt-1">{review.product.productName}</p>
                          </div>
                          <div className="col-span-1">
                            <div className="flex items-center">
                              <span className="text-yellow-400 text-lg">★</span>
                              <span className="ml-1 font-medium">{review.rating}</span>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-800">{review.product.productName}</p>
                            <p className="text-gray-500 text-sm">ID: {review.product.product_id}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-800 font-medium">{review.customer.name}</p>
                            <p className="text-gray-500 text-sm">{review.customer.email}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-800">{formatDate(review.createdAt)}</p>
                            <p className="text-gray-500 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(review.status)}`}>
                                {review.status}
                              </span>
                            </p>
                          </div>
                          <div className="col-span-1 flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedReview(review);
                                setActionType("approve");
                                setShowActionModal(true);
                              }}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReview(review);
                                setActionType("reject");
                                setShowActionModal(true);
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Reject"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReview(review);
                                setActionType("delete");
                                setShowActionModal(true);
                              }}
                              className="text-gray-600 hover:text-gray-800 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl text-gray-400">📋</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                          {searchTerm ? "No matching reviews found" : "No reviews to moderate"}
                        </h3>
                        <p className="text-gray-500">
                          {searchTerm ? "Try adjusting your search" : "All reviews have been processed"}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {actionType === 'approve' && 'Approve Review'}
                  {actionType === 'reject' && 'Reject Review'}
                  {actionType === 'delete' && 'Delete Review'}
                  {actionType === 'warn' && 'Warn User'}
                </h3>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitAction}>
                <div className="space-y-4">
                  {actionType === 'delete' && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="banUser"
                        checked={actionForm.banUser}
                        onChange={(e) => setActionForm({...actionForm, banUser: e.target.checked})}
                        className="mr-2"
                      />
                      <label htmlFor="banUser" className="text-sm text-gray-700">
                        Also ban user from posting reviews
                      </label>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for action *
                    </label>
                    <select
                      required
                      title="reason"
                      value={actionForm.reason}
                      onChange={(e) => setActionForm({...actionForm, reason: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a reason</option>
                      <option value="APPROPRIATE_CONTENT">Appropriate content</option>
                      <option value="HELPFUL_REVIEW">Helpful review</option>
                      <option value="INAPPROPRIATE_CONTENT">Inappropriate content</option>
                      <option value="SPAM_OR_ADS">Spam or advertising</option>
                      <option value="FAKE_REVIEW">Fake or misleading review</option>
                      <option value="HATE_SPEECH">Hate speech or harassment</option>
                      <option value="PERSONAL_INFO">Personal information disclosed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={actionForm.notes}
                      onChange={(e) => setActionForm({...actionForm, notes: e.target.value})}
                      placeholder="Add any additional notes..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifyUser"
                      checked={actionForm.notifyUser}
                      onChange={(e) => setActionForm({...actionForm, notifyUser: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="notifyUser" className="text-sm text-gray-700">
                      Notify user about this action
                    </label>
                  </div>
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}