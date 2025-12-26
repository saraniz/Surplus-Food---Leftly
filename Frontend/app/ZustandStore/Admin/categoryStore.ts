// app/ZustandStore/Admin/categoryStore.ts
import { create } from "zustand";
import api from "@/app/libs/api";

interface Category {
  cId: number;
  categoryName: string;
  cDescription?: string;
  cStatus: "ACTIVE" | "INACTIVE";
  icon?: string;
  iconUrl?: string;
  createdAt: string;
}

interface CategoryState {
  category: Category[];
  token: string | null;
  loading: boolean;
  error: string | null;

  addCategory: (
    categoryName: string,
    cDescription?: string,
    cStatus?: "ACTIVE" | "INACTIVE",
    icon?: File
  ) => Promise<void>;
  
  getCategory: () => Promise<void>;
  deleteCategory: (cId: number) => Promise<void>;
  
  updateCategory: (
    cId: number,
    updates: Partial<{
      categoryName: string;
      cDescription: string;
      cStatus: "ACTIVE" | "INACTIVE";
      icon?: File | null;
    }>
  ) => Promise<void>;

  getCategoryById: (cId: number) => Promise<Category | null>;
  getCategoryByName: (categoryName: string) => Promise<Category | null>;
  getCategoriesByStatus: (status: "ACTIVE" | "INACTIVE") => Category[];
}

// Helper function to get base URL
const getBaseUrl = () => {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // Check if we're in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:2000';
  }
  
  // Production fallback - adjust based on your deployment
  return '';
};

