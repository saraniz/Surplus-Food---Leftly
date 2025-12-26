"use client";

import { useEffect, useState } from "react";
import SellerSidebar from "../../components/sellerdashboard";
import SellerHeader from "../../components/sellerHeader";
import { useOrderStore } from "@/app/ZustandStore/orderStore";
import { useChatStore } from "../../ZustandStore/chatStore";
import { useRouter } from "next/navigation";
import { X, Package, User, Clock, CreditCard, MessageCircle, Trash2, CheckCircle, XCircle, Wallet, CreditCard as CardIcon, Banknote } from "lucide-react";

// Define the OrderItem type based on your data structure
interface OrderItemType {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

// Define the Order type based on your Zustand store
interface Order {
  id: number;
  customer?: {
    name: string;
    email?: string;
    phone?: string;
    id?: number;
  };
  items: OrderItemType[];
  totalAmount: number;
  orderStatus: "PENDING" | "PLACED" | "DELIVERED" | "CANCELLED";
  pickupTime?: number;
  createdAt?: string;
  notes?: string;
  specialInstructions?: string;
  paymentMethod?: "CASH_ON_DELIVERY" | "DEBIT_CARD" | "CREDIT_CARD" | "ONLINE_WALLET" | "CASH";
  customerId?: number;
}

export default function OrdersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Toast notification states
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    show: boolean;
  } | null>(null);

  const router = useRouter();
  const { order, getSellerOrders, updateOrderStatus } = useOrderStore();
  const { createRoom, rooms, connectSocket, fetchRooms } = useChatStore();

  useEffect(() => {
    getSellerOrders();
    // Connect to socket for chat
    connectSocket();
    fetchRooms();
  }, []);

  // Cast order to Order[] - ensure it's an array
  const orders: Order[] = Array.isArray(order) ? order : [];

  const statusFilters = [
    { value: "all", label: "All Orders", count: orders.length },
    { value: "PENDING", label: "Pending", count: orders.filter(o => o.orderStatus === "PENDING").length },
    { value: "PLACED", label: "Placed", count: orders.filter(o => o.orderStatus === "PLACED").length },
    { value: "DELIVERED", label: "Delivered", count: orders.filter(o => o.orderStatus === "DELIVERED").length },
    { value: "CANCELLED", label: "Cancelled", count: orders.filter(o => o.orderStatus === "CANCELLED").length },
  ];

  const filteredOrders = filterStatus === "all" 
    ? orders
    : orders.filter(order => order.orderStatus === filterStatus);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PLACED: "bg-blue-100 text-blue-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Get payment method color, icon, and label
  const getPaymentMethodInfo = (method?: string) => {
    switch (method) {
      case 'CASH_ON_DELIVERY':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <Banknote className="w-4 h-4" />,
          label: 'Cash on Delivery'
        };
      case 'CASH':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <Banknote className="w-4 h-4" />,
          label: 'Cash'
        };
      case 'DEBIT_CARD':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: <CardIcon className="w-4 h-4" />,
          label: 'Debit Card'
        };
      case 'CREDIT_CARD':
        return {
          color: 'bg-purple-100 text-purple-800',
          icon: <CardIcon className="w-4 h-4" />,
          label: 'Credit Card'
        };
      case 'ONLINE_WALLET':
        return {
          color: 'bg-orange-100 text-orange-800',
          icon: <Wallet className="w-4 h-4" />,
          label: 'Online Wallet'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <CreditCard className="w-4 h-4" />,
          label: method || 'N/A'
        };
    }
  };

  // Format pickup time (minutes to human readable)
  const formatPickupTime = (minutes?: number) => {
    if (!minutes) return "Not scheduled";
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minutes`;
    } else if (mins === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `${hours}h ${mins}m`;
    }
  };

  // Show toast notification
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, show: true });
    
    setTimeout(() => {
      setToast((prev) => prev ? { ...prev, show: false } : null);
    }, 4000);
  };

  // Hide toast
  const hideToast = () => {
    setToast((prev) => prev ? { ...prev, show: false } : null);
  };

  // Auto-hide toast effect
  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      if (response.ok) {
        if (updateOrderStatus) {
          updateOrderStatus(orderId, newStatus);
        } else {
          getSellerOrders(); // Refresh orders
        }
        showToast(`Order status updated to ${newStatus}`, "success");
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Failed to update order status', "error");
    }
  };

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailModalOpen(true);
  };

  // Get customer ID from order
  const getCustomerId = (order: Order): number | null => {
    // First check if we have customer ID directly
    if (order.customerId) return order.customerId;
    if (order.customer?.id) return order.customer.id;
    
    // Check localStorage for seller orders mapping
    const ordersMap = localStorage.getItem('sellerOrdersMap');
    if (ordersMap) {
      try {
        const parsedMap = JSON.parse(ordersMap);
        const customerId = parsedMap[order.id];
        if (customerId) return customerId;
      } catch (e) {
        console.error('Error parsing orders map:', e);
      }
    }
    
    return null;
  };

  // Handle message button click - integrate with chat store
  // Handle message button click - integrate with chat store
const handleMessageClick = async (order: Order, e: React.MouseEvent) => {
  e.stopPropagation();
  
  try {
    showToast('Opening chat...', 'success');
    
    // Get seller ID from localStorage
    const sellerIdStr = localStorage.getItem('seller_id');
    if (!sellerIdStr) {
      showToast('Seller not authenticated. Please login again.', 'error');
      router.push('/seller/login');
      return;
    }
    
    const sellerId = parseInt(sellerIdStr);
    
    // Get customer ID
    const customerId = getCustomerId(order);
    if (!customerId) {
      showToast('Customer information not available for chat', 'error');
      return;
    }
    
    console.log('Creating/opening chat:', { sellerId, customerId, orderId: order.id });
    
    // Check if chat room already exists
    const existingRoom = rooms.find(room => 
      room.sellerId === sellerId && 
      room.customerId === customerId
    );
    
    let roomId: number;
    
    if (existingRoom) {
      // Use existing room
      roomId = existingRoom.chatroomId;
      console.log('Using existing chat room:', roomId);
    } else {
      // Create new chat room - pass customerId as the parameter
      console.log('Creating new chat room with customerId:', customerId);
      roomId = await createRoom(customerId);
      
      if (!roomId || roomId === 0) {
        showToast('Failed to create chat room. Please try again.', 'error');
        return;
      }
      
      console.log('New chat room created:', roomId);
    }
    
    // Navigate to chat page with the room ID
    router.push(`/seller/messages?roomId=${roomId}&orderId=${order.id}&customerName=${encodeURIComponent(order.customer?.name || 'Customer')}`);
    
  } catch (error) {
    console.error('Error opening chat:', error);
    showToast('Failed to open chat. Please try again.', 'error');
  }
};

  // Handle delete button click
  const handleDeleteClick = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!orderToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/orders/${orderToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast(`Order #${orderToDelete.id} deleted successfully!`, "success");
        setShowDeleteModal(false);
        setOrderToDelete(null);
        getSellerOrders();
      } else {
        throw new Error('Failed to delete order');
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      showToast(error.message || "Failed to delete order", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
  };

  // Get first product name
  const getFirstProductName = (items: OrderItemType[]) => {
    if (!items || items.length === 0) return "No products";
    return items[0]?.name || "Product";
  };

  // Get total quantity
  const getTotalQuantity = (items: OrderItemType[]) => {
    if (!items) return 0;
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format order status
  const formatOrderStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "Pending",
      PLACED: "Placed",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled"
    };
    return statusMap[status] || status;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <SellerHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
          title="Orders Management"
          subtitle="Manage Orders"
        />

        {/* Toast Notification */}
        {toast?.show && (
          <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
            <div
              className={`
                flex items-center space-x-3 p-4 rounded-xl shadow-2xl
                transform transition-all duration-300
                ${toast.type === "success" 
                  ? "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200" 
                  : "bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200"
                }
              `}
            >
              {toast.type === "success" ? (
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              )}
              
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {toast.type === "success" ? "Success!" : "Error!"}
                </p>
                <p className="text-sm text-gray-700">{toast.message}</p>
              </div>
              
              <button
                type="button"
                title="Close"
                onClick={hideToast}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6">
          {/* Debug: Show orders data
          <div className="mb-4 text-sm text-gray-500">
            Total Orders: {orders.length} | Chat Rooms: {rooms.length}
          </div> */}

          {/* Status Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  filterStatus === filter.value
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <span>{filter.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  filterStatus === filter.value ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup Time</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((orderItem: Order) => {
                      const paymentMethodInfo = getPaymentMethodInfo(orderItem.paymentMethod);
                      
                      return (
                        <tr key={orderItem.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => handleRowClick(orderItem)}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                              #{orderItem.id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{orderItem.customer?.name || "Customer"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              <span>{getFirstProductName(orderItem.items)}</span>
                              {orderItem.items && orderItem.items.length > 1 && (
                                <span className="text-gray-500 text-xs px-2 py-1 bg-gray-100 rounded-full">
                                  +{orderItem.items.length - 1}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                            <div className="font-medium">{getTotalQuantity(orderItem.items)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900">
                              Rs {orderItem.totalAmount?.toFixed(2) || "0.00"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${paymentMethodInfo.color} w-fit`}>
                              {paymentMethodInfo.icon}
                              <span>{paymentMethodInfo.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              title="Status"
                              value={orderItem.orderStatus}
                              onChange={(e) => handleUpdateStatus(orderItem.id, e.target.value)}
                              className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(orderItem.orderStatus)} border-none focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer`}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="PLACED">Placed</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {formatPickupTime(orderItem.pickupTime)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              <button 
                                onClick={(e) => handleMessageClick(orderItem, e)}
                                className="text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-2"
                                title="Message Customer"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Message
                              </button>
                              <button 
                                onClick={(e) => handleDeleteClick(orderItem, e)}
                                className="text-red-600 hover:text-red-800 transition-colors px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2"
                                title="Delete Order"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Package className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">No orders found</p>
                          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteModal && orderToDelete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={cancelDelete}
              />
              
              {/* Modal */}
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-red-50 to-white p-6 border-b border-red-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Delete Order</h2>
                        <p className="text-gray-600">#{orderToDelete.id}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      title="Close"
                      onClick={cancelDelete}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                      disabled={isDeleting}
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="font-medium text-red-800">Warning: This action cannot be undone</p>
                          <p className="text-sm text-red-600 mt-1">This will permanently delete the order.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="font-medium text-gray-900">{orderToDelete.customer?.name || "Customer"}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Items</p>
                          <p className="font-medium text-gray-900">{getTotalQuantity(orderToDelete.items)} items</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Amount</p>
                          <p className="font-medium text-gray-900">Rs {orderToDelete.totalAmount?.toFixed(2)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Payment Method</p>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodInfo(orderToDelete.paymentMethod).icon}
                          <span className="font-medium text-gray-900">{getPaymentMethodInfo(orderToDelete.paymentMethod).label}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className="font-medium text-gray-900 mb-2">Are you sure you want to delete this order?</p>
                      <p className="text-sm text-gray-600">
                        This action will remove all records of this order.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={cancelDelete}
                      className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      disabled={isDeleting}
                      className={`
                        px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2
                        ${isDeleting 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                        }
                      `}
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Yes, Delete Order
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Details Modal */}
          {isOrderDetailModalOpen && selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOrderDetailModalOpen(false)}
              />
              
              {/* Modal */}
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                        <p className="text-gray-600">#{selectedOrder.id} • {formatDate(selectedOrder.createdAt)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      title="Close"
                      onClick={() => setIsOrderDetailModalOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-500">Customer Name</p>
                              <p className="font-medium text-gray-900">{selectedOrder.customer?.name || "Customer"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Order Status */}
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>
                              {formatOrderStatus(selectedOrder.orderStatus)}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-gray-500">Order Date</p>
                              <p className="font-medium text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Order Time</p>
                              <p className="font-medium text-gray-900">{selectedOrder.createdAt ? formatTime(selectedOrder.createdAt) : "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        {/* Payment Info */}
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-500">Payment Method</p>
                              <div className="flex items-center gap-2">
                                {getPaymentMethodInfo(selectedOrder.paymentMethod).icon}
                                <span className="font-medium text-gray-900">{getPaymentMethodInfo(selectedOrder.paymentMethod).label}</span>
                              </div>
                            </div>
                            <div className="pt-3 border-t">
                              <div className="flex justify-between items-center">
                                <p className="text-lg font-semibold text-gray-900">Total Amount</p>
                                <p className="text-2xl font-bold text-gray-900">Rs {selectedOrder.totalAmount?.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pickup Info */}
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Clock className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Pickup Information</h3>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-500">Estimated Pickup Time</p>
                              <p className="font-medium text-gray-900">
                                {formatPickupTime(selectedOrder.pickupTime)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mt-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="p-5 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                  <Package className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-center">
                                  <p className="text-sm text-gray-500">Quantity</p>
                                  <p className="font-medium text-gray-900">{item.quantity}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-gray-500">Price</p>
                                  <p className="font-medium text-gray-900">Rs {item.price?.toFixed(2)}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-gray-500">Total</p>
                                  <p className="font-semibold text-gray-900">Rs {(item.quantity * item.price).toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setIsOrderDetailModalOpen(false)}
                      className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                    >
                      Close
                    </button>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => handleMessageClick(selectedOrder, e)}
                        className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-medium transition-colors flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message Customer
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.orderStatus === 'DELIVERED' ? 'PLACED' : 'DELIVERED')}
                        className="px-5 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl font-medium transition-colors"
                      >
                        {selectedOrder.orderStatus === 'DELIVERED' ? 'Mark as Placed' : 'Mark as Delivered'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}