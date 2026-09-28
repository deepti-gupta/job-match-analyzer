import { NextResponse } from "next/server";
import { ingestResume } from "@/lib/ingest";

export async function POST() {
  try {
    const count = await ingestResume();
    return NextResponse.json({
      success: true,
      message: `Resume ingested — ${count} chunks stored`,
    });
  } catch (err) {
    const error = err as Error;
    console.error("Ingest failed:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
