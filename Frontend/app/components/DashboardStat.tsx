"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Package, Clock, CheckCircle, DollarSign, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useOrderStore } from "../ZustandStore/orderStore"

interface DashboardStatsProps {
  userId?: number // Optional: if you need to filter by specific user
  role?: 'customer' | 'seller' // To determine which orders to fetch
}

export function DashboardStats({ userId, role = 'customer' }: DashboardStatsProps) {
  const [stats, setStats] = useState([
    {
      title: "Total Orders",
      value: "0",
      icon: Package,
      description: "All time orders",
      trend: "",
    },
    {
      title: "Pending Orders",
      value: "0",
      icon: Clock,
      description: "Awaiting processing",
      trend: "",
    },
    {
      title: "Delivered Orders",
      value: "0",
      icon: CheckCircle,
      description: "Successfully delivered",
      trend: "",
    },
    {
      title: "Total Revenue",
      value: "$0",
      icon: DollarSign,
      description: "Lifetime earnings",
      trend: "",
    },
  ])

  const { order: orders, getOrders, getSellerOrders, loading } = useOrderStore()

  useEffect(() => {
    // Fetch orders based on role
    if (role === 'seller') {
      getSellerOrders()
    } else {
      getOrders()
    }
  }, [role])

  useEffect(() => {
    if (orders && Array.isArray(orders)) {
      calculateStats(orders)
    } else if (orders && !Array.isArray(orders)) {
      // If orders is not an array but an object, try to extract the array
      const ordersArray = orders.orders || orders.order || []
      if (Array.isArray(ordersArray)) {
        calculateStats(ordersArray)
      }
    }
  }, [orders])

  const calculateStats = (orderList: any[]) => {
    if (!orderList || orderList.length === 0) {
      // Reset to zero if no orders
      setStats([
        {
          title: "Total Orders",
          value: "0",
          icon: Package,
          description: "All time orders",
          trend: "No orders yet",
        },
        {
          title: "Pending Orders",
          value: "0",
          icon: Clock,
          description: "Awaiting processing",
          trend: "No pending orders",
        },
        {
          title: "Delivered Orders",
          value: "0",
          icon: CheckCircle,
          description: "Successfully delivered",
          trend: "No deliveries yet",
        },
        {
          title: role === 'seller' ? "Total Revenue" : "Total Spent",
          value: "$0",
          icon: DollarSign,
          description: role === 'seller' ? "Lifetime earnings" : "Lifetime spending",
          trend: "No transactions",
        },
      ])
      return
    }

    // Filter orders by user if userId is provided
    let filteredOrders = orderList
    if (userId) {
      filteredOrders = orderList.filter(order => order.customerId === userId)
    }

    // Calculate basic statistics
    const totalOrders = filteredOrders.length
    const pendingOrders = filteredOrders.filter(order => 
      order.status === 'pending' || order.status === 'processing'
    ).length
    
    const deliveredOrders = filteredOrders.filter(order => 
      order.status === 'delivered' || order.status === 'completed'
    ).length

    // Calculate total amount
    let totalAmount = filteredOrders.reduce((sum, order) => {
      const amount = parseFloat(order.totalAmount || order.amount || 0)
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
   

    // Calculate trends (this month vs last month)
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Orders this month
    const ordersThisMonth = filteredOrders.filter(order => {
      const orderDate = new Date(order.createdAt || order.orderDate || order.date)
      return orderDate.getMonth() === currentMonth && 
             orderDate.getFullYear() === currentYear
    }).length

    // Orders last month
    const ordersLastMonth = filteredOrders.filter(order => {
      const orderDate = new Date(order.createdAt || order.orderDate || order.date)
      return orderDate.getMonth() === lastMonth && 
             orderDate.getFullYear() === lastMonthYear
    }).length

    // Calculate percentage change
    let monthlyTrend = ""
    if (ordersLastMonth > 0) {
      const percentageChange = Math.round(((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100)
      monthlyTrend = percentageChange > 0 
        ? `+${percentageChange}% from last month` 
        : `${percentageChange}% from last month`
    } else if (ordersThisMonth > 0) {
      monthlyTrend = "First month with orders"
    } else {
      monthlyTrend = "No orders this month"
    }

    // Pending orders created today
    const pendingToday = filteredOrders.filter(order => {
      const orderDate = new Date(order.createdAt || order.orderDate || order.date)
      return (order.status === 'pending' || order.status === 'processing') &&
             orderDate.toDateString() === today.toDateString()
    }).length

    const pendingTrend = pendingToday > 0 
      ? `${pendingToday} new today` 
      : "No new pending orders"

    // Format total amount
    const formattedTotal = `Rs ${totalAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
    

    setStats([
      {
        title: "Total Orders",
        value: totalOrders.toString(),
        icon: Package,
        description: "All time orders",
        trend: monthlyTrend,
      },
      {
        title: "Pending Orders",
        value: pendingOrders.toString(),
        icon: Clock,
        description: "Awaiting processing",
        trend: pendingTrend,
      },
      {
        title: "Delivered Orders",
        value: deliveredOrders.toString(),
        icon: CheckCircle,
        description: "Successfully delivered",
        trend: `${deliveredOrders} completed orders`,
      },
      {
        title: role === 'seller' ? "Total Revenue" : "Total Spent",
        value: formattedTotal,
        icon: DollarSign,
        description: role === 'seller' ? "Lifetime earnings" : "Lifetime spending",
        trend: `${deliveredOrders} completed orders`,
      },
    ])
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 bg-white text-black">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="relative overflow-hidden bg-white border-gray-200">
            <CardContent className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 bg-white text-black">
      {stats.map((stat) => (
        <Card key={stat.title} className="relative overflow-hidden bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stat.value}</div>
            <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
            <p className="text-xs text-blue-600 mt-1 font-medium">{stat.trend}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}