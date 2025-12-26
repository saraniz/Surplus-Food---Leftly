"use client";

import { useState, useEffect, useCallback } from "react";
import { lora } from "@/app/libs/fonts";
import {
  Clock, Star, Truck, ChevronDown, ChevronUp, ShoppingBag,
  Check, Plus, Minus, Store, User, Home, ChevronRight,
  ArrowRight, Calendar, Package, ChefHat,
  MapPin, Navigation, Phone, Globe, Clock as ClockIcon
} from "lucide-react";
import Navbar2 from "@/app/components/Navbar2";
import ProductCard from "@/app/components/Product";
import { useParams, useRouter } from "next/navigation";
import { useProductStore } from "../../ZustandStore/productStore";
import { useCusAuthStore } from "@/app/ZustandStore/authStore";
import { useCartState } from "@/app/ZustandStore/cartStore";
import { useReviewStore } from "@/app/ZustandStore/reviewStore";
import Link from "next/link";

// Helper function to get image URL
const getImageUrl = (image: any): string => {
  if (!image) return "/placeholder-image.jpg";
  if (typeof image === 'string') return image;
  return image?.imageBase64 || "/placeholder-image.jpg";
};

export default function ProductPage() {
  const { productId } = useParams();
  const router = useRouter();
  
  // State management
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallbackProduct, setUsingFallbackProduct] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isGettingDirections, setIsGettingDirections] = useState(false);

  // Store actions and state
  const { 
    products, 
    fetchSingleProduct, 
    singleProduct, 
    error, 
    fetchAllProducts,
    productSeller,
    fetchProductSeller,
    loadingSeller
  } = useProductStore();
  
  const { seller: loggedInSeller } = useCusAuthStore();
  const { cart, addToCart, fetchCart, loading: cartLoading } = useCartState();
  const { review, postReview, getReviews } = useReviewStore();

  // Debug cart state
  useEffect(() => {
    console.log("Cart state changed:", {
      cartItems: cart?.cartItems,
      productId,
      isAdded,
      cartLoading,
      totalItems: cart?.cartItems?.length || 0
    });
  }, [cart, productId, isAdded, cartLoading]);

  const loadProductData = useCallback(async () => {
    if (!productId) {
      setFetchError("No product ID provided");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setFetchError(null);
      setUsingFallbackProduct(false);
      
      const id = parseInt(productId as string);
      if (isNaN(id)) {
        throw new Error("Invalid Product ID");
      }

      const product = await fetchSingleProduct(id);
      
      // If product is found, fetch the seller info separately
      if (product) {
        const sellerId = product.seller_id || product.sellerId;
        if (sellerId) {
          console.log("Fetching seller info for product:", sellerId);
          await fetchProductSeller(sellerId);
        } else {
          console.log("Product has no seller ID");
        }
      }
      
      // Fallback: If single fetch fails, look into the global products list
      if (!product) {
        const globalProducts = useProductStore.getState().products;
        let found = globalProducts.find(p => p.id === id);

        if (!found) {
          await fetchAllProducts();
          found = useProductStore.getState().products.find(p => p.id === id);
        }

        if (found) {
          useProductStore.setState({ singleProduct: found });
          setUsingFallbackProduct(true);
          
          // Fetch seller for fallback product
          const sellerId = found.seller_id || found.sellerId;
          if (sellerId) {
            await fetchProductSeller(sellerId);
          }
        } else {
          throw new Error("Product not found in our database");
        }
      }

      // Load reviews separately
      try {
        await getReviews(id);
      } catch (reviewErr) {
        console.warn("Failed to fetch reviews:", reviewErr);
      }
      
      console.log("Product loaded successfully");
      
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to load product";
      setFetchError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [productId, fetchSingleProduct, fetchAllProducts, getReviews, fetchProductSeller]);

  useEffect(() => {
    console.log("Product ID changed or component mounted:", productId);
    
    if (productId) {
      loadProductData();
      fetchCart();
    } else {
      setFetchError("No product ID provided");
      setIsLoading(false);
    }
    
    return () => {
      console.log("Cleaning up product page");
      useProductStore.getState().clearProductSeller();
    };
  }, [productId, loadProductData, fetchCart]);

  useEffect(() => {
    if (singleProduct && products && products.length > 0) {
      console.log("Finding recommended products...");
      const currentProductName = singleProduct.name?.toLowerCase();
      const currentCategory = singleProduct.category?.toLowerCase();
      
      const commonWords = ['the', 'and', 'with', 'for', 'from', 'of', 'in', 'to', 'a', 'an'];
      const keywords = currentProductName
        ?.split(' ')
        .filter(word => word.length > 2 && !commonWords.includes(word)) || [];
      
      const similarProducts = products.filter(product => {
        if (product.id === Number(productId)) return false;
        
        const productName = product.name?.toLowerCase() || '';
        const productCategory = product.category?.toLowerCase();
        
        const hasKeywordMatch = keywords.some(keyword => 
          productName.includes(keyword.toLowerCase())
        );
        
        const isSameCategory = productCategory === currentCategory;
        
        const nameSimilarity = currentProductName?.split(' ').some(word => 
          productName.includes(word) && word.length > 3
        ) || false;
        
        return hasKeywordMatch || isSameCategory || nameSimilarity;
      });
      
      const sortedProducts = similarProducts.sort((a, b) => {
        const aCategoryMatch = a.category?.toLowerCase() === currentCategory;
        const bCategoryMatch = b.category?.toLowerCase() === currentCategory;
        
        if (aCategoryMatch && !bCategoryMatch) return -1;
        if (!aCategoryMatch && bCategoryMatch) return 1;
        
        return (b.sales || 0) - (a.sales || 0);
      });
      
    }
  }, [singleProduct, products, productId]);

  useEffect(() => {
    if (cart?.cartItems && productId) {
      const id = parseInt(productId as string);
      if (!isNaN(id)) {
        const exists = cart.cartItems.some(item => item.productId === id);
        console.log("Checking if product exists in cart:", { 
          exists, 
          productId: id,
          cartItems: cart.cartItems.map(item => item.productId)
        });
        setIsAdded(exists);
      }
    }
  }, [cart, productId]);

  useEffect(() => {
    if (error) {
      console.error("Store error detected:", error);
      setFetchError(error);
    }
  }, [error]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setFetchError("Loading timeout. The product might not exist or there's a network issue.");
        setIsLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  const handleAddToCart = async () => {
    console.log("Current state:", { isAdded, isAddingToCart, quantity, productId });
    
    if (isAdded || isAddingToCart) {
      return;
    }
    
    try {
      if (!productId) {
        alert("Product ID is missing");
        return;
      }

      const id = parseInt(productId as string);
      if (isNaN(id)) {
        alert("Invalid product ID");
        return;
      }

      // Check stock availability
      if ((singleProduct?.stock || 0) <= 0) {
        alert("Product is out of stock");
        return;
      }

      if (quantity <= 0) {
        alert("Please select a valid quantity");
        return;
      }

      // Prevent multiple clicks
      setIsAddingToCart(true);
      
      // Show immediate feedback
      setIsAdded(true);
      
      // Get product image for session cart
      let productImage = null;
      if (singleProduct?.images && singleProduct.images.length > 0) {
        const firstImage = singleProduct.images[0];
        productImage = getImageUrl(firstImage);
        console.log("Product image found:", productImage?.substring(0, 50) + "...");
      } else {
        console.log("No product images found");
      }
      
      await addToCart(
        id, 
        quantity, 
        {
          name: singleProduct?.name,
          price: discountPrice > 0 ? discountPrice : originalPrice,
          images: singleProduct?.images,
          productImg: productImage
        }
      );
      
      await fetchCart();

      // Keep the "Added" state for 2 seconds, then reset
      setTimeout(() => {
        setIsAdded(false);
        setIsAddingToCart(false);
        console.log("Reset added state");
      }, 2000);
      
    } catch (err: any) {
      setIsAdded(false);
      setIsAddingToCart(false);
      
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        alert("You need to be logged in to add items to cart. Please login or continue as guest (your items will be saved in browser session).");
      } else {
        let errorMsg = "Failed to add to cart. Please try again.";
        
        if (err?.response?.data?.message) {
          errorMsg = err.response.data.message;
        } else if (err?.message) {
          errorMsg = err.message;
        }
        
        alert(errorMsg);
      }
    } finally {
      console.log("=== handleAddToCart END ===");
    }
  };

  // Auth debug effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("token");
      console.log("Has token:", !!token);
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log("Token info:", {
            role: payload.role,
            userId: payload.id,
            expires: new Date(payload.exp * 1000).toLocaleString()
          });
        } catch (e) {
          console.log("Token decode error:", e);
        }
      }
    }
  }, []);

  const handleReviewSubmit = async () => {
    if (!reviewText.trim() || rating === 0) {
      alert("Please add both a rating and a review message");
      return;
    }

    try {
      if (!productId) {
        alert("Product ID is missing");
        return;
      }
      const id = parseInt(productId as string);
      if (isNaN(id)) {
        alert("Invalid product ID");
        return;
      }
      
      await postReview(id, reviewText, rating);
      setReviewText("");
      setRating(0);
      setIsModalOpen(false);
      await getReviews(id);
    } catch (err: any) {
      console.error("Error posting review:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to submit review. Please try again.";
      alert(errorMsg);
    }
  };

  const goToSellerPage = () => {
    if (productSeller?.seller_id) {
      router.push(`/shop/${productSeller.seller_id}`);
    }
  };

  const handleGetDirections = () => {
    if (!productSeller?.businessAddress) {
      alert("Store address not available");
      return;
    }

    setIsGettingDirections(true);
    
    const encodedAddress = encodeURIComponent(productSeller.businessAddress);
    
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      window.location.href = `https://maps.google.com/?q=${encodedAddress}`;
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
    
    setTimeout(() => {
      setIsGettingDirections(false);
    }, 2000);
  };

  // Get product images
  const productImages = singleProduct?.images || [];
  const hasMultipleImages = productImages.length > 1;

  // Get store image from productSeller
  const storeImage = productSeller?.storeImg || null;

  // Calculate ratings
  const calculateRatingsStats = () => {
    if (!review || review.length === 0) {
      return {
        average: "0.0",
        total: 0,
        totalReviews: 0,
        distribution: [
          { stars: 5, count: 0 },
          { stars: 4, count: 0 },
          { stars: 3, count: 0 },
          { stars: 2, count: 0 },
          { stars: 1, count: 0 },
        ],
      };
    }

    const totalReviews = review.length;
    const totalRating = review.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = (totalRating / totalReviews).toFixed(1);

    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      stars: star,
      count: review.filter((r) => Math.round(r.rating || 0) === star).length,
    }));

    return {
      average: averageRating,
      total: totalRating,
      totalReviews,
      distribution,
    };
  };

  const ratingsStats = calculateRatingsStats();

  // Get visible reviews
  const visibleReviews = showAllReviews
    ? review
    : (review || []).slice(0, 3);

  const toggleShowAllReviews = () => {
    setShowAllReviews(!showAllReviews);
  };

  // Calculate price savings
  const originalPrice = parseFloat(singleProduct?.price || "0");
  const discountPrice = parseFloat(singleProduct?.discountPrice || "0");
  const savings = originalPrice - discountPrice;
  
  // Format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch (error) {
      return "N/A";
    }
  };

  // Parse ingredients
  const ingredientsArray = singleProduct?.ingredients 
    ? singleProduct.ingredients.split(',').map(item => item.trim())
    : [];

  // Loading state
  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Loading product details...</p>
    </div>
  );

  // Error state
  if (fetchError) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Product</h2>
        <p className="text-gray-500 mb-4">{fetchError}</p>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Product ID: {productId}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => {
                setIsLoading(true);
                setFetchError(null);
                loadProductData();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link 
              href="/products" 
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Browse Products
            </Link>
            <Link 
              href="/" 
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  // Product not found state
  if (!singleProduct) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-md">
        <h2 className="text-xl font-bold text-yellow-600 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-4">The product you're looking for doesn't exist or has been removed.</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link 
            href="/products" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Products
          </Link>
          <Link 
            href="/" 
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar2 />

      {/* Breadcrumb */}
      <div className="ml-2 mt-[-5vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link href="/" className="flex items-center hover:text-blue-600">
            <Home size={16} />
            <span className="ml-1">Home</span>
          </Link>
          <ChevronRight size={16} className="mx-2" />
          <span className="capitalize hover:text-blue-600 cursor-pointer">
            {singleProduct?.category || "Products"}
          </span>
          <ChevronRight size={16} className="mx-2" />
          <span className="text-gray-900 font-medium truncate">
            {singleProduct?.name || "Product"}
          </span>
        </div>
      </div>

      {/* Product Container */}
      <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-black">
        {/* Success Load Debug */}
        {usingFallbackProduct && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
            ⚠️ Showing product from cache. Some details might not be up to date.
          </div>
        )}
        
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Images Section */}
            <div className="space-y-4">
              {/* Main Product Image */}
              <div className="relative aspect-[5/3] rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 overflow-hidden group">
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg ${
                    (singleProduct?.stock || 0) > 0 
                      ? "bg-gradient-to-r from-emerald-500 to-green-500"
                      : "bg-gradient-to-r from-red-500 to-orange-500"
                  }`}>
                    {(singleProduct?.stock || 0) > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
                
                {productImages.length > 0 ? (
                  <img
                    src={getImageUrl(productImages[selectedImage])}
                    alt={singleProduct?.name || "Product image"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.src = "/placeholder-image.jpg";
                    }}
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-300/20 to-orange-300/20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full blur-3xl opacity-30"></div>
                    </div>
                    <div className="relative h-full flex items-center justify-center">
                      <div className="text-6xl">🛒</div>
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {hasMultipleImages && (
                <div className="grid grid-cols-4 gap-3">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:shadow-md ${
                        selectedImage === index
                          ? "border-amber-400 shadow-md"
                          : "border-amber-200 hover:border-amber-300"
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${singleProduct?.name} - View ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.src = "/placeholder-image.jpg";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right side - Product Info */}
            <div className="flex flex-col ml-5">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full">
                  <Clock size={14} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Shelf Time: {singleProduct?.shelfTime || 0}h
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full">
                  <Truck size={14} className="text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    Delivery in 20min
                  </span>
                </div>
              </div>

              <h1 className={`${lora.className} text-3xl font-bold text-gray-900 mb-3`}>
                {singleProduct?.name || "Product Name"}
              </h1>

              {/* Store info */}
              <div
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors mb-6"
                onClick={goToSellerPage}
              >
                {storeImage ? (
                  <img
                    src={storeImage}
                    alt={productSeller?.businessName || "Store"}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.src = "/placeholder-image.jpg";
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <Store size={20} className="text-blue-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">
                    {productSeller?.businessName || "Store Name"}
                  </h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Verified Seller
                  </p>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-6">
                {singleProduct?.description || "Product description not available"}
              </p>

              {/* Additional Product Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Stock */}
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Package size={18} className="text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Available Stock</p>
                    <p className="font-semibold text-gray-900">{singleProduct?.stock || 0} units</p>
                  </div>
                </div>

                {/* Sales */}
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <ShoppingBag size={18} className="text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Sold</p>
                    <p className="font-semibold text-gray-900">{singleProduct?.sales || 0} units</p>
                  </div>
                </div>

                {/* Manufacture Date */}
                {singleProduct?.manufactureDate && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                    <Calendar size={18} className="text-amber-600" />
                    <div>
                      <p className="text-sm text-gray-500">Manufactured</p>
                      <p className="font-semibold text-gray-900">{formatDate(singleProduct.manufactureDate)}</p>
                    </div>
                  </div>
                )}

                {/* Expiry Date */}
                {singleProduct?.expiryDate && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <Calendar size={18} className="text-red-600" />
                    <div>
                      <p className="text-sm text-gray-500">Expires</p>
                      <p className="font-semibold text-gray-900">{formatDate(singleProduct.expiryDate)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* NEW: Store Location Section */}
              {productSeller?.businessAddress && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Store Location</h3>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <div className="space-y-3">
                      {/* Store Name & Address */}
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                            <Store size={18} className="text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {productSeller.businessName || "Store"}
                          </h4>
                          <p className="text-gray-600 text-sm mt-1">
                            {productSeller.businessAddress}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ingredients */}
              {ingredientsArray.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <ChefHat size={18} className="text-gray-600" />
                    Ingredients
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {ingredientsArray.map((ingredient, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                      >
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    type="button"
                    aria-label="Decrease quantity"
                    title="Decrease quantity"
                    disabled={quantity <= 1}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all active:scale-95 ${
                      quantity <= 1
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <Minus size={18} />
                  </button>
                  <div className="w-16 h-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 font-semibold text-gray-900">
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    type="button"
                    aria-label="Increase quantity"
                    title="Increase quantity"
                    disabled={(singleProduct?.stock || 0) <= quantity}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all active:scale-95 ${
                      (singleProduct?.stock || 0) <= quantity
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {(singleProduct?.stock || 0) > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Max available: {singleProduct?.stock || 0} units
                  </p>
                )}
              </div>

              {/* Price and Add to Cart */}
              <div className="mt-auto pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">
                        Rs.{discountPrice > 0 ? discountPrice.toFixed(2) : originalPrice.toFixed(2)}
                      </span>
                      {savings > 0 && (
                        <>
                          <span className="text-lg text-gray-400 line-through">
                            Rs.{originalPrice.toFixed(2)}
                          </span>
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">
                            Save Rs.{savings.toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={(singleProduct?.stock || 0) <= 0 || isAdded || isAddingToCart}
                    className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                      isAdded || isAddingToCart
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : (singleProduct?.stock || 0) <= 0
                        ? "bg-gray-300 text-gray-500"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/25"
                    }`}
                  >
                    {isAddingToCart ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : isAdded ? (
                      <>
                        <Check size={20} />
                        Added to Cart
                      </>
                    ) : (singleProduct?.stock || 0) <= 0 ? (
                      "Out of Stock"
                    ) : (
                      <>
                        <ShoppingBag size={20} />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 lg:p-8">
            <h2 className={`${lora.className} text-3xl font-bold text-gray-900 mb-8`}>
              Ratings & Reviews
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Rating Summary Card */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-baseline justify-center mb-2">
                      <span className="text-5xl font-bold text-gray-900">
                        {ratingsStats.average}
                      </span>
                      <span className="text-gray-500 ml-1">/5</span>
                    </div>
                    <div className="flex justify-center mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={20}
                          className={`mx-0.5 ${
                            star <= Math.round(Number(ratingsStats.average))
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600">
                      {ratingsStats.totalReviews} Ratings & Reviews
                    </p>
                  </div>

                  {/* Rating Distribution */}
                  <div className="space-y-4">
                    {ratingsStats.distribution.map((item) => (
                      <div key={item.stars} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-10">
                          <span className="text-gray-700 font-medium">
                            {item.stars}
                          </span>
                          <Star
                            size={14}
                            className="text-yellow-500 fill-yellow-500"
                          />
                        </div>
                        <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                            style={{
                              width:
                                ratingsStats.totalReviews > 0
                                  ? `${
                                      (item.count / ratingsStats.totalReviews) *
                                      100
                                    }%`
                                  : "0%",
                            }}
                          ></div>
                        </div>
                        <span className="w-12 text-right text-sm text-gray-600">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Review Button */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all font-semibold"
                >
                  Write a Review
                </button>
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {review && review.length > 0 ? (
                    <>
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4">
                        {visibleReviews.map((r: any) => (
                          <div
                            key={r.reviewId || r.id}
                            className="p-5 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                  <User size={20} className="text-blue-600" />
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      {r.customer?.name || "Anonymous User"}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1">
                                      <div className="flex">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            size={14}
                                            className={`${
                                              star <= (r.rating || 0)
                                                ? "text-yellow-500 fill-yellow-500"
                                                : "text-gray-300"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm text-gray-500">
                                        {r.createdAt
                                          ? new Date(
                                              r.createdAt
                                            ).toLocaleDateString("en-US", {
                                              month: "long",
                                              day: "numeric",
                                              year: "numeric",
                                            })
                                          : "Recently"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <p className="text-gray-700 mt-3 leading-relaxed">
                                  {r.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {review.length > 3 && (
                        <div className="pt-4 border-t border-gray-200">
                          <button
                            onClick={toggleShowAllReviews}
                            className="flex items-center justify-center gap-2 mx-auto px-5 py-2.5 text-blue-600 hover:text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
                          >
                            {showAllReviews ? (
                              <>
                                Show Less
                                <ChevronUp size={16} />
                              </>
                            ) : (
                              <>
                                Show All {review.length} Reviews
                                <ChevronDown size={16} />
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <Star size={24} className="text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No reviews yet
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Be the first to share your experience!
                      </p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Star size={16} />
                        Write First Review
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal for adding review */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Write a Review
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setReviewText("");
                  setRating(0);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label="Rating"
                      title="Rating"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={32}
                        className={`${
                          star <= (hoverRating || rating)
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        } transition-colors duration-200`}
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-lg font-semibold text-gray-700">
                    {rating > 0 ? `${rating}.0` : "Select"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Review
                </label>
                <textarea
                  className="w-full h-40 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
                  placeholder="Share your honest thoughts about this product..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setReviewText("");
                    setRating(0);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                    !reviewText.trim() || rating === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/25"
                  }`}
                  onClick={handleReviewSubmit}
                  disabled={!reviewText.trim() || rating === 0}
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}