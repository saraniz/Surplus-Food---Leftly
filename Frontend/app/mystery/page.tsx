"use client"
import React, { useState, useEffect } from 'react';
import { useProductStore } from '../ZustandStore/productStore';
import { useCartState } from '../ZustandStore/cartStore';
import Navbar2 from '../components/Navbar2';
import Toast from '../components/toast';
import { useRouter } from 'next/navigation'; // Import router for Buy Now

interface MysteryBox {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  category: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT' | 'DRAFT';
  stock: number;
  sales: number;
  totalValue: number;
  sellerId: number;
  createdAt: string;
  updatedAt: string;
  seller?: {
    seller_id: number;
    businessName: string;
    storeImg?: string;
    storeImgBase64?: string;
    businessAddress?: string;
    category?: string;
  };
}

// Mystery Box Image URL
const MYSTERY_BOX_IMAGE = 'https://cdn.vectorstock.com/i/500p/04/67/mystery-prize-box-lucky-surprise-gift-vector-45060467.jpg';

// Toast notification helper function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('showToast', {
        detail: { message, type }
      })
    );
  }
};

// Get the correct product ID for mystery boxes
const getMysteryBoxProductId = (boxId: number) => {
return boxId;
};

// Mystery Box Card Component
const MysteryBoxCard = ({ box, onViewDetails }: { box: MysteryBox; onViewDetails: (box: MysteryBox) => void }) => {
  const { addToCart } = useCartState();
  const router = useRouter();
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  
  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      
      const productId = getMysteryBoxProductId(box.id);
      
      // ✅ Both registered and unregistered users can add to cart
      await addToCart(
        productId,
        1,
        {
          name: box.name,
          price: box.price,
          discountPrice: box.discountPrice || box.price,
          description: box.description,
          images: [{ imageUrl: MYSTERY_BOX_IMAGE }],
          productImg: MYSTERY_BOX_IMAGE,
          image: MYSTERY_BOX_IMAGE,
          isMysteryBox: true,
          category: box.category,
          stock: box.stock,
          status: box.status,
          mysteryBoxId: box.id,
          totalValue: box.totalValue,
          sellerName: box.seller?.businessName,
          sellerCategory: box.seller?.category
        }
      );
      
      showToast(`Added "${box.name}" to cart!`, 'success');
    } catch (error) {
      console.error("Error adding mystery box to cart:", error);
      showToast('Failed to add to cart. Please try again.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      setBuyingNow(true);
      
      const productId = getMysteryBoxProductId(box.id);
      
      // Add to cart first (works for both registered and unregistered)
      await addToCart(
        productId,
        1,
        {
          name: box.name,
          price: box.price,
          discountPrice: box.discountPrice || box.price,
          description: box.description,
          images: [{ imageUrl: MYSTERY_BOX_IMAGE }],
          productImg: MYSTERY_BOX_IMAGE,
          image: MYSTERY_BOX_IMAGE,
          isMysteryBox: true,
          category: box.category,
          stock: box.stock,
          status: box.status,
          mysteryBoxId: box.id,
          totalValue: box.totalValue,
          sellerName: box.seller?.businessName,
          sellerCategory: box.seller?.category,
          isBuyNow: true // Flag for immediate checkout
        }
      );
      
      // Navigate to checkout page
      router.push('/checkout');
      
    } catch (error) {
      console.error("Error buying mystery box:", error);
      showToast('Failed to proceed to checkout. Please try again.', 'error');
    } finally {
      setBuyingNow(false);
    }
  };

  return (
    <div className="text-black bg-white rounded-xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Mystery Box Header with Ribbon */}
      <div className="relative">
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            MYSTERY BOX
          </span>
        </div>
        
        {/* Mystery Box Image */}
        <div className="h-32 bg-gradient-to-br from-purple-100 to-blue-50 flex items-center justify-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,50 Q25,25 50,50 T100,50 L100,0 L0,0 Z" fill="#7c3aed" opacity="0.2" />
              <path d="M0,100 Q25,75 50,100 T100,100 L100,0 L0,0 Z" fill="#3b82f6" opacity="0.2" />
            </svg>
          </div>
          
          {/* Mystery Box Image */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <img 
              src={MYSTERY_BOX_IMAGE} 
              alt="Mystery Box"
              className="w-full h-full object-cover"
            />
            {/* Overlay for better text visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent"></div>
          </div>
          
          {/* Surprise Text */}
          <div className="absolute bottom-2 right-2 z-20">
            <span className="text-xs font-bold text-white bg-purple-600/80 backdrop-blur-sm px-2 py-1 rounded-full">
              SURPRISE INSIDE!
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Box Info */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">{box.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-2">{box.description}</p>
          
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {box.category}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              box.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {box.status === 'ACTIVE' ? 'In Stock' : box.status}
            </span>
          </div>
        </div>

        {/* Value Badge */}
        <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-purple-600 font-medium">Total Value</div>
              {/* <div className="text-base font-bold text-gray-800">Rs {box.totalValue}.00</div> */}
            </div>
            <div className="text-right">
              {/* <div className="text-xs text-blue-600 font-medium">You Pay</div> */}
              <div className="text-xl font-bold text-blue-600">Rs {box.discountPrice}.00</div>
              {box.discountPrice && (
                <div className="text-xs text-gray-500 line-through">Rs {box.price}.00</div>
              )}
            </div>
          </div>
          <div className="mt-1 text-xs text-purple-600">
            Save Rs {box.totalValue - box.price}.00 ({Math.round(((box.totalValue - box.price) / box.totalValue) * 100)}% off)
          </div>
        </div>

        {/* Seller Info */}
        {box.seller && (
          <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-50 rounded">
            {box.seller.storeImgBase64 ? (
              <img 
                src={box.seller.storeImgBase64} 
                alt={box.seller.businessName}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {box.seller.businessName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{box.seller.businessName}</div>
              <div className="text-xs text-gray-500 truncate">{box.seller.category}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails(box)}
            className="flex-1 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium text-sm transition-colors"
            aria-label={`View details of ${box.name}`}
          >
            View Details
          </button>
        </div>
        
        {/* Buy Now Button */}
        {/* <div className="mt-2">
          <button
            onClick={handleBuyNow}
            disabled={box.status !== 'ACTIVE' || box.stock === 0 || buyingNow}
            className={`w-full px-3 py-2 rounded-lg font-medium text-sm transition-all ${
              box.status !== 'ACTIVE' || box.stock === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg'
            }`}
            aria-label={`Buy ${box.name} now`}
          >
            {buyingNow ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : box.stock === 0 ? (
              'Out of Stock'
            ) : (
              'Buy Now'
            )}
          </button>
        </div> */}
        
        {/* Add to Cart Button (Secondary) */}
        <div className="mt-2">
          <button
            onClick={handleAddToCart}
            disabled={box.status !== 'ACTIVE' || box.stock === 0 || addingToCart}
            className={`w-full px-3 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium text-sm transition-all hover:bg-blue-50 ${
              box.status !== 'ACTIVE' || box.stock === 0
                ? 'border-gray-300 text-gray-500 cursor-not-allowed hover:bg-white'
                : ''
            }`}
            aria-label={`Add ${box.name} to cart`}
          >
            {addingToCart ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </span>
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Mystery Box Details Modal (Updated)
const MysteryBoxDetailsModal = ({ box, onClose }: { box: MysteryBox; onClose: () => void }) => {
  const { addToCart } = useCartState();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      
      const productId = getMysteryBoxProductId(box.id);
      
      await addToCart(
        productId,
        quantity,
        {
          name: box.name,
          price: box.price,
          discountPrice: box.discountPrice || box.price,
          description: box.description,
          images: [{ imageUrl: MYSTERY_BOX_IMAGE }],
          productImg: MYSTERY_BOX_IMAGE,
          image: MYSTERY_BOX_IMAGE,
          isMysteryBox: true,
          category: box.category,
          stock: box.stock,
          status: box.status,
          mysteryBoxId: box.id,
          totalValue: box.totalValue,
          sellerName: box.seller?.businessName,
          sellerCategory: box.seller?.category
        }
      );
      
      showToast(`Added ${quantity} "${box.name}" to cart!`, 'success');
      onClose();
    } catch (error) {
      console.error("Error adding mystery box to cart:", error);
      showToast('Failed to add to cart. Please try again.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      setBuyingNow(true);
      
      const productId = getMysteryBoxProductId(box.id);
      
      // Add to cart first
      await addToCart(
        productId,
        quantity,
        {
          name: box.name,
          price: box.price,
          discountPrice: box.discountPrice || box.price,
          description: box.description,
          images: [{ imageUrl: MYSTERY_BOX_IMAGE }],
          productImg: MYSTERY_BOX_IMAGE,
          image: MYSTERY_BOX_IMAGE,
          isMysteryBox: true,
          category: box.category,
          stock: box.stock,
          status: box.status,
          mysteryBoxId: box.id,
          totalValue: box.totalValue,
          sellerName: box.seller?.businessName,
          sellerCategory: box.seller?.category,
          isBuyNow: true
        }
      );
      
      // Navigate to checkout
      router.push('/checkout');
      onClose();
      
    } catch (error) {
      console.error("Error buying mystery box:", error);
      showToast('Failed to proceed to checkout. Please try again.', 'error');
    } finally {
      setBuyingNow(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  MYSTERY BOX
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  box.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {box.status === 'ACTIVE' ? 'In Stock' : box.status}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{box.name}</h2>
            </div>
            <button
              onClick={onClose}
              type='button'
              title='Close'
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Hero Section with Mystery Box Image */}
          <div className="relative h-56 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl overflow-hidden">
            <img 
              src={MYSTERY_BOX_IMAGE} 
              alt="Mystery Box"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end">
              <div className="p-6 text-white">
                <div className="text-3xl font-bold mb-2">SURPRISE INSIDE!</div>
                <p className="text-white/90">The contents remain a mystery until after purchase</p>
              </div>
            </div>
            <div className="absolute top-4 right-4">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                MYSTERY BOX
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
            <p className="text-gray-600">{box.description}</p>
          </div>

          {/* Value Comparison */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Value Comparison</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-500">Total Value of Items</div>
                  <div className="text-2xl font-bold text-gray-800">Rs {box.totalValue}</div>
                </div>
                <div className="text-3xl text-purple-500">→</div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">You Pay Only</div>
                  <div className="text-3xl font-bold text-blue-600">Rs {box.price}</div>
                  {box.discountPrice && (
                    <div className="text-lg text-gray-500 line-through">Rs {box.discountPrice}</div>
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-green-600">
                    You Save Rs {box.totalValue - box.price}
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {Math.round(((box.totalValue - box.price) / box.totalValue) * 100)}% OFF
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Box Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="text-sm text-gray-500">Category</div>
              <div className="font-medium text-gray-800">{box.category}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="text-sm text-gray-500">Stock Available</div>
              <div className="font-medium text-gray-800">{box.stock} boxes</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="text-sm text-gray-500">Already Sold</div>
              <div className="font-medium text-gray-800">{box.sales || 0} boxes</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="text-sm text-gray-500">Created</div>
              <div className="font-medium text-gray-800">
                {new Date(box.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Seller Info */}
          {box.seller && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Seller Information</h3>
              <div className="flex items-center space-x-3">
                {box.seller.storeImgBase64 ? (
                  <img 
                    src={box.seller.storeImgBase64} 
                    alt={box.seller.businessName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {box.seller.businessName.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-bold text-gray-800">{box.seller.businessName}</div>
                  <div className="text-sm text-gray-600">{box.seller.category}</div>
                  {box.seller.businessAddress && (
                    <div className="text-sm text-gray-500 mt-1">
                      📍 {box.seller.businessAddress}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mystery Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <div>
                <div className="font-medium text-yellow-800">Important Notice</div>
                <p className="text-yellow-700 text-sm mt-1">
                  This is a mystery box! The exact contents are unknown until after purchase. 
                  Each box contains a surprise selection of items from the seller's inventory worth Rs {box.totalValue}.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="sticky bottom-0 bg-white p-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500">Price</div>
              <div className="text-3xl font-bold text-blue-600">Rs {box.price}</div>
              <div className="text-sm text-gray-500 line-through">Rs {box.totalValue} value</div>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Quantity:</label>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-10 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(box.stock, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          
          {/* Dual Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleAddToCart}
              disabled={box.status !== 'ACTIVE' || box.stock === 0 || addingToCart}
              className={`flex-1 px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-medium text-lg transition-all hover:bg-blue-50 ${
                box.status !== 'ACTIVE' || box.stock === 0
                  ? 'border-gray-300 text-gray-500 cursor-not-allowed hover:bg-white'
                  : ''
              }`}
              aria-label={`Add ${quantity} ${box.name} to cart`}
            >
              {addingToCart ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              ) : (
                'Add to Cart'
              )}
            </button>
            
            <button
              onClick={handleBuyNow}
              disabled={box.status !== 'ACTIVE' || box.stock === 0 || buyingNow}
              className={`flex-1 px-6 py-3 rounded-lg font-bold text-lg transition-all ${
                box.status !== 'ACTIVE' || box.stock === 0 || buyingNow
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
              }`}
              aria-label={`Buy ${quantity} ${box.name} now`}
            >
              {buyingNow ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Buy Now'
              )}
            </button>
          </div>
          
          {/* Info Text */}
          <div className="mt-3 text-xs text-center text-gray-500">
            {box.stock > 0 ? (
              <>
                ✅ Available for both registered and unregistered users<br />
                🛒 Add to cart for later or Buy Now for immediate checkout
              </>
            ) : 'Out of Stock'}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Customer Mystery Boxes Page (Remains the same)
const CustomerMysteryBoxesPage = () => {
  const { mysteryBoxes, mysteryBoxLoading, mysteryBoxError, fetchMysteryBoxes } = useProductStore();
  const [selectedBox, setSelectedBox] = useState<MysteryBox | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Dummy data for testing
  const dummyBox: MysteryBox = {
    id: 1,
    name: "Premium Food Surprise Box",
    description: "A carefully curated selection of premium food items from top sellers. Perfect for food lovers who enjoy surprises!",
    price: 499,
    discountPrice: 699,
    category: "Food & Grocery",
    status: 'ACTIVE',
    stock: 25,
    sales: 42,
    totalValue: 899,
    sellerId: 101,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:20:00Z',
    seller: {
      seller_id: 101,
      businessName: "Gourmet Delights",
      storeImgBase64: "",
      businessAddress: "123 Food Street, Mumbai",
      category: "Premium Foods"
    }
  };

  useEffect(() => {
    fetchMysteryBoxes();
  }, [fetchMysteryBoxes]);

  // Get unique categories - adding dummy data if no boxes exist
  const boxesToDisplay = mysteryBoxes.length > 0 ? mysteryBoxes : [dummyBox];
  const categories = ['All', ...Array.from(new Set(boxesToDisplay.map(box => box.category)))];

  // Filter and sort boxes
  const filteredBoxes = boxesToDisplay
    .filter(box => 
      box.status === 'ACTIVE' && 
      box.stock > 0 &&
      (categoryFilter === 'All' || box.category === categoryFilter) &&
      (box.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       box.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'value':
          return b.totalValue - a.totalValue;
        case 'popular':
          return (b.sales || 0) - (a.sales || 0);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Add Navbar2 */}
      <Navbar2 />
      
      {/* Add Toast Component */}
      <Toast />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Discover Amazing Mystery Boxes
            </h1>
            <p className="text-lg text-purple-100 mb-6">
              Surprise yourself with curated boxes full of delicious items at incredible prices!
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search mystery boxes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-3 focus:ring-purple-300 shadow-lg"
                  aria-label="Search mystery boxes"
                />
                <div className="absolute right-3 top-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-3 md:space-y-0">
          <div className="flex items-center space-x-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
              <div className="flex flex-wrap gap-1">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      categoryFilter === category
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-label={`Filter by ${category}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-black block text-sm font-medium mb-1">Sort By</label>
            <select
              value={sortBy}
              title='Sort'
              onChange={(e) => setSortBy(e.target.value)}
              className="text-black px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              aria-label="Sort mystery boxes"
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="value">Best Value</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {mysteryBoxLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            <p className="mt-3 text-gray-600">Loading mystery boxes...</p>
          </div>
        )}

        {/* Error State */}
        {mysteryBoxError && !mysteryBoxLoading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h3 className="font-bold text-red-800 text-sm">Error Loading Mystery Boxes</h3>
                <p className="text-red-700 text-xs">{mysteryBoxError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Demo Data Notice */}
        {!mysteryBoxLoading && mysteryBoxes.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <div>
                <div className="font-medium text-yellow-800 text-sm">Demo Mode</div>
                <p className="text-yellow-700 text-xs mt-0.5">
                  Showing demo mystery box data. Connect to your backend to see real data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {!mysteryBoxLoading && filteredBoxes.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Mystery Boxes Found</h3>
              <p className="text-gray-600 text-sm mb-4">
                {searchTerm || categoryFilter !== 'All' 
                  ? 'Try adjusting your filters or search terms'
                  : 'Check back later for exciting mystery boxes!'}
              </p>
              {(searchTerm || categoryFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('All');
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 text-sm"
                  aria-label="Clear all filters"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mystery Boxes Grid */}
        {!mysteryBoxLoading && filteredBoxes.length > 0 && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {filteredBoxes.length} Mystery Box{filteredBoxes.length !== 1 ? 'es' : ''} Available
                </h2>
                {/* <p className="text-gray-600 text-sm">Available for both registered and unregistered users</p> */}
              </div>
              <div className="text-xs text-gray-500">
                Sorted by {sortBy.replace('_', ' ')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBoxes.map((box) => (
                <MysteryBoxCard
                  key={box.id}
                  box={box}
                  onViewDetails={() => setSelectedBox(box)}
                />
              ))}
            </div>
          </>
        )}

        {/* Info Banner */}
        {!mysteryBoxLoading && filteredBoxes.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-1">How Mystery Boxes Work</h3>
                <ul className="space-y-1 text-gray-600 text-sm">
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    <strong>No login required!</strong> Both registered and unregistered users can add to cart and buy
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    Each box contains a surprise selection of items from the seller's inventory
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    Use <strong>Add to Cart</strong> to save for later or <strong>Buy Now</strong> for immediate checkout
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    Contents are revealed only after purchase for an exciting surprise experience
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mystery Box Details Modal */}
      {selectedBox && (
        <MysteryBoxDetailsModal
          box={selectedBox}
          onClose={() => setSelectedBox(null)}
        />
      )}
    </div>
  );
};

export default CustomerMysteryBoxesPage;