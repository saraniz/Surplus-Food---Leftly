"use client";

import { ShoppingCart, Clock } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { useProductStore } from "../ZustandStore/productStore";
import Link from "next/link";
import { useCartState } from "../ZustandStore/cartStore";

export default function ProductCard() {
  const { fetchAllProducts, products } = useProductStore();
  const { addToCart, cart } = useCartState();

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const handleAddToCart = (productId: number) => {
    addToCart(productId, 1);
  };

  const isInCart = (productId: number) => {
    return cart?.cartItems?.some((item) => item.productId === productId);
  };

  return (
    <div className="flex flex-wrap gap-7 mb-10">
      {products.map((p) => (
        <Link href={`/product/${p.id}`} key={p.id} className="flex">
          {/* Added h-[500px] (or similar) or flex-1 to ensure same height */}
          <div className=" w-80 rounded-2xl shadow-lg bg-gray-100 p-4 flex flex-col cursor-pointer hover:shadow-xl transition h-full min-h-[450px]">

            {/* Image Section - Height is already fixed at h-48 */}
            <div className="relative w-full h-48 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src={p.image ?? "/placeholder.png"}
                alt={p.name}
                fill
                className="object-cover"
              />
              <span className="absolute top-2 left-2 bg-white text-gray-800 text-xs px-3 py-1 rounded-full shadow">
                Available {p.stock}
              </span>
              <button
                type="button"
                title="Shopping cart"
                className={`absolute bottom-2 right-2 p-2 rounded-full shadow 
                  ${isInCart(p.id) ? "bg-blue-600 text-white" : "bg-white text-black"}`}
                onClick={(e) => {
                  e.preventDefault(); // Prevent Link navigation when clicking cart
                  handleAddToCart(p.id);
                }}
              >
                <ShoppingCart size={18} />
              </button>
            </div>

            {/* Info Section - flex-grow ensures this area fills space */}
            <div className="flex flex-col flex-grow">
                {/* Stars + Sold */}
                <div className="flex items-center gap-1 mt-3 w-full">
                <div className="flex">
                    {Array(5).fill(0).map((_, i) => (
                    <span key={i} className="text-yellow-500 text-lg">★</span>
                    ))}
                </div>
                <p className="text-sm text-gray-600 ml-2">({p.sales} Sold)</p>
                </div>

                {/* Title + Time - Fixed height for title helps alignment */}
                <div className="flex justify-between items-start w-full mt-2 h-14">
                <h3 className="text-lg font-semibold text-black line-clamp-2 leading-tight">{p.name}</h3>
                <div className="flex items-center text-sm text-gray-600 whitespace-nowrap ml-2">
                    <Clock size={16} className="mr-1" /> {p.shelfTime} hrs
                </div>
                </div>

                {/* Description - Already line-clamp-2 */}
                <p className="text-sm text-gray-600 mt-[-2vh] line-clamp-2">
                {p.description}
                </p>

                {/* Spacer to push price/order to the bottom */}
                <div className="flex-grow"></div>

                {/* Discount */}
                <div className="flex items-center gap-2 mt-4 w-full">
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                    {p.discountPrice && p.price
                    ? `${Math.round(((Number(p.price) - Number(p.discountPrice)) / Number(p.price)) * 100)}% off`
                    : "15% off"}
                </span>

                {p.discountPrice && p.price && p.discountPrice < p.price && (
                    <span className="line-through text-gray-500 text-sm">
                    Rs.{p.price}.00
                    </span>
                )}
                </div>

                {/* Price + Order */}
                <div className="flex justify-between items-center w-full mt-2">
                <p className="text-lg font-bold text-black">
                    Rs.{p.discountPrice || p.price}.00
                </p>
                <button className="bg-green-700 text-white px-4 py-1.5 rounded-xl hover:bg-green-800 transition">
                    Order
                </button>
                </div>
            </div>

          </div>
        </Link>
      ))}
    </div>
  );
}