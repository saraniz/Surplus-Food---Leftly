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

export const useProductStore = create<ProductState>((set, get) => ({
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

}));