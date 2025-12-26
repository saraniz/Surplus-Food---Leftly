import prisma from "../lib/prisma";
import { Request, Response } from "express";
import fs from 'fs';
import path from "path";

export const addProduct = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user.seller_id;
    console.log("sellerid; ", sellerId);

    const {
      productName,
      productDescription,
      category,
      price,
      discountPrice,
      shelfTime,
      stock,
      expiryDate,
      manufactureDate,
      ingredients
    } = req.body;
    
    console.log("Product data:", req.body);

    // Handle multiple files
    const files = req.files as Express.Multer.File[];
    console.log("Uploaded files:", files?.length || 0);

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "At least one product image is required" });
    }

    const seller = await prisma.seller.findUnique({
      where: { seller_id: sellerId },
    });

    if (!seller) {
      return res
        .status(401)
        .json({ message: "Seller not found. Please login again" });
    }

    // Create product first
    const newProduct = await prisma.product.create({
      data: {
        productName,
        productDescription,
        category,
        price,
        discountPrice,
        shelfTime: Number(shelfTime),
        stock: Number(stock),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        manufactureDate: manufactureDate ? new Date(manufactureDate) : null,
        ingredients,
        sellerId: sellerId,
      },
    });

    // Create product images
    const productImages = files.map(file => ({
      imageUrl: file.filename,
      productId: newProduct.product_id,
    }));

    await prisma.productImage.createMany({
      data: productImages
    });

    // Fetch the product with images for response
    const productWithImages = await prisma.product.findUnique({
      where: { product_id: newProduct.product_id },
      include: {
        images: {
          orderBy: {
            id: 'asc'
          }
        }
      }
    });

    // Convert images to base64 for response
    let productImagesBase64: any[] = [];
    if (productWithImages?.images) {
      productImagesBase64 = await Promise.all(
        productWithImages.images.map(async (image) => {
          try {
            const imagePath = path.join(process.cwd(), "uploads", image.imageUrl);
            const imageBuffer = fs.readFileSync(imagePath);
            return {
              ...image,
              imageBase64: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`
            };
          } catch (err) {
            console.error("Image not found:", image.imageUrl);
            return { ...image, imageBase64: null };
          }
        })
      );
    }

    return res.status(200).json({ 
      message: "Product added successfully", 
      newProduct: {
        ...productWithImages,
        images: productImagesBase64
      }
    });
  } catch (error) {
    console.error("Add product error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const fetchProducts = async(req: Request, res: Response) => {
  try {
    let sellerId: number | null = null;

    if(req.user?.seller_id){
      sellerId = req.user.seller_id;
    }
    
    if(req.query.seller_id){
      sellerId = Number(req.query.seller_id);
    }

    // URL param /fetchproducts/:seller_id
    if (req.params.seller_id) {
      sellerId = Number(req.params.seller_id);
    }

    if(!sellerId) return res.status(401).json({message:"Unauthorized access"});

    const products = await prisma.product.findMany({
      where: { sellerId },
      include: {
        images: {
          orderBy: {
            id: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Convert images to base64
    const updatedProducts = await Promise.all(
      products.map(async (p) => {
        const imagesBase64 = await Promise.all(
          p.images.map(async (image) => {
            try {
              const imagePath = path.join(process.cwd(), "uploads", image.imageUrl);
              const imageBuffer = fs.readFileSync(imagePath);
              return {
                ...image,
                imageBase64: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`
              };
            } catch (err) {
              console.error("Image not found for product:", p.productName);
              return { ...image, imageBase64: null };
            }
          })
        );

        return { 
          ...p, 
          images: imagesBase64,
          // For backward compatibility
          productImgBase64: imagesBase64.length > 0 ? imagesBase64[0].imageBase64 : null 
        };
      })
    );

    return res.status(200).json({ 
      products: updatedProducts, 
      message: "Products fetched successfully." 
    });

  } catch(error) {
    console.error(error);
    return res.status(500).json({message:"Server error"});
  }
};

