"use client";

import ProductCard from "@/app/components/Product";
import { useCusAuthStore } from "../../ZustandStore/authStore";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProductStore } from "@/app/ZustandStore/productStore";
import { useCartState } from "@/app/ZustandStore/cartStore";
import Link from "next/link";
import { useFollowStore } from "@/app/ZustandStore/followStore";
import { useChatStore } from "@/app/ZustandStore/chatStore";
import {
  Store,
  MessageCircle,
  Users,
  UserPlus,
  Star,
  Package,
  ShoppingBag,
  Clock,
  TrendingUp,
  Shield,
  CheckCircle,
  Heart,
  Gift,
  Eye,
  ShoppingCart,
  Tag,
  Box,
  Sparkles,
} from "lucide-react";
import { getImageUrl } from "../../utils/imageHelper";

export default function ShopPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [localFollowers, setLocalFollowers] = useState(0);
  const [activeTab, setActiveTab] = useState("products"); // "products" or "mystery"
  const [addingToCart, setAddingToCart] = useState<number | null>(null); // Track which box is being added
  
  // Get mystery boxes from store instead of local state
  const { 
    products, 
    fetchProducts, 
    mysteryBoxes, 
    mysteryBoxLoading, 
    fetchMysteryBoxesBySeller,
    clearMysteryBoxes 
  } = useProductStore();
  
  const { customer, seller, fetchSellerDetails } = useCusAuthStore();
  const { followShops, unfollowShop, checkIfFollowed, fetchFollowedShops } = useFollowStore();
  const { createRoom, setActiveRoom } = useChatStore();
  const { addToCart, fetchCart, cart } = useCartState();

  const router = useRouter();
  const { id } = useParams();
  const sellerId = Number(id);
  const isFollowed = checkIfFollowed(sellerId);

  const showToast = (message: string, type: "success" | "error") => {
    // Dispatch a custom event that the Toast component listens for
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { message, type }
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchSellerDetails(sellerId),
          fetchProducts(sellerId),
          fetchFollowedShops(),
        ]);
        
        if (seller?.followers) {
          setLocalFollowers(seller.followers);
        }
      } catch (error) {
        console.error("Error loading shop data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (sellerId && !isNaN(sellerId)) {
      loadData();
    }
  }, [sellerId]);

  // Load mystery boxes when tab changes or component mounts
  useEffect(() => {
    const loadMysteryBoxes = async () => {
      if (!sellerId || isNaN(sellerId)) return;
      
      try {
        await fetchMysteryBoxesBySeller(sellerId, {
          status: 'ACTIVE'
        });
      } catch (error) {
        console.error("Error loading mystery boxes:", error);
      }
    };

    // Load mystery boxes immediately
    loadMysteryBoxes();
    
    // Cleanup: Clear mystery boxes when component unmounts
    return () => {
      clearMysteryBoxes();
    };
  }, [sellerId]);

  useEffect(() => {
    if (seller?.followers !== undefined) {
      setLocalFollowers(seller.followers);
    }
  }, [seller?.followers]);

  const handleFollowToggle = async () => {
    if (followLoading) return;
    
    setFollowLoading(true);
    try {
      if (isFollowed) {
        await unfollowShop(sellerId);
        setLocalFollowers(prev => Math.max(0, prev - 1));
      } else {
        await followShops(sellerId);
        setLocalFollowers(prev => prev + 1);
      }
      
      setTimeout(() => {
        fetchSellerDetails(sellerId);
      }, 500);
      
    } catch (error) {
      console.error("Error toggling follow:", error);
      alert("Failed to update follow status. Please try again.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleGetInTouch = async () => {
    if (!sellerId || isNaN(sellerId)) {
      console.log("❌ No seller ID");
      return;
    }

    try {
      const roomId = await createRoom(sellerId);

      if (roomId && roomId > 0) {
        localStorage.setItem("lastCreatedRoomId", roomId.toString());
        setActiveRoom(roomId);
        router.replace("/customerdashboard/message");
      } else {
        alert("Failed to start chat. Please try again.");
      }
    } catch (error) {
      console.error("Error in handleGetInTouch:", error);
      alert("Failed to start chat. Please try again.");
    }
  };

  // Check if a mystery box is already in cart
  const isMysteryBoxInCart = (box: any) => {
    if (!cart?.cartItems) return false;
    
    // Since all mystery boxes use productId 999999, we need to check by mysteryBoxId
    // or by name/description in the product info
    return cart.cartItems.some(item => 
      item.productId === 999999 && 
      item.product?.name?.includes(box.name.substring(0, 20)) // Check partial name match
    );
  };

  // Handle Mystery Box Add to Cart
  const handleAddMysteryBoxToCart = async (box: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (addingToCart === box.id) return; // Prevent double click
    
    try {
      setAddingToCart(box.id);
      
      console.log("Adding mystery box to cart:", box);
      
      // Prepare product info for cart
      const productInfo = {
        name: box.name,
        price: box.discountPrice || box.price,
        discountPrice: box.discountPrice || box.price,
        description: box.description,
        images: [],
        productImg: "/images/mystery-box.jpg",
        image: "/images/mystery-box.jpg",
        isMysteryBox: true,
        mysteryBoxId: box.id, // Store original ID for reference
        sellerId: box.sellerId,
        totalValue: box.totalValue,
        totalItems: box.totalItems,
        discountPercentage: box.discountPercentage
      };
      
      // For mystery boxes, we use a special product ID or null
      // The cart store will handle null productId specially for mystery boxes
      await addToCart(
        999999, // Special ID for all mystery boxes
        1, // Quantity
        productInfo
      );
      
      // Refresh cart to show updated state
      await fetchCart();
      
      // Show success message
      showToast("Mystery box added to cart!", "success");
      
    } catch (error: any) {
      console.error("Error adding mystery box to cart:", error);
      showToast("Mystery box cannot added","error")
    } finally {
      setAddingToCart(null);
    }
  };

  const totalProducts = products?.length || 0;
  const totalFollowers = localFollowers || 0;
  const totalFollowing = 0;
  const shopRating = seller?.rating || 4.7;
  const totalMysteryBoxes = mysteryBoxes.length;

  // Helper function to get product image
  const getProductImage = (product: any) => {
    if (product.images && product.images.length > 0) {
      return getImageUrl(product.images[0]);
    } else if (product.image) {
      return product.image;
    } else if (product.imageBase64) {
      return product.imageBase64;
    }
    return "/placeholder-image.jpg";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Cover Image Section */}
      <div className="relative">
        <div className="w-full h-72 md:h-90 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
          {seller?.coverImg ? (
            <img
              src={seller.coverImg}
              alt={`${seller.businessName} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
          )}
        </div>

        {/* Store image overlapping main content */}
        <div className="absolute left-8 bottom-0 transform translate-y-1/2 z-20">
          <div className="relative w-80 h-80 md:w-50 md:h-50 rounded-4xl bg-black p-2 shadow-xl">
            {seller?.storeImg ? (
              <img
                src={seller.storeImg}
                alt={seller.businessName}
                className="w-full h-full rounded-xl object-cover border-4 border-white"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                <Store size={48} className="text-blue-600" />
              </div>
            )}

            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full">
              <CheckCircle size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Shop Header Section */}
        <div className="ml-44 md:ml-48 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {seller?.businessName || "Shop Name"}
                </h1>
                <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-blue-700">
                    {shopRating.toFixed(1)}
                  </span>
                </div>
              </div>

              <p className="text-gray-700 mb-4 max-w-2xl">
                {seller?.storeDescription ||
                  "Premium quality products with excellent customer service"}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Package size={16} />
                  <span>{totalProducts} Products</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift size={16} />
                  <span>{totalMysteryBoxes} Mystery Boxes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={16} />
                  <span>Verified Seller</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>Usually responds within 1 hour</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isFollowed
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg hover:shadow-emerald-500/25"
                    : "bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {followLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : isFollowed ? (
                  <>
                    <Heart size={18} className="fill-white" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Follow Shop
                  </>
                )}
              </button>

              <button
                onClick={handleGetInTouch}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all transform hover:scale-105 active:scale-95"
              >
                <MessageCircle size={18} />
                Get in Touch
              </button>
            </div>
          </div>

          {/* Shop Stats */}
          <div className="flex flex-wrap gap-8 mt-8 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users size={24} className="text-blue-600" />
                <span className="text-3xl font-bold text-gray-900">
                  {totalFollowers}
                </span>
                {followLoading && (
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <p className="text-gray-600 text-sm">Followers</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Package size={24} className="text-purple-600" />
                <span className="text-3xl font-bold text-gray-900">
                  {totalProducts}
                </span>
              </div>
              <p className="text-gray-600 text-sm">Products</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift size={24} className="text-amber-600" />
                <span className="text-3xl font-bold text-gray-900">
                  {totalMysteryBoxes}
                </span>
              </div>
              <p className="text-gray-600 text-sm">Mystery Boxes</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp size={24} className="text-emerald-600" />
                <span className="text-3xl font-bold text-gray-900">98%</span>
              </div>
              <p className="text-gray-600 text-sm">Positive Reviews</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex space-x-8">
            <button 
              onClick={() => setActiveTab("products")}
              className={`relative py-4 px-1 font-medium transition-colors ${
                activeTab === "products" 
                  ? "text-gray-900" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center gap-2">
                <Package size={18} />
                Products ({totalProducts})
              </span>
              {activeTab === "products" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button 
              onClick={() => setActiveTab("mystery")}
              className={`relative py-4 px-1 font-medium transition-colors ${
                activeTab === "mystery" 
                  ? "text-gray-900" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center gap-2">
                <Gift size={18} />
                Mystery Box ({totalMysteryBoxes})
              </span>
              {activeTab === "mystery" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></div>
              )}
            </button>
            <button 
              onClick={() => setActiveTab("reviews")}
              className={`py-4 px-1 font-medium transition-colors ${
                activeTab === "reviews" 
                  ? "text-gray-900" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center gap-2">
                <Star size={18} />
                Reviews
              </span>
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {activeTab === "products" && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Shop Products ({totalProducts})
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Sorted by:</span>
                <select aria-label="Sort products" className="bg-transparent font-medium focus:outline-none">
                  <option>Most Popular</option>
                  <option>Newest First</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>
            </div>

            {products && products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product: any) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="group"
                  >
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 group-hover:-translate-y-1">
                      {/* Product Image */}
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.src = "/placeholder-image.jpg";
                          }}
                        />

                        {/* Stock badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`px-2.5 py-1 text-white text-xs font-semibold rounded-full ${
                            (product.stock || 0) > 0 
                              ? "bg-emerald-500" 
                              : "bg-red-500"
                          }`}>
                            {product.stock || 50} in stock
                          </span>
                        </div>

                        {/* Discount badge */}
                        {product.discountPrice && product.price && product.price > product.discountPrice && (
                          <div className="absolute top-3 right-3">
                            <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                              -
                              {Math.round(
                                (1 - product.discountPrice / product.price) * 100
                              )}
                              %
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="flex text-yellow-400">
                              {"★".repeat(5)}
                            </div>
                            <span className="text-xs text-gray-500 ml-1">
                              ({product.sales || 0})
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={12} />
                            {product.shelfTime || "5h"}
                          </span>
                        </div>

                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">
                          {product.name || "Product Name"}
                        </h3>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {product.description ||
                            "Product description not available"}
                        </p>

                        {/* Price Section */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              Rs.{product.discountPrice || product.price || 0}
                            </span>
                            {product.discountPrice &&
                              product.price > product.discountPrice && (
                                <span className="text-sm text-gray-400 line-through">
                                  Rs.{product.price}
                                </span>
                              )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              router.push(`/product/${product.id}`);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:shadow-md transition-all"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Products Available
                </h3>
                <p className="text-gray-500">
                  This shop hasn't added any products yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mystery Boxes Grid */}
        {activeTab === "mystery" && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Mystery Boxes ({totalMysteryBoxes})
                </h2>
                <p className="text-gray-600 mt-1">
                  Surprise packages with amazing value! Each box contains a curated selection of products from this store.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-600">Limited Time Offers</span>
              </div>
            </div>

            {mysteryBoxLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading mystery boxes...</p>
              </div>
            ) : mysteryBoxes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mysteryBoxes.map((box: any) => {
                  const isInCart = isMysteryBoxInCart(box);
                  const isAdding = addingToCart === box.id;
                  
                  return (
                    <div
                      key={box.id}
                      className="group"
                    >
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 overflow-hidden hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 group-hover:-translate-y-1">
                        {/* Mystery Box Header */}
                        <div className="relative p-6 bg-gradient-to-r from-purple-600 to-pink-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Gift size={24} className="text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-white text-lg">
                                  {box.name}
                                </h3>
                                <p className="text-purple-100 text-sm">
                                  {box.totalItems || box.products?.length || 0} surprise items
                                </p>
                              </div>
                            </div>
                            
                            {/* Discount Badge */}
                            {box.discountPercentage > 0 && (
                              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                {box.discountPercentage}% OFF
                              </div>
                            )}
                          </div>
                          
                          {/* Mystery Box Tag */}
                          <div className="absolute -bottom-3 left-6">
                            <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
                              MYSTERY BOX
                            </span>
                          </div>
                        </div>

                        {/* Box Content */}
                        <div className="p-6">
                          {/* Value Information */}
                          <div className="mb-4">
                            
                            
                            {/* Savings */}
                            {box.discountPrice && (
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-gray-600 text-sm">You Pay</span>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-bold text-gray-900">
                                    Rs.{box.discountPrice || box.price}
                                  </span>
                                  {box.price > box.discountPrice && (
                                    <span className="text-sm text-gray-400 line-through">
                                      Rs.{box.price}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Savings Amount */}
                            
                          </div>

                          {/* Box Description */}
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {box.description || "A curated selection of premium products at an unbeatable price!"}
                          </p>

                          {/* Items Preview */}
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Box size={16} className="text-purple-600" />
                              <span className="text-sm font-medium text-gray-700">Contains:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {box.products && box.products.slice(0, 3).map((product: any, index: number) => (
                                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-gray-200">
                                  <Package size={12} className="text-gray-500" />
                                  <span className="text-xs text-gray-700">
                                    {product.productName || `Item ${index + 1}`}
                                  </span>
                                  {product.quantity > 1 && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      ×{product.quantity}
                                    </span>
                                  )}
                                </div>
                              ))}
                              {box.products && box.products.length > 3 && (
                                <div className="px-2 py-1 bg-gray-100 rounded-lg">
                                  <span className="text-xs text-gray-500">
                                    +{box.products.length - 3} more
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Stock and Sales Info */}
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-2">
                              <ShoppingBag size={14} />
                              <span>{box.stock || 0} available</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye size={14} />
                              <span>{box.sales || 0} sold</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={(e) => handleAddMysteryBoxToCart(box, e)}
                              disabled={isAdding || isInCart || (box.stock || 0) <= 0}
                              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all transform hover:scale-[1.02] ${
                                isInCart
                                  ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                                  : isAdding
                                  ? "bg-gradient-to-r from-purple-400 to-pink-400 text-white cursor-wait"
                                  : (box.stock || 0) <= 0
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/25"
                              }`}
                            >
                              {isAdding ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Adding...
                                </>
                              ) : isInCart ? (
                                <>
                                  <CheckCircle size={18} />
                                  Added to Cart
                                </>
                              ) : (box.stock || 0) <= 0 ? (
                                "Out of Stock"
                              ) : (
                                <>
                                  <ShoppingCart size={18} />
                                  Add to Cart
                                </>
                              )}
                            </button>
                            
                            
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <Gift size={48} className="text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Mystery Boxes Yet
                </h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  This shop hasn't created any mystery boxes yet. Check back later for surprise packages!
                </p>
                <button
                  onClick={() => setActiveTab("products")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-medium"
                >
                  <Package size={16} />
                  Browse Products Instead
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}