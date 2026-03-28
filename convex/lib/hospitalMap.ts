/** Pure mapping from Apify / Google Places dataset rows → Appointments UI shape. */

export type AppointmentHospitalOption = {
  id: string;
  name: string;
  rating: string;
  address: string;
  speciality: string;
  city: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

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

function pickAddress(r: Record<string, unknown>): string {
  const place = asRecord(r.place);
  const loc = asRecord(r.location);
  const addrObj = asRecord(r.address);

  const candidates = [
    r.address,
    r.fullAddress,
    r.formattedAddress,
    r.adress,
    place?.address,
    loc?.address,
    typeof addrObj?.formatted === "string" ? addrObj.formatted : undefined,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

function pickName(r: Record<string, unknown>): string {
  const sr = asRecord(r.searchResult);
  const place = asRecord(r.place);
  const loc = asRecord(r.location);

  const candidates = [
    r.title,
    r.name,
    r.placeName,
    r.businessName,
    r.hospitalName,
    r.label,
    r.text,
    sr?.title,
    sr?.name,
    place?.title,
    place?.name,
    loc?.label,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }

  const addr = pickAddress(r);
  if (addr) {
    const first = addr.split(",")[0]?.trim();
    if (first) return first;
  }

  return "";
}

function pickId(r: Record<string, unknown>, index: number): string {
  const candidates = [r.placeId, r.place_id, r.url, r.titleUrl, r.id];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      return c.replace(/\s+/g, " ").slice(0, 240);
    }
  }
  return `apify-hospital-${index}`;
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

  let name = pickName(r);
  const address = pickAddress(r);
  if (!name && address) {
    name = address.split(",")[0]?.trim() || "";
  }
  if (!name) return null;

  const rating = String(
    r.totalScore ?? r.rating ?? r.stars ?? r.reviewScore ?? r.starRating ?? ""
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

  const id = pickId(r, index);
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
