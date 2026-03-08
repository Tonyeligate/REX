import { NextResponse } from "next/server";
import { users, passwords, nextId, sessions } from "@/lib/demo-db";
import type { User } from "@/types/user";

export async function POST(req: Request) {
  const body = await req.json();

  if (users.find((u) => u.email === body.email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const newUser: User = {
    id: nextId("u"),
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    middleName: body.middleName,
    gender: body.gender,
    idType: body.idType,
    idNumber: body.idNumber,
    phone: body.phone,
    phoneCode: body.phoneCode ?? "+233",
    country: body.country ?? "Ghana",
    address: body.address,
    role: "CLIENT",
    accountType: body.accountType ?? "Individual",
    contactPerson: body.contactPerson,
    contactPhone: body.contactPhone,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);
  passwords[newUser.email] = body.password;

  const token = Buffer.from(`${newUser.id}:${Date.now()}`).toString("base64");
  sessions[token] = newUser.id;
  return NextResponse.json({ user: newUser, token }, { status: 201 });
}
