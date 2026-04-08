"use client";

import { useState } from "react";
import { useCusAuthStore } from "@/app/ZustandStore/authStore";

export default function CharitySettings() {
  const { charity, updateCharityDetails, loading, error } = useCusAuthStore();
  const [formData, setFormData] = useState({
    name: charity?.name || "",
    email: charity?.email || "",
    location: charity?.location || "",
    description: charity?.description || "",
  });
  const [updateMsg, setUpdateMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdateMsg("Updating...");
      await updateCharityDetails(formData);
      setUpdateMsg("Details updated successfully!");
      setTimeout(() => setUpdateMsg(""), 3000);
    } catch (err: any) {
      setUpdateMsg(err.message || "Failed to update details.");
      setTimeout(() => setUpdateMsg(""), 3000);
    }
  };

  if (!charity) return null;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Charity Settings</h2>
        <p className="text-sm text-slate-500">Update your charity organization's details.</p>
      </div>

      {updateMsg && (
        <div className={`mb-6 rounded-xl p-4 text-sm font-medium ${updateMsg.includes("updated") ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
          {updateMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="charity-name" className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
          <input
            id="charity-name"
            type="text"
            name="name"
            title="Organization name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label htmlFor="charity-email" className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-xs text-slate-400">(Cannot be changed)</span></label>
          <input
            id="charity-email"
            type="email"
            name="email"
            title="Charity email"
            value={formData.email}
            disabled
            className="w-full rounded-lg border border-slate-300 px-4 py-2 bg-slate-50 text-slate-500 select-none cursor-not-allowed outline-none"
          />
        </div>
        <div>
          <label htmlFor="charity-location" className="block text-sm font-medium text-slate-700 mb-1">Location / Address</label>
          <input
            id="charity-location"
            type="text"
            name="location"
            title="Location or address"
            value={formData.location}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none resize-none"
            placeholder="Tell people about your charity..."
          />
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
