import { NextResponse } from "next/server";
import { jobRegisterRecords } from "@/lib/demo-db";
import type { UpdateJobRegisterPayload } from "@/types/register";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return NextResponse.json({ record: jobRegisterRecords[id] ?? null });
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json()) as UpdateJobRegisterPayload;
  const existing = jobRegisterRecords[id] ?? {
    jobId: id,
    actualRegionalNumber: "",
    stages: {},
    updatedAt: new Date().toISOString(),
  };

  const actualRegionalNumber = body.actualRegionalNumber?.trim() ?? existing.actualRegionalNumber ?? "";

  const mergedStages = { ...existing.stages };
  for (const [key, value] of Object.entries(body.stages ?? {})) {
    if (value === null) {
      delete mergedStages[key as keyof typeof mergedStages];
      continue;
    }

    mergedStages[key as keyof typeof mergedStages] = value;
  }

  const record = {
    ...existing,
    actualRegionalNumber,
    stages: mergedStages,
    updatedAt: new Date().toISOString(),
  };

  jobRegisterRecords[id] = record;
  return NextResponse.json({ record });
}