"use client";

import { useEffect, useState } from "react";
import SellerSidebar from "../../components/sellerdashboard";
import SellerHeader from "../../components/sellerHeader";
import { useProductStore } from "../../ZustandStore/productStore";
import { usecategoryStore } from "../../ZustandStore/Admin/categoryStore";
import MysteryBoxManager from "../../components/MysteryBox"; // Import the Mystery Box Manager

interface ProductImage {
  id: number;
  imageUrl: string;
  imageBase64?: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
  discountPrice: string;
  stock: number;
  shelfTime: number;
  sales: number;
  images: ProductImage[];
  image?: string; // For backward compatibility
  expiryDate?: string;
  manufactureDate?: string;
  ingredients?: string;
}

// Tab Component
const TabButton = ({ active, onClick, children }: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode 
}) => (
  <button
    onClick={onClick}
    className={`
      px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2
      ${active 
        ? 'border-blue-600 text-blue-600 bg-blue-50' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }
    `}
  >
    {children}
  </button>
);

export default function ProductsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletedId, setDeletedId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'mystery-boxes'>('products');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default 10 items per page

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    show: boolean;
  } | null>(null);

  // Form states
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [shelfTime, setShelfTime] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);

  const { products, loading, error, addProduct, fetchProducts, updateProductDetails, deleteProducts } =
    useProductStore();

  const { category: dbCategories, getCategory, loading: categoriesLoading } = usecategoryStore();

  // Show toast function
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, show: true });
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setToast((prev) => prev ? { ...prev, show: false } : null);
    }, 4000);
  };

  // Hide toast function
  const hideToast = () => {
    setToast((prev) => prev ? { ...prev, show: false } : null);
  };

  // Auto-hide toast effect
  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch categories from database
  useEffect(() => {
    getCategory();
  }, [getCategory]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      // Limit to 5 images total
      const totalImages = [...images, ...newFiles].slice(0, 5);
      setImages(totalImages);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const markImageForDeletion = (imageId: number) => {
    if (editingProduct?.images?.some(img => img.id === imageId)) {
      setImagesToDelete(prev => [...prev, imageId]);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("");
    setPrice("");
    setDiscountPrice("");
    setStock("");
    setShelfTime("");
    setImages([]);
    setExpiryDate("");
    setManufactureDate("");
    setIngredients("");
    setImagesToDelete([]);
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletedId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate category
    if (!category || !dbCategories.some(cat => cat.categoryName === category)) {
      showToast("Please select a valid category", "error");
      return;
    }

    const formData = new FormData();
    formData.append("productName", name);
    formData.append("productDescription", description);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("discountPrice", discountPrice);
    formData.append("shelfTime", shelfTime);
    formData.append("stock", stock);
    formData.append("expiryDate", expiryDate);
    formData.append("manufactureDate", manufactureDate);
    formData.append("ingredients", ingredients);
    
    // Append all images (field name must be "images" to match backend)
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      await addProduct(formData);
      resetForm();
      setShowAddModal(false);
      setCurrentPage(1); // Reset to first page when adding new product
      showToast("Product added successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to add product. Please try again.", "error");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Validate category
    if (!category || !dbCategories.some(cat => cat.categoryName === category)) {
      showToast("Please select a valid category", "error");
      return;
    }

    const formData = new FormData();
    formData.append("product_id", editingProduct.id.toString());
    formData.append("productName", name);
    formData.append("productDescription", description);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("discountPrice", discountPrice);
    formData.append("shelfTime", shelfTime);
    formData.append("stock", stock);
    formData.append("expiryDate", expiryDate);
    formData.append("manufactureDate", manufactureDate);
    formData.append("ingredients", ingredients);
    
    // Append images to delete if any
    if (imagesToDelete.length > 0) {
      formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
    }
    
    // Append new images
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      await updateProductDetails(formData);
      handleCloseModals();
      showToast("Product updated successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to update product. Please try again.", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deletedId) return;

    try {
      await deleteProducts(deletedId);
      setShowDeleteModal(false);
      setDeletedId(null);
      showToast("Product deleted successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to delete product. Please try again.", "error");
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setCategory(product.category);
    setPrice(product.price);
    setDiscountPrice(product.discountPrice);
    setStock(product.stock.toString());
    setShelfTime(product.shelfTime.toString());
    setExpiryDate(product.expiryDate || "");
    setManufactureDate(product.manufactureDate || "");
    setIngredients(product.ingredients || "");
    setImages([]);
    setImagesToDelete([]);
    setShowEditModal(true);
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter only active categories
  const activeCategories = dbCategories.filter(cat => cat.cStatus === "ACTIVE");

  // Generate hour options from 1 to 100
  const hourOptions = Array.from({ length: 100 }, (_, i) => i + 1);

  // Pagination calculations
  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Calculate start and end index for current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  // Get current page products
  const currentProducts = products.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value);
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // In the middle
        pageNumbers.push(1);
        pageNumbers.push('...');
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-[100vh] z-30">
        <SellerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col ml-0 md:ml-64 transition-all duration-300">
        <SellerHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="Products Management"
          subtitle="Manage your products and mystery boxes"
        />
        
        {/* Toast Notification */}
        {toast?.show && (
          <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
            <div
              className={`
                flex items-center space-x-3 p-4 rounded-xl shadow-2xl
                transform transition-all duration-300
                ${toast.type === "success" 
                  ? "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200" 
                  : "bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200"
                }
              `}
            >
              {toast.type === "success" ? (
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              )}
              
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {toast.type === "success" ? "Success!" : "Error!"}
                </p>
                <p className="text-sm text-gray-700">{toast.message}</p>
              </div>
              
              <button
                type="button"
                title="Toast"
                onClick={hideToast}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto">
          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-2 border-b">
              <TabButton 
                active={activeTab === 'products'} 
                onClick={() => setActiveTab('products')}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                  <span>Products</span>
                </div>
              </TabButton>
              <TabButton 
                active={activeTab === 'mystery-boxes'} 
                onClick={() => setActiveTab('mystery-boxes')}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                  <span>Mystery Boxes</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    New
                  </span>
                </div>
              </TabButton>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'products' ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                  <p className="text-gray-600">Manage your product catalog</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add Product
                </button>
              </div>

              {loading && <div className="text-center py-8 text-gray-600">Loading products...</div>}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 font-medium">
                  Error: {error}
                </div>
              )}

              {/* Products Summary */}
              <div className="mb-4 flex justify-between items-center text-black">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {endIndex} of {totalItems} products
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <select
                    title="Items per page"
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  >
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {products.length === 0 && !loading ? (
                  <div className="text-center py-8 text-gray-500">
                    No products found. Add your first product to get started.
                  </div>
                ) : (
                  <>
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Price</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stock</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Shelf Time</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Expiry Date</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentProducts.map((product: Product) => (
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  {product.images && product.images.length > 0 ? (
                                    <>
                                      <img
                                        src={product.images[0].imageBase64 || `/uploads/${product.images[0].imageUrl}`}
                                        alt={product.name}
                                        className="w-12 h-12 object-cover rounded-lg"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                                        }}
                                      />
                                      {product.images.length > 1 && (
                                        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                          +{product.images.length - 1}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                      <span className="text-gray-400 text-xs">No image</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{product.name}</div>
                                  <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {product.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900">Rs. {product.price}</span>
                                {product.discountPrice && product.discountPrice !== "0" && (
                                  <span className="text-sm text-red-600 line-through">Rs. {product.discountPrice}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                product.stock > 10 ? 'bg-green-100 text-green-800' : 
                                product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {product.stock} in stock
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">
                                {product.shelfTime} hours
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {product.expiryDate ? (
                                <span className={`text-sm ${
                                  new Date(product.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {new Date(product.expiryDate).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-3">
                                <button 
                                  onClick={() => handleEditClick(product)}
                                  className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                                >
                                  Edit
                                </button>
                                <button 
                                  title="Delete"
                                  onClick={() => {
                                    setDeletedId(product.id);
                                    setShowDeleteModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t px-6 py-4">
                        <div className="text-sm text-gray-700">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Previous Button */}
                          <button
                            aria-label="prev page"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              currentPage === 1
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                          </button>

                          {/* Page Numbers */}
                          {getPageNumbers().map((page, index) => (
                            page === '...' ? (
                              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                                ...
                              </span>
                            ) : (
                              <button
                                key={page}
                                aria-label="next page"
                                onClick={() => handlePageChange(page as number)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          ))}

                          {/* Next Button */}
                          <button
                            aria-label="next page"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              currentPage === totalPages
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Delete Modal */}
              {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl p-6 w-[350px]">
                    <h2 className="text-xl font-bold text-gray-900">Delete Product?</h2>
                    <p className="text-gray-600 mt-2">Are you sure you want to delete this product? This action cannot be undone.</p>
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={handleCloseDeleteModal}
                        className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add/Edit Modals */}
              {(showAddModal || (showEditModal && editingProduct)) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 text-black">
                  <div className="bg-white rounded-2xl w-[900px] max-w-[95vw] max-h-[90vh] overflow-y-auto flex flex-col">
                    <div className="p-6 border-b">
                      <h2 className="text-xl font-bold text-gray-900">{showAddModal ? "Add New Product" : "Edit Product"}</h2>
                      <p className="text-gray-600 mt-1">{showAddModal ? "Add a new product to your catalog" : "Update product information"}</p>
                    </div>
                    
                    <form onSubmit={showAddModal ? handleSubmit : handleEditSubmit} className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Product Images {showAddModal && "(Max 5)"}
                            </label>
                            <input
                              title="Image"
                              type="file"
                              onChange={handleImageChange}
                              accept="image/*"
                              multiple={showAddModal}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              required={showAddModal && images.length === 0}
                            />
                            
                            {/* Selected new images preview */}
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {images.map((image, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={URL.createObjectURL(image)}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              
                              {/* Existing images for edit mode */}
                              {showEditModal && editingProduct?.images && editingProduct.images
                                .filter(img => !imagesToDelete.includes(img.id))
                                .map((image) => (
                                  <div key={image.id} className="relative">
                                    <img
                                      src={image.imageBase64 || `/uploads/${image.imageUrl}`}
                                      alt={editingProduct.name}
                                      className="w-full h-24 object-cover rounded-lg"
                                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-image.jpg"; }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => markImageForDeletion(image.id)}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                    >
                                      ×
                                    </button>
                                    {imagesToDelete.includes(image.id) && (
                                      <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center rounded-lg">
                                        <span className="text-white text-xs font-bold">To Delete</span>
                                      </div>
                                    )}
                                  </div>
                                ))
                              }
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-2">
                              {images.length} new image{images.length !== 1 ? 's' : ''} selected
                              {showEditModal && editingProduct?.images && (
                                <span>, {editingProduct.images.length - imagesToDelete.length} existing image{editingProduct.images.length - imagesToDelete.length !== 1 ? 's' : ''}</span>
                              )}
                            </p>
                          </div>
                          
                          <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Product Name" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                            required 
                          />
                          <textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            rows={4} 
                            placeholder="Description" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                            required 
                          />
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
                            <textarea 
                              value={ingredients} 
                              onChange={(e) => setIngredients(e.target.value)} 
                              rows={2}
                              placeholder="List ingredients separated by commas"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">e.g., Flour, Sugar, Eggs, Milk</p>
                          </div>
                        </div>
                        
                        {/* Right Column */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                            {categoriesLoading ? (
                              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                                <span className="text-gray-500">Loading categories...</span>
                              </div>
                            ) : activeCategories.length === 0 ? (
                              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center">
                                <span className="text-gray-500">No categories available</span>
                                <span className="text-xs text-gray-400 mt-1">Please contact admin to add categories</span>
                              </div>
                            ) : (
                              <select 
                                title="Category"
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                required
                              >
                                <option value="">Select a Category</option>
                                {activeCategories.map((cat) => (
                                  <option key={cat.cId} value={cat.categoryName}>
                                    {cat.categoryName}
                                  </option>
                                ))}
                              </select>
                            )}
                            {activeCategories.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                {activeCategories.length} active categories available
                              </p>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Price (Rs.)</label>
                              <input 
                                type="number" 
                                step="0.01" 
                                min="0" 
                                value={price} 
                                onChange={(e) => setPrice(e.target.value)} 
                                placeholder="0.00" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                required 
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Discount Price (Rs.)</label>
                              <input 
                                type="number" 
                                step="0.01" 
                                min="0" 
                                value={discountPrice} 
                                onChange={(e) => setDiscountPrice(e.target.value)} 
                                placeholder="0.00" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                              <input 
                                type="number" 
                                min="0" 
                                value={stock} 
                                onChange={(e) => setStock(e.target.value)} 
                                placeholder="0" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                required 
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Shelf Time (hours)</label>
                              <select 
                                title="Shelf Time"
                                value={shelfTime} 
                                onChange={(e) => setShelfTime(e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                required
                              >
                                <option value="">Select shelf time in hours</option>
                                {hourOptions.map((hour) => (
                                  <option key={hour} value={hour}>
                                    {hour} hours
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Manufacture Date</label>
                              <input 
                                title="Date"
                                type="date" 
                                value={manufactureDate} 
                                onChange={(e) => setManufactureDate(e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                              <input 
                                title="Date"
                                type="date" 
                                value={expiryDate} 
                                onChange={(e) => setExpiryDate(e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                              />
                            </div>
                          </div>

                          {/* Note about food preservation */}
                          <div className="col-span-2">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-sm text-blue-800">
                                <span className="font-semibold">Note:</span> If your food item can be kept beyond the expiry date by refrigeration or other preservation methods, please mention this in the description field above.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-6 border-t">
                        <button 
                          type="button" 
                          onClick={handleCloseModals} 
                          className="px-6 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                          disabled={categoriesLoading || activeCategories.length === 0}
                        >
                          {showAddModal ? "Add Product" : "Update Product"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Mystery Boxes Tab */
            <MysteryBoxManager />
          )}

        </main>
      </div>
    </div>
  );
}

