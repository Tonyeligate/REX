import { NextResponse } from "next/server";
import { jobRegisterRecords } from "@/lib/demo-db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobIdsParam = searchParams.get("jobIds");

  if (!jobIdsParam) {
    return NextResponse.json({ records: jobRegisterRecords });
  }

  const jobIds = jobIdsParam
    .split(",")
    .map((jobId) => decodeURIComponent(jobId).trim())
    .filter(Boolean);

  const records = Object.fromEntries(
    jobIds
      .filter((jobId) => Boolean(jobRegisterRecords[jobId]))
      .map((jobId) => [jobId, jobRegisterRecords[jobId]])
  );

  return NextResponse.json({ records });
}