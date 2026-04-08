import { NextResponse } from "next/server";
import { charities } from "@/app/libs/donations/mockDb";

export async function GET() {
  return NextResponse.json({ charities }, { status: 200 });
}
