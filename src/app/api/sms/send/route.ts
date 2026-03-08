import { NextResponse } from "next/server";
import { smsMessages, members, duesPayments, nextId } from "@/lib/demo-db";
import type { SmsMessage, DuesPayment } from "@/types/member";

// POST /api/sms/send
export async function POST(req: Request) {
  const body = await req.json();

  let recipients = members.filter((m) => m.isActive);
  if (body.recipientFilter) {
    const f = body.recipientFilter;
    if (f.region) recipients = recipients.filter((m) => m.region === f.region);
    if (f.constituency) recipients = recipients.filter((m) => m.constituency === f.constituency);
    if (f.pollingStation) recipients = recipients.filter((m) => m.pollingStation === f.pollingStation);
  }

  const totalCost = recipients.length * 1.50;
  const partyRevenue = recipients.length * 1.00;
  const platformFee = recipients.length * 0.50;

  const msg: SmsMessage = {
    id: nextId("sms"),
    content: body.content,
    sentBy: "u1",
    sentAt: new Date().toISOString(),
    recipientCount: recipients.length,
    deliveredCount: recipients.length, // demo: all delivered
    totalCost,
    partyRevenue,
    platformFee,
    scheduling: body.scheduling ?? "immediate",
    scheduledFor: body.scheduledFor,
    status: "sent",
  };
  smsMessages.push(msg);

  // Create dues records for each recipient
  for (const m of recipients) {
    const payment: DuesPayment = {
      id: nextId("d"),
      memberId: m.id,
      memberName: `${m.firstName} ${m.surname}`,
      memberPhone: m.phone,
      amount: 1.50,
      partyShare: 1.00,
      platformShare: 0.50,
      triggeredBy: msg.id,
      paidAt: new Date().toISOString(),
    };
    duesPayments.push(payment);
    m.totalDuesPaid += 1.50;
  }

  return NextResponse.json({ message: msg }, { status: 201 });
}
