/**
 * Server-only client for an external appointments / directory API.
 * See comments in-repo for expected provider routes (doctors list, booking).
 */

export type HealthDoctor = {
  id: string;
  name: string;
  specialty: string;
  department?: string;
};

export type HealthAppointment = Record<string, unknown> & {
  id?: string;
  name?: string;
  email?: string;
};

function firstEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v) return v;
  }
  return undefined;
}

function getBaseUrl(): string | undefined {
  const u = firstEnv(
    "HEALTH_APPOINTMENTS_API_URL",
    "APPOINTMENTS_API_URL",
    "APPOINTMENT_API_URL"
  );
  return u ? u.replace(/\/+$/, "") : undefined;
}

function getApiKey(): string | undefined {
  return firstEnv(
    "HEALTH_APPOINTMENTS_API_KEY",
    "APPOINTMENTS_API_KEY",
    "APPOINTMENT_API_KEY",
    "HEALTH_APPOINTMENTS_API_TOKEN",
    "APPOINTMENTS_API_TOKEN"
  );
}

function getKeyHeaderName(): string | undefined {
  return firstEnv(
    "HEALTH_APPOINTMENTS_API_KEY_HEADER",
    "APPOINTMENTS_API_KEY_HEADER",
    "APPOINTMENT_API_KEY_HEADER"
  );
}

function authorizationIsRawKey(): boolean {
  const mode = firstEnv(
    "HEALTH_APPOINTMENTS_API_AUTH_MODE",
    "APPOINTMENTS_API_AUTH_MODE"
  );
  if (!mode) return false;
  const m = mode.toLowerCase();
  return m === "raw" || m === "none";
}

export function isHealthAppointmentsApiConfigured(): boolean {
  return Boolean(getBaseUrl() && getApiKey());
}

export function healthAppointmentsConfigErrorMessage(): string {
  return (
    "Appointment directory is not configured. Set HEALTH_APPOINTMENTS_API_URL and " +
    "HEALTH_APPOINTMENTS_API_KEY (or APPOINTMENTS_API_URL + APPOINTMENTS_API_KEY) on the server."
  );
}

function authHeaders(): HeadersInit {
  const key = getApiKey();
  if (!key) return {};
  const headerName = getKeyHeaderName();
  if (headerName) {
    return { [headerName]: key };
  }
  if (authorizationIsRawKey()) {
    return { Authorization: key };
  }
  return { Authorization: `Bearer ${key}` };
}

async function providerFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) {
    throw new Error(healthAppointmentsConfigErrorMessage());
  }
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  const auth = authHeaders();
  for (const [k, v] of Object.entries(auth)) {
    headers.set(k, String(v));
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  return fetch(url, { ...init, headers });
}

function normalizeList<T>(raw: unknown, key: string): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj[key])) return obj[key] as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

export async function fetchDoctorsFromProvider(
  hospitalId: string
): Promise<HealthDoctor[]> {
  const enc = encodeURIComponent(hospitalId);
  const res = await providerFetch(`/hospitals/${enc}/doctors`, { method: "GET" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Doctors API error (${res.status}): ${t.slice(0, 200)}`);
  }
  const json = (await res.json()) as unknown;
  return normalizeList<HealthDoctor>(json, "doctors");
}

export async function createAppointmentOnProvider(body: Record<string, unknown>): Promise<unknown> {
  const res = await providerFetch("/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "error" in json
        ? String((json as { error: unknown }).error)
        : text.slice(0, 200);
    throw new Error(`Book appointment failed (${res.status}): ${msg}`);
  }
  return json;
}

export async function fetchAppointmentsFromProvider(): Promise<HealthAppointment[]> {
  const res = await providerFetch("/appointments", { method: "GET" });
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`List appointments error (${res.status}): ${t.slice(0, 200)}`);
  }
  const json = (await res.json()) as unknown;
  return normalizeList<HealthAppointment>(json, "appointments");
}
