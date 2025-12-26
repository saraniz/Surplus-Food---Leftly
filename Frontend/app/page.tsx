"use client";

import Navbar from "./components/Navbar";
import { alconica, lora } from "./libs/fonts";
import { motion } from "framer-motion";
import { ChevronRight, CircleArrowRight } from "lucide-react";
import Footer from "./components/Footer";
import { useUserStore } from "./ZustandStore/Admin/userStore";
import { useCusAuthStore } from "./ZustandStore/authStore";
import { useEffect, useState } from "react";

export default function Homepage() {
  const { sellers, getAllSellers } = useCusAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await getAllSellers();
      setIsLoading(false);
    };
    fetchData();
  }, [getAllSellers]);

  useEffect(() => {
    console.log("Total sellers fetched:", sellers?.length || 0);

    if (sellers && sellers.length > 0) {
      // Log each seller's details
      sellers.forEach((seller, index) => {
        console.log(`Seller ${index + 1}:`, {
          id: seller.seller_id,
          name: seller.businessName,
          hasImage: !!seller.storeImg,
          imageValue: seller.storeImg,
          category: seller.category,
          address: seller.businessAddress,
        });
      });

      // Show all sellers regardless of isFeatured
    } else {
      console.log("❌ No sellers found or empty array");
    }
  }, [sellers]);

  // Improved image URL helper
  const getImageUrl = (storeImg: string | null | undefined) => {
    if (
      !storeImg ||
      storeImg === "null" ||
      storeImg === "undefined" ||
      storeImg.trim() === ""
    ) {
      return "/placeholder.jpg";
    }

    // Handle different URL formats
    if (storeImg.startsWith("http://") || storeImg.startsWith("https://")) {
      return storeImg;
    }

    // Handle base64 images
    if (storeImg.startsWith("data:image")) {
      return storeImg;
    }

    // Handle relative paths - add your backend URL
    // const baseUrl = "http://localhost:5000";
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    // Clean the path
    let cleanPath = storeImg;
    if (cleanPath.startsWith("/")) {
      cleanPath = cleanPath.substring(1);
    }

    const fullUrl = `${baseUrl}/${cleanPath}`;
    return fullUrl;
  };

  return (
    <main className="bg-[#437057] min-h-screen relative overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10">
        <section className="flex flex-col-reverse md:flex-row items-center px-6 md:px-24 mt-[-5vh] md:mt-10 overflow-hidden">
          {/* Left Text Section */}
          <section className="flex-1">
            <motion.div
              className={`${alconica.className} text-3xl md:text-5xl text-black leading-snug md:leading-tight drop-shadow-lg`}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              Good Food Deserves a Second Chance
            </motion.div>

            <motion.div
              className={`${lora.className} text-sm md:text-base text-black mt-4 md:mt-8 drop-shadow-sm`}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Our platform connects restaurants, cafés, and shops with customers
              who love saving money while fighting food waste. Enjoy fresh meals
              at discounted prices and be part of the zero-waste movement.
            </motion.div>

            <motion.div
              className="mt-10 md:mt-10 w-full md:w-[400px] relative"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <button
                onClick={() => {
                  window.location.href = "/homepage";
                }}
                className={`
      w-80 rounded-3xl bg-[#437057] border border-black text-black font-semibold px-4 py-3
      hover:bg-gray-800 focus:outline-none focus:ring-2
      focus:ring-black focus:ring-offset-2
      ${lora.className} shadow-md transition-all
      flex items-center justify-center gap-3
      hover:scale-[1.02] active:scale-[0.98]
    `}
              >
                <span>Pick a Plate, Save the Planet</span>
                
              </button>
            </motion.div>
          </section>

          {/* Right Image Section */}
          <motion.section
            className="flex-1 mb-8 md:mb-0"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <img
              className="w-full md:w-[150%] h-auto object-cover rounded-xl md:ml-auto transform scale-110"
              src="/home.png"
              alt="food image"
            />
          </motion.section>
        </section>
      </section>

      {/* ALL Sellers Section - Updated to show ALL sellers */}
      <section className="bg-[#F2F2F2] w-full py-20 shadow-lg mt-16 md:mt-24 px-6 md:px-24">
        <h2
          className={`${alconica.className} text-4xl md:text-3xl text-black font-bold text-center mb-10`}
        >
          All Restaurants & Shops
        </h2>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#437057]"></div>
            <span className="ml-4 text-gray-600">Loading stores...</span>
          </div>
        ) : (
          <>
            {/* <div className="text-center mb-8">
              <div className="inline-block bg-gray-100 rounded-lg px-4 py-2">
                <span className="text-gray-700">
                  Total stores available: <strong>{sellers?.length || 0}</strong>
                </span>
              </div>
            </div> */}

            {sellers && sellers.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-10">
                {sellers.map((seller: any) => {
                  const imageUrl = getImageUrl(seller.storeImg);

                  return (
                    <motion.div
                      key={seller.seller_id}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center w-56 cursor-pointer group"
                    >
                      <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-[#a2b79a] shadow-xl bg-white group-hover:border-[#437057] transition-all duration-300">
                        <img
                          src={imageUrl}
                          alt={seller.businessName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            console.error(
                              `❌ Image load error for ${seller.businessName}:`,
                              seller.storeImg
                            );
                            e.currentTarget.src = "/placeholder.jpg";
                            e.currentTarget.classList.add("opacity-70");
                          }}
                          loading="lazy"
                        />
                      </div>
                      {/* <div className="text-center mt-4">
                        <p className="text-[#437057] font-bold text-lg group-hover:text-[#2a4839] transition-colors">
                          {seller.businessName}
                        </p>
                        {seller.category && (
                          <span className="text-gray-600 text-sm mt-1 block px-2 py-1 bg-gray-100 rounded-full">
                            {seller.category}
                          </span>
                        )}
                        {seller.businessAddress && (
                          <span className="text-gray-500 text-xs mt-2 block max-w-[200px] truncate">
                            📍 {seller.businessAddress}
                          </span>
                        )}
                        {seller.openingHours && (
                          <span className="text-green-600 text-xs mt-1 block">
                            ⏰ {seller.openingHours}
                          </span>
                        )}
                        <div className="mt-2 text-xs text-gray-400">
                          ID: {seller.seller_id}
                        </div>
                      </div> */}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="text-gray-500 mb-2">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg mb-2">
                  No restaurants or shops available
                </p>
                <p className="text-gray-500 text-sm">
                  Be the first to register your business!
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-[#F2F2F2] w-full py-16 shadow-lg mt-[-5vh] px-6 md:px-24">
        <h2
          className={`${alconica.className} text-2xl md:text-4xl text-black font-bold mb-12 text-center`}
        >
          Why You Choose Us?
        </h2>

        <div className="flex flex-col md:flex-row gap-8 justify-center">
          {/* Card 1 */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full md:w-80 h-auto bg-[#a2b79a]/30 backdrop-blur-lg border border-[#728c69]/40 
              shadow-lg rounded-3xl p-6 flex flex-col items-center text-center
              transition-all duration-300 ease-in-out"
          >
            <div className="w-40 h-40 flex items-center justify-center mb-4">
              <img
                src="/money.png"
                alt="Save money illustration"
                className="w-full h-full object-contain"
              />
            </div>
            <h2
              className={`text-black ${lora.className} text-xl font-semibold mb-3`}
            >
              Save Money, Enjoy More
            </h2>
            <p
              className={`text-black ${lora.className} text-sm font-medium leading-relaxed`}
            >
              Get fresh food and special deals at prices you'll love every
              single day.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full md:w-80 h-auto bg-[#a2b79a]/30 backdrop-blur-lg border border-[#728c69]/40 
              shadow-lg rounded-3xl p-6 flex flex-col items-center text-center
              transition-all duration-300 ease-in-out"
          >
            <div className="w-40 h-40 flex items-center justify-center mb-4">
              <img
                src="/trusted.png"
                alt="Trusted illustration"
                className="w-full h-full object-contain"
              />
            </div>
            <h2
              className={`text-black ${lora.className} text-xl font-semibold mb-3`}
            >
              Trusted & Fresh
            </h2>
            <p
              className={`text-black ${lora.className} text-sm font-medium leading-relaxed`}
            >
              We partner only with reliable shops and restaurants to ensure
              quality.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full md:w-80 h-auto bg-[#a2b79a]/30 backdrop-blur-lg border border-[#728c69]/40 
              shadow-lg rounded-3xl p-6 flex flex-col items-center text-center
              transition-all duration-300 ease-in-out"
          >
            <div className="w-40 h-40 flex items-center justify-center mb-4">
              <img
                src="/impact.png"
                alt="Impact illustration"
                className="w-full h-full object-contain"
              />
            </div>
            <h2
              className={`text-black ${lora.className} text-xl font-semibold mb-3`}
            >
              Make an Impact
            </h2>
            <p
              className={`text-black ${lora.className} text-sm font-medium leading-relaxed`}
            >
              Every order helps reduce food waste and supports a greener planet.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
