import { NextResponse } from "next/server";
import { api } from "@cvx/_generated/api";
import { getConvexHttpClient } from "@/lib/convexHttp";
import { MEDICAL_DISCLAIMER } from "@/lib/medicalDisclaimer";
import {
  extractLabelFromImage,
  isExpiryInPast,
  parseExpiryToDate,
} from "@/lib/verifyMedicineVision";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let buffer: Buffer;
  let mimeType: string;
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Missing file field "image"', disclaimer: MEDICAL_DISCLAIMER },
        { status: 400 }
      );
    }
    mimeType = file.type || "image/jpeg";
    const ab = await file.arrayBuffer();
    buffer = Buffer.from(ab);
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart form", disclaimer: MEDICAL_DISCLAIMER },
      { status: 400 }
    );
  }

  if (buffer.length > 8 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Image too large (max 8MB)", disclaimer: MEDICAL_DISCLAIMER },
      { status: 413 }
    );
  }

  try {
    const extracted = await extractLabelFromImage(buffer, mimeType);

    const convex = getConvexHttpClient();
    let match: {
      name: string;
      genericNames: string[];
      uses: string;
      dosage: string;
      sideEffects: string;
      precautions: string;
    } | null = null;

    if (convex && extracted.medicine_name?.trim()) {
      const doc = await convex.query(api.medicinesDb.matchBestMedicine, {
        extractedName: extracted.medicine_name.trim(),
      });
      if (doc) {
        match = {
          name: doc.name,
          genericNames: doc.genericNames,
          uses: doc.uses,
          dosage: doc.dosage,
          sideEffects: doc.sideEffects,
          precautions: doc.precautions,
        };
      }
    }

    const expiryDate = parseExpiryToDate(extracted.expiry_date);
    const expired = isExpiryInPast(expiryDate);

    let status: "verified" | "not_found" | "expired";
    if (expired) {
      status = "expired";
    } else if (match) {
      status = "verified";
    } else {
      status = "not_found";
    }

    return NextResponse.json({
      status,
      extracted: {
        medicine_name: extracted.medicine_name,
        strength_or_dosage: extracted.strength_or_dosage,
        expiry_date: extracted.expiry_date,
        manufacturer: extracted.manufacturer,
        confidence: extracted.confidence,
      },
      expiry_parsed_iso:
        expiryDate && !Number.isNaN(expiryDate.getTime())
          ? expiryDate.toISOString()
          : null,
      medicine_name: match?.name ?? extracted.medicine_name ?? null,
      basic_info: match
        ? {
            uses: match.uses,
            dosage: match.dosage,
            sideEffects: match.sideEffects,
            precautions: match.precautions,
          }
        : null,
      disclaimer: MEDICAL_DISCLAIMER,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Vision extraction failed",
        disclaimer: MEDICAL_DISCLAIMER,
      },
      { status: 500 }
    );
  }
}
