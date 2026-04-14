import { NextResponse } from "next/server";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://ls-portal-development-backend.up.railway.app";

type SearchableBackendJob = {
  rn?: string;
  regional_number?: string | null;
  client?: {
    name?: string;
  };
};

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

async function lookupJob(query: string, authorization?: string) {
  const headers = authorization ? { Authorization: authorization } : undefined;
  const raw = query.trim();
  const candidates = [raw];
  if (raw.includes("/")) {
    // Django path converters decode once; `%252F` preserves slash as literal in rn.
    candidates.push(raw.replace(/\//g, "%2F"));
  }

  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
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
      // Try next candidate if available (e.g. slash double-encoding fallback).
      if (i < candidates.length - 1) continue;
      return { status: 404, job: null };
    }

    const body = await tracking.json().catch(() => ({}));
    const detail =
      typeof body === "object"
        ? (body as Record<string, unknown>).detail
        : undefined;

    return {
      status: tracking.status,
      error:
        (typeof detail === "string" && detail) ||
        `Backend tracking lookup failed (${tracking.status})`,
    };
  }

  return { status: 404, job: null };
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

    // Primary path for public tracking: try anonymous backend lookup first.
    const publicLookup = await lookupJob(normalizedQuery);
    if (publicLookup.status === 200) {
      return NextResponse.json({ job: publicLookup.job });
    }
    if (publicLookup.status === 404) {
      return NextResponse.json({ job: null }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          publicLookup.error ?? `Backend lookup failed (${publicLookup.status})`,
      },
      { status: publicLookup.status }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Public job lookup failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
