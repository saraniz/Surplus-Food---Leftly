import { create } from "zustand";
import api from "../libs/api";
import { io, type Socket } from "socket.io-client";

export interface Chatroom {
    chatroomId: number;
    customerId: number;
    sellerId: number;
    createdAt: string;
    seller?: {
        businessName?: string;
        storeImg?: string;
        category?: string;
    };
    customer?: {
        name?: string;
        cusProfileImg?: string;
        location?: string;
        email?: string;
    };
}

export interface Message {
    messageId: number;
    chatroomId: number;
    senderId: number;
    senderType: "customer" | "seller";
    content: string;
    createdAt: string;
}

interface ChatState {
    rooms: Chatroom[];
    messages: Message[];
    activeRoomId: number | null;
    socket: Socket | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    isSocketConnected: boolean;

    // actions
    connectSocket: () => void;
    createRoom: (sellerId: number) => Promise<number>;
    fetchRooms: () => Promise<void>;
    fetchMessages: (roomId: number) => Promise<void>;
    sendMessage: (roomId: number, content: string) => Promise<void>;
    markAsRead: (messageId: number) => Promise<void>;
    setActiveRoom: (roomId: number) => void;
    addRoom: (room: Chatroom) => void;
    clearMessages: () => void;
    fetchRoomById: (roomId: number) => Promise<Chatroom | null>;
}

