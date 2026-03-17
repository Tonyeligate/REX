import { NextResponse } from "next/server";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://ls-portal-development-backend.up.railway.app";

interface Ctx {
  params: Promise<{ id: string }>;
}

function successResponse() {
  return NextResponse.json({ success: true, data: null, message: "Transition updated." });
}

async function parseUpstreamBody(upstream: Response): Promise<Record<string, unknown> | null> {
  const text = await upstream.text().catch(() => "");
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
    return { detail: String(parsed) };
  } catch {
    return { detail: text };
  }
}

async function upstreamError(upstream: Response) {
  const body = await parseUpstreamBody(upstream);
  if (body) {
    return NextResponse.json(body, { status: upstream.status });
  }
  return NextResponse.json(
    { detail: `Transition request failed (${upstream.status}).` },
    { status: upstream.status }
  );
}

async function callTransition(
  id: string,
  payload: string,
  authorization: string
): Promise<Response> {
  return fetch(`${BACKEND_ORIGIN}/api/jobs/${encodeURIComponent(id)}/transition/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
    },
    body: payload,
    cache: "no-store",
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const payload = await req.text();
  const authorization = req.headers.get("authorization") ?? "";

  if (!authorization) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  const upstream = await callTransition(id, payload, authorization);
  if (upstream.ok) {
    return successResponse();
  }

  return upstreamError(upstream);
}