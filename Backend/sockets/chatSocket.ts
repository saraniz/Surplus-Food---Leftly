import prisma from '../lib/prisma'


{/** io is the main Socket.IO server instance.io represents the entire WebSocket server.
socket represents one connected user. 

io has methods that work on the entire server:
    io.on("connection", callback)
    Runs when a user connects.

    io.to(roomId).emit(event, data)
    Sends messages to a specific room.

    io.emit(event, data)
    Sends messages to all connected clients.

Inside io.on("connection"), you get socket:

    io.on("connection", (socket) => {

        This is a single user's connection.It has methods like:
            socket.on("event") — listen for events from that user
            socket.emit("event") — send an event to that user
            socket.join("room") — put this user in a room

*/}
export default function chatSocket(io){
    // ❌ WRONG: "Connection" (capital C)
    // ✅ CORRECT: "connection" (lowercase c)
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // join room
        socket.on("join-room", (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        // send real time message
        socket.on("send-message", async ({roomId, senderId, senderType, content}) => {
            console.log("Send message received:", {roomId, senderId, senderType, content});
            
            try {
                const msg = await prisma.message.create({
                    data: {
                        chatroomId: roomId,
                        senderId,
                        senderType,
                        content,
                    },
                    include: {
                        chatroom: true
                    }
                });

                io.to(roomId).emit("new-message", msg);
                console.log("Message broadcasted to room:", roomId);
            } catch (error) {
                console.error("Error saving message:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
}