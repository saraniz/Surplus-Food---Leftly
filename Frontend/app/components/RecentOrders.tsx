"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Eye, Loader2 } from "lucide-react"
import { useOrderStore } from "../ZustandStore/orderStore"
import { useEffect, useState } from "react"

const statusColors = {
  delivered: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  default: "bg-gray-100 text-gray-800",
}

export function RecentOrders() {
  const { order: orders, getOrders, loading } = useOrderStore()
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  useEffect(() => {
    // Fetch orders when component mounts
    getOrders()
  }, [])

  useEffect(() => {
    if (orders && Array.isArray(orders)) {
      // Sort orders by date (newest first) and take first 6
      const sortedOrders = [...orders]
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.orderDate || a.date || 0)
          const dateB = new Date(b.createdAt || b.orderDate || b.date || 0)
          return dateB.getTime() - dateA.getTime()
        })
        .slice(0, 6) // Show only 6 most recent orders
      
      setRecentOrders(sortedOrders)
    } else if (orders && !Array.isArray(orders)) {
      // If orders is an object, extract the array
      const ordersArray = orders.orders || orders.order || []
      const sortedOrders = [...ordersArray]
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.orderDate || a.date || 0)
          const dateB = new Date(b.createdAt || b.orderDate || b.date || 0)
          return dateB.getTime() - dateA.getTime()
        })
        .slice(0, 6)
      
      setRecentOrders(sortedOrders)
    }
  }, [orders])

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || 'default'
    return statusColors[normalizedStatus as keyof typeof statusColors] || statusColors.default
  }

  const getStatusText = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || 'pending'
    // Capitalize first letter
    return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid date"
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getOrderPrice = (order: any) => {
    // Try multiple possible price field names
    const price = 
      order.totalPrice || 
      order.total_price || 
      order.totalAmount || 
      order.total_amount || 
      order.price || 
      order.amount ||
      order.total ||
      0;
    
    // Convert to number if it's a string
    const numPrice = typeof price === 'string' 
      ? parseFloat(price.replace(/[^0-9.-]+/g, '')) 
      : Number(price);
    
    // Return 0 if not a valid number
    return isNaN(numPrice) ? 0 : numPrice;
  }

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' 
      ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) 
      : Number(amount);
    
    if (isNaN(numAmount)) {
      return "Rs 0.00";
    }
    
    return `Rs ${numAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  const getOrderId = (order: any) => {
    return order.orderId || order.order_id || order.id || `ORD-${order.id || 'N/A'}`
  }

  const getOrderItems = (order: any) => {
    if (order.items && Array.isArray(order.items)) {
      if (order.items.length === 0) return "No items"
      
      // Get item names, limit to 2 items for display
      const itemNames = order.items
        .slice(0, 2)
        .map((item: any) => item.productName || item.name || "Item")
        .join(", ")
      
      // Add "+X more" if there are more items
      if (order.items.length > 2) {
        return `${itemNames} +${order.items.length - 2} more`
      }
      return itemNames
    }
    
    // If items is a string or not available
    return order.itemsText || order.description || "Items not available"
  }

  const handleViewOrder = (order: any) => {
    // Handle view order action
    console.log("Order details:", {
      id: getOrderId(order),
      status: order.status,
      price: getOrderPrice(order),
      formattedPrice: formatCurrency(getOrderPrice(order)),
      date: formatDate(order.createdAt || order.orderDate || order.date),
      items: order.items
    });
    // You can navigate to order details page or show modal
    // router.push(`/orders/${order.orderId || order.order_id || order.id}`)
  }

  if (loading && (!recentOrders || recentOrders.length === 0)) {
    return (
      <Card className="bg-white">
        <CardHeader className="bg-white">
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white">
      <CardHeader className="bg-white flex flex-row items-center justify-between">
        <CardTitle>Recent Orders</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // Navigate to all orders page
            // router.push('/orders')
          }}
        >
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {recentOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found</p>
            <p className="text-sm text-gray-400 mt-2">Your recent orders will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order, index) => {
              const orderPrice = getOrderPrice(order);
              
              return (
                <div 
                  key={`${getOrderId(order)}-${index}`} 
                  className="flex items-center justify-between rounded-lg border p-4 bg-white text-black hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{getOrderId(order)}</p>
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(order.status)}
                      >
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {getOrderItems(order)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.createdAt || order.orderDate || order.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-green-700">
                      {formatCurrency(orderPrice)}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                      title="View order details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}