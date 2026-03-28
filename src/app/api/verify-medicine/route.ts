import { NextResponse } from "next/server";
import { loadMedicines, matchMedicineFromText } from "@/lib/medicineDataset";
import { MEDICAL_DISCLAIMER } from "@/lib/medicalDisclaimer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let buffer: Buffer;
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Missing file field "image"', disclaimer: MEDICAL_DISCLAIMER },
        { status: 400 }
      );
    }
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
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const {
      data: { text },
    } = await worker.recognize(buffer);
    await worker.terminate();

    const medicines = await loadMedicines();
    const match = matchMedicineFromText(text, medicines);

    return NextResponse.json({
      detected_text: text.trim(),
      medicine_name: match?.name ?? null,
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
        error: e instanceof Error ? e.message : "OCR failed",
        disclaimer: MEDICAL_DISCLAIMER,
      },
      { status: 500 }
    );
  }
}
