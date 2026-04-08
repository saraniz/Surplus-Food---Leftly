"use client";

import { useEffect } from "react";
import Navbar2 from "../components/Navbar2";
import Footer from "../components/Footer";
import { useMysteryBoxStore } from "../ZustandStore/mysteryBoxStore";
import { useCartState } from "../ZustandStore/cartStore";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast"; // assuming they use some toast

export default function MysteryBoxes() {
  const { mysteryBoxes, loading, fetchMysteryBoxes } = useMysteryBoxStore();
  const { addToCart } = useCartState();

  useEffect(() => {
    fetchMysteryBoxes();
  }, [fetchMysteryBoxes]);

  const handleAddToCart = async (box: any) => {
    try {
      await addToCart(box.id, 1, {
        name: box.name,
        price: box.price,
        discountPrice: box.discountPrice,
        description: box.description,
        image: box.seller?.storeImgBase64 || "https://cdn.vectorstock.com/i/500p/04/67/mystery-prize-box-lucky-surprise-gift-vector-45060467.jpg",
      }, true); // Important: pass isMysteryBox=true
      toast.success("Mystery box added to cart!");
    } catch (err) {
      toast.error("Failed to add mystery box to cart");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <Navbar2 />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Surprise Mystery Boxes</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover amazing deals and help reduce food waste! You won't know exactly what's inside until you open it, but we guarantee it'll be delicious and worth more than you pay.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : mysteryBoxes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Mystery Boxes Available</h2>
            <p className="text-gray-500">Check back later for exciting new surprises!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mysteryBoxes.map((box) => (
              <div key={box.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col">
                <div className="relative h-48 bg-purple-100 flex items-center justify-center">
                  {/* Decorative background for mystery box */}
                  <div className="absolute inset-0 opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-300 via-transparent to-transparent"></div>
                  <span className="text-6xl z-10 filter drop-shadow-md">🎁</span>
                  
                  {box.discountPrice && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1 rounded-full shadow-md z-10 text-sm">
                      SALE
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-purple-700 font-semibold px-3 py-1 rounded-full shadow-sm z-10 text-sm border border-purple-100">
                    {box.category || "Surprise"}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{box.name}</h3>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">{box.description}</p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div>
                        <span className="block font-medium text-gray-700">Stock</span>
                        {box.stock} left
                      </div>
                      <div>
                        <span className="block font-medium text-gray-700">Expires</span>
                        {new Date(box.expireDate).toLocaleDateString()}
                      </div>
                      <div className="text-right">
                        <span className="block font-medium text-gray-700">Est. Value</span>
                        <span className="text-green-600 font-medium">Rs. {box.totalValue || box.price * 2}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 mb-2">
                       {box.seller?.storeImgBase64 ? (
                         <img src={box.seller.storeImgBase64} alt="Seller" className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
                       ) : (
                         <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">S</div>
                       )}
                       <span className="text-sm font-medium text-gray-700">{box.seller?.businessName || "Local Partner"}</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        {box.discountPrice ? (
                          <>
                            <span className="text-2xl font-bold text-gray-900">Rs. {box.discountPrice}</span>
                            <span className="text-sm text-red-500 line-through ml-2">Rs. {box.price}</span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-gray-900">Rs. {box.price}</span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleAddToCart(box)}
                        disabled={box.stock <= 0}
                        className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                          box.stock > 0 
                            ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md active:scale-95" 
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {box.stock > 0 ? "Add to Cart" : "Sold Out"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
