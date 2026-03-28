"use client";

import React from "react";
import Link from "next/link";
import DoctorLayout from "@/components/doctor/DoctorLayout";
import { useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";

type UpcomingAppointmentRow = {
  id: Id<"appointments">;
  guestName: string | null;
  guestEmail: string | null;
  preferredDate: string | null;
  status: string;
  department: string | null;
};
import { useAuth } from "@/context/AuthContext";
import { Users, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "20px 24px",
  display: "flex",
  alignItems: "center",
  gap: 16,
};
const iconBox = (bg: string): React.CSSProperties => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  background: bg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});
const statLabel: React.CSSProperties = { fontSize: 13, color: "#6b7280", marginBottom: 2 };
const statValue: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: "#111827" };

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const overview = useQuery(
    api.doctorDashboard.getDoctorOverview,
    user?._id ? { counsellorId: user._id } : "skip"
  );

  return (
    <DoctorLayout title="Doctor Dashboard - Sehat-Saathi" description="Doctor control panel">
      <div style={{ display: "grid", gap: 24 }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>
          Welcome, Dr. {user?.firstName || "Doctor"}
        </h1>

        {!overview ? (
          <p style={{ color: "#6b7280" }}>Loading dashboard...</p>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div style={cardStyle}>
                <div style={iconBox("#eff6ff")}>
                  <Users size={22} color="#2563eb" />
                </div>
                <div>
                  <div style={statLabel}>My Patients</div>
                  <div style={statValue}>{overview.totalPatients}</div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={iconBox("#fefce8")}>
                  <Clock size={22} color="#ca8a04" />
                </div>
                <div>
                  <div style={statLabel}>Pending</div>
                  <div style={statValue}>{overview.pendingAppointments}</div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={iconBox("#f0fdf4")}>
                  <CheckCircle size={22} color="#16a34a" />
                </div>
                <div>
                  <div style={statLabel}>Completed</div>
                  <div style={statValue}>{overview.completedAppointments}</div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={iconBox("#fef2f2")}>
                  <AlertTriangle size={22} color="#dc2626" />
                </div>
                <div>
                  <div style={statLabel}>Crisis Alerts</div>
                  <div style={statValue}>{overview.crisisCount}</div>
                </div>
              </div>
            </div>

            {/* Upcoming appointments */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Upcoming Appointments</h3>
                <Link href="/doctor/appointments" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                  View All
                </Link>
              </div>
              {overview.upcomingAppointments.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 14 }}>No upcoming appointments.</p>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {overview.upcomingAppointments.map((a: UpcomingAppointmentRow) => (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f9fafb", borderRadius: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{a.guestName || "Anonymous"}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{a.department || "—"} &middot; {a.guestEmail || "—"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.preferredDate || "TBD"}</div>
                        <span style={{
                          display: "inline-block",
                          padding: "1px 8px",
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 600,
                          color: a.status === "confirmed" ? "#2563eb" : "#ca8a04",
                          background: a.status === "confirmed" ? "#eff6ff" : "#fefce8",
                          textTransform: "capitalize",
                        }}>
                          {a.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div style={{ display: "flex", gap: 12 }}>
              <Link href="/doctor/patients" style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                View My Patients
              </Link>
              <Link href="/doctor/appointments" style={{ padding: "10px 20px", background: "#059669", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                Manage Appointments
              </Link>
            </div>
          </>
        )}
      </div>
    </DoctorLayout>
  );
}
