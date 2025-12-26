
export interface SessionCartProductInfo {
  name?: string;
  price?: number;
  discountPrice?: number;
  image?: string;
  description?: string;
  isMysteryBox?: boolean; // Add this

}

// One item in the session cart
export interface SessionCartItem {
  id: number;
  productId: number;
  quantity: number;
  addedAt: number;

  // Stored product snapshot (for display before login)
  productName?: string;
  productPrice?: number;
  discountPrice?: number;
  productImage?: string;
  productDescription?:string
  isMysteryBox?: boolean; // Add this
}



export const getSessionCart = (): SessionCartItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const cartJson = sessionStorage.getItem("guest_cart");
    return cartJson ? JSON.parse(cartJson) : [];
  } catch (error) {
    console.error("Error reading session cart:", error);
    return [];
  }
};

export const saveSessionCart = (items: SessionCartItem[]): void => {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem("guest_cart", JSON.stringify(items));
  } catch (error) {
    console.error("Error saving session cart:", error);
  }
};

export const clearSessionCart = (): void => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("guest_cart");
};


export const addToSessionCart = (
  productId: number,
  quantity: number,
  productInfo?: SessionCartProductInfo
): SessionCartItem[] => {
  const currentItems = getSessionCart();

  const existingIndex = currentItems.findIndex(
    (item) => item.productId === productId
  );

  if (existingIndex >= 0) {
    // Update existing item
    const existingItem = currentItems[existingIndex];

    currentItems[existingIndex] = {
      ...existingItem,
      quantity: existingItem.quantity + quantity,
      productName: productInfo?.name ?? existingItem.productName,
      productPrice: productInfo?.price ?? existingItem.productPrice,
      discountPrice:
        productInfo?.discountPrice ?? existingItem.discountPrice,
      productImage: productInfo?.image ?? existingItem.productImage,
    };
  } else {
    // Add new item
    currentItems.push({
      id: Date.now(),
      productId,
      quantity,
      addedAt: Date.now(),
      productName: productInfo?.name,
      productPrice: productInfo?.price,
      discountPrice: productInfo?.discountPrice,
      productImage: productInfo?.image,
    });
  }

  saveSessionCart(currentItems);
  return currentItems;
};


export const removeFromSessionCart = (
  productId: number
): SessionCartItem[] => {
  const updatedItems = getSessionCart().filter(
    (item) => item.productId !== productId
  );

  saveSessionCart(updatedItems);
  return updatedItems;
};

export const updateSessionCartQuantity = (
  productId: number,
  quantity: number
): SessionCartItem[] => {
  const currentItems = getSessionCart();
  const index = currentItems.findIndex(
    (item) => item.productId === productId
  );

  if (index === -1) return currentItems;

  if (quantity <= 0) {
    return removeFromSessionCart(productId);
  }

  currentItems[index].quantity = quantity;
  saveSessionCart(currentItems);

  return currentItems;
};
