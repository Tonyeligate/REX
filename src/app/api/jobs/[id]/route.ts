import { NextResponse } from "next/server";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://ls-portal-development-backend.up.railway.app";

interface Ctx { params: Promise<{ id: string }> }

// GET /api/jobs/:id
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const upstream = await fetch(`${BACKEND_ORIGIN}/api/jobs/${encodeURIComponent(id)}/`, {
    cache: "no-store",
  });
  const body = await upstream.json().catch(() => ({}));
  return NextResponse.json(body, { status: upstream.status });
}

// PUT /api/jobs/:id — update job fields
export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const payload = await req.text();
  const authorization = req.headers.get("authorization");
  const upstream = await fetch(`${BACKEND_ORIGIN}/api/jobs/${encodeURIComponent(id)}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: payload,
    cache: "no-store",
  });
  const body = await upstream.json().catch(() => ({}));
  return NextResponse.json(body, { status: upstream.status });
}

// DELETE /api/jobs/:id
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const authorization = _req.headers.get("authorization");
  const upstream = await fetch(`${BACKEND_ORIGIN}/api/jobs/${encodeURIComponent(id)}/`, {
    method: "DELETE",
    headers: authorization ? { Authorization: authorization } : undefined,
    cache: "no-store",
  });
  if (upstream.status === 204) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
  const body = await upstream.json().catch(() => ({}));
  return NextResponse.json(body, { status: upstream.status });
}
