import prisma from '../lib/prisma.ts'
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