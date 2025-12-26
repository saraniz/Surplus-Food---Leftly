import { create } from "zustand";
import api from "../libs/api";

// Product Image Interface
interface ProductImage {
  id: number;
  imageUrl: string;
  imageBase64?: string;
}

// Product Interface
interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
  discountPrice: string;
  shelfTime: number;
  stock: number;
  sales: number;
  images: ProductImage[];
  availableStock?: number;
  expiryDate?: string;
  manufactureDate?: string;
  ingredients?: string;
  seller_id?: number; // Add seller ID to product interface
  sellerId?: number; // Alternative field name

  productImg?: string;
  productImgBase64?: string;
  image?: string; // Base64 image field
}

// Seller Interface for product pages
interface Seller {
  seller_id: number;
  businessName: string;
  businessEmail: string;
  businessAddress: string;
  phoneNum: string;
  category: string;
  storeImg: string;
  coverImg: string;
  openingHours?: string;
  deliveryRadius?: string;
  website?: string;
  storeDescription?: string;
}

// ========== MYSTERY BOX INTERFACES ==========

// Mystery Box Product Item Interface
interface MysteryBoxProduct {
  productId: number;
  quantity: number;
  productName?: string;
  price?: string;
  discountPrice?: string;
  imageBase64?: string;
  category?: string;
}

// Mystery Box Interface
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
  productDetails: string; // JSON string of products
  totalValue: number;
  sellerId: number;
  createdAt: string;
  updatedAt: string;
  
  // Computed fields
  products?: MysteryBoxProduct[]; // Parsed product details (for seller view)
  totalItems?: number; // Total number of items in box
  seller?: { // Seller info for display
    seller_id: number;
    businessName: string;
    storeImg?: string;
    storeImgBase64?: string;
    businessAddress?: string;
    category?: string;
  };
}

// Mystery Box Statistics Interface
interface MysteryBoxStats {
  totalBoxes: number;
  totalSales: number;
  totalStock: number;
  statusCounts: Array<{
    status: string;
    _count: { id: number };
  }>;
}

// Mystery Box State Interface
interface MysteryBoxState {
  // Mystery Box state
  mysteryBoxes: MysteryBox[];
  sellerMysteryBoxes: MysteryBox[];
  singleMysteryBox: MysteryBox | null;
  mysteryBoxLoading: boolean;
  mysteryBoxError: string | null;
  mysteryBoxStats: MysteryBoxStats | null;
  
  // Mystery Box pagination
  totalMysteryBoxes: number;
  currentMysteryBoxPage: number;
  totalMysteryBoxPages: number;
  
  // Mystery Box Actions
  addMysteryBox: (boxData: {
    name: string;
    description: string;
    price: number;
    discountPrice?: number;
    category: string;
    stock: number;
    productDetails: string; // JSON string
    totalValue?: number;
  }) => Promise<void>;
  
  fetchMysteryBoxes: (options?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sellerId?: number;
    sortBy?: 'newest' | 'price_low' | 'price_high' | 'popular';
    page?: number;
    limit?: number;
  }) => Promise<void>;
  
  fetchSellerMysteryBoxes: (options?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  
  fetchMysteryBoxesBySeller: (sellerId: number, options?: {
    status?: string;
  }) => Promise<void>;
  
  fetchSingleMysteryBox: (id: number) => Promise<MysteryBox | null>;
  
  updateMysteryBox: (id: number, boxData: Partial<MysteryBox>) => Promise<void>;
  
  deleteMysteryBox: (id: number) => Promise<void>;
  
  fetchMysteryBoxStats: () => Promise<void>;
  
  clearMysteryBoxes: () => void;
  clearSingleMysteryBox: () => void;
}

// Combined State Interface
interface CombinedProductState extends ProductState, MysteryBoxState {}

interface ProductState {
  // Products state
  products: Product[];
  singleProduct: Product | null;
  loading: boolean;
  error: string | null;
  
  // Seller state (for the product being viewed)
  productSeller: Seller | null;
  loadingSeller: boolean;
  sellerError: string | null;
  
