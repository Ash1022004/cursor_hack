import { NextResponse } from "next/server";
import {
  fetchDoctorsFromProvider,
  isHealthAppointmentsApiConfigured,
} from "@/lib/healthAppointmentsApi";
import { MEDICAL_DISCLAIMER } from "@/lib/medicalDisclaimer";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isHealthAppointmentsApiConfigured()) {
    return NextResponse.json({
      doctors: [],
      disclaimer: MEDICAL_DISCLAIMER,
      appointmentProviderConfigured: false,
    });
  }
  const { searchParams } = new URL(request.url);
  const hospitalId = (searchParams.get("hospitalId") || "").trim();
  if (!hospitalId) {
    return NextResponse.json(
      { error: "hospitalId query parameter is required", doctors: [], disclaimer: MEDICAL_DISCLAIMER },
      { status: 400 }
    );
  }
  try {
    const doctors = await fetchDoctorsFromProvider(hospitalId);
    return NextResponse.json({ doctors, disclaimer: MEDICAL_DISCLAIMER });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to load doctors",
        doctors: [],
        disclaimer: MEDICAL_DISCLAIMER,
      },
      { status: 502 }
    );
  }
}
