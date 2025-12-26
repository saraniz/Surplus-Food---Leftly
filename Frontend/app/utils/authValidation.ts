// utils/authValidation.ts
export const validateToken = (): {
  isValid: boolean;
  role: string | null;
  userId: number | null;
  isExpired: boolean;
} => {
  if (typeof window === 'undefined') {
    return { isValid: false, role: null, userId: null, isExpired: false };
  }
  
  const token = localStorage.getItem("token");
  
  if (!token) {
    return { isValid: false, role: null, userId: null, isExpired: false };
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = Date.now() >= payload.exp * 1000;
    
    if (isExpired) {
      // Auto-clean expired token
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      return { isValid: false, role: null, userId: null, isExpired: true };
    }
    
    return {
      isValid: true,
      role: payload.role,
      userId: payload.id,
      isExpired: false
    };
  } catch (error) {
    // Invalid token format
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    return { isValid: false, role: null, userId: null, isExpired: false };
  }
};

// Check if user can access cart
export const canAccessCart = (): boolean => {
  const { isValid, role } = validateToken();
  
  // Only valid customer tokens can access cart
  // Sellers use guest cart
  if (!isValid) return true; // Guest can access cart (session storage)
  
  return role === "customer"; // Only customers can use cart API
};