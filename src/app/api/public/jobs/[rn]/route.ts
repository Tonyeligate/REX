import { NextResponse } from "next/server";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://ls-portal-development-backend.up.railway.app";

const SERVICE_USERNAME = process.env.BACKEND_SERVICE_USERNAME;
const SERVICE_PASSWORD = process.env.BACKEND_SERVICE_PASSWORD;

let cachedToken: string | null = null;
let cachedAt = 0;

type SearchableBackendJob = {
  rn?: string;
  regional_number?: string | null;
  title?: string;
  status_display?: string;
  description?: string;
  client?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

function matchesJobQuery(job: SearchableBackendJob, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;

  const fields = [
    job.rn,
    job.regional_number,
    job.title,
    job.status_display,
    job.description,
    job.client?.name,
    job.client?.email,
    job.client?.phone,
  ];

  return fields
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .some((value) => value.toLowerCase().includes(q));
}

async function lookupJob(query: string, authorization?: string) {
  const headers = authorization ? { Authorization: authorization } : undefined;

  const direct = await fetch(
    `${BACKEND_ORIGIN}/api/jobs/${encodeURIComponent(query)}/`,
    {
      headers,
      cache: "no-store",
    }
  );

  if (direct.ok) {
    return {
      status: 200,
      job: (await direct.json()) as SearchableBackendJob,
    };
  }

  if (direct.status !== 404) {
    const body = await direct.json().catch(() => ({}));
    const detail =
      typeof body === "object"
        ? (body as Record<string, unknown>).detail
        : undefined;

    return {
      status: direct.status,
      error:
        (typeof detail === "string" && detail) ||
        `Backend lookup failed (${direct.status})`,
    };
  }

  const listRes = await fetch(`${BACKEND_ORIGIN}/api/jobs/`, {
    headers,
    cache: "no-store",
  });

  if (!listRes.ok) {
    const body = await listRes.json().catch(() => ({}));
    const detail =
      typeof body === "object"
        ? (body as Record<string, unknown>).detail
        : undefined;

    return {
      status: listRes.status,
      error:
        (typeof detail === "string" && detail) ||
        `Backend list lookup failed (${listRes.status})`,
    };
  }

  const jobs = (await listRes.json().catch(() => [])) as SearchableBackendJob[];
  const match = jobs.find((job) => matchesJobQuery(job, query)) ?? null;
  if (!match) {
    return { status: 404, job: null };
  }

  return { status: 200, job: match };
}

async function getServiceToken(forceRefresh = false): Promise<string> {
  const tokenTtlMs = 4 * 60 * 1000;
  if (!forceRefresh && cachedToken && Date.now() - cachedAt < tokenTtlMs) {
    return cachedToken;
  }

  if (!SERVICE_USERNAME || !SERVICE_PASSWORD) {
    throw new Error(
      "Service credentials are not configured. Set BACKEND_SERVICE_USERNAME and BACKEND_SERVICE_PASSWORD."
    );
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
    const body = await tokenRes.json().catch(() => ({}));
    const detail =
      typeof body === "object"
        ? (body as Record<string, unknown>).detail
        : undefined;
    throw new Error(
      (typeof detail === "string" && detail) ||
        `Failed to obtain service token (${tokenRes.status}).`
    );
  }

  const data = (await tokenRes.json()) as { access: string };
  cachedToken = data.access;
  cachedAt = Date.now();
  return data.access;
}

interface Ctx {
  params: Promise<{ rn: string }>;
}

// GET /api/public/jobs/:rn
export async function GET(_req: Request, ctx: Ctx) {
  const { rn } = await ctx.params;
  const normalizedQuery = rn.trim();
  if (!normalizedQuery) {
    return NextResponse.json({ error: "Search query is required" }, { status: 400 });
  }

  try {
    const incomingAuth = _req.headers.get("authorization");

    if (incomingAuth) {
      const userLookup = await lookupJob(normalizedQuery, incomingAuth);
      if (userLookup.status === 200) {
        return NextResponse.json({ job: userLookup.job });
      }
      if (userLookup.status === 404) {
        return NextResponse.json({ job: null }, { status: 404 });
      }
    }

    // Primary path for public tracking: try anonymous backend lookup first.
    const publicLookup = await lookupJob(normalizedQuery);
    if (publicLookup.status === 200) {
      return NextResponse.json({ job: publicLookup.job });
    }
    if (publicLookup.status === 404) {
      return NextResponse.json({ job: null }, { status: 404 });
    }

    let token = await getServiceToken();
    let serviceLookup = await lookupJob(normalizedQuery, `Bearer ${token}`);

    if (serviceLookup.status === 401) {
      token = await getServiceToken(true);
      serviceLookup = await lookupJob(normalizedQuery, `Bearer ${token}`);
    }

    if (serviceLookup.status === 404) {
      return NextResponse.json({ job: null }, { status: 404 });
    }

    if (serviceLookup.status !== 200) {
      return NextResponse.json(
        {
          error: serviceLookup.error ?? `Backend lookup failed (${serviceLookup.status})`,
        },
        { status: serviceLookup.status }
      );
    }

    return NextResponse.json({ job: serviceLookup.job });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Public job lookup failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
