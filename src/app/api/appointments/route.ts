import { NextResponse } from "next/server";
import {
  createAppointmentOnProvider,
  fetchAppointmentsFromProvider,
  healthAppointmentsConfigErrorMessage,
  isHealthAppointmentsApiConfigured,
} from "@/lib/healthAppointmentsApi";
import { MEDICAL_DISCLAIMER } from "@/lib/medicalDisclaimer";

export const runtime = "nodejs";

export async function GET() {
  if (!isHealthAppointmentsApiConfigured()) {
    // 200 so the Appointments page can load without a configured provider; “Recent requests” stays empty.
    return NextResponse.json({
      appointments: [],
      disclaimer: MEDICAL_DISCLAIMER,
      appointmentProviderConfigured: false,
    });
  }
  try {
    const appointments = await fetchAppointmentsFromProvider();
    return NextResponse.json({ appointments: appointments ?? [], disclaimer: MEDICAL_DISCLAIMER });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to load appointments",
        appointments: [],
        disclaimer: MEDICAL_DISCLAIMER,
      },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  if (!isHealthAppointmentsApiConfigured()) {
    return NextResponse.json(
      { error: healthAppointmentsConfigErrorMessage(), disclaimer: MEDICAL_DISCLAIMER },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON", disclaimer: MEDICAL_DISCLAIMER }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const preferredDate = typeof body.preferredDate === "string" ? body.preferredDate.trim() : "";
  const hospitalId = typeof body.hospitalId === "string" ? body.hospitalId.trim() : "";
  const doctorId = typeof body.doctorId === "string" ? body.doctorId.trim() : "";
  const hospitalName = typeof body.hospitalName === "string" ? body.hospitalName.trim() : undefined;
  const hospitalCity = typeof body.hospitalCity === "string" ? body.hospitalCity.trim() : undefined;
  const hospitalAddress = typeof body.hospitalAddress === "string" ? body.hospitalAddress.trim() : undefined;
  const hospitalRating = typeof body.hospitalRating === "string" ? body.hospitalRating.trim() : undefined;
  const hospitalSpeciality =
    typeof body.hospitalSpeciality === "string" ? body.hospitalSpeciality.trim() : undefined;
  const doctorName = typeof body.doctorName === "string" ? body.doctorName.trim() : undefined;
  const doctorSpecialty = typeof body.doctorSpecialty === "string" ? body.doctorSpecialty.trim() : undefined;
  const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;

  if (!name || !email || !phone || !hospitalId || !doctorId || !preferredDate) {
    return NextResponse.json(
      {
        error:
          "name, email, phone, hospitalId, doctorId, and preferredDate are required",
        disclaimer: MEDICAL_DISCLAIMER,
      },
      { status: 422 }
    );
  }

  const payload: Record<string, unknown> = {
    name,
    email,
    phone,
    hospitalId,
    doctorId,
    preferredDate,
  };
  if (notes) payload.notes = notes;
  if (hospitalName) payload.hospitalName = hospitalName;
  if (hospitalCity) payload.hospitalCity = hospitalCity;
  if (hospitalAddress) payload.hospitalAddress = hospitalAddress;
  if (hospitalRating) payload.hospitalRating = hospitalRating;
  if (hospitalSpeciality) payload.hospitalSpeciality = hospitalSpeciality;
  if (doctorName) payload.doctorName = doctorName;
  if (doctorSpecialty) payload.doctorSpecialty = doctorSpecialty;

  try {
    const providerResult = await createAppointmentOnProvider(payload);
    return NextResponse.json(
      { appointment: providerResult, disclaimer: MEDICAL_DISCLAIMER },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to book appointment",
        disclaimer: MEDICAL_DISCLAIMER,
      },
      { status: 502 }
    );
  }
}
