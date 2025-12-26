// app/settings/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import CustomerSidebar from "../../components/CustomerSidebar";
import { useCusAuthStore } from "@/app/ZustandStore/authStore";

// --- Updated UserProfile Interface ---
interface UserProfile {
  name: string;
  email: string;
  mobileNumber: string;
  cusProfileImg: string | File;
  location: string;
  city: string;
  zipCode: string;
}

// API base URL (adjust this to match your backend)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserProfile | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { customer, fetchCusDetails, updateCusDetails, loading, error } = useCusAuthStore();

  useEffect(() => {
    fetchCusDetails();
  }, [fetchCusDetails]);

  // Function to get the full image URL
  const getFullImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) return "/default-avatar.jpg";
    
    // If it's already a full URL (starts with http:// or https://), return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it starts with /uploads, prepend the API base URL
    if (imagePath.startsWith('/uploads/')) {
      return `${API_BASE_URL}${imagePath}`;
    }
    
    // For other relative paths, prepend the API base URL
    if (imagePath.startsWith('/')) {
      return `${API_BASE_URL}${imagePath}`;
    }
    
    // If it's just a filename, assume it's in the uploads folder
    return `${API_BASE_URL}/uploads/${imagePath}`;
  };

  // Initialize formData and userProfile when customer data loads
  useEffect(() => {
    if (customer) {
      const profileData: UserProfile = {
        name: customer.name || "",
        email: customer.email || "",
        location: customer.location || "",
        mobileNumber: customer.mobileNumber || "",
        city: customer.city || "",
        zipCode: customer.zipCode || "",
        cusProfileImg: customer.cusProfileImg || ""
      };
      setUserProfile(profileData);
      setFormData(profileData);
      
      // Set initial image preview if there's an existing profile image
      if (customer.cusProfileImg) {
        const fullImageUrl = getFullImageUrl(customer.cusProfileImg);
        setImagePreview(fullImageUrl);
        console.log("Initial image URL:", fullImageUrl);
      }
    }
  }, [customer]);

  const handleSave = async () => { 
    if (!formData) return;

    setIsLoading(true);

    try {
      console.log('=== SENDING TO ZUSTAND STORE ===');
      console.log('Form Data to be sent:', formData);
      
      // Log specifically what cusProfileImg contains
      if (formData.cusProfileImg instanceof File) {
        console.log('Profile image is a File object:', {
          name: formData.cusProfileImg.name,
          type: formData.cusProfileImg.type,
          size: formData.cusProfileImg.size,
          lastModified: formData.cusProfileImg.lastModified
        });
      } else {
        console.log('Profile image is a string (URL):', formData.cusProfileImg);
      }

      // Get the profile image file or undefined
      const profileImage = formData.cusProfileImg instanceof File 
        ? formData.cusProfileImg 
        : undefined;

      // Update profile via Zustand store
      const result = await updateCusDetails(
        {
          name: formData.name,
          email: formData.email,
          location: formData.location,
          mobileNumber: formData.mobileNumber,
          city: formData.city,
          zipCode: formData.zipCode
        },
        profileImage
      );

      console.log('=== RESPONSE FROM ZUSTAND STORE ===');
      console.log('Update result:', result);
      
      // If the store returns a URL for the image, update our preview
      if (result && result.cusProfileImg) {
        const fullImageUrl = getFullImageUrl(result.cusProfileImg);
        console.log('New profile image URL from store:', fullImageUrl);
        setImagePreview(fullImageUrl);
      }

      // Update local state after successful update
      // If cusProfileImg is a File, convert it to the new URL if available
      const updatedProfile: UserProfile = {
        ...formData,
        cusProfileImg: result?.cusProfileImg || 
                      (formData.cusProfileImg instanceof File && imagePreview ? imagePreview : formData.cusProfileImg)
      };
      
      setUserProfile(updatedProfile);
      setIsEditing(false);
      
      console.log('=== LOCAL STATE UPDATED ===');
      console.log('Updated userProfile:', updatedProfile);

    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(userProfile);
    setIsEditing(false);
    
    // Reset image preview to original if we had changed it
    if (customer?.cusProfileImg) {
      const fullImageUrl = getFullImageUrl(customer.cusProfileImg);
      setImagePreview(fullImageUrl);
    }
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => {
      if (!prev) return null;
      return { 
        ...prev, 
        [field]: value 
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    console.log('=== FILE SELECTED ===');
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toLocaleString()
    });

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    console.log('Preview URL created:', previewUrl);

    // Update formData with the selected file
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cusProfileImg: file
      };
    });
  };

  const handleRemoveImage = () => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cusProfileImg: "" // Set to empty string to remove image
      };
    });
    setImagePreview(null);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    console.log('=== IMAGE REMOVED ===');
    console.log('Profile image set to empty string');
  };

  const getImageSrc = () => {
    // When editing and we have a preview, use it
    if (isEditing && imagePreview) {
      return imagePreview;
    }
    
    // When not editing, use the userProfile image (if it exists)
    if (!isEditing && userProfile?.cusProfileImg) {
      // If it's a string (URL), get the full URL
      if (typeof userProfile.cusProfileImg === 'string') {
        return getFullImageUrl(userProfile.cusProfileImg);
      }
    }
    
    // Default fallback
    return "/default-avatar.jpg";
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50/20">
      <CustomerSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 p-6 shadow-sm">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-2">Manage your profile and preferences</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-6">
                  <nav className="space-y-1">
                    {[
                      { id: "profile", name: "Profile", icon: "👤" },
                      { id: "security", name: "Security", icon: "🔒" },
                      { id: "privacy", name: "Privacy", icon: "👁️" }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                          activeTab === item.id
                            ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border border-blue-100"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  
                  {/* Profile Tab */}
                  {activeTab === "profile" && (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                          <p className="text-gray-600">Update your personal details</p>
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

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Avatar Section */}
                        <div className="lg:col-span-2">
                          <div className="flex items-center space-x-6">
                            <div className="relative">
                              <img
                                src={getImageSrc()}
                                alt="Profile"
                                className="w-24 h-24 rounded-2xl object-cover shadow-lg border-2 border-gray-200"
                                onError={(e) => {
                                  // Fallback to default avatar if image fails to load
                                  (e.target as HTMLImageElement).src = "/default-avatar.jpg";
                                }}
                              />
                              
                              {isEditing && (
                                <>
                                  <input
                                    title="Image"
                                    ref={fileInputRef}
                                    type="file"
                                    id="profile-pic-input"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                  />
                                  <div className="absolute bottom-0 right-0 flex space-x-2">
                                    <button 
                                      type="button"
                                      onClick={() => fileInputRef.current?.click()}
                                      className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                                      title="Change photo"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                    </button>
                                    
                                    {formData?.cusProfileImg && (
                                      <button 
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                        title="Remove photo"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{userProfile?.name || "N/A"}</h3>
                              <p className="text-gray-600">{userProfile?.email || "N/A"}</p>
                              <p className="text-sm text-gray-500">Member since Jan 2024</p>
                              
                              {/* Show file name when selected */}
                              {isEditing && formData?.cusProfileImg instanceof File && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                                  <p className="text-sm text-blue-700">
                                    <span className="font-medium">Selected:</span> {formData.cusProfileImg.name}
                                  </p>
                                  <p className="text-xs text-blue-600">
                                    Size: {(formData.cusProfileImg.size / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Form Fields */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                          <input
                            type="text"
                            placeholder="Name"
                            value={isEditing ? (formData?.name || "") : (userProfile?.name || "")}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                          <input
                            type="email"
                            placeholder="Email"
                            value={isEditing ? (formData?.email || "") : (userProfile?.email || "")}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                          <input
                            type="tel"
                            placeholder="Mobile Number"
                            value={isEditing ? (formData?.mobileNumber || "") : (userProfile?.mobileNumber || "")}
                            onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                          <input
                            type="text"
                            placeholder="Address"
                            value={isEditing ? (formData?.location || "") : (userProfile?.location || "")}
                            onChange={(e) => handleInputChange("location", e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                          <input
                            type="text"
                            placeholder="City"
                            value={isEditing ? (formData?.city || "") : (userProfile?.city || "")}
                            onChange={(e) => handleInputChange("city", e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                          <input
                            type="text"
                            placeholder="Zip Code"
                            value={isEditing ? (formData?.zipCode || "") : (userProfile?.zipCode || "")}
                            onChange={(e) => handleInputChange("zipCode", e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
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
                        <div className="p-4 border border-gray-200 rounded-xl">
                          <h3 className="font-medium text-gray-900 mb-2">Change Password</h3>
                          <p className="text-sm text-gray-600 mb-4">Update your password regularly to keep your account secure</p>
                          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                            Change Password
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Privacy Tab */}
                  {activeTab === "privacy" && (
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Settings</h2>
                      <div className="space-y-6">
                        <div className="p-4 border border-gray-200 rounded-xl">
                          <h3 className="font-medium text-gray-900 mb-2">Data Sharing</h3>
                          <p className="text-sm text-gray-600 mb-4">Control how your data is used to improve your experience</p>
                          <label className="flex items-center space-x-3">
                            <input type="checkbox" className="rounded text-blue-500" defaultChecked />
                            <span className="text-sm">Allow personalized recommendations</span>
                          </label>
                        </div>

                        <div className="p-4 border border-gray-200 rounded-xl">
                          <h3 className="font-medium text-gray-900 mb-2">Account Deletion</h3>
                          <p className="text-sm text-gray-600 mb-4">Permanently delete your account and all associated data</p>
                          <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}