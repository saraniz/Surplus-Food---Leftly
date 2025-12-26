import React, { useState, useEffect } from 'react';
import { useProductStore } from '../ZustandStore/productStore';
import { usecategoryStore } from '../ZustandStore/Admin/categoryStore';

// Component for creating/editing mystery box
const MysteryBoxForm = ({ 
  box, 
  onSave, 
  onCancel, 
  products = [] 
}: { 
  box?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  products: any[];
}) => {
  const [formData, setFormData] = useState({
    name: box?.name || '',
    description: box?.description || '',
    price: box?.price || '',
    discountPrice: box?.discountPrice || '',
    category: box?.category || '',
    stock: box?.stock || 1,
    productDetails: box?.productDetails || '[]',
    expiryDate: box?.expiryDate || '',
    manufactureDate: box?.manufactureDate || '',
  });

  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [productQuantities, setProductQuantities] = useState<{[key: number]: number}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  // Get category store
  const { category: storeCategories, getCategory, loading: categoriesLoading } = usecategoryStore();

  // Initialize form if editing existing box
  useEffect(() => {
    if (box && box.productDetails) {
      try {
        const products = JSON.parse(box.productDetails);
        setSelectedProducts(products);
        const quantities: {[key: number]: number} = {};
        products.forEach((item: any) => {
          quantities[item.productId] = item.quantity || 1;
        });
        setProductQuantities(quantities);
        
        // Set dates if they exist
        if (box.expiryDate) {
          setFormData(prev => ({
            ...prev,
            expiryDate: formatDateForInput(box.expiryDate)
          }));
        }
        if (box.manufactureDate) {
          setFormData(prev => ({
            ...prev,
            manufactureDate: formatDateForInput(box.manufactureDate)
          }));
        }

        // Check if category exists in dropdown, otherwise show custom input
        if (box.category) {
          const exists = storeCategories.some(cat => 
            cat.categoryName.toLowerCase() === box.category.toLowerCase()
          );
          if (!exists) {
            setShowCustomCategory(true);
            setCustomCategory(box.category);
          }
        }
      } catch (error) {
        console.error('Error parsing product details:', error);
      }
    }
  }, [box, storeCategories]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        await getCategory();
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [getCategory]);

  // Update categories from store
  useEffect(() => {
    if (storeCategories && storeCategories.length > 0) {
      setCategories(storeCategories);
    }
  }, [storeCategories]);

  // Helper function to format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle category selection
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const value = e.target.value;
    
    if (e.target.type === 'select-one') {
      // Dropdown selection
      if (value === 'custom') {
        setShowCustomCategory(true);
        setFormData({...formData, category: ''});
      } else {
        setShowCustomCategory(false);
        setCustomCategory('');
        setFormData({...formData, category: value});
      }
    } else {
      // Custom category input
      setCustomCategory(value);
      setFormData({...formData, category: value});
    }
  };

  const handleAddProduct = (product: any) => {
    if (!selectedProducts.find(p => p.productId === product.id)) {
      const newSelected = [...selectedProducts, { 
        productId: product.id, 
        quantity: 1,
        productName: product.name,
        price: product.price,
        image: product.image
      }];
      setSelectedProducts(newSelected);
      setProductQuantities({...productQuantities, [product.id]: 1});
      updateProductDetails(newSelected);
    }
  };

  const handleRemoveProduct = (productId: number) => {
    const newSelected = selectedProducts.filter(p => p.productId !== productId);
    setSelectedProducts(newSelected);
    const newQuantities = {...productQuantities};
    delete newQuantities[productId];
    setProductQuantities(newQuantities);
    updateProductDetails(newSelected);
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity < 1) return;
    setProductQuantities({...productQuantities, [productId]: quantity});
    
    const updatedProducts = selectedProducts.map(p => 
      p.productId === productId ? {...p, quantity} : p
    );
    setSelectedProducts(updatedProducts);
    updateProductDetails(updatedProducts);
  };

  const updateProductDetails = (products: any[]) => {
    const productDetails = products.map(p => ({
      productId: p.productId,
      quantity: productQuantities[p.productId] || p.quantity
    }));
    setFormData(prev => ({
      ...prev,
      productDetails: JSON.stringify(productDetails)
    }));
  };

  const calculateTotalValue = () => {
    let total = 0;
    selectedProducts.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const price = parseFloat(product.discountPrice) || parseFloat(product.price) || 0;
        total += price * (productQuantities[product.id] || 1);
      }
    });
    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalValue = calculateTotalValue();
    
    // Use custom category if shown, otherwise use selected category
    const finalCategory = showCustomCategory ? customCategory : formData.category;
    
    const boxData = {
      ...formData,
      category: finalCategory,
      price: parseInt(formData.price) || 0,
      discountPrice: formData.discountPrice ? parseInt(formData.discountPrice) : undefined,
      stock: parseInt(formData.stock) || 1,
      totalValue: totalValue,
      expiryDate: formData.expiryDate || null,
      manufactureDate: formData.manufactureDate || null
    };

    onSave(boxData);
  };

  // Calculate suggested expiry date based on selected products
  const calculateSuggestedExpiryDate = () => {
    if (selectedProducts.length === 0) return null;
    
    let earliestExpiryDate: Date | null = null;
    
    selectedProducts.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product && product.expiryDate) {
        const expiryDate = new Date(product.expiryDate);
        if (!earliestExpiryDate || expiryDate < earliestExpiryDate) {
          earliestExpiryDate = expiryDate;
        }
      }
    });
    
    return earliestExpiryDate;
  };

  const suggestedExpiryDate = calculateSuggestedExpiryDate();

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {box ? 'Edit Mystery Box' : 'Create New Mystery Box'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Box Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., Surprise Bakery Box"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            {loadingCategories || categoriesLoading ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                <div className="animate-pulse flex items-center">
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {!showCustomCategory ? (
                    <div className="flex space-x-2">
                      <select
                        value={formData.category}
                        onChange={handleCategoryChange}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.cId} value={category.categoryName}>
                            {category.categoryName}
                          </option>
                        ))}
                        {/* <option value="custom">+ Add New Category</option> */}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={handleCategoryChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter custom category name"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomCategory(false);
                          setCustomCategory('');
                          setFormData({...formData, category: ''});
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        ← Back to category list
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {categories.length} categories available
                </p>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Describe your mystery box..."
          />
        </div>

        {/* Pricing & Stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (LKR) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="1999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Price (LKR)
            </label>
            <input
              type="number"
              min="0"
              value={formData.discountPrice}
              onChange={(e) => setFormData({...formData, discountPrice: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="1499"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="50"
            />
          </div>
        </div>

        {/* Expiry and Manufacture Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manufacture Date
            </label>
            <input
              type="date"
              value={formData.manufactureDate}
              onChange={(e) => setFormData({...formData, manufactureDate: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              When was this box created/packaged?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              {suggestedExpiryDate && (
                <span className="text-blue-600">
                  Suggested based on products: {suggestedExpiryDate.toLocaleDateString()}
                </span>
              )}
              {!suggestedExpiryDate && 'When should this box expire?'}
            </p>
          </div>
        </div>

        {/* Products Selection */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Select Products
            </h3>
            <div className="text-sm text-gray-500">
              {selectedProducts.length} product(s) selected
            </div>
          </div>

          {/* Search Products */}
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Search products by name or category..."
            />
          </div>

          {/* Selected Products */}
          {selectedProducts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">Selected Products:</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto p-2">
                {selectedProducts.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  if (!product) return null;
                  
                  return (
                    <div key={item.productId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            LKR {parseFloat(product.discountPrice) || parseFloat(product.price) || 0} each
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {product.expiryDate && `Expires: ${new Date(product.expiryDate).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.productId, (productQuantities[item.productId] || 1) - 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors text-sm"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm">
                            {productQuantities[item.productId] || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.productId, (productQuantities[item.productId] || 1) + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors text-sm"
                          >
                            +
                          </button>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(item.productId)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Total Value Display */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-blue-800 text-sm">Total Box Value:</div>
                    <div className="text-xs text-blue-600">
                      Customers get items worth LKR {calculateTotalValue()} for LKR {formData.price || 0}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-800">
                    LKR {calculateTotalValue()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Available Products List */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Available Products:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedProducts.find(p => p.productId === product.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                  onClick={() => handleAddProduct(product)}
                >
                  <div className="flex items-start space-x-2">
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm">{product.name}</div>
                      <div className="text-xs text-gray-600">{product.category}</div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="font-bold text-blue-600 text-sm">
                          LKR {parseFloat(product.discountPrice) || parseFloat(product.price) || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          Stock: {product.stock}
                        </div>
                      </div>
                      {product.expiryDate && (
                        <div className="text-xs text-red-500 mt-1">
                          Exp: {new Date(product.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredProducts.length === 0 && (
                <div className="col-span-3 text-center py-6 text-gray-500 text-sm">
                  No products found. Add products first to create mystery boxes.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={selectedProducts.length === 0}
            className={`px-5 py-2 rounded-lg transition-colors text-sm ${
              selectedProducts.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {box ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Component for viewing mystery box details
const MysteryBoxDetails = ({ box, onClose }: { box: any; onClose: () => void }) => {
  const { products } = useProductStore();
  const [boxProducts, setBoxProducts] = useState<any[]>([]);

  useEffect(() => {
    if (box && box.productDetails) {
      try {
        const productData = JSON.parse(box.productDetails);
        const enrichedProducts = productData.map((item: any) => {
          const product = products.find(p => p.id === item.productId);
          return {
            ...item,
            productName: product?.name || 'Unknown Product',
            price: product?.price || '0',
            discountPrice: product?.discountPrice,
            image: product?.image,
            expiryDate: product?.expiryDate,
            manufactureDate: product?.manufactureDate
          };
        });
        setBoxProducts(enrichedProducts);
      } catch (error) {
        console.error('Error parsing product details:', error);
      }
    }
  }, [box, products]);

  const calculateTotalValue = () => {
    return boxProducts.reduce((total, item) => {
      const price = parseFloat(item.discountPrice) || parseFloat(item.price) || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{box.name}</h2>
            <p className="text-gray-600 mt-1 text-sm">{box.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Box Information */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500">Price</div>
              <div className="text-lg font-bold text-blue-600">
                LKR {box.price}
                {box.discountPrice && (
                  <span className="text-xs text-gray-500 line-through ml-2">
                    LKR {box.discountPrice}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500">Stock</div>
              <div className="text-lg font-bold">{box.stock}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500">Category</div>
              <div className="font-medium text-sm">{box.category || 'Not specified'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500">Total Value</div>
              <div className="text-lg font-bold text-green-600">
                LKR {calculateTotalValue()}
              </div>
            </div>
          </div>

          {/* Date Information */}
          {(box.manufactureDate || box.expiryDate) && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Date Information</h3>
              <div className="grid grid-cols-2 gap-3">
                {box.manufactureDate && (
                  <div>
                    <div className="text-xs text-gray-500">Manufactured</div>
                    <div className="font-medium text-sm">{formatDate(box.manufactureDate)}</div>
                  </div>
                )}
                {box.expiryDate && (
                  <div>
                    <div className="text-xs text-gray-500">Expires</div>
                    <div className={`font-medium text-sm ${new Date(box.expiryDate) < new Date() ? 'text-red-600' : ''}`}>
                      {formatDate(box.expiryDate)}
                      {new Date(box.expiryDate) < new Date() && ' (Expired)'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Included Products */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Included Products ({boxProducts.length} items)</h3>
            <div className="space-y-2">
              {boxProducts.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-2">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.productName}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.productName}</div>
                      <div className="text-xs text-gray-500">
                        LKR {parseFloat(item.discountPrice) || parseFloat(item.price) || 0} each
                      </div>
                      {item.expiryDate && (
                        <div className="text-xs text-gray-400 mt-1">
                          Expires: {formatDate(item.expiryDate)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">Qty: {item.quantity}</div>
                    <div className="text-xs text-gray-500">
                      Total: LKR {(parseFloat(item.discountPrice) || parseFloat(item.price) || 0) * item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="border-t pt-4">
            <div className="text-xs text-gray-500 space-y-1">
              <div>Created: {new Date(box.createdAt).toLocaleDateString()}</div>
              <div>Sales: {box.sales || 0}</div>
              <div>Status: 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  box.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  box.status === 'SOLD_OUT' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {box.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Mystery Box Management Component
const MysteryBoxManager = () => {
  const { 
    sellerMysteryBoxes, 
    mysteryBoxLoading, 
    mysteryBoxError, 
    products,
    fetchSellerMysteryBoxes,
    addMysteryBox,
    updateMysteryBox,
    deleteMysteryBox,
    fetchMysteryBoxStats
  } = useProductStore();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingBox, setEditingBox] = useState<any>(null);
  const [selectedBox, setSelectedBox] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchSellerMysteryBoxes();
    loadStats();
  }, []);

  const loadStats = async () => {
    const store = useProductStore.getState();
    if (store.mysteryBoxStats) {
      setStats(store.mysteryBoxStats);
    }
  };

  const handleSaveMysteryBox = async (boxData: any) => {
    try {
      if (editingBox) {
        await updateMysteryBox(editingBox.id, boxData);
      } else {
        await addMysteryBox(boxData);
      }
      setShowFormModal(false);
      setEditingBox(null);
      fetchSellerMysteryBoxes();
      fetchMysteryBoxStats();
    } catch (error) {
      console.error('Error saving mystery box:', error);
    }
  };

  const handleDeleteBox = async (boxId: number) => {
    if (window.confirm('Are you sure you want to delete this mystery box?')) {
      try {
        await deleteMysteryBox(boxId);
        fetchSellerMysteryBoxes();
        fetchMysteryBoxStats();
      } catch (error) {
        console.error('Error deleting mystery box:', error);
      }
    }
  };

  const handleEditBox = (box: any) => {
    setEditingBox(box);
    setShowFormModal(true);
  };

  const handleViewBox = (box: any) => {
    setSelectedBox(box);
    setShowDetailsModal(true);
  };

  return (
    <div className="p-4 text-black">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 text-black">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mystery Box Manager</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Create surprise packages for your customers
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBox(null);
            setShowFormModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span>Create Box</span>
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-3 rounded-lg shadow border">
            <div className="text-xs text-gray-500">Total Boxes</div>
            <div className="text-lg font-bold">{stats.totalBoxes || 0}</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow border">
            <div className="text-xs text-gray-500">Total Sales</div>
            <div className="text-lg font-bold">{stats.totalSales || 0}</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow border">
            <div className="text-xs text-gray-500">Active Boxes</div>
            <div className="text-lg font-bold">
              {stats.statusCounts?.find((s: any) => s.status === 'ACTIVE')?._count?.id || 0}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow border">
            <div className="text-xs text-gray-500">Total Stock</div>
            <div className="text-lg font-bold">{stats.totalStock || 0}</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {mysteryBoxLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 text-sm">Loading mystery boxes...</p>
        </div>
      )}

      {/* Error State */}
      {mysteryBoxError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
          {mysteryBoxError}
        </div>
      )}

      {/* Mystery Boxes Grid */}
      {!mysteryBoxLoading && (
        <>
          {sellerMysteryBoxes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow border">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No mystery boxes yet
              </h3>
              <p className="mt-1 text-gray-600 text-sm max-w-md mx-auto">
                Create your first mystery box to surprise customers.
              </p>
              <button
                onClick={() => setShowFormModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Create Your First Box
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sellerMysteryBoxes.map((box) => {
                const isExpired = box.expiryDate && new Date(box.expiryDate) < new Date();
                
                return (
                  <div key={box.id} className="bg-white rounded-lg shadow border overflow-hidden hover:shadow-md transition-shadow duration-300">
                    {isExpired && (
                      <div className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1">
                        EXPIRED
                      </div>
                    )}
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{box.name}</h3>
                          <div className="flex items-center space-x-1">
                            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                              box.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              box.status === 'SOLD_OUT' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {box.status}
                            </span>
                            {box.category && (
                              <span className="text-xs text-gray-500 truncate">
                                {box.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            LKR {box.discountPrice}
                          </div>
                          {box.discountPrice && (
                            <div className="text-xs text-gray-500 line-through">
                              LKR {box.price}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                        {box.description}
                      </p>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Stock</div>
                          <div className="font-bold text-sm">{box.stock}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Sales</div>
                          <div className="font-bold text-sm">{box.sales || 0}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Items</div>
                          <div className="font-bold text-sm">{box.totalItems || 0}</div>
                        </div>
                        {/* <div className="text-center">
                          <div className="text-xs text-gray-500">Value</div>
                          <div className="font-bold text-green-600 text-sm">LKR {box.totalValue}</div>
                        </div> */}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-3 border-t">
                        <button
                          onClick={() => handleViewBox(box)}
                          className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-xs"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleEditBox(box)}
                          className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-xs"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteBox(box.id)}
                          className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors text-xs"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Mystery Box Modal */}
      {showFormModal && (
        <div className="text-black fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <MysteryBoxForm
            box={editingBox}
            onSave={handleSaveMysteryBox}
            onCancel={() => {
              setShowFormModal(false);
              setEditingBox(null);
            }}
            products={products}
          />
        </div>
      )}

      {/* View Mystery Box Details Modal */}
      {showDetailsModal && selectedBox && (
        <MysteryBoxDetails
          box={selectedBox}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBox(null);
          }}
        />
      )}
    </div>
  );
};

export default MysteryBoxManager;