import express from 'express'
import prisma from '../lib/prisma'
import { Request,Response } from 'express'

export const followShops = async (req:Request, res:Response) => {

    try{
        const userId = req.user.id
        const {sellerId} = req.params
        console.log("UI",userId)
        
        if (!userId){
            return res.status(401).json({message:"User not found"})
        }

        const follow = await prisma.follow.create({
            data: {
                folowercusId:userId,
                foloweeselId:Number(sellerId)
            },
            select: {
                foloweeselId:true,
                folowercusId:true,
            }
        })

        console.log(follow)

        return res.status(200).json({follow:follow,message:"Shop followed successfully"})
    } catch (error){
        return res.status(500).json({message:"Server error"})
    }
}

// Controller/followController.ts
export const getFollowShops = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: "User not found" });
    }

    const followshops = await prisma.follow.findMany({
      where: { folowercusId: userId },
      include: {
        seller: {
          select: {
            seller_id: true,
            businessName: true,
            businessEmail: true,
            storeImg: true,
          },
        },
      },
    });

    // Transform the data to match frontend interface
    const transformedFollows = followshops.map((follow) => ({
      followId: follow.id,
      createdAt: follow.createdAt.toISOString(),
      seller: {
        seller_id: follow.seller.seller_id,
        businessName: follow.seller.businessName,
        businessEmail: follow.seller.businessEmail,
        storeImg: follow.seller.storeImg, // This is just the filename
      },
    }));

    console.log("Transformed follows:", transformedFollows);

    return res.status(200).json({
      followshops: transformedFollows, // Make sure this matches what frontend expects
      message: "Followed shops fetched successfully",
    });
  } catch (error) {
    console.error("Error in getFollowShops:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const removeFollow = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const { storeId } = req.body

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access" })
    }

    if (!storeId) {
      return res.status(400).json({ message: "Store ID is required" })
    }

    const result = await prisma.follow.deleteMany({
      where: {
        folowercusId: userId,
        foloweeselId: storeId
      }
    })

    if (result.count === 0) {
      return res.status(404).json({ message: "Follow record not found" })
    }

    return res.status(200).json({
      message: "Shop unfollowed successfully"
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

