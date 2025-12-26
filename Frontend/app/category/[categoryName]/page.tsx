"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar2 from '@/app/components/Navbar2';
import Footer from '@/app/components/Footer';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useProductStore } from '@/app/ZustandStore/productStore'; 

// Extended Product interface to include all possible fields
interface ExtendedProduct {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
  discountPrice: string;
  shelfTime: number;
  stock: number;
  sales: number;
  images: Array<{ id: number; imageUrl: string; imageBase64?: string }>;
  availableStock?: number;
  expiryDate?: string;
  manufactureDate?: string;
  ingredients?: string;
  seller_id?: number;
  sellerId?: number;
  productImg?: string; // Add this property
  image?: string; // Base64 image field
  productImgBase64?: string; // Another possible image field
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  
  const categoryName = decodeURIComponent(params.categoryName as string);
  const { products, fetchProducts, loading: productLoading } = useProductStore();
  const [localLoading, setLocalLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      setLocalLoading(true);
      await fetchProducts(); 
      setLocalLoading(false);
    };
    loadData();
  }, [fetchProducts, categoryName]);

  // Normalize category name for comparison
  const normalizeCategoryName = (name: string): string => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .trim();
  };

  // Format category name for display
  const formatCategoryName = (name: string) => {
    if (!name) return 'Category';
    return name.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get normalized category name from URL
  const normalizedCategoryName = normalizeCategoryName(categoryName);
  
  // Cast products to ExtendedProduct and filter
  const allProducts = products as ExtendedProduct[];
  
  // Filter products - improved matching logic
  const filteredProducts = allProducts.filter((product) => {
    if (!product.category) return false;
    
    const productCategoryNormalized = normalizeCategoryName(product.category);
    const isMatch = productCategoryNormalized === normalizedCategoryName;
    
    // For debugging
    if (process.env.NODE_ENV === 'development' && !isMatch && product.category) {
      console.log('Category mismatch:', {
        urlCategory: normalizedCategoryName,
        productCategory: product.category,
        normalizedProductCategory: productCategoryNormalized
      });
    }
    
    return isMatch;
  });

  // For debugging: Log category matching info
  useEffect(() => {
    if (!localLoading && !productLoading) {
      console.log('=== CATEGORY PAGE DEBUG INFO ===');
      console.log('URL Category Name:', categoryName);
      console.log('Normalized Category Name:', normalizedCategoryName);
      console.log('Total Products:', allProducts.length);
      console.log('Filtered Products:', filteredProducts.length);
      console.log('All Product Categories:', allProducts.map(p => p.category));
      console.log('Matching Products:', filteredProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category
      })));
      console.log('==============================');
    }
  }, [localLoading, productLoading, categoryName, normalizedCategoryName, allProducts, filteredProducts]);

  const handleProductClick = (productId: number) => {
    router.push(`/product/${productId}`);
  };

  if (localLoading || productLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F0]">
        <Navbar2 />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-[#437057] mb-4" />
          <p className="text-gray-600">Loading {formatCategoryName(categoryName)}...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0]">
      <Navbar2 />
      
      <main className="max-w-7xl mx-auto px-4 py-6 mt-[-8vh] mb-10">
        <nav className="flex items-center text-sm mb-6">
          <Link href="/" className="text-gray-600 hover:text-[#437057]">Home</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-[#437057] font-medium">{formatCategoryName(categoryName)}</span>
        </nav>

        

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              // Try all possible image sources in order of preference
              const imageSrc = 
                (product as any).productImg || // Direct productImg from API
                product.productImgBase64 || // Base64 version
                product.image || // image field
                (product.images && product.images.length > 0 ? 
                  (product.images[0].imageBase64 || product.images[0].imageUrl) : 
                  'https://via.placeholder.com/300?text=No+Image');

              return (
                <div 
                  key={product.id} 
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col cursor-pointer"
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    <img 
                      src={imageSrc} 
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Image+Error';
                      }}
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-[#437057] font-bold text-lg">Rs. {product.price}</p>
                      {product.discountPrice && (
                        <p className="text-gray-500 line-through text-sm">Rs. {product.discountPrice}</p>
                      )}
                    </div>
                    {product.stock > 0 ? (
                      <p className="text-green-600 text-sm mb-2">In Stock ({product.stock} available)</p>
                    ) : (
                      <p className="text-red-600 text-sm mb-2">Out of Stock</p>
                    )}
                    <div className="mt-auto pt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product.id);
                        }}
                        className="w-full text-center bg-[#437057] text-white py-2 rounded-lg text-sm hover:bg-[#365c48] transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-medium text-gray-900">No products found in "{formatCategoryName(categoryName)}"</h3>
              <p className="text-gray-600 mt-2 mb-4">We couldn't find any products in this category.</p>
              
              {/* Show all available categories for debugging */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-700 mb-2">Available Categories:</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(allProducts.map(p => p.category).filter(Boolean))).map((cat, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => router.push('/')} 
                className="mt-4 bg-[#437057] text-white px-6 py-2 rounded-lg hover:bg-[#365c48] transition-colors"
              >
                Browse All Categories
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}