import { NextResponse } from "next/server";
import { members } from "@/lib/demo-db";

// GET /api/members/export — returns CSV
export async function GET() {
  const headers = ["ID", "First Name", "Surname", "DOB", "Region", "Constituency", "Polling Station", "Ghana Card", "Voter ID", "Phone", "Method", "Active", "Total Dues"];
  const rows = members.map((m) =>
    [m.id, m.firstName, m.surname, m.dateOfBirth, m.region, m.constituency, m.pollingStation, m.ghanaCard ?? "", m.voterIdNumber ?? "", m.phone, m.registrationMethod, m.isActive, m.totalDuesPaid].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=members-export.csv",
    },
  });
}
