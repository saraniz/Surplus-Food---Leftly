"use client";

import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import Product from "../components/Product";
import { lora } from "../libs/fonts";
import { Search, ShoppingBag, X, Utensils, Loader2, Grid3x3 } from "lucide-react";
import { useProductStore } from "../ZustandStore/productStore";
import Navbar2 from "../components/Navbar2";
import { usecategoryStore } from "../ZustandStore/Admin/categoryStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const { products } = useProductStore();
  const {
    category: categories,
    getCategory,
    loading: categoriesLoading,
  } = usecategoryStore();
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAllCategoriesModal, setShowAllCategoriesModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(8); // Show 8 products per page

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    getCategory();
  }, [getCategory]);

  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (e.target.value.trim() !== "") {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setSearch("");
  };

  const handleOpenResults = (id: string) => {
    router.push(`/product/${id}`);
  };

  // Function to create URL-friendly category name
  const createCategorySlug = (categoryName: string) => {
    return categoryName.toLowerCase().replace(/\s+/g, "-");
  };

  // Calculate pagination for products
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Product Card component for search results
  const ProductCard = ({ product }: { product: any }) => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200 overflow-hidden">
        <div className="relative h-32 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center">
                <ShoppingBag size={36} className="text-amber-500" />
              </div>
            )}
          </div>
          {product.discount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
              {product.discount}% OFF
            </div>
          )}
        </div>

        <div className="p-3">
          <h3
            className={`text-sm font-semibold text-black mb-1 ${lora.className}`}
          >
            {product.name}
          </h3>

          <div className="flex items-center justify-between mb-2">
            <div>
              {product.originalPrice && (
                <span className="text-gray-400 line-through text-xs">
                  Rs {product.originalPrice}.00
                </span>
              )}
              <span className="text-base font-bold text-amber-600 ml-1">
                Rs {product.price}.00
              </span>
            </div>
          </div>

          <button
            onClick={() => handleOpenResults(product.id)}
            className="w-full py-1.5 bg-amber-500 text-white rounded-md font-medium hover:bg-amber-600 transition-colors text-xs"
          >
            View Details
          </button>
        </div>
      </div>
    );
  };

  // Category Card component for modal
  const CategoryCard = ({ cat }: { cat: any }) => {
    const categorySlug = createCategorySlug(cat.categoryName);
    
    return (
      <Link
        key={cat.cId}
        href={`/category/${categorySlug}`}
        className="flex-shrink-0 flex flex-col items-center"
        onClick={() => setShowAllCategoriesModal(false)}
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br bg-white border border-[#437057]/30 flex flex-col items-center justify-center p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          {cat.iconUrl ? (
            <img
              src={cat.iconUrl}
              alt={cat.categoryName}
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement("div");
                  fallback.className =
                    "w-10 h-10 flex items-center justify-center";
                  fallback.innerHTML =
                    '<Utensils className="w-6 h-6 text-[#437057]" />';
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <Utensils className="w-6 h-6 text-[#437057]" />
          )}
        </div>
        <p
          className={`text-center text-black font-medium text-sm mt-3 ${lora.className} max-w-[80px] truncate`}
          title={cat.categoryName}
        >
          {cat.categoryName}
        </p>
      </Link>
    );
  };

  // Don't render until client-side
  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#FAF7F0] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </main>
    );
  }

  return (
    <main className="bg-[#FAF7F0] min-h-screen">
      <div>
        <Navbar2 />
      </div>

      {/* Hero Section with Large Monochrome Food Icons */}
      <div className="relative rounded-2xl bg-[#064232]/80 backdrop-blur-sm w-355 mt-[-2vh] h-82 flex flex-col items-start justify-center mx-auto mb-10 shadow-lg border border-white/20 overflow-hidden">
        {/* Background - Just a Few Large Icons */}
        <div className="absolute inset-0 opacity-15">
          {/* Top Left - Large Icon */}
          <div className="absolute top-7 left-50 text-6xl filter grayscale">
            🍕
          </div>

          {/* Top Right - Large Icon */}
          <div className="absolute top-10 right-50 text-7xl filter grayscale">
            🍔
          </div>

          {/* Bottom Left - Large Icon */}
          <div className="absolute bottom-5 left-10 text-7xl filter grayscale">
            🥗
          </div>

          <div className="absolute top-40 right-120 text-6xl filter grayscale">
            🍕
          </div>

           <div className="absolute bottom-18 right-60 text-6xl filter grayscale">
            🍣
          </div>

          {/* Bottom Right - Large Icon */}
          <div className="absolute bottom-10 right-10 text-6xl filter grayscale">
            🍣
          </div>
        </div>

        <h1
          className={`text-black ${lora.className} ml-20 mb-5 text-3xl font-semibold relative z-10`}
        >
          Eat Smart. Waste Less.
        </h1>

        <div className="relative w-150 ml-20 z-10">
          <input
            type="text"
            placeholder=" Search for surplus food..."
            value={search}
            onChange={handleSearchChange}
            className="w-full py-2.5 pl-10 pr-3 rounded-2xl text-black bg-white/95 border border-white/40 focus:outline-none focus:ring-2 focus:ring-[#437057]/50 focus:border-[#437057]/50 shadow-sm transition-all duration-300"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Search size={20} />
          </span>
        </div>
      </div>

      {/* Search Results Modal */}
      {showResults && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleCloseResults}
          />

          {/* Modal */}
          <div className="fixed inset-x-0 top-24 mx-auto w-11/12 max-w-4xl bg-white rounded-2xl shadow-2xl z-50 max-h-[70vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2
                  className={`text-xl font-semibold text-black ${lora.className}`}
                >
                  Search Results for "{search}"
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "item" : "items"} found
                </p>
              </div>
              <button
                onClick={handleCloseResults}
                type="button"
                aria-label="Close"
                title="Close"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Search size={28} className="text-amber-500" />
                  </div>
                  <h3
                    className={`text-lg font-semibold text-black mb-2 ${lora.className}`}
                  >
                    No products found
                  </h3>
                  <p className="text-gray-600">
                    We couldn't find any products matching "{search}". Try a
                    different search term.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={handleCloseResults}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* All Categories Modal */}
      {showAllCategoriesModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowAllCategoriesModal(false)}
          />

          {/* Modal */}
          <div className="fixed inset-x-0 top-24 mx-auto w-11/12 max-w-4xl bg-white rounded-2xl shadow-2xl z-50 max-h-[70vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Grid3x3 className="w-6 h-6 text-[#437057]" />
                <h2
                  className={`text-xl font-semibold text-black ${lora.className}`}
                >
                  All Categories
                </h2>
              </div>
              <button
                onClick={() => setShowAllCategoriesModal(false)}
                type="button"
                aria-label="Close"
                title="Close"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                  <span className="ml-2 text-gray-600">Loading categories...</span>
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="flex flex-wrap gap-5 justify-center">
                  {categories.map((cat: any) => (
                    <CategoryCard key={cat.cId} cat={cat} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                    <Utensils size={28} className="text-amber-500" />
                  </div>
                  <h3
                    className={`text-lg font-semibold text-black mb-2 ${lora.className}`}
                  >
                    No categories available
                  </h3>
                  <p className="text-gray-600">
                    Check back later for new categories.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAllCategoriesModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Category Section */}
      <div className="flex flex-row items-center mb-8">
        <h2
          className={`ml-13 text-black font-semibold text-lg ${lora.className}`}
        >
          Category
        </h2>
        <button
          onClick={() => setShowAllCategoriesModal(true)}
          className={`ml-310 text-black font-semibold text-sm ${lora.className} hover:text-[#437057] transition-colors`}
        >
          View All
        </button>
      </div>

      {/* Categories from store */}
      <div className="flex flex-row gap-5 overflow-x-auto pb-4 mb-12 ml-13 scrollbar-hide">
        {categoriesLoading ? (
          // Loading state
          <div className="flex items-center justify-center w-full">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            <span className="ml-2 text-gray-600">Loading categories...</span>
          </div>
        ) : categories && categories.length > 0 ? (
          categories.map((cat) => {
            const categorySlug = createCategorySlug(cat.categoryName);

            return (
              <Link
                key={cat.cId}
                href={`/category/${categorySlug}`}
                className="flex-shrink-0 flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br bg-white border border-[#437057]/30 flex flex-col items-center justify-center p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                  {cat.iconUrl ? (
                    <img
                      src={cat.iconUrl}
                      alt={cat.categoryName}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = document.createElement("div");
                          fallback.className =
                            "w-10 h-10 flex items-center justify-center";
                          fallback.innerHTML =
                            '<Utensils className="w-6 h-6 text-[#437057]" />';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <Utensils className="w-6 h-6 text-[#437057]" />
                  )}
                </div>
                <p
                  className={`text-center text-black font-medium text-sm mt-3 ${lora.className} max-w-[80px] truncate`}
                >
                  {cat.categoryName}
                </p>
              </Link>
            );
          })
        ) : (
          // No categories or error state
          <div className="flex flex-col items-center justify-center w-full text-gray-500">
            <Utensils className="w-8 h-8 mb-2" />
            <p>No categories available</p>
          </div>
        )}
      </div>

      {/* Products Section with Pagination Controls */}
      <div className="flex flex-row items-center justify-between mb-10">
        <h2
          className={`ml-13 text-black font-semibold text-lg ${lora.className}`}
        >
          Recommended Products
        </h2>
        
        {/* Pagination Controls - Only show if there are multiple pages */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2 mr-13">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md text-sm ${
                currentPage === 1 
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }`}
            >
              Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md text-sm ${
                currentPage === totalPages 
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Products Component - Modified to show paginated products */}
      <div className="ml-18">
        {/* Pass paginated products to Product component if it accepts props */}
        {/* If not, you'll need to modify your Product component to accept currentProducts */}
        <Product />
        
        {/* Bottom Pagination Controls - Only show if there are multiple pages */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10 mb-10">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg ${
                currentPage === 1 
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                  : "bg-[#064232] text-white hover:bg-[#085c40]"
              }`}
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg ${
                currentPage === totalPages 
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                  : "bg-[#064232] text-white hover:bg-[#085c40]"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div>
        <Footer />
      </div>
    </main>
  );
}