import prisma from '../lib/prisma'
import dotenv from "dotenv"

const connectDB = async () => {

    try{
        await prisma.$connect()
        console.log("Database Connected Successfully")
    } catch (err){
        console.error("Database Connection Error",err)
    }
}

export default connectDB