"use client"

import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Bell, User, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"

export default function Navbar() {
  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
      {/* Search */}
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search products..." className="pl-10 bg-gray-700 text-white border-gray-600" />
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="relative text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-xs"></span>
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src="/customer-profile.jpg" />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
