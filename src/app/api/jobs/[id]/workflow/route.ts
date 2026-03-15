import { NextResponse } from "next/server";

interface Ctx { params: Promise<{ id: string }> }

// PUT /api/jobs/:id/workflow — advance to next step
export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await req.text();
  return NextResponse.json(
    {
      error:
        "Deprecated route. Use backend jobs transition endpoint through jobsApi.transitionTo/advanceStep.",
      id,
    },
    { status: 410 }
  );
}
