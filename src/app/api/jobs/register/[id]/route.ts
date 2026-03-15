import { NextResponse } from "next/server";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return NextResponse.json(
    {
      record: null,
      message:
        "Mock register route retired. Register metadata is now managed in the frontend API client.",
      id,
    },
    { status: 410 }
  );
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await req.text();
  return NextResponse.json(
    {
      error:
        "Mock register route retired. Use registerFieldsApi in the frontend client.",
      id,
    },
    { status: 410 }
  );
}