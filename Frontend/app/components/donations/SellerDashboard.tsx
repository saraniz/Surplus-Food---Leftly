"use client";

import { useEffect, useMemo, useState } from "react";
import { useDonationStore } from "@/app/ZustandStore/donationStore";

interface SellerFoodItem {
  id: number;
  name: string;
  quantity: number;
}

interface SellerDashboardProps {
  sellerId: number;
  foodItems?: SellerFoodItem[];
}

const fallbackFoodItems: SellerFoodItem[] = [
  { id: 1, name: "Veg Biryani", quantity: 8 },
  { id: 2, name: "Brown Bread Pack", quantity: 12 },
  { id: 3, name: "Fruit Salad Cups", quantity: 10 },
];

export default function SellerDashboard({ sellerId, foodItems }: SellerDashboardProps) {
  const { charities, fetchCharities, createDonation, loading, error } = useDonationStore();

  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [charityId, setCharityId] = useState<number | "">("");

  const items = useMemo(() => foodItems && foodItems.length > 0 ? foodItems : fallbackFoodItems, [foodItems]);

  useEffect(() => {
    fetchCharities();
  }, [fetchCharities]);

  const handleDonate = async (item: SellerFoodItem) => {
    if (!charityId) return;

    await createDonation({
      food_item: item.name,
      quantity: item.quantity,
      seller_id: sellerId,
      charity_id: Number(charityId),
    });

    setSelectedFoodId(null);
    setCharityId("");
  };

  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Food Donation</h2>
          <p className="text-sm text-slate-500">Mark unsold food and send donation requests to registered charities.</p>
        </div>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-medium text-slate-800">{item.name}</h3>
            <p className="mt-1 text-sm text-slate-500">Quantity: {item.quantity}</p>

            {selectedFoodId === item.id ? (
              <div className="mt-3 space-y-3">
                <select
                  value={charityId}
                  onChange={(e) => setCharityId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring"
                >
                  <option value="">Select charity</option>
                  {charities.map((charity) => (
                    <option key={charity.id} value={charity.id}>
                      {charity.name} - {charity.location}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDonate(item)}
                    disabled={loading || !charityId}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Send Request
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFoodId(null);
                      setCharityId("");
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSelectedFoodId(item.id)}
                className="mt-3 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
              >
                Donate
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
