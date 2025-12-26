import express from 'express'
import { followShops, getFollowShops, removeFollow } from '../Controller/followController'
import authenticate from '../Middleware/authMiddleware'

const router = express.Router()

router.post("/followshops/:sellerId",authenticate,followShops)
router.get("/getfollowshops",authenticate,getFollowShops)
router.delete("/unfollow",authenticate,removeFollow)

export default router