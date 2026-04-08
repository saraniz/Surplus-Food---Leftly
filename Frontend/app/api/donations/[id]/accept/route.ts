import { NextResponse } from "next/server";
import {
  charities,
  donations,
  nextNotificationId,
  notifications,
} from "@/app/libs/donations/mockDb";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(_req: Request, { params }: Params) {
  const { id } = await params;
  const donationId = Number(id);

  if (!Number.isFinite(donationId)) {
    return NextResponse.json({ message: "Invalid donation id" }, { status: 400 });
  }

  const donation = donations.find((d) => d.id === donationId);

  if (!donation) {
    return NextResponse.json({ message: "Donation not found" }, { status: 404 });
  }

  donation.status = "accepted";

  const charity = charities.find((c) => c.id === donation.charity_id);
  const charityName = charity?.name || "charity";

  notifications.push(
    {
      id: nextNotificationId(),
      message: `Donation accepted: ${donation.food_item} x ${donation.quantity}`,
      user_id: charity?.user_id || 0,
      read_status: false,
      created_at: new Date().toISOString(),
    },
    {
      id: nextNotificationId(),
      message: `Your donation to ${charityName} was accepted`,
      user_id: donation.seller_id,
      read_status: false,
      created_at: new Date().toISOString(),
    }
  );

  return NextResponse.json({ donation }, { status: 200 });
}
