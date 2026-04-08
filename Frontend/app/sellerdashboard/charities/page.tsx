"use client";

import { useEffect, useState } from "react";
import SellerSidebar from "../../components/sellerdashboard";
import SellerHeader from "../../components/sellerHeader";
import api from "../../libs/api";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useChatStore } from "../../ZustandStore/chatStore";

interface Charity {
  id: number;
  name: string;
  email: string;
  location: string;
  description: string;
}

export default function CharitiesPage() {
  const router = useRouter();
  const { createRoom } = useChatStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharities = async () => {
      try {
        const response = await api.get("/api/charity/all");
        setCharities(response.data.charities);
      } catch (error) {
        console.error("Error fetching charities", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCharities();
  }, []);

  const handleConnect = async (charity: Charity) => {
    try {
      const roomId = await createRoom(charity.id, "charity");
      if (roomId > 0) {
        window.dispatchEvent(
          new CustomEvent("showToast", {
            detail: { message: `Opening chat with ${charity.name}...`, type: "success" },
          })
        );
        router.push("/sellerdashboard/messages");
      }
    } catch (e) {
      window.dispatchEvent(
        new CustomEvent("showToast", {
          detail: { message: `Failed to connect with ${charity.name}.`, type: "error" },
        })
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SellerHeader 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="Donate"
          subtitle="Connect with Charities"
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Available Charities 🤝</h1>
            <p className="text-gray-600 mt-2">Connect with organizations to donate your surplus food.</p>
          </div>

          {loading ? (
            <div className="flex justify-center p-10">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : charities.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-gray-500 text-lg">No charities registered yet, check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {charities.map((charity) => (
                <div key={charity.id} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold">
                      {charity.name.charAt(0)}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{charity.name}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-grow">
                    {charity.description || "A registered charity organization looking to help the community."}
                  </p>
                  
                  <div className="mb-6 space-y-2 text-sm text-gray-600 mt-auto">
                    <div className="flex items-center gap-2">
                       <span>📍</span> {charity.location}
                    </div>
                    <div className="flex items-center gap-2">
                       <span>✉️</span> {charity.email}
                    </div>
                  </div>

                  <button
                    onClick={() => handleConnect(charity)}
                    className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white font-medium py-3 rounded-xl transition-colors duration-300"
                  >
                    Connect to Donate
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
