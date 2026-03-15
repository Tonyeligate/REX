import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobIds = searchParams.get("jobIds") ?? "";
  return NextResponse.json(
    {
      records: {},
      message:
        "Mock register route retired. Register metadata is now managed in the frontend API client.",
      jobIds,
    },
    { status: 410 }
  );
}