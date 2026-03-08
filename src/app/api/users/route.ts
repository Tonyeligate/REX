import { NextRequest, NextResponse } from "next/server";
import { users, passwords, sessions, nextId } from "@/lib/demo-db";

// GET /api/users — list all users
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.toLowerCase() ?? "";
  const role = url.searchParams.get("role") ?? "";

  let result = [...users];

  if (search) {
    result = result.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
    );
  }

  if (role) {
    result = result.filter((u) => u.role === role);
  }

  const mapped = result.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    lastLogin: u.updatedAt,
    createdAt: u.createdAt,
  }));

  return NextResponse.json({ users: mapped, total: mapped.length });
}

// POST /api/users — invite / create a user
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { email, role, firstName, lastName } = body;

  if (!email || !role) {
    return NextResponse.json(
      { error: "Email and role are required" },
      { status: 400 }
    );
  }

  // Check duplicate
  if (users.find((u) => u.email === email)) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  const newUser = {
    id: nextId("u"),
    email,
    firstName: firstName ?? email.split("@")[0],
    lastName: lastName ?? "",
    gender: "",
    idType: "",
    idNumber: "",
    phone: "",
    phoneCode: "+233",
    country: "Ghana",
    address: "",
    role: role as import("@/types/user").Role,
    accountType: "Individual" as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);
  passwords[email] = "changeme123"; // default password for invited users

  return NextResponse.json({
    user: {
      id: newUser.id,
      name: `${newUser.firstName} ${newUser.lastName}`,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      lastLogin: newUser.updatedAt,
      createdAt: newUser.createdAt,
    },
  });
}
