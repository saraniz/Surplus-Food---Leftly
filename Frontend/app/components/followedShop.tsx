"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { Badge } from "../components/ui/badge"
import { Heart, ExternalLink, Loader2, Star, Users } from "lucide-react"
import { useFollowStore } from "../ZustandStore/followStore"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function FollowedShops() {
  const [shops, setShops] = useState<any[]>([])
  const { follow: followedShops, fetchFollowedShops, loading } = useFollowStore()
  const router = useRouter()

  useEffect(() => {
    // Fetch followed shops when component mounts
    fetchFollowedShops()
  }, [])

  useEffect(() => {
    if (followedShops && Array.isArray(followedShops)) {
      // Transform the followed shops data for display
      const transformedShops = followedShops.map(shop => ({
        id: shop.seller?.seller_id || shop.id,
        name: shop.seller?.businessName || "Unknown Shop",
        avatar: shop.seller?.storeImg || "/placeholder-shop.png",
        category: "Store", // You might want to add category to your seller model
        followers: "Calculating...", // You'll need to fetch this separately
        newProducts: 0, // You'll need to fetch this separately
        rating: 4.5, // Default rating, fetch from seller data if available
        sellerData: shop.seller
      }))
      setShops(transformedShops)
    }
  }, [followedShops])

  const handleVisitShop = (shopId: number) => {
    router.push(`/shop/${shopId}`)
  }

  const formatFollowerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  if (loading) {
    return (
      <Card className="bg-white text-black shadow-md">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Heart className="h-5 w-5 text-black" />
            Followed Shops
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (shops.length === 0) {
    return (
      <Card className="bg-white text-black shadow-md">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Heart className="h-5 w-5 text-black" />
            Followed Shops
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            className="hover:bg-gray-50"
            onClick={() => router.push('/shops')}
          >
            Discover Shops
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No shops followed yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Start following shops to see them here
            </p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/shops')}
            >
              Browse Shops
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white text-black shadow-md">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Heart className="h-5 w-5 text-black" />
          Followed Shops ({shops.length})
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          className="hover:bg-gray-50"
          onClick={() => router.push('/shops')}
        >
          Discover More
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {shops.slice(0, 4).map((shop) => (
            <div
              key={shop.id}
              className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              onClick={() => handleVisitShop(shop.id)}
            >
              <Avatar className="h-14 w-14">
                <AvatarImage 
                  src={shop.avatar} 
                  alt={shop.name}
                  className="object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <AvatarFallback className="bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-600 rounded-full h-14 w-14 flex items-center justify-center text-lg font-bold">
                  {shop.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1 text-black">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-black hover:text-blue-600">
                    {shop.name}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-gray-100 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation() // Prevent card click
                      handleVisitShop(shop.id)
                    }}
                  >
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500">{shop.category}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-gray-600">
                    <Users className="h-3 w-3" />
                    {shop.followers}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    {shop.rating.toFixed(1)}
                  </span>
                  {shop.newProducts > 0 && (
                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-600">
                      {shop.newProducts} new
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {shops.length > 4 && (
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push('/followed-shops')}
              className="w-full"
            >
              View All {shops.length} Followed Shops
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}