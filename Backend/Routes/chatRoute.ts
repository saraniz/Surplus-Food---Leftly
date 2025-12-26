import express from 'express'
import authenticate from '../Middleware/authMiddleware'
import { createChatRoom, getChatRooms, getMessages, markAsRead, sendMessage } from '../Controller/chatController'


const router = express.Router()

router.post("/createchatroom",authenticate,createChatRoom)
router.get("/getchatroom",authenticate,getChatRooms)
router.get("/getmessages/:roomId",authenticate,getMessages)
router.post("/sendmessage",authenticate,sendMessage)
router.post("/readmessage",authenticate,markAsRead)

export default router