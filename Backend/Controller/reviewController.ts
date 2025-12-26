import express from 'express'
import prisma from '../lib/prisma'
import { Request,Response } from 'express'

export const postReview = async (req:Request,res:Response) => {

    try{
        const userId = req.user.id
        const productId = Number(req.params.productId)
        const {message,rating} = req.body
        console.log("UI: ",userId)

        if (!userId){
            return res.status(401).json({message:"Pleased logged again"})
        }

        const user = await prisma.customer.findUnique({
            where: {id:userId},
            
        })

        if (!user){
            return res.status(401).json({message:"User not found"})
        }

        const product = await prisma.product.findUnique({
            where: {product_id:productId},
            include: {
                seller: true,
            }
        })

        if (!product){
            return res.status(404).json({message:"Product not found"})
        }

        const review = await prisma.review.create({
            data: {
                message,
                rating,
                customerId:userId,
                productId:productId,
                sellerId:product.sellerId,
            }
        })

        console.log(review)

        return res.status(200).json({review:review,message:"Review addedd successfully"})
    } catch (error){
        return res.status(500).json({message:"Server error"})
    }
}

export const getReviews = async (req:Request, res:Response) => {

    try{
        const {productId} = req.params

        if (!productId){
            return res.status(404).json({message:"Error"})
        }

        const reviews = await prisma.review.findMany({
            where: {productId: Number(productId)},
            include: {
                customer: true
            }
        })

        console.log(reviews)

        return res.status(200).json({reviews:reviews,message:"Reviews found"})

    } catch(error){
        return res.status(500).json({message:"Server error"})
    }
}