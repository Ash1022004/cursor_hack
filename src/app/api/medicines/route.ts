import { NextRequest, NextResponse } from "next/server";
import { loadMedicines, searchMedicines } from "@/lib/medicineDataset";
import { MEDICAL_DISCLAIMER } from "@/lib/medicalDisclaimer";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json(
      {
        results: [] as unknown[],
        disclaimer: MEDICAL_DISCLAIMER,
        message: 'Provide query parameter "q" to search by medicine name.',
      },
      { status: 200 }
    );
  }

  try {
    const all = await loadMedicines();
    const results = searchMedicines(q, all);
    return NextResponse.json({
      results,
      disclaimer: MEDICAL_DISCLAIMER,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to load medicines",
        disclaimer: MEDICAL_DISCLAIMER,
      },
      { status: 500 }
    );
  }
}