export const updateProduct = async(req: Request, res: Response) => {
  try {
    const sellerId = req.user.seller_id;
    console.log(sellerId);

    if (!sellerId){
      return res.status(401).json({message: "Invalid login. Please login again"});
    }

    const {
      product_id,
      productName,
      productDescription,
      category,
      price,
      discountPrice,
      shelfTime,
      stock,
      expiryDate,
      manufactureDate,
      ingredients
    } = req.body;
    
    console.log("Product update data:", req.body);

    const productId = Number(product_id);
    
    // Handle multiple files for update (optional)
    const files = req.files as Express.Multer.File[];
    const imagesToDelete = req.body.imagesToDelete ? JSON.parse(req.body.imagesToDelete) : [];

    const product = await prisma.product.findUnique({
      where: { product_id: productId },
      include: {
        images: true
      }
    });

    if (!product){
      return res.status(400).json({message: "Product not found."});
    }

    // Check if seller owns this product
    if (product.sellerId !== sellerId) {
      return res.status(403).json({message: "Unauthorized to update this product"});
    }

    // Update product data
    const updateProduct = await prisma.product.update({
      where: { product_id: productId },
      data: {
        productName: productName !== undefined ? productName : undefined,
        productDescription: productDescription !== undefined ? productDescription : undefined,
        category: category !== undefined ? category : undefined,
        price: price !== undefined ? price : undefined,
        discountPrice: discountPrice !== undefined ? discountPrice : undefined,
        shelfTime: shelfTime !== undefined ? Number(shelfTime) : undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : undefined,
        manufactureDate: manufactureDate !== undefined ? (manufactureDate ? new Date(manufactureDate) : null) : undefined,
        ingredients: ingredients !== undefined ? ingredients : undefined,
      },
      include: {
        images: {
          orderBy: {
            id: 'asc'
          }
        }
      }
    });

    // Delete specified images
    if (imagesToDelete.length > 0) {
      await prisma.productImage.deleteMany({
        where: {
          id: { in: imagesToDelete },
          productId: productId
        }
      });
    }

    // Add new images
    if (files && files.length > 0) {
      const productImages = files.map(file => ({
        imageUrl: file.filename,
        productId: productId,
      }));

      await prisma.productImage.createMany({
        data: productImages
      });
    }

    // Fetch updated product with images
    const updatedProduct = await prisma.product.findUnique({
      where: { product_id: productId },
      include: {
        images: {
          orderBy: {
            id: 'asc'
          }
        }
      }
    });

    // Convert images to base64
    let productImagesBase64: any[] = [];
    if (updatedProduct?.images) {
      productImagesBase64 = await Promise.all(
        updatedProduct.images.map(async (image) => {
          try {
            const imagePath = path.join(process.cwd(), "uploads", image.imageUrl);
            const imageBuffer = fs.readFileSync(imagePath);
            return {
              ...image,
              imageBase64: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`
            };
          } catch (err) {
            console.error("Image not found:", image.imageUrl);
            return { ...image, imageBase64: null };
          }
        })
      );
    }

    console.log("Product updated:", updatedProduct);

    return res.status(200).json({
      updateProduct: {
        ...updatedProduct,
        images: productImagesBase64
      },
      message: "Product updated successfully."
    });

  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({message: "Server error."});
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user.seller_id;
    console.log(sellerId);

    if (!sellerId) {
      return res.status(401).json({message: "Please login again."});
    }

    const { productId } = req.body;
    console.log(productId);

    const product = await prisma.product.findUnique({
      where: { product_id: productId },
      include: {
        images: true
      }
    });

    if (!product) {
      return res.status(404).json({message: "Product not found."});
    }

    if (product.sellerId !== sellerId) {
      return res.status(403).json({message: "You cannot delete this product"});
    }

    // Delete associated images first
    await prisma.productImage.deleteMany({
      where: { productId: productId }
    });

    // Then delete the product
    await prisma.product.delete({ where: { product_id: productId } });

    return res.status(200).json({message: "Product deleted successfully."});

  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({message: "Server error."});
  }
};

export const fetchAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: {
          orderBy: {
            id: 'asc'
          },
          take: 1 // Only take first image for list view
        },
        seller: {
          select: {
            businessName: true,
            storeImg: true,
            seller_id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Convert images to base64
    const allProducts = await Promise.all(
      products.map(async (p) => {
        let productImagesBase64: any[] = [];
        
        if (p.images && p.images.length > 0) {
          productImagesBase64 = await Promise.all(
            p.images.map(async (image) => {
              try {
                const imagePath = path.join(process.cwd(), "uploads", image.imageUrl);
                const imageBuffer = fs.readFileSync(imagePath);
                return {
                  ...image,
                  imageBase64: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`
                };
              } catch (err) {
                console.error("Image not found for product:", p.productName);
                return { ...image, imageBase64: null };
              }
            })
          );
        }

        return { 
          ...p, 
          images: productImagesBase64,
          // For backward compatibility
          productImgBase64: productImagesBase64.length > 0 ? productImagesBase64[0].imageBase64 : null 
        };
      })
    );

    return res.status(200).json({ 
      products: allProducts, 
      message: "Products fetched successfully." 
    });
  } catch(error) {
    console.error(error);
    return res.status(500).json({message: "Server error"});
  }
};

