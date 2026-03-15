import { NextResponse } from "next/server";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://ls-portal-development-backend.up.railway.app";

async function proxyLookup(rn: string, authorization?: string | null) {
  return fetch(`${BACKEND_ORIGIN}/api/jobs/${encodeURIComponent(rn)}/`, {
    headers: authorization ? { Authorization: authorization } : undefined,
    cache: "no-store",
  });
}

// GET /api/jobs/search?q=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ jobs: [] });

  const authorization = req.headers.get("authorization");
  const res = await proxyLookup(q, authorization);
  if (res.status === 404) return NextResponse.json({ jobs: [] });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail =
      typeof body === "object" && body && "detail" in body
        ? body.detail
        : undefined;
    return NextResponse.json(
      {
        error:
          typeof detail === "string"
            ? detail
            : `Backend lookup failed (${res.status})`,
      },
      { status: res.status }
    );
  }

  const job = await res.json();
  return NextResponse.json({ jobs: [job] });
}
