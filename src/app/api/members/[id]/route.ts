import { NextResponse } from "next/server";
import { members } from "@/lib/demo-db";

interface Ctx { params: Promise<{ id: string }> }

// GET /api/members/:id
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const member = members.find((m) => m.id === id);
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json({ member });
}

// PUT /api/members/:id
export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const idx = members.findIndex((m) => m.id === id);
  if (idx === -1) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const body = await req.json();
  const member = members[idx];

  if (body.firstName !== undefined) member.firstName = body.firstName;
  if (body.surname !== undefined) member.surname = body.surname;
  if (body.dateOfBirth !== undefined) member.dateOfBirth = body.dateOfBirth;
  if (body.region !== undefined) member.region = body.region;
  if (body.constituency !== undefined) member.constituency = body.constituency;
  if (body.pollingStation !== undefined) member.pollingStation = body.pollingStation;
  if (body.ghanaCard !== undefined) member.ghanaCard = body.ghanaCard;
  if (body.voterIdNumber !== undefined) member.voterIdNumber = body.voterIdNumber;
  if (body.phone !== undefined) member.phone = body.phone;
  if (body.isActive !== undefined) member.isActive = body.isActive;

  member.updatedAt = new Date().toISOString();
  members[idx] = member;

  return NextResponse.json({ member });
}
