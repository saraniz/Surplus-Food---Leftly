"use client";

import { useState, useEffect } from "react";
import Navbar2 from "@/app/components/Navbar2";
import Footer from "@/app/components/Footer";
import api from "@/app/libs/api";
import { motion } from "framer-motion";
import { Search, MapPin, Mail, Heart, Calendar, Building2 } from "lucide-react";
import { lora } from "@/app/libs/fonts";

interface Charity {
  id: number;
  name: string;
  email: string;
  location: string;
  description: string | null;
  charityProfileImg: string | null;
  createdAt: string;
}

export default function CharityDirectoryPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharityPrograms = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/charity/all");
        setCharities(res.data.charities || []);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching charity list:", err);
        setError("Failed to load registered charities. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCharityPrograms();
  }, []);

  const filteredCharities = charities.filter((charity) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      charity.name.toLowerCase().includes(searchLower) ||
      charity.location.toLowerCase().includes(searchLower) ||
      (charity.description && charity.description.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
      <div>
        <Navbar2 />

        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B251C] to-[#1C3F24] text-white py-16 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(74,222,128,0.08),transparent_50%)]" />
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-6"
            >
              <Heart className="w-4 h-4 text-green-400 fill-green-400" />
              <span className="text-xs font-semibold tracking-wider text-green-300 uppercase animate-pulse">Community Impact</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`${lora.className} text-4xl md:text-5xl font-bold tracking-tight mb-4`}
            >
              Registered Charity Programs
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-300 max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed"
            >
              Meet the organisations working together with Leftly to save food and feed those in need across Sri Lanka.
            </motion.p>
          </div>
        </div>

        {/* Directory Controls */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200/50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Organizations Directory</h2>
              <p className="text-sm text-gray-500 mt-1">
                {loading ? "Searching registered charities..." : `${filteredCharities.length} registered programs`}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 shadow-sm transition-all text-gray-800"
              />
            </div>
          </div>

          {/* Directory Listings Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-100 rounded" />
                      <div className="h-3 w-20 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="h-16 w-full bg-gray-100 rounded" />
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-gray-100 rounded" />
                    <div className="h-3 w-16 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          ) : filteredCharities.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200/50 mt-8 shadow-sm">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No Charities Found</h3>
              <p className="text-gray-500 text-sm mt-1">Try modifying your keywords or search query.</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-10"
            >
              {filteredCharities.map((charity) => (
                <motion.div
                  key={charity.id}
                  whileHover={{ y: -4, boxShadow: "0 12px 24px -10px rgba(0,0,0,0.06)" }}
                  className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between shadow-xs transition-all hover:border-green-100"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/10 to-yellow-500/10 flex items-center justify-center overflow-hidden border border-green-100 shrink-0">
                        {charity.charityProfileImg ? (
                          <img
                            src={charity.charityProfileImg}
                            alt={charity.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 leading-tight truncate" title={charity.name}>{charity.name}</h3>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3 mr-1 text-green-600 shrink-0" />
                          <span className="truncate">{charity.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-3 mb-6 leading-relaxed">
                      {charity.description || "No description provided by the organization."}
                    </p>
                  </div>

                  {/* Footer / Contacts */}
                  <div className="pt-4 border-t border-gray-50 flex flex-col gap-2.5">
                    <div className="flex items-center text-xs text-gray-500">
                      <Mail className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
                      <a href={`mailto:${charity.email}`} className="hover:text-green-600 transition-colors truncate">
                        {charity.email}
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                      <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
                        <span>Joined {new Date(charity.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
