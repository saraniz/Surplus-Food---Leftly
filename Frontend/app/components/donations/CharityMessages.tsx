"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChatStore } from "@/app/ZustandStore/chatStore";
import { Send, UserCircle } from "lucide-react";

const PLACEHOLDER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='16' fill='%239ca3af'%3E?%3C/text%3E%3C/svg%3E";

export default function CharityMessages() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchRoomsCallback = useCallback(async () => {
    try {
      await fetchRooms();
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  }, [fetchRooms]);

  const fetchMessagesCallback = useCallback(async (roomId: number) => {
    if (roomId && roomId > 0) {
      try {
        await fetchMessages(roomId);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }
  }, [fetchMessages]);

  useEffect(() => {
    if (isInitialLoad) {
      connectSocket();
      fetchRoomsCallback();
      setIsInitialLoad(false);
    }
  }, [connectSocket, fetchRoomsCallback, isInitialLoad]);

  useEffect(() => {
    if (activeRoomId && activeRoomId > 0) {
      fetchMessagesCallback(activeRoomId);
    }
  }, [activeRoomId, fetchMessagesCallback]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoomId) return;

    try {
      await sendMessage(activeRoomId, newMessage);
      setNewMessage("");
      setTimeout(() => scrollToBottom(), 50);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const getSellerInfoFromRoom = (room: any) => {
    if (room && room.seller) {
      return {
        name: room.seller.businessName || `Seller ${room.sellerId}`,
        image: room.seller.storeImg || PLACEHOLDER_AVATAR,
      };
    }
    return {
      name: `Seller ${room?.sellerId || 'Unknown'}`,
      image: PLACEHOLDER_AVATAR,
    };
  };

  const currentRoom = rooms.find(r => r.chatroomId === activeRoomId);
  const sellerInfo = currentRoom ? getSellerInfoFromRoom(currentRoom) : null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden flex h-[600px]">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-slate-100 bg-slate-50 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">Messages Focus</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading && rooms.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-500">Loading...</p>
          )}
          {!loading && rooms.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-500">No messages yet.</p>
          )}
          
          {rooms.map(room => {
            const info = getSellerInfoFromRoom(room);
            const isActive = activeRoomId === room.chatroomId;
            return (
              <div
                key={room.chatroomId}
                onClick={() => setActiveRoom(room.chatroomId)}
                className={`flex items-center gap-3 p-4 border-b border-slate-100 cursor-pointer transition-colors ${
                  isActive ? "bg-emerald-50 border-emerald-100" : "hover:bg-slate-100"
                }`}
              >
                <img
                  src={info.image}
                  alt={info.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? "text-emerald-800" : "text-slate-800"}`}>
                    {info.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="w-2/3 flex flex-col bg-white">
        {currentRoom && sellerInfo ? (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 shadow-sm bg-white z-10">
              <img
                src={sellerInfo.image}
                alt={sellerInfo.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <h3 className="font-semibold text-slate-800">{sellerInfo.name}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  Say hello to {sellerInfo.name}!
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderType === 'charity';
                  return (
                    <div key={msg.messageId} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        isMe 
                          ? 'bg-emerald-600 text-white rounded-br-none' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none placeholder-black text-black"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || loading}
                  aria-label="Send message"
                  title="Send message"
                  className="flex items-center justify-center p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <UserCircle className="w-16 h-16 text-slate-200 mb-2" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
