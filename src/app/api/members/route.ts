import { NextResponse } from "next/server";
import { members, nextId } from "@/lib/demo-db";
import type { Member } from "@/types/member";

// GET /api/members
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let result = [...members];

  const region = searchParams.get("region");
  if (region) result = result.filter((m) => m.region === region);

  const q = searchParams.get("q");
  if (q) {
    const query = q.toLowerCase();
    result = result.filter(
      (m) =>
        m.firstName.toLowerCase().includes(query) ||
        m.surname.toLowerCase().includes(query) ||
        m.phone.includes(query) ||
        m.ghanaCard?.toLowerCase().includes(query) ||
        m.voterIdNumber?.toLowerCase().includes(query)
    );
  }

  const active = searchParams.get("active");
  if (active !== null) result = result.filter((m) => m.isActive === (active === "true"));

  return NextResponse.json({ members: result, total: result.length });
}

// POST /api/members
export async function POST(req: Request) {
  const body = await req.json();

  if (members.find((m) => m.phone === body.phone)) {
    return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
  }

  const newMember: Member = {
    id: nextId("m"),
    firstName: body.firstName,
    surname: body.surname,
    dateOfBirth: body.dateOfBirth,
    region: body.region,
    constituency: body.constituency,
    pollingStation: body.pollingStation,
    ghanaCard: body.ghanaCard,
    voterIdNumber: body.voterIdNumber,
    phone: body.phone,
    registrationMethod: body.registrationMethod ?? "MANUAL",
    isActive: true,
    totalDuesPaid: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  members.push(newMember);
  return NextResponse.json({ member: newMember }, { status: 201 });
}
