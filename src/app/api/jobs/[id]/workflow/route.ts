import { NextResponse } from "next/server";
import { jobs, nextId } from "@/lib/demo-db";
import { advanceToNextStep } from "@/lib/workflow-engine";

interface Ctx { params: Promise<{ id: string }> }

// PUT /api/jobs/:id/workflow — advance to next step
export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const idx = jobs.findIndex((j) => j.id === id || j.jobId === id);
  if (idx === -1) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const body = await req.json();
  const job = jobs[idx];
  const updates = advanceToNextStep(job, body.comment, body.completedBy);

  if (!updates) {
    return NextResponse.json({ error: "Job is already at the final step" }, { status: 400 });
  }

  Object.assign(job, updates);
  job.updatedAt = new Date().toISOString();

  // Auto-add timeline entry
  const currentStepData = job.steps[job.currentStep - 1];
  job.timeline.push({
    id: nextId("t"),
    label: currentStepData?.title ?? `Step ${job.currentStep}`,
    subtext: body.comment || currentStepData?.note || "",
    status: "current",
    createdAt: new Date().toISOString(),
    createdBy: body.completedBy,
  });

  // Mark previous timeline entries as done
  job.timeline = job.timeline.map((t, i) =>
    i < job.timeline.length - 1 ? { ...t, status: "done" as const } : t
  );

  jobs[idx] = job;
  return NextResponse.json({ job });
}
