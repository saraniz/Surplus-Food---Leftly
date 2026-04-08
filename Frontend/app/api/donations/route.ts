import { NextRequest, NextResponse } from "next/server";
import {
  charities,
  donations,
  nextDonationId,
  nextNotificationId,
  notifications,
} from "@/app/libs/donations/mockDb";
import { Donation } from "@/app/libs/donations/types";

export async function GET(req: NextRequest) {
  const sellerIdParam = req.nextUrl.searchParams.get("seller_id");
  const charityIdParam = req.nextUrl.searchParams.get("charity_id");

  const sellerId = sellerIdParam ? Number(sellerIdParam) : NaN;
  const charityId = charityIdParam ? Number(charityIdParam) : NaN;

  let data = donations;

  if (Number.isFinite(sellerId)) {
    data = data.filter((d) => d.seller_id === sellerId);
  }

  if (Number.isFinite(charityId)) {
    data = data.filter((d) => d.charity_id === charityId);
  }

  return NextResponse.json({ donations: data }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const food_item = String(body.food_item || "").trim();
  const quantity = Number(body.quantity);
  const seller_id = Number(body.seller_id);
  const charity_id = Number(body.charity_id);

  if (!food_item || !Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json(
      { message: "Invalid food item or quantity" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(seller_id) || !Number.isFinite(charity_id)) {
    return NextResponse.json(
      { message: "Invalid seller or charity id" },
      { status: 400 }
    );
  }

  const selectedCharity = charities.find((c) => c.id === charity_id);

  if (!selectedCharity) {
    return NextResponse.json({ message: "Charity not found" }, { status: 404 });
  }

  const donation: Donation = {
    id: nextDonationId(),
    food_item,
    quantity,
    seller_id,
    charity_id,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  donations.push(donation);

  notifications.push({
    id: nextNotificationId(),
    message: `New donation request for ${selectedCharity.name}: ${food_item} x ${quantity}`,
    user_id: selectedCharity.user_id,
    read_status: false,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ donation }, { status: 201 });
}
