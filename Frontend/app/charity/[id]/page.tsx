"use client";

import { useEffect, useState, use } from "react";
import Navbar2 from "@/app/components/Navbar2";
import Footer from "@/app/components/Footer";
import api from "@/app/libs/api";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Mail, Calendar, Building2, Heart, Award, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { lora } from "@/app/libs/fonts";
import { useRouter } from "next/navigation";

interface Charity {
  id: number;
  name: string;
  email: string;
  location: string;
  description: string | null;
  charityProfileImg: string | null;
  createdAt: string;
}

export default function CharityProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [charity, setCharity] = useState<Charity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCharityDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/charity/${id}`);
        setCharity(res.data.charity);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching charity profile:", err);
        setError("Failed to load charity profile details. It may not exist or has been removed.");
      } finally {
        setLoading(false);
      }
    };

    fetchCharityDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <div>
          <Navbar2 />
          <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse">
            <div className="h-6 w-24 bg-gray-200 rounded mb-8" />
            <div className="bg-white rounded-3xl border border-gray-150 p-8 space-y-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gray-200" />
                <div className="space-y-3 flex-1">
                  <div className="h-6 w-48 bg-gray-200 rounded" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="h-24 w-full bg-gray-200 rounded" />
              <div className="h-10 w-48 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !charity) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <div>
          <Navbar2 />
          <div className="max-w-md mx-auto px-4 py-20 text-center">
            <Building2 className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Profile Not Found</h2>
            <p className="text-gray-500 text-sm mt-2">{error || "Could not retrieve the charity details."}</p>
            <Link href="/charities" className="inline-flex items-center text-sm font-semibold text-green-600 hover:text-green-700 mt-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
      <div>
        <Navbar2 />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Back button */}
          <Link 
            href="/charities" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Charities Directory
          </Link>

          {/* Profile Card Container */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-md hover:shadow-lg overflow-hidden transition-shadow"
          >
            {/* Soft decorative color banner */}
            <div className="h-32 bg-gradient-to-r from-[#0B251C] to-[#1C3F24] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(74,222,128,0.15),transparent_40%)]" />
            </div>

            {/* Main Header / Info area */}
            <div className="px-8 pb-8 relative">
              {/* Profile Avatar overlay */}
              <div className="absolute -top-12 left-8 w-24 h-24 rounded-3xl bg-white p-1.5 shadow-md border border-gray-100 overflow-hidden">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-green-500/10 to-yellow-500/10 flex items-center justify-center overflow-hidden">
                  {charity.charityProfileImg ? (
                    <img 
                      src={charity.charityProfileImg} 
                      alt={charity.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-green-600" />
                  )}
                </div>
              </div>

              {/* Title & Actions */}
              <div className="pt-16 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className={`${lora.className} text-3xl font-bold text-gray-900 tracking-tight`}>
                      {charity.name}
                    </h1>
                    <ShieldCheck className="w-5 h-5 text-green-600 fill-green-50/50 shrink-0" title="Verified Leftly Partner" />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5 text-green-600 shrink-0" />
                      {charity.location}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5 text-gray-400 shrink-0" />
                      Partner since {new Date(charity.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center">
                  <a 
                    href={`mailto:${charity.email}`}
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Organization
                  </a>
                </div>
              </div>

              {/* Grid content split: details vs metadata */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10 pt-8 border-t border-gray-100">
                
                {/* Main profile bio (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">About the Program</h2>
                    <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                      {charity.description || "The organization has not provided a mission bio description yet."}
                    </p>
                  </div>
                  
                  <div className="bg-green-50/30 rounded-2xl border border-green-100/50 p-6 flex items-start gap-4">
                    <Heart className="w-6 h-6 text-green-600 shrink-0 mt-0.5 fill-green-50" />
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">Food Rescue Mission</h3>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        This charity works in collaboration with local food sellers to intercept and redirect unsold, fresh surplus food. This contributes towards feeding marginalized communities and reducing environmental food waste across Sri Lanka.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info side widgets (1/3 width) */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-150">
                    <h3 className="font-bold text-gray-900 text-sm mb-4">Organization Badges</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">Verified Rescue Program</p>
                          <p className="text-[10px] text-gray-500">Authorized local food sharing agency</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                          <Heart className="w-4 h-4 text-yellow-600 fill-yellow-100" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">Active Leftly Member</p>
                          <p className="text-[10px] text-gray-500">Participates in surplus redirection programs</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-150 text-center">
                    <Building2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Need support or want to partner with this charity directly?</p>
                    <a 
                      href={`mailto:${charity.email}`} 
                      className="inline-block mt-3 text-xs font-bold text-green-600 hover:text-green-700"
                    >
                      Contact direct representative
                    </a>
                  </div>

                </div>

              </div>

            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
