import { create } from 'zustand';
import api from '../libs/api';
import { 
  getSessionCart, 
  saveSessionCart, 
  clearSessionCart,
  addToSessionCart,
  removeFromSessionCart,
  updateSessionCartQuantity 
} from '../utils/sessionCart';

interface Cart {
  id: number;
  cartItems: CartItem[];
}

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product?: any;
}

interface CartState {
  cart: Cart | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  pendingOperations: Set<number>;
  isFetching: boolean;

  addToCart: (productId: number, quantity: number, productInfo?: any) => Promise<void>;
  fetchCart: (options?: { silent?: boolean }) => Promise<void>;
  deleteCart: (productId: number) => Promise<void>;
  updateCartQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => void;
  mergeSessionCart: () => Promise<void>;
}

// Helper function to validate token
const validateToken = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = Date.now() >= payload.exp * 1000;
    const isSeller = payload.role === "seller";
    
    return !isExpired && !isSeller;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    return false;
  }
};

// Helper function to transform session cart items
const transformSessionCartItems = (sessionItems: any[]) => {
  return sessionItems.map(item => {
    const isMysteryBox = 
      item.productId === 999999 || 
      item.productName?.toLowerCase().includes("mystery") ||
      item.productName?.toLowerCase().includes("surprise") ||
      item.productName?.toLowerCase().includes("combo box") ||
      item.productName?.toLowerCase().includes("saver box");

    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        product_id: item.productId,
        productName: item.productName || (isMysteryBox ? "Mystery Box" : "Product"),
        name: item.productName || (isMysteryBox ? "Mystery Box" : "Product"),
        price: item.productPrice || 0,
        discountPrice: item.productPrice || 0,
        productImg: item.productImage,
        images: item.productImage ? [{ imageUrl: item.productImage }] : [],
        isMysteryBox: isMysteryBox,
        ...(item.mysteryBoxId && { mysteryBoxId: item.mysteryBoxId })
      }
    };
  });
};

