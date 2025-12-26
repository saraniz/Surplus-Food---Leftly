"use client"

import CustomerSidebar from "../components/CustomerSidebar"
import { DashboardStats } from "../components/DashboardStat"
import { RecentOrders } from "../components/RecentOrders"
import { SellerMessages } from "../components/Cmessage"
import { FollowedShops } from "../components/followedShop"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Search, Bell, User } from "lucide-react"
import { useCusAuthStore } from "../ZustandStore/authStore"
import { useEffect, useState } from "react"

export default function CustomerDashboard() {
  const { customer, fetchCusDetails, loading } = useCusAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        await fetchCusDetails()
        console.log("Customer data loaded:", {
          hasCustomer: !!customer,
          hasImage: !!customer?.cusProfileImg,
          imageType: customer?.cusProfileImg?.substring(0, 50)
        })
      } catch (error) {
        console.error("Failed to fetch customer details:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadCustomerData()
  }, [fetchCusDetails])

  // Get initials for fallback
  const getInitials = () => {
    if (!customer?.name) return "C"
    return customer.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Show loading state
  if (isLoading || loading) {
    return (
      <div className="flex h-screen bg-white text-black">
        <CustomerSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white text-black">
      <CustomerSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-1 top-1/2 h-4 w-7 -translate-y-1/2 text-gray-500" />
                <Input placeholder="      Search products, orders, or shops..." className="pl-10 bg-white text-black border-gray-300" />
              </div>
            </div>

            <div className="flex items-center gap-7">
              {/* <Button variant="ghost" size="sm" className="relative text-black">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-600 text-xs"></span>
              </Button> */}

              {/* Custom Avatar Implementation */}
              <div className="relative">
                {customer?.cusProfileImg && !imageError ? (
                  <img
                    src={customer.cusProfileImg}
                    alt={customer.name || "Profile"}
                    className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                    onError={() => {
                      console.log("Image failed to load:", customer.cusProfileImg?.substring(0, 100))
                      setImageError(true)
                    }}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-200">
                    <span className="text-blue-600 font-semibold text-sm">
                      {getInitials()}
                    </span>
                  </div>
                )}
                
                {/* Status indicator */}
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
              </div>
              
              {/* Debug info - remove in production */}
              <div className="text-xs text-gray-500 hidden">
                Has image: {customer?.cusProfileImg ? "Yes" : "No"}
                Image starts with: {customer?.cusProfileImg?.substring(0, 20)}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-black">
                Welcome back, {customer?.name || "Customer"} 👋
              </h1>
              <p className="text-gray-600">
                Here's what's happening with your orders and favorite shops today.
              </p>
            </div>

            {/* Stats Grid */}
            <DashboardStats />

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <RecentOrders />
              </div>

              <div className="space-y-6">
                <FollowedShops />
                <SellerMessages />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}