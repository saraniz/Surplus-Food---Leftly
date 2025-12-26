"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import CustomerSidebar from "../../components/CustomerSidebar";
import { useChatStore } from "@/app/ZustandStore/chatStore";
import { useSearchParams } from "next/navigation";

// Placeholder data URL for avatar
const PLACEHOLDER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='16' fill='%239ca3af'%3E?%3C/text%3E%3C/svg%3E";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  
  const {
    rooms,
    messages,
    activeRoomId,
    loading,
    error,
    fetchRooms,
    fetchMessages,
    sendMessage,
    setActiveRoom,
    connectSocket,
  } = useChatStore();

  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sellerInfo, setSellerInfo] = useState<{[key: number]: any}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasProcessedUrlRoomId, setHasProcessedUrlRoomId] = useState(false);

  // Get roomId from URL parameters
  const roomIdFromUrl = searchParams.get('roomId');

  // Use useCallback for stable references
  const fetchRoomsCallback = useCallback(async () => {
    try {
      console.log("Fetching rooms...");
      await fetchRooms();
      console.log("Rooms fetched successfully");
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  }, [fetchRooms]);

  const fetchMessagesCallback = useCallback(async (roomId: number) => {
    if (roomId && roomId > 0) {
      try {
        console.log("Fetching messages for room:", roomId);
        await fetchMessages(roomId);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }
  }, [fetchMessages]);

  useEffect(() => {
    console.log("MessagesPage mounted");
    console.log("URL roomId:", roomIdFromUrl);
    console.log("Current rooms:", rooms);
    console.log("Active room:", activeRoomId);
    
    // Only connect socket and fetch rooms on initial mount
    if (isInitialLoad) {
      console.log("Initial load - connecting socket...");
      connectSocket();
      fetchRoomsCallback();
      setIsInitialLoad(false);
    }

    // Check if we have roomId from URL (coming from ShopPage)
    if (roomIdFromUrl && !hasProcessedUrlRoomId) {
      const roomId = parseInt(roomIdFromUrl);
      console.log("Processing roomId from URL:", roomId);
      
      // Check if rooms are loaded
      if (rooms.length > 0) {
        // Rooms are loaded, find the room
        const roomExists = rooms.find(r => r.chatroomId === roomId);
        if (roomExists) {
          console.log("Room found in rooms list, setting as active");
          setActiveRoom(roomId);
        } else {
          console.log("Room not found in rooms list, but roomId from URL exists");
          // Room might not be in the list yet, but we should still try to set it
          setActiveRoom(roomId);
        }
      } else {
        // Rooms not loaded yet, but we have roomId from URL
        console.log("Rooms not loaded yet, but we have roomId from URL. Will set active room after rooms load.");
        // We'll handle this in the rooms dependency useEffect below
      }
      
      setHasProcessedUrlRoomId(true);
    }

    // Cleanup function
    return () => {
      console.log("MessagesPage unmounting or re-rendering");
    };
  }, [connectSocket, fetchRoomsCallback, isInitialLoad, roomIdFromUrl, hasProcessedUrlRoomId, rooms, setActiveRoom]);

  // Effect to handle when rooms are loaded
  useEffect(() => {
    if (roomIdFromUrl && !activeRoomId && rooms.length > 0) {
      const roomId = parseInt(roomIdFromUrl);
      console.log("Rooms loaded, checking for URL roomId:", roomId);
      
      const roomExists = rooms.find(r => r.chatroomId === roomId);
      if (roomExists) {
        console.log("Found room from URL in loaded rooms, setting active");
        setActiveRoom(roomId);
      }
    }
  }, [rooms, roomIdFromUrl, activeRoomId, setActiveRoom]);

  // Effect to handle active room changes
  useEffect(() => {
    if (activeRoomId && activeRoomId > 0) {
      console.log("Active room changed:", activeRoomId);
      fetchMessagesCallback(activeRoomId);
    }
  }, [activeRoomId, fetchMessagesCallback]);

  // Function to get seller info
  const getSellerInfoFromRoom = useCallback((room: any) => {
    if (sellerInfo[room.sellerId]) {
      return sellerInfo[room.sellerId];
    }
    
    // Try to get seller info from room data if available
    if (room.seller) {
      return {
        sellerName: room.seller.businessName || `Seller ${room.sellerId}`,
        sellerImage: room.seller.storeImg || PLACEHOLDER_AVATAR,
        category: room.seller.category || "Food & Drinks",
        isOnline: false,
        lastMessage: "Start a conversation...",
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
      };
    }
    
    // Return default info
    return {
      sellerName: `Seller ${room.sellerId}`,
      sellerImage: PLACEHOLDER_AVATAR,
      category: "Food & Drinks",
      isOnline: false,
      lastMessage: "Start a conversation...",
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0
    };
  }, [sellerInfo]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectConversation = (roomId: number) => {
    console.log("Selecting conversation:", roomId);
    setActiveRoom(roomId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoomId) return;

    console.log("Sending message:", newMessage, "to room:", activeRoomId);
    
    try {
      await sendMessage(activeRoomId, newMessage);
      setNewMessage("");
      console.log("Message sent successfully");
      
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      return "Just now";
    }
  };

  const filteredRooms = rooms.filter(room => {
    const sellerInfo = getSellerInfoFromRoom(room);
    return (
      sellerInfo.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sellerInfo.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const currentRoom = rooms.find(room => room.chatroomId === activeRoomId);
  const currentSellerInfo = currentRoom ? getSellerInfoFromRoom(currentRoom) : null;

  // Debug function
  const handleDebug = () => {
    console.log("=== DEBUG INFO ===");
    console.log("Rooms:", rooms);
    console.log("Active Room ID:", activeRoomId);
    console.log("Room from URL:", roomIdFromUrl);
    console.log("Current Room:", currentRoom);
    console.log("Messages:", messages);
    console.log("Loading:", loading);
    console.log("Error:", error);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <CustomerSidebar />
      
      <div className="flex-1 flex bg-white shadow-2xl mt-0 ml-0 overflow-hidden">
        {/* Debug button - remove in production */}
        <button 
          onClick={handleDebug}
          className="fixed top-4 right-4 z-50 px-3 py-1 bg-red-500 text-white text-xs rounded"
          style={{zIndex: 1000}}
        >
          Debug
        </button>
        
        {/* Conversations List */}
        <div className="w-96 border-r border-gray-100 bg-white/80 backdrop-blur-sm flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h1 className="text-2xl font-bold mb-2">Messages</h1>
            <p className="text-blue-100 text-sm">Chat with food sellers</p>
            
            {/* Debug info */}
            <div className="text-xs mt-2 opacity-75">
              {roomIdFromUrl && (
                <div>Room from URL: {roomIdFromUrl}</div>
              )}
              <div>Total rooms: {rooms.length}</div>
              <div>Active room: {activeRoomId || 'None'}</div>
            </div>
            
            {/* Search Bar */}
            <div className="relative mt-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
              />
            </div>
          </div>

          {loading && rooms.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-gray-500">Loading conversations...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 m-4 rounded-lg">
              Error: {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {filteredRooms.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500">
                No conversations yet. Start chatting with sellers!
              </div>
            )}
            
            {filteredRooms.map((room) => {
              const sellerInfo = getSellerInfoFromRoom(room);
              const isActive = activeRoomId === room.chatroomId;
              
              return (
                <div
                  key={room.chatroomId}
                  className={`p-4 border-b border-gray-50 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/30 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-500 shadow-sm' 
                      : ''
                  } ${roomIdFromUrl && parseInt(roomIdFromUrl) === room.chatroomId ? 'ring-2 ring-blue-400' : ''}`}
                  onClick={() => handleSelectConversation(room.chatroomId)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={sellerInfo.sellerImage}
                        alt={sellerInfo.sellerName}
                        className="w-14 h-14 rounded-2xl object-cover bg-gray-200"
                        onError={(e) => {
                          e.currentTarget.src = PLACEHOLDER_AVATAR;
                        }}
                      />
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {sellerInfo.sellerName}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {new Date(room.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-600 rounded-full">
                          {sellerInfo.category}
                        </span>
                        {roomIdFromUrl && parseInt(roomIdFromUrl) === room.chatroomId && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate leading-tight">
                        {sellerInfo.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-gray-50/50">
          {currentRoom && currentSellerInfo ? (
            <>
              {/* Chat Header */}
              <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 p-6 shadow-sm">
                <div className="flex items-center space-x-4">
                  <img
                    src={currentSellerInfo.sellerImage}
                    alt={currentSellerInfo.sellerName}
                    className="w-12 h-12 rounded-2xl object-cover bg-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_AVATAR;
                    }}
                  />
                  
                  <div className="flex-1">
                    <h2 className="font-bold text-gray-900 text-lg">
                      {currentSellerInfo.sellerName}
                    </h2>
                    <span className="text-xs font-medium px-2 py-1 bg-gradient-to-r from-green-100 to-blue-100 text-green-600 rounded-full">
                      {currentSellerInfo.category}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Room ID: {currentRoom.chatroomId}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white to-gray-50/30">
                {messages.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="inline-block p-4 rounded-full bg-blue-50 mb-4">
                      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-2">No messages yet</p>
                    <p className="text-gray-400 text-sm">Start the conversation with {currentSellerInfo.sellerName}!</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    return (
                      <div key={message.messageId || index}>
                        <div className={`flex ${message.senderType === 'customer' ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                          {message.senderType === 'seller' && (
                            <img
                              src={currentSellerInfo.sellerImage}
                              alt="Seller"
                              className="w-8 h-8 rounded-full object-cover bg-gray-200"
                              onError={(e) => {
                                e.currentTarget.src = PLACEHOLDER_AVATAR;
                              }}
                            />
                          )}
                          
                          <div className={`max-w-lg px-4 py-3 rounded-2xl ${
                            message.senderType === 'customer' 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md' 
                              : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md shadow-sm'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <p className={`text-xs mt-1.5 ${
                              message.senderType === 'customer' ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>

                          {message.senderType === 'customer' && (
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-white text-sm font-bold">You</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white/80 backdrop-blur-sm border-t border-gray-100 p-6 shadow-lg">
                <form onSubmit={handleSendMessage} className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Message ${currentSellerInfo.sellerName}...`}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || loading}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    {loading ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {rooms.length === 0 ? 'No conversations yet' : 'Select a conversation'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {rooms.length === 0 
                    ? 'Start chatting with sellers to see your conversations here'
                    : 'Choose a seller to start chatting'
                  }
                </p>
                
                {roomIdFromUrl && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Room ID {roomIdFromUrl} was requested but not found.
                    </p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      Refresh Page
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}