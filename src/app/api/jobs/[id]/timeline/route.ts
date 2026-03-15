import { NextResponse } from "next/server";

interface Ctx { params: Promise<{ id: string }> }

// GET /api/jobs/:id/timeline
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return NextResponse.json(
    {
      error:
        "Deprecated route. Job timeline should be read from backend job history endpoint.",
      id,
    },
    { status: 410 }
  );
}

// POST /api/jobs/:id/timeline — add timeline entry
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await req.text();
  return NextResponse.json(
    {
      error:
        "Deprecated route. Timeline updates should use backend workflow transition APIs.",
      id,
    },
    { status: 410 }
  );
}
