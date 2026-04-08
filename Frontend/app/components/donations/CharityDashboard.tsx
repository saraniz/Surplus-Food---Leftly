"use client";

import { useEffect } from "react";
import { useDonationStore } from "@/app/ZustandStore/donationStore";

interface CharityDashboardProps {
  charityId: number;
}

export default function CharityDashboard({ charityId }: CharityDashboardProps) {
  const {
    donations,
    fetchDonations,
    acceptDonation,
    declineDonation,
    loading,
    error,
  } = useDonationStore();

  useEffect(() => {
    fetchDonations({ charity_id: charityId });
  }, [charityId, fetchDonations]);

  return (
    <section className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Incoming Donations</h2>
        <p className="text-sm text-slate-500">Accept or decline requests from sellers.</p>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p> : null}

      <div className="space-y-3">
        {donations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            No donation requests yet.
          </p>
        ) : (
          donations.map((donation) => (
            <article key={donation.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-slate-800">{donation.food_item}</p>
                  <p className="text-sm text-slate-500">
                    Qty: {donation.quantity} | Seller: #{donation.seller_id}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Status: {donation.status}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => acceptDonation(donation.id)}
                    disabled={loading || donation.status !== "pending"}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineDonation(donation.id)}
                    disabled={loading || donation.status !== "pending"}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
