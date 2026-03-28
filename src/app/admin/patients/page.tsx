"use client";

import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { Search, AlertTriangle, UserCheck } from "lucide-react";

type AdminPatientRow = {
  _id: Id<"patients">;
  anonymousId: string;
  conditions: string[];
  medications: string[];
  triggers: string[];
  copingPatterns: string[];
  crisisFlag: boolean;
  totalSessions: number;
  lastSeen: number;
  lastMoodScore: number | null;
  lastEmotion: string | null;
  sessionCount: number;
};

const ACCENT = "#1d4ed8";
const ACCENT_LIGHT = "#eff6ff";
const ACCENT_BORDER = "#bfdbfe";

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
const chip = (color: string, bg: string): React.CSSProperties => ({
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 10,
  fontSize: 11,
  fontWeight: 700,
  color,
  background: bg,
  margin: "1px 2px",
});

export default function AdminPatientsPage() {
  const patients = useQuery(api.adminAnalytics.listAllPatients);
  const [search, setSearch] = useState("");

  const filtered = patients?.filter(
    (p: AdminPatientRow) =>
      p.anonymousId.toLowerCase().includes(search.toLowerCase()) ||
      p.conditions.some((c: string) => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout title="Patients - Admin" description="All registered patients">
      <div style={{ display: "grid", gap: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <UserCheck size={20} color={ACCENT} />
            <div>
              <h1 style={{ margin: 0, fontSize: "1.3rem", color: "#1e3a5f" }}>All Patients</h1>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                {filtered ? `${filtered.length} patient${filtered.length !== 1 ? "s" : ""}` : "Loading..."}
              </p>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              type="text"
              placeholder="Search by ID or condition..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "8px 12px 8px 34px",
                border: `1px solid ${ACCENT_BORDER}`,
                borderRadius: 8,
                fontSize: 13,
                width: 260,
                background: "#fff",
                outline: "none",
              }}
            />
          </div>
        </div>

        {!filtered ? (
          <p style={{ color: "#6b7280" }}>Loading patients...</p>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", background: "#fff", borderRadius: 12, border: `1px solid ${ACCENT_BORDER}` }}>
            <p style={{ color: "#9ca3af", margin: 0 }}>No patients found.</p>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${ACCENT_BORDER}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Patient ID</th>
                  <th style={th}>Conditions</th>
                  <th style={th}>Last Mood</th>
                  <th style={th}>Sessions</th>
                  <th style={th}>Crisis</th>
                  <th style={th}>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: AdminPatientRow) => (
                  <tr key={p._id} style={{ transition: "background 0.1s" }}>
                    <td style={td}>
                      <code style={{ fontSize: 12, background: ACCENT_LIGHT, padding: "2px 6px", borderRadius: 4, color: ACCENT }}>
                        {p.anonymousId.slice(0, 14)}…
                      </code>
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        {p.conditions.slice(0, 3).map((c, i) => (
                          <span key={i} style={chip("#3730a3", "#e0e7ff")}>{c}</span>
                        ))}
                        {p.conditions.length > 3 && (
                          <span style={{ fontSize: 11, color: "#9ca3af", padding: "2px 4px" }}>+{p.conditions.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td style={td}>
                      {p.lastMoodScore !== null ? (
                        <span>
                          <strong>{p.lastMoodScore}/10</strong>
                          {p.lastEmotion && <span style={{ color: "#6b7280", marginLeft: 4 }}>({p.lastEmotion})</span>}
                        </span>
                      ) : (
                        <span style={{ color: "#d1d5db" }}>—</span>
                      )}
                    </td>
                    <td style={td}>
                      <span style={{ fontWeight: 700, color: ACCENT }}>{p.sessionCount}</span>
                    </td>
                    <td style={td}>
                      {p.crisisFlag ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#dc2626", fontWeight: 700, fontSize: 12 }}>
                          <AlertTriangle size={13} /> ALERT
                        </span>
                      ) : (
                        <span style={{ color: "#16a34a", fontSize: 12, fontWeight: 600 }}>Clear</span>
                      )}
                    </td>
                    <td style={{ ...td, color: "#6b7280" }}>
                      {new Date(p.lastSeen).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
