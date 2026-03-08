import { NextResponse } from "next/server";
import { users, passwords, sessions, emailAliases } from "@/lib/demo-db";

export async function POST(req: Request) {
  const body = await req.json();
  const rawEmail: string = (body.email ?? "").trim().toLowerCase();
  // Resolve any legacy email aliases to the canonical address
  const email = emailAliases[rawEmail] ?? rawEmail;
  const password: string = body.password ?? "";

  const user = users.find((u) => u.email === email);
  if (!user || passwords[email] !== password) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Demo token — replace with JWT in production
  const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");
  sessions[token] = user.id;

  return NextResponse.json({ user, token });
}
