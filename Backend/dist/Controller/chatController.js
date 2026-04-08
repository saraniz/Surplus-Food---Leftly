import prisma from '../lib/prisma';
export const createChatRoom = async (req, res) => {
    try {
        const { sellerId, charityId, customerId } = req.body;
        const user = req.user;
        const userId = user.id || user.seller_id;
        let targetSellerId = sellerId;
        let targetCustomerId = customerId;
        let targetCharityId = charityId;
        // If user is customer, they are starting chat with a seller
        if (user.role === "customer") {
            targetCustomerId = userId;
            targetSellerId = Number(sellerId);
            const existing = await prisma.chatRoom.findFirst({
                where: { customerId: targetCustomerId, sellerId: targetSellerId }
            });
            if (existing)
                return res.json(existing);
            const created = await prisma.chatRoom.create({
                data: { customerId: targetCustomerId, sellerId: targetSellerId },
                include: { seller: { select: { businessName: true, storeImg: true, category: true } } }
            });
            return res.status(200).json(created);
        }
        // If user is seller, starting chat with charity
        else if (user.role === "seller" && charityId) {
            targetSellerId = userId;
            targetCharityId = Number(charityId);
            const existing = await prisma.chatRoom.findFirst({
                where: { sellerId: targetSellerId, charityId: targetCharityId }
            });
            if (existing)
                return res.json(existing);
            const created = await prisma.chatRoom.create({
                data: { sellerId: targetSellerId, charityId: targetCharityId }
            });
            return res.status(200).json(created);
        }
        // If Charity starting chat with seller
        else if (user.role === "charity" && sellerId) {
            targetCharityId = userId;
            targetSellerId = Number(sellerId);
            const existing = await prisma.chatRoom.findFirst({
                where: { charityId: targetCharityId, sellerId: targetSellerId }
            });
            if (existing)
                return res.json(existing);
            const created = await prisma.chatRoom.create({
                data: { charityId: targetCharityId, sellerId: targetSellerId }
            });
            return res.status(200).json(created);
        }
        else {
            return res.status(400).json({ message: "Invalid chat creation request" });
        }
    }
    catch (error) {
        console.error("Create chatroom error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
export const getChatRooms = async (req, res) => {
    try {
        const user = req.user;
        const userId = user.id || user.seller_id;
        console.log("User fetching chatrooms:", userId, user.role);
        let rooms;
        if (user.role.toLowerCase() === "customer") {
            console.log("Fetching rooms for customer ID:", userId);
            rooms = await prisma.chatRoom.findMany({
                where: { customerId: userId },
                include: {
                    seller: {
                        select: {
                            businessName: true,
                            storeImg: true,
                            category: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        }
        else if (user.role.toLowerCase() === "charity") {
            rooms = await prisma.chatRoom.findMany({
                where: { charityId: userId },
                include: {
                    seller: {
                        select: { businessName: true, storeImg: true, category: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        else {
            console.log("Fetching rooms for seller ID:", userId);
            // First get all chatrooms for this seller
            rooms = await prisma.chatRoom.findMany({
                where: { sellerId: userId },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            console.log(`Found ${rooms.length} chatrooms for seller`);
            // Then fetch customer details for each room
            const roomsWithCustomerDetails = await Promise.all(rooms.map(async (room) => {
                try {
                    if (room.charityId) {
                        const charity = await prisma.charity.findUnique({
                            where: { id: room.charityId },
                            select: { id: true, name: true, charityProfileImg: true, location: true, email: true }
                        });
                        return {
                            ...room,
                            customer: charity ? {
                                name: charity.name + " (Charity)",
                                location: charity.location,
                                cusProfileImg: charity.charityProfileImg,
                                email: charity.email
                            } : {
                                name: "Unknown Charity",
                                location: "Unknown",
                                cusProfileImg: null
                            }
                        };
                    }
                    else if (room.customerId) {
                        // Fetch customer details
                        const customer = await prisma.customer.findUnique({
                            where: { id: room.customerId },
                            select: {
                                id: true,
                                name: true,
                                cusProfileImg: true,
                                location: true,
                                email: true
                            }
                        });
                        return {
                            ...room,
                            customer: customer || {
                                name: `Customer ${room.customerId}`,
                                location: "Unknown",
                                cusProfileImg: null
                            }
                        };
                    }
                    else {
                        return room;
                    }
                }
                catch (error) {
                    return room;
                }
            }));
            rooms = roomsWithCustomerDetails;
        }
        console.log("Returning rooms:", rooms.length);
        return res.status(200).json({ rooms, message: "Chat rooms found" });
    }
    catch (err) {
        console.error("Error in getChatRooms:", err);
        res.status(500).json({ message: err.message });
    }
};
export const getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        console.log("Fetching messages for room:", roomId);
        const messages = await prisma.message.findMany({
            where: { chatroomId: parseInt(roomId) },
            orderBy: { createdAt: "asc" }
        });
        console.log("Found messages:", messages.length);
        res.json({ messages }); // Return as object with messages key
    }
    catch (err) {
        console.error("Error in getMessages:", err);
        res.status(500).json({ message: err.message });
    }
};
export const sendMessage = async (req, res) => {
    try {
        const { roomId, content } = req.body;
        const user = req.user;
        const userId = user.id || user.seller_id;
        console.log("Sending message to room:", roomId, "User:", userId);
        const msg = await prisma.message.create({
            data: {
                chatroomId: parseInt(roomId),
                senderId: userId,
                senderType: user.role, // CUSTOMER or SELLER
                content
            }
        });
        console.log("Message created:", msg);
        // Emit to socket room
        if (req.io) {
            req.io.to(roomId.toString()).emit("new-message", msg);
        }
        res.json({ message: msg }); // Return as object with message key
    }
    catch (err) {
        console.error("Error in sendMessage:", err);
        res.status(500).json({ message: err.message });
    }
};
export const markAsRead = async (req, res) => {
    try {
        const { messageId } = req.body;
        const user = req.user;
        const userId = user.id || user.seller_id;
        console.log("Marking message as read:", messageId, "User:", userId);
        const already = await prisma.messageReadBy.findFirst({
            where: {
                messageId: parseInt(messageId),
                userId: userId
            }
        });
        if (already) {
            return res.json({ message: "Already read" });
        }
        await prisma.messageReadBy.create({
            data: {
                messageId: parseInt(messageId),
                userId: userId
            }
        });
        res.json({ message: "Marked as read" });
    }
    catch (err) {
        console.error("Error in markAsRead:", err);
        res.status(500).json({ message: err.message });
    }
};
