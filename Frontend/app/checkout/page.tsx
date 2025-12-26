"use client";

import { useState, useEffect, useCallback } from "react";
import { lora } from "../libs/fonts";
import {
  ArrowLeft,
  Mail,
  CreditCard,
  Wallet,
  Shield,
  Truck,
  CheckCircle,
  Lock,
  Clock,
  MapPin,
  Store,
  Package,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  Home,
  Briefcase,
  Edit2,
  Check,
  Navigation,
  XCircle,
  Loader2,
  X,
  Save,
  Building,
  Phone,
  Map,
  User,
  UserPlus,
  LogIn,
  ShoppingBag,
} from "lucide-react";
import Navbar2 from "../components/Navbar2";
import { useCartState } from "../ZustandStore/cartStore";
import dynamic from "next/dynamic";
import { useCusAuthStore } from "../ZustandStore/authStore";
import { useOrderStore } from "../ZustandStore/orderStore";
import { getSessionCart, clearSessionCart, saveSessionCart } from "../utils/sessionCart";
import Image from "next/image";

const showToast = (message: string, type: "success" | "error") => {
    // Dispatch a custom event that the Toast component listens for
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { message, type }
    }));
  };

// Import GoogleMapPicker dynamically
const GoogleMapPicker = dynamic(() => import("../GoogleMapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-gray-100 rounded-lg animate-pulse"></div>
  ),
});

interface Address {
  id: number;
  type: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  phone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  serviceArea: boolean;
}

interface AddressFormData {
  type: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  saveAddress: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Card validation interface
interface CardValidation {
  isValid: boolean;
  message: string;
  type: "success" | "error" | "warning";
}

// Guest user interface
interface GuestUser {
  name: string;
  email: string;
  phone: string;
  saveInfo: boolean;
}

// Shop interface
interface Shop {
  id: number;
  name: string;
  logo: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  sellerId: number;
  originalSeller?: any;
  items: CartItem[];
}

// Cart Item interface
interface CartItem {
  id: number;
  productId: number;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  quantity: number;
  sellerId: number;
  cartItemId: number;
  image?: string;
  product?: any;
  productName?: string;
  productPrice?: number;
  productImage?: string;
}

// Clean address formatter function
const formatDisplayAddress = (address: Address): string => {
  if (!address.address) return "No address available";
  
  const parts: string[] = [];
  const mainParts = address.address.split(',').map(p => p.trim());
  
  const filteredParts = mainParts.filter(part => {
    const lowerPart = part.toLowerCase();
    if (lowerPart.includes("sri lanka")) return false;
    if (lowerPart.includes("district")) return false;
    if (lowerPart.includes("province")) return false;
    return true;
  });

  const meaningfulParts = filteredParts.slice(0, 5);
  parts.push(meaningfulParts.join(', '));

  if (address.zipCode && !address.address.includes(address.zipCode)) {
    parts.push(address.zipCode);
  }

  return parts.filter(Boolean).join(', ');
};

// Alternative: Even cleaner version for Sri Lanka addresses
const formatSriLankaAddress = (address: Address): string => {
  if (!address.address) return "No address available";
  
  const main = address.address.split(',').slice(0, 5).join(', ').trim();
  
  let cleaned = main
    .replace(/, Sri Lanka$/i, '')
    .replace(/, Colombo District$/i, '')
    .replace(/, Western Province$/i, '')
    .replace(/, Province$/i, '')
    .replace(/, District$/i, '')
    .trim();
  
  if (address.zipCode && !cleaned.includes(address.zipCode)) {
    cleaned += ` ${address.zipCode}`;
  }
  
  return cleaned;
};

// Helper function to validate and fix image URLs
const getValidImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) {
    return "https://placehold.co/200x200/e5e7eb/6b7280?text=No+Image";
  }

  // Check if it's a data URL (base64)
  if (imageUrl.startsWith('data:image/')) {
    return imageUrl;
  }

  // Check if it's a valid URL
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Check if it's a relative path without leading slash
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // For relative paths without slash, add one
  if (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') || imageUrl.includes('.png') || imageUrl.includes('.webp')) {
    // Try to construct a valid URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000';
    return `${backendUrl}/uploads/${imageUrl}`;
  }

  // Return placeholder if nothing else works
  return "https://placehold.co/200x200/e5e7eb/6b7280?text=No+Image";
};

export default function CheckoutPage() {
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [saveInfo, setSaveInfo] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number>(0);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [locationStatus, setLocationStatus] = useState<{
    available: boolean;
    message: string;
    type: "success" | "warning" | "error";
  } | null>(null);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [mapPosition, setMapPosition] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [selectedAddressFromMap, setSelectedAddressFromMap] = useState<string>(
    "Click on map to select location"
  );
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [addressMethod, setAddressMethod] = useState<"map" | "manual" | null>(null);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestUser, setGuestUser] = useState<GuestUser>({
    name: "",
    email: "",
    phone: "",
    saveInfo: false,
  });
  const [tempMapAddress, setTempMapAddress] = useState<{
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null>(null);
  const [mapPhoneNumber, setMapPhoneNumber] = useState("");

  // FIXED: Check authentication properly
  const { customer, fetchCusDetails, token: authToken } = useCusAuthStore();
  const isLoggedIn = !!authToken || (typeof window !== 'undefined' ? !!localStorage.getItem("token") : false);
  
  const { placeOrder, loading: isPlacingOrder, error: orderError, success: orderSuccess } = useOrderStore();

  useEffect(() => {
    if (isLoggedIn) {
      fetchCusDetails();
    }
  }, [isLoggedIn]);

  // Initialize address form with customer data when customer is loaded
  useEffect(() => {
    if (customer) {
      setAddressForm(prev => ({
        ...prev,
        phone: customer.mobileNumber || "",
        addressLine1: customer.location || "",
        city: customer.city || "",
        state: customer.city || "",
        zipCode: customer.zipCode || "",
      }));
      setMapPhoneNumber(customer.mobileNumber || "");
    }
  }, [customer]);

  // Initialize map phone number from guest user
  useEffect(() => {
    if (guestUser.phone) {
      setMapPhoneNumber(guestUser.phone);
    }
  }, [guestUser.phone]);

  // Card validation state
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  const [cardValidation, setCardValidation] = useState<{
    cardNumber: CardValidation;
    expiryDate: CardValidation;
    cvv: CardValidation;
    cardholderName: CardValidation;
  }>({
    cardNumber: { isValid: true, message: "", type: "success" },
    expiryDate: { isValid: true, message: "", type: "success" },
    cvv: { isValid: true, message: "", type: "success" },
    cardholderName: { isValid: true, message: "", type: "success" },
  });

  // FIXED: Use proper functions from cartStore
  const { cart, fetchCart, clearCart, deleteCart, updateCartQuantity } = useCartState();

  const [shops, setShops] = useState<Shop[]>([]);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);

  // Address form state - initialized with customer data
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    type: "home",
    name: `${customer?.name || "Guest"}'s Address`,
    addressLine1: customer?.location || "",
    addressLine2: "",
    city: customer?.city || "",
    state: customer?.city || "",
    zipCode: customer?.zipCode || "",
    country: "Sri Lanka",
    phone: customer?.mobileNumber || "",
    saveAddress: true,
  });

  // State for delivery calculations
  const [deliveryCalculations, setDeliveryCalculations] = useState({
    totalDeliveryFee: 0,
    estimatedDeliveryTime: "Calculating...",
    allShopsAvailable: true,
    unavailableShops: [] as string[],
  });

  // Get selected address
  const selectedAddress =
    userAddresses.find((addr) => addr.id === selectedAddressId) ||
    userAddresses[0];

  // Constants for COD fee
  const COD_FEE = 50.0;

  // Calculate distance between two coordinates (Haversine formula) in kilometers
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) {
      console.error("Invalid coordinates:", { lat1, lon1, lat2, lon2 });
      return Infinity;
    }

    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Check if order has multiple shops
  const hasMultipleShops = () => {
    return shops.length > 1;
  };

  // Process cart data when it changes
  useEffect(() => {
    console.log("🛒 CHECKOUT: Processing cart data...");
    console.log("Cart from Zustand:", cart);

    if (!cart) {
      console.log("No cart data available, checking session storage...");
      
      // Check session storage for guest users
      const sessionCart = getSessionCart();
      console.log("Session cart items:", sessionCart);
      
      if (sessionCart.length > 0) {
        processSessionCartItems(sessionCart);
      } else {
        setShops([]);
      }
      return;
    }

    const cartItems = cart.cartItems || [];
    console.log("Cart items count:", cartItems.length);

    if (cartItems.length === 0) {
      // Fallback to session storage
      const sessionCart = getSessionCart();
      if (sessionCart.length > 0) {
        processSessionCartItems(sessionCart);
      } else {
        setShops([]);
      }
      return;
    }

    processCartItems(cartItems);
  }, [cart]);

  // Process cart items from authenticated user
 // In your processCartItems function, handle mystery boxes:
