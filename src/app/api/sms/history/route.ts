import { NextResponse } from "next/server";
import { smsMessages } from "@/lib/demo-db";

// GET /api/sms/history
export async function GET() {
  const sorted = [...smsMessages].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  return NextResponse.json({ messages: sorted, total: sorted.length });
}
