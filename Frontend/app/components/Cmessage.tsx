"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { Button } from "../components/ui/button"
import { MessageSquare, Reply, Loader2, Clock, User } from "lucide-react"
import { useChatStore } from "../ZustandStore/chatStore"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface MessagePreview {
  id: number;
  seller: string;
  avatar: string;
  message: string;
  time: string;
  unread: boolean;
  roomId: number;
  sellerId: number;
}

export function SellerMessages() {
  const [messages, setMessages] = useState<MessagePreview[]>([])
  const [loading, setLoading] = useState(true)
  const { rooms, fetchRooms, messages: chatMessages, activeRoomId, setActiveRoom, loading: chatLoading } = useChatStore()
  const router = useRouter()

  useEffect(() => {
    // Fetch chat rooms when component mounts
    fetchRooms()
  }, [])

  useEffect(() => {
    if (rooms && Array.isArray(rooms)) {
      processRooms(rooms)
    }
  }, [rooms, chatMessages])

  const processRooms = (chatRooms: any[]) => {
    setLoading(true)
    
    try {
      // Get the latest message from each room
      const messagePreviews: MessagePreview[] = []
      
      chatRooms.forEach(room => {
        // Get latest message for this room from chat store
        const roomMessages = chatMessages.filter(msg => msg.chatroomId === room.chatroomId)
        const latestMessage = roomMessages.length > 0 
          ? roomMessages[roomMessages.length - 1]
          : null
        
        // Determine if there are unread messages
        // You might want to track read status in your Message model
        const hasUnread = latestMessage ? !latestMessage.read : false
        
        // Get seller info
        const sellerName = room.seller?.businessName || "Seller"
        const sellerAvatar = room.seller?.storeImg || "/placeholder-shop.png"
        
        // Format time
        const messageTime = latestMessage?.createdAt || room.createdAt
        const timeAgo = formatTimeAgo(messageTime)
        
        messagePreviews.push({
          id: room.chatroomId,
          seller: sellerName,
          avatar: sellerAvatar,
          message: latestMessage?.content || "No messages yet",
          time: timeAgo,
          unread: hasUnread,
          roomId: room.chatroomId,
          sellerId: room.sellerId
        })
      })
      
      // Sort by most recent activity (latest message or room creation)
      const sortedMessages = messagePreviews.sort((a, b) => {
        const roomA = chatRooms.find(r => r.chatroomId === a.roomId)
        const roomB = chatRooms.find(r => r.chatroomId === b.roomId)
        
        const timeA = chatMessages.filter(m => m.chatroomId === a.roomId)
          .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0]?.createdAt || roomA?.createdAt
        const timeB = chatMessages.filter(m => m.chatroomId === b.roomId)
          .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0]?.createdAt || roomB?.createdAt
        
        return new Date(timeB).getTime() - new Date(timeA).getTime()
      })
      
      // Take only the first 3 for preview
      setMessages(sortedMessages.slice(0, 3))
    } catch (error) {
      console.error("Error processing rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "Just now"
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Just now"
    
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const handleReply = (roomId: number) => {
    // Set this room as active and navigate to messages
    setActiveRoom(roomId)
    router.push('/customerdashboard/message')
  }

  const handleViewAll = () => {
    router.push('/customerdashboard/message')
  }

  if (loading || chatLoading) {
    return (
      <Card className="bg-white text-black">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages from Sellers
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

  if (messages.length === 0) {
    return (
      <Card className="bg-white text-black">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages from Sellers
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/shops')}
          >
            Browse Shops
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No messages yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Start chatting with sellers to see messages here
            </p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/shops')}
            >
              Start Chatting
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white text-black">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages from Sellers
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleViewAll}
        >
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 rounded-lg border p-4 transition-all hover:shadow-md cursor-pointer ${
                message.unread 
                  ? "bg-blue-50 border-blue-200 hover:bg-blue-100" 
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleReply(message.roomId)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={message.avatar} 
                  alt={message.seller}
                  className="object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <AvatarFallback className="bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-600 rounded-full h-10 w-10 flex items-center justify-center">
                  {message.seller.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{message.seller}</p>
                  <div className="flex items-center gap-1">
                    {message.unread && (
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    )}
                    <p className="text-xs text-gray-500 whitespace-nowrap">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {message.time}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {message.message}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReply(message.roomId)
                }}
                title="Reply to message"
              >
                <Reply className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        {rooms.length > 3 && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleViewAll}
            >
              View All {rooms.length} Conversations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}