export const fetchSingleProduct = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId;
    console.log(productId);

    if (!productId) {
      return res.status(404).json({message: "Product id missing"});
    }

    const product = await prisma.product.findUnique({
      where: { product_id: Number(productId) },
      include: {
        images: {
          orderBy: {
            id: 'asc'
          }
        },
        seller: {
          select: {
            businessName: true,
            storeImg: true,
            seller_id: true,
            businessAddress: true,
            phoneNum: true,
            category: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({message: "Product not found."});
    }

    // Convert images to base64
    let productImagesBase64: any[] = [];
    if (product.images && product.images.length > 0) {
      productImagesBase64 = await Promise.all(
        product.images.map(async (image) => {
          try {
            const imagePath = path.join(process.cwd(), "uploads", image.imageUrl);
            const imageBuffer = fs.readFileSync(imagePath);
            return {
              ...image,
              imageBase64: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`
            };
          } catch (err) {
            console.error("Image not found for product:", product.productName);
            return { ...image, imageBase64: null };
          }
        })
      );
    }

    // Convert store image to base64
    let storeImgBase64: string | null = null;
    if (product.seller?.storeImg) {
      try {
        const imagePath = path.join(process.cwd(), "uploads", product.seller.storeImg);
        const imageBuffer = fs.readFileSync(imagePath);
        storeImgBase64 = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
      } catch (err) {
        console.error("Store image not found:", product.seller.storeImg);
      }
    }

    const updatedProduct = { 
      ...product, 
      images: productImagesBase64,
      // For backward compatibility
      productImgBase64: productImagesBase64.length > 0 ? productImagesBase64[0].imageBase64 : null 
    };

    const store = product.seller ? {
      ...product.seller,
      storeImgBase64: storeImgBase64
    } : null;

    console.log("Product with images:", updatedProduct.images?.length);

    return res.status(200).json({ 
      product: updatedProduct, 
      store: store, 
      message: "Product fetched successfully." 
    });

  } catch(error) {
    console.error(error);
    return res.status(500).json({message: "Server error"});
  }
};

// Helper function to get product images with base64
export const getProductImages = async (productId: number) => {
  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { id: 'asc' }
  });

  const imagesWithBase64 = await Promise.all(
    images.map(async (image) => {
      try {
        const imagePath = path.join(process.cwd(), "uploads", image.imageUrl);
        const imageBuffer = fs.readFileSync(imagePath);
        return {
          ...image,
          imageBase64: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`
        };
      } catch (err) {
        console.error("Image not found:", image.imageUrl);
        return { ...image, imageBase64: null };
      }
    })
  );

  return imagesWithBase64;
};

// 1. Add Mystery Box
export const addMysteryBox = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user.seller_id;
    console.log("sellerid: ", sellerId);

    const {
      name,
      description,
      price,
      discountPrice,
      category,
      stock,
      productDetails, // JSON string of [{productId: 1, quantity: 2}, {productId: 3, quantity: 1}]
      totalValue,
      expiryDate, // Add this
      manufactureDate // Add this
    } = req.body;
    
    console.log("Mystery box data:", req.body);

    const seller = await prisma.seller.findUnique({
      where: { seller_id: sellerId },
    });

    if (!seller) {
      return res
        .status(401)
        .json({ message: "Seller not found. Please login again" });
    }

    // Validate productDetails JSON
    let productsArray: Array<{productId: number, quantity: number}> = [];
    try {
      productsArray = JSON.parse(productDetails);
      if (!Array.isArray(productsArray)) {
        return res.status(400).json({ message: "productDetails must be a valid JSON array" });
      }
    } catch (error) {
      return res.status(400).json({ message: "Invalid productDetails JSON format" });
    }

    // Verify all products belong to this seller
    const productIds = productsArray.map(item => item.productId);
    const sellerProducts = await prisma.product.findMany({
      where: {
        product_id: { in: productIds },
        sellerId: sellerId
      }
    });

    if (sellerProducts.length !== productIds.length) {
      return res.status(400).json({ 
        message: "Some products don't belong to you or don't exist" 
      });
    }

    // Calculate total value if not provided
    let calculatedTotalValue = 0;
    if (!totalValue) {
      for (const item of productsArray) {
        const product = sellerProducts.find(p => p.product_id === item.productId);
        if (product) {
          const productPrice = parseFloat(product.price) || parseFloat(product.discountPrice) || 0;
          calculatedTotalValue += productPrice * item.quantity;
        }
      }
    }

    // Create mystery box
    const mysteryBox = await prisma.mysteryBox.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        category,
        status: "ACTIVE",
        stock: parseInt(stock),
        sales: 0,
        productDetails: productDetails,
        totalValue: totalValue ? parseFloat(totalValue) : calculatedTotalValue,
        sellerId: sellerId,
        // Add these fields - IMPORTANT: Check your Prisma schema for exact field name
        expireDate: expiryDate ? new Date(expiryDate) : null, // Might be expireDate or expiryDate
        manufactureDate: manufactureDate ? new Date(manufactureDate) : null,
      },
    });

    return res.status(200).json({ 
      message: "Mystery box created successfully", 
      mysteryBox 
    });
  } catch (error) {
    console.error("Add mystery box error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// 2. Fetch All Mystery Boxes (For Customers - Active boxes only)
export const fetchMysteryBoxes = async (req: Request, res: Response) => {
  try {
    const { 
      category, 
      minPrice, 
      maxPrice,
      sellerId,
      sortBy = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {
      status: "ACTIVE",
      stock: { gt: 0 }
    };

    if (category) {
      where.category = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseInt(minPrice as string);
      }
      if (maxPrice) {
        where.price.lte = parseInt(maxPrice as string);
      }
    }

    if (sellerId) {
      where.sellerId = parseInt(sellerId as string);
    }

    // Build order by
    let orderBy: any = {};
    switch (sortBy) {
      case 'price_low':
        orderBy.price = 'asc';
        break;
      case 'price_high':
        orderBy.price = 'desc';
        break;
      case 'popular':
        orderBy.sales = 'desc';
        break;
      case 'newest':
      default:
        orderBy.createdAt = 'desc';
        break;
    }

    // Fetch mystery boxes
    const [mysteryBoxes, totalCount] = await Promise.all([
      prisma.mysteryBox.findMany({
        where,
        include: {
          seller: {
            select: {
              seller_id: true,
              businessName: true,
              storeImg: true,
              businessAddress: true,
              category: true
            }
          }
        },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.mysteryBox.count({ where })
    ]);

    // Get store images as base64
    const updatedMysteryBoxes = await Promise.all(
      mysteryBoxes.map(async (box) => {
        let storeImgBase64: string | null = null;
        if (box.seller?.storeImg) {
          try {
            const imagePath = path.join(process.cwd(), "uploads", box.seller.storeImg);
            const imageBuffer = fs.readFileSync(imagePath);
            storeImgBase64 = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
          } catch (err) {
            console.error("Store image not found:", box.seller.storeImg);
          }
        }

        return {
          ...box,
          seller: box.seller ? {
            ...box.seller,
            storeImgBase64
          } : null
        };
      })
    );

    return res.status(200).json({ 
      mysteryBoxes: updatedMysteryBoxes, 
      totalCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      message: "Mystery boxes fetched successfully." 
    });

  } catch(error) {
    console.error(error);
    return res.status(500).json({message: "Server error"});
  }
};

// 3. Fetch Mystery Boxes by Seller (For Seller Dashboard)
export const fetchSellerMysteryBoxes = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user.seller_id;
    
    if (!sellerId) {
      return res.status(401).json({message: "Unauthorized access"});
    }

    const { 
      status,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = { sellerId };

    if (status) {
      where.status = status;
    }

    // Fetch mystery boxes with product details
    const [mysteryBoxes, totalCount] = await Promise.all([
      prisma.mysteryBox.findMany({
        where,
        include: {
          // For seller view, we can include product details
          // But we'll parse productDetails manually to include full product info
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.mysteryBox.count({ where })
    ]);

    // Parse productDetails and fetch full product info for seller view
    const mysteryBoxesWithProducts = await Promise.all(
      mysteryBoxes.map(async (box) => {
        try {
          const productsArray = JSON.parse(box.productDetails);
          const productIds = productsArray.map((item: any) => item.productId);
          
          const products = await prisma.product.findMany({
            where: {
              product_id: { in: productIds }
            },
            include: {
              images: {
                take: 1,
                orderBy: { id: 'asc' }
              }
            }
          });

          // Enrich products with quantities
          const enrichedProducts = productsArray.map((item: any) => {
            const product = products.find(p => p.product_id === item.productId);
            if (product) {
              let productImageBase64 = null;
              if (product.images && product.images.length > 0) {
                try {
                  const imagePath = path.join(process.cwd(), "uploads", product.images[0].imageUrl);
                  const imageBuffer = fs.readFileSync(imagePath);
                  productImageBase64 = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
                } catch (err) {
                  console.error("Product image not found:", product.images[0].imageUrl);
                }
              }
              
              return {
                ...product,
                quantity: item.quantity,
                imageBase64: productImageBase64
              };
            }
            return null;
          }).filter(Boolean);

          return {
            ...box,
            products: enrichedProducts,
            totalItems: productsArray.reduce((sum: number, item: any) => sum + item.quantity, 0)
          };
        } catch (error) {
          console.error("Error parsing productDetails:", error);
          return {
            ...box,
            products: [],
            totalItems: 0
          };
        }
      })
    );

    return res.status(200).json({ 
      mysteryBoxes: mysteryBoxesWithProducts, 
      totalCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      message: "Seller mystery boxes fetched successfully." 
    });

  } catch(error) {
    console.error(error);
    return res.status(500).json({message: "Server error"});
  }
};

// 4. Fetch Single Mystery Box Details
export const fetchSingleMysteryBox = async (req: Request, res: Response) => {
  try {
    const mysteryBoxId = parseInt(req.params.id);
    const sellerId = req.user?.seller_id; // Optional, for seller view

    if (!mysteryBoxId) {
      return res.status(404).json({message: "Mystery box id missing"});
    }

    const mysteryBox = await prisma.mysteryBox.findUnique({
      where: { id: mysteryBoxId },
      include: {
        seller: {
          select: {
            seller_id: true,
            businessName: true,
            storeImg: true,
            businessAddress: true,
            category: true,
            phoneNum: true,
            deliveryRadius: true
          }
        }
      }
    });

    if (!mysteryBox) {
      return res.status(404).json({message: "Mystery box not found."});
    }

    // Check if box is active (for customers)
    if (!sellerId && mysteryBox.status !== "ACTIVE") {
      return res.status(404).json({message: "Mystery box not available."});
    }

    // Check if seller owns this box (for seller view)
    if (sellerId && mysteryBox.sellerId !== sellerId) {
      return res.status(403).json({message: "Unauthorized access"});
    }

    // Get store image as base64
    let storeImgBase64: string | null = null;
    if (mysteryBox.seller?.storeImg) {
      try {
        const imagePath = path.join(process.cwd(), "uploads", mysteryBox.seller.storeImg);
        const imageBuffer = fs.readFileSync(imagePath);
        storeImgBase64 = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
      } catch (err) {
        console.error("Store image not found:", mysteryBox.seller.storeImg);
      }
    }

    // Prepare response data
    const response: any = {
      ...mysteryBox,
      seller: mysteryBox.seller ? {
        ...mysteryBox.seller,
        storeImgBase64
      } : null
    };

    // If seller is viewing, include product details
    if (sellerId && mysteryBox.sellerId === sellerId) {
      try {
        const productsArray = JSON.parse(mysteryBox.productDetails);
        const productIds = productsArray.map((item: any) => item.productId);
        
        const products = await prisma.product.findMany({
          where: {
            product_id: { in: productIds }
          },
          include: {
            images: {
              orderBy: { id: 'asc' }
            }
          }
        });

        // Enrich products with quantities and images
        const enrichedProducts = await Promise.all(
          productsArray.map(async (item: any) => {
            const product = products.find(p => p.product_id === item.productId);
            if (product) {
              // Convert images to base64
              const productImages = await Promise.all(
                product.images.map(async (image) => {
                  try {
                    const imagePath = path.join(process.cwd(), "uploads", image.imageUrl);
                    const imageBuffer = fs.readFileSync(imagePath);
                    return {
                      ...image,
                      imageBase64: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`
                    };
                  } catch (err) {
                    console.error("Image not found:", image.imageUrl);
                    return { ...image, imageBase64: null };
                  }
                })
              );

              return {
                ...product,
                quantity: item.quantity,
                images: productImages,
                imageBase64: productImages.length > 0 ? productImages[0].imageBase64 : null
              };
            }
            return null;
          })
        );

        response.products = enrichedProducts.filter(Boolean);
        response.totalItems = productsArray.reduce((sum: number, item: any) => sum + item.quantity, 0);
      } catch (error) {
        console.error("Error parsing productDetails:", error);
        response.products = [];
        response.totalItems = 0;
      }
    } else {
      // For customers, hide product details
      delete response.productDetails;
    }

    return res.status(200).json({ 
      mysteryBox: response, 
      message: "Mystery box fetched successfully." 
    });

  } catch(error) {
    console.error(error);
    return res.status(500).json({message: "Server error"});
  }
};

// 5. Update Mystery Box
// 5. Update Mystery Box
export const updateMysteryBox = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user.seller_id;
    
    if (!sellerId) {
      return res.status(401).json({message: "Please login again."});
    }

    const {
      id,
      name,
      description,
      price,
      discountPrice,
      category,
      stock,
      status,
      productDetails,
      totalValue,
      expiryDate, // Add this
      manufactureDate // Add this
    } = req.body;

    const mysteryBoxId = parseInt(id);
    
    // Check if mystery box exists and belongs to seller
    const mysteryBox = await prisma.mysteryBox.findUnique({
      where: { id: mysteryBoxId }
    });

    if (!mysteryBox) {
      return res.status(404).json({message: "Mystery box not found."});
    }

    if (mysteryBox.sellerId !== sellerId) {
      return res.status(403).json({message: "You cannot update this mystery box"});
    }

    // Prepare update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (discountPrice !== undefined) updateData.discountPrice = discountPrice ? parseFloat(discountPrice) : null;
    if (category !== undefined) updateData.category = category;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (status !== undefined) updateData.status = status;
    if (expiryDate !== undefined) updateData.expireDate = expiryDate ? new Date(expiryDate) : null; // Add this
    if (manufactureDate !== undefined) updateData.manufactureDate = manufactureDate ? new Date(manufactureDate) : null; // Add this
    if (productDetails !== undefined) {
      // Validate productDetails if provided
      try {
        const productsArray = JSON.parse(productDetails);
        if (!Array.isArray(productsArray)) {
          return res.status(400).json({ message: "productDetails must be a valid JSON array" });
        }
        updateData.productDetails = productDetails;
      } catch (error) {
        return res.status(400).json({ message: "Invalid productDetails JSON format" });
      }
    }
    if (totalValue !== undefined) updateData.totalValue = parseFloat(totalValue);

    // Update mystery box
    const updatedMysteryBox = await prisma.mysteryBox.update({
      where: { id: mysteryBoxId },
      data: updateData
    });

    return res.status(200).json({
      mysteryBox: updatedMysteryBox,
      message: "Mystery box updated successfully."
    });

  } catch (error) {
    console.error("Update mystery box error:", error);
    return res.status(500).json({message: "Server error."});
  }
};

// 6. Delete Mystery Box
export const deleteMysteryBox = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user.seller_id;
    
    if (!sellerId) {
      return res.status(401).json({message: "Please login again."});
    }

    const { id } = req.body;
    const mysteryBoxId = parseInt(id);

    const mysteryBox = await prisma.mysteryBox.findUnique({
      where: { id: mysteryBoxId }
    });

    if (!mysteryBox) {
      return res.status(404).json({message: "Mystery box not found."});
    }

    if (mysteryBox.sellerId !== sellerId) {
      return res.status(403).json({message: "You cannot delete this mystery box"});
    }

    // Delete the mystery box
    await prisma.mysteryBox.delete({ 
      where: { id: mysteryBoxId } 
    });

    return res.status(200).json({
      message: "Mystery box deleted successfully."
    });

  } catch (error) {
    console.error("Delete mystery box error:", error);
    return res.status(500).json({message: "Server error."});
  }
};

// 7. Get Mystery Box Statistics for Seller Dashboard
export const getMysteryBoxStats = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user.seller_id;
    
    if (!sellerId) {
      return res.status(401).json({message: "Unauthorized access"});
    }

    const stats = await prisma.mysteryBox.aggregate({
      where: { sellerId },
      _count: {
        id: true
      },
      _sum: {
        sales: true,
        stock: true
      }
    });

    const statusCounts = await prisma.mysteryBox.groupBy({
      by: ['status'],
      where: { sellerId },
      _count: {
        id: true
      }
    });

    return res.status(200).json({ 
      stats: {
        totalBoxes: stats._count.id,
        totalSales: stats._sum.sales || 0,
        totalStock: stats._sum.stock || 0,
        statusCounts: statusCounts
      },
      message: "Mystery box statistics fetched successfully." 
    });

  } catch(error) {
    console.error(error);
    return res.status(500).json({message: "Server error"});
  }
};

// Get Mystery Boxes by Seller ID (Simple Version)
export const getMysteryBoxesBySeller = async (req: Request, res: Response) => {
  try {
    // Get sellerId from URL parameter
    const { sellerId } = req.params;
    
    // Validate sellerId
    const sellerIdNum = parseInt(sellerId);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ 
        message: "Invalid seller ID",
        mysteryBoxes: [] 
      });
    }

    // Get query parameters
    const { status = 'ACTIVE' } = req.query;

    // Find all active mystery boxes for this seller
    const mysteryBoxes = await prisma.mysteryBox.findMany({
      where: {
        sellerId: sellerIdNum,
        status: status as string
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        discountPrice: true,
        category: true,
        status: true,
        stock: true,
        sales: true,
        productDetails: true,
        totalValue: true,
        createdAt: true,
        seller: {
          select: {
            seller_id: true,
            businessName: true,
            storeImg: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Parse productDetails to get item count
    const boxesWithDetails = mysteryBoxes.map(box => {
      let totalItems = 0;
      let products = [];
      
      try {
        if (box.productDetails) {
          products = JSON.parse(box.productDetails);
          totalItems = products.reduce((sum, product) => sum + (product.quantity || 1), 0);
        }
      } catch (error) {
        console.error("Error parsing product details:", error);
      }

      // Calculate discount percentage
      let discountPercentage = 0;
      if (box.discountPrice && box.totalValue) {
        discountPercentage = Math.round(((box.totalValue - box.discountPrice) / box.totalValue) * 100);
      } else if (box.discountPrice && box.price) {
        discountPercentage = Math.round(((box.price - box.discountPrice) / box.price) * 100);
      }

      return {
        ...box,
        totalItems,
        discountPercentage,
        price: parseFloat(box.price),
        discountPrice: box.discountPrice ? parseFloat(box.discountPrice) : null,
        totalValue: box.totalValue ? parseFloat(box.totalValue) : parseFloat(box.price) * 2
      };
    });

    return res.status(200).json({
      message: "Mystery boxes fetched successfully",
      mysteryBoxes: boxesWithDetails,
      count: boxesWithDetails.length
    });

  } catch (error) {
    console.error("Error fetching mystery boxes:", error);
    return res.status(500).json({
      message: "Server error",
      mysteryBoxes: []
    });
  }
};