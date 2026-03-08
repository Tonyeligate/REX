import { NextResponse } from "next/server";
import { duesPayments, members } from "@/lib/demo-db";

// GET /api/dues/summary
export async function GET() {
  const totalCollected = duesPayments.reduce((s, d) => s + d.amount, 0);
  const totalPartyShare = duesPayments.reduce((s, d) => s + d.partyShare, 0);
  const totalPlatformFee = duesPayments.reduce((s, d) => s + d.platformShare, 0);
  const now = new Date();
  const thisMonth = duesPayments
    .filter((d) => {
      const dt = new Date(d.paidAt);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    })
    .reduce((s, d) => s + d.amount, 0);
  const thisYear = duesPayments
    .filter((d) => new Date(d.paidAt).getFullYear() === now.getFullYear())
    .reduce((s, d) => s + d.amount, 0);
  const activePayingMembers = new Set(duesPayments.map((d) => d.memberId)).size;

  return NextResponse.json({
    totalCollected,
    totalPartyShare,
    totalPlatformFee,
    activePayingMembers,
    totalMembers: members.length,
    thisMonth,
    thisYear,
  });
}