export const usecategoryStore = create<CategoryState>((set, get) => ({
  category: [],
  token: null,
  loading: false,
  error: null,

  addCategory: async (categoryName, cDescription, cStatus, icon) => {
    console.log("Category details:", { categoryName, cDescription, cStatus, icon });

    try {
      set({ loading: true, error: null });

      // Only admins can add categories, so we need token
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      
      if (!token) {
        throw new Error("No authentication token found. Please log in as admin.");
      }

      const formData = new FormData();
      formData.append('categoryName', categoryName);
      if (cDescription) formData.append('cDescription', cDescription);
      if (cStatus) formData.append('cStatus', cStatus);
      if (icon) formData.append('icon', icon);

      const res = await api.post(
        "/api/category/addcategory",
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );

      console.log("Add category response:", res.data);

      const baseURL = getBaseUrl();
      const newCategory = {
        ...res.data.newCategory,
        iconUrl: res.data.newCategory.icon ? `${baseURL}/uploads/${res.data.newCategory.icon}` : null
      };

      set({ 
        category: [...get().category, newCategory], 
        loading: false,
        error: null
      });
    } catch (err: any) {
      console.error("Add category error:", err);
      set({ 
        error: err?.response?.data?.message || err?.message || "Category creation failed",
        loading: false 
      });
      throw err;
    }
  },

  getCategory: async () => {
    try {
      set({ loading: true, error: null });

      // Public endpoint - no token needed
      const res = await api.get("/api/category/getcategory");

      console.log("Get categories response:", res.data);

      const baseURL = getBaseUrl();
      
      // Add full URL to icons
      const categoriesWithIcons = res.data.category.map((cat: Category) => ({
        ...cat,
        iconUrl: cat.icon ? `${baseURL}/uploads/${cat.icon}` : null
      }));

      // Filter only active categories for public view
      const activeCategories = categoriesWithIcons.filter(
        (cat: Category) => cat.cStatus === "ACTIVE"
      );

      set({ 
        category: activeCategories, 
        loading: false, 
        error: null 
      });
    } catch (err: any) {
      console.error("Get categories error:", err);
      set({ 
        error: err?.response?.data?.message || err?.message || "Failed to fetch categories",
        loading: false 
      });
    }
  },

  deleteCategory: async (cId) => {
    console.log("Deleting category ID:", cId);

    try {
      set({ loading: true, error: null });

      // Only admins can delete, so we need token
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

      if (!token) {
        throw new Error("No authentication token found. Please log in as admin.");
      }

      const res = await api.delete("/api/category/deletecategory", {
        data: { cId },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Delete category response:", res.data);

      set((state) => ({
        category: state.category.filter((cat) => cat.cId !== cId),
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      console.error("Delete category error:", err);
      set({ 
        error: err?.response?.data?.message || err?.message || "Failed to delete category",
        loading: false 
      });
      throw err;
    }
  },

  updateCategory: async (cId, updates) => {
    console.log("Updating category ID:", cId, "with updates:", updates);

    try {
      set({ loading: true, error: null });

      // Only admins can update, so we need token
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

      if (!token) {
        throw new Error("No authentication token provided");
      }

      const formData = new FormData();
      formData.append('cId', cId.toString());
      
      if (updates.categoryName) formData.append('categoryName', updates.categoryName);
      if (updates.cDescription !== undefined) formData.append('cDescription', updates.cDescription);
      if (updates.cStatus) formData.append('cStatus', updates.cStatus);
      
      // Handle icon: if it's a File object, append it; if it's null, send empty string to remove
      if (updates.icon instanceof File) {
        formData.append('icon', updates.icon);
      } else if (updates.icon === null) {
        formData.append('icon', '');
      }

      const res = await api.put(
        "/api/category/updatecategory", 
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      console.log("Update category response:", res.data);
      
      const baseURL = getBaseUrl();
      const updatedCategory = {
        ...res.data.updatedCategory,
        iconUrl: res.data.updatedCategory.icon ? 
          `${baseURL}/uploads/${res.data.updatedCategory.icon}` : null
      };
      
      set((state) => ({
        category: state.category.map((cat) =>
          cat.cId === cId ? updatedCategory : cat
        ),
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      console.error("Update category error:", err);
      set({ 
        loading: false, 
        error: err?.response?.data?.message || err?.message || "Update failed" 
      });
      throw err;
    }
  },

  // NEW FUNCTION: Get single category by ID
  getCategoryById: async (cId: number) => {
    try {
      set({ loading: true, error: null });

      // Try to find in local store first
      const localCategory = get().category.find(cat => cat.cId === cId);
      if (localCategory) {
        set({ loading: false });
        return localCategory;
      }

      // If not found locally, fetch from server
      const res = await api.get(`/api/category/getcategory/${cId}`);

      console.log("Get category by ID response:", res.data);

      const baseURL = getBaseUrl();
      const category = {
        ...res.data.category,
        iconUrl: res.data.category?.icon ? `${baseURL}/uploads/${res.data.category.icon}` : null
      };

      set({ loading: false, error: null });
      return category;

    } catch (err: any) {
      console.error("Get category by ID error:", err);
      set({
        error: err?.response?.data?.message || err?.message || "Failed to fetch category",
        loading: false
      });
      return null;
    }
  },

  // NEW FUNCTION: Get single category by name
  getCategoryByName: async (categoryName: string) => {
    try {
      set({ loading: true, error: null });

      // Try to find in local store first (case-insensitive)
      const localCategory = get().category.find(
        cat => cat.categoryName.toLowerCase() === categoryName.toLowerCase()
      );
      if (localCategory) {
        set({ loading: false });
        return localCategory;
      }

      // If not found locally, fetch from server
      const res = await api.get(`/api/category/getcategory/name/${encodeURIComponent(categoryName)}`);

      console.log("Get category by name response:", res.data);

      const baseURL = getBaseUrl();
      const category = {
        ...res.data.category,
        iconUrl: res.data.category?.icon ? `${baseURL}/uploads/${res.data.category.icon}` : null
      };

      set({ loading: false, error: null });
      return category;

    } catch (err: any) {
      console.error("Get category by name error:", err);
      set({
        error: err?.response?.data?.message || err?.message || "Failed to fetch category",
        loading: false
      });
      return null;
    }
  },

  // NEW FUNCTION: Get categories filtered by status
  getCategoriesByStatus: (status: "ACTIVE" | "INACTIVE") => {
    return get().category.filter(cat => cat.cStatus === status);
  },


}));