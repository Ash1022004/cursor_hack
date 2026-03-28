"use client";

import React from "react";
import Link from "next/link";
import DoctorLayout from "@/components/doctor/DoctorLayout";
import { useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { useAuth } from "@/context/AuthContext";

type DoctorUpcomingAppointment = {
  id: Id<"appointments">;
  guestName: string | null;
  guestEmail: string | null;
  preferredDate: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  department: string | null;
};
import { Users, Calendar, AlertTriangle, CheckCircle, Clock, Stethoscope } from "lucide-react";

/* ── Doctor theme ─────────────────────── */
const ACCENT = "#059669";
const ACCENT_LIGHT = "#ecfdf5";
const ACCENT_BORDER = "#a7f3d0";

const statCard = (accent: string): React.CSSProperties => ({
  background: "#fff",
  border: `1px solid ${ACCENT_BORDER}`,
  borderLeft: `4px solid ${accent}`,
  borderRadius: 12,
  padding: "18px 20px",
  display: "flex",
  alignItems: "center",
  gap: 14,
});
const iconBox = (bg: string): React.CSSProperties => ({
  width: 44,
  height: 44,
  borderRadius: 10,
  background: bg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});
const sectionCard: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${ACCENT_BORDER}`,
  borderRadius: 12,
  padding: 20,
};
const actionBtn = (bg: string): React.CSSProperties => ({
  padding: "9px 20px",
  background: bg,
  color: "#fff",
  borderRadius: 8,
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 700,
});
const STATUS_META: Record<string, { color: string; bg: string }> = {
  pending:   { color: "#92400e", bg: "#fef3c7" },
  confirmed: { color: "#065f46", bg: "#d1fae5" },
  completed: { color: "#1e40af", bg: "#dbeafe" },
  cancelled: { color: "#991b1b", bg: "#fee2e2" },
};

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const overview = useQuery(
    api.doctorDashboard.getDoctorOverview,
    user?._id ? { counsellorId: user._id } : "skip"
  );

  return (
    <DoctorLayout title="Doctor Dashboard - Sehat-Saathi" description="Your clinical overview">
      <div style={{ display: "grid", gap: 24 }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Stethoscope size={22} color={ACCENT} />
          <div>
            <h1 style={{ margin: 0, fontSize: "1.4rem", color: "#064e3b" }}>
              Welcome, Dr.&nbsp;{user?.firstName || "Doctor"}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Your patient care overview</p>
          </div>
        </div>

        {!overview ? (
          <p style={{ color: "#6b7280" }}>Loading dashboard...</p>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <div style={statCard(ACCENT)}>
                <div style={iconBox(ACCENT_LIGHT)}><Users size={20} color={ACCENT} /></div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>My Patients</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#064e3b" }}>{overview.totalPatients}</div>
                </div>
              </div>

              <div style={statCard("#0891b2")}>
                <div style={iconBox("#ecfeff")}><Clock size={20} color="#0891b2" /></div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Pending Appointments</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#064e3b" }}>{overview.pendingAppointments}</div>
                </div>
              </div>

              <div style={statCard("#7c3aed")}>
                <div style={iconBox("#f5f3ff")}><CheckCircle size={20} color="#7c3aed" /></div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Completed</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#064e3b" }}>{overview.completedAppointments}</div>
                </div>
              </div>

              <div style={statCard("#dc2626")}>
                <div style={iconBox("#fef2f2")}><AlertTriangle size={20} color="#dc2626" /></div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Crisis Alerts</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: overview.crisisCount > 0 ? "#dc2626" : "#064e3b" }}>{overview.crisisCount}</div>
                </div>
              </div>
            </div>

            {/* Upcoming appointments */}
            <div style={sectionCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 14, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>
                  <Calendar size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                  Upcoming Appointments
                </h3>
                <Link href="/doctor/appointments" style={{ fontSize: 12, color: ACCENT, textDecoration: "none", fontWeight: 700 }}>
                  View All →
                </Link>
              </div>

              {overview.upcomingAppointments.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>No upcoming appointments.</p>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {overview.upcomingAppointments.map((a: DoctorUpcomingAppointment) => {
                    const sm = STATUS_META[a.status] ?? STATUS_META.pending;
                    return (
                      <div
                        key={a.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          background: ACCENT_LIGHT,
                          border: `1px solid ${ACCENT_BORDER}`,
                          borderRadius: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#064e3b" }}>{a.guestName || "Anonymous Patient"}</div>
                          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                            {a.department || "General"} &middot; {a.guestEmail || "No email"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#064e3b" }}>{a.preferredDate || "Date TBD"}</div>
                          <span style={{
                            display: "inline-block",
                            padding: "1px 8px",
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 700,
                            color: sm.color,
                            background: sm.bg,
                            textTransform: "capitalize",
                            marginTop: 2,
                          }}>
                            {a.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/doctor/patients" style={actionBtn(ACCENT)}>View My Patients</Link>
              <Link href="/doctor/appointments" style={actionBtn("#0891b2")}>Manage Appointments</Link>
            </div>
          </>
        )}
      </div>
    </DoctorLayout>
  );
}
