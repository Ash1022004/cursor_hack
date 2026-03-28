"use client";

import React from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { Users, MessageSquare, Calendar, AlertTriangle, TrendingUp } from "lucide-react";

type RecentSessionRow = {
  id: Id<"sessions">;
  patientId: Id<"patients">;
  startedAt: number;
  messageCount: number;
  dominantEmotion: string | null;
};

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

const AdminDashboardPage: React.FC = () => {
  const overview = useQuery(api.adminAnalytics.getAdminOverview);

  return (
    <AdminLayout title="Admin Dashboard - Sehat-Saathi" description="Admin control panel">
      <div style={{ display: "grid", gap: 24 }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Admin Dashboard</h1>

        {!overview ? (
          <p style={{ color: "#6b7280" }}>Loading analytics...</p>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div style={cardStyle}>
                <div style={iconBox("#eff6ff")}>
                  <Users size={22} color="#2563eb" />
                </div>
                <div>
                  <div style={statLabel}>Total Patients</div>
                  <div style={statValue}>{overview.totalPatients}</div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={iconBox("#f0fdf4")}>
                  <MessageSquare size={22} color="#16a34a" />
                </div>
                <div>
                  <div style={statLabel}>Total Sessions</div>
                  <div style={statValue}>{overview.totalSessions}</div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={iconBox("#fefce8")}>
                  <Calendar size={22} color="#ca8a04" />
                </div>
                <div>
                  <div style={statLabel}>Appointments</div>
                  <div style={statValue}>{overview.totalAppointments}</div>
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

            {/* Appointment breakdown + Avg Mood */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ ...cardStyle, flexDirection: "column", alignItems: "flex-start" }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Appointment Status</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", marginTop: 12 }}>
                  {(["pending", "confirmed", "completed", "cancelled"] as const).map((status) => (
                    <div key={status} style={{ textAlign: "center", padding: 8, background: "#f9fafb", borderRadius: 8 }}>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{overview.appointmentBreakdown[status]}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", textTransform: "capitalize" }}>{status}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...cardStyle, flexDirection: "column", alignItems: "flex-start" }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Platform Health</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                  <TrendingUp size={20} color="#059669" />
                  <span style={{ fontSize: 14 }}>
                    Average Mood Score: <strong>{overview.avgMood !== null ? `${overview.avgMood}/10` : "N/A"}</strong>
                  </span>
                </div>
                <div style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
                  Based on last 100 mood log entries
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Recent Sessions</h3>
              </div>
              {overview.recentSessions.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 14 }}>No sessions yet.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: 600 }}>Date</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: 600 }}>Messages</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: 600 }}>Emotion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recentSessions.map((s: RecentSessionRow) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "8px 12px" }}>{new Date(s.startedAt).toLocaleDateString()}</td>
                        <td style={{ padding: "8px 12px" }}>{s.messageCount}</td>
                        <td style={{ padding: "8px 12px", textTransform: "capitalize" }}>{s.dominantEmotion || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Quick links */}
            <div style={{ display: "flex", gap: 12 }}>
              <Link href="/admin/patients" style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                View All Patients
              </Link>
              <Link href="/admin/appointments" style={{ padding: "10px 20px", background: "#059669", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                Manage Appointments
              </Link>
              <Link href="/admin/counsellors" style={{ padding: "10px 20px", background: "#7c3aed", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                Manage Counsellors
              </Link>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
