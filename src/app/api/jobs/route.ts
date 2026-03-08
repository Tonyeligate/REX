import { NextResponse } from "next/server";
import { jobs, nextId } from "@/lib/demo-db";
import { createDefaultSteps, computeStepStatuses } from "@/lib/workflow-engine";
import type { Job } from "@/types/job";

// GET /api/jobs — list all jobs (with optional filters)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let result = [...jobs];

  const status = searchParams.get("status");
  if (status) result = result.filter((j) => j.status === status);

  const priority = searchParams.get("priority");
  if (priority) result = result.filter((j) => j.priority === priority);

  const q = searchParams.get("q");
  if (q) {
    const query = q.toLowerCase();
    result = result.filter(
      (j) =>
        j.jobId.toLowerCase().includes(query) ||
        j.clientName.toLowerCase().includes(query) ||
        j.jobType.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({ jobs: result, total: result.length });
}

// POST /api/jobs — create a job
export async function POST(req: Request) {
  const body = await req.json();
  const steps = createDefaultSteps();

  const newJob: Job = {
    id: nextId("j"),
    jobId: body.jobId,
    jobType: body.jobType,
    clientId: body.clientId,
    clientName: body.clientName,
    priority: body.priority ?? "STANDARD",
    assignedTo: body.assignedTo,
    estimatedTime: body.estimatedTime,
    submittedDate: body.submittedDate,
    currentStep: 1,
    status: "IN_PROGRESS",
    regionalNumber: body.regionalNumber,
    parcelSize: body.parcelSize,
    steps: computeStepStatuses(steps, 1),
    timeline: [
      {
        id: nextId("t"),
        label: "Job Created",
        subtext: `Job ${body.jobId} created`,
        status: "current",
        createdAt: new Date().toISOString(),
        createdBy: "System",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  jobs.push(newJob);
  return NextResponse.json({ job: newJob }, { status: 201 });
}