const processCartItems = (cartItems: any[]) => {
  const grouped: Record<number, Shop> = {};

  cartItems.forEach((item: any, index: number) => {
    console.log(`Processing cart item ${index}:`, item);
    
    // Check if it's a mystery box
    const isMysteryBox = item.productType === "MYSTERY_BOX" || 
                         item.product?.category === "MYSTERY_BOX" ||
                         item.productId >= 100000; // Your mystery box ID range
    
    let sellerId = 0;
    let shopName = 'Unknown Shop';
    let sellerDetails = null;

    if (isMysteryBox) {
      // For mystery boxes, get seller from mystery box data
      sellerId = item.mysteryBox?.sellerId || 
                 item.sellerId || 
                 1; // Default seller
      shopName = item.mysteryBox?.seller?.businessName || "Mystery Box Shop";
      sellerDetails = item.mysteryBox?.seller;
    } else {
      // For regular products
      const seller = item.product?.seller || 
                     item.seller || 
                     item.sellerDetails ||
                     null;
      
      if (seller) {
        sellerId = parseInt(seller.seller_id || seller.id || '0');
        shopName = seller.businessName || seller.name || `Shop ${sellerId}`;
        sellerDetails = seller;
      } else if (item.sellerId) {
        sellerId = parseInt(item.sellerId);
        shopName = item.shopName || `Shop ${sellerId}`;
      } else {
        sellerId = index + 1;
        shopName = `Shop ${index + 1}`;
      }
    }

    // Get coordinates
    let shopCoords = { lat: 6.9271, lng: 79.8612 };
    if (sellerDetails?.latitude && sellerDetails?.longitude) {
      shopCoords = {
        lat: parseFloat(sellerDetails.latitude),
        lng: parseFloat(sellerDetails.longitude)
      };
    }

    // Get logo
    const shopLogo = sellerDetails?.logo || sellerDetails?.profileImage || "🎁";

    // Create or update shop
    if (!grouped[sellerId]) {
      grouped[sellerId] = {
        id: sellerId,
        name: shopName,
        logo: shopLogo,
        coordinates: shopCoords,
        items: [],
        sellerId: sellerId,
        originalSeller: sellerDetails
      };
    }

    // Prepare item details
    const productName = isMysteryBox 
      ? (item.mysteryBox?.name || item.name || "Mystery Box")
      : (item.product?.productName || item.name || "Unknown Product");
    
    const productDescription = isMysteryBox
      ? (item.mysteryBox?.description || item.description || "Special surprise box!")
      : (item.product?.description || item.description || "");
    
    const price = isMysteryBox
      ? Number(item.mysteryBox?.price || item.mysteryBox?.discountPrice || item.price || 0)
      : Number(item.product?.discountPrice || item.product?.price || item.price || 0);
    
    const originalPrice = isMysteryBox
      ? Number(item.mysteryBox?.price || item.mysteryBox?.discountPrice || price)
      : Number(item.product?.price || item.originalPrice || price);

    // Get image
    const productImage = getValidImageUrl(
      isMysteryBox
        ? (item.mysteryBox?.image || "/images/mystery-box.jpg")
        : (item.product?.productImgBase64 || 
           item.product?.imageBase64 || 
           item.product?.productImg || 
           item.product?.images?.[0]?.imageBase64 ||
           item.product?.images?.[0]?.imageUrl ||
           item.image ||
           item.productImage)
    );

    // Create cart item
    const cartItem: CartItem = {
      id: item.id || index + 1,
      productId: parseInt(item.productId || (isMysteryBox ? item.mysteryBoxId : item.product?.product_id) || (index + 1)),
      name: productName,
      description: productDescription,
      price: price,
      originalPrice: originalPrice,
      quantity: item.quantity || 1,
      sellerId: sellerId,
      cartItemId: item.id || index + 1000,
      image: productImage,
      product: item.product,
      isMysteryBox: isMysteryBox, // Add flag for mystery box
      mysteryBoxData: isMysteryBox ? item.mysteryBox : null,
    };

    grouped[sellerId].items.push(cartItem);
  });

  const shopsArray = Object.values(grouped);
  console.log("Processed shops with mystery boxes:", shopsArray);
  setShops(shopsArray);
};

  // Process session cart items for guest users
  const processSessionCartItems = (sessionCartItems: any[]) => {
    console.log("🛍️ PROCESSING SESSION CART ITEMS:", sessionCartItems);
    
    const grouped: Record<number, Shop> = {};

    // For session cart, we need to group by seller/shop
    // Since session cart doesn't have seller info, we'll group all items together
    const defaultShopId = 1;
    
    if (!grouped[defaultShopId]) {
      grouped[defaultShopId] = {
        id: defaultShopId,
        name: "Session Shop",
        logo: "🏪",
        coordinates: { lat: 6.9271, lng: 79.8612 }, // Default Colombo
        items: [],
        sellerId: defaultShopId,
        originalSeller: null
      };
    }

    sessionCartItems.forEach((item: any, index: number) => {
      console.log(`Processing session cart item ${index}:`, item);
      
      const cartItem: CartItem = {
        id: item.id || Date.now() + index,
        productId: parseInt(item.productId || (index + 1)),
        name: item.productName || "Product from Session",
        description: item.productDescription || "",
        price: Number(item.productPrice) || Number(item.price) || 0,
        originalPrice: Number(item.productPrice) || Number(item.price) || 0,
        quantity: item.quantity || 1,
        sellerId: defaultShopId,
        cartItemId: item.id || Date.now() + index,
        image: getValidImageUrl(item.productImage || item.image),
        productName: item.productName,
        productPrice: item.productPrice,
        productImage: item.productImage
      };

      grouped[defaultShopId].items.push(cartItem);
    });

    const shopsArray = Object.values(grouped);
    console.log("Processed session shops:", shopsArray);
    setShops(shopsArray);
  };

  // Get shop count display text
  const getShopCountText = () => {
    const count = shops.length;
    if (count === 0) return "No shops";
    if (count === 1) return "1 shop";
    return `${count} shops`;
  };

  // Card validation functions
  const validateCardNumber = (cardNumber: string): CardValidation => {
    const cleaned = cardNumber.replace(/\s+/g, "");

    if (!cleaned) {
      return {
        isValid: false,
        message: "Card number is required",
        type: "error",
      };
    }

    if (!/^\d+$/.test(cleaned)) {
      return {
        isValid: false,
        message: "Only digits are allowed",
        type: "error",
      };
    }

    if (cleaned.length < 13 || cleaned.length > 19) {
      return {
        isValid: false,
        message: "Card number must be 13-19 digits",
        type: "error",
      };
    }

    // Luhn algorithm for card validation
    let sum = 0;
    let shouldDouble = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i));
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    if (sum % 10 !== 0) {
      return { isValid: false, message: "Invalid card number", type: "error" };
    }

    return { isValid: true, message: "Valid card number", type: "success" };
  };

  const validateExpiryDate = (expiryDate: string): CardValidation => {
    if (!expiryDate) {
      return {
        isValid: false,
        message: "Expiry date is required",
        type: "error",
      };
    }

    const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!regex.test(expiryDate)) {
      return { isValid: false, message: "Format: MM/YY", type: "error" };
    }

    const [month, year] = expiryDate.split("/").map(Number);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return { isValid: false, message: "Card has expired", type: "error" };
    }

    return { isValid: true, message: "Valid expiry date", type: "success" };
  };

  const validateCVV = (cvv: string): CardValidation => {
    if (!cvv) {
      return { isValid: false, message: "CVV is required", type: "error" };
    }

    if (!/^\d+$/.test(cvv)) {
      return {
        isValid: false,
        message: "Only digits are allowed",
        type: "error",
      };
    }

    if (cvv.length < 3 || cvv.length > 4) {
      return {
        isValid: false,
        message: "CVV must be 3-4 digits",
        type: "error",
      };
    }

    return { isValid: true, message: "Valid CVV", type: "success" };
  };

  const validateCardholderName = (name: string): CardValidation => {
    if (!name.trim()) {
      return {
        isValid: false,
        message: "Cardholder name is required",
        type: "error",
      };
    }

    if (name.length < 3) {
      return { isValid: false, message: "Name is too short", type: "error" };
    }

    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return {
        isValid: false,
        message: "Only letters and spaces allowed",
        type: "error",
      };
    }

    return { isValid: true, message: "Valid name", type: "success" };
  };

  // Handle card input changes with validation
  const handleCardInputChange = (
    field: keyof typeof cardDetails,
    value: string
  ) => {
    setCardDetails((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Format card number with spaces
    if (field === "cardNumber") {
      const cleaned = value.replace(/\s+/g, "");
      const formatted = cleaned.replace(/(\d{4})/g, "$1 ").trim();
      setCardDetails((prev) => ({
        ...prev,
        cardNumber: formatted,
      }));

      // Validate
      const validation = validateCardNumber(cleaned);
      setCardValidation((prev) => ({
        ...prev,
        cardNumber: validation,
      }));
    }

    // Validate expiry date
    if (field === "expiryDate") {
      const validation = validateExpiryDate(value);
      setCardValidation((prev) => ({
        ...prev,
        expiryDate: validation,
      }));
    }

    // Validate CVV
    if (field === "cvv") {
      const validation = validateCVV(value);
      setCardValidation((prev) => ({
        ...prev,
        cvv: validation,
      }));
    }

    // Validate cardholder name
    if (field === "cardholderName") {
      const validation = validateCardholderName(value);
      setCardValidation((prev) => ({
        ...prev,
        cardholderName: validation,
      }));
    }
  };

  // Handle address form input change
  const handleAddressFormChange = useCallback(
    (
      field: keyof AddressFormData,
      value: string | boolean | { lat: number; lng: number }
    ) => {
      setAddressForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // Validate phone number
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone.trim()) return false;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  // Save address from form
  const handleSaveAddress = async () => {
    setIsSavingAddress(true);

    // Validate phone number
    if (!addressForm.phone.trim()) {
      alert("Phone number is required");
      setIsSavingAddress(false);
      return;
    }

    if (!validatePhoneNumber(addressForm.phone)) {
      alert("Please enter a valid phone number");
      setIsSavingAddress(false);
      return;
    }

    // Validate address
    if (!addressForm.addressLine1.trim()) {
      alert("Address is required");
      setIsSavingAddress(false);
      return;
    }

    try {
      // For manual entry, use default coordinates if not provided
      const coordinates = addressForm.coordinates || { lat: 6.9271, lng: 79.8612 };

      const newAddress: Address = {
        id: Date.now(),
        type: addressForm.type,
        name: addressForm.name || `${customer?.name || "Guest"}'s Address`,
        address: addressForm.addressLine1 +
          (addressForm.addressLine2 ? `, ${addressForm.addressLine2}` : ""),
        city: addressForm.city || "",
        state: addressForm.state || "",
        zipCode: addressForm.zipCode || "",
        country: addressForm.country || "Sri Lanka",
        isDefault: userAddresses.length === 0,
        phone: addressForm.phone,
        coordinates: coordinates,
        serviceArea: true,
      };

      setUserAddresses((prev) => {
        const updatedAddresses = [...prev];
        if (addressForm.saveAddress) {
          updatedAddresses.push(newAddress);
        }
        return updatedAddresses;
      });

      setSelectedAddressId(newAddress.id);

      // Reset form
      setAddressForm({
        type: "home",
        name: `${customer?.name || "Guest"}'s Address`,
        addressLine1: customer?.location || "",
        addressLine2: "",
        city: customer?.city || "",
        state: customer?.city || "",
        zipCode: customer?.zipCode || "",
        country: "Sri Lanka",
        phone: customer?.mobileNumber || "",
        saveAddress: true,
      });

      setShowAddressForm(false);
      setShowAddressModal(false);
      setAddressMethod(null);

      showToast("Address saved successfully!", "success");
    } catch (error) {
      console.error("Error saving address:", error);
      showToast("Failed to save address. Please try again.", "error");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Handle guest form input change
  const handleGuestFormChange = (field: keyof GuestUser, value: string | boolean) => {
    setGuestUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save guest info to session storage
  const saveGuestInfoToSession = () => {
    if (guestUser.name && guestUser.email && guestUser.phone) {
      const guestInfo = {
        name: guestUser.name,
        email: guestUser.email,
        phone: guestUser.phone,
        saveInfo: guestUser.saveInfo
      };
      sessionStorage.setItem('guest_info', JSON.stringify(guestInfo));
      return guestInfo;
    }
    return null;
  };

  // Edit existing address
  const handleEditAddress = (address: Address) => {
    const addressParts = address.address.split(", ");
    setAddressForm({
      type: address.type,
      name: address.name,
      addressLine1: addressParts[0] || "",
      addressLine2: addressParts.slice(1).join(", ") || "",
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone,
      saveAddress: false,
      coordinates: address.coordinates,
    });

    setSelectedAddressId(address.id);
    setShowAddressForm(true);
    setShowAddressModal(false);
    setAddressMethod("manual");
  };

  // Handle map location selection
  const handleMapLocationSelect = async (position: { lat: number; lng: number; address?: string }) => {
    console.log("📍 Map location selected:", position);
    setMapPosition(position);
    
    let address = position.address;
    
    if (!address) {
      // Try to geocode if no address provided
      setIsReverseGeocoding(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        if (data.display_name) {
          address = data.display_name;
        } else {
          address = `Location at ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        address = `Location at ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
      } finally {
        setIsReverseGeocoding(false);
      }
    }
    
    setSelectedAddressFromMap(address);
    
    // Save temporary address details
    const city = "";
    const state = "";
    const zipCode = "";
    const country = "Sri Lanka";
    
    setTempMapAddress({
      address: address,
      city: city,
      state: state,
      zipCode: zipCode,
      country: country,
    });
  };

  // Handle save map address
  const handleSaveMapAddress = async (confirmedPosition?: { lat: number; lng: number; address?: string }) => {
    const positionToUse = confirmedPosition || mapPosition;
    
    if (!positionToUse) {
      alert("Please select a location on the map first");
      return;
    }

    // Check if phone number is provided in map modal
    if (!mapPhoneNumber.trim()) {
      alert("Phone number is required for delivery. Please enter your phone number in the map modal.");
      return;
    }

    if (!validatePhoneNumber(mapPhoneNumber)) {
      alert("Please enter a valid phone number");
      return;
    }

    setIsSavingAddress(true);

    try {
      // Use the address from the confirmed position or the temporary one
      const addressToUse = tempMapAddress?.address || 
                          positionToUse.address || 
                          selectedAddressFromMap || 
                          `Location at ${positionToUse.lat.toFixed(6)}, ${positionToUse.lng.toFixed(6)}`;

      const newAddress: Address = {
        id: Date.now(),
        type: "home",
        name: "Map Selected Location",
        address: addressToUse,
        city: tempMapAddress?.city || "",
        state: tempMapAddress?.state || "",
        zipCode: tempMapAddress?.zipCode || "",
        country: tempMapAddress?.country || "Sri Lanka",
        isDefault: userAddresses.length === 0,
        phone: mapPhoneNumber,
        coordinates: { lat: positionToUse.lat, lng: positionToUse.lng },
        serviceArea: true,
      };

      setUserAddresses((prev) => [...prev, newAddress]);
      setSelectedAddressId(newAddress.id);

      // Update phone number in guest user if not logged in
      if (!isLoggedIn && !guestUser.phone) {
        setGuestUser(prev => ({ ...prev, phone: mapPhoneNumber }));
      }

      setShowMapPicker(false);
      setShowAddressModal(false);
      setAddressMethod(null);
      setTempMapAddress(null);

      showToast("Address saved successfully!","success");
      
      // Trigger location check
      setTimeout(() => {
        checkLocationAvailability();
      }, 500);
      
    } catch (error) {
      console.error("Error saving map address:", error);
      showToast("Failed to save address. Please try again.","error");

    } finally {
      setIsSavingAddress(false);
    }
  };

  // Handle map modal close
  const handleMapModalClose = () => {
    // If user has selected a location but didn't click confirm, ask them
    if (mapPosition && !selectedAddress && mapPhoneNumber.trim()) {
      if (window.confirm("You've selected a location but haven't confirmed it. Would you like to save this location before closing?")) {
        handleSaveMapAddress();
        return;
      }
    } else if (mapPosition && !mapPhoneNumber.trim()) {
      alert("Please enter your phone number to save the location");
      return;
    }
    
    // Close the modal
    setShowMapPicker(false);
    setAddressMethod(null);
    
    // If no address is selected, show address method modal
    if (!selectedAddress) {
      setShowAddressModal(true);
    }
  };

  // Check location availability
  const checkLocationAvailability = () => {
    if (!selectedAddress) {
      setLocationStatus({
        available: false,
        message: "Please select or enter a delivery address",
        type: "error",
      });
      return;
    }

    setIsCheckingLocation(true);
    setLocationStatus(null);

    const unavailableShops: string[] = [];
    const distances: number[] = [];

    shops.forEach((shop) => {
      if (shop.coordinates?.lat && shop.coordinates?.lng && selectedAddress.coordinates) {
        const distance = calculateDistance(
          selectedAddress.coordinates.lat,
          selectedAddress.coordinates.lng,
          shop.coordinates.lat,
          shop.coordinates.lng
        );

        distances.push(distance);
        
        if (distance > 20) {
          unavailableShops.push(shop.name);
        }
      }
    });

    const allAvailable = unavailableShops.length === 0;

    let totalDeliveryFee = 150.0;
    
    if (distances.length > 0) {
      const maxDistance = Math.max(...distances);
      const multiShopMultiplier = hasMultipleShops() ? 1.2 : 1.0;
      
      if (maxDistance > 10) {
        totalDeliveryFee = Math.max(150.0, maxDistance * 50) * multiShopMultiplier;
      } else if (maxDistance > 5) {
        totalDeliveryFee = Math.max(150.0, maxDistance * 40) * multiShopMultiplier;
      } else {
        totalDeliveryFee = 150.0 * multiShopMultiplier;
      }
      
      totalDeliveryFee = Math.ceil(totalDeliveryFee / 10) * 10;
    }

    let estimatedDeliveryTime = "35-50 min";
    
    if (hasMultipleShops()) {
      if (distances.length > 0) {
        const avgDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
        const shopCountTime = (shops.length - 1) * 10;
        
        if (avgDistance < 5) {
          estimatedDeliveryTime = `${25 + shopCountTime}-${40 + shopCountTime} min`;
        } else if (avgDistance < 10) {
          estimatedDeliveryTime = `${35 + shopCountTime}-${50 + shopCountTime} min`;
        } else {
          estimatedDeliveryTime = `${45 + shopCountTime}-${60 + shopCountTime} min`;
        }
      } else {
        estimatedDeliveryTime = `${40 + (shops.length - 1) * 10}-${55 + (shops.length - 1) * 10} min`;
      }
    }

    setDeliveryCalculations({
      totalDeliveryFee,
      estimatedDeliveryTime,
      allShopsAvailable: allAvailable,
      unavailableShops,
    });

    if (!selectedAddress.serviceArea) {
      setLocationStatus({
        available: false,
        message: "Delivery not available in this area",
        type: "error",
      });
    } else if (!allAvailable) {
      const unavailableCount = unavailableShops.length;
      setLocationStatus({
        available: false,
        message: `${unavailableCount} shop${unavailableCount > 1 ? 's' : ''} unavailable at this location`,
        type: "warning",
      });
    } else {
      const shopText = hasMultipleShops() ? `all ${shops.length} shops` : "this shop";
      setLocationStatus({
        available: true,
        message: `Delivery available from ${shopText}`,
        type: "success",
      });
    }

    setIsCheckingLocation(false);
  };

  // Check location when address changes
  useEffect(() => {
    if (selectedAddress && shops.length > 0) {
      checkLocationAvailability();
    }
  }, [selectedAddressId, shops]);

  // Initialize map position with selected address
  useEffect(() => {
    if (selectedAddress?.coordinates) {
      setMapPosition({
        lat: selectedAddress.coordinates.lat,
        lng: selectedAddress.coordinates.lng,
        address: selectedAddress.address
      });
    }
  }, [selectedAddress]);

  // Calculate totals with COD fee
  const calculateShopSubtotal = (shop: Shop) => {
    return shop.items.reduce(
      (sum: number, item: CartItem) =>
        sum + (item.price || 0) * (item.quantity || 1),
      0
    );
  };

  const calculateOverallSubtotal = () => {
    if (shops.length === 0) return 0;
    return shops.reduce((sum, shop) => sum + calculateShopSubtotal(shop), 0);
  };

  const calculateTotalDiscount = () => {
    if (shops.length === 0) return 0;
    return shops.reduce(
      (sum, shop) =>
        sum +
        shop.items.reduce(
          (itemSum: number, item: CartItem) =>
            itemSum +
            ((item.originalPrice || item.price || 0) - (item.price || 0)) *
              (item.quantity || 1),
          0
        ),
      0
    );
  };

  // Calculate total with COD fee if applicable
  const calculateTotal = () => {
    const subtotal = calculateOverallSubtotal();
    const deliveryFee = deliveryCalculations.totalDeliveryFee;

    if (paymentMethod === "cash") {
      return subtotal + deliveryFee + COD_FEE;
    }

    return subtotal + deliveryFee;
  };

  const total = calculateTotal();

  // Get address icon
  const getAddressIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home size={20} className="text-amber-500" />;
      case "work":
        return <Briefcase size={20} className="text-blue-500" />;
      default:
        return <Building size={20} className="text-gray-500" />;
    }
  };

  // Handle cart item operations
  const handleIncreaseQuantity = async (shopId: number, itemId: number, currentQuantity: number) => {
    try {
      const item = shops
        .find(shop => shop.id === shopId)
        ?.items.find(item => item.id === itemId);
      
      if (item) {
        // For guest users, update session storage
        if (!isLoggedIn) {
          const sessionCart = getSessionCart();
          const updatedCart = sessionCart.map(cartItem => {
            if (cartItem.id === item.cartItemId || cartItem.productId === item.productId) {
              return {
                ...cartItem,
                quantity: currentQuantity + 1
              };
            }
            return cartItem;
          });
          saveSessionCart(updatedCart);
          await fetchCart();
        } else {
          await updateCartQuantity(item.productId, currentQuantity + 1);
          await fetchCart();
        }
      }
    } catch (error) {
      console.error("Error increasing quantity:", error);
      alert("Failed to update quantity. Please try again.");
    }
  };

  const handleDecreaseQuantity = async (shopId: number, itemId: number, currentQuantity: number) => {
    if (currentQuantity <= 1) {
      // If quantity would be 0, remove the item
      handleRemoveItem(shopId, itemId);
      return;
    }
    
    try {
      const item = shops
        .find(shop => shop.id === shopId)
        ?.items.find(item => item.id === itemId);
      
      if (item) {
        // For guest users, update session storage
        if (!isLoggedIn) {
          const sessionCart = getSessionCart();
          const updatedCart = sessionCart.map(cartItem => {
            if (cartItem.id === item.cartItemId || cartItem.productId === item.productId) {
              return {
                ...cartItem,
                quantity: currentQuantity - 1
              };
            }
            return cartItem;
          });
          saveSessionCart(updatedCart);
          await fetchCart();
        } else {
          await updateCartQuantity(item.productId, currentQuantity - 1);
          await fetchCart();
        }
      }
    } catch (error) {
      console.error("Error decreasing quantity:", error);
      alert("Failed to update quantity. Please try again.");
    }
  };

  const handleRemoveItem = async (shopId: number, itemId: number) => {
    try {
      const item = shops
        .find(shop => shop.id === shopId)
        ?.items.find(item => item.id === itemId);
      
      if (item) {
        // For guest users, remove from session storage
        if (!isLoggedIn) {
          const sessionCart = getSessionCart();
          const updatedCart = sessionCart.filter(cartItem => 
            !(cartItem.id === item.cartItemId || cartItem.productId === item.productId)
          );
          saveSessionCart(updatedCart);
          await fetchCart();
        } else if (item.productId) {
          await deleteCart(item.productId);
          await fetchCart();
        }
      }
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Failed to remove item. Please try again.");
    }
  };

  const handleRemoveAllFromShop = async (shopId: number) => {
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;

    try {
      // For guest users, remove from session storage
      if (!isLoggedIn) {
        const sessionCart = getSessionCart();
        const shopProductIds = shop.items.map(item => item.productId);
        const updatedCart = sessionCart.filter(cartItem => 
          !shopProductIds.includes(cartItem.productId)
        );
        saveSessionCart(updatedCart);
        await fetchCart();
      } else {
        const removePromises = shop.items.map(item => 
          item.productId ? deleteCart(item.productId) : Promise.resolve()
        );
        await Promise.all(removePromises);
        await fetchCart();
      }
    } catch (error) {
      console.error("Error removing all items from shop:", error);
      alert("Failed to remove items. Please try again.");
    }
  };

  // Fetch cart on mount
  useEffect(() => {
    const loadCart = async () => {
      setIsLoadingCart(true);
      try {
        await fetchCart();
      } catch (error) {
        console.error("Error loading cart:", error);
      } finally {
        setIsLoadingCart(false);
      }
    };
    loadCart();
  }, [fetchCart]);

  // Handle current location button click
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapPosition(pos);
          setShowMapPicker(true);
          setShowAddressModal(false);
          setAddressMethod("map");
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert(
            "Unable to get your location. Please enable location services or enter address manually."
          );
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  // Handle guest checkout
  const handleGuestCheckout = () => {
    if (!guestUser.name || !guestUser.email || !guestUser.phone) {
      alert("Please fill in all required guest information");
      return;
    }

    // Save guest info to session storage
    saveGuestInfoToSession();
    
    // Close guest form and show address modal
    setShowGuestForm(false);
    setShowAddressModal(true);
  };

  // Check if card is valid
  const isCardValid = (): boolean => {
    return (
      cardValidation.cardNumber.isValid &&
      cardValidation.expiryDate.isValid &&
      cardValidation.cvv.isValid &&
      cardValidation.cardholderName.isValid
    );
  };

  // Handle place order with guest support
  const handlePlaceOrder = async () => {
    // Validate guest user info if not logged in
    if (!isLoggedIn) {
      if (!guestUser.name || !guestUser.email || !guestUser.phone) {
        alert("Please fill in your guest information");
        setShowGuestForm(true);
        return;
      }
      saveGuestInfoToSession();
    }

    if (!selectedAddress || !deliveryCalculations.allShopsAvailable) {
      alert("Please select a delivery address and ensure all items are available");
      return;
    }

    if (paymentMethod === "card" && !isCardValid()) {
      alert("Please fix your card details");
      return;
    }

    // Prepare order data
    const subtotal = calculateOverallSubtotal();
    const codFee = paymentMethod === "cash" ? COD_FEE : 0;
    const totalPrice = Math.round(subtotal + deliveryCalculations.totalDeliveryFee + codFee);

    const deliveryTimeMatch = deliveryCalculations.estimatedDeliveryTime.match(/\d+/);
    const deliveryTime = deliveryTimeMatch ? parseInt(deliveryTimeMatch[0]) : 45;

    const items = shops.flatMap((shop) =>
      shop.items.map((item: CartItem) => ({
        productId: item.productId,
        sellerId: shop.sellerId,
        quantity: item.quantity || 1,
        price: Math.round(item.price),
      }))
    );

    const paymentMethodEnum =
      paymentMethod === "card" ? "DEBIT_CARD" : "CASH_ON_DELIVERY";

    // Create guest info object if not logged in
    const guestInfo = !isLoggedIn ? {
      guestName: guestUser.name,
      guestEmail: guestUser.email,
      guestPhone: guestUser.phone,
    } : {};

    const orderData = {
      deliveryAddress: selectedAddress.address,
      deliveryInfo: deliveryInstructions,
      deliveryTime: deliveryTime,
      deliveryFee: Math.round(deliveryCalculations.totalDeliveryFee),
      totalPrice: totalPrice,
      paymentMethod: paymentMethodEnum,
      items: items,
      ...guestInfo,
      isGuestOrder: !isLoggedIn,
    };

    console.log("Order data being sent to backend:", orderData);

    await placeOrder(orderData);

    if (orderSuccess) {
      showToast("Order placed successfully!", "success");

      // Clear cart for both logged in and guest users
      clearCart();
      clearSessionCart();
      
      // Clear guest info if saved
      if (!isLoggedIn && !guestUser.saveInfo) {
        sessionStorage.removeItem('guest_info');
      }
      
      window.location.href = `/homepage`;
    } else if (orderError) {
      alert(`Order failed: ${orderError}`);
    }
  };

  // Check if user needs to fill guest form
  useEffect(() => {
    if (!isLoggedIn && shops.length > 0) {
      // Check if guest info exists in session storage
      const savedGuestInfo = sessionStorage.getItem('guest_info');
      if (savedGuestInfo) {
        try {
          const guestData = JSON.parse(savedGuestInfo);
          setGuestUser(guestData);
          setMapPhoneNumber(guestData.phone || "");
          // Don't auto-show guest form if info is saved
          setShowGuestForm(false);
        } catch (error) {
          console.error("Error parsing guest info:", error);
          // Show guest form if parsing fails
          setShowGuestForm(true);
        }
      } else {
        // Show guest form if no saved info
        setShowGuestForm(true);
      }
    }
  }, [isLoggedIn, shops.length]);

  // Address Form Modal
  const AddressFormModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-semibold text-gray-800 ${lora.className}`}>
              Add Delivery Address
            </h3>
            <button
              type="button"
              title="Close"
              onClick={() => {
                setShowAddressForm(false);
                setAddressMethod(null);
                // If no address is selected, show address method modal
                if (!selectedAddress) {
                  setShowAddressModal(true);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Enter your delivery address and phone number
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {/* Address Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["home", "work"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleAddressFormChange("type", type)}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center transition-all ${
                      addressForm.type === type
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-200 hover:border-amber-300"
                    }`}
                  >
                    {type === "home" && (
                      <Home size={18} className="mr-2 text-gray-600" />
                    )}
                    {type === "work" && (
                      <Briefcase size={18} className="mr-2 text-gray-600" />
                    )}
                    <span className="capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => handleAddressFormChange("phone", e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Required for delivery updates
              </p>
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1 *
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={addressForm.addressLine1}
                  onChange={(e) => handleAddressFormChange("addressLine1", e.target.value)}
                  placeholder="Street address, building, house no."
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                value={addressForm.addressLine2}
                onChange={(e) => handleAddressFormChange("addressLine2", e.target.value)}
                placeholder="Apartment, suite, unit, floor, etc."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={addressForm.city}
                onChange={(e) => handleAddressFormChange("city", e.target.value)}
                placeholder="Colombo"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* State & ZIP Code */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  value={addressForm.state}
                  onChange={(e) => handleAddressFormChange("state", e.target.value)}
                  placeholder="Western Province"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={addressForm.zipCode}
                  onChange={(e) => handleAddressFormChange("zipCode", e.target.value)}
                  placeholder="10100"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                title="Country"
                type="text"
                value={addressForm.country}
                onChange={(e) => handleAddressFormChange("country", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-gray-50"
                disabled
              />
            </div>

            {/* Save Address Checkbox */}
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="save-address"
                checked={addressForm.saveAddress}
                onChange={(e) => handleAddressFormChange("saveAddress", e.target.checked)}
                className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
              />
              <label
                htmlFor="save-address"
                className="ml-2 text-sm text-gray-700"
              >
                Save this address for future orders
              </label>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveAddress}
              disabled={isSavingAddress || !addressForm.phone || !addressForm.addressLine1}
              className="w-full mt-6 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSavingAddress ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Save Address
                </>
              )}
            </button>

            {/* Back to Method Selection */}
            {!selectedAddress && (
              <button
                onClick={() => {
                  setShowAddressForm(false);
                  setShowAddressModal(true);
                }}
                className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl border border-gray-300 hover:border-gray-400 transition-all"
              >
                Choose Different Method
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // MapPickerModal Component
  const MapPickerModal = () => {
    // Handle map confirmation
    const handleMapConfirm = (position: { lat: number; lng: number; address?: string }) => {
      console.log("✅ Location confirmed from map:", position);
      
      // Save the location immediately
      handleSaveMapAddress(position);
    };

    // Handle manual confirm button click
    const handleManualConfirm = () => {
      if (!mapPhoneNumber.trim()) {
        alert("Please enter your phone number");
        return;
      }

      if (!validatePhoneNumber(mapPhoneNumber)) {
        alert("Please enter a valid phone number");
        return;
      }

      if (mapPosition) {
        handleSaveMapAddress(mapPosition);
      } else {
        alert("Please select a location on the map first");
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className={`text-xl font-semibold text-gray-800 ${lora.className}`}>
                Select Delivery Location
              </h3>
              <button
                type="button"
                title="Close"
                onClick={handleMapModalClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 text-sm mt-2">
              Click on the map to select your exact delivery location, then click "Confirm Location"
            </p>
          </div>

          <div className="p-6">
            {/* Phone Number Input in Map Modal */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number for Delivery *
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="tel"
                  value={mapPhoneNumber}
                  onChange={(e) => setMapPhoneNumber(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Required for delivery updates and confirmation
              </p>
            </div>

            {/* Selected Address Display */}
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <MapPin size={18} className="text-amber-600 mr-2" />
                  <span className="font-medium text-gray-800">Selected Location:</span>
                </div>
                {isReverseGeocoding && (
                  <div className="flex items-center text-sm text-amber-600">
                    <Loader2 size={14} className="animate-spin mr-1" />
                    Loading...
                  </div>
                )}
              </div>
              <p className="text-gray-700 text-sm">
                {selectedAddressFromMap}
              </p>
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Don't forget to click "Confirm Location" to save this address
              </p>
            </div>

            {/* Map Container */}
            <div className="h-[400px] w-full rounded-lg overflow-hidden mb-6">
              <GoogleMapPicker
                onLocationSelect={handleMapLocationSelect}
                initialPosition={mapPosition || { lat: 6.9271, lng: 79.8612 }}
                showConfirmButton={true}
                onConfirm={handleMapConfirm}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleUseCurrentLocation}
                className="flex-1 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center"
              >
                <Navigation size={18} className="mr-2" />
                Use Current Location
              </button>
              
              <button
                onClick={handleManualConfirm}
                disabled={!mapPosition || isSavingAddress || !mapPhoneNumber.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSavingAddress ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} className="mr-2" />
                    Save & Confirm Location
                  </>
                )}
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">
                    How to confirm your location:
                  </p>
                  <ol className="list-decimal pl-5 mt-1 space-y-1 text-sm text-blue-600">
                    <li>Enter your phone number above</li>
                    <li>Click on the map to select your delivery location</li>
                    <li>Drag the marker to adjust if needed</li>
                    <li><strong>Click the "Confirm Location" button in the map interface</strong></li>
                    <li><strong>OR click the "Save & Confirm Location" button above</strong></li>
                    <li>Address will be automatically saved when you confirm</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Back to Method Selection */}
            <button
              onClick={() => {
                setShowMapPicker(false);
                setShowAddressModal(true);
              }}
              className="w-full mt-4 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl border border-gray-300 hover:border-gray-400 transition-all"
            >
              Choose Different Method
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Guest Form Modal
  const GuestFormModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-semibold text-gray-800 ${lora.className}`}>
              Guest Checkout
            </h3>
            <button
              type="button"
              title="Close"
              onClick={() => {
                setShowGuestForm(false);
                // If guest hasn't filled info and there's no address, show address modal
                if (!guestUser.name || !guestUser.email || !guestUser.phone) {
                  setShowAddressModal(true);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Please provide your information for delivery
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={guestUser.name}
                  onChange={(e) => handleGuestFormChange("name", e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="email"
                  value={guestUser.email}
                  onChange={(e) => handleGuestFormChange("email", e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="tel"
                  value={guestUser.phone}
                  onChange={(e) => handleGuestFormChange("phone", e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Required for delivery updates
              </p>
            </div>

            {/* Save Info Checkbox */}
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="save-guest-info"
                checked={guestUser.saveInfo}
                onChange={(e) => handleGuestFormChange("saveInfo", e.target.checked)}
                className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
              />
              <label
                htmlFor="save-guest-info"
                className="ml-2 text-sm text-gray-700"
              >
                Save my information for faster checkout next time
              </label>
            </div>

            {/* Benefits */}
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                <CheckCircle size={16} className="mr-2" />
                Benefits of creating an account:
              </h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Track all your orders</li>
                <li>• Save favorite addresses</li>
                <li>• Faster checkout next time</li>
                <li>• View order history</li>
              </ul>
              <button
                onClick={() => {
                  setShowGuestForm(false);
                  window.location.href = "/register";
                }}
                className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
              >
                <UserPlus size={14} className="mr-1" />
                Create an account instead
              </button>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleGuestCheckout}
              disabled={!guestUser.name || !guestUser.email || !guestUser.phone}
              className="w-full mt-6 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ShoppingBag size={20} className="mr-2" />
              Continue as Guest
            </button>

            {/* Login Option */}
            <div className="text-center mt-4">
              <p className="text-gray-600 text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => window.location.href = "/login"}
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  <LogIn size={14} className="inline mr-1" />
                  Login
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Address Method Modal with guest notice
  const AddressMethodModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-semibold text-gray-800 ${lora.className}`}>
              {isLoggedIn ? "Select Address Method" : "Add Delivery Details"}
            </h3>
            <button
              type="button"
              title="Close"
              onClick={() => {
                setShowAddressModal(false);
                setAddressMethod(null);
                // If user is guest and hasn't filled info, show guest form
                if (!isLoggedIn && (!guestUser.name || !guestUser.email || !guestUser.phone)) {
                  setShowGuestForm(true);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            {isLoggedIn 
              ? "Choose how you want to enter your delivery address"
              : "Please enter your delivery address and phone number"}
          </p>
          {!isLoggedIn && (
            <div className="mt-2 bg-amber-50 p-2 rounded-lg">
              <p className="text-amber-700 text-xs">
                Ordering as guest: {guestUser.name || "Guest"}
              </p>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {/* Map Selection Option */}
            <button
              onClick={() => {
                setAddressMethod("map");
                setShowMapPicker(true);
              }}
              className="w-full p-6 border-2 border-blue-500 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all flex flex-col items-center justify-center gap-4"
            >
              <Map size={32} className="text-blue-500" />
              <div>
                <div className="font-semibold text-blue-700 text-lg">
                  Select on Map
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  Use Google Maps to pinpoint your exact location
                </div>
              </div>
            </button>

            {/* Manual Entry Option */}
            <button
              onClick={() => {
                setAddressMethod("manual");
                setShowAddressForm(true);
              }}
              className="w-full p-6 border-2 border-amber-500 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all flex flex-col items-center justify-center gap-4"
            >
              <Edit2 size={32} className="text-amber-500" />
              <div>
                <div className="font-semibold text-amber-700 text-lg">
                  Enter Manually
                </div>
                <div className="text-sm text-amber-600 mt-1">
                  Type your address and phone number
                </div>
              </div>
            </button>

            {/* Current Location Option */}
            <button
              onClick={handleUseCurrentLocation}
              className="w-full p-6 border-2 border-green-500 bg-green-50 rounded-xl hover:bg-green-100 transition-all flex flex-col items-center justify-center gap-4"
            >
              <Navigation size={32} className="text-green-500" />
              <div>
                <div className="font-semibold text-green-700 text-lg">
                  Use Current Location
                </div>
                <div className="text-sm text-green-600 mt-1">
                  Automatically detect your current location
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Your phone number is required for delivery confirmation</p>
            {!isLoggedIn && (
              <p className="text-amber-600 mt-1">
                Phone: {guestUser.phone || "Please provide"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Loading state for cart
  if (isLoadingCart) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#FAF7F0] to-white">
        <Navbar2 />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">
              Loading your cart...
            </h2>
          </div>
        </div>
      </main>
    );
  }

  // Empty cart state
  if (shops.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#FAF7F0] to-white">
        <Navbar2 />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
              <Package size={32} className="text-amber-500" />
            </div>
            <h3 className={`text-2xl font-semibold text-gray-800 mb-3 ${lora.className}`}>
              Your cart is empty
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Add some delicious surplus food items to get started!
            </p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg"
            >
              <ArrowLeft size={18} className="mr-2" />
              Continue Shopping
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FAF7F0] to-white text-black">
      <Navbar2 />
      
      {/* Show guest form for unregistered users when no guest info */}
      {showGuestForm && !isLoggedIn && (!guestUser.name || !guestUser.email || !guestUser.phone) && <GuestFormModal />}
      
      {/* Show method selection modal first if no address selected and guest info is complete */}
      {showAddressModal && !selectedAddress && !addressMethod && 
        (!isLoggedIn ? (guestUser.name && guestUser.email && guestUser.phone) : true) && 
        <AddressMethodModal />}
      
      {/* Show address form if manual method selected */}
      {showAddressForm && addressMethod === "manual" && <AddressFormModal />}
      
      {/* Show map picker if map method selected */}
      {showMapPicker && addressMethod === "map" && <MapPickerModal />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-8">
          <a href="/" className="hover:text-amber-600 transition-colors">
            Home
          </a>
          <ChevronRight size={16} className="mx-2" />
          <a href="/cart" className="hover:text-amber-600 transition-colors">
            Cart
          </a>
          <ChevronRight size={16} className="mx-2" />
          <span className="text-amber-600 font-medium">Checkout</span>
        </div>

        {/* Guest User Notice */}
        {!isLoggedIn && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <User size={20} className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-blue-800 mb-1">
                    Checking out as Guest
                  </h4>
                  <button
                    onClick={() => window.location.href = "/login"}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    <LogIn size={14} className="mr-1" />
                    Login Instead
                  </button>
                </div>
                <p className="text-blue-700 text-sm">
                  {guestUser.name 
                    ? `Hello, ${guestUser.name}! Your order will be processed as a guest.`
                    : "Please complete your guest information to proceed."}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {guestUser.name && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Name: {guestUser.name}
                    </span>
                  )}
                  {guestUser.email && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Email: {guestUser.email}
                    </span>
                  )}
                  {guestUser.phone && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Phone: {guestUser.phone}
                    </span>
                  )}
                </div>
                {(!guestUser.name || !guestUser.email || !guestUser.phone) && (
                  <button
                    onClick={() => setShowGuestForm(true)}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    <Edit2 size={14} className="mr-1" />
                    Edit Guest Information
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div className="ml-4">
                    <h3 className={`font-semibold text-gray-800 ${lora.className}`}>
                      Delivery
                    </h3>
                    <p className="text-sm text-gray-500">Address & time</p>
                  </div>
                </div>

                <div className="hidden md:block h-1 flex-1 mx-4 bg-gray-200">
                  <div className="h-full w-1/3 bg-amber-500"></div>
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center text-amber-600 font-bold">
                    2
                  </div>
                  <div className="ml-4">
                    <h3 className={`font-semibold text-gray-800 ${lora.className}`}>
                      Payment
                    </h3>
                    <p className="text-sm text-gray-500">Secure payment</p>
                  </div>
                </div>

                <div className="hidden md:block h-1 flex-1 mx-4 bg-gray-200"></div>

                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                    3
                  </div>
                  <div className="ml-4">
                    <h3 className={`font-semibold text-gray-800 ${lora.className}`}>
                      Confirmation
                    </h3>
                    <p className="text-sm text-gray-500">Order review</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold text-gray-800 ${lora.className}`}>
                  Delivery Details
                </h2>
              </div>

              {/* Single Address Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-700">
                      Delivery Address
                    </h3>
                    <button
                      onClick={checkLocationAvailability}
                      className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                      disabled={isCheckingLocation}
                    >
                      {isCheckingLocation ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <Navigation size={12} />
                          Check availability
                        </>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (!isLoggedIn && (!guestUser.name || !guestUser.email || !guestUser.phone)) {
                        setShowGuestForm(true);
                      } else {
                        setShowAddressModal(true);
                      }
                    }}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center"
                  >
                    <Edit2 size={14} className="mr-1" />
                    {selectedAddress ? "Change" : "Add Address"}
                  </button>
                </div>

                {/* Selected Address Display */}
                {selectedAddress ? (
                  <div className="border-2 rounded-xl p-4 transition-colors border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <div className="mr-3 mt-1">
                          {getAddressIcon(selectedAddress.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {selectedAddress.name}
                              </h4>
                              {selectedAddress.isDefault && (
                                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleEditAddress(selectedAddress)}
                              className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors ml-4"
                              title="Edit address"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                          {/* CLEAN ADDRESS DISPLAY - NO DUPLICATION */}
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {formatSriLankaAddress(selectedAddress)}
                          </p>
                          <p className="text-gray-500 text-sm mt-2">
                            📞 {selectedAddress.phone}
                          </p>

                          {/* Location Status */}
                          {locationStatus && (
                            <div
                              className={`mt-3 p-2 rounded-lg flex items-start gap-2 ${
                                locationStatus.type === "success"
                                  ? "bg-green-50 text-green-700"
                                  : locationStatus.type === "warning"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {isCheckingLocation ? (
                                <Loader2 size={16} className="animate-spin mt-0.5" />
                              ) : locationStatus.type === "success" ? (
                                <Check size={16} className="mt-0.5" />
                              ) : locationStatus.type === "warning" ? (
                                <AlertCircle size={16} className="mt-0.5" />
                              ) : (
                                <XCircle size={16} className="mt-0.5" />
                              )}
                              <span className="text-sm">
                                {locationStatus.message}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      if (!isLoggedIn && (!guestUser.name || !guestUser.email || !guestUser.phone)) {
                        setShowGuestForm(true);
                      } else {
                        setShowAddressModal(true);
                      }
                    }}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all"
                  >
                    <MapPin size={32} className="text-gray-400 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-800 mb-2">
                      Add Delivery Address
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Click to enter your delivery address and phone number
                    </p>
                    {customer?.mobileNumber && (
                      <p className="text-xs text-green-600 mt-2">
                        Your phone number: {customer.mobileNumber}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Unavailable Items Warning */}
              {!deliveryCalculations.allShopsAvailable &&
                deliveryCalculations.unavailableShops.length > 0 && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <AlertCircle size={20} className="text-red-500 mt-0.5 mr-3" />
                      <div>
                        <h4 className="font-medium text-red-800 mb-2">
                          Some items unavailable
                        </h4>
                        <p className="text-red-700 text-sm mb-2">
                          Items from the following shops cannot be delivered to
                          your selected address:
                        </p>
                        <ul className="text-sm text-red-600 space-y-1">
                          {deliveryCalculations.unavailableShops.map(
                            (shopName) => (
                              <li key={shopName} className="flex items-center">
                                <XCircle size={12} className="mr-2" />
                                {shopName}
                              </li>
                            )
                          )}
                        </ul>
                        <p className="text-sm text-red-600 mt-3">
                          Please remove these items or select a different
                          delivery address.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Delivery Time & Fee */}
              <div
                className={`rounded-xl p-4 mb-6 ${
                  !deliveryCalculations.allShopsAvailable
                    ? "bg-gray-100 opacity-60"
                    : "bg-amber-50"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={18} className="text-amber-500" />
                      <span className="text-sm text-gray-600">
                        Estimated Delivery
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {deliveryCalculations.estimatedDeliveryTime}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {hasMultipleShops() 
                        ? `Rider will collect from ${shops.length} shops and optimize route`
                        : "Direct delivery from shop"}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Truck size={18} className="text-amber-500" />
                      <span className="text-sm text-gray-600">
                        Delivery Fee
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      LKR {deliveryCalculations.totalDeliveryFee.toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {hasMultipleShops() 
                        ? `Combined fee for ${shops.length} shops`
                        : "Standard delivery fee"}
                    </p>
                  </div>
                </div>

                {!deliveryCalculations.allShopsAvailable && (
                  <div className="mt-3 text-sm text-gray-500">
                    <p>
                      Delivery time and fee will update when all items are
                      available
                    </p>
                  </div>
                )}
              </div>

              {/* Delivery Instructions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Instructions (Optional)
                </label>
                <textarea
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="e.g., Leave at door, call on arrival, building instructions, etc."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all min-h-[100px]"
                />
                <p className="text-xs text-gray-500 mt-2">
                  These instructions will be shared with the rider delivering
                  all your items
                </p>
              </div>
            </div>

            {/* Order Items by Shop */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className={`text-xl font-semibold text-gray-800 mb-6 ${lora.className}`}>
                Order Items ({shops.reduce((acc, shop) => acc + shop.items.length, 0)} items)
              </h2>

              <div className="space-y-6">
                {shops.map((shop) => {
                  const isShopUnavailable =
                    deliveryCalculations.unavailableShops.includes(shop.name);

                  return (
                    <div
                      key={shop.id}
                      className={`border-b border-gray-100 pb-6 last:border-0 last:pb-0 ${
                        isShopUnavailable ? "opacity-60" : ""
                      }`}
                    >
                      {/* Shop Items */}
                      <div className="space-y-3">
                        {shop.items.map((item: CartItem) => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between py-3 px-2 rounded-lg transition-colors ${
                              isShopUnavailable
                                ? "bg-red-50"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center flex-1">
                              <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 overflow-hidden ${
                                  isShopUnavailable
                                    ? "bg-red-100"
                                    : "bg-gradient-to-br from-amber-50 to-yellow-100"
                                }`}
                              >
                                {item.image ? (
                                  <Image
                                    src={getValidImageUrl(item.image)}
                                    alt={item.name}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = "https://placehold.co/200x200/e5e7eb/6b7280?text=No+Image";
                                      target.onerror = null; // Prevent infinite loop
                                    }}
                                  />
                                ) : (
                                  <Package
                                    size={18}
                                    className={
                                      isShopUnavailable
                                        ? "text-red-400"
                                        : "text-amber-500"
                                    }
                                  />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800 text-sm">
                                  {item.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  {item.description ||
                                    "Fresh surplus food item"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {/* Quantity */}
                              <div
                                className={`flex items-center border rounded-lg ${
                                  isShopUnavailable
                                    ? "border-red-300"
                                    : "border-gray-300"
                                }`}
                              >
                                <button
                                  type="button"
                                  title="Decrease Quantity"
                                  onClick={() => handleDecreaseQuantity(shop.id, item.id, item.quantity)}
                                  className={`p-2 rounded-l-lg transition-colors ${
                                    isShopUnavailable
                                      ? "hover:bg-red-100"
                                      : "hover:bg-gray-100"
                                  }`}
                                  disabled={isShopUnavailable}
                                >
                                  <Minus size={14} />
                                </button>
                                <span
                                  className={`px-3 py-1 text-sm font-medium ${
                                    isShopUnavailable ? "text-gray-400" : ""
                                  }`}
                                >
                                  {item.quantity || 1}
                                </span>
                                <button
                                  type="button"
                                  title="Increase Quantity"
                                  onClick={() => handleIncreaseQuantity(shop.id, item.id, item.quantity)}
                                  className={`p-2 rounded-r-lg transition-colors ${
                                    isShopUnavailable
                                      ? "hover:bg-red-100"
                                      : "hover:bg-gray-100"
                                  }`}
                                  disabled={isShopUnavailable}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="text-right min-w-[100px]">
                                <div className="flex items-center justify-end">
                                  {item.originalPrice &&
                                    item.originalPrice > item.price && (
                                      <span
                                        className={`line-through text-sm mr-2 ${
                                          isShopUnavailable
                                            ? "text-gray-400"
                                            : "text-gray-400"
                                        }`}
                                      >
                                        LKR{" "}
                                        {typeof item.originalPrice === "number"
                                          ? item.originalPrice.toFixed(2)
                                          : "0.00"}
                                      </span>
                                    )}
                                  <span
                                    className={`font-bold ${
                                      isShopUnavailable
                                        ? "text-gray-400"
                                        : "text-amber-600"
                                    }`}
                                  >
                                    LKR{" "}
                                    {typeof item.price === "number"
                                      ? (
                                          item.price * (item.quantity || 1)
                                        ).toFixed(2)
                                      : "0.00"}
                                  </span>
                                </div>
                              </div>

                              {/* Delete Button */}
                              <button
                                type="button"
                                title="Delete"
                                onClick={() => handleRemoveItem(shop.id, item.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isShopUnavailable
                                    ? "text-red-400 hover:text-red-500 hover:bg-red-100"
                                    : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                                }`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method - Only show if all items available */}
            {deliveryCalculations.allShopsAvailable ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className={`text-xl font-semibold text-gray-800 mb-6 ${lora.className}`}>
                  Payment Method
                </h2>

                {/* Payment Options */}
                <div className="mb-6 space-y-3">
                  {["card", "cash"].map((method) => (
                    <div
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === method
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-200 hover:border-amber-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                            paymentMethod === method
                              ? "border-amber-500 bg-amber-500"
                              : "border-gray-300"
                          }`}
                        >
                          {paymentMethod === method && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        {method === "card" && (
                          <CreditCard size={20} className="text-gray-600 mr-2" />
                        )}
                        {method === "cash" && (
                          <Wallet size={20} className="text-gray-600 mr-2" />
                        )}
                        <span className="font-medium">
                          {method === "card" && "Credit/Debit Card"}
                          {method === "cash" && "Cash on Delivery"}
                        </span>
                        {method === "cash" && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                            + LKR {COD_FEE.toFixed(2)} fee
                          </span>
                        )}
                      </div>
                      {method === "cash" && (
                        <p className="text-sm text-gray-500 mt-2 ml-9">
                          Additional LKR {COD_FEE.toFixed(2)} processing fee
                          applies
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Payment Form */}
                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cardNumber}
                        onChange={(e) =>
                          handleCardInputChange("cardNumber", e.target.value)
                        }
                        placeholder="1234 5678 9012 3456"
                        className={`w-full px-4 py-3 rounded-lg border transition-all ${
                          cardValidation.cardNumber.isValid
                            ? "border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            : "border-red-300 focus:ring-2 focus:ring-red-500"
                        }`}
                        maxLength={19}
                      />
                      {!cardValidation.cardNumber.isValid && (
                        <p className="text-red-500 text-sm mt-1">
                          {cardValidation.cardNumber.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={cardDetails.expiryDate}
                          onChange={(e) =>
                            handleCardInputChange("expiryDate", e.target.value)
                          }
                          placeholder="MM/YY"
                          className={`w-full px-4 py-3 rounded-lg border transition-all ${
                            cardValidation.expiryDate.isValid
                              ? "border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              : "border-red-300 focus:ring-2 focus:ring-red-500"
                          }`}
                          maxLength={5}
                        />
                        {!cardValidation.expiryDate.isValid && (
                          <p className="text-red-500 text-sm mt-1">
                            {cardValidation.expiryDate.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          onChange={(e) =>
                            handleCardInputChange("cvv", e.target.value)
                          }
                          placeholder="123"
                          className={`w-full px-4 py-3 rounded-lg border transition-all ${
                            cardValidation.cvv.isValid
                              ? "border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              : "border-red-300 focus:ring-2 focus:ring-red-500"
                          }`}
                          maxLength={4}
                        />
                        {!cardValidation.cvv.isValid && (
                          <p className="text-red-500 text-sm mt-1">
                            {cardValidation.cvv.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cardholderName}
                        onChange={(e) =>
                          handleCardInputChange(
                            "cardholderName",
                            e.target.value
                          )
                        }
                        placeholder="John Doe"
                        className={`w-full px-4 py-3 rounded-lg border transition-all ${
                          cardValidation.cardholderName.isValid
                            ? "border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            : "border-red-300 focus:ring-2 focus:ring-red-500"
                        }`}
                      />
                      {!cardValidation.cardholderName.isValid && (
                        <p className="text-red-500 text-sm mt-1">
                          {cardValidation.cardholderName.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    id="save-info"
                    checked={saveInfo}
                    onChange={(e) => setSaveInfo(e.target.checked)}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <label
                    htmlFor="save-info"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Save this payment method for future purchases
                  </label>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle size={32} className="text-red-500" />
                  </div>
                  <h3 className={`text-lg font-semibold text-gray-800 mb-3 ${lora.className}`}>
                    Complete Your Order
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    Please remove unavailable items or select a different
                    delivery address to continue with payment.
                  </p>
                  <button
                    onClick={() => {
                      if (!isLoggedIn && (!guestUser.name || !guestUser.email || !guestUser.phone)) {
                        setShowGuestForm(true);
                      } else {
                        setShowAddressModal(true);
                      }
                    }}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg"
                  >
                    <MapPin size={18} className="mr-2" />
                    Change Delivery Address
                  </button>
                </div>
              </div>
            )}

            {/* Security Banner */}
            {deliveryCalculations.allShopsAvailable && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="text-amber-600 mr-3" size={24} />
                    <div>
                      <h4 className={`font-semibold text-gray-800 ${lora.className}`}>
                        Secure & Optimized Delivery
                      </h4>
                      <p className="text-sm text-gray-600">
                        Your payment is encrypted. Our system optimizes delivery
                        routes across multiple shops for fastest service.
                      </p>
                    </div>
                  </div>
                  <Lock className="text-amber-600" size={20} />
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Order Summary */}
              <div
                className={`bg-white rounded-2xl shadow-sm border p-6 mb-6 ${
                  !deliveryCalculations.allShopsAvailable
                    ? "border-red-200"
                    : "border-gray-200"
                }`}
              >
                <h2 className={`text-xl font-semibold text-gray-800 mb-6 ${lora.className}`}>
                  Order Summary
                </h2>

                {/* Shop Count in Order Summary */}
                {hasMultipleShops() && (
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Shops in this order:</span>
                      <div className="flex items-center">
                        <Store size={14} className="text-amber-500 mr-1" />
                        <span className="font-medium text-amber-700">{getShopCountText()}</span>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      {shops.slice(0, 3).map(shop => (
                        <div key={shop.id} className="flex items-center text-xs text-gray-500">
                          <div className="w-2 h-2 rounded-full bg-amber-400 mr-2"></div>
                          <span className="truncate">{shop.name}</span>
                        </div>
                      ))}
                      {shops.length > 3 && (
                        <div className="text-xs text-gray-400">
                          + {shops.length - 3} more shops
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Items Summary */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>
                      Items (
                      {shops.reduce((acc, shop) => acc + shop.items.length, 0)})
                    </span>
                    <span>LKR {calculateOverallSubtotal().toFixed(2)}</span>
                  </div>

                  {calculateTotalDiscount() > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-LKR {calculateTotalDiscount().toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>
                      LKR {deliveryCalculations.totalDeliveryFee.toFixed(2)}
                    </span>
                    {hasMultipleShops() && (
                      <span className="text-xs text-amber-600 ml-2">
                        ({shops.length} shops)
                      </span>
                    )}
                  </div>

                  {/* COD Fee */}
                  {paymentMethod === "cash" && (
                    <div className="flex justify-between text-red-600">
                      <span>COD Processing Fee</span>
                      <span>+LKR {COD_FEE.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between font-bold text-xl">
                      <span>Total</span>
                      <span>LKR {total.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {hasMultipleShops() 
                        ? `Includes delivery from ${shops.length} shops`
                        : "Includes delivery from shop"}
                      {paymentMethod === "cash" && " + COD fee"}
                    </p>
                  </div>
                </div>

                {/* Delivery Summary */}
                <div
                  className={`rounded-xl p-4 mb-6 ${
                    !deliveryCalculations.allShopsAvailable
                      ? "bg-red-50"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Truck
                      size={18}
                      className={
                        !deliveryCalculations.allShopsAvailable
                          ? "text-red-500"
                          : "text-amber-500"
                      }
                    />
                    <span className="font-medium text-gray-800">
                      Delivery Details
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Estimated Time</span>
                      <span className="font-medium">
                        {deliveryCalculations.estimatedDeliveryTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>From Shops</span>
                      <span className="font-medium">{getShopCountText()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery To</span>
                      <span className="font-medium text-right">
                        {selectedAddress ? formatSriLankaAddress(selectedAddress).split(',')[0] : "Select address"}
                      </span>
                    </div>
                    {!deliveryCalculations.allShopsAvailable && (
                      <div className="flex justify-between text-red-600">
                        <span>Status</span>
                        <span className="font-medium">Check availability</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    isPlacingOrder ||
                    !deliveryCalculations.allShopsAvailable ||
                    !selectedAddress ||
                    (paymentMethod === "card" && !isCardValid())
                  }
                  className={`w-full py-4 font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center mb-4 ${
                    !deliveryCalculations.allShopsAvailable ||
                    !selectedAddress ||
                    isPlacingOrder
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : paymentMethod === "card" && !isCardValid()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 hover:shadow-xl"
                  }`}
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 size={20} className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock size={20} className="mr-2" />
                      {!selectedAddress
                        ? "Add Address First"
                        : !deliveryCalculations.allShopsAvailable
                        ? "Fix Delivery Issues First"
                        : paymentMethod === "card" && !isCardValid()
                        ? "Fix Card Details"
                        : `Place Order - LKR ${total.toFixed(2)}`}
                    </>
                  )}
                </button>

                {/* Order Error Display */}
                {orderError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle size={16} className="text-red-500 mr-2" />
                      <span className="text-red-700 text-sm">
                        {orderError}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-center text-sm text-gray-500">
                  By placing your order, you agree to our Terms & Conditions
                </p>
              </div>

              {/* Benefits */}
              {deliveryCalculations.allShopsAvailable && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className={`font-semibold text-gray-800 mb-4 ${lora.className}`}>
                    {hasMultipleShops() ? "Multi-Shop Benefits" : "Order Benefits"}
                  </h3>
                  <div className="space-y-3">
                    {hasMultipleShops() && (
                      <>
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-500 mr-3" />
                          <span className="text-sm text-gray-600">
                            One rider collects from all shops
                          </span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-500 mr-3" />
                          <span className="text-sm text-gray-600">
                            Optimized route for faster delivery
                          </span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-500 mr-3" />
                          <span className="text-sm text-gray-600">
                            Single delivery fee
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center">
                      <CheckCircle size={16} className="text-green-500 mr-3" />
                      <span className="text-sm text-gray-600">
                        Real-time order tracking
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle size={16} className="text-green-500 mr-3" />
                      <span className="text-sm text-gray-600">
                        Secure payment processing
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}