import { NextResponse } from "next/server";
import { jobs } from "@/lib/demo-db";

// GET /api/jobs/search?q=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  // Return all jobs when no query (used for quick chips / browsing)
  if (!q) return NextResponse.json({ jobs: [...jobs] });

  const results = jobs.filter(
    (j) =>
      j.jobId.toLowerCase().includes(q) ||
      j.clientName.toLowerCase().includes(q) ||
      j.regionalNumber?.toLowerCase().includes(q)
  );

  return NextResponse.json({ jobs: results });
}