export const useChatStore = create<ChatState>((set, get) => ({
    rooms: [],
    messages: [],
    activeRoomId: null,
    socket: null,
    token: localStorage.getItem("token"),
    loading: false,
    error: null,
    isSocketConnected: false,

    // -----------------------------------------
    // CONNECT SOCKET.IO
    // -----------------------------------------
    connectSocket: () => {
        const existing = get().socket;
        if (existing && existing.connected) {
            console.log("Socket already connected");
            return;
        }
        
        if (existing) {
            existing.disconnect();
        }

        console.log("Connecting to socket...");
        const socket = io("http://localhost:2000", {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            autoConnect: true,
            forceNew: false,
        });

        socket.on("connect", () => {
            console.log("✅ Socket connected:", socket.id);
            set({ isSocketConnected: true });
            
            const activeRoomId = get().activeRoomId;
            if (activeRoomId) {
                console.log("Re-joining active room:", activeRoomId);
                socket.emit("join-room", activeRoomId);
            }
        });

        socket.on("connect_error", (err) => {
            console.error("❌ Socket connection error:", err.message);
            set({ 
                error: `Cannot connect to chat server: ${err.message}`,
                isSocketConnected: false
            });
        });

        socket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
            set({ isSocketConnected: false });
            
            if (reason === "io server disconnect") {
                setTimeout(() => {
                    socket.connect();
                }, 1000);
            }
        });

        socket.on("new-message", (msg: Message) => {
            console.log("📨 New message received via socket:", msg);
            const { activeRoomId, messages } = get();

            if (msg.chatroomId === activeRoomId) {
                const messageExists = messages.some(m => m.messageId === msg.messageId);
                if (!messageExists) {
                    set({
                        messages: [...messages, msg],
                    });
                }
            }
        });

        socket.on("room-update", (room: Chatroom) => {
            console.log("📝 Room update received:", room);
            const { rooms } = get();
            
            const roomIndex = rooms.findIndex(r => r.chatroomId === room.chatroomId);
            if (roomIndex >= 0) {
                const updatedRooms = [...rooms];
                updatedRooms[roomIndex] = { ...updatedRooms[roomIndex], ...room };
                set({ rooms: updatedRooms });
            } else {
                set({ rooms: [...rooms, room] });
            }
        });

        socket.on("error", (error) => {
            console.error("Socket error:", error);
            set({ error: `Socket error: ${error}` });
        });

        set({ socket });
    },

    // -----------------------------------------
    // CREATE CHATROOM
    // -----------------------------------------
    createRoom: async (sellerId) => {
        console.log("=== createRoom called ===");
        console.log("Seller ID:", sellerId);
        
        try {
            set({ loading: true, error: null });

            const token = localStorage.getItem("token");
            console.log("Token exists:", !!token);
            
            if (!token) {
                throw new Error("Must be logged in to chat");
            }

            console.log("Making API call to create chatroom...");
            const res = await api.post("/api/chat/createchatroom", 
                { sellerId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("Full API Response:", res);
            console.log("Response data:", res.data);
            
            const room = res.data;
            console.log("Room object:", room);
            
            // Handle both field names: id or chatroomId
            const roomId = room?.id || room?.chatroomId;
            console.log("Room ID:", roomId);
            
            if (roomId) {
                console.log("✅ Valid room created, ID:", roomId);
                
                localStorage.setItem('lastCreatedRoomId', roomId.toString());
                
                // Create properly structured room object
                const roomToAdd: Chatroom = {
                    chatroomId: roomId,
                    customerId: room.customerId,
                    sellerId: room.sellerId,
                    createdAt: room.createdAt,
                    seller: room.seller ? {
                        businessName: room.seller.businessName,
                        storeImg: room.seller.storeImg,
                        category: room.seller.category
                    } : undefined
                };
                
                const existingRooms = get().rooms;
                const roomExists = existingRooms.some(r => r.chatroomId === roomId);
                
                if (!roomExists) {
                    console.log("Adding room to store");
                    set({ 
                        rooms: [...existingRooms, roomToAdd],
                        activeRoomId: roomId
                    });
                    
                    const socket = get().socket;
                    if (socket?.connected) {
                        socket.emit("join-room", roomId);
                    }
                } else {
                    console.log("Room already exists in store, setting as active");
                    set({ activeRoomId: roomId });
                }
                
                console.log("Returning chatroomId:", roomId);
                return roomId;
            } else {
                console.log("❌ No valid chatroomId in response");
                return 0;
            }
        } catch (err: any) {
            console.error("createRoom ERROR:", err);
            console.error("Error response:", err.response?.data);
            set({ error: err.response?.data?.message || err.message });
            return 0;
        } finally {
            set({ loading: false });
        }
    },

    // -----------------------------------------
    // ADD ROOM MANUALLY
    // -----------------------------------------
    addRoom: (room: Chatroom) => {
        const existingRooms = get().rooms;
        const roomExists = existingRooms.some(r => r.chatroomId === room.chatroomId);
        
        if (!roomExists) {
            set({ rooms: [...existingRooms, room] });
            console.log("Room added manually:", room.chatroomId);
        }
    },

    // -----------------------------------------
    // GET ALL CHATROOMS
    // -----------------------------------------
    fetchRooms: async () => {
    try {
        set({ loading: true, error: null });
        console.log("Fetching rooms from API...");

        const token = localStorage.getItem("token");
        if (!token) {
            console.log("No token found, cannot fetch rooms");
            return;
        }

        // Get user role from localStorage
        const userRole = localStorage.getItem("role");
        console.log("User role:", userRole);

        console.log("Making API call to /api/chat/getchatroom...");
        const res = await api.get("/api/chat/getchatroom", {
            headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Full API response:", res.data);
        
        let roomsArray: Chatroom[] = [];
        
        if (res.data && res.data.rooms && Array.isArray(res.data.rooms)) {
            // Map Prisma room objects to our Chatroom interface
            roomsArray = res.data.rooms.map((room: any) => {
                // Handle both id and chatroomId field names
                const chatroomId = room.id || room.chatroomId;
                
                // For sellers, include customer data
                if (userRole === "seller") {
                    return {
                        chatroomId: chatroomId,
                        customerId: room.customerId,
                        sellerId: room.sellerId,
                        createdAt: room.createdAt,
                        customer: room.customer ? {
                            name: room.customer.name,
                            cusProfileImg: room.customer.cusProfileImg,
                            location: room.customer.location,
                            email: room.customer.email
                        } : undefined,
                        seller: room.seller // Include seller data if present
                    };
                } else {
                    // For customers, include seller data
                    return {
                        chatroomId: chatroomId,
                        customerId: room.customerId,
                        sellerId: room.sellerId,
                        createdAt: room.createdAt,
                        seller: room.seller ? {
                            businessName: room.seller.businessName,
                            storeImg: room.seller.storeImg,
                            category: room.seller.category
                        } : undefined
                    };
                }
            });
            
            console.log("Mapped rooms:", roomsArray);
        } else if (Array.isArray(res.data)) {
            // If response is directly an array
            roomsArray = res.data.map((room: any) => ({
                chatroomId: room.id || room.chatroomId,
                customerId: room.customerId,
                sellerId: room.sellerId,
                createdAt: room.createdAt,
                seller: room.seller,
                customer: room.customer
            }));
        }
        
        console.log(`Loaded ${roomsArray.length} rooms`);
        set({ rooms: roomsArray });
        
        // Handle last created room from localStorage
        const lastCreatedRoomId = localStorage.getItem('lastCreatedRoomId');
        if (lastCreatedRoomId && roomsArray.length > 0) {
            const roomId = parseInt(lastCreatedRoomId);
            const roomExists = roomsArray.some((r: Chatroom) => r.chatroomId === roomId);
            if (roomExists) {
                console.log("Setting last created room as active:", roomId);
                set({ activeRoomId: roomId });
                localStorage.removeItem('lastCreatedRoomId');
            }
        }
        
    } catch (err: any) {
        console.error("Error fetching rooms:", err);
        console.error("Error response:", err.response?.data);
        set({ error: err.message });
    } finally {
        set({ loading: false });
    }
},

    // -----------------------------------------
    // FETCH ROOM BY ID
    // -----------------------------------------
    fetchRoomById: async (roomId: number) => {
        try {
            console.log("Fetching specific room by ID:", roomId);
            
            const token = localStorage.getItem("token");
            if (!token) {
                console.log("No token, cannot fetch room");
                return null;
            }

            // Try to find room in existing rooms first
            const existingRooms = get().rooms;
            const existingRoom = existingRooms.find(r => r.chatroomId === roomId);
            if (existingRoom) {
                console.log("Room found in existing rooms");
                return existingRoom;
            }

            // If not found, you might need to create an API endpoint for this
            console.log("Room not found locally, would need API endpoint to fetch by ID");
            return null;
            
        } catch (err: any) {
            console.error("Error fetching room by ID:", err);
            return null;
        }
    },

    // -----------------------------------------
    // LOAD MESSAGES FOR A SPECIFIC ROOM
    // -----------------------------------------
    fetchMessages: async (roomId) => {
        if (!roomId || roomId <= 0) {
            console.log("Invalid roomId for fetchMessages:", roomId);
            return;
        }
        
        try {
            console.log("Fetching messages for room:", roomId);
            set({ loading: true, error: null, activeRoomId: roomId });

            const token = localStorage.getItem("token");
            if (!token) {
                console.log("No token, cannot fetch messages");
                return;
            }

            const res = await api.get(`/api/chat/getmessages/${roomId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("Messages response:", res.data);
            
            let messagesArray: Message[] = [];
            
            if (res.data && res.data.messages && Array.isArray(res.data.messages)) {
                messagesArray = res.data.messages;
            } else if (Array.isArray(res.data)) {
                messagesArray = res.data;
            }
            
            console.log(`Loaded ${messagesArray.length} messages for room ${roomId}`);
            set({ messages: messagesArray });

            // Join socket room
            const socket = get().socket;
            if (socket?.connected) {
                console.log("Joining socket room:", roomId);
                socket.emit("join-room", roomId);
            }
        } catch (err: any) {
            console.error("Error fetching messages:", err);
            set({ 
                error: err.response?.data?.message || err.message,
                messages: [] 
            });
        } finally {
            set({ loading: false });
        }
    },

    // -----------------------------------------
    // CLEAR MESSAGES
    // -----------------------------------------
    clearMessages: () => {
        set({ messages: [] });
    },

    // -----------------------------------------
    // SEND MESSAGE
    // -----------------------------------------
    sendMessage: async (roomId, content) => {
        if (!content.trim()) {
            console.log("Empty message, not sending");
            return;
        }
        
        console.log("Sending message to room:", roomId, "Content:", content);
        
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Not logged in");
            }

            // Optimistic update
            const tempMessage: Message = {
                messageId: Date.now(),
                chatroomId: roomId,
                senderId: 0,
                senderType: "customer",
                content: content,
                createdAt: new Date().toISOString()
            };

            set({
                messages: [...get().messages, tempMessage]
            });

            const res = await api.post(
                "/api/chat/sendmessage",
                { roomId, content },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            console.log("Send message response:", res.data);
            
            // Replace temporary message with real one
            if (res.data && res.data.message) {
                const { messages } = get();
                const updatedMessages = messages.map(msg => 
                    msg.messageId === tempMessage.messageId ? res.data.message : msg
                );
                set({ messages: updatedMessages });
            }
            
            // Emit via socket
            const socket = get().socket;
            if (socket?.connected && res.data.message) {
                socket.emit("send-message", res.data.message);
            }
        } catch (err: any) {
            console.error("Error sending message:", err);
            set({ error: err.message });
            
            // Remove optimistic update on error
            const { messages } = get();
            const filteredMessages = messages.filter(msg => msg.messageId !== Date.now());
            set({ messages: filteredMessages });
            
            alert("Failed to send message. Please try again.");
        }
    },

    // -----------------------------------------
    // MARK MESSAGE AS READ
    // -----------------------------------------
    markAsRead: async (messageId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            await api.post(
                "/api/chat/readmessage",
                { messageId },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            
            console.log("Message marked as read:", messageId);
        } catch (err: any) {
            console.log("Read error:", err.message);
        }
    },

    // -----------------------------------------
    // CHANGE ACTIVE ROOM
    // -----------------------------------------
    setActiveRoom: (roomId) => {
        console.log("Setting active room:", roomId);
        const currentActiveRoom = get().activeRoomId;
        
        if (currentActiveRoom !== roomId) {
            set({ 
                activeRoomId: roomId,
                messages: []
            });
            
            const socket = get().socket;
            if (socket?.connected) {
                socket.emit("join-room", roomId);
            }
            
            localStorage.removeItem('lastCreatedRoomId');
        }
    },
}));