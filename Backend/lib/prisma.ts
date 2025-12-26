//main object use to talk the database
import { PrismaClient } from "../generated/prisma";
//an extension that helps Prisma work faster in serverless environments (e.g., Vercel, Netlify, Cloudflare Workers).
import { withAccelerate } from "@prisma/extension-accelerate";


//create one prisma instance and make it global
const globalForPrisma = global as unknown as {
    prisma : PrismaClient
}

//globalForPrisma exist reuse it, if it is not create new prisma client with the withAccelerate extension attached.
const prisma = globalForPrisma.prisma || new PrismaClient().$extends(withAccelerate())

//in production ususally want new prismaclient and for development reuse the global prisma client to avoid too many connections
if(process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma