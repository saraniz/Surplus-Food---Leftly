import express from "express";
import prisma from "../lib/prisma";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Charity registration
export const registerCharity = async (req: Request, res: Response) => {
  try {
    const { name, email, location, description, password } = req.body;

    const existingCharity = await prisma.charity.findUnique({
      where: { email },
    });

    if (existingCharity) {
      return res.status(400).json({ message: "Email is already registered as a charity." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCharity = await prisma.charity.create({
      data: {
        name,
        email,
        location,
        description,
        password: hashedPassword,
      },
    });

    const token = jwt.sign(
      { id: newCharity.id, role: "charity", email: newCharity.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ charity: newCharity, token, message: "Charity registered successfully." });
  } catch (error) {
    console.error("Charity registration error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Get all charities
export const getAllCharities = async (req: Request, res: Response) => {
  try {
    const charities = await prisma.charity.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        description: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ charities });
  } catch (error) {
    console.error("Fetch charities error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Get current charity details
export const getCharityDetail = async (req: Request, res: Response) => {
  if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const charityId = req.user.id;

    if (!charityId) {
      return res.status(401).json({ message: "Invalid token..Please log in again" });
    }

    const charityD = await prisma.charity.findUnique({
      where: { id: charityId },
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        description: true,
        charityProfileImg: true,
      },
    });

    if (!charityD) {
      return res.status(404).json({ message: "Charity not found" });
    }

    let profileImageUrl = null;
    if (charityD.charityProfileImg) {
      profileImageUrl = `/uploads/${charityD.charityProfileImg}`;
    }

    return res.status(200).json({
      message: "Charity data fetched successfully.",
      charityD: {
        ...charityD,
        charityProfileImg: profileImageUrl,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update charity profile
export const updateCharityProfile = async (req: Request, res: Response) => {
  try {
    const charityId = req.user.id;
    const { name, email, location, description } = req.body;

    const charityProfileImg = req.file ? req.file.filename : undefined;

    let user = await prisma.charity.findUnique({
      where: { id: charityId },
    });

    if (!user) {
      return res.status(401).json({ message: "Charity cannot find." });
    }

    const updateCharity = await prisma.charity.update({
      where: { id: charityId },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined,
        location: location !== undefined ? location : undefined,
        description: description !== undefined ? description : undefined,
        charityProfileImg: charityProfileImg !== undefined ? charityProfileImg : undefined
      },
      select: {
        name: true,
        email: true,
        location: true,
        description: true,
        charityProfileImg: true
      }
    });

    return res.status(200).json({ updateCharity, message: "Charity update successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server Error." });
  }
};

