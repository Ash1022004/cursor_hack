import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@cvx/_generated/api";
import {
  createAppointmentOnProvider,
  fetchAppointmentsFromProvider,
  healthAppointmentsConfigErrorMessage,
  isHealthAppointmentsApiConfigured,
} from "@/lib/healthAppointmentsApi";
import { MEDICAL_DISCLAIMER } from "@/lib/medicalDisclaimer";
import type { Doc } from "@cvx/_generated/dataModel";

export const runtime = "nodejs";

type Appt = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  preferredDate: string;
  notes?: string;
  createdAt: string;
};

function mapDoc(doc: Doc<"appointments">): Appt {
  return {
    id: doc._id,
    name: doc.guestName ?? "",
    email: doc.guestEmail ?? "",
    phone: doc.guestPhone,
    department: doc.department ?? "",
    preferredDate: doc.preferredDate ?? "",
    notes: doc.notes,
    createdAt: new Date(doc._creationTime).toISOString(),
  };
}

function getConvexClient(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

export async function GET() {
  if (isHealthAppointmentsApiConfigured()) {
    try {
      const appointments = await fetchAppointmentsFromProvider();
      return NextResponse.json({
        appointments: appointments ?? [],
        disclaimer: MEDICAL_DISCLAIMER,
        appointmentProviderConfigured: true,
      });
    } catch (e) {
      console.warn(
        "[api/appointments] External provider list failed; falling back to Convex",
        e
      );
    }
  }

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json(
      {
        error: "NEXT_PUBLIC_CONVEX_URL is not configured",
        disclaimer: MEDICAL_DISCLAIMER,
        appointmentProviderConfigured: false,
        appointments: [],
      },
      { status: 503 }
    );
  }
  try {
    const rows = await client.query(api.guestAppointments.listRecent, {
      limit: 100,
    });
    const appointments = (rows as Doc<"appointments">[]).map(mapDoc);
    return NextResponse.json({
      appointments,
      disclaimer: MEDICAL_DISCLAIMER,
      appointmentProviderConfigured: true,
    });
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
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", disclaimer: MEDICAL_DISCLAIMER },
      { status: 400 }
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
  const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;

  if (isHealthAppointmentsApiConfigured()) {
    const preferredDate =
      typeof body.preferredDate === "string" ? body.preferredDate.trim() : "";
    const hospitalId =
      typeof body.hospitalId === "string" ? body.hospitalId.trim() : "";
    const doctorId =
      typeof body.doctorId === "string" ? body.doctorId.trim() : "";
    const hospitalName =
      typeof body.hospitalName === "string"
        ? body.hospitalName.trim()
        : undefined;
    const hospitalCity =
      typeof body.hospitalCity === "string"
        ? body.hospitalCity.trim()
        : undefined;
    const hospitalAddress =
      typeof body.hospitalAddress === "string"
        ? body.hospitalAddress.trim()
        : undefined;
    const hospitalRating =
      typeof body.hospitalRating === "string"
        ? body.hospitalRating.trim()
        : undefined;
    const hospitalSpeciality =
      typeof body.hospitalSpeciality === "string"
        ? body.hospitalSpeciality.trim()
        : undefined;
    const doctorName =
      typeof body.doctorName === "string" ? body.doctorName.trim() : undefined;
    const doctorSpecialty =
      typeof body.doctorSpecialty === "string"
        ? body.doctorSpecialty.trim()
        : undefined;

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

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json(
      {
        error: "NEXT_PUBLIC_CONVEX_URL is not configured",
        disclaimer: MEDICAL_DISCLAIMER,
      },
      { status: 503 }
    );
  }

  const preferredDate =
    typeof body.preferredDate === "string" ? body.preferredDate.trim() : "";
  const hospitalId =
    typeof body.hospitalId === "string" ? body.hospitalId.trim() : "";
  const doctorId =
    typeof body.doctorId === "string" ? body.doctorId.trim() : "";
  const indianState =
    typeof body.indianState === "string" ? body.indianState.trim() : "";
  const hospitalName =
    typeof body.hospitalName === "string"
      ? body.hospitalName.trim()
      : undefined;
  const hospitalCity =
    typeof body.hospitalCity === "string"
      ? body.hospitalCity.trim()
      : undefined;
  const hospitalAddress =
    typeof body.hospitalAddress === "string"
      ? body.hospitalAddress.trim()
      : undefined;
  const doctorName =
    typeof body.doctorName === "string" ? body.doctorName.trim() : undefined;
  const doctorSpecialty =
    typeof body.doctorSpecialty === "string"
      ? body.doctorSpecialty.trim()
      : undefined;

  let department =
    typeof body.department === "string" ? body.department.trim() : "";
  let notesOut = notes;

  /** Health appointments page: hospital + doctor (no external provider). */
  if (hospitalId && doctorId) {
    if (!name || !email || !phone || !preferredDate) {
      return NextResponse.json(
        {
          error:
            "name, email, phone, hospitalId, doctorId, and preferredDate are required",
          disclaimer: MEDICAL_DISCLAIMER,
        },
        { status: 422 }
      );
    }
    const deptParts = [doctorSpecialty, hospitalName || hospitalId].filter(
      Boolean
    ) as string[];
    department =
      deptParts.length > 0 ? deptParts.join(" · ") : "Hospital appointment";
    const meta = [
      indianState && `State/UT: ${indianState}`,
      hospitalName && `Hospital: ${hospitalName}`,
      hospitalCity && `City: ${hospitalCity}`,
      hospitalAddress && `Address: ${hospitalAddress}`,
      `Hospital ID: ${hospitalId}`,
      doctorName && `Doctor: ${doctorName}`,
      `Doctor ID: ${doctorId}`,
    ]
      .filter(Boolean)
      .join("\n");
    notesOut = [notes, meta].filter(Boolean).join("\n\n---\n");
  }

  if (!name || !email || !department || !preferredDate) {
    return NextResponse.json(
      {
        error:
          "name, email, and preferredDate are required; add either department or hospital + doctor selection",
        disclaimer: MEDICAL_DISCLAIMER,
      },
      { status: 422 }
    );
  }

  try {
    const created = await client.mutation(api.guestAppointments.createGuest, {
      name,
      email,
      phone,
      department,
      preferredDate,
      notes: notesOut,
    });
    return NextResponse.json(
      {
        appointment: mapDoc(created as Doc<"appointments">),
        disclaimer: MEDICAL_DISCLAIMER,
      },
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
