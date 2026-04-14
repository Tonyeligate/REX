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
  client?: {
    name?: string;
  };
};

type LookupResult = {
  status: number;
  job: SearchableBackendJob | null;
  error?: string;
};

function normalizeTrackingKey(value?: string | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

function looksLikeTrackingQuery(query: string): boolean {
  const compact = query.trim().replace(/\s+/g, "");
  if (!compact || compact.length < 5) return false;

  if (/^(rn|arn)[-/].+/i.test(compact)) return true;

  // Regional numbers may be numeric-only; allow practical lengths.
  if (/^\d{5,20}$/.test(compact)) return true;

  // Some regional formats use numeric separators like 123/2026.
  if (/^\d+[/-]\d+$/.test(compact)) return true;

  const hasLetter = /[a-z]/i.test(compact);
  const hasDigit = /\d/.test(compact);
  return hasLetter && hasDigit;
}

function matchesJobQuery(job: SearchableBackendJob, query: string): boolean {
  const normalizedQuery = normalizeTrackingKey(query);
  if (!normalizedQuery) return false;

  const trackingKeys = [
    normalizeTrackingKey(job.rn),
    normalizeTrackingKey(job.regional_number),
  ].filter(Boolean);

  return trackingKeys.some((key) => key === normalizedQuery);
}

function hasConfiguredServiceCredentials(): boolean {
  const username = (SERVICE_USERNAME ?? "").trim().toLowerCase();
  const password = (SERVICE_PASSWORD ?? "").trim().toLowerCase();
  if (!username || !password) return false;

  const placeholderValues = new Set([
    "replace_with_service_username",
    "replace_with_service_password",
    "your_service_username",
    "your_service_password",
  ]);

  return !placeholderValues.has(username) && !placeholderValues.has(password);
}

async function lookupJob(query: string, authorization?: string): Promise<LookupResult> {
  const headers = authorization ? { Authorization: authorization } : undefined;
  const raw = query.trim();
  if (!raw) {
    return { status: 404, job: null };
  }

  const trackingCandidates = [raw];
  if (raw.includes("/")) {
    // Django path converters decode once; `%252F` preserves slash as literal in RN.
    trackingCandidates.push(raw.replace(/\//g, "%2F"));
  }

  for (let i = 0; i < trackingCandidates.length; i += 1) {
    const candidate = trackingCandidates[i];
    const tracking = await fetch(
      `${BACKEND_ORIGIN}/api/jobs/tracking/${encodeURIComponent(candidate)}/`,
      {
        headers,
        cache: "no-store",
      }
    );

    if (tracking.ok) {
      return {
        status: 200,
        job: (await tracking.json()) as SearchableBackendJob,
      };
    }

    if (tracking.status === 404) {
      continue;
    }

    const body = await tracking.json().catch(() => ({}));
    const detail =
      typeof body === "object"
        ? (body as Record<string, unknown>).detail
        : undefined;

    return {
      status: tracking.status,
      job: null,
      error:
        (typeof detail === "string" && detail) ||
        `Backend tracking lookup failed (${tracking.status})`,
    };
  }

  const direct = await fetch(`${BACKEND_ORIGIN}/api/jobs/${encodeURIComponent(raw)}/`, {
    headers,
    cache: "no-store",
  });

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
      job: null,
      error:
        (typeof detail === "string" && detail) ||
        `Backend lookup failed (${direct.status})`,
    };
  }

  // Anonymous callers cannot use list fallback on protected backends.
  if (!authorization) {
    return { status: 404, job: null };
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
      job: null,
      error:
        (typeof detail === "string" && detail) ||
        `Backend list lookup failed (${listRes.status})`,
    };
  }

  const listPayload = (await listRes.json().catch(() => [])) as
    | SearchableBackendJob[]
    | { results?: SearchableBackendJob[] };
  const jobs = Array.isArray(listPayload)
    ? listPayload
    : Array.isArray(listPayload.results)
      ? listPayload.results
      : [];

  const match = jobs.find((job) => matchesJobQuery(job, raw)) ?? null;
  if (!match) {
    return { status: 404, job: null };
  }

  // If list-search found a match, re-fetch canonical RN for freshest detail payload.
  const matchedRn = (match.rn ?? "").trim();
  if (matchedRn) {
    const detailRes = await fetch(
      `${BACKEND_ORIGIN}/api/jobs/${encodeURIComponent(matchedRn)}/`,
      {
        headers,
        cache: "no-store",
      }
    );

    if (detailRes.ok) {
      return {
        status: 200,
        job: (await detailRes.json()) as SearchableBackendJob,
      };
    }
  }

  return { status: 200, job: match };
}

async function getServiceToken(forceRefresh = false): Promise<string> {
  const tokenTtlMs = 4 * 60 * 1000;
  if (!forceRefresh && cachedToken && Date.now() - cachedAt < tokenTtlMs) {
    return cachedToken;
  }

  if (!hasConfiguredServiceCredentials()) {
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

  if (!looksLikeTrackingQuery(normalizedQuery)) {
    return NextResponse.json({ job: null }, { status: 404 });
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

    // Primary path for public tracking: anonymous backend lookup first.
    const publicLookup = await lookupJob(normalizedQuery);
    if (publicLookup.status === 200) {
      return NextResponse.json({ job: publicLookup.job });
    }
    if (publicLookup.status === 404) {
      return NextResponse.json({ job: null }, { status: 404 });
    }

    // If credentials are not configured, avoid a hard 503 and keep UX in "not found" state.
    if (!hasConfiguredServiceCredentials()) {
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
    if (/service credentials are not configured|failed to obtain service token/i.test(message)) {
      return NextResponse.json({ job: null }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Public job tracking is temporarily unavailable. Please try again shortly." },
      { status: 503 }
    );
  }
}