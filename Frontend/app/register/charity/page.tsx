"use client";

import { useState } from "react";
import { useCusAuthStore } from "@/app/ZustandStore/authStore";
import { useRouter } from "next/navigation";

export default function CharityRegisterPage() {
  const router = useRouter();
  const { charityRegister, loading, error } = useCusAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    description: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await charityRegister(
        formData.name,
        formData.location,
        formData.description,
        formData.email,
        formData.password
      );
      router.push("/");
    } catch (err) {
      console.error("Charity registration failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004030] via-[#1B3A2C] to-[#2E5A3F] flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl w-full max-w-md shadow-2xl border border-white/20">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Charity Registration</h2>
        {error && <p className="text-red-400 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Organization Name"
            className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-gray-300 outline-none"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-gray-300 outline-none"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Location/Address"
            className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-gray-300 outline-none"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
          <textarea
            placeholder="Brief Description"
            className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-gray-300 outline-none"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-gray-300 outline-none"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <button
            type="submit"
            className="w-full py-3 mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register Charity"}
          </button>
        </form>
      </div>
    </div>
  );
}
