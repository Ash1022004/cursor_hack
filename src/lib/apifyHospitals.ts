/**
 * Maps Apify / Google Places–style dataset items into the Appointments UI shape.
 * Kept separate from the page for readability and testing.
 */

export type ApifyHospitalDisplay = {
  name: string;
  rating: string;
  address: string;
  speciality: string;
};

/** Row used by the hospital <select> (extra fields for booking payload). */
export type AppointmentHospitalOption = ApifyHospitalDisplay & {
  id: string;
  city: string;
};

function deriveCityFromAddress(addr: string): string {
  if (!addr) return "";
  const parts = addr
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return parts[parts.length - 2] || parts[parts.length - 1] || "";
  }
  return parts[0] || "";
}

/**
 * Normalizes one Apify dataset row into the required display structure.
 */
export function mapRawApifyItemToHospital(
  raw: unknown,
  index: number
): AppointmentHospitalOption | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const name = String(r.title ?? r.name ?? "").trim();
  if (!name) return null;

  const rating = String(
    r.totalScore ?? r.rating ?? r.stars ?? r.reviewScore ?? r.starRating ?? ""
  ).trim();

  const address = String(
    r.address ?? r.fullAddress ?? r.formattedAddress ?? r.adress ?? ""
  ).trim();

  const categories = r.categories;
  const firstCat =
    Array.isArray(categories) && typeof categories[0] === "string"
      ? categories[0]
      : undefined;

  const typesField = r.types;
  const firstType =
    Array.isArray(typesField) && typeof typesField[0] === "string"
      ? typesField[0]
      : undefined;

  const speciality = String(
    r.categoryName ?? firstCat ?? r.subtitle ?? firstType ?? r.type ?? ""
  ).trim();

  const id = String(
    r.placeId ?? r.place_id ?? r.url ?? r.titleUrl ?? `apify-hospital-${index}`
  )
    .replace(/\s+/g, " ")
    .slice(0, 240);

  const city = deriveCityFromAddress(address) || speciality || "—";

  return {
    id,
    name,
    rating,
    address,
    speciality,
    city,
  };
}

/**
 * Fetches mapped hospitals via Convex HTTP (`/api/apify/hospitals` → Convex rewrite).
 * Apify runs on Convex using `APIFY_TOKEN` and dataset/actor env vars on the deployment.
 */
export async function fetchHospitals(): Promise<AppointmentHospitalOption[]> {
  let res: Response;
  try {
    res = await fetch("/api/apify/hospitals", { cache: "no-store" });
  } catch (e) {
    console.warn("[Appointments] Network error loading hospitals", e);
    return [];
  }

  if (res.status === 404) {
    console.warn(
      "[Appointments] /api/apify/hospitals returned 404. Set CONVEX_SITE_URL in .env.local so Next can proxy to Convex."
    );
    return [];
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    console.warn("[Appointments] Invalid JSON from /api/apify/hospitals");
    return [];
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[Appointments] Apify hospitals API response", {
      status: res.status,
      data,
    });
  }

  const obj = data as { hospitals?: AppointmentHospitalOption[] };

  if (!res.ok) {
    console.warn(
      "[Appointments] Hospitals request not OK:",
      res.status,
      obj && typeof obj === "object" && "error" in obj ? (obj as { error?: string }).error : ""
    );
    return Array.isArray(obj.hospitals) ? obj.hospitals : [];
  }

  return Array.isArray(obj.hospitals) ? obj.hospitals : [];
}
