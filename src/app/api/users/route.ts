import { NextResponse } from "next/server";

function notAvailable() {
  return NextResponse.json(
    {
      error:
        "Mock route removed. This endpoint is not implemented on the Railway backend yet.",
    },
    { status: 501 }
  );
}

export async function GET() {
  return notAvailable();
}

export async function POST() {
  return notAvailable();
}

export async function PUT() {
  return notAvailable();
}

export async function PATCH() {
  return notAvailable();
}

export async function DELETE() {
  return notAvailable();
}