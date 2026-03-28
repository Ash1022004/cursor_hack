import { NextRequest, NextResponse } from "next/server";
import { api } from "@cvx/_generated/api";
import { getConvexHttpClient } from "@/lib/convexHttp";
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

  const convex = getConvexHttpClient();
  if (convex) {
    try {
      const out = await convex.action(api.medicines.explain, { q: q.trim() });
      if (out.fromCache && Array.isArray(out.results) && out.results.length > 0) {
        type CachedRow = {
          name: string;
          genericNames: string[];
          uses: string;
          dosage: string;
          sideEffects: string;
          precautions: string;
        };
        const results = (out.results as CachedRow[]).map((h) => ({
          name: h.name,
          genericNames: h.genericNames,
          uses: h.uses,
          dosage: h.dosage,
          sideEffects: h.sideEffects,
          precautions: h.precautions,
        }));
        return NextResponse.json({
          results,
          fromCache: true,
          disclaimer: MEDICAL_DISCLAIMER,
        });
      }
      if (
        !out.fromCache &&
        "synthesized" in out &&
        out.synthesized &&
        typeof out.synthesized === "object"
      ) {
        const s = out.synthesized as {
          name: string;
          genericNames: string[];
          uses: string;
          dosage: string;
          sideEffects: string;
          precautions: string;
          sources: { title: string; url: string }[];
        };
        return NextResponse.json({
          results: [
            {
              name: s.name,
              genericNames: s.genericNames,
              uses: s.uses,
              dosage: s.dosage,
              sideEffects: s.sideEffects,
              precautions: s.precautions,
            },
          ],
          fromCache: false,
          sources: s.sources ?? [],
          disclaimer: MEDICAL_DISCLAIMER,
        });
      }
      return NextResponse.json({
        results: [],
        fromCache: false,
        message:
          "message" in out && typeof out.message === "string"
            ? out.message
            : "No results.",
        disclaimer: MEDICAL_DISCLAIMER,
      });
    } catch (e) {
      console.error("medicines.explain failed", e);
    }
  }

  try {
    const all = await loadMedicines();
    const results = searchMedicines(q, all);
    return NextResponse.json({
      results,
      fromCache: true,
      disclaimer: MEDICAL_DISCLAIMER,
      message: convex ? undefined : "Convex unavailable; using local dataset.",
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
