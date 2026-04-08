import { NextRequest, NextResponse } from "next/server";
import { notifications } from "@/app/libs/donations/mockDb";

export async function GET(req: NextRequest) {
  const userIdParam = req.nextUrl.searchParams.get("user_id");
  const userId = userIdParam ? Number(userIdParam) : NaN;

  const data = Number.isFinite(userId)
    ? notifications.filter((n) => n.user_id === userId)
    : notifications;

  return NextResponse.json({ notifications: data }, { status: 200 });
}
