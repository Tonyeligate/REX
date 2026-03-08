import { NextResponse } from "next/server";
import { members, duesPayments } from "@/lib/demo-db";

// GET /api/reports/membership
export async function GET() {
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.isActive).length;
  const now = new Date();
  const newThisMonth = members.filter((m) => {
    const d = new Date(m.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const duesCollected = duesPayments.reduce((s, d) => s + d.amount, 0);

  const byRegion: Record<string, number> = {};
  for (const m of members) {
    byRegion[m.region] = (byRegion[m.region] || 0) + 1;
  }

  return NextResponse.json({ totalMembers, activeMembers, newThisMonth, duesCollected, byRegion });
}
