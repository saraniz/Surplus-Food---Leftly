import prisma from "../lib/prisma";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";

interface AuthenticatedRequest extends Request {
  user?: {
    seller_id?: number;
    id?: number;
    email?: string;
    role: string;
  };
}

//seller registration
export const sellerRegister = async (req: Request, res: Response) => {
  try {
    const { businessName, businessEmail, businessAddress, password } = req.body;
    console.log(businessName, businessEmail, businessAddress, password);

    let existingSeller = await prisma.seller.findUnique({
      where: { businessEmail: businessEmail },
    });

    if (existingSeller) {
      return res
        .status(401)
        .json({ message: "Seller has already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newSeller = await prisma.seller.create({
      data: {
        businessName,
        businessEmail,
        businessAddress,
        password: hashedPassword,
      },
      select: { seller_id: true, businessName: true, businessEmail: true },
    });

    const token = Jwt.sign(
      {
        id: newSeller.seller_id,
        role: "seller",
        businessEmail: newSeller.businessEmail,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    return res
      .status(200)
      .json({ token, newSeller, message: "Seller registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error });
  }
};

//seller login
export const sellerLogin = async (req: Request, res: Response) => {
  try {
    const { businessEmail, password } = req.body;

    const seller = await prisma.seller.findUnique({
      where: { businessEmail: businessEmail },
      select: { seller_id: true, businessEmail: businessEmail, password: true },
    });

    if (!seller) {
      return res.status(401).json({ message: "Seller Cannot found" });
    }

    const isMatch = await bcrypt.compare(password, seller.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials." });
    }

    const token = Jwt.sign(
      {
        id: seller.seller_id,
        role: "seller",
        businessEmail: seller.businessEmail,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ message: "Seller logged successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server Error." });
  }
};

export const updateSellerDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log("=== UPDATE SELLER DETAILS START ===");
    console.log("Request user object:", req.user);
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    
    // Get seller_id
    const sellerId = req.user?.seller_id || req.user?.id;
    
    if (!sellerId) {
      return res.status(401).json({ 
        message: "Unauthorized. Seller ID not found." 
      });
    }
    
    const {
      businessName,
      businessEmail,
      businessAddress,
      phoneNum,
      category,
      openingHours,
      deliveryRadius,
      website,
      storeDescription,
      latitude,
      longitude
    } = req.body;

    // Handle file uploads - convert to URL strings
    let storeImg, coverImg;
    let storeImgUrl, coverImgUrl;
    
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      console.log("Files structure:", {
        storeImg: files['storeImg']?.[0],
        coverImg: files['coverImg']?.[0]
      });
      
      // Get store image if provided and convert to URL
      if (files['storeImg'] && files['storeImg'][0]) {
        const file = files['storeImg'][0];
        storeImg = file.filename;
        // Convert to URL
        storeImgUrl = `${req.protocol}://${req.get('host')}/uploads/${storeImg}`;
      }
      
      // Get cover image if provided and convert to URL
      if (files['coverImg'] && files['coverImg'][0]) {
        const file = files['coverImg'][0];
        coverImg = file.filename;
        // Convert to URL
        coverImgUrl = `${req.protocol}://${req.get('host')}/uploads/${coverImg}`;
      }
    }
    
    console.log("Extracted filenames:", { storeImg, coverImg });
    console.log("Generated URLs:", { storeImgUrl, coverImgUrl });

    // Check if seller exists
    const seller = await prisma.seller.findUnique({
      where: { seller_id: Number(sellerId) },
    });

    if (!seller) {
      console.error("ERROR: Seller not found in database with ID:", sellerId);
      return res.status(404).json({ message: "Seller not found." });
    }

    // Check if email is being changed and if it's already taken
    if (businessEmail && businessEmail !== seller.businessEmail) {
      const existingSeller = await prisma.seller.findUnique({
        where: { businessEmail: businessEmail },
      });
      
      if (existingSeller) {
        return res.status(400).json({ 
          message: "Email already in use by another seller." 
        });
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    // Only add fields that are provided and not empty
    if (businessName !== undefined && businessName !== '') updateData.businessName = businessName;
    if (businessEmail !== undefined && businessEmail !== '') updateData.businessEmail = businessEmail;
    if (businessAddress !== undefined && businessAddress !== '') updateData.businessAddress = businessAddress;
    if (phoneNum !== undefined && phoneNum !== '') updateData.phoneNum = phoneNum;
    if (category !== undefined && category !== '') updateData.category = category;
    if (openingHours !== undefined && openingHours !== '') updateData.openingHours = openingHours;
    
    // Handle deliveryRadius as string (since schema shows String?)
    if (deliveryRadius !== undefined) {
      if (deliveryRadius === '' || deliveryRadius === null) {
        updateData.deliveryRadius = null;
      } else {
        // Convert to string
        updateData.deliveryRadius = deliveryRadius.toString();
      }
    }
    
    if (website !== undefined && website !== '') updateData.website = website;
    if (storeDescription !== undefined && storeDescription !== '') updateData.storeDescription = storeDescription;
    
    // Handle latitude and longitude as Float (convert from string)
    if (latitude !== undefined && latitude !== '') {
      const latNum = parseFloat(latitude);
      if (!isNaN(latNum)) {
        updateData.latitude = latNum;
      } else {
        console.warn("Invalid latitude value:", latitude);
      }
    }
    
    if (longitude !== undefined && longitude !== '') {
      const lngNum = parseFloat(longitude);
      if (!isNaN(lngNum)) {
        updateData.longitude = lngNum;
      } else {
        console.warn("Invalid longitude value:", longitude);
      }
    }
    
    // Handle store image - store URL instead of filename
    if (storeImgUrl !== undefined) {
      updateData.storeImg = storeImgUrl;
      
      // Optional: Extract filename from existing URL for deletion
      if (seller.storeImg) {
        try {
          const oldImageFilename = seller.storeImg.split('/').pop();
          if (oldImageFilename) {
            const uploadsDir = path.join(process.cwd(), 'uploads');
            const oldImagePath = path.join(uploadsDir, oldImageFilename);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
              console.log("Deleted old store image file:", oldImageFilename);
            }
          }
        } catch (err) {
          console.error("Failed to delete old store image file:", err);
        }
      }
    }
    
    // Handle cover image - store URL instead of filename
    if (coverImgUrl !== undefined) {
      updateData.coverImg = coverImgUrl;
      
      // Optional: Extract filename from existing URL for deletion
      if (seller.coverImg) {
        try {
          const oldCoverFilename = seller.coverImg.split('/').pop();
          if (oldCoverFilename) {
            const uploadsDir = path.join(process.cwd(), 'uploads');
            const oldCoverPath = path.join(uploadsDir, oldCoverFilename);
            if (fs.existsSync(oldCoverPath)) {
              fs.unlinkSync(oldCoverPath);
              console.log("Deleted old cover image file:", oldCoverFilename);
            }
          }
        } catch (err) {
          console.error("Failed to delete old cover image file:", err);
        }
      }
    }

    console.log("Update data to be sent to Prisma:", updateData);

    // Update seller in database
    const updatedSeller = await prisma.seller.update({
      where: { seller_id: Number(sellerId) },
      data: updateData,
      select: {
        seller_id: true,
        businessName: true,
        businessEmail: true,
        businessAddress: true,
        phoneNum: true,
        category: true,
        openingHours: true,
        deliveryRadius: true,
        website: true,
        storeDescription: true,
        storeImg: true,
        coverImg: true,
        latitude: true,
        longitude: true,
      }
    });

    console.log("Successfully updated seller:", updatedSeller);
    console.log("=== UPDATE SELLER DETAILS END ===");

    return res.status(200).json({
      seller: updatedSeller, 
      message: "Seller updated successfully."
    });

  } catch (error) {
    console.error("❌ ERROR updating seller:", error);
    
    // More specific error messages
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
    }
    
    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          message: "Email already exists. Please use a different email." 
        });
      }
    }
    
    return res.status(500).json({ 
      message: "Server error while updating seller details",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
// Public endpoint - no authentication required
export const getSellerDetailsPublic = async (req: Request, res: Response) => {
  try {
    const sellerId = Number(req.params.id);
    
    if (!sellerId || isNaN(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const seller = await prisma.seller.findUnique({
      where: { seller_id: sellerId },
      select: {
        seller_id: true,
        businessName: true,
        businessEmail: true,
        businessAddress: true,
        phoneNum: true,
        category: true,
        openingHours: true,
        deliveryRadius: true,
        website: true,
        storeDescription: true,
        storeImg: true, // URL string
        coverImg: true, // URL string
      },
    });

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Get followers count
    const followerCount = await prisma.follow.count({
      where: { foloweeselId: sellerId }
    });

    // Get products count
    const productCount = await prisma.product.count({
      where: { sellerId: sellerId }
    });

    return res.status(200).json({
      message: "Seller fetched successfully",
      seller: {
        ...seller,
        // URLs are already in storeImg and coverImg fields
        followers: followerCount,
        productsCount: productCount,
        following: 0,
        rating: 4.7
      },
    });
  } catch (error) {
    console.error("Error in getSellerDetailsPublic:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Protected endpoint - requires authentication
export const getSellerDetails = async (req: Request, res: Response) => {
  try {
    const sellerId = Number(req.params.id);

    if (!sellerId || isNaN(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    let seller = await prisma.seller.findUnique({
      where: { seller_id: sellerId },
      select: {
        seller_id: true,
        businessName: true,
        businessEmail: true,
        businessAddress: true,
        phoneNum: true,
        category: true,
        openingHours: true,
        deliveryRadius: true,
        website: true,
        storeDescription: true,
        storeImg: true, // This is a URL string
        coverImg: true, // This is a URL string
      },
    });

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Get actual follower count from database
    const followerCount = await prisma.follow.count({
      where: { foloweeselId: sellerId }
    });

    // Get product count
    const productCount = await prisma.product.count({
      where: { sellerId: sellerId }
    });

    // Just return the URLs as-is, no need for base64 conversion
    return res.status(200).json({
      message: "Seller fetched successfully",
      seller: {
        ...seller,
        // storeImg and coverImg are already URLs, return them directly
        followers: followerCount,
        following: 0, // Set to 0 as requested
        rating: 4.7,
        productsCount: productCount
      },
    });
  } catch (error) {
    console.error("Error in getSellerDetails:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


// Fetch all sellers - PUBLIC endpoint (no authentication required)
export const getAllSellers = async (req: Request, res: Response) => {
  try {
    console.log("🔄 Fetching all sellers...");
    
    // Fetch all sellers from database
    const sellers = await prisma.seller.findMany({
      select: {
        seller_id: true,
        businessName: true,
        businessEmail: true,
        businessAddress: true,
        phoneNum: true,
        category: true,
        openingHours: true,
        deliveryRadius: true,
        website: true,
        storeDescription: true,
        storeImg: true, // URL string
        coverImg: true, // URL string
      },
      orderBy: {
        seller_id: 'desc' // or 'asc' for ascending
      }
    });

    console.log(`✅ Found ${sellers.length} sellers`);

    if (!sellers || sellers.length === 0) {
      return res.status(200).json({ 
        message: "No sellers found",
        sellers: [] 
      });
    }

    // Get additional data for each seller (followers, products)
    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        // Get followers count
        const followerCount = await prisma.follow.count({
          where: { foloweeselId: seller.seller_id }
        });

        // Get products count
        const productCount = await prisma.product.count({
          where: { sellerId: seller.seller_id }
        });

        return {
          ...seller,
          followers: followerCount,
          productsCount: productCount,
          following: 0, // Default value
          rating: 4.7, // Default value or calculate from reviews
          // Add other calculated fields if needed
        };
      })
    );

    return res.status(200).json({
      message: "All sellers fetched successfully",
      sellers: sellersWithStats,
      count: sellersWithStats.length
    });
    
  } catch (error) {
    console.error("❌ Error fetching all sellers:", error);
    return res.status(500).json({ 
      message: "Server error while fetching sellers",
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
};

// Add to Controller/sellerAuthController.ts
export const getMySellerDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log("=== GET MY SELLER DETAILS START ===");
    console.log("Request user:", req.user);
    
    if (!req.user || !req.user.seller_id) {
      return res.status(401).json({ 
        message: "Unauthorized. Please log in as a seller." 
      });
    }
    
    const sellerId = req.user.seller_id;
    
    const seller = await prisma.seller.findUnique({
      where: { seller_id: Number(sellerId) },
      select: {
        seller_id: true,
        businessName: true,
        businessEmail: true,
        businessAddress: true,
        phoneNum: true,
        category: true,
        openingHours: true,
        deliveryRadius: true,
        website: true,
        storeDescription: true,
        storeImg: true,
        coverImg: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!seller) {
      return res.status(404).json({ message: "Seller not found." });
    }

    // Get followers count
    const followerCount = await prisma.follow.count({
      where: { foloweeselId: sellerId }
    });

    // Get products count
    const productCount = await prisma.product.count({
      where: { sellerId: sellerId }
    });

    console.log("Successfully fetched seller details");
    console.log("=== GET MY SELLER DETAILS END ===");

    return res.status(200).json({
      message: "Seller details fetched successfully",
      seller: {
        ...seller,
        followers: followerCount,
        productsCount: productCount,
        following: 0,
        rating: 4.7
      },
    });
  } catch (error) {
    console.error("❌ ERROR fetching seller details:", error);
    return res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};