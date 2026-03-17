import { NextResponse } from "next/server";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://ls-portal-development-backend.up.railway.app";

const SERVICE_USERNAME = process.env.BACKEND_SERVICE_USERNAME;
const SERVICE_PASSWORD = process.env.BACKEND_SERVICE_PASSWORD;

let cachedToken: string | null = null;
let cachedAt = 0;

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

async function isPrivilegedCaller(authorization: string): Promise<boolean> {
  const meRes = await fetch(`${BACKEND_ORIGIN}/api/auth/me/`, {
    headers: { Authorization: authorization },
    cache: "no-store",
  });

  if (!meRes.ok) return false;

  const me = (await meRes.json().catch(() => null)) as {
    is_staff?: boolean;
    is_superuser?: boolean;
    profile?: { role?: string | null } | null;
  } | null;

  const role = String(me?.profile?.role ?? "").trim().toLowerCase();
  return Boolean(
    me?.is_superuser ||
      me?.is_staff ||
      role === "system_admin" ||
      role === "admin" ||
      role === "employees"
  );
}

async function getServiceToken(forceRefresh = false): Promise<string> {
  const tokenTtlMs = 4 * 60 * 1000;
  if (!forceRefresh && cachedToken && Date.now() - cachedAt < tokenTtlMs) {
    return cachedToken;
  }

  if (!SERVICE_USERNAME || !SERVICE_PASSWORD) {
    throw new Error("Service credentials are not configured.");
  }

  const tokenRes = await fetch(`${BACKEND_ORIGIN}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: SERVICE_USERNAME,
      password: SERVICE_PASSWORD,
    }),
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    throw new Error(`Failed to obtain service token (${tokenRes.status}).`);
  }

  const data = (await tokenRes.json()) as { access: string };
  cachedToken = data.access;
  cachedAt = Date.now();
  return data.access;
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const payload = await req.text();
  const authorization = req.headers.get("authorization") ?? "";

  if (!authorization) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  const userAttempt = await callTransition(id, payload, authorization);
  if (userAttempt.ok) {
    return successResponse();
  }

  if (userAttempt.status !== 401 && userAttempt.status !== 403) {
    return upstreamError(userAttempt);
  }

  const callerIsPrivileged = await isPrivilegedCaller(authorization);
  if (!callerIsPrivileged) {
    return upstreamError(userAttempt);
  }

  if (!SERVICE_USERNAME || !SERVICE_PASSWORD) {
    return upstreamError(userAttempt);
  }

  try {
    let serviceToken = await getServiceToken();
    let serviceAttempt = await callTransition(id, payload, `Bearer ${serviceToken}`);

    if (serviceAttempt.status === 401) {
      serviceToken = await getServiceToken(true);
      serviceAttempt = await callTransition(id, payload, `Bearer ${serviceToken}`);
    }

    if (serviceAttempt.ok) {
      return successResponse();
    }

    return upstreamError(serviceAttempt);
  } catch {
    return upstreamError(userAttempt);
  }
}