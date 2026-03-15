import { NextResponse } from "next/server";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://ls-portal-development-backend.up.railway.app";

// GET /api/jobs — proxy list jobs from backend
export async function GET(req: Request) {
  const { search } = new URL(req.url);
  const authorization = req.headers.get("authorization");
  const upstream = await fetch(`${BACKEND_ORIGIN}/api/jobs/${search}`, {
    headers: authorization ? { Authorization: authorization } : undefined,
    cache: "no-store",
  });

  const body = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(body, { status: upstream.status });
  }

  return NextResponse.json(body);
}

// POST /api/jobs — proxy create job to backend
export async function POST(req: Request) {
  const payload = await req.text();
  const authorization = req.headers.get("authorization");
  const upstream = await fetch(`${BACKEND_ORIGIN}/api/jobs/`, {
    method: "POST",
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
