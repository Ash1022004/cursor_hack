import { NextResponse } from "next/server";
import { addAppointment, listAppointments } from "@/lib/appointmentsStore";
import { MEDICAL_DISCLAIMER } from "@/lib/medicalDisclaimer";

export const runtime = "nodejs";

export async function GET() {
  try {
    const appointments = await listAppointments();
    return NextResponse.json({ appointments, disclaimer: MEDICAL_DISCLAIMER });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to read appointments",
        disclaimer: MEDICAL_DISCLAIMER,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON", disclaimer: MEDICAL_DISCLAIMER }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const department = typeof body.department === "string" ? body.department.trim() : "";
  const preferredDate = typeof body.preferredDate === "string" ? body.preferredDate.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
  const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;

  if (!name || !email || !department || !preferredDate) {
    return NextResponse.json(
      {
        error: "name, email, department, and preferredDate are required",
        disclaimer: MEDICAL_DISCLAIMER,
      },
      { status: 422 }
    );
  }

  try {
    const created = await addAppointment({
      name,
      email,
      phone,
      department,
      preferredDate,
      notes,
    });
    return NextResponse.json({ appointment: created, disclaimer: MEDICAL_DISCLAIMER }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to save appointment",
        disclaimer: MEDICAL_DISCLAIMER,
      },
      { status: 500 }
    );
  }
}
