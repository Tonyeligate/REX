import { NextResponse } from "next/server";
import { settings as defaultSettings, type AppSettings } from "@/lib/demo-db";

let currentSettings: AppSettings = { ...defaultSettings };

function respond() {
  return NextResponse.json({ settings: currentSettings });
}

export async function GET() {
  return respond();
}

export async function POST(request: Request) {
  return PUT(request);
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as Partial<AppSettings>;
    currentSettings = { ...currentSettings, ...payload };
    return respond();
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