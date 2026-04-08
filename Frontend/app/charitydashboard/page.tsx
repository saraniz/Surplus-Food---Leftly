"use client";

import { useEffect, useState, useRef } from "react";
import { useCusAuthStore } from "../ZustandStore/authStore";
import { useRouter } from "next/navigation";
import Navbar2 from "../components/Navbar2";
import { User, LogOut, Camera, MapPin, Mail, Home } from "lucide-react";
import CharityDashboard from "../components/donations/CharityDashboard";
import CharityMessages from "../components/donations/CharityMessages";
import CharitySettings from "../components/donations/CharitySettings";
import { lora } from "@/app/libs/fonts";
import { MessageSquare, Settings as SettingsIcon, Heart } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CharityDashboardPage() {
  const router = useRouter();
  const { charity, fetchCharityDetails, updateCharityDetails, logout, loading, error } = useCusAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"donations" | "messages" | "settings">("donations");

  useEffect(() => {
    fetchCharityDetails();
  }, [fetchCharityDetails]);

  const getFullImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) return "";

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    if (imagePath.startsWith("/uploads/") || imagePath.startsWith("/")) {
      return `${API_BASE_URL}${imagePath}`;
    }

    return `${API_BASE_URL}/uploads/${imagePath}`;
  };

  // If redirecting or loading auth token
  useEffect(() => {
    if (!loading && !charity && localStorage.getItem("role") !== "charity") {
      router.push("/login");
    }
  }, [charity, loading, router]);

  const handleProfileImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setUpdateMsg("Uploading...");
        await updateCharityDetails({}, file);
        setUpdateMsg("Profile picture updated!");
        setTimeout(() => setUpdateMsg(""), 3000);
      } catch (err: any) {
        setUpdateMsg("Error uploading image");
        setTimeout(() => setUpdateMsg(""), 3000);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!charity) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar2 />
      <div className="min-h-screen bg-slate-50 pb-16">
        {/* Header Background */}
        <div className="h-48 w-full bg-gradient-to-r from-emerald-600 to-teal-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <button
            onClick={handleLogout}
            className="absolute top-6 right-6 flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/30"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 mb-8 rounded-3xl bg-white p-6 shadow-sm border border-slate-100 sm:flex sm:items-end sm:space-x-5">
            {/* Profile Avatar */}
            <div className="relative group">
              <div 
                className="h-32 w-32 rounded-full ring-4 ring-white bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center relative shadow-md"
                onClick={handleProfileImageClick}
              >
                {charity.charityProfileImg ? (
                  <img
                    src={getFullImageUrl(charity.charityProfileImg)}
                    alt={charity.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Home className="h-12 w-12 text-slate-400" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white h-8 w-8" />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                aria-label="Upload charity profile picture"
                onChange={handleImageChange}
              />
            </div>

            <div className="mt-4 sm:flex-1 sm:mt-0 sm:pb-3">
              <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:hidden md:block">
                  <h1 className={`truncate text-2xl font-bold text-slate-900 ${lora.className}`}>
                    {charity.name}
                  </h1>
                  <p className="text-sm font-medium text-emerald-600 flex items-center gap-1 mt-1">
                    Charity Organization
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {charity.email}
                </div>
                <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {charity.location}
                </div>
              </div>
            </div>
          </div>

          {updateMsg && (
            <div className="mb-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-600 border border-emerald-100 flex items-center justify-center font-medium">
              {updateMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Sidebar - Details */}
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab('donations')}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors font-medium text-sm ${
                    activeTab === 'donations' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  Donations
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors font-medium text-sm ${
                    activeTab === 'messages' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  Messages
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors font-medium text-sm ${
                    activeTab === 'settings' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <SettingsIcon className="w-5 h-5" />
                  Settings
                </button>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hidden lg:block">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">About the Charity</h3>
                <div className="prose prose-sm text-slate-600">
                  {charity.description ? (
                    <p className="leading-relaxed">{charity.description}</p>
                  ) : (
                    <p className="italic text-slate-400">No description provided yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content - Donations/Messages/Settings */}
            <div className="lg:col-span-3">
              {activeTab === 'donations' && <CharityDashboard charityId={charity.id} />}
              {activeTab === 'messages' && <CharityMessages />}
              {activeTab === 'settings' && <CharitySettings />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
