"use client";

import React from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { Users, MessageSquare, Calendar, AlertTriangle, TrendingUp, Shield } from "lucide-react";

type RecentSessionRow = {
  id: Id<"sessions">;
  patientId: Id<"patients">;
  startedAt: number;
  messageCount: number;
  dominantEmotion: string | null;
};

/* ── Admin theme ─────────────────────────── */
const ACCENT = "#1d4ed8";
const ACCENT_LIGHT = "#eff6ff";
const ACCENT_BORDER = "#bfdbfe";

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
const th: React.CSSProperties = {
  textAlign: "left",
  padding: "9px 12px",
  background: ACCENT_LIGHT,
  color: "#1e40af",
  fontWeight: 700,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const td: React.CSSProperties = { padding: "9px 12px", borderBottom: "1px solid #e0eaff", fontSize: 13 };
const actionBtn = (bg: string): React.CSSProperties => ({
  padding: "8px 18px",
  background: bg,
  color: "#fff",
  borderRadius: 8,
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 700,
});

const AdminDashboardPage: React.FC = () => {
  const overview = useQuery(api.adminAnalytics.getAdminOverview);

  return (
    <AdminLayout title="Admin Dashboard - Sehat-Saathi" description="System control panel">
      <div style={{ display: "grid", gap: 24 }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={22} color={ACCENT} />
          <div>
            <h1 style={{ margin: 0, fontSize: "1.4rem", color: "#1e3a5f" }}>System Overview</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Platform-wide analytics and management</p>
          </div>
        </div>

        {!overview ? (
          <p style={{ color: "#6b7280" }}>Loading analytics...</p>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
              <div style={statCard(ACCENT)}>
                <div style={iconBox(ACCENT_LIGHT)}><Users size={20} color={ACCENT} /></div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Registered Patients</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#1e3a5f" }}>{overview.totalPatients}</div>
                </div>
              </div>

              <div style={statCard("#7c3aed")}>
                <div style={iconBox("#f5f3ff")}><MessageSquare size={20} color="#7c3aed" /></div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Total AI Sessions</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#1e3a5f" }}>{overview.totalSessions}</div>
                </div>
              </div>

              <div style={statCard("#0891b2")}>
                <div style={iconBox("#ecfeff")}><Calendar size={20} color="#0891b2" /></div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Total Appointments</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#1e3a5f" }}>{overview.totalAppointments}</div>
                </div>
              </div>

              <div style={statCard("#dc2626")}>
                <div style={iconBox("#fef2f2")}><AlertTriangle size={20} color="#dc2626" /></div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Crisis Flags</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: overview.crisisCount > 0 ? "#dc2626" : "#1e3a5f" }}>{overview.crisisCount}</div>
                </div>
              </div>
            </div>

            {/* Appointment breakdown + Platform health */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={sectionCard}>
                <h3 style={{ margin: "0 0 14px", fontSize: 14, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>Appointment Status</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {(["pending", "confirmed", "completed", "cancelled"] as const).map((status) => {
                    const colors: Record<string, string> = { pending: "#ca8a04", confirmed: ACCENT, completed: "#16a34a", cancelled: "#dc2626" };
                    return (
                      <div key={status} style={{ textAlign: "center", padding: "10px 8px", background: ACCENT_LIGHT, borderRadius: 8, border: `1px solid ${ACCENT_BORDER}` }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: colors[status] }}>{overview.appointmentBreakdown[status]}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", textTransform: "capitalize", fontWeight: 600 }}>{status}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={sectionCard}>
                <h3 style={{ margin: "0 0 14px", fontSize: 14, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>Platform Health</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: ACCENT_LIGHT, borderRadius: 8 }}>
                    <TrendingUp size={18} color="#16a34a" />
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>Avg Mood Score</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>{overview.avgMood !== null ? `${overview.avgMood}/10` : "N/A"}</div>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>Based on last 100 mood log entries</p>
                </div>
              </div>
            </div>

            {/* Recent Sessions table */}
            <div style={sectionCard}>
              <h3 style={{ margin: "0 0 14px", fontSize: 14, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>Recent AI Sessions</h3>
              {overview.recentSessions.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 14 }}>No sessions yet.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={th}>Date</th>
                      <th style={th}>Message Count</th>
                      <th style={th}>Dominant Emotion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recentSessions.map((s: RecentSessionRow) => (
                      <tr key={s.id}>
                        <td style={td}>{new Date(s.startedAt).toLocaleDateString()}</td>
                        <td style={td}>{s.messageCount}</td>
                        <td style={{ ...td, textTransform: "capitalize" }}>{s.dominantEmotion || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Quick action links */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/admin/patients" style={actionBtn(ACCENT)}>View All Patients</Link>
              <Link href="/admin/appointments" style={actionBtn("#0891b2")}>Manage Appointments</Link>
              <Link href="/admin/counsellors" style={actionBtn("#7c3aed")}>Manage Counsellors</Link>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
