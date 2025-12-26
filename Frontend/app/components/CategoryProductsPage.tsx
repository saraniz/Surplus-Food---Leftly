// app/components/CategoryProductsPage.tsx
"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar2 from './Navbar2';
import Footer from './Footer';
import { useProductStore } from '../ZustandStore/productStore'; // Correct import path
import { Loader2, ArrowLeft, Filter, Star, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

const CategoryProductsPage = () => {
  const params = useParams();
  const router = useRouter();
  
  // Get category name from params
  const categoryName = decodeURIComponent(params.categoryName as string);
  
  // Get Zustand store functions - using the correct store
  const {
    products,
    loading,
    error,
    fetchAllProducts,
    clearSingleProduct
  } = useProductStore();
  
  // Local state for filtering
  const [filters, setFilters] = React.useState({
    sortBy: 'sales'
  });
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  console.log("Category Name from params:", categoryName);

  // Fetch all products when component mounts
  useEffect(() => {
    console.log("Fetching all products...");
    fetchAllProducts();
    
    return () => {
      clearSingleProduct();
    };
  }, [fetchAllProducts, clearSingleProduct]);

  // Filter products by category
  const categoryProducts = React.useMemo(() => {
    if (!categoryName || !products.length) return [];
    
    // Decode and format category name for comparison
    const formattedCategory = formatCategoryName(categoryName);
    console.log("Filtering for category:", formattedCategory);
    console.log("Total products:", products.length);
    
    // Filter products by category (case-insensitive)
    const filtered = products.filter(product => 
      product.category?.toLowerCase() === formattedCategory.toLowerCase() ||
      product.category?.toLowerCase().includes(formattedCategory.toLowerCase())
    );
    
    console.log("Filtered products count:", filtered.length);
    return filtered;
  }, [products, categoryName]);

  // Sort products based on filter
  const sortedProducts = React.useMemo(() => {
    if (!categoryProducts.length) return [];
    
    let sorted = [...categoryProducts];
    
    switch (filters.sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price_desc':
        sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'rating':
        // Assuming you have rating in your Product interface
        sorted.sort((a: any, b: any) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'newest':
        // Assuming you have createdAt or similar field
        // If not, you can sort by id (newest first)
        sorted.sort((a, b) => b.id - a.id);
        break;
      case 'sales':
      default:
        sorted.sort((a, b) => (b.sales || 0) - (a.sales || 0));
        break;
    }
    
    return sorted;
  }, [categoryProducts, filters.sortBy]);

  // Format category name for display
  const formatCategoryName = (name: string) => {
    if (!name) return 'Category';
    return name.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    setFilters(prev => ({ ...prev, sortBy: value }));
  };

  // Handle pagination
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Calculate paginated products
  const productsPerPage = 12;
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);
  
  // Update total pages when filtered products change
  React.useEffect(() => {
    const calculatedTotalPages = Math.ceil(sortedProducts.length / productsPerPage);
    setTotalPages(calculatedTotalPages || 1);
    
    // Reset to page 1 if current page exceeds new total pages
    if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [sortedProducts, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F0]">
        <Navbar2 />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-[#437057] mb-4" />
          <p className="text-gray-600">Loading {formatCategoryName(categoryName)} products...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF7F0]">
        <Navbar2 />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Products</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/')}
                className="bg-[#437057] text-white px-6 py-2 rounded-lg hover:bg-[#365c48] transition-colors"
              >
                Go Back Home
              </button>
              <button
                onClick={() => fetchAllProducts()}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0]">
      <Navbar2 />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm mb-6">
          <Link 
            href="/" 
            className="text-gray-600 hover:text-[#437057] transition-colors"
          >
            Home
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-[#437057] font-medium">
            {formatCategoryName(categoryName)}
          </span>
        </nav>

        {/* Category Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              type='button'
              title='Arrowleft'
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {formatCategoryName(categoryName)}
              </h1>
              <p className="text-gray-600 mt-1">
                {categoryProducts.length} products found
              </p>
            </div>
          </div>
          
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              title='Sort'
              value={filters.sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[#437057] focus:border-[#437057]"
            >
              <option value="sales">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <Filter className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="pb-12">
          {paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {paginatedProducts.map((product) => {
                  const hasDiscount = product.discountPrice && parseFloat(product.discountPrice) < parseFloat(product.price);
                  const originalPrice = parseFloat(product.price);
                  const discountPrice = product.discountPrice ? parseFloat(product.discountPrice) : originalPrice;
                  const discountPercentage = hasDiscount 
                    ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100) 
                    : 0;

                  return (
                    <div 
                      key={product.id}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      {/* Product Image */}
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0].imageUrl || product.images[0].imageBase64}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ShoppingCart className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Discount Badge */}
                        {hasDiscount && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            -{discountPercentage}%
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2">
                          {product.name}
                        </h3>
                        
                        {/* Category */}
                        <div className="mb-3">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {product.category}
                          </span>
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-gray-900">
                              ${discountPrice.toFixed(2)}
                            </span>
                            {hasDiscount && (
                              <span className="ml-2 text-sm text-gray-500 line-through">
                                ${originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          
                          <button 
                            className="bg-[#437057] hover:bg-[#365c48] text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
                            onClick={() => {
                              // Add to cart logic here
                              console.log('Add to cart:', product.id);
                              // You might want to navigate to product detail page
                              router.push(`/product/${product.id}`);
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-between">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage <= 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <span className="text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage >= totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">We couldn't find any products in the "{formatCategoryName(categoryName)}" category.</p>
              <button
                onClick={() => router.push('/')}
                className="bg-[#437057] text-white px-6 py-2 rounded-lg hover:bg-[#365c48] transition-colors"
              >
                Go Back Home
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryProductsPage;