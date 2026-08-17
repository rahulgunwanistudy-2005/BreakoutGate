/**
 * @file app/api/decision/route.ts
 * @description Next.js App Router API Route for BreakoutGate decision orchestration.
 */

import { NextRequest, NextResponse } from "next/server";
import { executeDecisionPipeline } from "@/packages/orchestration";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const result = await executeDecisionPipeline(body);

    if (!result.success) {
      return NextResponse.json(result, { status: result.error?.code === "INVALID_REQUEST" ? 400 : 422 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ORCHESTRATION_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
}