export const useCartState = create<CartState>((set, get) => ({
  cart: null,
  token: typeof window !== 'undefined' ? localStorage.getItem("token") : null,
  loading: false,
  error: null,
  pendingOperations: new Set<number>(),
  isFetching: false,

  addToCart: async (productId, quantity, productInfo) => {
    try {
      console.log("=== START addToCart ===");
      console.log("Parameters:", { productId, quantity, productInfo });
      
      // Detect if it's a mystery box
      const isMysteryBox = 
        productInfo?.isMysteryBox === true || 
        productId === 999999 ||
        productInfo?.name?.toLowerCase().includes("mystery") || 
        productInfo?.name?.toLowerCase().includes("surprise") ||
        productInfo?.name?.toLowerCase().includes("combo box") ||
        productInfo?.name?.toLowerCase().includes("saver box");
      
      console.log("🔍 Mystery Box Detection:", {
        isMysteryBox,
        productId,
        productName: productInfo?.name
      });
      
      let finalProductId = productId;
      let finalProductInfo = productInfo || {};
      
      if (isMysteryBox) {
        console.log("🎁 MYSTERY BOX DETECTED - Using ID 999999");
        finalProductId = 999999;
        
        finalProductInfo = {
          ...finalProductInfo,
          name: finalProductInfo.name || "Mystery Box",
          price: finalProductInfo.price || 299,
          discountPrice: finalProductInfo.discountPrice || finalProductInfo.price || 299,
          description: finalProductInfo.description || "A special mystery item!",
          images: finalProductInfo.images || [{ 
            imageUrl: "https://cdn.vectorstock.com/i/500p/04/67/mystery-prize-box-lucky-surprise-gift-vector-45060467.jpg"
          }],
          productImg: finalProductInfo.productImg || "https://cdn.vectorstock.com/i/500p/04/67/mystery-prize-box-lucky-surprise-gift-vector-45060467.jpg",
          image: finalProductInfo.image || "https://cdn.vectorstock.com/i/500p/04/67/mystery-prize-box-lucky-surprise-gift-vector-45060467.jpg",
          isMysteryBox: true,
          ...(finalProductInfo.mysteryBoxId && { mysteryBoxId: finalProductInfo.mysteryBoxId })
        };
      }
      
      // Check if operation is already in progress
      const { pendingOperations } = get();
      if (pendingOperations.has(finalProductId)) {
        console.log(`⚠️ Operation already in progress for product ${finalProductId}`);
        return;
      }
      
      // Add to pending operations
      set((state) => ({
        pendingOperations: new Set(state.pendingOperations).add(finalProductId),
        loading: true,
        error: null
      }));
      
      // 1. Always save to session storage first
      console.log("💾 Saving to session storage...");
      const sessionCartItems = addToSessionCart(finalProductId, quantity, {
        name: finalProductInfo.name || "Unknown Product",
        price: finalProductInfo.price || 0,
        discountPrice: finalProductInfo.discountPrice || finalProductInfo.price || 0,
        description: finalProductInfo.description || "",
        image: finalProductInfo.images?.[0]?.imageUrl || 
              finalProductInfo.productImg || 
              finalProductInfo.image ||
              "https://cdn.vectorstock.com/i/500p/04/67/mystery-prize-box-lucky-surprise-gift-vector-45060467.jpg",
        isMysteryBox: isMysteryBox,
        ...(finalProductInfo.mysteryBoxId && { mysteryBoxId: finalProductInfo.mysteryBoxId })
      });
      
      // 2. Update local state immediately (for fast UI response)
      const transformedCart = { 
        id: 0, 
        cartItems: transformSessionCartItems(sessionCartItems)
      };
      
      set({ 
        cart: transformedCart, 
        loading: false
      });
      
      // 3. Check if we should sync with backend
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      if (!token) {
        console.log("=== END addToCart (GUEST MODE) ===");
        // Remove from pending operations - FIXED VERSION
        set((state) => {
          const newPending = new Set(state.pendingOperations);
          newPending.delete(finalProductId);
          return { pendingOperations: newPending };
        });
        return;
      }
      
      // 4. Validate token
      const tokenIsValid = validateToken(token);
      if (!tokenIsValid) {
        console.log("=== END addToCart (INVALID TOKEN) ===");
        // Remove from pending operations - FIXED VERSION
        set((state) => {
          const newPending = new Set(state.pendingOperations);
          newPending.delete(finalProductId);
          return { pendingOperations: newPending };
        });
        return;
      }
      
      // 5. Sync with backend in BACKGROUND (without triggering fetchCart)
      console.log("📡 Syncing with backend in background...");
      const syncWithBackend = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // Shorter timeout
        
        try {
          const res = await api.post(
            "/api/cart/addtocart",
            { 
              productId: finalProductId,
              quantity,
              isMysteryBox: isMysteryBox,
              ...(finalProductInfo.mysteryBoxId && { mysteryBoxId: finalProductInfo.mysteryBoxId }),
              productInfo: finalProductInfo
            },
            { 
              signal: controller.signal,
              headers: {
                'X-No-Fetch': 'true' // Tell backend not to trigger fetch
              }
            }
          );
          
          clearTimeout(timeoutId);
          console.log("✅ Backend sync successful:", res.data);
          
          // Only update if backend returned cart data (optional)
          if (res.data.cart) {
            console.log("🔄 Updating cart with backend data");
            set({ cart: res.data.cart });
          }
          
        } catch (apiError: any) {
          clearTimeout(timeoutId);
          
          if (apiError.name !== 'AbortError') {
            console.error("❌ Backend sync failed:", apiError);
            
            if (apiError?.response?.status === 401 || apiError?.response?.status === 403) {
              console.log("⚠️ Auth error, removing token");
              localStorage.removeItem("token");
              localStorage.removeItem("role");
            }
            // Don't set error state - we already have cart in session
          }
        }
      };
      
      // Start background sync and clean up
      syncWithBackend().finally(() => {
        // Remove from pending operations - FIXED VERSION
        set((state) => {
          const newPending = new Set(state.pendingOperations);
          newPending.delete(finalProductId);
          return { pendingOperations: newPending };
        });
      });
      
      console.log("=== END addToCart ===");
      
    } catch (err: any) {
      console.error("General error in addToCart:", err);
      // Remove from pending operations - FIXED VERSION
      set((state) => {
        const newPending = new Set(state.pendingOperations);
        newPending.delete(productId);
        return { pendingOperations: newPending, loading: false, error: err?.message || "Failed to add product to cart" };
      });
      throw err;
    }
  },

  fetchCart: async (options?: { silent?: boolean }) => {
    try {
      // Track if we're already fetching
      const state = get();
      if (state.isFetching && !options?.silent) {
        console.log("⚠️ Already fetching cart, skipping...");
        return;
      }
      
      if (!options?.silent) {
        set({ loading: true, error: null, isFetching: true });
      }
      
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      let shouldUseGuestMode = !token;
      
      // Check token validity
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const isSeller = payload.role === "seller";
          const isExpired = Date.now() >= payload.exp * 1000;
          
          if (isSeller || isExpired) {
            shouldUseGuestMode = true;
            console.log(`Using guest cart for fetch because: ${isSeller ? 'seller' : 'expired token'}`);
            
            if (isExpired) {
              localStorage.removeItem("token");
              localStorage.removeItem("role");
            }
          }
        } catch (e) {
          shouldUseGuestMode = true;
          localStorage.removeItem("token");
          localStorage.removeItem("role");
        }
      }
      
      // Use guest/session storage
      if (shouldUseGuestMode) {
        console.log("🛒 FETCHING GUEST CART FROM SESSION STORAGE");
        const sessionCartItems = getSessionCart();
        const transformedCartItems = transformSessionCartItems(sessionCartItems);
        
        if (!options?.silent) {
          set({
            cart: { 
              id: 0, 
              cartItems: transformedCartItems
            },
            loading: false,
            isFetching: false
          });
        }
        return;
      }

      // Only authenticated CUSTOMERS reach here
      console.log("📡 Fetching authenticated user cart from API");
      
      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log("⚠️ Fetch cart API timeout, using session storage");
        
        // Fallback to session storage
        const sessionCartItems = getSessionCart();
        const transformedCartItems = transformSessionCartItems(sessionCartItems);
        
        if (!options?.silent) {
          set({
            cart: { 
              id: 0, 
              cartItems: transformedCartItems
            },
            loading: false,
            error: "Connection timeout",
            isFetching: false
          });
        }
      }, 5000);
      
      try {
        const res = await api.get("/api/cart/fetchcart", {
          signal: controller.signal,
          headers: {
            'X-Silent-Fetch': options?.silent ? 'true' : 'false'
          }
        });
        
        clearTimeout(timeoutId);
        
        console.log("✅ Backend cart response:", res.data);
        
        if (!options?.silent) {
          set({
            cart: res.data.cart,
            loading: false,
            isFetching: false
          });
        }
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          if (!options?.silent) {
            set({ isFetching: false });
          }
          return;
        }
        
        if (!options?.silent) {
          if (fetchError?.response?.status === 401) {
            console.log("Auth error, switching to guest cart");
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            
            const sessionCartItems = getSessionCart();
            const transformedCartItems = transformSessionCartItems(sessionCartItems);
            
            set({
              cart: { 
                id: 0, 
                cartItems: transformedCartItems
              },
              loading: false,
              error: null,
              isFetching: false
            });
          } else {
            set({
              loading: false,
              error: fetchError?.response?.data?.message || "Failed to fetch cart",
              isFetching: false
            });
          }
        }
      }
      
    } catch (err: any) {
      console.error("Fetch cart error:", err);
      
      if (!options?.silent) {
        set({
          loading: false,
          error: err?.response?.data?.message || "Failed to fetch cart",
          isFetching: false
        });
      }
    }
  },

  deleteCart: async (productId) => {
    try {
      set({ loading: true, error: null });

      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

      // Always remove from session storage first
      const currentItems = removeFromSessionCart(productId);
      
      // Update local state from session storage
      set({ 
        cart: { 
          id: 0, 
          cartItems: transformSessionCartItems(currentItems)
        }, 
        loading: false 
      });

      // If logged in, also delete from backend
      if (token) {
        try {
          await api.delete("/api/cart/deleteitem", {
            data: { productId }
          });
          console.log("✅ Also deleted from backend");
        } catch (backendError) {
          console.error("⚠️ Failed to delete from backend, but removed from session:", backendError);
        }
      }
    } catch (err: any) {
      set({
        loading: false,
        error: err?.response?.data?.message || "Failed to delete cart item"
      });
      throw err;
    }
  },

  updateCartQuantity: async (productId, quantity) => {
    try {
      set({ loading: true, error: null });

      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

      // Always update session storage first
      const currentItems = updateSessionCartQuantity(productId, quantity);
      
      // Update local state from session storage
      set({ 
        cart: { 
          id: 0, 
          cartItems: transformSessionCartItems(currentItems)
        }, 
        loading: false 
      });

      // If logged in, also update backend
      if (token) {
        try {
          const state = get();
          const cart = state.cart;
          
          if (cart) {
            const item = cart.cartItems.find(i => i.productId === productId);
            if (item) {
              await api.put("/api/cart/updatequantity", {
                productId,
                quantity
              });
              console.log("✅ Also updated backend");
            }
          }
        } catch (backendError) {
          console.error("⚠️ Failed to update backend, but updated session:", backendError);
        }
      }
    } catch (err: any) {
      set({
        loading: false,
        error: err?.response?.data?.message || "Failed to update cart quantity"
      });
      throw err;
    }
  },

  clearCart: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    
    // Always clear session storage
    clearSessionCart();
    
    // If logged in, also clear backend (optional)
    if (token) {
      api.post("/api/cart/clear")
        .then(() => console.log("✅ Cleared backend cart"))
        .catch(err => console.error("⚠️ Failed to clear backend cart:", err));
    }
    
    set({ 
      cart: { id: 0, cartItems: [] },
      loading: false 
    });
  },

  mergeSessionCart: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      
      if (!token) {
        throw new Error("No token found. User is not logged in.");
      }

      const sessionCartItems = getSessionCart();
      
      if (sessionCartItems.length === 0) {
        return;
      }

      set({ loading: true, error: null });

      // Merge each item
      for (const item of sessionCartItems) {
        try {
          await api.post(
            "/api/cart/addtocart",
            { 
              productId: item.productId, 
              quantity: item.quantity 
            }
          );
        } catch (err) {
          console.error(`Failed to merge product ${item.productId}:`, err);
        }
      }

      // Clear session cart
      clearSessionCart();
      
      // Fetch updated cart silently
      await get().fetchCart({ silent: true });
      
      set({ loading: false });
      
    } catch (err: any) {
      set({
        loading: false,
        error: err?.response?.data?.message || "Failed to merge cart"
      });
      throw err;
    }
  }
}));