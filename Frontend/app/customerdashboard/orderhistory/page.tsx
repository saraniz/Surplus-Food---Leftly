"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { ExternalLink, Filter, Search, Bell, User, X, AlertCircle, CheckCircle } from "lucide-react";
import CustomerSidebar from "../../components/CustomerSidebar";
import { useOrderStore } from "@/app/ZustandStore/orderStore";
import { useEffect, useState, useMemo } from "react";
import { useProductStore } from "@/app/ZustandStore/productStore";
import { toast } from "react-hot-toast";

function getStatusBadge(status: string) {
  if (!status) return <Badge>Unknown</Badge>;
  
  switch (status.toUpperCase()) {
    case "PLACED":
    case "PROCESSING":
      return (
        <Badge className="bg-green-50 text-green-700 border border-green-200">
          {status}
        </Badge>
      );
    case "DELIVERED":
    case "COMPLETED":
      return (
        <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
          {status}
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200">
          {status}
        </Badge>
      );
    case "CANCELLED":
    case "FAILED":
      return (
        <Badge className="bg-red-50 text-red-700 border border-red-200">
          {status}
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

function getPaymentStatusBadge(status: string) {
  if (!status) return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
  
  switch (status.toUpperCase()) {
    case "PAID":
      return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
    case "PENDING":
      return <Badge className="bg-amber-100 text-amber-800">{status}</Badge>;
    case "REFUNDED":
      return <Badge className="bg-purple-100 text-purple-800">{status}</Badge>;
    case "REFUND_PENDING":
      return <Badge className="bg-orange-100 text-orange-800">Refund Pending</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  }
}

/* ---------------- Main Component ---------------- */
export default function OrderHistory() {
  const [openOrderDetails, setOpenOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const { order, getOrders, cancelOrder } = useOrderStore();
  const { products } = useProductStore();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        await getOrders();
      } catch (err) {
        setError("Failed to load orders. Please try again.");
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  /* ---------------- Check if order can be cancelled (5-minute limit) ---------------- */
  const canCancelOrder = (order: any) => {
    if (!order || !order.createdAt) return false;
    
    // Check if order is already cancelled
    if (order.orderStatus === "CANCELLED") return false;
    
    // Allowed statuses for cancellation
    const allowedStatuses = ["PLACED", "PENDING", "PROCESSING"];
    if (!allowedStatuses.includes(order.orderStatus)) return false;
    
    // Check 5-minute time limit
    const orderTime = new Date(order.createdAt);
    const currentTime = new Date();
    const timeDifference = (currentTime.getTime() - orderTime.getTime()) / (1000 * 60); // minutes
    
    // 5-minute limit
    const MAX_CANCELLATION_MINUTES = 5;
    
    // Return true if within 5 minutes
    return timeDifference <= MAX_CANCELLATION_MINUTES;
  };

  /* ---------------- Get remaining cancellation time ---------------- */
  const getRemainingCancellationTime = (order: any) => {
    if (!order || !order.createdAt) return "N/A";
    
    const orderTime = new Date(order.createdAt);
    const currentTime = new Date();
    const timeDifference = (currentTime.getTime() - orderTime.getTime()) / (1000 * 60); // minutes
    
    // 5-minute limit
    const MAX_CANCELLATION_MINUTES = 5;
    const remainingMinutes = MAX_CANCELLATION_MINUTES - timeDifference;
    
    if (remainingMinutes <= 0) return "0 minutes";
    
    const minutes = Math.floor(remainingMinutes);
    const seconds = Math.floor((remainingMinutes - minutes) * 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  /* ---------------- Handle cancellation ---------------- */
  const handleCancelClick = (order: any) => {
    if (!canCancelOrder(order)) {
      toast.error("This order can no longer be cancelled. Orders can only be cancelled within 5 minutes of placement.");
      return;
    }
    
    setOrderToCancel(order);
    setCancellationReason("");
    setCancelDialogOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel || !cancellationReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    setCancelling(true);
    try {
      await cancelOrder(orderToCancel.order_id, cancellationReason);
      toast.success("Order cancelled successfully!");
      setCancelDialogOpen(false);
      setOrderToCancel(null);
      setCancellationReason("");
      
      // Refresh orders
      await getOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  /* ---------------- Search Handler ---------------- */
  const handleSearch = () => {
    const trimmedQuery = searchTerm.trim();
    setSearchQuery(trimmedQuery);
    setShowSearchResults(trimmedQuery.length > 0);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
    if (e.key === "Escape") {
      handleClearSearch();
    }
  };

  /* ---------------- Filter Orders ---------------- */
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(order)) return [];
    
    if (!searchQuery) return order;

    const query = searchQuery.toLowerCase();
    
    return order.filter((ord: any) => {
      // Check order ID
      if (`ORDER-0${ord.order_id}`.toLowerCase().includes(query)) return true;
      
      // Check order status
      if (ord.orderStatus?.toLowerCase().includes(query)) return true;
      
      // Check payment status
      if (ord.paymentStatus?.toLowerCase().includes(query)) return true;
      
      // Check product names in order items
      if (Array.isArray(ord.orderItems)) {
        return ord.orderItems.some((item: any) => {
          const productName = item.product?.productName || 
                            item.product?.name || 
                            item.name || 
                            "";
          return productName.toLowerCase().includes(query);
        });
      }
      
      return false;
    });
  }, [order, searchQuery]);

  /* ---------------- View Order ---------------- */
  const handleViewOrder = (orderData: any) => {
    setSelectedOrder(orderData);
    setOpenOrderDetails(true);
  };

  /* ---------------- Get Product Name Safely ---------------- */
  const getProductName = (item: any) => {
    if (!item) return "Unknown Product";
    return item.product?.productName || 
           item.product?.name || 
           item.name || 
           "Unknown Product";
  };

  /* ---------------- Get Product Price Safely ---------------- */
  const getProductPrice = (item: any) => {
    if (!item) return 0;
    return item.product?.discountPrice || 
           item.product?.price || 
           item.price || 
           0;
  };

  return (
    <div className="flex min-h-screen bg-white">
      <CustomerSidebar />

      <div className="flex-1 flex flex-col text-black">
        {/* ---------------- Header ---------------- */}
        <header className="border-b border-gray-200 bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-lg">
              {/* Search removed as per your comment */}
            </div>

            <div className="flex items-center gap-7">
              {/* <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-600 text-xs"></span>
              </Button> */}

              <Avatar className="h-8 w-8">
                <AvatarImage src="/customer-profile.jpg" alt="Customer" />
                <AvatarFallback>
                  <User className="h-5 w-5 mt-1.5" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* ---------------- Search Results Modal ---------------- */}
        {showSearchResults && filteredOrders.length > 0 && (
          <div className="absolute top-50 left-1/2 transform -translate-x-1/2 w-11/12 max-w-xl bg-green-300 rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-900">
                  Search Results ({filteredOrders.length})
                </h3>
                <button
                  type="button"
                  title="Cancel"
                  onClick={handleClearSearch}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredOrders.slice(0, 5).map((orderItem: any) => (
                  <div
                    key={orderItem.id}
                    className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-100"
                    onClick={() => {
                      handleViewOrder(orderItem);
                      setShowSearchResults(false);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">ORDER-0{orderItem.order_id}</p>
                        <p className="text-sm text-gray-600">
                          {orderItem.orderItems?.length || 0} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Rs {orderItem.totalAmount}</p>
                        {getStatusBadge(orderItem.orderStatus)}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredOrders.length > 5 && (
                  <div className="text-center text-sm text-gray-500 pt-2">
                    + {filteredOrders.length - 5} more orders
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- Page Content ---------------- */}
        <div className="flex-1 p-6 lg:p-8 overflow-auto bg-white">
          <div className="max-w-7xl mx-auto">
            {/* ---------------- Page Header ---------------- */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Order History
                  </h1>
                  <p className="text-gray-600 mt-2">Manage and track your orders</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Orders can be cancelled within 5 minutes of placement</span>
                  </div>
                </div>
                {searchQuery && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Search: "{searchQuery}"
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSearch}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* ---------------- Search Bar ---------------- */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by order ID, status, or product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-black w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    type="button"
                    title="Cancel"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* ---------------- Loading State ---------------- */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading orders...</span>
              </div>
            )}

            {/* ---------------- Error State ---------------- */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- Orders Table ---------------- */}
            {!loading && !error && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {searchQuery ? "Search Results" : "Recent Orders"}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <span className="text-sm text-gray-600">
                        {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"} found
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cancel Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((orderItem: any) => {
                          const cancellable = canCancelOrder(orderItem);
                          const remainingTime = getRemainingCancellationTime(orderItem);
                          
                          return (
                            <tr
                              key={orderItem.id}
                              className="hover:bg-gray-50 transition-colors duration-150"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-medium text-gray-900">
                                  ORDER-0{orderItem.order_id}
                                </span>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {new Date(orderItem.createdAt).toLocaleDateString()}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                {Array.isArray(orderItem.orderItems) && orderItem.orderItems.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {orderItem.orderItems.slice(0, 3).map((item: any, index: number) => (
                                      <span
                                        key={item.id || index}
                                        className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                        title={`${getProductName(item)} (${item.quantity})`}
                                      >
                                        {item.quantity}
                                      </span>
                                    ))}
                                    {orderItem.orderItems.length > 3 && (
                                      <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                                        +{orderItem.orderItems.length - 3}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">No items</span>
                                )}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-semibold text-gray-900">
                                  Rs {orderItem.totalAmount || 0}.00
                                </span>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(orderItem.orderStatus || "Unknown")}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                {getPaymentStatusBadge(orderItem.paymentStatus || "Unknown")}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                {orderItem.orderStatus === "CANCELLED" ? (
                                  <span className="text-red-600 text-sm font-medium">Cancelled</span>
                                ) : cancellable ? (
                                  <div className="text-green-600 text-sm font-medium flex items-center gap-1">
                                    <CheckCircle className="h-4 w-4" />
                                    {remainingTime}
                                  </div>
                                ) : (
                                  <span className="text-gray-500 text-sm">Expired</span>
                                )}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-3">
                                  <Button
                                    size="sm"
                                    onClick={() => handleViewOrder(orderItem)}
                                  >
                                    View Details
                                  </Button>
                                  {cancellable && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleCancelClick(orderItem)}
                                      className="flex items-center gap-2 bg-red-500 text-white hover:bg-red-600 rounded-lg"
                                    >
                                      Cancel Order
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-6 py-12 text-center text-gray-500"
                          >
                            {searchQuery ? (
                              <div>
                                <p className="text-lg font-medium">No orders found</p>
                                <p className="text-sm mt-2">
                                  No orders match "{searchQuery}"
                                </p>
                                <Button
                                  variant="outline"
                                  className="mt-4"
                                  onClick={handleClearSearch}
                                >
                                  Clear Search
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <p className="text-lg font-medium">No orders yet</p>
                                <p className="text-sm mt-2">
                                  Your order history will appear here once you start shopping.
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {filteredOrders.length} of {order?.length || 0} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="border-gray-200"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-200"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---------------- Order Details Modal ---------------- */}
        {openOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl h-[500px] overflow-y-scroll w-full">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Order Details</h2>
                  <button
                    onClick={() => setOpenOrderDetails(false)}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Order ID and Date */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">ORDER-0{selectedOrder.order_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order Date:</span>
                    <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Items Ordered */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3 text-lg">Items Ordered</h3>
                  <div className="space-y-4">
                    {Array.isArray(selectedOrder.orderItems) && selectedOrder.orderItems.length > 0 ? (
                      selectedOrder.orderItems.map((item: any, index: number) => {
                        const productName = getProductName(item);
                        const productPrice = getProductPrice(item);
                        const quantity = item.quantity || 1;
                        
                        return (
                          <div key={index} className="flex items-center justify-between border-b pb-3">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{productName}</p>
                              <p className="text-sm text-gray-600">Quantity: {quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">Rs {productPrice}</p>
                              <p className="text-sm text-gray-600">
                                Total: Rs {productPrice * quantity}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-4">No items found</p>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items Total</span>
                    <span>
                      Rs{" "}
                      {selectedOrder.orderItems?.reduce(
                        (sum: number, item: any) => sum + (getProductPrice(item) * (item.quantity || 1)),
                        0
                      )}
                    </span>
                  </div>

                  {selectedOrder.deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span>Rs {selectedOrder.deliveryFee}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-lg pt-3 border-t">
                    <span>Total Amount</span>
                    <span>Rs {selectedOrder.totalAmount || 0}</span>
                  </div>
                </div>

                {/* Additional Order Information */}
                <div className="mt-6 space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Delivery Information</p>
                    <p className="text-gray-600 mt-1">
                      <span className="font-medium font-semibold">Time:</span> {selectedOrder.deliveryTime || "Standard Delivery"} min
                    </p>
                    {selectedOrder.deliveryAddress && (
                      <p className="text-gray-600 mt-1">
                        <span className="font-medium">Address:</span> {selectedOrder.deliveryAddress}
                      </p>
                    )}
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Order Status</p>
                    <div className="mt-2">
                      {getStatusBadge(selectedOrder.orderStatus || "Unknown")}
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Payment Status</p>
                    <div className="mt-2">
                      {getPaymentStatusBadge(selectedOrder.paymentStatus || "Unknown")}
                    </div>
                  </div>
                </div>

                {/* Cancellation info if cancelled */}
                {selectedOrder.orderStatus === "CANCELLED" && selectedOrder.cancellationReason && (
                  <div className="p-3 bg-red-50 rounded-lg mt-4">
                    <p className="font-medium text-red-700">Cancellation Details</p>
                    <p className="text-red-600 mt-1">
                      <span className="font-medium">Reason:</span> {selectedOrder.cancellationReason}
                    </p>
                    {selectedOrder.cancelledAt && (
                      <p className="text-red-600 mt-1">
                        <span className="font-medium">Cancelled at:</span> {new Date(selectedOrder.cancelledAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Cancel button if cancellable */}
                {canCancelOrder(selectedOrder) && (
                  <button
                    onClick={() => {
                      setOpenOrderDetails(false);
                      handleCancelClick(selectedOrder);
                    }}
                    className="w-full mt-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    Cancel This Order ({getRemainingCancellationTime(selectedOrder)} left)
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setOpenOrderDetails(false)}
                  className="w-full mt-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- Cancellation Dialog (using basic HTML) ---------------- */}
        {cancelDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Cancel Order</h2>
                  <button
                    onClick={() => {
                      setCancelDialogOpen(false);
                      setCancellationReason("");
                    }}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                    disabled={cancelling}
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to cancel this order? This action cannot be undone.
                </p>
                
                {orderToCancel && (
                  <>
                    <div className="py-4">
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md mb-4">
                        <AlertCircle className="h-5 w-5" />
                        <div>
                          <p className="text-sm font-medium">
                            Order #{orderToCancel.order_id}
                          </p>
                          <p className="text-xs mt-1">
                            You can only cancel orders within 5 minutes of placement.
                            Time left: {getRemainingCancellationTime(orderToCancel)}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="reason" className="block text-sm font-medium mb-2">
                          Reason for cancellation *
                        </label>
                        <textarea
                          id="reason"
                          placeholder="Please provide a reason for cancellation..."
                          value={cancellationReason}
                          onChange={(e) => setCancellationReason(e.target.value)}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Providing a reason helps us improve our service.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => {
                          setCancelDialogOpen(false);
                          setCancellationReason("");
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={cancelling}
                      >
                        Back
                      </button>
                      <button
                        onClick={confirmCancelOrder}
                        disabled={cancelling || !cancellationReason.trim()}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}