  recentPurchases: any[];
  totalSales: number;
  
  // Product Actions
  addProduct: (formData: FormData) => Promise<void>;
  fetchProducts: (id?: number) => Promise<void>;
  updateProductDetails: (formData: FormData) => Promise<void>;
  deleteProducts: (id: number) => Promise<void>;
  fetchAllProducts: () => Promise<void>;
  fetchSingleProduct: (productId: number) => Promise<Product | null>;
  updateStockAfterPurchase: (purchasedItems: {productId: number, quantity: number}[]) => Promise<void>;
  fetchProductSales: () => Promise<void>;
  getAvailableStock: (productId: number) => number;
  recordSale: (productId: number, quantity: number, amount: number) => Promise<void>;
  
  // Seller Actions (for product pages)
  fetchProductSeller: (sellerId: number) => Promise<void>;
  clearProductSeller: () => void;
  clearSingleProduct: () => void;
}

export const useProductStore = create<CombinedProductState>((set, get) => ({
  // ========== INITIAL VALUES FOR PRODUCTS ==========
  products: [],
  singleProduct: null,
  loading: false,
  error: null,
  
  productSeller: null,
  loadingSeller: false,
  sellerError: null,
  
  recentPurchases: [],
  totalSales: 0,

  // ========== INITIAL VALUES FOR MYSTERY BOXES ==========
  mysteryBoxes: [],
  sellerMysteryBoxes: [],
  singleMysteryBox: null,
  mysteryBoxLoading: false,
  mysteryBoxError: null,
  mysteryBoxStats: null,
  
  totalMysteryBoxes: 0,
  currentMysteryBoxPage: 1,
  totalMysteryBoxPages: 1,

  // ========== PRODUCT METHODS (Existing - KEEP AS IS) ==========
  addProduct: async (formData: FormData) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem("token");

      const res = await api.post("/api/product/addproduct", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const p = res.data.newProduct;
      
      const mappedProduct: Product = {
        id: p.product_id,
        name: p.productName,
        description: p.productDescription,
        category: p.category,
        price: p.price,
        discountPrice: p.discountPrice,
        shelfTime: p.shelfTime,
        stock: p.stock,
        sales: p.sales || 0,
        images: p.images || [],
        availableStock: p.stock,
        expiryDate: p.expiryDate,
        manufactureDate: p.manufactureDate,
        ingredients: p.ingredients,
        seller_id: p.seller_id,
      };

      set((state) => ({
        loading: false,
        products: [...state.products, mappedProduct],
      }));
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Product adding failed",
        loading: false,
      });
    }
  },

  fetchProducts: async (id?: number) => {
    console.log("Fetching products for seller:", id);
    try {
      set({ loading: true, error: null });

      let res;

      if (id) {
        res = await api.get(`/api/product/fetchproducts/${id}`);
      } else {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        res = await api.get("/api/product/fetchproducts", {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      console.log("Products response:", res.data);

      const mappedProducts: Product[] = res.data.products.map((p: any) => ({
        id: p.product_id,
        name: p.productName,
        description: p.productDescription || "",
        category: p.category,
        price: p.price,
        discountPrice: p.discountPrice || "",
        shelfTime: p.shelfTime,
        stock: p.stock,
        sales: p.sales || 0,
        images: p.images || [],
        availableStock: p.stock,
        expiryDate: p.expiryDate,
        manufactureDate: p.manufactureDate,
        ingredients: p.ingredients,
        seller_id: p.seller_id,
        sellerId: p.sellerId,
        image: p.productImgBase64 || (p.images && p.images.length > 0 ? p.images[0].imageBase64 : null),
      }));

      set({ loading: false, products: mappedProducts });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Products not fetched",
        loading: false,
      });
    }
  },

  updateProductDetails: async (formData: FormData) => {
    console.log("Updating product with form data");

    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      const res = await api.post("/api/product/updateproducts", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updated = res.data.updateProduct;
      console.log("Updated product response:", updated);

      const updatedMapped: Product = {
        id: updated.product_id,
        name: updated.productName,
        description: updated.productDescription,
        category: updated.category,
        price: updated.price,
        discountPrice: updated.discountPrice,
        shelfTime: updated.shelfTime,
        stock: updated.stock,
        sales: updated.sales || 0,
        images: updated.images || [],
        availableStock: updated.stock,
        expiryDate: updated.expiryDate,
        manufactureDate: updated.manufactureDate,
        ingredients: updated.ingredients,
        seller_id: updated.seller_id,
        sellerId: updated.sellerId,
        image: updated.images && updated.images.length > 0 ? updated.images[0].imageBase64 : null,
      };

      set((state) => ({
        loading: false,
        products: state.products.map((p) =>
          p.id === updatedMapped.id ? updatedMapped : p
        ),
      }));
    } catch (err: any) {
      console.error("Update product error:", err);
      set({
        loading: false,
        error:
          err.response?.data?.message ||
          err.message ||
          "Failed to update product",
      });
    }
  },

  deleteProducts: async (id: number) => {
    console.log("Deleting product id: ", id);

    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token found");
      }

      const res = await api.delete("/api/product/deleteproduct", {
        headers: { Authorization: `Bearer ${token}` },
        data: { productId: id },
      });

      set((state) => ({
        loading: false,
        products: state.products.filter((p) => p.id !== id),
      }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.message });
    }
  },

  fetchAllProducts: async () => {
    try {
      set({ loading: true, error: null });

      const res = await api.get("/api/product/fetchallproducts");

      console.log("All products response:", res.data);

      const mappedProducts: Product[] = res.data.products.map((p: any) => ({
        id: p.product_id,
        name: p.productName,
        description: p.productDescription || "",
        category: p.category,
        price: p.price,
        discountPrice: p.discountPrice || "",
        shelfTime: p.shelfTime,
        stock: p.stock,
        sales: p.sales || 0,
        images: p.images || [],
        availableStock: p.stock,
        expiryDate: p.expiryDate,
        manufactureDate: p.manufactureDate,
        ingredients: p.ingredients,
        seller_id: p.seller_id,
        sellerId: p.sellerId,
        image: p.productImgBase64 || (p.images && p.images.length > 0 ? p.images[0].imageBase64 : null),
      }));

      set({ loading: false, products: mappedProducts });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Products not fetched",
        loading: false,
      });
    }
  },

  fetchSingleProduct: async (productId: number): Promise<Product | null> => {
    console.log("Fetching single product ID: ", productId);

    try {
      set({ loading: true, error: null });

      const res = await api.get(`/api/product/fetchsingleproduct/${productId}`);
      console.log("Single product API response:", res.data);

      if (!res.data || !res.data.product) {
        console.error("No product data in response");
        set({ 
          loading: false, 
          singleProduct: null,
          error: "Product not found" 
        });
        return null;
      }

      const p = res.data.product;
      console.log("Product data received:", p);

      const mappedProduct: Product = {
        id: p.product_id,
        name: p.productName,
        description: p.productDescription || "",
        category: p.category,
        price: p.price,
        discountPrice: p.discountPrice || "",
        shelfTime: p.shelfTime,
        stock: p.stock,
        sales: p.sales || 0,
        images: p.images || [],
        availableStock: p.stock,
        expiryDate: p.expiryDate,
        manufactureDate: p.manufactureDate,
        ingredients: p.ingredients,
        seller_id: p.seller_id,
        sellerId: p.sellerId,
        image: p.productImgBase64 || (p.images && p.images.length > 0 ? p.images[0].imageBase64 : null),
      };

      console.log("Mapped product:", mappedProduct);

      // If the API returns store data with the product, fetch it separately
      if (p.seller_id || p.sellerId) {
        const sellerId = p.seller_id || p.sellerId;
        console.log("Product has seller ID, will fetch seller details:", sellerId);
        // We'll fetch seller details separately in the component
      }

      set({ 
        loading: false, 
        singleProduct: mappedProduct, 
        error: null 
      });
      
      return mappedProduct;
    } catch (err: any) {
      console.error("Error in fetchSingleProduct:", err);
      const errorMessage = err.response?.data?.message || err?.message || "Failed to fetch product";
      set({ 
        loading: false, 
        error: errorMessage,
        singleProduct: null 
      });
      return null;
    }
  },

  updateStockAfterPurchase: async (purchasedItems: {productId: number, quantity: number}[]) => {
    try {
      set({ loading: true, error: null });
      
      console.log("Updating stock for purchased items:", purchasedItems);
      
      set((state) => {
        const updatedProducts = state.products.map((product) => {
          const purchasedItem = purchasedItems.find(item => item.productId === product.id);
          if (purchasedItem) {
            const newStock = product.stock - purchasedItem.quantity;
            const newSales = product.sales + purchasedItem.quantity;
            
            return {
              ...product,
              stock: newStock,
              sales: newSales,
              availableStock: newStock
            };
          }
          return product;
        });
        
        return { products: updatedProducts };
      });
      
      const token = localStorage.getItem("token");
      
      for (const item of purchasedItems) {
        try {
          await api.post("/api/product/update-stock-sales", {
            productId: item.productId,
            quantitySold: item.quantity
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) {
          console.error(`Failed to update product ${item.productId}:`, err);
        }
      }
      
      set((state) => ({
        loading: false,
        recentPurchases: [
          {
            items: purchasedItems,
            timestamp: new Date().toISOString(),
            totalItems: purchasedItems.reduce((sum, item) => sum + item.quantity, 0)
          },
          ...state.recentPurchases.slice(0, 9)
        ]
      }));
      
      console.log("Stock and sales updated successfully");
      
    } catch (err: any) {
      console.error("Error updating stock after purchase:", err);
      set({ loading: false, error: err.message || "Failed to update stock" });
    }
  },

  fetchProductSales: async () => {
    try {
      set({ loading: true, error: null });
      
      const token = localStorage.getItem("token");
      const res = await api.get("/api/product/sales", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.products) {
        set((state) => {
          const updatedProducts = state.products.map(product => {
            const backendProduct = res.data.products.find((p: any) => p.product_id === product.id);
            if (backendProduct) {
              return {
                ...product,
                stock: backendProduct.stock,
                sales: backendProduct.sales || 0,
                availableStock: backendProduct.stock
              };
            }
            return product;
          });
          
          return { 
            products: updatedProducts,
            totalSales: res.data.totalSales || 0,
            loading: false 
          };
        });
      }
      
    } catch (err: any) {
      console.error("Error fetching sales:", err);
      set({ loading: false, error: err.message || "Failed to fetch sales" });
    }
  },

  getAvailableStock: (productId: number) => {
    const state = get();
    const product = state.products.find(p => p.id === productId);
    
    if (!product) return 0;
    
    return product.availableStock || product.stock;
  },

  recordSale: async (productId: number, quantity: number, amount: number) => {
    try {
      const token = localStorage.getItem("token");
      
      await api.post("/api/product/record-sale", {
        productId,
        quantity,
        amount,
        saleDate: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set((state) => {
        const updatedProducts = state.products.map(product => {
          if (product.id === productId) {
            return {
              ...product,
              sales: product.sales + quantity,
              stock: product.stock - quantity,
              availableStock: product.availableStock ? product.availableStock - quantity : product.stock - quantity
            };
          }
          return product;
        });
        
        return { 
          products: updatedProducts,
          totalSales: state.totalSales + amount 
        };
      });
      
    } catch (err) {
      console.error("Error recording sale:", err);
    }
  },

  // ========== SELLER METHODS (for product pages) ==========
  fetchProductSeller: async (sellerId: number) => {
    console.log("Fetching seller details for ID:", sellerId);

    try {
      set({ loadingSeller: true, sellerError: null });

      const res = await api.get(`/api/seller/getdetails/${sellerId}`);
      
      console.log("Seller details response:", res.data);

      if (res.data && res.data.seller) {
        const sellerData = res.data.seller;
        
        const mappedSeller: Seller = {
          seller_id: sellerData.seller_id,
          businessName: sellerData.businessName,
          businessEmail: sellerData.businessEmail,
          businessAddress: sellerData.businessAddress,
          phoneNum: sellerData.phoneNum,
          category: sellerData.category,
          storeImg: sellerData.storeImg,
          coverImg: sellerData.coverImg,
          openingHours: sellerData.openingHours,
          deliveryRadius: sellerData.deliveryRadius,
          website: sellerData.website,
          storeDescription: sellerData.storeDescription,
        };
        
        set({ 
          productSeller: mappedSeller, 
          loadingSeller: false 
        });
      } else {
        throw new Error("Invalid response format");
      }

    } catch (err: any) {
      console.error("Error fetching seller:", err.response?.data || err);
      set({
        sellerError:
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch seller details",
        loadingSeller: false,
      });
    }
  },

  clearProductSeller: () => {
    set({ 
      productSeller: null, 
      sellerError: null,
      loadingSeller: false 
    });
  },

  clearSingleProduct: () => {
    set({ 
      singleProduct: null, 
      error: null,
      loading: false 
    });
  },

  addMysteryBox: async (boxData: {
    name: string;
    description: string;
    price: number;
    discountPrice?: number;
    category: string;
    stock: number;
    productDetails: string;
    totalValue?: number;
  }) => {
    try {
      set({ mysteryBoxLoading: true, mysteryBoxError: null });
      const token = localStorage.getItem("token");

      const res = await api.post("/api/product/add-mystery-box", boxData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const newBox = res.data.mysteryBox;
      
      set((state) => ({
        mysteryBoxLoading: false,
        sellerMysteryBoxes: [...state.sellerMysteryBoxes, newBox],
      }));
      
    } catch (err: any) {
      set({
        mysteryBoxError: err.response?.data?.message || "Mystery box creation failed",
        mysteryBoxLoading: false,
      });
      throw err;
    }
  },

  fetchMysteryBoxes: async (options?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sellerId?: number;
    sortBy?: 'newest' | 'price_low' | 'price_high' | 'popular';
    page?: number;
    limit?: number;
  }) => {
    try {
      set({ mysteryBoxLoading: true, mysteryBoxError: null });

      const params: any = {};
      if (options?.category) params.category = options.category;
      if (options?.minPrice) params.minPrice = options.minPrice;
      if (options?.maxPrice) params.maxPrice = options.maxPrice;
      if (options?.sellerId) params.sellerId = options.sellerId;
      if (options?.sortBy) params.sortBy = options.sortBy;
      if (options?.page) params.page = options.page;
      if (options?.limit) params.limit = options.limit;

      const res = await api.get("/api/product/mystery-boxes", { params });
      
      const boxes = res.data.mysteryBoxes || [];
      
      set({
        mysteryBoxLoading: false,
        mysteryBoxes: boxes,
        totalMysteryBoxes: res.data.totalCount || 0,
        currentMysteryBoxPage: res.data.currentPage || 1,
        totalMysteryBoxPages: res.data.totalPages || 1,
      });
      
    } catch (err: any) {
      set({
        mysteryBoxError: err.response?.data?.message || "Failed to fetch mystery boxes",
        mysteryBoxLoading: false,
      });
    }
  },

  fetchSellerMysteryBoxes: async (options?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      set({ mysteryBoxLoading: true, mysteryBoxError: null });
      const token = localStorage.getItem("token");

      const params: any = {};
      if (options?.status) params.status = options.status;
      if (options?.page) params.page = options.page;
      if (options?.limit) params.limit = options.limit;

      const res = await api.get("/api/product/seller-mystery-boxes", {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      const boxes = res.data.mysteryBoxes || [];
      
      // Parse productDetails for seller view
      const parsedBoxes = boxes.map((box: any) => {
        let products: MysteryBoxProduct[] = [];
        let totalItems = 0;
        
        try {
          const productArray = JSON.parse(box.productDetails);
          products = productArray || [];
          totalItems = products.reduce((sum: number, product: any) => 
            sum + (product.quantity || 1), 0);
        } catch (err) {
          console.error("Error parsing productDetails:", err);
        }
        
        return {
          ...box,
          products,
          totalItems
        };
      });
      
      set({
        mysteryBoxLoading: false,
        sellerMysteryBoxes: parsedBoxes,
        totalMysteryBoxes: res.data.totalCount || 0,
        currentMysteryBoxPage: res.data.currentPage || 1,
        totalMysteryBoxPages: res.data.totalPages || 1,
      });
      
    } catch (err: any) {
      set({
        mysteryBoxError: err.response?.data?.message || "Failed to fetch seller mystery boxes",
        mysteryBoxLoading: false,
      });
    }
  },

  fetchMysteryBoxesBySeller: async (sellerId: number, options?: {
    status?: string;
  }) => {
    try {
      set({ mysteryBoxLoading: true, mysteryBoxError: null });

      const params: any = {};
      if (options?.status) params.status = options.status;

      // Call the API endpoint for fetching mystery boxes by seller ID
      const res = await api.get(`/api/product/seller/${sellerId}`, { params });
      console.log("MS",res)
      
      const boxes = res.data.mysteryBoxes || [];
      
      // Parse productDetails for display
      const parsedBoxes = boxes.map((box: any) => {
        let products: MysteryBoxProduct[] = [];
        let totalItems = 0;
        let discountPercentage = 0;
        
        try {
          if (box.productDetails) {
            products = JSON.parse(box.productDetails);
            totalItems = products.reduce((sum: number, product: any) => 
              sum + (product.quantity || 1), 0);
          }
        } catch (err) {
          console.error("Error parsing productDetails:", err);
        }
        
        // Calculate discount percentage
        if (box.discountPrice && box.totalValue) {
          discountPercentage = Math.round(((box.totalValue - box.discountPrice) / box.totalValue) * 100);
        } else if (box.discountPrice && box.price) {
          discountPercentage = Math.round(((box.price - box.discountPrice) / box.price) * 100);
        }
        
        return {
          ...box,
          products,
          totalItems,
          discountPercentage,
          price: parseFloat(box.price),
          discountPrice: box.discountPrice ? parseFloat(box.discountPrice) : null,
          totalValue: box.totalValue ? parseFloat(box.totalValue) : (parseFloat(box.price) * 2)
        };
      });

      set({
        mysteryBoxLoading: false,
        mysteryBoxes: parsedBoxes,
        totalMysteryBoxes: parsedBoxes.length,
      });
      
    } catch (err: any) {
      set({
        mysteryBoxError: err.response?.data?.message || "Failed to fetch seller's mystery boxes",
        mysteryBoxLoading: false,
      });
    }
  },

  fetchSingleMysteryBox: async (id: number): Promise<MysteryBox | null> => {
    try {
      set({ mysteryBoxLoading: true, mysteryBoxError: null });

      const token = localStorage.getItem("token");
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await api.get(`/api/product/mystery-box/${id}`, { headers });
      
      if (!res.data || !res.data.mysteryBox) {
        console.error("No mystery box data in response");
        set({ 
          mysteryBoxLoading: false, 
          singleMysteryBox: null,
          mysteryBoxError: "Mystery box not found" 
        });
        return null;
      }

      const box = res.data.mysteryBox;
      
      // Parse productDetails if it exists (for seller view)
      let products: MysteryBoxProduct[] = [];
      let totalItems = 0;
      
      if (box.products) {
        // If API already parsed products
        products = box.products;
        totalItems = products.reduce((sum: number, product: any) => 
          sum + (product.quantity || 1), 0);
      } else if (box.productDetails) {
        // Parse from JSON string
        try {
          const productArray = JSON.parse(box.productDetails);
          products = productArray || [];
          totalItems = products.reduce((sum: number, product: any) => 
            sum + (product.quantity || 1), 0);
        } catch (err) {
          console.error("Error parsing productDetails:", err);
        }
      }
      
      const mysteryBox: MysteryBox = {
        ...box,
        products,
        totalItems
      };

      set({ 
        mysteryBoxLoading: false, 
        singleMysteryBox: mysteryBox, 
        mysteryBoxError: null 
      });
      
      return mysteryBox;
    } catch (err: any) {
      console.error("Error in fetchSingleMysteryBox:", err);
      const errorMessage = err.response?.data?.message || err?.message || "Failed to fetch mystery box";
      set({ 
        mysteryBoxLoading: false, 
        mysteryBoxError: errorMessage,
        singleMysteryBox: null 
      });
      return null;
    }
  },

  updateMysteryBox: async (id: number, boxData: Partial<MysteryBox>) => {
    try {
      set({ mysteryBoxLoading: true, mysteryBoxError: null });
      const token = localStorage.getItem("token");

      // Convert products array back to JSON string if provided
      const dataToSend = { ...boxData };
      if (boxData.products) {
        dataToSend.productDetails = JSON.stringify(boxData.products);
        delete dataToSend.products;
      }

      const res = await api.put("/api/product/update-mystery-box", 
        { id, ...dataToSend }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const updatedBox = res.data.mysteryBox;
      
      // Parse products for seller view
      let products: MysteryBoxProduct[] = [];
      let totalItems = 0;
      
      if (updatedBox.products) {
        products = updatedBox.products;
      } else if (updatedBox.productDetails) {
        try {
          const productArray = JSON.parse(updatedBox.productDetails);
          products = productArray || [];
        } catch (err) {
          console.error("Error parsing productDetails:", err);
        }
      }
      
      totalItems = products.reduce((sum: number, product: any) => 
        sum + (product.quantity || 1), 0);
      
      const parsedBox = {
        ...updatedBox,
        products,
        totalItems
      };

      set((state) => ({
        mysteryBoxLoading: false,
        sellerMysteryBoxes: state.sellerMysteryBoxes.map((box) =>
          box.id === id ? parsedBox : box
        ),
        // Also update in mysteryBoxes array if it exists there
        mysteryBoxes: state.mysteryBoxes.map((box) =>
          box.id === id ? parsedBox : box
        ),
        // Update single mystery box if it's the one being viewed
        singleMysteryBox: state.singleMysteryBox?.id === id ? parsedBox : state.singleMysteryBox,
      }));
      
    } catch (err: any) {
      set({
        mysteryBoxError: err.response?.data?.message || "Failed to update mystery box",
        mysteryBoxLoading: false,
      });
      throw err;
    }
  },

  deleteMysteryBox: async (id: number) => {
    try {
      set({ mysteryBoxLoading: true, mysteryBoxError: null });
      const token = localStorage.getItem("token");

      await api.delete("/api/product/delete-mystery-box", {
        headers: { Authorization: `Bearer ${token}` },
        data: { id },
      });

      set((state) => ({
        mysteryBoxLoading: false,
        sellerMysteryBoxes: state.sellerMysteryBoxes.filter((box) => box.id !== id),
        mysteryBoxes: state.mysteryBoxes.filter((box) => box.id !== id),
        singleMysteryBox: state.singleMysteryBox?.id === id ? null : state.singleMysteryBox,
      }));
      
    } catch (err: any) {
      set({
        mysteryBoxError: err.response?.data?.message || "Failed to delete mystery box",
        mysteryBoxLoading: false,
      });
      throw err;
    }
  },

  fetchMysteryBoxStats: async () => {
    try {
      set({ mysteryBoxLoading: true, mysteryBoxError: null });
      const token = localStorage.getItem("token");

      const res = await api.get("/api/product/mystery-box-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      set({
        mysteryBoxLoading: false,
        mysteryBoxStats: res.data.stats || null,
      });
      
    } catch (err: any) {
      set({
        mysteryBoxError: err.response?.data?.message || "Failed to fetch mystery box stats",
        mysteryBoxLoading: false,
      });
    }
  },

  clearMysteryBoxes: () => {
    set({ 
      mysteryBoxes: [],
      singleMysteryBox: null,
      mysteryBoxError: null,
      mysteryBoxLoading: false,
      totalMysteryBoxes: 0,
      currentMysteryBoxPage: 1,
      totalMysteryBoxPages: 1,
    });
  },

  clearSingleMysteryBox: () => {
    set({ 
      singleMysteryBox: null,
      mysteryBoxError: null,
      mysteryBoxLoading: false,
    });
  },
}));