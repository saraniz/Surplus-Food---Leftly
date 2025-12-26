import express from 'express'
import prisma from '../lib/prisma'
import { Request,Response } from 'express'

export const createChatRoom = async (req:Request, res:Response) => {
    try{
        const {sellerId} = req.body
        const user = req.user
        console.log("SU",sellerId,user)

        if (user.role !== "customer"){
            return res.status(403).json({message:"Only customer can start the chat"})
        }

        //check if chatroom existing
        const existing = await prisma.chatRoom.findFirst({
            where: {
                customerId: user.id,
                sellerId: Number(sellerId),
            }
        })

        if (existing){
            return res.json(existing) // Return room directly
        }

        const created = await prisma.chatRoom.create({
            data: {
                customerId: user.id,
                sellerId: Number(sellerId),
            },
            include: {
                seller: {
                    select: {
                        businessName: true,
                        storeImg: true,
                        category: true
                    }
                }
            }
        })

        return res.status(200).json(created) // Return room directly, not wrapped
    } catch(error){
        console.error("Create chatroom error:", error);
        return res.status(500).json({message:"Server error"})
    }
}

export const getChatRooms = async (req:Request, res:Response) => {
    try{
        const user = req.user
        console.log("User fetching chatrooms:", user.id, user.role);
        
        let rooms

        if (user.role.toLowerCase() === "customer"){
            console.log("Fetching rooms for customer ID:", user.id);
            rooms = await prisma.chatRoom.findMany({
                where:{customerId:user.id},
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
            })
        } else {
            console.log("Fetching rooms for seller ID:", user.id);
            
            // First get all chatrooms for this seller
            rooms = await prisma.chatRoom.findMany({
                where: {sellerId: user.id},
                orderBy: {
                    createdAt: 'desc'
                }
            })

            console.log(`Found ${rooms.length} chatrooms for seller`);

            // Then fetch customer details for each room
            const roomsWithCustomerDetails = await Promise.all(
                rooms.map(async (room) => {
                    try {
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
                    } catch (error) {
                        console.error(`Error fetching customer ${room.customerId}:`, error);
                        return {
                            ...room,
                            customer: {
                                name: `Customer ${room.customerId}`,
                                location: "Unknown",
                                cusProfileImg: null
                            }
                        };
                    }
                })
            );

            rooms = roomsWithCustomerDetails;
        }

        console.log("Returning rooms:", rooms.length);
        
        return res.status(200).json({rooms,message:"Chat rooms found"})
    } catch(err:any){
         console.error("Error in getChatRooms:", err);
         res.status(500).json({ message: err.message });
    }
}

export const getMessages = async (req:Request, res:Response) => {
    try {
        const { roomId } = req.params;
        console.log("Fetching messages for room:", roomId);

        const messages = await prisma.message.findMany({
            where: { chatroomId: parseInt(roomId) },
            orderBy: { createdAt: "asc" }
        });

        console.log("Found messages:", messages.length);
        res.json({messages}); // Return as object with messages key
    } catch (err:any) {
        console.error("Error in getMessages:", err);
        res.status(500).json({ message: err.message });
    }
}

export const sendMessage = async (req:Request ,res:Response) => {
    try {
        const { roomId, content } = req.body;
        const user = req.user;
        console.log("Sending message to room:", roomId, "User:", user.id);

        const msg = await prisma.message.create({
            data: {
                chatroomId: parseInt(roomId),
                senderId: user.id,
                senderType: user.role,     // CUSTOMER or SELLER
                content
            }
        });

        console.log("Message created:", msg);

        // Emit to socket room
        if (req.io) {
            req.io.to(roomId.toString()).emit("new-message", msg);
        }

        res.json({message: msg}); // Return as object with message key
    } catch (err:any) {
        console.error("Error in sendMessage:", err);
        res.status(500).json({ message: err.message });
    }
};

export const markAsRead = async (req:Request, res:Response) => {
    try {
        const { messageId } = req.body;
        const user = req.user;
        console.log("Marking message as read:", messageId, "User:", user.id);

        const already = await prisma.messageReadBy.findFirst({
            where: {
                messageId: parseInt(messageId),
                userId: user.id
            }
        });

        if (already) {
            return res.json({ message: "Already read" });
        }

        await prisma.messageReadBy.create({
            data: {
                messageId: parseInt(messageId),
                userId: user.id
            }
        });

        res.json({ message: "Marked as read" });
    } catch (err:any) {
        console.error("Error in markAsRead:", err);
        res.status(500).json({ message: err.message });
    }
};