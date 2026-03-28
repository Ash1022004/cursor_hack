import { NextResponse } from "next/server";
import { api } from "@cvx/_generated/api";
import { getConvexHttpClient } from "@/lib/convexHttp";
import { runSymptomCheck } from "@/lib/symptomCheck";
import { MEDICAL_DISCLAIMER } from "@/lib/medicalDisclaimer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", disclaimer: MEDICAL_DISCLAIMER },
      { status: 400 }
    );
  }

  const symptoms = body.symptoms;
  const age = Number(body.age);
  const gender = typeof body.gender === "string" ? body.gender : "";
  const duration = typeof body.duration === "string" ? body.duration : "";

  if (
    (typeof symptoms !== "string" && !Array.isArray(symptoms)) ||
    !symptoms ||
    (Array.isArray(symptoms) && symptoms.length === 0)
  ) {
    return NextResponse.json(
      {
        error: "symptoms is required (string or non-empty array)",
        disclaimer: MEDICAL_DISCLAIMER,
      },
      { status: 422 }
    );
  }
  if (!Number.isFinite(age) || age < 0 || age > 120) {
    return NextResponse.json(
      { error: "age must be a number between 0 and 120", disclaimer: MEDICAL_DISCLAIMER },
      { status: 422 }
    );
  }
  if (!gender.trim()) {
    return NextResponse.json(
      { error: "gender is required", disclaimer: MEDICAL_DISCLAIMER },
      { status: 422 }
    );
  }
  if (!duration.trim()) {
    return NextResponse.json(
      { error: "duration is required", disclaimer: MEDICAL_DISCLAIMER },
      { status: 422 }
    );
  }

  const input = {
    symptoms: symptoms as string | string[],
    age,
    gender,
    duration,
  };

  const convex = getConvexHttpClient();
  if (convex) {
    try {
      const result = await convex.action(api.symptomCheckRag.runRag, input);
      return NextResponse.json(result);
    } catch (e) {
      console.error("symptomCheckRag failed", e);
      const fallback = await runSymptomCheck(input);
      return NextResponse.json(fallback);
    }
  }

  const fallback = await runSymptomCheck(input);
  return NextResponse.json(fallback);
}
