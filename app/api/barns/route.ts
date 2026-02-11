import { NextResponse } from "next/server";
import { NEBRASKA_SALE_BARNS } from "@/lib/sale-barns";

export async function GET() {
  return NextResponse.json({ barns: NEBRASKA_SALE_BARNS });
}
