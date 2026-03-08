import { NextResponse } from "next/server";
import { jobs } from "@/lib/demo-db";

// GET /api/reports/jobs
export async function GET() {
  const total = jobs.length;
  const inProgress = jobs.filter((j) => j.status === "IN_PROGRESS").length;
  const completed = jobs.filter((j) => j.status === "COMPLETED").length;
  const queried = jobs.filter((j) => j.status === "QUERIED").length;

  // Count jobs by current step
  const byStep: Record<number, number> = {};
  for (const j of jobs) {
    byStep[j.currentStep] = (byStep[j.currentStep] || 0) + 1;
  }

  return NextResponse.json({ total, inProgress, completed, queried, byStep });
}
