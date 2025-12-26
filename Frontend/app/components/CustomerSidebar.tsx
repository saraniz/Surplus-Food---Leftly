"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "../libs/utils"
import { Button } from "../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import {
  LayoutDashboard,
  History,
  ShoppingCart,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
} from "lucide-react"
import { useCusAuthStore } from "../ZustandStore/authStore"

interface SidebarProps {
  className?: string
}

const navigation = [
  { name: "Dashboard", href: "/customerdashboard", icon: LayoutDashboard },
  { name: "Order History", href: "/customerdashboard/orderhistory", icon: History },
  { name: "Cart", href: "/cart", icon: ShoppingCart },
  { name: "Messages", href: "/customerdashboard/message", icon: MessageSquare },
  { name: "Settings", href: "/customerdashboard/settings", icon: Settings },
]

export default function CustomerSidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const { customer, fetchCusDetails, logout, loading } = useCusAuthStore()

  useEffect(() => {
    fetchCusDetails().catch(() => {})
  }, [fetchCusDetails])

  const handleLogout = async () => {
    await logout()
    window.location.href = "/"
  }

  const getInitials = () => {
    if (!customer?.name) return "C"
    return customer.name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link href="/homepage" className="flex items-center gap-2">
            <Store className="h-6 w-6 text-sidebar-primary" />
            <span className="font-semibold text-sidebar-foreground">Leftly</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* User Profile */}
      <div className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
          ) : (
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={customer?.cusProfileImg || "/customer-profile.jpg"}
                alt={customer?.name || "Customer"}
              />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          )}

          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {customer?.name || "Customer"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {customer?.email || ""}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive =
            item.href === "/customerdashboard"
              ? pathname === "/customerdashboard"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3",
            collapsed && "justify-center"
          )}
          onClick={handleLogout}
          disabled={loading}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  )
}
