"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import SellerSidebar from "@/app/components/sellerdashboard"; // Correct import path
import { useChatStore } from "@/app/ZustandStore/chatStore";

// Placeholder data URL for avatar
const PLACEHOLDER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='16' fill='%239ca3af'%3E?%3C/text%3E%3C/svg%3E";

export default function SellerMessagesPage() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Use useCallback for stable references
  const fetchRoomsCallback = useCallback(async () => {
    try {
      console.log("Seller fetching rooms...");
      await fetchRooms();
      console.log("Seller rooms fetched successfully");
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  }, [fetchRooms]);

  const fetchMessagesCallback = useCallback(async (roomId: number) => {
    if (roomId && roomId > 0) {
      try {
        console.log("Seller fetching messages for room:", roomId);
        await fetchMessages(roomId);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }
  }, [fetchMessages]);

  useEffect(() => {
    console.log("SellerMessagesPage mounted");
    
    // Only connect socket and fetch rooms on initial mount
    if (isInitialLoad) {
      console.log("Initial load - connecting socket...");
      connectSocket();
      fetchRoomsCallback();
      setIsInitialLoad(false);
    }

    // Cleanup function
    return () => {
      console.log("SellerMessagesPage unmounting or re-rendering");
    };
  }, [connectSocket, fetchRoomsCallback, isInitialLoad]);

  useEffect(() => {
    if (activeRoomId && activeRoomId > 0) {
      console.log("Active room changed:", activeRoomId);
      fetchMessagesCallback(activeRoomId);
    }
  }, [activeRoomId, fetchMessagesCallback]);

  // Function to get customer info from room
  const getCustomerInfoFromRoom = useCallback((room: any) => {
    if (!room) return {
      customerName: "Unknown Customer",
      customerImage: PLACEHOLDER_AVATAR,
      location: "Unknown",
      isOnline: false,
      lastMessage: "Start a conversation...",
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0
    };
    
    // Check if room has customer data directly
    if (room.customer) {
      console.log("Room has customer data:", room.customer);
      return {
        customerName: room.customer.name || `Customer ${room.customerId}`,
        customerImage: room.customer.cusProfileImg || PLACEHOLDER_AVATAR,
        location: room.customer.location || "Unknown",
        isOnline: false,
        lastMessage: "Start a conversation...",
        lastMessageTime: room.createdAt || new Date().toISOString(),
        unreadCount: 0
      };
    }
    
    // If no customer data, try to use what's available
    return {
      customerName: `Customer ${room.customerId}`,
      customerImage: PLACEHOLDER_AVATAR,
      location: "Unknown",
      isOnline: false,
      lastMessage: "Start a conversation...",
      lastMessageTime: room.createdAt || new Date().toISOString(),
      unreadCount: 0
    };
  }, []);

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

    console.log("Seller sending message:", newMessage, "to room:", activeRoomId);
    
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
    const customerInfo = getCustomerInfoFromRoom(room);
    return (
      customerInfo.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerInfo.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const currentRoom = rooms.find(room => room.chatroomId === activeRoomId);
  const currentCustomerInfo = currentRoom ? getCustomerInfoFromRoom(currentRoom) : null;

  // Debug function
  const handleDebug = () => {
    console.log("=== SELLER DEBUG INFO ===");
    console.log("User Role:", localStorage.getItem("role"));
    console.log("Rooms:", rooms);
    console.log("Rooms length:", rooms.length);
    console.log("Active Room ID:", activeRoomId);
    console.log("Current Room:", currentRoom);
    console.log("Current Customer Info:", currentCustomerInfo);
    console.log("Messages:", messages);
    console.log("Loading:", loading);
    console.log("Error:", error);
    
    // Log first room details if exists
    if (rooms.length > 0) {
      console.log("First room details:", rooms[0]);
      console.log("First room customer data:", rooms[0].customer);
    }
  };

  // Mobile sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
      {/* Seller Sidebar */}
      <SellerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md"
      >
        ☰
      </button>
      
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
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-600 to-teal-600 text-white">
            <h1 className="text-2xl font-bold mb-2">Customer Messages</h1>
            <p className="text-green-100 text-sm">Chat with your customers</p>
            
            {/* Debug info */}
            <div className="text-xs mt-2 opacity-75">
              <div>Total conversations: {rooms.length}</div>
              <div>Active room: {activeRoomId || 'None'}</div>
              <button 
                onClick={handleDebug}
                className="mt-1 px-2 py-1 bg-yellow-500 text-white text-xs rounded"
              >
                Debug Info
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative mt-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customers..."
                className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
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
                No customer conversations yet
              </div>
            )}
            
            {filteredRooms.map((room) => {
              const customerInfo = getCustomerInfoFromRoom(room);
              const isActive = activeRoomId === room.chatroomId;
              
              return (
                <div
                  key={room.chatroomId}
                  className={`p-4 border-b border-gray-50 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-teal-50/30 ${
                    isActive 
                      ? 'bg-gradient-to-r from-green-50 to-teal-50 border-l-4 border-l-green-500 shadow-sm' 
                      : ''
                  }`}
                  onClick={() => handleSelectConversation(room.chatroomId)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={customerInfo.customerImage}
                        alt={customerInfo.customerName}
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
                          {customerInfo.customerName}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {new Date(room.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium px-2 py-1 bg-gradient-to-r from-green-100 to-teal-100 text-green-600 rounded-full">
                          {customerInfo.location}
                        </span>
                        {room.customer && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Customer
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate leading-tight">
                        {customerInfo.lastMessage}
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
          {currentRoom && currentCustomerInfo ? (
            <>
              {/* Chat Header */}
              <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 p-6 shadow-sm">
                <div className="flex items-center space-x-4">
                  <img
                    src={currentCustomerInfo.customerImage}
                    alt={currentCustomerInfo.customerName}
                    className="w-12 h-12 rounded-2xl object-cover bg-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_AVATAR;
                    }}
                  />
                  
                  <div className="flex-1">
                    <h2 className="font-bold text-gray-900 text-lg">
                      {currentCustomerInfo.customerName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium px-2 py-1 bg-gradient-to-r from-green-100 to-teal-100 text-green-600 rounded-full">
                        {currentCustomerInfo.location}
                      </span>
                      <span className="text-xs text-gray-500">
                        Customer ID: {currentRoom.customerId}
                      </span>
                    </div>
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
                    <div className="inline-block p-4 rounded-full bg-green-50 mb-4">
                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-2">No messages yet</p>
                    <p className="text-gray-400 text-sm">Start the conversation with {currentCustomerInfo.customerName}!</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isSeller = message.senderType === 'seller';
                    const isCustomer = message.senderType === 'customer';
                    
                    return (
                      <div key={message.messageId || index}>
                        <div className={`flex ${isCustomer ? 'justify-start' : 'justify-end'} items-end space-x-2`}>
                          {isCustomer && (
                            <img
                              src={currentCustomerInfo.customerImage}
                              alt="Customer"
                              className="w-8 h-8 rounded-full object-cover bg-gray-200"
                              onError={(e) => {
                                e.currentTarget.src = PLACEHOLDER_AVATAR;
                              }}
                            />
                          )}
                          
                          <div className={`max-w-lg px-4 py-3 rounded-2xl ${
                            isSeller 
                              ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-br-md' 
                              : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md shadow-sm'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <p className={`text-xs mt-1.5 ${
                              isSeller ? 'text-green-200' : 'text-gray-500'
                            }`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>

                          {isSeller && (
                            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-teal-400 rounded-full flex items-center justify-center shadow-sm">
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
                      placeholder={`Reply to ${currentCustomerInfo.customerName}...`}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || loading}
                    className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    {loading ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50/30">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {rooms.length === 0 ? 'No customer conversations yet' : 'Select a conversation'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {rooms.length === 0 
                    ? 'Customers will appear here when they message you'
                    : 'Choose a customer to start chatting'
                  }
                </p>
                
                {rooms.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      Select a conversation from the list to start chatting
                    </p>
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