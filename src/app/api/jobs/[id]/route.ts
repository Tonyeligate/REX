import { NextResponse } from "next/server";
import { jobs } from "@/lib/demo-db";
import { computeStepStatuses } from "@/lib/workflow-engine";

interface Ctx { params: Promise<{ id: string }> }

// GET /api/jobs/:id
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const job = jobs.find((j) => j.id === id || j.jobId === id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({ job });
}

// PUT /api/jobs/:id — update job fields
export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const idx = jobs.findIndex((j) => j.id === id || j.jobId === id);
  if (idx === -1) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const body = await req.json();
  const job = jobs[idx];

  if (body.jobType !== undefined) job.jobType = body.jobType;
  if (body.clientName !== undefined) job.clientName = body.clientName;
  if (body.priority !== undefined) job.priority = body.priority;
  if (body.assignedTo !== undefined) job.assignedTo = body.assignedTo;
  if (body.estimatedTime !== undefined) job.estimatedTime = body.estimatedTime;
  if (body.regionalNumber !== undefined) job.regionalNumber = body.regionalNumber;
  if (body.parcelSize !== undefined) job.parcelSize = body.parcelSize;
  if (body.status !== undefined) job.status = body.status;

  if (body.currentStep !== undefined) {
    job.currentStep = body.currentStep;
    job.steps = computeStepStatuses(job.steps, body.currentStep);
  }

  job.updatedAt = new Date().toISOString();
  jobs[idx] = job;

  return NextResponse.json({ job });
}

// DELETE /api/jobs/:id
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const idx = jobs.findIndex((j) => j.id === id || j.jobId === id);
  if (idx === -1) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  jobs.splice(idx, 1);
  return NextResponse.json({ success: true });
}
