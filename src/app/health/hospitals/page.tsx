"use client";

import React, { useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { fetchHospitals, type AppointmentHospitalOption } from "@/lib/apifyHospitals";
import { buildAppointmentsHref } from "@/lib/appointmentLinks";
import {
  Search, MapPin, Star, ChevronDown, ChevronUp,
  Stethoscope, Clock, Phone, Globe, Calendar, Navigation,
  AlertCircle, Building2,
} from "lucide-react";

type Doctor = { id: string; name: string; specialty: string; department?: string };

const ACCENT = "#7c3aed";
const ACCENT_LIGHT = "#f5f3ff";
const ACCENT_BORDER = "#ddd6fe";

/** Default state for Apify hospital fetch when user taps “Load all”. */
const DEFAULT_HOSPITAL_STATE = "Maharashtra";

const card: React.CSSProperties = {
  background: "#fff",
  border: `1px solid #e5e7eb`,
  borderRadius: 12,
  padding: 20,
};
const inp: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

export default function HospitalFinderPage() {
  const [hospitals, setHospitals] = useState<AppointmentHospitalOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Record<string, Doctor[]>>({});
  const [loadingDoctors, setLoadingDoctors] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchHospitals(DEFAULT_HOSPITAL_STATE);
      setHospitals(rows);
      setLoaded(true);
    } catch {
      setError("Failed to load hospitals. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleNearby() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationLabel(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        setLocating(false);
        // Load hospitals and let user search/filter — Apify data is pre-fetched
        if (!loaded) await load();
      },
      () => {
        setError("Could not get your location. Please allow location access and try again.");
        setLocating(false);
      }
    );
  }

  async function loadDoctors(hospitalId: string) {
    if (doctors[hospitalId]) return; // cached
    setLoadingDoctors((prev) => ({ ...prev, [hospitalId]: true }));
    try {
      const res = await fetch(`/api/appointments/doctors?hospitalId=${encodeURIComponent(hospitalId)}`);
      const data = (await res.json()) as { doctors?: Doctor[] };
      setDoctors((prev) => ({ ...prev, [hospitalId]: Array.isArray(data.doctors) ? data.doctors : [] }));
    } catch {
      setDoctors((prev) => ({ ...prev, [hospitalId]: [] }));
    } finally {
      setLoadingDoctors((prev) => ({ ...prev, [hospitalId]: false }));
    }
  }

  function toggleHospital(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadDoctors(id);
    }
  }

  const filtered = hospitals.filter((h) => {
    const q = search.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      (h.city ?? "").toLowerCase().includes(q) ||
      (h.address ?? "").toLowerCase().includes(q) ||
      (h.speciality ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <Layout
      title="Hospital Finder - Sehat-Saathi"
      description="Find nearby hospitals and specialist doctors."
    >
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px" }}>

        {/* Back + header */}
        <Link href="/health" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
          ← Back to Health Tools
        </Link>

        <div style={{ margin: "12px 0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: ACCENT_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={22} color={ACCENT} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#1f2937" }}>Hospital Finder</h1>
              <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Search hospitals, explore doctors, and find contact details</p>
            </div>
          </div>
          <div style={{ padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 13, color: "#92400e" }}>
            <AlertCircle size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
            <strong>Informational only.</strong> Doctor listings are for reference. To book an appointment with a verified counsellor,{" "}
            <Link href="/appointments" style={{ color: "#1d4ed8", fontWeight: 700 }}>use our portal →</Link>
          </div>
        </div>

        {/* Search + Nearby controls */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by hospital name, city, or speciality…"
              style={{ ...inp, paddingLeft: 36 }}
            />
          </div>
          <button
            onClick={handleNearby}
            disabled={locating}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "10px 20px", background: locating ? "#e5e7eb" : ACCENT,
              color: locating ? "#9ca3af" : "#fff", border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 700, cursor: locating ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Navigation size={15} />
            {locating ? "Locating…" : "Find Nearby"}
          </button>
          {!loaded && !loading && (
            <button
              onClick={load}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", background: "#f3f4f6",
                color: "#374151", border: "1px solid #d1d5db", borderRadius: 8,
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              Load All Hospitals
            </button>
          )}
        </div>

        {locationLabel && (
          <div style={{ marginBottom: 14, fontSize: 13, color: "#059669", display: "flex", alignItems: "center", gap: 5 }}>
            <MapPin size={13} /> Showing results near your location ({locationLabel})
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ ...card, textAlign: "center", padding: "48px 0", color: "#6b7280" }}>
            <Building2 size={36} color="#d1d5db" style={{ marginBottom: 12 }} />
            <p style={{ margin: 0 }}>Loading hospitals… this may take a moment.</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {error}
            <button onClick={load} style={{ border: "none", background: "none", color: "#dc2626", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Retry</button>
          </div>
        )}

        {/* Empty prompt */}
        {!loaded && !loading && !error && (
          <div style={{ ...card, textAlign: "center", padding: "56px 0", color: "#9ca3af" }}>
            <MapPin size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
            <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#6b7280" }}>Find hospitals near you</p>
            <p style={{ margin: 0, fontSize: 13 }}>Click "Find Nearby" to use your location, or "Load All Hospitals" to browse.</p>
          </div>
        )}

        {/* Results count */}
        {loaded && !loading && (
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#9ca3af" }}>
            {filtered.length} hospital{filtered.length !== 1 ? "s" : ""} found
            {search ? ` for "${search}"` : ""}
          </p>
        )}

        {/* Hospital cards */}
        {filtered.map((h) => {
          const isOpen = expandedId === h.id;
          const hDoctors = doctors[h.id] ?? [];
          const isLoadingDoc = loadingDoctors[h.id] ?? false;

          return (
            <div
              key={h.id}
              style={{
                ...card,
                marginBottom: 12,
                borderColor: isOpen ? ACCENT_BORDER : "#e5e7eb",
                borderWidth: isOpen ? 2 : 1,
                transition: "border-color 0.15s",
              }}
            >
              {/* Hospital summary row */}
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }}
                onClick={() => toggleHospital(h.id)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 }}>{h.name}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                    <MapPin size={12} />
                    <span>{h.city || "—"}{h.address ? ` · ${h.address}` : ""}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {h.rating && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700, color: "#ca8a04", background: "#fefce8", padding: "2px 8px", borderRadius: 8 }}>
                        <Star size={11} /> {h.rating}
                      </span>
                    )}
                    {h.speciality && (
                      <span style={{ fontSize: 11, color: ACCENT, background: ACCENT_LIGHT, padding: "2px 8px", borderRadius: 8, fontWeight: 700 }}>
                        {h.speciality}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                  <Link
                    href={buildAppointmentsHref({
                      hospitalName: h.name,
                      city: h.city ?? "",
                    })}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "7px 14px", background: "#2563eb", color: "#fff",
                      borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: "none",
                    }}
                  >
                    <Calendar size={12} /> Book Appointment
                  </Link>
                  <div style={{ color: "#9ca3af" }}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* Expanded section */}
              {isOpen && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>

                  {/* Hospital quick info */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
                    <div style={{ padding: "10px 14px", background: "#f9fafb", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <Phone size={14} color="#6b7280" />
                      <div>
                        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Contact</div>
                        <div style={{ fontSize: 13, color: "#374151" }}>Call hospital directly</div>
                      </div>
                    </div>
                    <div style={{ padding: "10px 14px", background: "#f9fafb", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <Clock size={14} color="#6b7280" />
                      <div>
                        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Hours</div>
                        <div style={{ fontSize: 13, color: "#374151" }}>Check with hospital</div>
                      </div>
                    </div>
                    <div style={{ padding: "10px 14px", background: "#f9fafb", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <Globe size={14} color="#6b7280" />
                      <div>
                        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Walk-in</div>
                        <div style={{ fontSize: 13, color: "#374151" }}>Available anytime</div>
                      </div>
                    </div>
                  </div>

                  {/* Doctors section */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                      <Stethoscope size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                      Doctors & Specialists
                    </div>

                    {isLoadingDoc ? (
                      <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Loading doctor information…</p>
                    ) : hDoctors.length > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                        {hDoctors.map((d) => (
                          <div
                            key={d.id}
                            style={{
                              padding: "10px 12px",
                              background: ACCENT_LIGHT,
                              border: `1px solid ${ACCENT_BORDER}`,
                              borderRadius: 8,
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#1f2937" }}>{d.name}</div>
                            <div style={{ fontSize: 11, color: ACCENT, marginTop: 3, fontWeight: 600 }}>{d.specialty}</div>
                            {d.department && (
                              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{d.department}</div>
                            )}
                            <div style={{ marginTop: 8 }}>
                              <Link
                                href={buildAppointmentsHref({
                                  hospitalName: h.name,
                                  city: h.city ?? "",
                                  doctor: d.name,
                                  specialty: d.specialty,
                                })}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#1d4ed8",
                                  textDecoration: "none",
                                }}
                              >
                                <Calendar size={10} /> Portal booking (prefill)
                              </Link>
                            </div>
                            <div style={{ marginTop: 6, fontSize: 11, color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}>
                              <Clock size={10} /> Contact hospital for availability
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: "14px 16px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#6b7280" }}>
                        Doctor listing not available for this hospital. Visit directly or call ahead.
                      </div>
                    )}
                  </div>

                  {/* How to book CTA */}
                  <div style={{ padding: "12px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 13 }}>
                      <strong style={{ color: "#1d4ed8" }}>Want a confirmed online appointment?</strong>
                      <span style={{ color: "#6b7280", marginLeft: 6 }}>Book with our verified portal counsellors — available anytime.</span>
                    </div>
                    <Link
                      href={buildAppointmentsHref({
                        hospitalName: h.name,
                        city: h.city ?? "",
                      })}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "8px 18px", background: "#2563eb", color: "#fff",
                        borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Calendar size={13} /> Book Now
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {loaded && filtered.length === 0 && !loading && (
          <div style={{ ...card, textAlign: "center", color: "#9ca3af", padding: 40 }}>
            <Search size={32} color="#d1d5db" style={{ marginBottom: 10 }} />
            <p style={{ margin: 0 }}>No hospitals match &ldquo;{search}&rdquo;. Try a different search term.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
