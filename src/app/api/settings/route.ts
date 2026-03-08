import { NextRequest, NextResponse } from "next/server";
import { settings, sessions } from "@/lib/demo-db";
import type { AppSettings } from "@/lib/demo-db";

// GET /api/settings — retrieve current settings
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ settings });
}

// PUT /api/settings — update settings
export async function PUT(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: Partial<AppSettings> = await req.json();

  // Merge incoming fields into settings (mutate in-memory object)
  for (const key of Object.keys(body) as (keyof AppSettings)[]) {
    if (key in settings) {
      (settings as Record<string, unknown>)[key] = body[key];
    }
  }

  return NextResponse.json({ settings });
}
