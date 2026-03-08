import { NextResponse } from "next/server";
import { jobs, nextId } from "@/lib/demo-db";

interface Ctx { params: Promise<{ id: string }> }

// GET /api/jobs/:id/timeline
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const job = jobs.find((j) => j.id === id || j.jobId === id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({ timeline: job.timeline });
}

// POST /api/jobs/:id/timeline — add timeline entry
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const idx = jobs.findIndex((j) => j.id === id || j.jobId === id);
  if (idx === -1) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const body = await req.json();
  const entry = {
    id: nextId("t"),
    label: body.label,
    subtext: body.subtext,
    status: "todo" as const,
    createdAt: new Date().toISOString(),
    createdBy: body.createdBy,
  };

  jobs[idx].timeline.push(entry);
  return NextResponse.json({ entry }, { status: 201 });
}
