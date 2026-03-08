import { NextResponse } from "next/server";
import { duesPayments } from "@/lib/demo-db";

// GET /api/dues
export async function GET() {
  const sorted = [...duesPayments].sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  return NextResponse.json({ payments: sorted, total: sorted.length });
}
