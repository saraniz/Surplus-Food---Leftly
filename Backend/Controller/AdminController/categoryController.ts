// app/backend/Controller/AdminController/categoryController.ts
import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { upload } from '../../Middleware/uploadMiddleware'; // Import the upload middleware

export const addCategory = async (req: Request, res: Response) => {
  try {
    const admin = req.user;
    console.log(admin);

    // Use multer middleware to handle file upload
    upload.single('icon')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const { categoryName, cDescription, cStatus } = req.body;
      const icon = req.file ? req.file.filename : null;

      if (!admin) {
        return res.status(401).json({ message: "Unauthorized access" });
      }

      const newCategory = await prisma.category.create({
        data: {
          categoryName,
          cDescription,
          cStatus: cStatus || "ACTIVE",
          icon
        },
        select: {
          cId: true,
          categoryName: true,
          cDescription: true,
          cStatus: true,
          icon: true,
          createdAt: true
        }
      });

      console.log(newCategory);

      return res.status(200).json({
        newCategory,
        message: "Category added successfully"
      });
    });
  } catch (error) {
    console.error("Add category error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getCategory = async (req: Request, res: Response) => {
  try {

    const category = await prisma.category.findMany({
      select: {
        cId: true,
        categoryName: true,
        cDescription: true,
        cStatus: true,
        icon: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(category);

    return res.status(200).json({ 
      category, 
      message: "Categories fetched successfully" 
    });
  } catch (error) {
    console.error("Get category error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const admin = req.user;

    // Use multer middleware to handle file upload
    upload.single('icon')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const { cId, categoryName, cDescription, cStatus } = req.body;
      const icon = req.file ? req.file.filename : req.body.icon === '' ? null : undefined;

      console.log("Update request body:", req.body);

      if (!admin) {
        return res.status(401).json({ message: "Unauthorized access" });
      }

      if (!cId) {
        return res.status(400).json({ message: "Category ID is required" });
      }

      const updateData: any = {
        ...(categoryName !== undefined && { categoryName }),
        ...(cDescription !== undefined && { cDescription }),
        ...(cStatus !== undefined && { cStatus }),
      };

      // Handle icon update
      if (icon !== undefined) {
        updateData.icon = icon;
      }

      const updatedCategory = await prisma.category.update({
        where: { cId: parseInt(cId) },
        data: updateData,
        select: {
          cId: true,
          categoryName: true,
          cDescription: true,
          cStatus: true,
          icon: true,
          createdAt: true
        }
      });

      console.log("Updated category:", updatedCategory);

      return res.status(200).json({
        updatedCategory,
        message: "Category updated successfully"
      });
    });
  } catch (error) {
    console.error("Update category error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { cId } = req.body;
    console.log(cId);

    const category = await prisma.category.findUnique({
      where: { cId: parseInt(cId) }
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const deletecategory = await prisma.category.delete({
      where: { cId: parseInt(cId) }
    });

    return res.status(200).json({
      deletecategory,
      message: "Category deleted successfully"
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryName } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // First, find the category to verify it exists
    const category = await prisma.category.findFirst({
      where: {
        categoryName: {
          equals: categoryName,
          mode: 'insensitive' // Case insensitive search
        },
        cStatus: 'ACTIVE'
      }
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found or inactive" });
    }

    // Get products for this category with seller details and images
    const products = await prisma.product.findMany({
      where: {
        category: categoryName,
        stock: {
          gt: 0 // Only show products with stock > 0
        },
        seller: {
          // Optionally, you can add more seller filters here
        }
      },
      include: {
        images: {
          take: 1, // Get first image as thumbnail
          select: {
            imageUrl: true
          }
        },
        seller: {
          select: {
            seller_id: true,
            businessName: true,
            storeImg: true,
            deliveryRadius: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        sales: 'desc' // Sort by popularity (sales) by default
      }
    });

    // Calculate average rating for each product
    const productsWithRatings = products.map(product => {
      const totalRating = product.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      const averageRating = product.reviews.length > 0 ? totalRating / product.reviews.length : 0;
      
      return {
        ...product,
        averageRating: parseFloat(averageRating.toFixed(1)),
        reviewCount: product.reviews.length,
        // Remove reviews from response to keep it clean
        reviews: undefined
      };
    });

    // Get total count for pagination
    const totalProducts = await prisma.product.count({
      where: {
        category: categoryName,
        stock: {
          gt: 0
        }
      }
    });

    // Get category stats
    const categoryStats = await prisma.product.groupBy({
      by: ['category'],
      where: {
        category: categoryName
      },
      _count: {
        product_id: true
      },
      _avg: {
        price: true
      }
    });

    return res.status(200).json({
      success: true,
      category: {
        cId: category.cId,
        categoryName: category.categoryName,
        cDescription: category.cDescription,
        icon: category.icon
      },
      products: productsWithRatings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        hasNextPage: page < Math.ceil(totalProducts / limit),
        hasPreviousPage: page > 1
      },
      stats: categoryStats[0] || null
    });

  } catch (error) {
    console.error("Get products by category error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching products by category"
    });
  }
};

export const getProductsByCategoryWithFilters = async (req: Request, res: Response) => {
  try {
    const { categoryName } = req.params;
    const {
      minPrice,
      maxPrice,
      sortBy = 'sales', // sales, price_asc, price_desc, rating, newest
      page = 1,
      limit = 20
    } = req.query;

    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Build where clause
    const whereClause: any = {
      category: categoryName,
      stock: {
        gt: 0
      }
    };

    // Add price filter if provided
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) {
        whereClause.price.gte = parseFloat(minPrice as string);
      }
      if (maxPrice) {
        whereClause.price.lte = parseFloat(maxPrice as string);
      }
    }

    // Build orderBy clause
    let orderByClause: any = {};
    switch (sortBy) {
      case 'price_asc':
        orderByClause.price = 'asc';
        break;
      case 'price_desc':
        orderByClause.price = 'desc';
        break;
      case 'rating':
        orderByClause.reviews = {
          _count: 'desc'
        };
        break;
      case 'newest':
        orderByClause.createdAt = 'desc';
        break;
      default:
        orderByClause.sales = 'desc';
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Get filtered products
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        images: {
          take: 1,
          select: {
            imageUrl: true
          }
        },
        seller: {
          select: {
            seller_id: true,
            businessName: true,
            storeImg: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      skip,
      take: parseInt(limit as string),
      orderBy: orderByClause
    });

    // Calculate ratings
    const productsWithRatings = products.map(product => {
      const totalRating = product.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      const averageRating = product.reviews.length > 0 ? totalRating / product.reviews.length : 0;
      
      return {
        ...product,
        averageRating: parseFloat(averageRating.toFixed(1)),
        reviewCount: product.reviews.length,
        reviews: undefined
      };
    });

    // Get total count for pagination
    const totalProducts = await prisma.product.count({
      where: whereClause
    });

    return res.status(200).json({
      success: true,
      products: productsWithRatings,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(totalProducts / parseInt(limit as string)),
        totalProducts,
        hasNextPage: parseInt(page as string) < Math.ceil(totalProducts / parseInt(limit as string)),
        hasPreviousPage: parseInt(page as string) > 1
      },
      filters: {
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        sortBy
      }
    });

  } catch (error) {
    console.error("Get filtered products by category error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching filtered products"
    });
  }
};

export const getCategoryProductsStats = async (req: Request, res: Response) => {
  try {
    const { categoryName } = req.params;

    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Get comprehensive stats for the category
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(p.product_id) as total_products,
        COUNT(DISTINCT p.sellerId) as total_sellers,
        SUM(p.sales) as total_sales,
        AVG(CAST(p.price AS DECIMAL)) as avg_price,
        MIN(CAST(p.price AS DECIMAL)) as min_price,
        MAX(CAST(p.price AS DECIMAL)) as max_price,
        SUM(p.stock) as total_stock
      FROM Product p
      WHERE p.category = ${categoryName}
      AND p.stock > 0
    `;

    // Get top selling products in this category
    const topProducts = await prisma.product.findMany({
      where: {
        category: categoryName,
        stock: {
          gt: 0
        }
      },
      include: {
        images: {
          take: 1,
          select: {
            imageUrl: true
          }
        },
        seller: {
          select: {
            businessName: true
          }
        }
      },
      take: 5,
      orderBy: {
        sales: 'desc'
      }
    });

    // Get price distribution
    const priceDistribution = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN CAST(price AS DECIMAL) < 10 THEN 'Under $10'
          WHEN CAST(price AS DECIMAL) BETWEEN 10 AND 20 THEN '$10 - $20'
          WHEN CAST(price AS DECIMAL) BETWEEN 21 AND 50 THEN '$21 - $50'
          WHEN CAST(price AS DECIMAL) BETWEEN 51 AND 100 THEN '$51 - $100'
          ELSE 'Over $100'
        END as price_range,
        COUNT(*) as count
      FROM Product
      WHERE category = ${categoryName}
      AND stock > 0
      GROUP BY price_range
      ORDER BY price_range
    `;

    return res.status(200).json({
      success: true,
      stats: stats[0],
      topProducts,
      priceDistribution
    });

  } catch (error) {
    console.error("Get category stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching category stats"
    });
  }
};

