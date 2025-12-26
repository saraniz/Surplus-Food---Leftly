"use client";

import { useEffect, useState, useRef } from "react";
import SellerSidebar from "../../components/sellerdashboard";
import SellerHeader from "../../components/sellerHeader";
import { useCusAuthStore } from "@/app/ZustandStore/authStore";
import { MapPin, Loader2, Navigation, Check, Camera, X } from "lucide-react";

interface StoreSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  openingHours: string;
  deliveryRadius: string;
  website: string;
  category: string;
  storeImg?: string;
  coverImg?: string;
  latitude?: number;
  longitude?: number;
}

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    openingHours: "",
    deliveryRadius: "",
    website: "",
    category: "",
    storeImg: "",
    coverImg: "",
    latitude: 6.9271, 
    longitude: 79.8612
  });

  const { seller, fetchSellerDetailsFromToken, updateSellerDetails, loading, error } = useCusAuthStore();
  const [formData, setFormData] = useState(storeSettings);
  const [manualCoordinates, setManualCoordinates] = useState({
    latitude: "",
    longitude: ""
  });

  // Refs for file inputs
  const storeImgInputRef = useRef<HTMLInputElement>(null);
  const coverImgInputRef = useRef<HTMLInputElement>(null);

  // Image preview states
  const [storeImgPreview, setStoreImgPreview] = useState<string | null>(null);
  const [coverImgPreview, setCoverImgPreview] = useState<string | null>(null);

  // Tabs array - removed notifications tab
  const tabs = [
    { id: "profile", name: "Store Profile", icon: "🏪", description: "Manage your store information" },
    { id: "security", name: "Security", icon: "🔒", description: "Security and privacy settings" },
    { id: "payment", name: "Payment", icon: "💳", description: "Payment methods and payout" },
  ];

  const categories = [
    "Grocery & Market",
    "Restaurant & Cafe",
    "Bakery",
    "Butcher Shop",
    "Farmers Market",
    "Food Truck",
    "Specialty Store"
  ];

  useEffect(() => {
    fetchSellerDetailsFromToken();
  }, [fetchSellerDetailsFromToken]);

  useEffect(() => {
    if (seller) {
      setStoreSettings({
        name: seller.businessName,
        email: seller.businessEmail,
        address: seller.businessAddress,
        phone: seller.phoneNum || "",
        category: seller.category || "",
        openingHours: seller.openingHours || "",
        deliveryRadius: seller.deliveryRadius || "",
        website: seller.website || "",
        description: seller.storeDescription || "",
        storeImg: seller.storeImg || "",
        coverImg: seller.coverImg || "",
        latitude: ((seller as any).latitude ?? (seller as any).lat ?? (seller as any).location?.latitude) ?? 6.9271,
        longitude: ((seller as any).longitude ?? (seller as any).lng ?? (seller as any).location?.longitude) ?? 79.8612
      });
    }
  }, [seller]);

  useEffect(() => {
    setFormData(storeSettings);
  }, [storeSettings]);

  // Get current location from browser
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        setIsGettingLocation(false);
        console.log(`Got location: ${latitude}, ${longitude}`);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsGettingLocation(false);
        alert("Unable to retrieve your location. Please enter coordinates manually.");
      }
    );
  };

  // Handle manual coordinate input
  const handleManualCoordinatesSubmit = () => {
    const lat = parseFloat(manualCoordinates.latitude);
    const lng = parseFloat(manualCoordinates.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert("Please enter valid latitude and longitude values");
      return;
    }

    if (lat < -90 || lat > 90) {
      alert("Latitude must be between -90 and 90");
      return;
    }

    if (lng < -180 || lng > 180) {
      alert("Longitude must be between -180 and 180");
      return;
    }

    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
    
    setManualCoordinates({ latitude: "", longitude: "" });
    alert("Coordinates updated successfully!");
  };

  const handleSave = async () => {
  try {
    setIsLoading(true);
    
    // Create FormData for file uploads
    const formDataToSend = new FormData();
    
    // Add text fields
    formDataToSend.append("businessName", formData.name);
    formDataToSend.append("businessEmail", formData.email);
    formDataToSend.append("businessAddress", formData.address);
    formDataToSend.append("phoneNum", formData.phone);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("openingHours", formData.openingHours);
    formDataToSend.append("deliveryRadius", formData.deliveryRadius);
    formDataToSend.append("website", formData.website);
    formDataToSend.append("storeDescription", formData.description);
    if (formData.latitude) formDataToSend.append("latitude", formData.latitude.toString());
    if (formData.longitude) formDataToSend.append("longitude", formData.longitude.toString());

    // Get files from inputs if they exist
    if (storeImgInputRef.current?.files?.[0]) {
      formDataToSend.append("storeImg", storeImgInputRef.current.files[0]);
    }
    
    if (coverImgInputRef.current?.files?.[0]) {
      formDataToSend.append("coverImg", coverImgInputRef.current.files[0]);
    }

    // Create an object for Zustand store (if not using FormData directly)
    const updateData = {
      businessName: formData.name,
      businessEmail: formData.email,
      businessAddress: formData.address,
      phoneNum: formData.phone,
      category: formData.category,
      openingHours: formData.openingHours,
      deliveryRadius: formData.deliveryRadius,
      website: formData.website,
      storeDescription: formData.description,
      latitude: formData.latitude,
      longitude: formData.longitude,
    };

    // Get the file objects
    const storeImgFile = storeImgInputRef.current?.files?.[0];
    const coverImgFile = coverImgInputRef.current?.files?.[0];

    // Call update with both text data and files
    await updateSellerDetails(updateData, storeImgFile, coverImgFile);

    // OPTION 1: Update local state directly with the response (recommended)
    // The Zustand store already updates the seller state from the updateSellerDetails response
    
    // OPTION 2: If you need to refresh, use an existing endpoint
    // Since you're a seller, you can fetch your own details using your seller ID
    const sellerId = seller?.seller_id;
    if (sellerId) {
      // Use the protected endpoint with your ID
      // You'll need to add this function to your authStore or use existing one
      // fetchSellerDetailsProtected(sellerId);
    }

    setStoreSettings(formData);
    setIsEditing(false);
    
    // Clear file inputs and previews
    if (storeImgInputRef.current) storeImgInputRef.current.value = '';
    if (coverImgInputRef.current) coverImgInputRef.current.value = '';
    setStoreImgPreview(null);
    setCoverImgPreview(null);
    
  } catch (err) {
    console.error("Error updating seller:", err);
  } finally {
    setIsLoading(false);
  }
};

  const handleCancel = () => {
    setFormData(storeSettings);
    setIsEditing(false);
    setStoreImgPreview(null);
    setCoverImgPreview(null);
    if (storeImgInputRef.current) storeImgInputRef.current.value = '';
    if (coverImgInputRef.current) coverImgInputRef.current.value = '';
  };

  const handleInputChange = (field: keyof StoreSettings, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle image file selection
  const handleImageSelect = (type: 'storeImg' | 'coverImg', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    if (type === 'storeImg') {
      setStoreImgPreview(previewUrl);
      // Don't update formData here - we'll handle it during save
    } else {
      setCoverImgPreview(previewUrl);
      // Don't update formData here - we'll handle it during save
    }
  };

  // Remove image
  const handleRemoveImage = (type: 'storeImg' | 'coverImg') => {
    if (type === 'storeImg') {
      setStoreImgPreview(null);
      if (storeImgInputRef.current) storeImgInputRef.current.value = '';
    } else {
      setCoverImgPreview(null);
      if (coverImgInputRef.current) coverImgInputRef.current.value = '';
    }
  };

  // Get image URLs for display
  const getStoreImgSrc = () => {
    if (storeImgPreview) return storeImgPreview;
    if (formData.storeImg) return formData.storeImg;
    return "/default-store-img.jpg";
  };

  const getCoverImgSrc = () => {
    if (coverImgPreview) return coverImgPreview;
    if (formData.coverImg) return formData.coverImg;
    return "/default-cover-img.jpg";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <SellerHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
          title="Store Settings"
          subtitle="Manage your store"
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Settings Navigation */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-6">
                  <nav className="space-y-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                          activeTab === tab.id
                            ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border border-blue-100 shadow-sm"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-xl">{tab.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{tab.name}</div>
                          <div className="text-xs opacity-75">{tab.description}</div>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Settings Content */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  
                  {/* Store Profile Tab */}
                  {activeTab === "profile" && (
                    <div className="p-6 text-black">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Store Profile</h2>
                          <p className="text-gray-600">Update your store information and branding</p>
                        </div>
                        {!isEditing ? (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            Edit Profile
                          </button>
                        ) : (
                          <div className="flex space-x-3">
                            <button
                              onClick={handleCancel}
                              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSave}
                              disabled={isLoading}
                              className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-xl font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                            >
                              {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Cover Image Section */}
                      <div className="mb-8">
                        <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden border border-gray-200">
                          <img
                            src={getCoverImgSrc()}
                            alt="Store Cover"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/default-cover-img.jpg";
                            }}
                          />
                          {isEditing && (
                            <>
                              <input
                                ref={coverImgInputRef}
                                type="file"
                                title="Cover Image"
                                id="cover-img-input"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageSelect('coverImg', e)}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => coverImgInputRef.current?.click()}
                                  className="bg-white text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-colors"
                                >
                                  <Camera size={18} />
                                  Change Cover
                                </button>
                              </div>
                              {coverImgPreview && (
                                <button
                                  type="button"
                                  title="Cover image"
                                  onClick={() => handleRemoveImage('coverImg')}
                                  className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Cover image for your store (Recommended: 1200×400)</p>
                      </div>

                      {/* Store Logo/Profile Image Section */}
                      <div className="flex items-center space-x-6 mb-8">
                        <div className="relative">
                          <img
                            src={getStoreImgSrc()}
                            alt="Store Logo"
                            className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/default-store-img.jpg";
                            }}
                          />
                          {isEditing && (
                            <>
                              <input
                                ref={storeImgInputRef}
                                title="Image"
                                type="file"
                                id="store-img-input"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageSelect('storeImg', e)}
                              />
                              <button
                                type="button"
                                title="image"
                                onClick={() => storeImgInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                              >
                                <Camera size={16} />
                              </button>
                              {storeImgPreview && (
                                <button
                                  title="Storeimage"
                                  type="button"
                                  onClick={() => handleRemoveImage('storeImg')}
                                  className="absolute top-0 right-0 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{formData.name || "Store Name"}</h3>
                          <p className="text-gray-600">{formData.email || "store@example.com"}</p>
                          <p className="text-sm text-gray-500">Store logo (Recommended: 200×200)</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Store Name *</label>
                          <input
                            type="text"
                            title="Store name"
                            value={isEditing ? formData.name : storeSettings.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Category</label>
                          <select
                            title="Category"
                            value={isEditing ? formData.category : storeSettings.category}
                            onChange={(e) => handleInputChange("category", e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Email Address *</label>
                          <input
                            type="email"
                            title="Email"
                            value={isEditing ? formData.email : storeSettings.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Phone Number *</label>
                          <input
                            type="tel"
                            title="Number"
                            value={isEditing ? formData.phone : storeSettings.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Opening Hours</label>
                          <input
                            type="text"
                            title="Opening hours"
                            value={isEditing ? formData.openingHours : storeSettings.openingHours}
                            onChange={(e) => handleInputChange("openingHours", e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Delivery Radius (miles)</label>
                          <input
                            type="number"
                            title="Delivery Radius (miles)"
                            value={isEditing ? formData.deliveryRadius : storeSettings.deliveryRadius}
                            onChange={(e) => handleInputChange("deliveryRadius", parseInt(e.target.value))}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-black mb-2">Store Address *</label>
                          <input
                            type="text"
                            title="Website"
                            value={isEditing ? formData.address : storeSettings.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-black mb-2">Website</label>
                          <input
                            type="url"
                            title="Website"
                            value={isEditing ? formData.website : storeSettings.website}
                            onChange={(e) => handleInputChange("website", e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          />
                        </div>

                        {/* Shop Location Coordinates Section */}
                        <div className="md:col-span-2">
                          <div className="border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">Shop Location Coordinates</h3>
                                <p className="text-sm text-gray-600">Used for delivery distance calculations</p>
                              </div>
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={getCurrentLocation}
                                  disabled={isGettingLocation}
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 text-sm flex items-center gap-2"
                                >
                                  {isGettingLocation ? (
                                    <>
                                      <Loader2 size={16} className="animate-spin" />
                                      Getting location...
                                    </>
                                  ) : (
                                    <>
                                      <Navigation size={16} />
                                      Use Current Location
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-black mb-2">Latitude</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="any"
                                      value={formData.latitude || ""}
                                      onChange={(e) => handleInputChange("latitude", parseFloat(e.target.value) || 0)}
                                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="e.g., 40.7128"
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                      {formData.latitude ? (
                                        <Check size={16} className="text-green-500" />
                                      ) : null}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-black mb-2">Longitude</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="any"
                                      value={formData.longitude || ""}
                                      onChange={(e) => handleInputChange("longitude", parseFloat(e.target.value) || 0)}
                                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="e.g., -74.0060"
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                      {formData.longitude ? (
                                        <Check size={16} className="text-green-500" />
                                      ) : null}
                                    </div>
                                  </div>
                                </div>

                                {/* Current Coordinates Display */}
                                <div className="md:col-span-2">
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MapPin size={18} className="text-blue-500" />
                                      <span className="font-medium text-blue-800">Current Coordinates</span>
                                    </div>
                                    <div className="text-sm text-blue-700">
                                      {formData.latitude && formData.longitude ? (
                                        <div className="space-y-1">
                                          <div>Latitude: <span className="font-mono">{formData.latitude.toFixed(6)}</span></div>
                                          <div>Longitude: <span className="font-mono">{formData.longitude.toFixed(6)}</span></div>
                                          <div className="text-xs text-blue-600 mt-2">
                                            These coordinates will be used for delivery distance calculations
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-blue-600">No coordinates set. Click "Use Current Location" or enter manually.</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Manual Entry Option */}
                                <div className="md:col-span-2">
                                  <div className="border-t border-gray-200 pt-4 mt-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Manual Coordinate Entry</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <input
                                        type="number"
                                        step="any"
                                        value={manualCoordinates.latitude}
                                        onChange={(e) => setManualCoordinates(prev => ({ ...prev, latitude: e.target.value }))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        placeholder="Enter latitude"
                                      />
                                      <input
                                        type="number"
                                        step="any"
                                        value={manualCoordinates.longitude}
                                        onChange={(e) => setManualCoordinates(prev => ({ ...prev, longitude: e.target.value }))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        placeholder="Enter longitude"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleManualCoordinatesSubmit}
                                      disabled={!manualCoordinates.latitude || !manualCoordinates.longitude}
                                      className="mt-3 w-full bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                      Set Manual Coordinates
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <MapPin size={18} className="text-gray-600" />
                                  <span className="font-medium text-gray-800">Shop Location</span>
                                </div>
                                {storeSettings.latitude && storeSettings.longitude ? (
                                  <div className="text-sm text-gray-700 space-y-1">
                                    <div>Latitude: <span className="font-mono">{storeSettings.latitude.toFixed(6)}</span></div>
                                    <div>Longitude: <span className="font-mono">{storeSettings.longitude.toFixed(6)}</span></div>
                                  </div>
                                ) : (
                                  <p className="text-gray-600 text-sm">No coordinates set</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-black mb-2">Store Description</label>
                          <textarea
                            title="Description"
                            value={isEditing ? formData.description : storeSettings.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            disabled={!isEditing}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Security Tab */}
                  {activeTab === "security" && (
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>
                      
                      <div className="space-y-6">
                        <div className="p-6 border border-gray-200 rounded-xl">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                              <p className="text-gray-600">Add an extra layer of security to your account</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 border border-gray-200 rounded-xl">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Password</h3>
                          <p className="text-gray-600 mb-4">Keep your password secure and change it regularly</p>
                          <button
                            onClick={() => console.log("Change password clicked")}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Change Password
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Tab */}
                  {activeTab === "payment" && (
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Settings</h2>
                      
                      <div className="space-y-6">
                        <div className="p-6 border border-gray-200 rounded-xl">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-6 bg-blue-500 rounded flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">Stripe</span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">Stripe Connect</div>
                                  <div className="text-sm text-gray-600">Credit card payments</div>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                true  // Replace with actual condition
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                Connected
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 border border-gray-200 rounded-xl">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Settings</h3>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account</label>
                              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                **** **** **** 1234
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Payout Schedule</label>
                              <select 
                                defaultValue="Weekly"
                                id="payoutSchedule"
                                title="payoutSchedule"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Bi-weekly">Bi-weekly</option>
                                <option value="Monthly">Monthly</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}