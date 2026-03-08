import { NextResponse } from "next/server";
import { members, nextId } from "@/lib/demo-db";
import type { Member } from "@/types/member";

// POST /api/members/import — accepts CSV file (FormData) or plain text
export async function POST(req: Request) {
  let text: string;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    text = await file.text();
  } else {
    text = await req.text();
  }
  const lines = text.trim().split("\n");
  if (lines.length < 2) return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });

  const imported: Member[] = [];
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < 7) continue;

    const [firstName, surname, dob, region, constituency, pollingStation, phone, ghanaCard, voterIdNumber] = cols;

    if (members.find((m) => m.phone === phone)) continue; // skip duplicates

    const member: Member = {
      id: nextId("m"),
      firstName,
      surname,
      dateOfBirth: dob,
      region,
      constituency,
      pollingStation,
      ghanaCard: ghanaCard || undefined,
      voterIdNumber: voterIdNumber || undefined,
      phone,
      registrationMethod: "IMPORT",
      isActive: true,
      totalDuesPaid: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    members.push(member);
    imported.push(member);
  }

  return NextResponse.json({ imported: imported.length, total: members.length }, { status: 201 });
}
