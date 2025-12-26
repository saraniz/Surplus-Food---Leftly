"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar2";
import { useCartState } from "../ZustandStore/cartStore";
import { CheckCircle, XCircle, X, ShoppingBag, AlertCircle } from "lucide-react";

interface CartItem {
  id: number;
  productId: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
  isMysteryBox?: boolean;
}

export default function CartPage() {
  const { cart, fetchCart, loading, deleteCart, addToCart } = useCartState();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    show: boolean;
  } | null>(null);

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    itemToDelete?: number;
    actionType: "single" | "all";
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, show: true });
  };

  useEffect(() => {
    const loadCart = async () => {
      console.log("🔄 Loading cart...");
      await fetchCart();
      setIsInitialLoad(false);
    };
    loadCart();
  }, [fetchCart]);

  // UPDATED: Improved image URL function that handles mystery boxes
  const getImageUrl = (product: any): string => {
    if (!product) {
      return "https://placehold.co/200x200/e5e7eb/6b7280?text=No+Image";
    }
    
    console.log("DEBUG Product for image:", product);
    
    // SPECIAL HANDLING FOR MYSTERY BOXES
    const isMysteryBox = 
      product.isMysteryBox === true || 
      product.productId === 999999 ||
      product.product_id === 999999 ||
      product.name?.includes("Mystery") ||
      product.name?.includes("mystery") ||
      product.productName?.includes("Mystery") ||
      product.productName?.includes("mystery");
    
    if (isMysteryBox) {
      console.log("🎁 Detected as Mystery Box, using default mystery box image");
      // Use the same mystery box image from your mystery boxes page
      return "https://cdn.vectorstock.com/i/500p/04/67/mystery-prize-box-lucky-surprise-gift-vector-45060467.jpg";
    }
    
    // 1. Check for Base64 images first
    if (product.imageBase64 || product.productImgBase64) {
      return product.imageBase64 || product.productImgBase64;
    }
    
    // 2. Check for images array
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      
      if (firstImage.imageBase64) {
        return firstImage.imageBase64;
      }
      
      if (firstImage.imageUrl || firstImage.filename) {
        const filename = firstImage.imageUrl || firstImage.filename;
        
        if (filename.startsWith('http')) {
          return filename;
        }
        
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000';
        return `${backendUrl}/uploads/${filename}`;
      }
    }
    
    // 3. Check for productImg
    if (product.productImg) {
      if (typeof product.productImg === 'string' && product.productImg.startsWith('data:image/')) {
        return product.productImg;
      }
      
      if (typeof product.productImg === 'string' && product.productImg.startsWith('http')) {
        return product.productImg;
      }
      
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000';
      return `${backendUrl}/uploads/${product.productImg}`;
    }
    
    // 4. Check for imageUrl
    if (product.imageUrl) {
      if (typeof product.imageUrl === 'string' && product.imageUrl.startsWith('data:image/')) {
        return product.imageUrl;
      }
      
      if (typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http')) {
        return product.imageUrl;
      }
      
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000';
      return `${backendUrl}/uploads/${product.imageUrl}`;
    }
    
    // 5. Default placeholder
    return "https://placehold.co/200x200/e5e7eb/6b7280?text=No+Image";
  };

  // Map backend cart to frontend-friendly cart items with better error handling
  const cartItems: CartItem[] =
    cart?.cartItems?.map((item: any) => {
      // Try to get product data from different possible locations
      const product = item.product || {};
      
      // DEBUG logging
      console.log("🛒 Processing cart item:", item);
      console.log("📦 Product data:", product);
      
      // Check if it's a mystery box
      const isMysteryBox = 
        product.isMysteryBox === true || 
        item.productId === 999999 ||
        product.product_id === 999999 ||
        product.name?.includes("Mystery") ||
        product.name?.includes("mystery") ||
        product.productName?.includes("Mystery") ||
        product.productName?.includes("mystery") ||
        item.isMysteryBox === true;
      
      console.log("🎁 Is Mystery Box?", isMysteryBox);
      
      // For mystery boxes, ensure we have proper data
      if (isMysteryBox) {
        console.log("🎁 Processing mystery box item");
        
        // Use item data directly if product data is missing
        const mysteryBoxData = {
          name: product.name || 
                product.productName || 
                "Mystery Box",
          price: Number(product.price || 
                       product.discountPrice || 
                       299),
          description: product.description || 
                      product.productDescription || 
                      "A special mystery item!",
          image: getImageUrl(product),
          isMysteryBox: true
        };
        
        console.log("🎁 Mystery box final data:", mysteryBoxData);
        
        return {
          id: item.id || Date.now(),
          productId: item.productId || 999999,
          name: mysteryBoxData.name,
          description: mysteryBoxData.description,
          price: mysteryBoxData.price,
          quantity: item.quantity || 1,
          image: mysteryBoxData.image,
          isMysteryBox: true
        };
      }
      
      // For regular products
      const imageUrl = getImageUrl(product);
      
      // Try to get the product name from different possible fields
      const productName = product.productName || 
                         product.name || 
                         product.product_name || 
                         "Unknown Product";
      
      // Try to get description from different possible fields
      const description = product.productDescription || 
                         product.description || 
                         product.product_description || 
                         "";
      
      // Try to get price from different possible fields
      const price = Number(product.discountPrice || 
                          product.price || 
                          product.product_price || 
                          product.discounted_price || 
                          0);
      
      return {
        id: item.id || item.productId || Date.now(),
        productId: item.productId,
        name: productName,
        description: description,
        price: price,
        quantity: item.quantity || 1,
        image: imageUrl,
        isMysteryBox: false
      };
    }) || [];

  // Debug: Log cart structure
  useEffect(() => {
    console.log("=== CART DEBUG INFO ===");
    console.log("Cart object:", cart);
    console.log("Cart items array:", cart?.cartItems);
    console.log("Processed cart items:", cartItems);
    console.log("Cart items length:", cartItems.length);
    
    if (cart?.cartItems && cart.cartItems.length > 0) {
      cart.cartItems.forEach((item: any, index: number) => {
        console.log(`Item ${index}:`, item);
        console.log(`Item ${index} product:`, item.product);
        console.log(`Item ${index} productId:`, item.productId);
        console.log(`Item ${index} isMysteryBox:`, item.isMysteryBox || item.product?.isMysteryBox);
      });
    }
  }, [cart, cartItems]);

  // Totals
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const deliveryFee = subtotal > 1000 ? 0.0 : 150.0;
  const serviceFee = 200.0;
  const total = subtotal + deliveryFee + serviceFee;

  // Update quantity
  const updateQuantity = async (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      await showDeleteConfirmation(productId);
      return;
    }

    try {
      const currentItem = cartItems.find(item => item.productId === productId);
      if (!currentItem) return;

      const quantityDifference = newQuantity - currentItem.quantity;
      
      if (quantityDifference === 0) return;

      // For mystery boxes, we need to pass additional info
      const isMysteryBox = currentItem.isMysteryBox;
      let productInfo = {};
      
      if (isMysteryBox) {
        productInfo = {
          name: currentItem.name,
          price: currentItem.price,
          description: currentItem.description,
          isMysteryBox: true
        };
      }
      
      await addToCart(productId, quantityDifference, productInfo);
      await fetchCart();
      
      // Show success toast for quantity update
      const productName = currentItem.name;
      if (quantityDifference > 0) {
        showToast(`Added ${quantityDifference} more of "${productName}"`, "success");
      } else {
        showToast(`Removed ${Math.abs(quantityDifference)} from "${productName}"`, "success");
      }
    } catch (err) {
      console.error("Failed to update quantity", err);
      showToast("Failed to update quantity. Please try again.", "error");
    }
  };

  // Show confirmation dialog for single item deletion
  const showDeleteConfirmation = (productId: number) => {
    const itemToRemove = cartItems.find(item => item.productId === productId);
    if (!itemToRemove) return;

    setConfirmationDialog({
      show: true,
      title: itemToRemove.isMysteryBox ? "Remove Mystery Box" : "Remove Item",
      message: `Are you sure you want to remove "${itemToRemove.name}" from your cart?`,
      itemToDelete: productId,
      actionType: "single",
      onConfirm: async () => {
        try {
          await deleteCart(productId);
          await fetchCart();
          showToast(`"${itemToRemove.name}" removed from cart`, "success");
        } catch (err) {
          console.error("Failed to delete item", err);
          showToast("Failed to remove item. Please try again.", "error");
        } finally {
          setConfirmationDialog(null);
        }
      }
    });
  };

  // Show confirmation dialog for clearing entire cart
  const showClearCartConfirmation = () => {
    if (cartItems.length === 0) return;

    setConfirmationDialog({
      show: true,
      title: "Clear Cart",
      message: `Are you sure you want to remove all ${cartItems.length} items from your cart? This action cannot be undone.`,
      actionType: "all",
      onConfirm: async () => {
        try {
          // Delete each item one by one
          for (const item of cartItems) {
            await deleteCart(item.productId);
          }
          await fetchCart();
          showToast("All items removed from cart", "success");
        } catch (err) {
          console.error("Failed to clear cart", err);
          showToast("Failed to clear cart. Please try again.", "error");
        } finally {
          setConfirmationDialog(null);
        }
      }
    });
  };

  // Quick remove without confirmation dialog (alternative to showDeleteConfirmation)
  const quickRemove = async (productId: number) => {
    const itemToRemove = cartItems.find(item => item.productId === productId);
    if (!itemToRemove) return;

    // Show confirmation dialog
    showDeleteConfirmation(productId);
  };

  const totalItems = cartItems.reduce((t, item) => t + item.quantity, 0);

  const handleCheckout = () => {
    if (!cartItems.length) return;
    window.location.href = '/checkout';
  };

  // Image error handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, itemName: string, isMysteryBox: boolean, product: any) => {
    const img = e.currentTarget;
    console.log(`Image failed to load for: ${itemName}`);
    
    // For mystery boxes, use the default mystery box image
    if (isMysteryBox) {
      img.src = "https://cdn.vectorstock.com/i/500p/04/67/mystery-prize-box-lucky-surprise-gift-vector-45060467.jpg";
      return;
    }
    
    // For regular products, try fallbacks
    let newSrc = null;
    
    if (product?.imageBase64 || product?.productImgBase64) {
      newSrc = product.imageBase64 || product.productImgBase64;
    } else if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      if (firstImage.imageBase64) {
        newSrc = firstImage.imageBase64;
      } else if (firstImage.imageUrl) {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000';
        newSrc = `${backendUrl}/uploads/${firstImage.imageUrl}`;
      }
    } else if (product?.productImg) {
      if (typeof product.productImg === 'string' && product.productImg.startsWith('data:image/')) {
        newSrc = product.productImg;
      } else {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000';
        newSrc = `${backendUrl}/uploads/${product.productImg}`;
      }
    }
    
    if (!newSrc) {
      newSrc = "https://placehold.co/200x200/e5e7eb/6b7280?text=No+Image";
    }
    
    img.src = newSrc;
    
    // Set a final fallback
    img.onerror = () => {
      img.src = "https://placehold.co/200x200/e5e7eb/6b7280?text=No+Image";
      img.onerror = null;
    };
  };

  if (loading || isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Toast Notification */}
      {toast && (
        <div className={`
          fixed top-4 right-4 z-50 max-w-md animate-slideIn
          ${toast.type === "success" 
            ? "bg-gradient-to-r from-emerald-500 to-green-500" 
            : "bg-gradient-to-r from-rose-500 to-red-500"
          } 
          text-white p-4 rounded-xl shadow-2xl flex items-center space-x-3
        `}>
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="flex-1 font-medium">{toast.message}</span>
          <button 
            type="button"
            title="Close"
            onClick={() => setToast(null)} 
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmationDialog?.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {confirmationDialog.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Please confirm your action</p>
                  </div>
                </div>
                <button
                  type="button"
                  title="Cancel"
                  onClick={() => setConfirmationDialog(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message */}
              <div className="mb-6">
                <p className="text-gray-700">
                  {confirmationDialog.message}
                </p>
                {confirmationDialog.actionType === "all" && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      This action cannot be undone.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmationDialog(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmationDialog.onConfirm}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-sm hover:shadow"
                >
                  {confirmationDialog.actionType === "all" ? "Clear Cart" : "Remove Item"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-black">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-8 h-8" />
              Your Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
            </h1>
            <p className="text-gray-600 mt-2">
              Review your items and proceed to checkout
            </p>
          </div>
          
          {cartItems.length > 0 && (
            <button
              onClick={showClearCartConfirmation}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Cart
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {cartItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-50 to-amber-50 flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-gray-600 mb-6">
                  Add some delicious food to get started!
                </p>
                <a 
                  href="/homepage"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition duration-200 shadow-sm hover:shadow"
                >
                  <span>Browse Restaurants</span>
                  <span>→</span>
                </a>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {cartItems.map((item, index) => {
                  // Get the product data for this item
                  const product = cart?.cartItems?.[index]?.product;
                  const isMysteryBox = item.isMysteryBox || product?.isMysteryBox;
                  
                  return (
                    <div
                      key={`${item.id}-${item.productId}`}
                      className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition duration-200 group"
                    >
                      <div className="p-6 flex flex-col sm:flex-row gap-4">
                        <div className="flex-shrink-0 relative">
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                            {isMysteryBox && (
                              <div className="absolute top-1 left-1 z-10">
                                <span className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                  MYSTERY
                                </span>
                              </div>
                            )}
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => handleImageError(e, item.name, isMysteryBox || false, product)}
                              loading="lazy"
                            />
                          </div>
                          {item.quantity > 1 && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                              {item.quantity}
                            </div>
                          )}
                        </div>

                        <div className="flex-grow">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {item.name}
                                {isMysteryBox && (
                                  <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                                    Mystery Box
                                  </span>
                                )}
                              </h3>
                              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div>
                              <span className="text-green-600 font-semibold text-lg">
                                Rs {item.price.toFixed(2)}
                              </span>
                              <span className="text-gray-400 text-sm ml-2">
                                per item
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                  aria-label="Decrease quantity"
                                  disabled={item.quantity <= 1}
                                >
                                  <span className="text-gray-700 font-bold">−</span>
                                </button>

                                <span className="w-8 text-center font-medium text-gray-900">
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition duration-200"
                                  aria-label="Increase quantity"
                                >
                                  <span className="text-gray-700 font-bold">+</span>
                                </button>
                              </div>
                              
                              {/* Quick remove button */}
                              <button
                                type="button"
                                onClick={() => quickRemove(item.productId)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-full hover:bg-red-50"
                                aria-label="Remove item"
                                title="Remove item"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0 flex flex-col items-end justify-between">
                          <div className="text-lg font-semibold text-gray-900">
                            Rs {(item.price * item.quantity).toFixed(2)}
                          </div>
                          <button
                            type="button"
                            onClick={() => showDeleteConfirmation(item.productId)}
                            className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-medium transition duration-200 hover:bg-red-50 px-3 py-1.5 rounded-lg"
                            aria-label="Remove item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
                  </span>
                  <span className="font-medium">
                    Rs {subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">
                    {deliveryFee === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `Rs ${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-medium">
                    Rs {serviceFee.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">Rs {total.toFixed(2)}</span>
                </div>
                {subtotal > 1000 && (
                  <p className="text-green-600 text-sm mt-1 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                    </svg>
                    You saved Rs 150 on delivery!
                  </p>
                )}
                <p className="text-gray-600 text-sm mt-1">
                  Including taxes
                </p>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3.5 rounded-lg transition duration-200 mb-4 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-sm hover:shadow flex items-center justify-center gap-2"
                disabled={cartItems.length === 0}
              >
                {cartItems.length === 0 ? (
                  "Cart is Empty"
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>Proceed to Checkout</span>
                    <span>→</span>
                  </>
                )}
              </button>

              {cartItems.length > 0 && (
                <div className="space-y-3 text-center">
                  <p className="text-gray-500 text-sm">
                    {subtotal < 1000 ? (
                      <span className="flex items-center justify-center gap-1">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Add Rs {(1000 - subtotal).toFixed(2)} more for FREE delivery
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        You qualify for FREE delivery!
                      </span>
                    )}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Secure checkout</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}