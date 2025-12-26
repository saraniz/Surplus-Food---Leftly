import express from "express";
import dotenv from "dotenv";
import prisma from "../lib/prisma";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express"; //types that provide from express for typesafety

interface MyJwtPayload extends JwtPayload {
  id: string;
  email: string;
  role: "customer" | "seller" | "admin";
}

declare global {
  namespace Express {
    interface Request {
      user?: any; // TS inferred type
    }
  }
}

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access Denied. No token provided." });
    }

    //in here jwt.verify return the payload as a string or object(JwtPayload = has all the types in payload [id,name etc..])
    //so typescript don't know decoded is string or object so we declare type for it
    //MyJwtPayload take the return type from jwt.verify and JwtPayload describes the properties that payload have...
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as MyJwtPayload;

    let user;

    if (decoded.role == "customer") {
      user = await prisma.customer.findUnique({
        where: { id: Number(decoded.id) },
        select: { id: true, email: true },
      });
      if (user) {
        // ✅ Keep the role in req.user
        req.user = {
          id: user.id,
          email: user.email,
          role: "customer",
        };
      }
    } else if (decoded.role == "seller") {
      user = await prisma.seller.findUnique({
        where: { seller_id: Number(decoded.id) },
        select: { seller_id: true, businessEmail: true },
      });
      if (user) {
        // ✅ Keep the role in req.user
        req.user = {
          seller_id: user.seller_id,
          email: user.businessEmail,
          role: "seller",
        };
      }
    } else if (decoded.role === "admin") {
      user = { id: "admin", email: process.env.ADMIN_EMAIL };
      req.user = { id: "admin", email: process.env.ADMIN_EMAIL, role: "admin" };
    }

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

export default authenticate;
