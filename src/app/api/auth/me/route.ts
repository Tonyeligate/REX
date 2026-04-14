import { NextResponse } from "next/server";

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_URL;

// GET /api/auth/me — proxy to backend /api/auth/me/
export async function GET(req: Request) {
  if (!BACKEND_ORIGIN) {
    return NextResponse.json(
      { error: "Backend URL is not configured." },
      { status: 500 }
    );
  }

  const authorization = req.headers.get("authorization");
  const upstream = await fetch(`${BACKEND_ORIGIN}/api/auth/me/`, {
    headers: authorization ? { Authorization: authorization } : undefined,
    cache: "no-store",
  });

  const body = await upstream.json().catch(() => ({}));
  return NextResponse.json(body, { status: upstream.status });
}