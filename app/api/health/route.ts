import { NextResponse } from "next/server";

export async function GET() {
  const apiKeyConfigured = Boolean(process.env.YOUCAM_API_KEY && process.env.YOUCAM_API_KEY.trim().length > 0);

  return NextResponse.json({
    status: "ok",
    phase: "P1",
    provider: "youcam",
    providerConfigured: apiKeyConfigured,
    timestamp: new Date().toISOString(),
  });
}
