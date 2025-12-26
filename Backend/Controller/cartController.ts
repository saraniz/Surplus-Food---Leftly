import prisma from "../lib/prisma";
import { Request, Response } from "express";

// Update your backend addToCart function
export const addToCart = async (req: Request, res: Response) => {
  try {
    console.log("🔥 BACKEND addToCart called");
    console.log("🔥 Request body:", req.body);
    console.log("🔥 User ID:", req.user?.id);
    
    const userId = req.user.id;
    const { productId, quantity = 1, isMysteryBox = false, productInfo } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Userid missing." });
    }

    // Check user
    const customer = await prisma.customer.findUnique({
      where: { id: userId },
    });

    if (!customer) {
      return res.status(404).json({ message: "User not found." });
    }

    // Create or fetch cart
    let cart = await prisma.cart.findFirst({
      where: { customerId: userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { customerId: userId },
      });
    }

    // SPECIAL HANDLING FOR MYSTERY BOXES
    if (isMysteryBox) {
      console.log("🎁 Adding mystery box to cart");
      
      // Check if mystery box exists in MysteryBox table
      const mysteryBox = await prisma.mysteryBox.findUnique({
        where: { id: productId }, // Use the mystery box ID
      });

      if (!mysteryBox) {
        return res.status(404).json({ message: "Mystery box not found." });
      }

      // Check if mystery box already in cart
      let cartItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: productId, // Store the mystery box ID
        },
      });

      if (cartItem) {
        // Update quantity
        cartItem = await prisma.cartItem.update({
          where: { id: cartItem.id },
          data: { quantity: cartItem.quantity + quantity },
        });
      } else {
        // Add new item
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: productId, // Store the mystery box ID
            quantity,
          },
        });
      }

      console.log("✅ Mystery box added to cart");

    } else {
      // ORIGINAL LOGIC FOR REGULAR PRODUCTS
      if (!productId) {
        return res.status(400).json({ message: "Product id missing." });
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { product_id: productId },
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }

      // Check if product already in cart
      let cartItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
        },
      });

      if (cartItem) {
        // Update quantity
        await prisma.cartItem.update({
          where: { id: cartItem.id },
          data: { quantity: cartItem.quantity + quantity },
        });
      } else {
        // Add new item
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
        });
      }
    }

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                seller: true,
                images: {
                  orderBy: {
                    id: 'asc'
                  },
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    // Transform cart to include mystery boxes properly
    const transformedCart = await transformCartResponseWithMysteryBoxes(updatedCart);

    return res.status(200).json({
      cart: transformedCart,
      message: "Product added to cart successfully."
    });

  } catch (error) {
    console.error("Add to cart error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// New transform function that handles both products and mystery boxes
const transformCartResponseWithMysteryBoxes = async (cart: any) => {
  if (!cart) return null;

  // Process each cart item
  const processedCartItems = await Promise.all(
    cart.cartItems.map(async (item: any) => {
      // Check if this is a mystery box (ID >= 1 and doesn't exist in products table)
      const product = await prisma.product.findUnique({
        where: { product_id: item.productId },
      });

      let processedItem = { ...item };
      
      if (!product) {
        // This might be a mystery box - check the MysteryBox table
        const mysteryBox = await prisma.mysteryBox.findUnique({
          where: { id: item.productId },
          include: {
            seller: true
          }
        });

        if (mysteryBox) {
          // It's a mystery box
          processedItem = {
            ...item,
            product: {
              product_id: mysteryBox.id,
              productName: mysteryBox.name,
              name: mysteryBox.name,
              price: mysteryBox.price.toString(),
              discountPrice: mysteryBox.discountPrice?.toString() || mysteryBox.price.toString(),
              productDescription: mysteryBox.description,
              category: mysteryBox.category || "",
              isMysteryBox: true,
              images: [{ 
                imageUrl: "https://cdn.vectorstock.com/i/500p/04/67/mystery-prize-box-lucky-surprise-gift-vector-45060467.jpg"
              }],
              seller: mysteryBox.seller
            },
            isMysteryBox: true
          };
        }
      } else {
        // It's a regular product
        let imageUrl = null;
        
        if (product.images && product.images.length > 0) {
          const firstImage = product.images[0];
          imageUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${firstImage.imageUrl}`;
        }
        
        processedItem = {
          ...item,
          product: product ? {
            ...product,
            productImg: imageUrl,
            imageUrl: imageUrl,
            images: product.images || []
          } : null,
          isMysteryBox: false
        };
      }
      
      return processedItem;
    })
  );

  return {
    ...cart,
    cartItems: processedCartItems
  };
};

// Update your fetchCart function too
export const fetchCart = async (req: Request, res: Response) => {
  try {
    console.log("🔥 BACKEND fetchCart called");
    console.log("🔥 User ID:", req.user?.id);
    
    const userId = req.user.id;

    const cart = await prisma.cart.findFirst({
      where: { customerId: userId },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                seller: true,
                images: {
                  orderBy: {
                    id: 'asc'
                  },
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    if (!cart) {
      return res.status(200).json({ 
        cart: {
          id: 0,
          cartItems: []
        }, 
        message: "Cart is empty" 
      });
    }

    const transformedCart = await transformCartResponseWithMysteryBoxes(cart);

    return res.status(200).json({ 
      cart: transformedCart, 
      message: "Cart fetched successfully" 
    });

  } catch (error) {
    console.error("Fetch cart error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    const cart = await prisma.cart.findFirst({
      where: { customerId: userId },
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Delete the cart item
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId: productId }
    });

    // Return updated cart
    const updatedCart = await prisma.cart.findFirst({
      where: { customerId: userId },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                seller: true,
                images: {
                  orderBy: {
                    id: 'asc'
                  },
                  take: 1
                }
              },
            },
          },
        },
      },
    });

    const transformedCart = updatedCart ? transformCartResponse(updatedCart) : null;

    return res.status(200).json({
      cart: transformedCart,
      message: "Cart item deleted successfully"
    });
    
  } catch (error) {
    console.error("Delete cart error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// Update transformCartResponse to handle mystery boxes
// const transformCartResponse = (cart: any) => {
//   if (!cart) return null;

//   return {
//     ...cart,
//     cartItems: cart.cartItems.map((item: any) => {
//       const product = item.product;
      
//       // Check if it's a mystery box (from metadata or product_id)
//       const isMysteryBox = 
//         (product?.metadata && JSON.parse(product.metadata).isMysteryBox) ||
//         product?.product_id === 999999 ||
//         product?.category === "Mystery Box";
      
//       let imageUrl = null;
      
//       // Get image for mystery box
//       if (isMysteryBox) {
//         imageUrl = "https://cdn.vectorstock.com/i/500p/04/67/mystery-prize-box-lucky-surprise-gift-vector-45060467.jpg";
        
//         // If we have metadata, use it to enhance the product data
//         if (product?.metadata) {
//           try {
//             const metadata = JSON.parse(product.metadata);
//             product.productName = metadata.name || product.productName;
//             product.productDescription = metadata.description || product.productDescription;
//             product.price = metadata.price?.toString() || product.price;
//             product.discountPrice = metadata.discountPrice?.toString() || product.discountPrice;
//             product.isMysteryBox = true;
//           } catch (e) {
//             console.error("Error parsing mystery box metadata:", e);
//           }
//         }
        
//         // Ensure mystery box flag is set
//         product.isMysteryBox = true;
//       } else if (product?.images && product.images.length > 0) {
//         // Regular product image handling
//         const firstImage = product.images[0];
//         imageUrl = `http://localhost:5000/uploads/${firstImage.imageUrl}`;
//       }
      
//       return {
//         ...item,
//         product: product ? {
//           ...product,
//           // For backward compatibility
//           productImg: imageUrl,
//           imageUrl: imageUrl,
//           images: product.images || []
//         } : null,
//         isMysteryBox: isMysteryBox
//       };
//     })
//   };
// };

// NEW: Bulk add endpoint for merging session cart
export const bulkAddToCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { items } = req.body; // Array of { productId, quantity }

    if (!userId) {
      return res.status(401).json({ message: "Userid missing." });
    }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Items array is required." });
    }

    // Check user
    const customer = await prisma.customer.findUnique({
      where: { id: userId },
    });

    if (!customer) {
      return res.status(404).json({ message: "User not found." });
    }

    // Create or fetch cart
    let cart = await prisma.cart.findFirst({
      where: { customerId: userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { customerId: userId },
      });
    }

    // Process each item
    for (const item of items) {
      const { productId, quantity = 1 } = item;

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { product_id: productId },
      });

      if (!product) {
        continue; // Skip invalid products
      }

      // Check if product already in cart
      let cartItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
        },
      });

      if (cartItem) {
        // Update quantity
        await prisma.cartItem.update({
          where: { id: cartItem.id },
          data: { quantity: cartItem.quantity + quantity },
        });
      } else {
        // Add new item
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
        });
      }
    }

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                seller: true,
                images: {
                  orderBy: {
                    id: 'asc'
                  },
                  take: 1
                }
              },
            },
          },
        },
      },
    });

    const transformedCart = transformCartResponse(updatedCart);

    return res.status(200).json({
      cart: transformedCart,
      message: "Cart items merged successfully.",
    });
  } catch (error) {
    console.error("Bulk add error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};