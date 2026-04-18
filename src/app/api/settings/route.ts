import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { settings as defaultSettings, type AppSettings } from "@/lib/demo-db";

export const runtime = "nodejs";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://ls-portal-development-backend.up.railway.app";

const SETTINGS_FILE = path.join(process.cwd(), "data", "app-settings.json");

interface BackendMeProfile {
  role?: string;
  role_display?: string;
}

interface BackendMeResponse {
  is_staff?: boolean;
  is_superuser?: boolean;
  profile?: BackendMeProfile | null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAdminUser(user: BackendMeResponse): boolean {
  if (user.is_staff || user.is_superuser) return true;
  const roleText = `${user.profile?.role ?? ""} ${user.profile?.role_display ?? ""}`
    .trim()
    .toLowerCase();
  return /admin|super|chief|examiner|staff|employee/.test(roleText);
}

async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const meRes = await fetch(`${BACKEND_ORIGIN}/api/auth/me/`, {
    headers: { Authorization: authorization },
    cache: "no-store",
  });
  if (!meRes.ok) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const mePayload = (await meRes.json().catch(() => ({}))) as BackendMeResponse;
  if (!isAdminUser(mePayload)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return null;
}

function normalizeSettings(payload: unknown): AppSettings {
  if (!isObject(payload)) {
    return { ...defaultSettings };
  }
  return {
    ...defaultSettings,
    ...(payload as Partial<AppSettings>),
  };
}

async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await readFile(SETTINGS_FILE, "utf8");
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return { ...defaultSettings };
  }
}

async function persistSettings(settings: AppSettings): Promise<void> {
  await mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
  await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
}

function respond(settings: AppSettings) {
  return NextResponse.json({ settings });
}

export async function GET(request: Request) {
  const authFailure = await requireAdmin(request);
  if (authFailure) return authFailure;
  const settings = await loadSettings();
  return respond(settings);
}

export async function POST(request: Request) {
  return PUT(request);
}

export async function PUT(request: Request) {
  const authFailure = await requireAdmin(request);
  if (authFailure) return authFailure;

  try {
    const current = await loadSettings();
    const payload = (await request.json()) as Partial<AppSettings>;
    const nextSettings = { ...current, ...payload };
    await persistSettings(nextSettings);
    return respond(nextSettings);
  } catch {
    return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  return PUT(request);
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}