import { GoogleGenerativeAI } from "@google/generative-ai";

export type LabelExtraction = {
  medicine_name: string | null;
  strength_or_dosage: string | null;
  expiry_date: string | null;
  manufacturer: string | null;
  confidence: number;
};

function geminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

function stripJsonFence(text: string): string {
  const t = text.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return t;
}

export async function extractLabelFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<LabelExtraction> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: geminiModelName() });

  const prompt = `You are reading a medicine package or label photo.
Return ONLY valid JSON (no markdown) with this exact shape:
{
  "medicine_name": string or null (brand or generic name as printed),
  "strength_or_dosage": string or null (e.g. 500 mg, 10ml),
  "expiry_date": string or null (copy EXACTLY as printed, e.g. EXP 03/26, 2026-01, Best Before Jan 2027),
  "manufacturer": string or null,
  "confidence": number from 0 to 1 for how sure you are overall
}
If the image is not a medicine package, return nulls and confidence 0.`;

  const base64 = imageBuffer.toString("base64");
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: base64,
      },
    },
    { text: prompt },
  ]);

  const raw = result.response.text();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripJsonFence(raw)) as Record<string, unknown>;
  } catch {
    return {
      medicine_name: null,
      strength_or_dosage: null,
      expiry_date: null,
      manufacturer: null,
      confidence: 0,
    };
  }

  const conf = typeof parsed.confidence === "number" ? parsed.confidence : 0;

  return {
    medicine_name:
      typeof parsed.medicine_name === "string" ? parsed.medicine_name : null,
    strength_or_dosage:
      typeof parsed.strength_or_dosage === "string"
        ? parsed.strength_or_dosage
        : null,
    expiry_date:
      typeof parsed.expiry_date === "string" ? parsed.expiry_date : null,
    manufacturer:
      typeof parsed.manufacturer === "string" ? parsed.manufacturer : null,
    confidence: Math.max(0, Math.min(1, conf)),
  };
}

/** Best-effort parse expiry to end-of-day UTC for comparison. */
export function parseExpiryToDate(raw: string | null): Date | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();

  const iso = /^\d{4}-\d{2}-\d{2}$/.exec(s);
  if (iso) {
    const d = new Date(`${s}T23:59:59.999Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const my = /^(\d{1,2})\/(\d{2,4})$/.exec(s);
  if (my) {
    const month = Number(my[1]) - 1;
    let year = Number(my[2]);
    if (year < 100) year += 2000;
    const d = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(s);
  if (dmy) {
    const a = Number(dmy[1]);
    const b = Number(dmy[2]);
    let y = Number(dmy[3]);
    if (y < 100) y += 2000;
    let day = a;
    let month = b - 1;
    if (a <= 12 && b > 12) {
      month = a - 1;
      day = b;
    }
    const d = new Date(Date.UTC(y, month, day, 23, 59, 59, 999));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  return null;
}

export function isExpiryInPast(expiry: Date | null): boolean {
  if (!expiry) return false;
  return expiry.getTime() < Date.now();
}
