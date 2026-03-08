import { NextResponse } from "next/server";
import { users, sessions } from "@/lib/demo-db";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const userId = token ? sessions[token] : undefined;
  const user = userId ? users.find((u) => u.id === userId) : undefined;

  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({ user });
}
